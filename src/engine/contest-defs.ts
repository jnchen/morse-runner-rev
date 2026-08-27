export type ContestId =
  | 'wpx' | 'cwt' | 'fd' | 'naqp' | 'hst' | 'cqww' | 'arrldx'
  | 'sst' | 'allja' | 'acag' | 'iaruhf' | 'ss';

export type ExchangeFieldType = 'rst' | 'serial' | 'text' | 'zone' | 'number';

export interface ExchangeField {
  key: 'exch1' | 'exch2';
  type: ExchangeFieldType;
  labelKey: string;
  default: string;
}

export interface ContestDefinition {
  id: ContestId;
  name: string;
  fields: ExchangeField[];
  historyFile?: string;
}

export const CONTESTS: Record<ContestId, ContestDefinition> = {
  wpx: {
    id: 'wpx', name: 'CQ WPX',
    fields: [
      { key: 'exch1', type: 'rst', labelKey: 'rst', default: '5NN' },
      { key: 'exch2', type: 'serial', labelKey: 'nr', default: '1' },
    ],
  },
  cwt: {
    id: 'cwt', name: 'CWOPS CWT', historyFile: 'CWOPS.LIST',
    fields: [
      { key: 'exch1', type: 'text', labelKey: 'name', default: '' },
      { key: 'exch2', type: 'text', labelKey: 'exchange', default: '' },
    ],
  },
  fd: {
    id: 'fd', name: 'ARRL Field Day', historyFile: 'FDGOTA.txt',
    fields: [
      { key: 'exch1', type: 'text', labelKey: 'class', default: '3A' },
      { key: 'exch2', type: 'text', labelKey: 'section', default: '' },
    ],
  },
  naqp: {
    id: 'naqp', name: 'NCJ NAQP', historyFile: 'NAQPCW.txt',
    fields: [
      { key: 'exch1', type: 'text', labelKey: 'name', default: '' },
      { key: 'exch2', type: 'text', labelKey: 'state', default: '' },
    ],
  },
  hst: {
    id: 'hst', name: 'HST',
    fields: [
      { key: 'exch1', type: 'rst', labelKey: 'rst', default: '5NN' },
      { key: 'exch2', type: 'serial', labelKey: 'nr', default: '1' },
    ],
  },
  cqww: {
    id: 'cqww', name: 'CQ WW', historyFile: 'CQWWCW.txt',
    fields: [
      { key: 'exch1', type: 'rst', labelKey: 'rst', default: '5NN' },
      { key: 'exch2', type: 'zone', labelKey: 'cqZone', default: '' },
    ],
  },
  arrldx: {
    id: 'arrldx', name: 'ARRL DX', historyFile: 'ARRLDXCW_USDX.txt',
    fields: [
      { key: 'exch1', type: 'rst', labelKey: 'rst', default: '5NN' },
      { key: 'exch2', type: 'text', labelKey: 'power', default: '' },
    ],
  },
  sst: {
    id: 'sst', name: 'K1USN SST', historyFile: 'K1USNSST.txt',
    fields: [
      { key: 'exch1', type: 'text', labelKey: 'name', default: '' },
      { key: 'exch2', type: 'text', labelKey: 'state', default: '' },
    ],
  },
  allja: {
    id: 'allja', name: 'JARL ALL JA', historyFile: 'JARL_ALLJA.TXT',
    fields: [
      { key: 'exch1', type: 'rst', labelKey: 'rst', default: '5NN' },
      { key: 'exch2', type: 'text', labelKey: 'exchange', default: '' },
    ],
  },
  acag: {
    id: 'acag', name: 'JARL ACAG', historyFile: 'JARL_ACAG.TXT',
    fields: [
      { key: 'exch1', type: 'rst', labelKey: 'rst', default: '5NN' },
      { key: 'exch2', type: 'text', labelKey: 'exchange', default: '' },
    ],
  },
  iaruhf: {
    id: 'iaruhf', name: 'IARU HF', historyFile: 'IARU_HF.txt',
    fields: [
      { key: 'exch1', type: 'rst', labelKey: 'rst', default: '5NN' },
      { key: 'exch2', type: 'text', labelKey: 'zoneOrSociety', default: '' },
    ],
  },
  ss: {
    id: 'ss', name: 'ARRL Sweepstakes', historyFile: 'SSCW.txt',
    fields: [
      { key: 'exch1', type: 'text', labelKey: 'precedence', default: 'A' },
      { key: 'exch2', type: 'text', labelKey: 'checkSection', default: '' },
    ],
  },
};

export const CONTEST_LIST = Object.values(CONTESTS);
