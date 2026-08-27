import { describe, expect, it, vi } from 'vitest';
import { CallList } from '../src/engine/call-list';

function makeDta(calls: string[]) {
  const n = 37;
  const indexSize = n * n + 1;
  const data = Buffer.concat(calls.map(c => Buffer.from(`${c}\0`, 'latin1')));
  const index = Buffer.alloc(indexSize * 4);
  index.writeInt32LE(indexSize * 4, 0);
  index.writeInt32LE(indexSize * 4 + data.length, (indexSize - 1) * 4);
  return Buffer.concat([index, data]);
}

describe('CallList MASTER.DTA', () => {
  it('accepts original indexed call data and removes duplicates', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const list = await CallList.fromMasterDta(makeDta(['K0ABC', 'K0ABC', 'W1AW', 'P29SX']));
    expect(list.snapshot()).toEqual(['K0ABC', 'P29SX', 'W1AW']);
    expect(list.pick()).toBe('K0ABC');
    vi.restoreAllMocks();
  });

  it('rejects malformed data', async () => {
    await expect(CallList.fromMasterDta(new Uint8Array([1, 2, 3]))).rejects.toBeInstanceOf(Error);
  });

  it('depletes unique calls in HST mode', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const list = await CallList.fromMasterDta(makeDta(['K0AA', 'W1AW']));
    expect(list.pick(true)).toBe('K0AA');
    expect(list.pick(true)).toBe('W1AW');
    expect(list.pick(true)).toBe('P29SX');
    vi.restoreAllMocks();
  });
});
