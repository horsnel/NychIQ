/* ══════════════════════════════════════════════════════════════════
   NychIQ Chrome Extension v3.0 — Background Service Worker
   Batch data collection, aggregation, periodic API sync,
   tab management, CORS proxy, API response caching
   ══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'nychiq_ext_state';
const BATCH_QUEUE_KEY = 'nychiq_batch_queue';
const ANALYZED_IDS_KEY = 'nychiq_analyzed_ids';
const API_CACHE_KEY = 'nychiq_api_cache';
const API_BASE = 'https://nychiq.com/api';
const SYNC_INTERVAL_MINUTES = 5;
const MAX_BATCH_QUEUE = 500;
const ANALYZED_IDS_MAX = 10000;
const API_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/* ── Initialize on install ── */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      [STORAGE_KEY]: {
        connected: false,
        videosAnalyzed: 0,
        tiktokProfilesAnalyzed: 0,
        twitterProfilesAnalyzed: 0,
        insightsFound: 0,
        viralDetected: 0,
        tokensLeft: 0,
        showBadges: true,
        autoAnalyze: false,
        deepScraping: false,
        apiBase: API_BASE,
        lastSync: null,
        totalDataPoints: 0,
        platformBreakdown: { youtube: 0, tiktok: 0, twitter: 0 },
      },
    });
    chrome.storage.local.set({ [BATCH_QUEUE_KEY]: [], [ANALYZED_IDS_KEY]: [], [API_CACHE_KEY]: {} });
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#FDBA2D' });
    chrome.tabs.create({ url: 'https://nychiq.com' });
  }

  // Clean up on update
  if (details.reason === 'update') {
    migrateStorage();
  }
});

/**
 * Ensure storage schema has all v3 keys.
 */
function migrateStorage() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const state = result[STORAGE_KEY] || {};
    const defaults = {
      tiktokProfilesAnalyzed: 0,
      twitterProfilesAnalyzed: 0,
      deepScraping: false,
      totalDataPoints: 0,
      platformBreakdown: { youtube: 0, tiktok: 0, twitter: 0 },
    };
    for (const key of Object.keys(defaults)) {
      if (state[key] === undefined) state[key] = defaults[key];
    }
    chrome.storage.local.set({ [STORAGE_KEY]: state });
  });
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE HANDLER
   ═══════════════════════════════════════════════════════════════ */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ── STATE_CHANGED: User connected/disconnected ──
  if (message.type === 'STATE_CHANGED') {
    handleStateChange(message.state).then(sendResponse);
    return true;
  }

  // ── INCREMENT_STAT: Increment a counter in state ──
  if (message.type === 'INCREMENT_STAT') {
    handleIncrementStat(message.stat).then(sendResponse);
    return true;
  }

  // ── API_REQUEST: Proxy API calls from content scripts (CORS bypass) ──
  if (message.type === 'API_REQUEST') {
    handleApiRequest(message).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }

  // ── BATCH_DATA: Content script sends scraped data batch ──
  if (message.type === 'BATCH_DATA') {
    handleBatchData(message.payload, sender).then(sendResponse);
    return true;
  }

  // ── GET_STATS: Popup requests aggregated stats ──
  if (message.type === 'GET_STATS') {
    handleGetStats().then(sendResponse);
    return true;
  }

  // ── EXPORT_DATA: Popup requests all scraped data for export ──
  if (message.type === 'EXPORT_DATA') {
    handleExportData().then(sendResponse);
    return true;
  }

  // ── CLEAR_DATA: User requests data wipe ──
  if (message.type === 'CLEAR_DATA') {
    chrome.storage.local.set({ [BATCH_QUEUE_KEY]: [], [ANALYZED_IDS_KEY]: [] });
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      state.videosAnalyzed = 0;
      state.tiktokProfilesAnalyzed = 0;
      state.twitterProfilesAnalyzed = 0;
      state.insightsFound = 0;
      state.viralDetected = 0;
      state.totalDataPoints = 0;
      state.platformBreakdown = { youtube: 0, tiktok: 0, twitter: 0 };
      chrome.storage.local.set({ [STORAGE_KEY]: state });
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

/* ═══════════════════════════════════════════════════════════════
   HANDLERS
   ═══════════════════════════════════════════════════════════════ */

async function handleStateChange(state) {
  const platformUrls = ['*://*.youtube.com/*', '*://*.tiktok.com/*', '*://*.twitter.com/*', '*://*.x.com/*'];

  if (state.connected) {
    const count = state.viralDetected > 0 ? state.viralDetected.toString() : '';
    chrome.action.setBadgeText({ text: count });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    chrome.tabs.query({ url: platformUrls }, (tabs) => {
      tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, { type: 'REINJECT' }).catch(() => {}));
    });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.tabs.query({ url: platformUrls }, (tabs) => {
      tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_CHANGED', settings: { showBadges: false } }).catch(() => {}));
    });
  }

  // Persist
  await chromeStorageSet(STORAGE_KEY, state);
  return { ok: true };
}

