/* ══════════════════════════════════════════════════
   NychIQ Chrome Extension — Background Service Worker
   ══════════════════════════════════════════════════ */

const STORAGE_KEY = 'nychiq_ext_state';

/* ── Install handler ── */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default state
    chrome.storage.local.set({
      [STORAGE_KEY]: {
        connected: false,
        videosAnalyzed: 0,
        insightsFound: 0,
        viralDetected: 0,
        tokensLeft: 0,
        showBadges: true,
        autoAnalyze: false,
      },
    });

    // Set initial badge
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#FDBA2D' });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://nychiq.com',
    });
  }
});

/* ── Message handler ── */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATE_CHANGED') {
    const state = message.state;

    if (state.connected) {
      // Show badge count when connected
      const count = state.viralDetected > 0 ? state.viralDetected.toString() : '';
      chrome.action.setBadgeText({ text: count });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });

      // Notify all YouTube tabs to re-inject
      chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: 'REINJECT' }).catch(() => {});
        });
      });
    } else {
      chrome.action.setBadgeText({ text: '' });

      // Notify tabs to remove badges
      chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_CHANGED', settings: { showBadges: false } }).catch(() => {});
        });
      });
    }

    sendResponse({ ok: true });
  }

  if (message.type === 'INCREMENT_STAT') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      const stat = message.stat; // 'videosAnalyzed' | 'insightsFound' | 'viralDetected'

      if (state[stat] !== undefined) {
        state[stat] = (state[stat] || 0) + 1;
        chrome.storage.local.set({ [STORAGE_KEY]: state });

        // Update badge if viral detected
        if (stat === 'viralDetected') {
          const count = state.viralDetected.toString();
          chrome.action.setBadgeText({ text: count });
          chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
        }
      }

      sendResponse({ ok: true, state });
    });

    return true; // Keep message channel open for async response
  }

  return false;
});

/* ── Tab update: refresh content script when navigating ── */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    chrome.tabs.sendMessage(tabId, { type: 'REINJECT' }).catch(() => {});
  }
});
