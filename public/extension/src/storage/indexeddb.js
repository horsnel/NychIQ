/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — IndexedDB Wrapper
   Promise-based IndexedDB for unlimited local storage
   ══════════════════════════════════════════════════════════════════ */

const DB_NAME = 'nychiq-ext-storage';
const DB_VERSION = 1;
let dbInstance = null;

const STORES = {
  SCRAPED: 'scraped-data',
  AI_CACHE: 'ai-cache',
  SETTINGS: 'settings',
};

/**
 * Open (or create) the database with required object stores.
 */
export function initDB() {
  if (dbInstance) {
    // Verify connection is alive (handles service worker hibernation)
    try {
      const tx = dbInstance.transaction(STORES.SCRAPED, 'readonly');
      tx.abort();
      return Promise.resolve(dbInstance);
    } catch {
      dbInstance = null;
    }
  }

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this context'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // scraped-data: { id(auto), platform, dataType, data, scrapedAt, synced }
      if (!db.objectStoreNames.contains(STORES.SCRAPED)) {
        const store = db.createObjectStore(STORES.SCRAPED, { keyPath: 'id', autoIncrement: true });
        store.createIndex('platform', 'platform', { unique: false });
        store.createIndex('dataType', 'dataType', { unique: false });
        store.createIndex('scrapedAt', 'scrapedAt', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('platform_dataType', ['platform', 'dataType'], { unique: false });
      }

      // ai-cache: { key, result, createdAt, ttl }
      if (!db.objectStoreNames.contains(STORES.AI_CACHE)) {
        const store = db.createObjectStore(STORES.AI_CACHE, { keyPath: 'key' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // settings: { key, value }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error(`IndexedDB open failed: ${event.target.error}`));
    };
  });
}

/**
 * Add or update a record.
 */
export async function put(storeName, item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a record by key.
 */
export async function get(storeName, key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all records in a store.
 */
export async function getAll(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Query records by index value.
 */
export async function query(storeName, indexName, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Query records by index range.
 */
export async function queryRange(storeName, indexName, lower, upper) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const range = IDBKeyRange.bound(lower, upper);
    const req = index.getAll(range);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a record by key.
 */
export async function del(storeName, key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all records in a store.
 */
export async function clear(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Count records in a store.
 */
export async function count(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Close the database connection.
 */
export function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
