import { describe, expect, it } from 'vitest';
import { CallHistory } from '../src/engine/call-history';
import { readFileSync } from 'node:fs';

describe('real Community Edition history files', () => {
  it.each([
    ['cwt', 'CWOPS.LIST'],
    ['cqww', 'CQWWCW.txt'],
    ['fd', 'FDGOTA.txt'],
    ['naqp', 'NAQPCW.txt'],
    ['sst', 'K1USNSST.txt'],
    ['allja', 'JARL_ALLJA.TXT'],
    ['acag', 'JARL_ACAG.TXT'],
    ['ss', 'SSCW.txt'],
  ])('loads %s', (contest, file) => {
    const path = `D:/Tools/Morse/Morse Runner 1.85.2/${file}`;
    const history = new CallHistory();
    history.load(contest as never, readFileSync(path, 'latin1'));
    expect(history.count).toBeGreaterThan(100);
    const record = history.pick();
    expect(record?.call).toMatch(/^[A-Z0-9/]+$/);
    expect(record?.exch1).toBeTruthy();
    expect(record?.exch2).toBeTruthy();
  });
});
