/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Sync Manager
   Queue management, batching, compression, dedup for API sync
   ══════════════════════════════════════════════════════════════════ */

import { addToQueue, drainQueue, removeItems, markSynced, getQueueSize, pruneSynced } from './offline-queue.js';
import { getToken } from './auth-bridge.js';

const STORAGE_KEY = 'nychiq_ext_state';
const BATCH_QUEUE_KEY = 'nychiq_batch_queue';
const ANALYZED_IDS_KEY = 'nychiq_analyzed_ids';
const API_CACHE_KEY = 'nychiq_api_cache';
const API_BASE = 'https://nychiq.com/api';
const MAX_BATCH_QUEUE = 500;
const ANALYZED_IDS_MAX = 10000;
const CHUNK_SIZE = 50;
const SYNC_INTERVAL_MINUTES = 5;

let syncInProgress = false;

/**
 * Initialize sync system — set up alarms and first sync check.
 */
export function initSync() {
  chrome.alarms.create('nychiq_sync', { periodInMinutes: SYNC_INTERVAL_MINUTES });
  chrome.alarms.create('nychiq_prune', { periodInMinutes: 60 });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'nychiq_sync') {
      await forceSync();
    }
    if (alarm.name === 'nychiq_prune') {
      await pruneAPICache();
      await pruneSynced(); // prune old synced items from IndexedDB
    }
  });

  // Also listen for connectivity changes
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    setTimeout(() => forceSync(), 3000); // try sync 3s after load
  }
  self.addEventListener('online', () => {
    console.debug('[NychIQ] Back online — triggering sync');
    forceSync();
  });
}

/**
 * Force immediate sync regardless of timer.
 */
export async function forceSync() {
  if (syncInProgress) return { ok: true, message: 'sync_in_progress' };
  syncInProgress = true;

  try {
    const state = await chromeStorageGet(STORAGE_KEY) || {};
    if (!state.connected) return { ok: true, message: 'not_connected' };

    const size = await getQueueSize();
    if (size === 0) {
      // Also try chrome.storage batch queue for backwards compat
      await syncChromeStorageQueue(state);
      return { ok: true, synced: 0, remaining: 0 };
    }

    const items = await drainQueue(CHUNK_SIZE);
    if (items.length === 0) return { ok: true, synced: 0, remaining: 0 };

    const result = await sendBatchToAPI(items);

    if (result.ok) {
      const keys = items.map(i => i._dbKey);
      await removeItems(keys);
      state.lastSync = new Date().toISOString();
      await chromeStorageSet(STORAGE_KEY, state);
      console.debug(`[NychIQ] Synced ${items.length} items via IndexedDB. ${result.remaining || 0} remaining.`);
    } else {
      console.debug(`[NychIQ] Sync failed: ${result.error}`);
    }

    return result;
  } finally {
    syncInProgress = false;
  }
}

/**
 * Enqueue scraped data items from content scripts.
 * Handles dedup, state updates, and badge management.
 */
