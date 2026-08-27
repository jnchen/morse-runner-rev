import { describe, expect, it } from 'vitest';
import { exportCabrillo } from '../src/engine/cabrillo';
import { DEFAULT_SETTINGS, type Qso } from '../src/types';

function qso(patch: Partial<Qso>): Qso {
  return {
    time: 65,
    call: 'VE3NEA',
    trueCall: 'VE3NEA',
    rst: 599,
    trueRst: 599,
    nr: 123,
    trueNr: 123,
    exch1: '5NN',
    exch2: '123',
    trueExch1: '5NN',
    trueExch2: '123',
    pfx: 'VE3',
    dupe: false,
    err: '   ',
    ...patch,
  };
}

const settings = { ...DEFAULT_SETTINGS, call: 'W1AW', name: 'Test' };

describe('Cabrillo export', () => {
  const base = {
    settings,
    qsos: [qso({})],
    startedAt: new Date('2026-08-28T00:00:00Z'),
  };

  it('emits a Cabrillo 3.0 header and WPX serial exchange', () => {
    const output = exportCabrillo({ ...base, contest: 'wpx' });
    expect(output).toContain('START-OF-LOG: 3.0');
    expect(output).toContain('CONTEST: CQ-WPX-CW');
    expect(output).toContain('CALLSIGN: W1AW');
    expect(output).toContain('QSO 2026-08-28 0001 W1AW 599 123 VE3NEA 599 123');
    expect(output).toContain('END-OF-LOG:');
  });

  it('maps CQ WW to RST and zone fields', () => {
    const output = exportCabrillo({
      ...base,
      contest: 'cqww',
      qsos: [qso({ exch2: '15', trueExch2: '15' })],
    });
    expect(output).toContain('CONTEST: CQ-WW-CW');
    expect(output).toContain('VE3NEA 599 15');
  });

  it('splits the ARRL SS check and section', () => {
    const output = exportCabrillo({
      ...base,
      contest: 'ss',
      qsos: [qso({
        exch1: 'A', exch2: '72 CT', trueExch1: 'A', trueExch2: '72 CT',
      })],
    });
    expect(output).toContain('CONTEST: ARRL-SS-CW');
    expect(output).toContain('W1AW 1 A 72 CT');
    expect(output).toContain('VE3NEA 1 A 72 CT');
  });

  it('filters invalid training QSOs unless explicitly included', () => {
    const invalid = qso({ err: 'EX2', call: 'K0BAD' });
    const filtered = exportCabrillo({ ...base, contest: 'wpx', qsos: [invalid, qso({})] });
    expect(filtered).not.toContain('K0BAD');

    const all = exportCabrillo({ ...base, contest: 'wpx', qsos: [invalid, qso({})], includeInvalid: true });
    expect(all).toContain('K0BAD');
  });
});
