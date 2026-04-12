/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Background Service Worker (Main)
   Entry point: routes messages, manages state, tab tracking
   ══════════════════════════════════════════════════════════════════ */

import { setupAuthListener, storeToken, clearToken, validateToken, getToken } from './auth-bridge.js';
import { initSync, forceSync, enqueueItems } from './sync-manager.js';
import { fetchBalance, getBalance, decrementTokens } from './token-cache.js';
import { getQueueSize } from './offline-queue.js';
// AI modules imported for message handler routing
import { analyze as sentimentAnalyze, getOverallSentiment } from '../ai/sentiment-analysis.js';
import { classifyNiche } from '../ai/content-classification.js';
import { scoreHook, suggestImprovements } from '../ai/hook-scoring.js';
import { analyzeSEO, generateVariants } from '../ai/title-optimizer.js';

const STORAGE_KEY = 'nychiq_ext_state';
const BATCH_QUEUE_KEY = 'nychiq_batch_queue';
const ANALYZED_IDS_KEY = 'nychiq_analyzed_ids';
const API_CACHE_KEY = 'nychiq_api_cache';
const API_BASE = 'https://nychiq.com/api';
const API_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const PLATFORM_HOSTS = ['youtube.com', 'tiktok.com', 'twitter.com', 'x.com', 'studio.youtube.com', 'instagram.com'];
const PLATFORM_URLS = PLATFORM_HOSTS.map(h => `*://*.${h}/*`);

/* ═══════════════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════════════ */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      [STORAGE_KEY]: {
        connected: false,
        videosAnalyzed: 0,
        tiktokProfilesAnalyzed: 0,
        twitterProfilesAnalyzed: 0,
        instagramProfilesAnalyzed: 0,
        insightsFound: 0,
        viralDetected: 0,
        tokensLeft: 0,
        showBadges: true,
        autoAnalyze: false,
        deepScraping: false,
        apiBase: API_BASE,
        lastSync: null,
        totalDataPoints: 0,
        platformBreakdown: { youtube: 0, tiktok: 0, twitter: 0, instagram: 0 },
        jwt: null,
        userId: null,
      },
      [BATCH_QUEUE_KEY]: [],
      [ANALYZED_IDS_KEY]: [],
      [API_CACHE_KEY]: {},
    });
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#FDBA2D' });
    // Open welcome page
    chrome.tabs.create({ url: 'https://nychiq.com' });
  }

  if (details.reason === 'update') {
    migrateStorage();
  }
});

function migrateStorage() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const state = result[STORAGE_KEY] || {};
    const defaults = {
      instagramProfilesAnalyzed: 0,
      deepScraping: false,
      totalDataPoints: 0,
      jwt: null,
      userId: null,
      platformBreakdown: state.platformBreakdown || { youtube: 0, tiktok: 0, twitter: 0, instagram: 0 },
    };
    for (const key of Object.keys(defaults)) {
      if (state[key] === undefined) state[key] = defaults[key];
    }
    if (!state.platformBreakdown) {
      state.platformBreakdown = { youtube: 0, tiktok: 0, twitter: 0, instagram: 0 };
    }
    if (!state.platformBreakdown.instagram) {
      state.platformBreakdown.instagram = 0;
    }
    chrome.storage.local.set({ [STORAGE_KEY]: state });
  });
}

/* ═══════════════════════════════════════════════════════════════
   MODULE INITIALIZATION
   ═══════════════════════════════════════════════════════════════ */

setupAuthListener();
initSync();

/* ═══════════════════════════════════════════════════════════════
   MESSAGE ROUTER
   ═══════════════════════════════════════════════════════════════ */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message, sender).then(sendResponse).catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true; // async response
  }

  // Auth messages handled by auth-bridge.js setupAuthListener
  return false;
});

const messageHandlers = {
  STATE_CHANGED: handleStateChange,
  INCREMENT_STAT: handleIncrementStat,
  API_REQUEST: handleApiRequest,
  BATCH_DATA: handleBatchData,
  GET_STATS: handleGetStats,
  EXPORT_DATA: handleExportData,
  CLEAR_DATA: handleClearData,
  SYNC_NOW: handleSyncNow,
  GET_BALANCE: handleGetBalance,
  DECREMENT_TOKENS: handleDecrementTokens,
  REFRESH_BALANCE: handleRefreshBalance,
  GET_QUEUE_SIZE: handleGetQueueSize,
  AI_SENTIMENT: handleAISentiment,
  AI_CLASSIFY_NICHE: handleAIClassifyNiche,
  AI_SCORE_HOOK: handleAIScoreHook,
  AI_ANALYZE_SEO: handleAIAnalyzeSEO,
  AI_GENERATE_VARIANTS: handleAIGenerateVariants,
  AI_SUGGEST_IMPROVEMENTS: handleAISuggestImprovements,
};