export async function enqueueItems(items, platform, sender) {
  if (!items || items.length === 0) return { ok: true, queued: 0 };

  let state = await chromeStorageGet(STORAGE_KEY) || {};
  let analyzedIds = await chromeStorageGet(ANALYZED_IDS_KEY) || [];
  const platformBreakdown = state.platformBreakdown || { youtube: 0, tiktok: 0, twitter: 0, instagram: 0 };

  let newItems = 0;
  let viralCount = 0;
  let insightCount = 0;

  for (const item of items) {
    const itemId = item.videoId || item.tweetId || item.username || item.channelId ||
                   `${item.url}_${item.scrapedAt}`;
    const dedupeKey = `${platform}:${itemId}`;

    if (analyzedIds.includes(dedupeKey)) continue;
    analyzedIds.push(dedupeKey);
    newItems++;

    // Track viral detections (engagement rate > 5%)
    if (item.likes || item.likeCount) {
      const likes = item.likes || item.likeCount || 0;
      const views = item.views || item.viewCount || 0;
      if (views > 0 && (likes / views) > 0.05) viralCount++;
    }

    // Count insights
    if (item.recommendations?.length) insightCount += item.recommendations.length;
    if (item.comments?.length) insightCount += item.comments.length;

    // Add to offline queue
    await addToQueue(item).catch(() => {}); // don't block on IndexedDB failure
  }

  // Trim analyzed IDs
  if (analyzedIds.length > ANALYZED_IDS_MAX) {
    analyzedIds = analyzedIds.slice(-ANALYZED_IDS_MAX);
  }

  // Update state
  state.totalDataPoints = (state.totalDataPoints || 0) + newItems;
  state.viralDetected = (state.viralDetected || 0) + viralCount;
  state.insightsFound = (state.insightsFound || 0) + insightCount;
  platformBreakdown[platform] = (platformBreakdown[platform] || 0) + newItems;
  state.platformBreakdown = platformBreakdown;

  // Platform-specific counters
  if (platform === 'youtube' && items.some(i => i.dataType === 'video')) {
    state.videosAnalyzed = (state.videosAnalyzed || 0) + 1;
  }
  if (platform === 'tiktok') {
    state.tiktokProfilesAnalyzed = (state.tiktokProfilesAnalyzed || 0) + 1;
  }
  if (platform === 'twitter') {
    state.twitterProfilesAnalyzed = (state.twitterProfilesAnalyzed || 0) + 1;
  }

  // Update badge
  if (state.viralDetected > 0) {
    chrome.action.setBadgeText({ text: state.viralDetected.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  }

  // Persist
  await chromeStorageSet(ANALYZED_IDS_KEY, analyzedIds);
  await chromeStorageSet(STORAGE_KEY, state);

  return { ok: true, queued: newItems };
}

/**
 * Send a batch of items to the Worker API.
 */
async function sendBatchToAPI(items) {
  try {
    const jwt = await getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    const resp = await fetch(`${API_BASE}/scrape/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        items: items.map(({ _dbKey, ...rest }) => rest), // strip internal key
        syncedAt: new Date().toISOString(),
        extensionVersion: '4.0.0',
      }),
    });

    if (resp.ok) {
      const remaining = await getQueueSize();
      return { ok: true, synced: items.length, remaining };
    }

    return { ok: false, error: `http_${resp.status}`, synced: 0 };
  } catch (err) {
    return { ok: false, error: err.message, synced: 0 };
  }
}

/**
 * Legacy: sync from chrome.storage batch queue (backwards compat).
 */
async function syncChromeStorageQueue(state) {
  let batchQueue = await chromeStorageGet(BATCH_QUEUE_KEY) || [];
  if (batchQueue.length === 0) return;

  const chunk = batchQueue.slice(0, CHUNK_SIZE);
  const remaining = batchQueue.slice(CHUNK_SIZE);

  try {
    const jwt = await getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    const resp = await fetch(`${API_BASE}/scrape/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        items: chunk,
        syncedAt: new Date().toISOString(),
        extensionVersion: '4.0.0',
      }),
    });

    if (resp.ok) {
      await chromeStorageSet(BATCH_QUEUE_KEY, remaining);
      state.lastSync = new Date().toISOString();
      await chromeStorageSet(STORAGE_KEY, state);
      console.debug(`[NychIQ] Synced ${chunk.length} items (legacy). ${remaining.length} remaining.`);
    }
  } catch (err) {
    console.debug(`[NychIQ] Legacy sync error: ${err.message}`);
  }
}

/**
 * Prune expired API cache entries.
 */
async function pruneAPICache() {
  const cache = await chromeStorageGet(API_CACHE_KEY) || {};
  const TTL = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  let pruned = 0;

  for (const key of Object.keys(cache)) {
    if (now - cache[key].ts > TTL) {
      delete cache[key];
      pruned++;
    }
  }

  if (pruned > 0) {
    await chromeStorageSet(API_CACHE_KEY, cache);
    console.debug(`[NychIQ] Pruned ${pruned} expired cache entries.`);
  }
}

/* ── Storage helpers ── */

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
