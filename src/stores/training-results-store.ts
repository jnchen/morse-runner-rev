import type { ContestId } from '../engine/contest-defs';
import type { Qso, RunMode, UserSettings } from '../types';
import { TRAINING_RESULTS_STORE, withDatabase } from './indexeddb';

export interface TrainingResult {
  id: string;
  startedAt: string;
  durationSeconds: number;
  mode: RunMode;
  contest: ContestId;
  score: number;
  points: number;
  multipliers: number;
  qsoCount: number;
  settings: UserSettings;
  qsos: Qso[];
}

export function saveTrainingResult(result: TrainingResult): Promise<IDBValidKey> {
  return withDatabase(TRAINING_RESULTS_STORE, 'readwrite', (store) => store.put(result));
}

export async function listTrainingResults(limit = 20): Promise<TrainingResult[]> {
  const rows = await withDatabase(TRAINING_RESULTS_STORE, 'readonly', (store) => store.getAll());
  return (rows as TrainingResult[])
    .filter((row) => row && typeof row.id === 'string' && Array.isArray(row.qsos))
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    .slice(0, limit);
}

export async function getTrainingResult(id: string): Promise<TrainingResult | null> {
  const row = await withDatabase(TRAINING_RESULTS_STORE, 'readonly', (store) => store.get(id));
  return row ?? null;
}

export function clearTrainingResults(): Promise<undefined> {
  return withDatabase(TRAINING_RESULTS_STORE, 'readwrite', (store) => store.clear());
}