/* ═══════════════════════════════════════════════════════════════
   MESSAGE HANDLERS
   ═══════════════════════════════════════════════════════════════ */

async function handleStateChange(message) {
  const stateUpdate = message.state;
  if (!stateUpdate) return { ok: false };

  // Merge partial state update with existing state
  const currentState = await chromeStorageGet(STORAGE_KEY) || {};
  const state = { ...currentState, ...stateUpdate };

  if (state.connected) {
    const count = state.viralDetected > 0 ? state.viralDetected.toString() : '';
    chrome.action.setBadgeText({ text: count });
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    // Only broadcast REINJECT on connection or deep scraping state changes
    if (stateUpdate.connected !== undefined || stateUpdate.deepScraping !== undefined) {
      chrome.tabs.query({ url: PLATFORM_URLS }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: 'REINJECT' }).catch(() => {});
        });
      });
    }
  } else {
    chrome.action.setBadgeText({ text: '' });
  }

  await chromeStorageSet(STORAGE_KEY, state);
  return { ok: true };
}

async function handleIncrementStat(message) {
  const state = await chromeStorageGet(STORAGE_KEY) || {};
  const stat = message.stat;
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

  const jwt = await getToken();
  const url = `${API_BASE}${endpoint}`;

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (jwt) options.headers['Authorization'] = `Bearer ${jwt}`;
    if (body && method !== 'GET') options.body = JSON.stringify(body);

    const resp = await fetch(url, options);
    const data = await resp.json();
    const result = { ok: resp.ok, status: resp.status, data };

    // Cache GET responses
    if (method === 'GET' && resp.ok) {
      const cache = await chromeStorageGet(API_CACHE_KEY) || {};
      cache[cacheKey] = { data: result, ts: Date.now() };
      // Keep cache bounded
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

async function handleBatchData(message, sender) {
  const { payload } = message;
  if (!payload?.items?.length) return { ok: true, queued: 0 };

  const platform = payload.platform || 'unknown';
  return enqueueItems(payload.items, platform, sender);
}

async function handleGetStats() {
  const state = await chromeStorageGet(STORAGE_KEY) || {};
  const batchQueue = await chromeStorageGet(BATCH_QUEUE_KEY) || [];
  const offlineSize = await getQueueSize();
  return {
    ...state,
    queueSize: batchQueue.length + offlineSize,
  };
}

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

async function handleClearData() {
  await chromeStorageSet(BATCH_QUEUE_KEY, []);
  await chromeStorageSet(ANALYZED_IDS_KEY, []);
  const state = await chromeStorageGet(STORAGE_KEY) || {};
  state.videosAnalyzed = 0;
  state.tiktokProfilesAnalyzed = 0;
  state.twitterProfilesAnalyzed = 0;
  state.instagramProfilesAnalyzed = 0;
  state.insightsFound = 0;
  state.viralDetected = 0;
  state.totalDataPoints = 0;
  state.platformBreakdown = { youtube: 0, tiktok: 0, twitter: 0, instagram: 0 };
  await chromeStorageSet(STORAGE_KEY, state);
  chrome.action.setBadgeText({ text: '' });
  return { ok: true };
}

async function handleSyncNow() {
  return forceSync();
}

async function handleGetBalance() {
  return getBalance();
}

async function handleDecrementTokens(message) {
  return decrementTokens(message.count || 1);
}

async function handleRefreshBalance() {
  return fetchBalance();
}

async function handleGetQueueSize() {
  const size = await getQueueSize();
  return { size };
}

async function handleAISentiment(message) {
  const { text, comments } = message;
  if (comments && Array.isArray(comments)) {
    return getOverallSentiment(comments);
  }
  return sentimentAnalyze(text);
}

function handleAIClassifyNiche(message) {
  const { title, description, tags } = message;
  return classifyNiche(title, description, tags);
}

function handleAIScoreHook(message) {
  const { title } = message;
  return scoreHook(title);
}

function handleAIAnalyzeSEO(message) {
  const { title, description, tags } = message;
  return analyzeSEO(title, description, tags);
}

function handleAIGenerateVariants(message) {
  const { title, count } = message;
  return generateVariants(title, count || 5);
}

function handleAISuggestImprovements(message) {
  const { title, niche } = message;
  return suggestImprovements(title, niche);
}

/* ═══════════════════════════════════════════════════════════════
   TAB NAVIGATION TRACKING
   ═══════════════════════════════════════════════════════════════ */

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isPlatform = PLATFORM_HOSTS.some(host => tab.url.includes(host));
    if (isPlatform) {
      chrome.tabs.sendMessage(tabId, { type: 'REINJECT' }).catch(() => {});
    }
  }
});

/* ═══════════════════════════════════════════════════════════════
   STORAGE HELPERS
   ═══════════════════════════════════════════════════════════════ */

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
