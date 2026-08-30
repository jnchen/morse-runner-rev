import type { Qso, RunMode, StationMessage, UserSettings } from '../types';
import { MorseKeyer } from './morse-keyer';
import { rndPoisson } from './random';
import { MyStation } from './my-station';
import { DxStation, QrmStation, QrnStation } from './stations';
import type { Station, StationContext } from './station';
import { QuickAverage } from './qsb';
import { CallList } from './call-list';
import { CallHistory } from './call-history';
import { CONTESTS, type ContestId, type ExchangeField } from './contest-defs';

export interface ContestEvents {
  stateChanged: () => void;
  qsoCompleted: (qso: Qso) => void;
  finished: () => void;
}

export type LogEntry = Qso;

export interface SaveQsoInput {
  call: string;
  exch1?: string;
  exch2?: string;
}

export interface ContestStats {
  points: number;
  multipliers: number;
  score: number;
}

const VERIFIED = '   ';

export class ContestEngine {
  readonly sampleRate = 11025;
  readonly blockSize = 512;
  private keyer: MorseKeyer;
  private ctx: StationContext;
  private runtime: UserSettings;
  stations: Station[] = [];
  me: MyStation;
  blockNumber = 0;
  stopPressed = false;
  qsoList: Qso[] = [];
  logs: LogEntry[] = [];
  runMode: RunMode = 'stop';
  callList = new CallList();
  callHistory = new CallHistory();
  get contestDefinition() { return CONTESTS[this.runtime.contest]; }
  private filterA!: QuickAverage;
  private filterB!: QuickAverage;
  private useFilterA = true;

  constructor(settings: UserSettings, private events: ContestEvents) {
    this.runtime = settings;
    this.keyer = new MorseKeyer(this.sampleRate, settings.wpm);
    this.ctx = this.makeContext();
    this.me = new MyStation(this.ctx, this);
    this.me.init(this.myExchange());
    this.initFilters();
  }

  private makeContext(): StationContext {
    return {
      keyer: this.keyer,
      blockSize: this.blockSize,
      sampleRate: this.sampleRate,
      qsbEnabled: this.runtime.qsb,
      flutterEnabled: this.runtime.flutter,
      lidsEnabled: this.runtime.lids,
      runMode: this.runMode,
      minute: () => this.minute,
      myWpm: this.runtime.wpm,
      myCall: this.runtime.call,
      selfMonVolume: this.runtime.selfMonVolume,
      engine: this,
    };
  }

  private initFilters() {
    const points = Math.max(1, Math.round((0.7 * this.sampleRate) / this.runtime.bandwidth));
    this.filterA = new QuickAverage(points, 3);
    this.filterB = new QuickAverage(points, 3);
  }

  updateSettings(settings: UserSettings) {
    this.runtime = settings;
    this.keyer.wpm = settings.wpm;
    this.ctx = this.makeContext();
    (this.me as unknown as { ctx: StationContext }).ctx = this.ctx;
    this.me.init(this.myExchange());
    this.initFilters();
  }

  get settings() { return this.runtime; }
  get seconds() { return this.blockNumber * this.blockSize / this.sampleRate; }
  get minute() { return this.seconds / 60; }
  secondsToBlocks(sec: number) { return Math.round((this.sampleRate / this.blockSize) * sec); }

  private settingsForMode(settings: UserSettings, mode: RunMode): UserSettings {
    if (mode === 'wpx') return { ...settings, qrn: true, qrm: true, qsb: true, flutter: true, lids: true, duration: settings.compDuration };
    if (mode === 'hst') return { ...settings, qrn: false, qrm: false, qsb: false, flutter: false, lids: false, activity: 4, bandwidth: 600, duration: settings.compDuration };
    return settings;
  }

  start(mode: RunMode) {
    this.runMode = mode;
    this.runtime = this.settingsForMode(this.runtime, mode);
    this.ctx = this.makeContext();
    (this.me as unknown as { ctx: StationContext }).ctx = this.ctx;
    this.stations = [];
    this.qsoList = [];
    this.logs = [];
    this.blockNumber = 0;
    this.stopPressed = false;
    this.filterA.reset();
    this.filterB.reset();
    this.me.init(this.myExchange());
    this.events.stateChanged();
  }

