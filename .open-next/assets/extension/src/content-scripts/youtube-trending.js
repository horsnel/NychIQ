/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — YouTube Trending Scraper
   Scrapes trending page (/feed/trending) with category detection
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  if (window.__nychiq_initialized) return;
  window.__nychiq_initialized = true;

  const CACHE_TTL = 30 * 60 * 1000;
  let lastScrape = 0;

  chrome.storage.local.get('nychiq_ext_state', () => {
    // Only run on trending page
    if (window.location.pathname.includes('/feed/trending')) {
      runScrape();
    }
  });

  function parseCount(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    str = String(str).replace(/,/g, '').replace(/\s/g, '').trim();
    const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
    const match = str.match(/^([\d.]+)([KMBT]?)$/i);
    if (match) return Math.round(parseFloat(match[1]) * (mult[match[2].toUpperCase()] || 1));
    return parseInt(str, 10) || 0;
  }

  function parseAgeToMs(ageStr) {
    if (!ageStr) return 0;
    const m = ageStr.match(/(\d+)\s*(hour|day|week|month|year)/i);
    if (!m) return 0;
    const num = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    const multipliers = { hour: 3600000, day: 86400000, week: 604800000, month: 2592000000, year: 31536000000 };
    return num * (multipliers[unit] || 0);
  }

  function runScrape() {
    if (Date.now() - lastScrape < CACHE_TTL) return;
    lastScrape = Date.now();

    const items = scrapeTrendingPage();
    if (items.length > 0) {
      sendBatch('youtube', items);
    }
  }

  function scrapeTrendingPage() {
    const results = [];
    let currentCategory = 'default';

    // Detect category from page header or shelf titles
    const headerCat = document.querySelector('#page-header h1, .page-header h1, ytd-feed-filter-chip-bar-renderer');
    if (headerCat) {
      currentCategory = headerCat.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    }

    // Scrape shelf-based trending (default) layout
    const shelves = document.querySelectorAll('ytd-shelf-renderer, ytd-rich-shelf-renderer, ytd-section-list-renderer');

    shelves.forEach(shelf => {
      const shelfTitle = shelf.querySelector('#title, .shelf-title, ytd-rich-shelf-header-renderer #title');
      if (shelfTitle) {
        const titleText = shelfTitle.textContent.trim().toLowerCase();
        // Map known category names
        const catMap = { music: 'music', gaming: 'gaming', movies: 'movies', 'movies & tv': 'movies', sports: 'sports', learning: 'learning', fashion: 'fashion', news: 'news' };
        for (const [key, cat] of Object.entries(catMap)) {
          if (titleText.includes(key)) { currentCategory = cat; break; }
        }
      }

      shelf.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer').forEach((el, index) => {
        const data = scrapeVideoEntry(el, index);
        if (data.videoId || data.title) {
          data.category = currentCategory;
          results.push(data);
        }
      });
    });

    // Also scrape flat video list if no shelves found
    if (results.length === 0) {
      document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer').forEach((el, index) => {
        const data = scrapeVideoEntry(el, index);
        if (data.videoId || data.title) {
          data.category = currentCategory;
          results.push(data);
        }
      });
    }

    return results;
  }

  function scrapeVideoEntry(el, index) {
    const data = { rank: index + 1 };
    try {
      const link = el.querySelector('a#video-title, a.yt-simple-endpoint[href*="/watch"], a[href*="shorts"]');
      if (link) {
        const href = link.getAttribute('href') || '';
        const vm = href.match(/[?&]v=([^&]+)/);
        const sm = href.match(/\/shorts\/([^/?]+)/);
        data.videoId = vm ? vm[1] : sm ? sm[1] : '';
      }
      const titleEl = el.querySelector('a#video-title, #video-title, h3 a, h3 span');
      data.title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title') || '';
      const chEl = el.querySelector('ytd-channel-name a, #channel-name a');
      data.channel = chEl?.textContent?.trim() || '';
      const chVerified = el.querySelector('ytd-badge-supported-renderer, .verified-badge');
      data.channelVerified = !!chVerified;

      const viewEl = el.querySelector('#metadata-line span, ytd-video-meta-block span');
      if (viewEl) {
        const t = viewEl.textContent || '';
        const vm = t.match(/([\d.]+[KMB]?)/i);
        data.views = vm ? parseCount(vm[1]) : 0;
        data.uploadAge = t;
        // Trending velocity heuristic: views / upload age
        const ageMs = parseAgeToMs(t);
        if (ageMs > 0) {
          data.trendingVelocity = Math.round((data.views / ageMs) * 86400000); // views per day
        }
      }

      const img = el.querySelector('img');
      data.thumbnailUrl = img?.src || '';
      const durEl = el.querySelector('ytd-thumbnail-overlay-time-status-renderer span');
      data.duration = durEl?.textContent?.trim() || '';
    } catch { /* silent */ }
    return data;
  }

  function sendBatch(platform, items) {
    try {
      chrome.runtime.sendMessage({
        type: 'BATCH_DATA',
        payload: { platform, items: items.map(i => ({ ...i, dataType: 'trending', scrapedAt: new Date().toISOString() })), url: window.location.href },
      }).catch(() => {});
    } catch { /* extension context invalidated */ }
  }

  // SPA nav
  let lastUrl = window.location.href;
  const origPush = history.pushState;
  history.pushState = function (...a) { origPush.apply(this, a); checkNav(); };
  window.addEventListener('popstate', checkNav);
  function checkNav() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      if (window.location.pathname.includes('/feed/trending')) {
        lastScrape = 0; // force re-scrape
        setTimeout(runScrape, 1500);
      }
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REINJECT') { lastScrape = 0; runScrape(); sendResponse({ ok: true }); return false; }
    if (message.type === 'GET_PAGE_DATA') {
      const items = scrapeTrendingPage();
      sendResponse({ payload: { items: items.map(i => ({ ...i, dataType: 'trending', scrapedAt: new Date().toISOString() })), platform: 'youtube', url: window.location.href } });
      return false;
    }
    return false;
  });
})();
