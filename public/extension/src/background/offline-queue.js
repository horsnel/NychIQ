/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Offline Queue
   IndexedDB-backed queue for offline data persistence
   ══════════════════════════════════════════════════════════════════ */

const DB_NAME = 'nychiq-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending';
const FALLBACK_KEY = 'nychiq_offline_fallback';

let dbInstance = null;

/**
 * Open (or create) the IndexedDB database.
 */
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: '_id', autoIncrement: true });
        store.createIndex('platform', 'platform', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error(`IndexedDB error: ${event.target.error}`));
    };
  });
}

/**
 * Add a scraped data item to the offline queue.
 */
export async function addToQueue(item) {
  try {
    const db = await openDB();
    const record = {
      ...item,
      createdAt: Date.now(),
      synced: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(record);
      req.onsuccess = () => resolve(req.result); // return the key
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to chrome.storage
    return fallbackAdd(item);
  }
}

/**
 * Drain items from the queue for syncing.
 * Returns up to `limit` unsynced items.
 */
export async function drainQueue(limit = 50) {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('synced');
      const items = [];

      const request = index.openCursor(IDBKeyRange.only(0)); // synced === 0 means pending
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && items.length < limit) {
          items.push({ ...cursor.value, _dbKey: cursor.primaryKey });
          cursor.continue();
        } else {
          resolve(items);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return fallbackDrain(limit);
  }
}

/**
 * Remove items from queue after successful sync.
 */
export async function removeItems(keys) {
  if (!keys || keys.length === 0) return;

  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const promises = keys.map(key => {
        return new Promise((res, rej) => {
          const req = store.delete(key);
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        });
      });

      Promise.all(promises).then(resolve).catch(reject);
    });
  } catch {
    return fallbackRemove(keys);
  }
}

/**
 * Get total pending queue size.
 */
export async function getQueueSize() {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('synced');
      const req = index.count(IDBKeyRange.only(0));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return fallbackSize();
  }
}

/**
 * Mark items as synced without removing them (for audit trail).
 */
export async function markSynced(keys) {
  if (!keys || keys.length === 0) return;

  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const promises = keys.map(key => {
        return new Promise((res, rej) => {
          const getReq = store.get(key);
          getReq.onsuccess = () => {
            const record = getReq.result;
            if (record) {
              record.synced = 1;
              record.syncedAt = Date.now();
              store.put(record).onsuccess = () => res();
            } else {
              res();
            }
          };
          getReq.onerror = () => rej(getReq.error);
        });
      });

      Promise.all(promises).then(resolve).catch(reject);
    });
  } catch {
    // Silently fail for fallback
  }
}

/**
 * Clear all synced items older than age (ms).
 */
export async function pruneSynced(maxAge = 24 * 60 * 60 * 1000) {
  try {
    const db = await openDB();
    const cutoff = Date.now() - maxAge;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('synced');
      let pruned = 0;

      const request = index.openCursor(IDBKeyRange.only(1)); // synced === 1
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const record = cursor.value;
          if (record.syncedAt && record.syncedAt < cutoff) {
            cursor.delete();
            pruned++;
          }
          cursor.continue();
        } else {
          resolve(pruned);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return 0;
  }
}

/* ═══════════════════════════════════════════════════════════════
   FALLBACK: chrome.storage.local (when IndexedDB unavailable)
   ═══════════════════════════════════════════════════════════════ */

async function fallbackGetQueue() {
  return new Promise(resolve => {
    chrome.storage.local.get(FALLBACK_KEY, result => resolve(result[FALLBACK_KEY] || []));
  });
}

async function fallbackSetQueue(queue) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [FALLBACK_KEY]: queue }, resolve);
  });
}

async function fallbackAdd(item) {
  const queue = await fallbackGetQueue();
  queue.push({ ...item, createdAt: Date.now(), synced: false });
  await fallbackSetQueue(queue);
  return queue.length - 1;
}

async function fallbackDrain(limit) {
  const queue = await fallbackGetQueue();
  const pending = queue.filter(i => !i.synced).slice(0, limit);
  return pending.map((item, i) => ({ ...item, _dbKey: queue.indexOf(item) }));
}

async function fallbackRemove(keys) {
  const queue = await fallbackGetQueue();
  const keySet = new Set(keys);
  await fallbackSetQueue(queue.filter((_, i) => !keySet.has(i)));
}

async function fallbackSize() {
  const queue = await fallbackGetQueue();
  return queue.filter(i => !i.synced).length;
}
