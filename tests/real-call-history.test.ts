import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CallHistory } from '../src/engine/call-history';

const realDataDir =
  process.env.MORSE_RUNNER_REAL_DATA_DIR ?? 'D:/Tools/Morse/Morse Runner 1.85.2';

const realHistories: Array<[string, string]> = [
  ['cwt', 'CWOPS.LIST'],
  ['cqww', 'CQWWCW.txt'],
  ['fd', 'FDGOTA.txt'],
  ['naqp', 'NAQPCW.txt'],
  ['sst', 'K1USNSST.txt'],
  ['allja', 'JARL_ALLJA.TXT'],
  ['acag', 'JARL_ACAG.TXT'],
  ['ss', 'SSCW.txt'],
];

describe('real Community Edition history files', () => {
  for (const [contest, file] of realHistories) {
    it.skipIf(!existsSync(join(realDataDir, file)))(`loads ${contest}`, () => {
      const history = new CallHistory();
      history.load(contest as never, readFileSync(join(realDataDir, file), 'latin1'));
      expect(history.count).toBeGreaterThan(100);
      const record = history.pick();
      expect(record?.call).toMatch(/^[A-Z0-9/]+$/);
      expect(record?.exch1).toBeTruthy();
      expect(record?.exch2).toBeTruthy();
    });
  }
});
