import type { ContestId } from '../engine/contest-defs';

export type RunMode = 'stop' | 'pileup' | 'single' | 'wpx' | 'hst';
export type StationState = 'listening' | 'copying' | 'preparing' | 'sending';
export type StationEvent = 'timeout' | 'msgSent' | 'meStarted' | 'meFinished';
export type OperatorState =
  | 'needPrevEnd' | 'needQso' | 'needNr' | 'needCall'
  | 'needCallNr' | 'needEnd' | 'done' | 'failed';
export type CallCheckResult = 'no' | 'yes' | 'almost';
export type StationMessage =
  | 'none' | 'cq' | 'nr' | 'tu' | 'myCall' | 'hisCall' | 'b4' | 'qm'
  | 'nil' | 'garbage' | 'rNr' | 'rNr2' | 'deMyCall1' | 'deMyCall2'
  | 'deMyCallNr1' | 'deMyCallNr2' | 'nrQm' | 'longCq' | 'myCallNr2'
  | 'qrl' | 'qrl2' | 'qsy' | 'agn';

export interface Qso {
  time: number;
  call: string;
  trueCall: string;
  /** Legacy numeric RST field, retained for WPX/HST compatibility. */
  rst: number;
  trueRst: number;
  /** Legacy numeric serial field, retained for WPX/HST compatibility. */
  nr: number;
  trueNr: number;
  /** Contest-specific exchange as entered by the operator. */
  exch1: string;
  exch2: string;
  /** Actual exchange sent by the DX station. Empty until verification. */
  trueExch1: string;
  trueExch2: string;
  pfx: string;
  dupe: boolean;
  err: string;
}

export interface GameStats {
  rawPoints: number;
  rawMultipliers: number;
  rawScore: number;
  verifiedPoints: number;
  verifiedMultipliers: number;
  verifiedScore: number;
  rate: number;
}

export interface UserSettings {
  call: string;
  name: string;
  wpm: number;
  pitch: number;
  bandwidth: number;
  qsk: boolean;
  rit: number;
  activity: number;
  qrn: boolean;
  qrm: boolean;
  qsb: boolean;
  flutter: boolean;
  lids: boolean;
  duration: number;
  compDuration: number;
  selfMonVolume: number;
  language: string;
  contest: ContestId;
  exchange1: string;
  exchange2: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  call: '',
  name: '',
  wpm: 30,
  pitch: 600,
  bandwidth: 500,
  qsk: true,
  rit: 0,
  activity: 2,
  qrn: true,
  qrm: true,
  qsb: true,
  flutter: true,
  lids: true,
  duration: 30,
  compDuration: 60,
  selfMonVolume: 0.75,
  language: navigator.language || 'en',
  contest: 'wpx',
  exchange1: '5NN',
  exchange2: '1',
};

