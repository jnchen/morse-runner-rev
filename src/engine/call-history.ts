import type { ContestId } from './contest-defs';

export interface CallHistoryRecord {
  call: string;
  exch1: string;
  exch2: string;
  userText: string;
}

interface CallCursor {
  contest: ContestId;
  index: number;
}

const FIXED_COLUMNS: Partial<Record<ContestId, { exch1: number; exch2: number }>> = {
  cwt: { exch1: 1, exch2: 2 },
  cqww: { exch1: -1, exch2: 1 },
  fd: { exch1: 1, exch2: 2 },
  naqp: { exch1: 1, exch2: 2 },
  sst: { exch1: 1, exch2: 2 },
  allja: { exch1: -1, exch2: 1 },
  acag: { exch1: -1, exch2: 1 },
  arrldx: { exch1: -1, exch2: 3 },
  ss: { exch1: -1, exch2: 1 },
};

/** Parses MorseRunner Community Edition N1MM-style call-history CSV files. */
export class CallHistory {
  private records = new Map<ContestId, CallHistoryRecord[]>();
  private cursors: CallCursor[] = [];

  load(contest: ContestId, text: string) {
    this.records.set(contest, parse(text, contest));
    this.refreshCursors();
  }

  clear(contest?: ContestId) {
    if (contest) this.records.delete(contest);
    else this.records.clear();
    this.refreshCursors();
  }

  get count() { return this.cursors.length; }

  pick(): CallHistoryRecord | null {
    if (!this.cursors.length) return null;
    const cursorIndex = Math.floor(Math.random() * this.cursors.length);
    const cursor = this.cursors[cursorIndex];
    const bucket = this.records.get(cursor.contest)!;
    const record = bucket[cursor.index];
    this.cursors.splice(cursorIndex, 1);
    return record;
  }

  private refreshCursors() {
    this.cursors = [];
    for (const [contest, bucket] of this.records) {
      bucket.forEach((_, index) => this.cursors.push({ contest, index }));
    }
  }
}

function parse(text: string, contest: ContestId): CallHistoryRecord[] {
  const records: CallHistoryRecord[] = [];
  const fixed = FIXED_COLUMNS[contest];
    let columns: Record<string, number> | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const values = splitCsv(line);
    if (values[0].startsWith('!!Order')) {
      columns = mapColumns(values.slice(1)); // !!Order!! is a marker, not a column.
      continue;
    }
    if (!columns && !fixed) continue; 

    const call = (values[columns?.call ?? 0] ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9/]{3,}$/.test(call)) continue;

    const exch1Index = columns ? (columns.name ?? columns.class ?? columns.exch1 ?? -1) : (fixed?.exch1 ?? 1);
    const exch2Index = columns ? (columns.exch2 ?? columns.exch1 ?? columns.sect ?? columns.cqzone ?? columns.state ?? columns.power ?? columns.number ?? -1) : (fixed?.exch2 ?? 2);
    let exch1 = values[exch1Index] ?? '';
    let exch2 = values[exch2Index] ?? '';
    exch1 = exch1.trim().toUpperCase();
    exch2 = exch2.trim().toUpperCase();

    if (contest === 'cqww' || contest === 'allja' || contest === 'acag' || contest === 'arrldx') exch1 = '599';
    if (contest === 'ss') {
      const section = values[columns?.sect ?? fixed?.exch2 ?? 1] ?? '';
      const check = values[columns?.ck ?? -1] ?? '';
      exch1 = 'A';
      exch2 = `${check.trim()} ${section.trim()}`.trim().toUpperCase();
    }
    if (!exch1 || !exch2) continue;

    records.push({ call, exch1, exch2, userText: (values[columns?.usertext ?? 4] ?? '').trim() });
  }
  return records;
}

function mapColumns(values: string[]) {
  const out: Record<string, number> = {};
  values.forEach((value, index) => {
    const key = value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (key === 'order') return;
    if (key) out[key] = index;
  });
  return out;
}



function splitCsv(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { value += '"'; i++; }
      else if (ch === '"') quoted = false;
      else value += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { values.push(value); value = ''; }
    else value += ch;
  }
  values.push(value);
  return values;
}
