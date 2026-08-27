import { CALL_HISTORY_STORE, CALL_LIST_STORE, withDatabase } from './indexeddb';

const MASTER_KEY = 'master-dta';

export function saveMasterDta(bytes: Uint8Array): Promise<IDBValidKey> {
  return withDatabase(CALL_LIST_STORE, 'readwrite', (store) => store.put(bytes, MASTER_KEY));
}

export function loadMasterDta(): Promise<Uint8Array | null> {
  return withDatabase(CALL_LIST_STORE, 'readonly', (store) => store.get(MASTER_KEY))
    .then((value) => (value instanceof Uint8Array ? value : null));
}

export function clearMasterDta(): Promise<undefined> {
  return withDatabase(CALL_LIST_STORE, 'readwrite', (store) => store.delete(MASTER_KEY));
}

export function saveCallHistory(contest: string, text: string): Promise<IDBValidKey> {
  return withDatabase(CALL_HISTORY_STORE, 'readwrite', (store) => store.put(text, contest));
}

export function loadCallHistory(contest: string): Promise<string | null> {
  return withDatabase(CALL_HISTORY_STORE, 'readonly', (store) => store.get(contest))
    .then((value) => (typeof value === 'string' ? value : null));
}

export function clearCallHistory(contest: string): Promise<undefined> {
  return withDatabase(CALL_HISTORY_STORE, 'readwrite', (store) => store.delete(contest));
}
