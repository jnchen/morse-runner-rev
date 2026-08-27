/** Shared IndexedDB access for all local, per-browser data. */
const DB_NAME = 'morse-runner-web';
const DB_VERSION = 2;

export const CALL_LIST_STORE = 'call-list';
export const CALL_HISTORY_STORE = 'call-history';
export const TRAINING_RESULTS_STORE = 'training-results';

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CALL_LIST_STORE)) db.createObjectStore(CALL_LIST_STORE);
      if (!db.objectStoreNames.contains(CALL_HISTORY_STORE)) db.createObjectStore(CALL_HISTORY_STORE);
      if (!db.objectStoreNames.contains(TRAINING_RESULTS_STORE)) {
        db.createObjectStore(TRAINING_RESULTS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another tab'));
  });
}

export function transaction<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = run(tx.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(`IndexedDB ${mode} failed`));
    tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB ${mode} was aborted`));
  });
}

export async function withDatabase<T>(store: string, mode: IDBTransactionMode, run: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  try {
    return await transaction(db, store, mode, run);
  } finally {
    db.close();
  }
}
