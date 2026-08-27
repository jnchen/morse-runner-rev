const FALLBACK_PREFIXES = ['K', 'W', 'N', 'VE', 'VK', 'JA', 'DL', 'G', 'F', 'OK', 'SP', 'UR', 'EA', 'I', 'SM', 'OZ', 'OH', 'LY', 'YZ', 'SV'];
const SUFFIX = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

/** Compatible with MorseRunner MASTER.DTA, with a deterministic generated fallback pool. */
export class CallList {
  private calls: string[] = [];
  private used = new Set<string>();

  constructor(size = 12000) {
    this.generate(size);
  }

  load(calls: string[]) {
    this.calls = [...new Set(calls.map((c) => c.trim().toUpperCase()).filter(Boolean))].sort();
    this.used.clear();
  }

  async loadMasterDta(bytes: Uint8Array) {
    this.calls = await parseMasterDta(bytes);
    this.used.clear();
  }

  static async fromMasterDta(bytes: Uint8Array) {
    const list = new CallList(0);
    await list.loadMasterDta(bytes);
    return list;
  }

  reset(size = 12000) {
    this.calls = [];
    this.used.clear();
    this.generate(size);
  }

  snapshot() { return [...this.calls]; }
  get size() { return this.calls.length; }

  pick(hst = false): string {
    if (!this.calls.length) return 'P29SX';
    const i = Math.floor(Math.random() * this.calls.length);
    const call = this.calls[i];
    if (hst) {
      this.calls.splice(i, 1);
      this.used.add(call);
    }
    return call;
  }

  private generate(size: number) {
    const seen = new Set<string>();
    while (this.calls.length < size) {
      const pfx = FALLBACK_PREFIXES[Math.floor(Math.random() * FALLBACK_PREFIXES.length)];
      const digit = DIGITS[Math.floor(Math.random() * DIGITS.length)];
      let suffix = '';
      const suffixLen = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < suffixLen; i++) suffix += SUFFIX[Math.floor(Math.random() * SUFFIX.length)];
      const call = `${pfx}${digit}${suffix}`;
      if (seen.has(call)) continue;
      seen.add(call);
      this.calls.push(call);
    }
  }
}

/**
 * The original file starts with a 37x37+1 little-endian int32 lookup index,
 * followed by NUL-terminated Latin-1 callsigns. The index is validated but not
 * required for lookup here because random selection scans the complete call area.
 */
async function parseMasterDta(bytes: Uint8Array): Promise<string[]> {
  const charsetLength = 37;
  const indexEntries = charsetLength * charsetLength + 1;
  const indexBytes = indexEntries * 4;
  if (bytes.length < indexBytes) throw new Error('MASTER.DTA is too short');

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const first = view.getInt32(0, true);
  const last = view.getInt32((indexEntries - 1) * 4, true);
  if (first !== indexBytes || last !== bytes.length) {
    throw new Error('MASTER.DTA has an invalid index');
  }

  const decoder = new TextDecoder('windows-1252');
  const calls = new Set<string>();
  let start = indexBytes;
  while (start < bytes.length) {
    let end = start;
    while (end < bytes.length && bytes[end] !== 0) end++;
    const raw = decoder.decode(bytes.subarray(start, end)).trim().toUpperCase();
    // Community Edition embeds a version marker such as VER2025 in the data area.
    if (raw && !raw.startsWith('VER2')) calls.add(raw);
    start = end + 1;
  }
  return [...calls].sort();
}