  stop() {
    this.runMode = 'stop';
    this.ctx = this.makeContext();
    (this.me as unknown as { ctx: StationContext }).ctx = this.ctx;
    this.stations = [];
    this.me.abort();
    this.events.stateChanged();
  }

  removeStation(station: Station) {
    this.stations = this.stations.filter((s) => s !== station);
  }

  /**
   * A NIL is usually a one or two character callsign miscopy, not a missing
   * station. Keep the completed station attached to the log entry so the review
   * UI can show and replay what was actually sent.
   */
  private findCompletedStation(copiedCall: string): DxStation | null {
    const normalizeCall = (value: string) => value.replace(/\?/g, '').trim().toUpperCase();
    const wanted = normalizeCall(copiedCall);
    const candidates = this.stations.filter((station): station is DxStation =>
      station instanceof DxStation && station.oper.state === 'done');

    let best: DxStation | null = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    for (const station of candidates) {
      const distance = callsignEditDistance(wanted, normalizeCall(station.myCall));
      if (distance < bestDistance) {
        best = station;
        bestDistance = distance;
      }
    }

    const tolerance = Math.max(1, Math.floor(wanted.length / 4));
    return bestDistance <= tolerance ? best : null;
  }

  private attachActual(qso: Qso, station: DxStation) {
    qso.trueCall = station.myCall;
    qso.trueRst = station.rst;
    qso.trueNr = station.nr;
    qso.trueExch1 = station.exch1;
    qso.trueExch2 = station.exch2;
    this.removeStation(station);
  }

  addCaller() {
    const record = this.callHistory.pick();
    const st = new DxStation(this.ctx, this, () => this.callList.pick(this.runMode === 'hst'), record);
    this.stations.push(st);
    return st;
  }

  addQrn() { this.stations.push(new QrnStation(this.ctx, this)); }
  addQrm() { this.stations.push(new QrmStation(this.ctx, this, () => this.callList.pick(false))); }

  getAudio(): Float32Array {
    this.blockNumber++;
    if (this.blockNumber < 6) return new Float32Array(this.blockSize);

    const re = new Float32Array(this.blockSize);
    const im = new Float32Array(this.blockSize);
    const noiseAmp = 6000;
    for (let i = 0; i < this.blockSize; i++) {
      re[i] = 3 * noiseAmp * (Math.random() - 0.5);
      im[i] = 3 * noiseAmp * (Math.random() - 0.5);
    }
    if (this.runtime.qrn) {
      for (let i = 0; i < this.blockSize; i++) if (Math.random() < 0.01) re[i] = 60 * noiseAmp * (Math.random() - 0.5);
      if (Math.random() < 0.01) this.addQrn();
    }
    if (this.runtime.qrm && Math.random() < 0.0002) this.addQrm();

    for (const station of this.stations) station.addToMix(re, im);
    this.me.addToMix(re, im);

    const filter = this.useFilterA ? this.filterA : this.filterB;
    for (let i = 0; i < this.blockSize; i++) {
      const x = filter.filter(re[i], im[i]);
      re[i] = x.re;
      im[i] = x.im;
    }
    if (this.blockNumber % 10 === 0) {
      (this.useFilterA ? this.filterB : this.filterA).reset();
      this.useFilterA = !this.useFilterA;
    }

    const out = new Float32Array(this.blockSize);
    const gain = 500 / this.runtime.bandwidth;
    let phase = 0;
    const inc = 2 * Math.PI * this.runtime.pitch / this.sampleRate;
    for (let i = 0; i < this.blockSize; i++) {
      const raw = (re[i] * Math.cos(phase) - im[i] * Math.sin(phase)) * gain * 0.00003;
      out[i] = Math.tanh(raw);
      phase = (phase + inc) % (2 * Math.PI);
    }

    this.me.tick();
    for (const station of [...this.stations]) station.tick();

    // Reproduce deferred QSO verification: a station can finish after the operator logs it.
    const last = this.qsoList[this.qsoList.length - 1];
    if (last && !last.trueCall) {
      const finished = this.findCompletedStation(last.call);
      if (finished) {
        this.attachActual(last, finished);
        last.err = this.qsoError(last);
        this.events.stateChanged();
      }
    }

    const timedOut = this.seconds >= this.runtime.duration * 60;
    if (timedOut || this.stopPressed) {
      this.stopPressed = false;
      this.stop();
      this.events.finished();
      return out;
    }

    if (this.runMode === 'single' && this.dxCount === 0) {
      this.me.messages = new Set(['cq']);
      this.addCaller().processEvent('meFinished');
    } else if (this.runMode === 'hst' && this.dxCount < this.runtime.activity) {
      this.me.messages = new Set(['cq']);
      while (this.dxCount < this.runtime.activity) this.addCaller().processEvent('meFinished');
    }

    // Update the visible clock about once per second.
    if (this.blockNumber % Math.round(this.sampleRate / this.blockSize) === 0) this.events.stateChanged();
    return out;
  }

