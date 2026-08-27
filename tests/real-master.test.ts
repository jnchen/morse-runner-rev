import { describe, expect, it } from 'vitest';
import { CallList } from '../src/engine/call-list';
import { readFileSync } from 'node:fs';

describe('real MASTER.DTA fixture', () => {
  it('loads the installed original file when available', async () => {
    const path = 'D:/Tools/Morse/Morse Runner 1.85.2/MASTER.DTA';
    try {
      const list = await CallList.fromMasterDta(new Uint8Array(readFileSync(path)));
      expect(list.size).toBeGreaterThan(45000);
      expect(list.snapshot()[0]).toMatch(/^[A-Z0-9/]+$/);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  });
});