async function handleIncrementStat(stat) {
  const state = await chromeStorageGet(STORAGE_KEY) || {};
  if (state[stat] !== undefined) {
    state[stat] = (state[stat] || 0) + 1;
    await chromeStorageSet(STORAGE_KEY, state);
    if (stat === 'viralDetected') {
      chrome.action.setBadgeText({ text: state.viralDetected.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    }
    return { ok: true, state };
  }
  return { ok: false };
}

/**
 * Proxy API requests through background script to avoid CORS.
 * Supports API response caching.
 */
async function handleApiRequest(message) {
  const { endpoint, method = 'GET', body, headers = {} } = message;
  const cacheKey = `req_${method}_${endpoint}_${JSON.stringify(body || {})}`;

  // Check cache for GET requests
  if (method === 'GET') {
    const cache = await chromeStorageGet(API_CACHE_KEY) || {};
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.ts < API_CACHE_TTL) {
      return cached.data;
    }
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const options = { method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (body && method !== 'GET') options.body = JSON.stringify(body);

    const resp = await fetch(url, options);
    const data = await resp.json();
    const result = { ok: resp.ok, status: resp.status, data };

    // Cache GET responses
    if (method === 'GET' && resp.ok) {
      const cache = await chromeStorageGet(API_CACHE_KEY) || {};
      cache[cacheKey] = { data: result, ts: Date.now() };
      // Keep cache size bounded
      const keys = Object.keys(cache);
      if (keys.length > 200) {
        const oldest = keys.sort((a, b) => cache[a].ts - cache[b].ts).slice(0, 50);
        oldest.forEach(k => delete cache[k]);
      }
      await chromeStorageSet(API_CACHE_KEY, cache);
    }

    return result;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * BATCH_DATA: Receive scraped data from content scripts.
 * Stores in batch queue, updates stats, tracks analyzed IDs.
 */
async function handleBatchData(payload, sender) {
  if (!payload || !payload.items || payload.items.length === 0) {
    return { ok: true, queued: 0 };
  }

  const platform = payload.platform || 'unknown';
  const items = payload.items;
  const now = Date.now();

  // Get current state
  const state = await chromeStorageGet(STORAGE_KEY) || {};
  let batchQueue = await chromeStorageGet(BATCH_QUEUE_KEY) || [];
  let analyzedIds = await chromeStorageGet(ANALYZED_IDS_KEY) || [];
  const platformBreakdown = state.platformBreakdown || { youtube: 0, tiktok: 0, twitter: 0 };

  let newItems = 0;
  let viralCount = 0;
  let insightCount = 0;

  for (const item of items) {
    const itemId = item.videoId || item.tweetId || item.username || item.channelId || `${item.url}_${item.scrapedAt}`;
    const dedupeKey = `${platform}:${itemId}`;

    // Skip already-analyzed items
    if (analyzedIds.includes(dedupeKey)) continue;

    analyzedIds.push(dedupeKey);
    newItems++;

    // Track viral detections
    if (item.likes || item.likeCount) {
      const likes = item.likes || item.likeCount || 0;
      const views = item.views || 0;
      if (views > 0 && (likes / views) > 0.05) viralCount++;
    }
    if (item.recommendations && item.recommendations.length > 0) insightCount += item.recommendations.length;
    if (item.comments && item.comments.length > 0) insightCount += item.comments.length;

    // Enqueue for API sync
    batchQueue.push({
      ...item,
      _receivedAt: now,
      _senderTabId: sender.tab?.id,
      _senderUrl: sender.tab?.url || payload.url,
    });
  }

  // Trim batch queue
  if (batchQueue.length > MAX_BATCH_QUEUE) {
    batchQueue = batchQueue.slice(-MAX_BATCH_QUEUE);
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
  if (platform === 'youtube') {
    if (items.some(i => i.dataType === 'video')) state.videosAnalyzed = (state.videosAnalyzed || 0) + 1;
  }
  if (platform === 'tiktok') {
    if (items.some(i => i.dataType === 'profile' || i.dataType === 'video')) state.tiktokProfilesAnalyzed = (state.tiktokProfilesAnalyzed || 0) + 1;
  }
  if (platform === 'twitter') {
    if (items.some(i => i.dataType === 'profile' || i.dataType === 'tweet')) state.twitterProfilesAnalyzed = (state.twitterProfilesAnalyzed || 0) + 1;
  }

  // Update badge
  if (state.viralDetected > 0) {
    chrome.action.setBadgeText({ text: state.viralDetected.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  }

  // Persist
  await chromeStorageSet(BATCH_QUEUE_KEY, batchQueue);
  await chromeStorageSet(ANALYZED_IDS_KEY, analyzedIds);
  await chromeStorageSet(STORAGE_KEY, state);

  return { ok: true, queued: newItems, totalQueue: batchQueue.length };
}

/**
 * GET_STATS: Return aggregated stats for popup display.
 */
async function handleGetStats() {
  const state = await chromeStorageGet(STORAGE_KEY) || {};
  const batchQueue = await chromeStorageGet(BATCH_QUEUE_KEY) || [];
  return {
    ...state,
    queueSize: batchQueue.length,
  };
}

/**
 * EXPORT_DATA: Return all batch data for JSON export.
 */
async function handleExportData() {
  const batchQueue = await chromeStorageGet(BATCH_QUEUE_KEY) || [];
  const state = await chromeStorageGet(STORAGE_KEY) || {};
  const analyzedIds = await chromeStorageGet(ANALYZED_IDS_KEY) || [];
  return {
    exportedAt: new Date().toISOString(),
    state,
    totalItems: batchQueue.length,
    totalAnalyzedIds: analyzedIds.length,
    items: batchQueue,
  };
}

/* ═══════════════════════════════════════════════════════════════
   PERIODIC SYNC: Send batched data to Worker API
   ═══════════════════════════════════════════════════════════════ */

chrome.alarms.create('syncStats', { periodInMinutes: SYNC_INTERVAL_MINUTES });
chrome.alarms.create('pruneCache', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncStats') {
    await syncBatchToAPI();
  }
  if (alarm.name === 'pruneCache') {
    await pruneAPICache();
  }
});

/**
 * Send accumulated scraped data to the NychIQ Worker API in batches.
 */
async function syncBatchToAPI() {
  const state = await chromeStorageGet(STORAGE_KEY) || {};
  if (!state.connected) return;

  let batchQueue = await chromeStorageGet(BATCH_QUEUE_KEY) || [];
  if (batchQueue.length === 0) return;

  // Take a chunk to send
  const chunkSize = 50;
  const chunk = batchQueue.slice(0, chunkSize);
  const remaining = batchQueue.slice(chunkSize);

  try {
    const resp = await fetch(`${API_BASE}/scrape/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: chunk,
        syncedAt: new Date().toISOString(),
        extensionVersion: '3.0.0',
      }),
    });

    if (resp.ok) {
      // Remove sent items from queue
      await chromeStorageSet(BATCH_QUEUE_KEY, remaining);
      state.lastSync = new Date().toISOString();
      await chromeStorageSet(STORAGE_KEY, state);
      console.debug(`[NychIQ] Synced ${chunk.length} items to API. ${remaining.length} remaining.`);
    } else {
      console.debug(`[NychIQ] API sync failed: ${resp.status}`);
    }
  } catch (err) {
    console.debug(`[NychIQ] API sync error: ${err.message}`);
    // Don't clear queue on failure — retry next cycle
  }
}

/**
 * Prune expired API cache entries.
 */
async function pruneAPICache() {
  const cache = await chromeStorageGet(API_CACHE_KEY) || {};
  const keys = Object.keys(cache);
  const now = Date.now();
  let pruned = 0;
  for (const key of keys) {
    if (now - cache[key].ts > API_CACHE_TTL) {
      delete cache[key];
      pruned++;
    }
  }
  if (pruned > 0) {
    await chromeStorageSet(API_CACHE_KEY, cache);
    console.debug(`[NychIQ] Pruned ${pruned} expired cache entries.`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   TAB NAVIGATION TRACKING
   ═══════════════════════════════════════════════════════════════ */

const PLATFORM_URLS = ['youtube.com', 'tiktok.com', 'twitter.com', 'x.com'];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isPlatform = PLATFORM_URLS.some(host => tab.url.includes(host));
    if (isPlatform) {
      chrome.tabs.sendMessage(tabId, { type: 'REINJECT' }).catch(() => {});
    }
  }
});

/* ═══════════════════════════════════════════════════════════════
   CROSS-TAB DATA AGGREGATION
   ═══════════════════════════════════════════════════════════════ */

/**
 * Collect data from all open platform tabs.
 */
async function aggregateFromAllTabs() {
  const tabs = await chrome.tabs.query({ url: PLATFORM_URLS.map(h => `*://*.${h}/*`) });
  const results = [];

  for (const tab of tabs) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });
      if (response && response.payload && response.payload.items) {
        results.push({ tabId: tab.id, url: tab.url, ...response.payload });
      }
    } catch {
      // Tab not ready or content script not injected
    }
  }

  return results;
}

/* ═══════════════════════════════════════════════════════════════
   STORAGE HELPERS (Promise-wrapped)
   ═══════════════════════════════════════════════════════════════ */

function chromeStorageGet(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

function chromeStorageSet(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}
