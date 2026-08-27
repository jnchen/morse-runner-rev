import { describe, expect, it } from 'vitest';
import { exportAdif } from '../src/engine/adif';
import { CONTESTS } from '../src/engine/contest-defs';
import { DEFAULT_SETTINGS, type Qso } from '../src/types';

const qso: Qso = {
  time: 3725,
  call: 'VE3NEA',
  trueCall: 'VE3NEA',
  rst: 599,
  trueRst: 599,
  nr: 42,
  trueNr: 42,
  exch1: '599',
  exch2: '42',
  trueExch1: '5NN',
  trueExch2: '42',
  pfx: 'VE3',
  dupe: false,
  err: '   ',
};

describe('ADIF export', () => {
  it('emits a valid header and UTC QSO record', () => {
    const output = exportAdif({
      contest: 'wpx',
      settings: { ...DEFAULT_SETTINGS, call: 'W1AW' },
      qsos: [qso],
      startedAt: new Date('2026-08-28T00:00:00Z'),
    });

    expect(output).toContain('<PROGRAMID:16>MORSE_RUNNER_WEB');
    expect(output).toContain('<STATION_CALLSIGN:4>W1AW');
    expect(output).toContain('<CALL:6>VE3NEA');
    expect(output).toContain('<QSO_DATE:8>20260828');
    expect(output).toContain('<TIME_ON:6>010205');
    expect(output).toContain('<RST_SENT:3>599');
    expect(output).toContain('<SRX:2>42');
    
    expect(CONTESTS.wpx.name).toBe('CQ WPX');
  });
});
