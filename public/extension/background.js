/* ══════════════════════════════════════════════════
   NychIQ Chrome Extension v2.0 — Background Service Worker
   API coordination, data aggregation, tab management
   ══════════════════════════════════════════════════ */

const STORAGE_KEY = 'nychiq_ext_state';
const API_BASE = 'https://nychiq.com/api';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      [STORAGE_KEY]: {
        connected: false, videosAnalyzed: 0, insightsFound: 0,
        viralDetected: 0, tokensLeft: 0, showBadges: true, autoAnalyze: false,
        apiBase: API_BASE, lastSync: null,
      },
    });
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#FDBA2D' });
    chrome.tabs.create({ url: 'https://nychiq.com' });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATE_CHANGED') {
    const state = message.state;
    if (state.connected) {
      const count = state.viralDetected > 0 ? state.viralDetected.toString() : '';
      chrome.action.setBadgeText({ text: count });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
      chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, { type: 'REINJECT' }).catch(() => {}));
      });
    } else {
      chrome.action.setBadgeText({ text: '' });
      chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_CHANGED', settings: { showBadges: false } }).catch(() => {}));
      });
    }
    sendResponse({ ok: true });
  }

  if (message.type === 'INCREMENT_STAT') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      const stat = message.stat;
      if (state[stat] !== undefined) {
        state[stat] = (state[stat] || 0) + 1;
        chrome.storage.local.set({ [STORAGE_KEY]: state });
        if (stat === 'viralDetected') {
          chrome.action.setBadgeText({ text: state.viralDetected.toString() });
          chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
        }
      }
      sendResponse({ ok: true, state });
    });
    return true;
  }

  // Handle API proxy requests from content scripts
  if (message.type === 'API_REQUEST') {
    handleApiRequest(message).then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }

  return false;
});

// Proxy API calls through background script (avoids CORS issues)
async function handleApiRequest(message) {
  const { endpoint, method = 'GET', body, headers = {} } = message;
  const url = `${API_BASE}${endpoint}`;

  try {
    const options = { method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (body && method !== 'GET') options.body = JSON.stringify(body);

    const resp = await fetch(url, options);
    const data = await resp.json();
    return { ok: resp.ok, status: resp.status, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Auto-sync stats every 30 minutes
chrome.alarms.create('syncStats', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncStats') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      if (state.connected) {
        state.lastSync = new Date().toISOString();
        chrome.storage.local.set({ [STORAGE_KEY]: state });
      }
    });
  }
});

// Tab navigation tracking
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('youtube.com') || tab.url.includes('tiktok.com') || tab.url.includes('twitter.com') || tab.url.includes('x.com')) {
      chrome.tabs.sendMessage(tabId, { type: 'REINJECT' }).catch(() => {});
    }
  }
});
