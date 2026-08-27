import { describe, expect, it } from 'vitest';
import { CallList } from '../src/engine/call-list';

function dta(values: string[]) {
  const n = 37;
  const entries = n * n + 1;
  const data = Buffer.concat(values.map(v => Buffer.from(`${v}\0`, 'latin1')));
  const index = Buffer.alloc(entries * 4);
  index.writeInt32LE(entries * 4, 0);
  index.writeInt32LE(entries * 4 + data.length, (entries - 1) * 4);
  return Buffer.concat([index, data]);
}

describe('Community Edition MASTER.DTA', () => {
  it('skips the embedded version marker', async () => {
    const list = await CallList.fromMasterDta(dta(['VER2025', 'K0ABC', 'W1AW']));
    expect(list.snapshot()).toEqual(['K0ABC', 'W1AW']);
  });
});
