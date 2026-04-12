/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Sync State
   Track sync timestamps, pending items, failures
   ══════════════════════════════════════════════════════════════════ */

import { get, put, getAll } from './indexeddb.js';

const SETTINGS_STORE = 'settings';
const SCRAPED_STORE = 'scraped-data';

const KEYS = {
  SYNC_PREFIX: 'sync:last:',
  PENDING: 'sync:pendingCount',
  FAILURE_COUNT: 'sync:failureCount',
  LAST_SUCCESS: 'sync:lastSuccess',
  LAST_FAILURE: 'sync:lastFailure',
};

/**
 * Get last sync timestamp for a platform.
 */
export async function getLastSync(platform) {
  try {
    const record = await get(SETTINGS_STORE, `${KEYS.SYNC_PREFIX}${platform}`);
    return record?.value || null;
  } catch {
    // Fallback to chrome.storage
    const result = await chromeStorageGet(`${KEYS.SYNC_PREFIX}${platform}`);
    return result?.timestamp || null;
  }
}

/**
 * Update last sync timestamp for a platform.
 */
export async function setLastSync(platform, timestamp) {
  const ts = timestamp || Date.now();
  try {
    await put(SETTINGS_STORE, { key: `${KEYS.SYNC_PREFIX}${platform}`, value: ts });
    // Also update chrome.storage as backup
    await chromeStorageSet(`${KEYS.SYNC_PREFIX}${platform}`, { timestamp: ts });
    return ts;
  } catch {
    await chromeStorageSet(`${KEYS.SYNC_PREFIX}${platform}`, { timestamp: ts });
    return ts;
  }
}

/**
 * Get number of unsynced items.
 */
export async function getPendingCount() {
  try {
    // Count unsynced items in scraped-data store
    const { query, count: idbCount } = await import('./indexeddb.js');
    let count = 0;
    try {
      const unsynced = await query(SCRAPED_STORE, 'synced', 0);
      count = unsynced.length;
    } catch {
      count = await idbCount(SCRAPED_STORE);
    }

    // Offline queue count from background (via message) not available in content script
    // Only works when called from background service worker context
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_QUEUE_SIZE' });
      if (response && typeof response.size === 'number') count += response.size;
    } catch { /* not available in this context */ }

    return count;
  } catch {
    return 0;
  }
}

/**
 * Increment pending count.
 */
export async function incrementPending(count = 1) {
  const current = await getPendingCount();
  // Note: We can't easily decrement pending from here without knowing which items synced
  // The actual count comes from querying unsynced records
  return current + count;
}

/**
 * Decrement pending count after successful sync.
 */
export async function decrementPending(count = 1) {
  const current = await getPendingCount();
  return Math.max(0, current - count);
}

/**
 * Record a sync failure.
 */
export async function recordSyncFailure(error) {
  try {
    const record = await get(SETTINGS_STORE, KEYS.FAILURE_COUNT) || { key: KEYS.FAILURE_COUNT, value: 0 };
    record.value = (record.value || 0) + 1;
    await put(SETTINGS_STORE, record);

    await put(SETTINGS_STORE, { key: KEYS.LAST_FAILURE, value: { error: String(error), timestamp: Date.now() } });
  } catch { /* silent */ }
}

/**
 * Reset failure count after successful sync.
 */
export async function resetFailures() {
  try {
    await put(SETTINGS_STORE, { key: KEYS.FAILURE_COUNT, value: 0 });
    await put(SETTINGS_STORE, { key: KEYS.LAST_SUCCESS, value: Date.now() });
  } catch { /* silent */ }
}

/**
 * Get overall sync health status.
 */
export async function getSyncHealth() {
  const platforms = ['youtube', 'tiktok', 'twitter', 'instagram'];
  const lastSyncs = {};

  for (const platform of platforms) {
    lastSyncs[platform] = await getLastSync(platform);
  }

  const pending = await getPendingCount();

  let failureCount = 0;
  let lastFailure = null;
  let lastSuccess = null;

  try {
    const fc = await get(SETTINGS_STORE, KEYS.FAILURE_COUNT);
    failureCount = fc?.value || 0;
    const lf = await get(SETTINGS_STORE, KEYS.LAST_FAILURE);
    lastFailure = lf?.value || null;
    const ls = await get(SETTINGS_STORE, KEYS.LAST_SUCCESS);
    lastSuccess = ls?.value || null;
  } catch { /* silent */ }

  let status = 'healthy';
  if (failureCount > 10) status = 'critical';
  else if (failureCount > 5) status = 'degraded';
  else if (failureCount > 2) status = 'warning';

  return {
    status,
    lastSync: lastSyncs,
    lastSuccess,
    lastFailure,
    pendingCount: pending,
    failureCount,
  };
}

/* ── Chrome storage fallback helpers ── */

function chromeStorageGet(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => resolve(result[key]));
  });
}

function chromeStorageSet(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}
