import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContestEngine, type ContestEvents } from '../src/engine/contest';
import type { DxStation } from '../src/engine/stations';
import { DEFAULT_SETTINGS, type UserSettings } from '../src/types';

function settings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    call: 'W1AW', name: 'Test', wpm: 35, pitch: 600, bandwidth: 500,
    qsk: true, rit: 0, activity: 1, qrn: false, qrm: false, qsb: false,
    flutter: false, lids: false, duration: 30, compDuration: 60,
    selfMonVolume: 0.75, language: 'en', ...overrides,
  };
}

function makeEngine(overrides: Partial<UserSettings> = {}) {
  const events: ContestEvents = { stateChanged: () => {}, qsoCompleted: () => {}, finished: () => {} };
  return new ContestEngine(settings(overrides), events);
}

const tick = (e: ContestEngine, blockCount = 1) => {
  for (let i = 0; i < blockCount; i++) e.getAudio();
};
const blocks = (seconds: number) => Math.ceil(seconds * 11025 / 512);
const waitIdle = (e: ContestEngine, maxBlocks = blocks(30)) => {
  for (let i = 0; i < maxBlocks && (e.me.state === 'sending' || e.stations.some(s => s.state === 'sending')); i++) tick(e, 1);
};

function stabilize(e: ContestEngine, dx: DxStation) {
  dx.oper.getSendDelay = () => e.secondsToBlocks(0.01);
  dx.oper.getReplyTimeout = () => e.secondsToBlocks(0.2);
  dx.oper.getReply = () => 'rNr';
}

describe('ContestEngine complete QSO', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('completes a deterministic single-mode exchange with a correct log entry', () => {
    const e = makeEngine();
    vi.spyOn(Math, 'random').mockImplementation(() => 0);
    e.start('single');
    // The first five blocks are the original warm-up silence; callers appear on block 6.
    tick(e, 6);

    expect(e.dxCount).toBe(1);
    const dx = e.stations.find((s): s is DxStation => 'oper' in s)!;
    expect(dx.oper.state).toBe('needQso');
    stabilize(e, dx);
    dx.wpm = e.settings.wpm;
    dx.nr = 123;
    dx.rst = 599;
    dx.exch1 = '599';
    dx.exch2 = String(dx.nr);
    e.me.hisCall = dx.myCall;

    e.send('hisCall');
    waitIdle(e);
    expect(dx.oper.state).toBe('needNr');

    e.send('nr');
    waitIdle(e);
    expect(dx.oper.state).toBe('needEnd');

    e.send('tu');
    waitIdle(e);
    expect(dx.oper.state).toBe('done');

    const qso = e.saveQso(dx.myCall, 599, 123);
    expect(qso?.err).toBe('   ');
    expect(e.logs).toHaveLength(1);
    expect(e.logs[0]).toMatchObject({ call: dx.myCall, trueCall: dx.myCall, trueNr: 123, trueRst: 599 });
    expect(e.stations).not.toContain(dx);
  });

  it('creates pile-up callers after CQ and completes the selected station', () => {
    const e = makeEngine({ activity: 4 });
    vi.spyOn(Math, 'random').mockImplementation(() => 0.49);
    e.start('pileup');
    e.send('cq');
    for (let i = 0; i < blocks(15) && e.dxCount === 0; i++) tick(e, 1);

    expect(e.dxCount).toBeGreaterThan(0);
    const dx = e.stations.find((s): s is DxStation => 'oper' in s)!;
    expect(dx.oper.state).toBe('needQso');
    stabilize(e, dx);
    dx.nr = 77;
    dx.exch1 = '599';
    dx.exch2 = String(dx.nr);
    e.me.hisCall = dx.myCall;

    e.send('hisCall');
    waitIdle(e);
    expect(dx.oper.state).toBe('needNr');

    // Force the deterministic 90% NR-received branch.
    vi.mocked(Math.random).mockImplementation(() => 0);
    e.send('nr');
    waitIdle(e);
    expect(dx.oper.state).toBe('needEnd');

    e.send('tu');
    waitIdle(e);
    expect(dx.oper.state).toBe('done');

    const qso = e.saveQso(dx.myCall, 599, 77);
    expect(qso?.err).toBe('   ');
  });

  it('backfills a QSO saved immediately after TU starts', () => {
    const e = makeEngine();
    vi.spyOn(Math, 'random').mockImplementation(() => 0);
    e.start('single');
    tick(e, 6);

    const dx = e.stations.find((s): s is DxStation => 'oper' in s)!;
    stabilize(e, dx);
    dx.nr = 321;
    dx.rst = 599;
    dx.exch1 = '599';
    dx.exch2 = String(dx.nr);
    e.me.hisCall = dx.myCall;

    e.send('hisCall');
    waitIdle(e);
    expect(dx.oper.state).toBe('needNr');
    e.send('nr');
    waitIdle(e);
    expect(dx.oper.state).toBe('needEnd');

    // This is the original MorseRunner hot-key behavior: log while TU is still on air.
    e.send('tu');
    const qso = e.saveQso(dx.myCall, 599, 321);
    expect(qso?.err).toBe('NIL');
    waitIdle(e);
    expect(qso?.err).toBe('   ');
    expect(e.stations).not.toContain(dx);
  });
});
