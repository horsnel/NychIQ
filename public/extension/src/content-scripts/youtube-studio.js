/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — YouTube Studio Scraper
   Real-time analytics: CTR, retention, impressions, revenue from Studio
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let settings = { deepScraping: false };
  let pollInterval = null;

  chrome.storage.local.get('nychiq_ext_state', (result) => {
    const state = result['nychiq_ext_state'] || {};
    settings.deepScraping = !!state.deepScraping;
    runScrape();
    // Poll every 30s for real-time data
    pollInterval = setInterval(runScrape, 30000);
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

  function runScrape() {
    const data = scrapeStudioAnalytics();
    if (data && Object.keys(data).length > 3) {
      sendBatch('youtube', [{ ...data, dataType: 'studio-analytics', scrapedAt: new Date().toISOString(), url: window.location.href, platform: 'youtube' }]);
    }
  }

  function scrapeStudioAnalytics() {
    const data = {};
    try {
      // -- Impressions --
      const impEl = document.querySelector('[aria-label*="mpress"], .yt-core-attributed-string--white-space-pre-wrap');
      if (impEl) {
        const impText = impEl.textContent || '';
        const impMatch = impText.match(/([\d,.]+\s*[KMB]?)/);
        if (impMatch) data.impressions = parseCount(impMatch[1]);
      }

      // -- Views --
      const viewEl = document.querySelector('#main-content [data-type="views"], .metric-value');
      if (viewEl) data.views = parseCount(viewEl.textContent);

      // -- Watch time --
      const wtEl = document.querySelector('[aria-label*="Watch time"], [data-type="watch-time"]');
      if (wtEl) data.watchTime = wtEl.textContent.trim() || '';

      // -- Subscribers --
      const subEl = document.querySelector('[aria-label*="ubscriber"], [data-type="subscribers"]');
      if (subEl) {
        const subText = subEl.textContent || '';
        data.newSubscribers = parseCount(subText);
      }
      const lostSubEl = document.querySelector('[aria-label*="Lost"]');
      if (lostSubEl) data.lostSubscribers = parseCount(lostSubEl.textContent);

      // -- Revenue --
      const revEl = document.querySelector('[aria-label*="Revenue"], [data-type="revenue"], .ytcp-revenue-value');
      if (revEl) data.estimatedRevenue = revEl.textContent.trim() || '';

      // -- RPM --
      const rpmEl = document.querySelector('[aria-label*="RPM"], [data-type="rpm"]');
      if (rpmEl) data.rpm = rpmEl.textContent.trim() || '';

      // -- CTR (Click-through rate) --
      const ctrEl = document.querySelector('[aria-label*="CTR"], [data-type="ctr"], .impressions-ctr');
      if (ctrEl) {
        data.ctr = parseFloat(ctrEl.textContent) || 0;
      }

      // -- Real-time viewers --
      const rtEl = document.querySelector('.realtime-viewers, [aria-label*="real-time"], #realtime-container');
      if (rtEl) data.realtimeViewers = parseCount(rtEl.textContent);

      // -- Average view duration --
      const avdEl = document.querySelector('[aria-label*="Average view duration"], [data-type="average-view-duration"]');
      if (avdEl) data.avgViewDuration = avdEl.textContent.trim() || '';

      // -- Top videos list from analytics page --
      data.topVideos = [];
      document.querySelectorAll('ytcp-entity-row, .entity-row, [role="row"]').forEach(row => {
        const titleEl = row.querySelector('.title-cell, [role="cell"] a, .entity-title');
        const viewCountEl = row.querySelector('.views-cell, [role="cell"]:nth-child(2)');
        if (titleEl) {
          data.topVideos.push({
            title: titleEl.textContent.trim(),
            views: parseCount(viewCountEl?.textContent),
          });
        }
      });

      // -- Date range context --
      const dateRangeEl = document.querySelector('.date-range, [aria-label*="date range"]');
      if (dateRangeEl) data.dateRange = dateRangeEl.textContent.trim() || '';

    } catch { /* silent */ }

    return data;
  }

  function sendBatch(platform, items) {
    try {
      chrome.runtime.sendMessage({ type: 'BATCH_DATA', payload: { platform, items, url: window.location.href } }).catch(() => {});
    } catch { /* extension context invalidated */ }
  }

  // Cleanup on unload
  window.addEventListener('unload', () => {
    if (pollInterval) clearInterval(pollInterval);
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REINJECT') {
      runScrape();
      sendResponse({ ok: true });
      return false;
    }
    if (message.type === 'GET_PAGE_DATA') {
      const data = scrapeStudioAnalytics();
      sendResponse({ payload: { items: data ? [{ ...data, dataType: 'studio-analytics', scrapedAt: new Date().toISOString() }] : [], platform: 'youtube', url: window.location.href } });
      return false;
    }
    return false;
  });
})();
