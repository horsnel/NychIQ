/* ══════════════════════════════════════════════════════════════════
   NychIQ Chrome Extension v3.0 — Popup Logic
   Multi-platform stats, deep scraping toggle, JSON export
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Elements ── */
  const viewDisconnected = document.getElementById('view-disconnected');
  const viewConnected = document.getElementById('view-connected');
  const btnConnect = document.getElementById('btn-connect');
  const btnDisconnect = document.getElementById('btn-disconnect');
  const btnDashboard = document.getElementById('btn-dashboard');
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnExport = document.getElementById('btn-export');
  const toggleBadges = document.getElementById('toggle-badges');
  const toggleAuto = document.getElementById('toggle-auto');
  const toggleDeep = document.getElementById('toggle-deep');

  const statVideos = document.getElementById('stat-videos');
  const statInsights = document.getElementById('stat-insights');
  const statViral = document.getElementById('stat-viral');
  const statTotal = document.getElementById('stat-total');
  const statYoutubeBreakdown = document.getElementById('stat-youtube-breakdown');
  const statTiktokBreakdown = document.getElementById('stat-tiktok-breakdown');
  const statTwitterBreakdown = document.getElementById('stat-twitter-breakdown');
  const statQueue = document.getElementById('stat-queue');
  const queueFill = document.getElementById('queue-fill');
  const syncDot = document.getElementById('sync-dot');
  const syncStatusText = document.getElementById('sync-status-text');

  /* ── State ── */
  const STORAGE_KEY = 'nychiq_ext_state';

  function getDefaultState() {
    return {
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
      totalDataPoints: 0,
      platformBreakdown: { youtube: 0, tiktok: 0, twitter: 0 },
      lastSync: null,
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
      statVideos.textContent = state.videosAnalyzed || 0;
      statInsights.textContent = state.insightsFound || 0;
      statViral.textContent = state.viralDetected || 0;
      statTotal.textContent = state.totalDataPoints || 0;

      const pb = state.platformBreakdown || {};
      statYoutubeBreakdown.textContent = pb.youtube || 0;
      statTiktokBreakdown.textContent = pb.tiktok || 0;
      statTwitterBreakdown.textContent = pb.twitter || 0;

      // Sync status
      if (state.lastSync) {
        const ago = getTimeSince(state.lastSync);
        syncStatusText.textContent = `Last sync: ${ago}`;
        syncDot.classList.add('active');
      }

      toggleBadges.checked = state.showBadges !== false;
      toggleAuto.checked = state.autoAnalyze === true;
      toggleDeep.checked = state.deepScraping === true;
    } else {
      viewDisconnected.classList.remove('hidden');
      viewConnected.classList.add('hidden');
    }
  }

  function updateQueueInfo(queueSize) {
    const maxQueue = 500;
    statQueue.textContent = `${queueSize} / ${maxQueue}`;
    queueFill.style.width = `${Math.min((queueSize / maxQueue) * 100, 100)}%`;

    // Color the bar based on fullness
    if (queueSize > 400) {
      queueFill.style.background = '#EF4444';
    } else if (queueSize > 200) {
      queueFill.style.background = 'linear-gradient(90deg, #FDBA2D, #EF4444)';
    } else {
      queueFill.style.background = 'linear-gradient(90deg, #FDBA2D, #8B5CF6)';
    }
  }

  function getTimeSince(isoString) {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return 'unknown';
    }
  }

  /* ── Refresh stats from background ── */

  async function refreshStats() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
      if (response) {
        updateUI(response);
        updateQueueInfo(response.queueSize || 0);
      }
    } catch {
      // Fallback: load from storage
      const state = await loadState();
      updateUI(state);
    }
  }

  /* ── Event Listeners ── */

  // Connect
  btnConnect.addEventListener('click', async () => {
    const state = await loadState();
    state.connected = true;
    await saveState(state);
    updateUI(state);
    chrome.runtime.sendMessage({ type: 'STATE_CHANGED', state });
  });

  // Disconnect
  btnDisconnect.addEventListener('click', async () => {
    const state = await loadState();
    state.connected = false;
    await saveState(state);
    updateUI(state);
    chrome.runtime.sendMessage({ type: 'STATE_CHANGED', state });
  });

  // Analyze current page
  btnAnalyze.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    const platformUrls = ['youtube.com', 'tiktok.com', 'twitter.com', 'x.com'];
    const isPlatform = platformUrls.some(host => tab.url.includes(host));

    if (isPlatform) {
      chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_PAGE' });
      window.close();
    } else {
      alert('Please navigate to a YouTube, TikTok, or Twitter/X page first.');
    }
  });

  // Export data as JSON
  btnExport.addEventListener('click', async () => {
    btnExport.textContent = 'Exporting...';
    btnExport.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' });
      if (response) {
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nychiq-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        btnExport.textContent = 'Exported!';
        setTimeout(() => { btnExport.textContent = 'Export JSON'; btnExport.disabled = false; }, 2000);
      }
    } catch (err) {
      alert('Export failed: ' + err.message);
      btnExport.textContent = 'Export JSON';
      btnExport.disabled = false;
    }
  });

  // Toggle badges
  toggleBadges.addEventListener('change', async () => {
    const state = await loadState();
    state.showBadges = toggleBadges.checked;
    await saveState(state);
    notifyContentScripts(state);
  });

  // Toggle auto-collect
  toggleAuto.addEventListener('change', async () => {
    const state = await loadState();
    state.autoAnalyze = toggleAuto.checked;
    await saveState(state);
    notifyContentScripts(state);
  });

  // Toggle deep scraping
  toggleDeep.addEventListener('change', async () => {
    const state = await loadState();
    state.deepScraping = toggleDeep.checked;
    await saveState(state);
    notifyContentScripts(state);
  });

  function notifyContentScripts(state) {
    const platformUrls = ['*://*.youtube.com/*', '*://*.tiktok.com/*', '*://*.twitter.com/*', '*://*.x.com/*'];
    chrome.tabs.query({ url: platformUrls }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_CHANGED',
          settings: {
            showBadges: state.showBadges,
            autoAnalyze: state.autoAnalyze,
            deepScraping: state.deepScraping,
          },
        }).catch(() => {});
      });
    });
  }

  /* ── Initialize ── */
  refreshStats();

  // Refresh stats periodically while popup is open
  const refreshInterval = setInterval(refreshStats, 3000);
  window.addEventListener('unload', () => clearInterval(refreshInterval));
})();
