/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Popup Logic v4.0
   ══════════════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  setupToggles();
  setupButtons();
});

// ── Stats ──
function loadStats() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
    if (!response) return;

    $('statVideos').textContent = formatNum(response.videosAnalyzed || 0);
    $('statDataPoints').textContent = formatNum(response.totalDataPoints || 0);
    $('statViral').textContent = formatNum(response.viralDetected || 0);
    $('statQueue').textContent = formatNum(response.queueSize || 0);

    // Connection status
    const dot = $('statusDot');
    if (response.connected) {
      dot.classList.add('connected');
    } else {
      dot.classList.remove('connected');
    }

    // Platform activity
    const pb = response.platformBreakdown || {};
    $('pYouTube').classList.toggle('active', (pb.youtube || 0) > 0);
    $('pTikTok').classList.toggle('active', (pb.tiktok || 0) > 0);
    $('pTwitter').classList.toggle('active', (pb.twitter || 0) > 0);
    $('pInstagram').classList.toggle('active', (pb.instagram || 0) > 0);

    // Tokens
    updateTokens(response.tokensLeft || 0);

    // Sync info
    if (response.lastSync) {
      const ago = timeSince(new Date(response.lastSync));
      $('syncStatus').textContent = `Last sync: ${ago}`;
    }

    // Toggles
    $('toggleAuto').classList.toggle('on', !!response.autoAnalyze);
    $('toggleDeep').classList.toggle('on', !!response.deepScraping);
    $('toggleBadges').classList.toggle('on', response.showBadges !== false);
  });
}

function updateTokens(count, maxTokens) {
  const max = maxTokens || (count > 0 ? Math.max(count * 2, 1000) : 1000);
  $('tokensLeft').textContent = `${formatNum(count)} tokens left`;
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  $('tokensFill').style.width = pct + '%';
  $('tokensStatus').textContent = pct > 50 ? 'Healthy' : pct > 20 ? 'Low' : 'Critical';
  $('tokensStatus').style.color = pct > 50 ? '#10B981' : pct > 20 ? '#FDBA2D' : '#EF4444';
}

// ── Toggles ──
function setupToggles() {
  createToggle('toggleAuto', 'autoAnalyze');
  createToggle('toggleDeep', 'deepScraping');
  createToggle('toggleBadges', 'showBadges');
}

function createToggle(elId, stateKey) {
  $(elId).addEventListener('click', () => {
    const btn = $(elId);
    const isOn = btn.classList.toggle('on');
    // Send only the changed key to avoid race conditions with other state
    chrome.runtime.sendMessage({ type: 'STATE_CHANGED', state: { [stateKey]: isOn } });
  });
}

// ── Buttons ──
function setupButtons() {
  // Sync Now
  $('btnSyncNow').addEventListener('click', () => {
    $('syncSpinner').classList.add('active');
    $('syncStatus').textContent = 'Syncing...';
    $('btnSyncNow').disabled = true;

    chrome.runtime.sendMessage({ type: 'SYNC_NOW' }, (response) => {
      $('syncSpinner').classList.remove('active');
      $('btnSyncNow').disabled = false;

      if (response?.ok) {
        $('syncStatus').textContent = `Synced ${response.synced || 0} items`;
        loadStats();
      } else {
        $('syncStatus').textContent = 'Sync failed — retrying next cycle';
      }
    });
  });

  // Export Data
  $('btnExport').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'EXPORT_DATA' }, (response) => {
      if (!response) return;
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nychiq-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Clear Data
  $('btnClear').addEventListener('click', () => {
    if (confirm('Clear all scraped data? This cannot be undone.')) {
      chrome.runtime.sendMessage({ type: 'CLEAR_DATA' }, () => {
        loadStats();
        $('syncStatus').textContent = 'Data cleared';
      });
    }
  });
}

// ── Helpers ──
function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function timeSince(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
