/* ══════════════════════════════════════════════════
   NychIQ Chrome Extension — Popup Logic
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Elements ── */
  const viewDisconnected = document.getElementById('view-disconnected');
  const viewConnected = document.getElementById('view-connected');
  const btnConnect = document.getElementById('btn-connect');
  const btnDisconnect = document.getElementById('btn-disconnect');
  const btnDashboard = document.getElementById('btn-dashboard');
  const btnAnalyze = document.getElementById('btn-analyze');
  const toggleBadges = document.getElementById('toggle-badges');
  const toggleAuto = document.getElementById('toggle-auto');

  const statVideos = document.getElementById('stat-videos');
  const statInsights = document.getElementById('stat-insights');
  const statViral = document.getElementById('stat-viral');
  const statTokens = document.getElementById('stat-tokens');

  /* ── State ── */
  const STORAGE_KEY = 'nychiq_ext_state';

  function getDefaultState() {
    return {
      connected: false,
      videosAnalyzed: 0,
      insightsFound: 0,
      viralDetected: 0,
      tokensLeft: 0,
      showBadges: true,
      autoAnalyze: false,
    };
  }

  async function loadState() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || getDefaultState());
      });
    });
  }

  async function saveState(state) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: state }, resolve);
    });
  }

  /* ── UI Updates ── */
  function updateUI(state) {
    if (state.connected) {
      viewDisconnected.classList.add('hidden');
      viewConnected.classList.remove('hidden');
      statVideos.textContent = state.videosAnalyzed;
      statInsights.textContent = state.insightsFound;
      statViral.textContent = state.viralDetected;
      statTokens.textContent = state.tokensLeft;
      toggleBadges.checked = state.showBadges;
      toggleAuto.checked = state.autoAnalyze;
    } else {
      viewDisconnected.classList.remove('hidden');
      viewConnected.classList.add('hidden');
    }
  }

  /* ── Event Listeners ── */
  btnConnect.addEventListener('click', async () => {
    const state = await loadState();
    state.connected = true;
    state.videosAnalyzed = 12;
    state.insightsFound = 47;
    state.viralDetected = 3;
    state.tokensLeft = 85;
    await saveState(state);
    updateUI(state);

    // Notify background
    chrome.runtime.sendMessage({ type: 'STATE_CHANGED', state });
  });

  btnDisconnect.addEventListener('click', async () => {
    const state = await loadState();
    state.connected = false;
    await saveState(state);
    updateUI(state);

    // Notify background
    chrome.runtime.sendMessage({ type: 'STATE_CHANGED', state });
  });

  btnAnalyze.addEventListener('click', async () => {
    // Get current tab and send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('youtube.com')) {
      chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_PAGE' });
      window.close();
    } else {
      alert('Please navigate to a YouTube page first.');
    }
  });

  toggleBadges.addEventListener('change', async () => {
    const state = await loadState();
    state.showBadges = toggleBadges.checked;
    await saveState(state);

    // Notify content scripts
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_CHANGED',
          settings: { showBadges: state.showBadges, autoAnalyze: state.autoAnalyze },
        }).catch(() => {});
      });
    });
  });

  toggleAuto.addEventListener('change', async () => {
    const state = await loadState();
    state.autoAnalyze = toggleAuto.checked;
    await saveState(state);

    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_CHANGED',
          settings: { showBadges: state.showBadges, autoAnalyze: state.autoAnalyze },
        }).catch(() => {});
      });
    });
  });

  /* ── Initialize ── */
  loadState().then(updateUI);
})();
