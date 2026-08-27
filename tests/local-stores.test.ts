import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearCallHistory, loadCallHistory, saveCallHistory } from '../src/stores/call-list-store';
import { clearTrainingResults, listTrainingResults, saveTrainingResult } from '../src/stores/training-results-store';
import { DEFAULT_SETTINGS, type Qso } from '../src/types';

const qso: Qso = {
  time: 1,
  call: 'W1AW',
  trueCall: 'W1AW',
  rst: 599,
  trueRst: 599,
  nr: 1,
  trueNr: 1,
  exch1: '599',
  exch2: '1',
  trueExch1: '599',
  trueExch2: '1',
  pfx: 'W1',
  dupe: false,
  err: '   ',
};

describe('local IndexedDB stores', () => {
  beforeEach(async () => {
    await clearCallHistory('wpx').catch(() => undefined);
    await clearTrainingResults().catch(() => undefined);
  });

  it('creates the call-history store during the version-2 upgrade', async () => {
    await saveCallHistory('wpx', 'W1AW,5NN,1');
    expect(await loadCallHistory('wpx')).toBe('W1AW,5NN,1');
  });

  it('persists and lists training results newest first', async () => {
    const base = { ...DEFAULT_SETTINGS, call: 'W1AW' };
    await saveTrainingResult({
      id: 'old', startedAt: '2026-08-27T00:00:00Z', durationSeconds: 60,
      mode: 'pileup', contest: 'wpx', score: 10, points: 10, multipliers: 1,
      qsoCount: 1, settings: base, qsos: [qso],
    });
    await saveTrainingResult({
      id: 'new', startedAt: '2026-08-28T00:00:00Z', durationSeconds: 60,
      mode: 'single', contest: 'cwt', score: 20, points: 20, multipliers: 1,
      qsoCount: 1, settings: base, qsos: [qso],
    });

    const rows = await listTrainingResults();
    expect(rows.map((row) => row.id)).toEqual(['new', 'old']);
    expect(rows[0].qsos[0]).toMatchObject({ call: 'W1AW', exch1: '599' });
  });
});