  get dxCount() {
    return this.stations.filter((s): s is DxStation =>
      s instanceof DxStation && s.oper.state !== 'done' && s.oper.state !== 'failed').length;
  }

  onMeStartedSending() {
    for (const station of [...this.stations]) station.processEvent('meStarted');
  }

  onMeFinishedSending() {
    if (!['single', 'hst'].includes(this.runMode)) {
      if (this.me.messages.has('cq') || (this.me.messages.has('tu') && this.me.messages.has('myCall'))) {
        for (let i = 0; i < rndPoisson(this.runtime.activity / 2); i++) this.addCaller();
      }
    }
    for (const station of [...this.stations]) station.processEvent('meFinished');
    this.events.stateChanged();
  }

  send(message: StationMessage | string) {
    const namedMessages = new Set([
      'none', 'cq', 'nr', 'tu', 'myCall', 'hisCall', 'b4', 'qm', 'nil',
      'garbage', 'rNr', 'rNr2', 'deMyCall1', 'deMyCall2', 'deMyCallNr1',
      'deMyCallNr2', 'nrQm', 'longCq', 'myCallNr2', 'qrl', 'qrl2', 'qsy', 'agn',
    ]);
    if (typeof message === 'string' && namedMessages.has(message)) {
      this.me.send(message as StationMessage);
    } else if (typeof message === 'string') {
      this.me.sendText(message);
    } else {
      this.me.send(message);
    }
  }

  myExchange(): { exch1: string; exch2: string } {
    const fields = this.contestDefinition.fields;
    const pick = (key: 'exch1' | 'exch2', fallback = '') =>
      fields.find((field) => field.key === key)?.default ?? fallback;
    return {
      exch1: this.runtime.exchange1 || pick('exch1', '599'),
      exch2: fields.some((field) => field.key === 'exch2' && field.type === 'serial')
        ? String(this.me.nr)
        : this.runtime.exchange2 || pick('exch2'),
    };
  }

  saveQso(input: SaveQsoInput): LogEntry | null;
  saveQso(call: string, rst: number, nr: number): LogEntry | null;
  saveQso(callOrInput: string | SaveQsoInput, legacyRst?: number, legacyNr?: number): LogEntry | null {
    const input: SaveQsoInput = typeof callOrInput === 'string'
      ? { call: callOrInput, exch1: String(legacyRst ?? ''), exch2: String(legacyNr ?? '') }
      : callOrInput;
    const cleanCall = input.call.replace(/\?/g, '').toUpperCase();
    if (cleanCall.length < 3) return null;

    const fields = this.contestDefinition.fields;
    const field1 = fields.find((field) => field.key === 'exch1');
    const field2 = fields.find((field) => field.key === 'exch2');
    const exch1 = this.normalizeExchange(input.exch1 ?? '', field1);
    const exch2 = this.normalizeExchange(input.exch2 ?? '', field2);
    if (!exch1 && field1) return null;
    if (!exch2 && field2) return null;

    const rst = this.numericExchange(exch1, field1?.type === 'rst' ? field1 : undefined);
    const nr = this.numericExchange(exch2, field2?.type === 'serial' ? field2 : undefined);
    const qso: Qso = {
      time: this.seconds,
      call: cleanCall,
      rst,
      nr,
      exch1,
      exch2,
      trueCall: '',
      trueRst: 0,
      trueNr: 0,
      trueExch1: '',
      trueExch2: '',
      pfx: this.runMode === 'hst' ? String(callScore(cleanCall)) : extractPrefix(cleanCall),
      dupe: false,
      err: 'NIL',
    };
    qso.dupe = this.qsoList.some((q) => q.call === qso.call && q.err === VERIFIED);
    const station = this.findCompletedStation(qso.call);
    if (station) this.attachActual(qso, station);
    qso.err = !qso.trueCall ? 'NIL' : this.qsoError(qso);
    this.qsoList.push(qso);
    this.logs.push(qso);
    this.me.nr++;
    if (field2?.type === 'serial') this.me.exch2 = String(this.me.nr);
    this.events.qsoCompleted(qso);
    return qso;
  }

