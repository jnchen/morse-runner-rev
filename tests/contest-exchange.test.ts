import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContestEngine, contestStats, type ContestEvents } from '../src/engine/contest';
import { CONTESTS } from '../src/engine/contest-defs';
import { DEFAULT_SETTINGS, type Qso, type UserSettings } from '../src/types';

const events: ContestEvents = { stateChanged: () => {}, qsoCompleted: () => {}, finished: () => {} };

function settings(contest: keyof typeof CONTESTS): UserSettings {
  const definition = CONTESTS[contest];
  return {
    ...DEFAULT_SETTINGS,
    contest,
    exchange1: definition.fields[0]?.default || DEFAULT_SETTINGS.exchange1,
    exchange2: definition.fields[1]?.default || DEFAULT_SETTINGS.exchange2,
  };
}

function qso(patch: Partial<Qso>): Qso {
  return {
    time: 0, call: 'K1', trueCall: 'K1', rst: 599, trueRst: 599,
    nr: 1, trueNr: 1, exch1: '599', exch2: '1', trueExch1: '5NN',
    trueExch2: '1', pfx: 'K1', dupe: false, err: '   ',
    ...patch,
  };
}

describe('contest exchange model', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('accepts 5NN and serial cut-number spellings in WPX logs', () => {
    const e = new ContestEngine(settings('wpx'), events);
    vi.spyOn(Math, 'random').mockImplementation(() => 0);
    e.start('single');
    e.addCaller();
    const station = e.stations.at(-1)!;
    station.myCall = 'N0AX';
    station.oper.state = 'done';
    station.exch1 = '5NN';
    station.exch2 = String(station.nr);
    const entry = e.saveQso({ call: station.myCall, exch1: '5NN', exch2: String(station.nr) });
    expect(entry).toMatchObject({ err: '   ', exch1: '599', trueExch1: '5NN' });
  });

  it('logs and checks dynamic CWT text exchange', () => {
    const e = new ContestEngine(settings('cwt'), events);
    e.start('single');
    e.addCaller();
    const station = e.stations.at(-1)!;
    station.myCall = 'N0AX';
    station.oper.state = 'done';
    station.exch1 = 'Ward';
    station.exch2 = 'N0AX';
    const good = e.saveQso({ call: station.myCall, exch1: ' ward ', exch2: 'N0AX' });
    expect(good).toMatchObject({ err: '   ', exch1: 'WARD', exch2: 'N0AX' });
    const bad = e.saveQso({ call: 'KX0T', exch1: 'WARD', exch2: 'W0' });
    expect(bad?.err).toBe('NIL');
  });

  it('attaches a likely completed station to a miscopied NIL for review', () => {
    const e = new ContestEngine(settings('cwt'), events);
    e.start('single');
    e.addCaller();
    const station = e.stations.at(-1)!;
    station.myCall = 'W4LN';
    station.oper.state = 'done';
    station.exch1 = 'Ward';
    station.exch2 = 'N0AX';
    const saved = e.saveQso({ call: 'W4LM', exch1: 'WARO', exch2: 'W0' });
    expect(saved).toMatchObject({
      err: 'NIL',
      trueCall: 'W4LN',
      trueExch1: 'Ward',
      trueExch2: 'N0AX',
    });
    expect(e.stations).not.toContain(station);
  });

  it('backfills a deferred dynamic exchange and reports EX2', () => {
    const e = new ContestEngine(settings('cwt'), events);
    vi.spyOn(Math, 'random').mockImplementation(() => 0);
    e.start('single');
    e.addCaller();
    const station = e.stations.at(-1)!;
    station.myCall = 'N0AX';
    station.exch1 = 'Ward';
    station.exch2 = 'N0AX';
    const saved = e.saveQso({ call: station.myCall, exch1: 'WARD', exch2: 'W0' });
    expect(saved?.err).toBe('NIL');

    station.oper.state = 'done';
    for (let i = 0; i < 7; i++) e.getAudio();
    expect(saved).toMatchObject({ err: 'EX2', trueExch1: 'Ward', trueExch2: 'N0AX' });
    expect(e.stations).not.toContain(station);
  });

  it('uses zone as the CQ WW multiplier', () => {
    const entries = [
      qso({ call: 'K1', exch2: '5', trueExch2: '5' }),
      qso({ call: 'W2', exch2: '5', trueExch2: '5' }),
      qso({ call: 'OK1', exch2: '15', trueExch2: '15' }),
    ];
    expect(contestStats(entries, 'cqww', 'pileup')).toEqual({ points: 3, multipliers: 2, score: 6 });
  });
});
