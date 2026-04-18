// ── IndexedDB Snapshot Store ──────────────────────────────────────────────────
// Keeps the last 5 full data snapshots in IndexedDB as a safety net.
// Auto-restores from the latest snapshot if localStorage is empty on load.

const IDB_NAME = 'fitnessTrackerBackups';
const IDB_STORE = 'snapshots';
const MAX_SNAPSHOTS = 5;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('ts', 'ts', { unique: false });
      }
    };

    request.onsuccess = event => resolve(event.target.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveSnapshot(data) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(IDB_STORE, 'readwrite');
    const store = transaction.objectStore(IDB_STORE);

    store.add({ ts: Date.now(), data: JSON.stringify(data) });

    // Prune old snapshots, keeping only the most recent MAX_SNAPSHOTS
    let count = 0;
    const cursor = store.index('ts').openCursor(null, 'prev');
    cursor.onsuccess = event => {
      const result = event.target.result;
      if (!result) return;
      count++;
      if (count > MAX_SNAPSHOTS) result.delete();
      result.continue();
    };
  } catch (error) {
    console.warn('[FitnessTracker] IDB snapshot save failed:', error);
  }
}

async function loadLatestSnapshot() {
  try {
    const db = await openDatabase();
    return new Promise(resolve => {
      const transaction = db.transaction(IDB_STORE, 'readonly');
      const store = transaction.objectStore(IDB_STORE);
      const request = store.index('ts').openCursor(null, 'prev');

      request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor && cursor.value.data) {
          try {
            resolve(JSON.parse(cursor.value.data));
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function listSnapshots() {
  try {
    const db = await openDatabase();
    return new Promise(resolve => {
      const transaction = db.transaction(IDB_STORE, 'readonly');
      const store = transaction.objectStore(IDB_STORE);
      const request = store.index('ts').getAll();

      request.onsuccess = () => resolve((request.result || []).reverse());
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
