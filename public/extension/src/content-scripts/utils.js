/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Shared Content Script Utilities
   Used by ALL platform content scripts
   ══════════════════════════════════════════════════════════════════ */

/**
 * Parse count strings like "1.2K", "3.5M", "456,789" into integers.
 */
function parseCount(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  str = String(str).replace(/,/g, '').replace(/\s/g, '').trim();
  const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
  const match = str.match(/^([\d.]+)([KMBT]?)$/i);
  if (match) return Math.round(parseFloat(match[1]) * (mult[match[2].toUpperCase()] || 1));
  return parseInt(str, 10) || 0;
}

/**
 * Format large numbers for display.
 */
function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

/**
 * Envelope every scraped record with metadata.
 */
function envelope(platform, dataType, data, source) {
  return {
    platform,
    dataType,
    scrapedAt: new Date().toISOString(),
    source: source || 'dom',
    reliability: computeReliability(data),
    url: window.location.href,
    ...data,
  };
}

/**
 * Heuristic reliability score 0-100 based on field population.
 */
function computeReliability(data) {
  if (!data || typeof data !== 'object') return 0;
  const fields = Object.values(data).filter(v => v !== undefined && v !== null && v !== '' && v !== 0);
  const total = Object.keys(data).length;
  if (total === 0) return 0;
  return Math.min(100, Math.round((fields.length / total) * 100));
}

/**
 * Safe JSON.parse with fallback.
 */
function safeJSONParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

/**
 * Debounce helper.
 */
function debounce(fn, ms) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

/**
 * Sleep for ms.
 */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Search all script tags for a regex match and return parsed JSON.
 */
function extractFromScript(regex) {
  for (const s of document.querySelectorAll('script')) {
    const text = s.textContent || '';
    const match = text.match(regex);
    if (match) return safeJSONParse(match[1]);
  }
  return null;
}

/**
 * Detect current platform from hostname.
 */
function detectPlatform() {
  const h = window.location.hostname;
  if (/^(www\.)?youtube\.com$/.test(h)) return 'youtube';
  if (/^studio\.youtube\.com$/.test(h)) return 'youtube-studio';
  if (/^(www\.)?tiktok\.com$/.test(h)) return 'tiktok';
  if (/^(www\.)?(twitter|x)\.com$/.test(h)) return 'twitter';
  if (/^(www\.)?instagram\.com$/.test(h)) return 'instagram';
  return null;
}

/**
 * Send scraped data to background service worker.
 */
function sendToBackground(platform, items) {
  if (!items || items.length === 0) return;
  try {
    chrome.runtime.sendMessage({
      type: 'BATCH_DATA',
      payload: { platform, items, url: window.location.href },
    }).catch(() => {}); // background might not be ready
  } catch {
    // Extension context invalidated
  }
}

/**
 * Set up MutationObserver to detect SPA navigations.
 */
function watchNavigation(callback) {
  let lastUrl = window.location.href;

  // History API pushState/replaceState interception
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      callback();
    }
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      callback();
    }
  };

  window.addEventListener('popstate', () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      callback();
    }
  });
}

/**
 * Set up message listener for REINJECT and GET_PAGE_DATA.
 */
function setupMessageListener(getPageDataFn) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REINJECT') {
      sendResponse({ ok: true });
      return false;
    }
    if (message.type === 'GET_PAGE_DATA' && getPageDataFn) {
      const data = getPageDataFn();
      sendResponse({ payload: data });
      return false;
    }
    return false;
  });
}