  private qsoError(qso: Qso): string {
    if (!qso.trueCall) return 'NIL';
    if (qso.call.replace(/\?/g, '').toUpperCase() !== qso.trueCall.replace(/\?/g, '').toUpperCase()) return 'NIL';
    if (qso.dupe) return 'DUP';
    for (const field of this.contestDefinition.fields) {
      const actual = field.key === 'exch1' ? qso.trueExch1 : qso.trueExch2;
      const entered = field.key === 'exch1' ? qso.exch1 : qso.exch2;
      if (this.normalizeExchange(actual, field) !== this.normalizeExchange(entered, field)) {
        if (field.type === 'rst') return 'RST';
        if (field.type === 'serial') return 'NR ';
        return field.key === 'exch1' ? 'EX1' : 'EX2';
      }
    }
    return VERIFIED;
  }

  private normalizeExchange(value: string, field: ExchangeField | undefined): string {
    const result = value.trim().toUpperCase();
    if (!field || !result) return result;
    if (field.type === 'rst') {
      if (/^5N[NT]?$/.test(result)) return '599';
      if (/^5NN$/.test(result)) return '599';
      const numeric = Number(result);
      return Number.isFinite(numeric) && result.length <= 3 ? String(numeric) : result;
    }
    if (['serial', 'number', 'zone'].includes(field.type)) {
      const numeric = Number(result);
      return Number.isFinite(numeric) ? String(numeric) : result;
    }
    return result.replace(/\s+/g, ' ');
  }

  private numericExchange(value: string, field: ExchangeField | undefined): number {
    if (!field) return 0;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
}

function callsignEditDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, index) => [index, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return matrix[a.length][b.length];
}

export function contestStats(qsos: Qso[], contestId: ContestId, runMode: RunMode): ContestStats {
  const valid = qsos.filter((q) => q.err === VERIFIED);
  if (runMode === 'hst') {
    const score = valid.reduce((sum, q) => sum + Number(q.pfx || 0), 0);
    return { points: valid.length, multipliers: 1, score };
  }
  if (contestId === 'wpx') {
    const multipliers = new Set(valid.map((q) => q.pfx)).size;
    return { points: valid.length, multipliers, score: valid.length * multipliers };
  }
  if (contestId === 'cqww') {
    const multipliers = new Set(valid.map((q) => q.exch2).filter(Boolean)).size;
    return { points: valid.length, multipliers, score: valid.length * multipliers };
  }
  return { points: valid.length, multipliers: 1, score: valid.length };
}

export function extractPrefix(call: string): string {
  const raw = call.replace(/\/(QRP|MM|M|P)(\/|$)/gi, '').replace(/\/\//g, '/');
  if (raw.length < 2) return '';
  const parts = raw.split('/');
  let selected = raw;
  let digitOverride = '';
  if (parts.length > 1) {
    const a = parts[0], b = parts[1];
    if (a.length === 1 && /\d/.test(a)) { digitOverride = a; selected = b; }
    else if (b.length === 1 && /\d/.test(b)) { digitOverride = b; selected = a; }
    else selected = a.length <= b.length ? a : b;
  }
  if (selected.includes('/') || selected.length < 2) return '';
  selected = selected.replace(/[A-Z]+$/, (m) => (selected.length - m.length >= 2 ? '' : m));
  if (!/\d$/.test(selected)) selected += '0';
  if (digitOverride) selected = selected.slice(0, -1) + digitOverride;
  return selected.slice(0, 5);
}

export function callScore(call: string, keyer = new MorseKeyer(11025)): number {
  let score = -1;
  for (const ch of keyer.encode(call)) {
    if (ch === '.') score += 2;
    else if (ch === '-') score += 4;
    else if (ch === ' ') score += 2;
  }
  return Math.max(0, score);
}


