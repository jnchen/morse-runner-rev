import type { StationEvent, StationMessage, StationState } from '../types';
import { MorseKeyer } from './morse-keyer';
import { Qsb } from './qsb';
import type { ContestEngine } from './contest';


export const NEVER = Number.MAX_SAFE_INTEGER;

export interface StationContext {
  keyer: MorseKeyer;
  blockSize: number;
  sampleRate: number;
  qsbEnabled: boolean;
  flutterEnabled: boolean;
  lidsEnabled: boolean;
  runMode: string;
  minute: () => number;
  myWpm: number;
  myCall: string;
  selfMonVolume: number;
  engine: ContestEngine;
}

export abstract class Station {
  id = crypto.randomUUID();
  amplitude = 0;
  wpm = 30;
  envelope: Float32Array | null = null;
  sendPos = 0;
  state: StationState = 'listening';
  timeout = NEVER;
  nrWithError = false;
  exch1 = '';
  exch2 = '';
  nr = 1;
  rst = 599;
  myCall = '';
  hisCall = '';
  messages = new Set<StationMessage>();
  msgText = '';
  pitch = 0;
  private phase = 0;
  private phaseIncrement = 0;
  private qsb: Qsb | null = null;
  protected ctx: StationContext;

  protected constructor(ctx: StationContext, public engine: ContestEngine) {
    this.ctx = ctx;
  }

  setPitch(value: number) {
    this.pitch = value;
    this.phaseIncrement = (2 * Math.PI * value) / this.ctx.sampleRate;
  }

  getBlock(): Float32Array {
    const src = this.envelope!;
    const remaining = Math.min(this.ctx.blockSize, src.length - this.sendPos);
    const out = new Float32Array(this.ctx.blockSize);
    out.set(src.subarray(this.sendPos, this.sendPos + remaining));
    if (this.ctx.qsbEnabled && this.qsb) this.qsb.apply(out);
    this.sendPos += this.ctx.blockSize;
    if (this.sendPos >= src.length) this.envelope = null;
    return out;
  }

  protected modulateInto(outRe: Float32Array, outIm: Float32Array) {
    const block = this.getBlock();
    let phase = this.phase;
    for (let i = 0; i < block.length; i++) {
      const a = block[i] * this.amplitude;
      outRe[i] += a * Math.cos(phase);
      outIm[i] += -a * Math.sin(phase);
      phase += this.phaseIncrement;
    }
    this.phase = phase % (2 * Math.PI);
  }

  tick() {
    if (this.state === 'sending' && !this.envelope) {
      this.msgText = '';
      this.state = 'listening';
      this.processEvent('msgSent');
    } else if (this.state !== 'sending') {
      if (this.timeout > 0) this.timeout--;
      if (this.timeout === 0) this.processEvent('timeout');
    }
  }

  protected makeQsb() {
    let bandwidth = 0.1 + Math.random() / 2;
    if (this.ctx.flutterEnabled && Math.random() < 0.3) bandwidth = 3 + Math.random() * 30;
    this.qsb = new Qsb(bandwidth, this.ctx.sampleRate, this.ctx.blockSize);
  }

  protected nrAsText(): string {
    let result = `${Math.floor(this.rst / 100)}${String(this.rst % 100).padStart(3, '0')}`;
    if (this.nrWithError) {
      let idx = result.length - 1;
      if (!/[2-7]/.test(result[idx])) idx--;
      if (idx >= 0 && /[2-7]/.test(result[idx])) {
        const digit = Number(result[idx]);
        result = result.slice(0, idx) + (Math.random() < 0.5 ? digit - 1 : digit + 1) + result.slice(idx + 1);
        result += ` EEEEE ${String(this.nr).padStart(3, '0')}`;
      }
      this.nrWithError = false;
    }
    result = result.replace(/599/g, '5NN');
    if (this.ctx.runMode !== 'hst') {
      result = result.replace(/000/g, 'TTT').replace(/00/g, 'TT');
      if (Math.random() < 0.4) result = result.replace(/0/g, 'O');
      else if (Math.random() < 0.97) result = result.replace(/0/g, 'T');
      if (Math.random() < 0.97) result = result.replace(/9/g, 'N');
    }
    return result;
  }

  send(message: StationMessage) {
    if (!this.envelope) this.messages.clear();
    if (message === 'none') {
      this.state = 'listening';
      return;
    }
    this.messages.add(message);
    const texts: Record<StationMessage, string> = {
      none: '', cq: 'CQ <my> TEST', nr: '<exch1> <exch2>', tu: 'TU', myCall: '<my>', hisCall: '<his>',
      b4: 'QSO B4', qm: '?', nil: 'NIL', garbage: '', rNr: 'R <exch1> <exch2>', rNr2: 'R <exch1> <exch2> <exch1> <exch2>',
      deMyCall1: 'DE <my>', deMyCall2: 'DE <my> <my>', deMyCallNr1: 'DE <my> <exch1> <exch2>',
      deMyCallNr2: 'DE <my> <my> <exch1> <exch2>', nrQm: 'NR?', longCq: 'CQ CQ TEST <my> <my> TEST',
      myCallNr2: '<my> <my> <exch1> <exch2>', qrl: 'QRL?', qrl2: 'QRL? QRL?', qsy: '<his> QSY QSY', agn: 'AGN',
    };
    this.sendText(texts[message]);
  }

  sendText(text: string) {
    let s = text.replace(/<#>/g, this.nrAsText()).replace(/<exch1>/g, this.exch1 || '599').replace(/<exch2>/g, this.exch2 || String(this.nr)).replace(/<my>/g, this.myCall).replace(/<his>/g, this.hisCall);
    this.msgText = this.msgText ? `${this.msgText} ${s}` : s;
    const keyer = this.ctx.keyer;
    const oldWpm = keyer.wpm;
    keyer.wpm = this.wpm;
    const env = keyer.textEnvelope(s, this.ctx.blockSize);
    keyer.wpm = oldWpm;
    this.appendEnvelope(env);
    this.state = 'sending';
    this.timeout = NEVER;
  }

  protected appendEnvelope(env: Float32Array) {
    if (!this.envelope) {
      this.envelope = env;
      this.sendPos = 0;
      return;
    }
    const joined = new Float32Array(this.envelope.length + env.length);
    joined.set(this.envelope);
    joined.set(env, this.envelope.length);
    this.envelope = joined;
  }

  abstract processEvent(event: StationEvent): void;
  abstract addToMix(re: Float32Array, im: Float32Array): void;
}







