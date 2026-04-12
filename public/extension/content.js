/* ══════════════════════════════════════════════════
   NychIQ Chrome Extension v2.0 — Content Script
   Heavy YouTube/Social Data Scraper + AI Analysis
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  const NS = 'nychiq-ext';
  const CACHE_TTL = 30 * 60 * 1000; // 30 min cache
  const API_BASE = 'https://nychiq.com/api'; // Will be configurable

  // ── Configuration ──
  let config = {
    showBadges: true,
    autoAnalyze: false,
    apiBase: API_BASE,
    cacheTTL: CACHE_TTL,
  };

  // ── Data Cache ──
  const videoCache = new Map(); // videoId → scraped data
  const channelCache = new Map(); // channelId → scraped data
  let lastFullScrape = 0;

  // ═══════════════════════════════════════════════
  // SECTION 1: YouTube DOM Data Extraction
  // ═══════════════════════════════════════════════

  /**
   * Extract ytInitialPlayerResponse from page script tags
   */
  function getPlayerResponse() {
    try {
      // Method 1: From script content
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent || '';
        const match = text.match(/var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
        if (match) return JSON.parse(match[1]);
      }
      // Method 2: From ytplayer.config
      if (window.ytplayer?.config?.args?.ytInitialPlayerResponse) {
        return window.ytplayer.config.args.ytInitialPlayerResponse;
      }
      // Method 3: From ytInitialData
      if (window.ytInitialPlayerResponse) return window.ytInitialPlayerResponse;
    } catch (e) { /* silent */ }
    return null;
  }

  /**
   * Extract ytInitialData from page
   */
  function getInitialData() {
    try {
      if (window.ytInitialData) return window.ytInitialData;
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const text = script.textContent || '';
        const match = text.match(/var ytInitialData\s*=\s*(\{.+?\});/s);
        if (match) return JSON.parse(match[1]);
      }
    } catch (e) { /* silent */ }
    return null;
  }

  /**
   * Get video ID from current page URL
   */
  function getVideoId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('v') || '';
  }

  /**
   * Scrape comprehensive video data from the watch page DOM
   */
  function scrapeVideoData() {
    const videoId = getVideoId();
    if (!videoId) return null;

    // Check cache first
    const cached = videoCache.get(videoId);
    if (cached && Date.now() - cached._scrapedAt < CACHE_TTL) return cached;

    const data = { videoId, _scrapedAt: Date.now() };

    // Extract from ytInitialPlayerResponse
    const playerResp = getPlayerResponse();
    if (playerResp) {
      const vd = playerResp.videoDetails || {};
      data.title = vd.title || '';
      data.author = vd.author || '';
      data.channelId = vd.channelId || '';
      data.viewCount = parseCount(vd.viewCount);
      data.likes = parseInt(vd.likes) || 0;
      data.description = vd.shortDescription || '';
      data.lengthSeconds = parseInt(vd.lengthSeconds) || 0;
      data.keywords = vd.keywords || [];
      data.isFamilySafe = vd.isFamilySafe;
      data.category = vd.category;
      data.thumbnails = vd.thumbnail?.thumbnails || [];
      data.averageRating = parseFloat(vd.averageRating) || 0;
      data.allowRatings = vd.allowRatings;
      data.isLiveContent = vd.isLiveContent;
    }

    // Extract engagement from DOM (more reliable for live data)
    const likeBtn = document.querySelector('like-button-view-model button[aria-label]');
    if (likeBtn) {
      const likeText = likeBtn.getAttribute('aria-label') || '';
      const likeMatch = likeText.match(/[\d,]+/);
      if (likeMatch) data.likes = parseCount(likeMatch[0]);
    }

    // Views from meta or DOM
    const viewMeta = document.querySelector('meta[itemprop="interactionCount"]');
    if (viewMeta) {
      data.viewCount = parseInt(viewMeta.getAttribute('content')) || data.viewCount;
    }

    // Channel subscriber count from ytInitialData
    const initialData = getInitialData();
    if (initialData) {
      try {
        const contents = initialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
        if (contents) {
          for (const item of contents) {
            const r = item?.videoPrimaryInfoRenderer;
            if (r) {
              // Views
              const viewStr = r?.viewCount?.videoViewCountRenderer?.viewCount || '';
              if (viewStr && !data.viewCount) data.viewCount = parseCount(viewStr);
              // Date
              const dateStr = r?.dateText?.simpleText || '';
              data.uploadDate = dateStr;
            }
            const sr = item?.videoSecondaryInfoRenderer;
            if (sr) {
              // Subscriber count
              const subCount = sr?.owner?.videoOwnerRenderer?.subscriberCountText?.simpleText || '';
              data.channelSubscribers = parseCount(subCount);
            }
          }
        }
      } catch (e) { /* silent */ }
    }

    // Comment count from DOM
    const commentHeader = document.querySelector('#comments #count yt-formatted-string');
    if (commentHeader) {
      data.commentCount = parseCount(commentHeader.textContent || '0');
    } else {
      // Fallback: count visible comment elements
      const commentElements = document.querySelectorAll('ytd-comment-thread-renderer');
      data.commentCount = commentElements.length;
    }

    // Description expansion - get full description
    const descEl = document.querySelector('#description-inner yt-attributed-string');
    if (descEl) {
      data.description = descEl.textContent || data.description;
    }

    // Tags (sometimes in meta)
    const metaTags = document.querySelector('meta[name="keywords"]');
    if (metaTags) {
      data.keywords = (metaTags.getAttribute('content') || '').split(',').map(t => t.trim()).filter(Boolean);
    }

    videoCache.set(videoId, data);
    return data;
  }

  /**
   * Scrape data from a thumbnail card on the home/browse page
   * Extracts available info from ytd-rich-item-renderer or ytd-video-renderer
   */
  function scrapeThumbnailData(element) {
    const data = {};

    try {
      // Video ID from link
      const link = element.querySelector('a#video-title, a.yt-simple-endpoint');
      if (link) {
        const href = link.getAttribute('href') || '';
        const vidMatch = href.match(/[?&]v=([^&]+)/);
        data.videoId = vidMatch ? vidMatch[1] : '';
      }

      // Title
      const titleEl = element.querySelector('a#video-title, #video-title');
      data.title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title') || '';

      // Channel name
      const channelEl = element.querySelector('ytd-channel-name a, #channel-name a, .ytd-channel-name a');
      data.channel = channelEl?.textContent?.trim() || '';

      // Views
      const viewEl = element.querySelector('#metadata-line span, ytd-video-meta-block span');
      if (viewEl) {
        const text = viewEl.textContent || '';
        const viewMatch = text.match(/([\d.]+[KMB]?)/i);
        data.views = viewMatch ? parseCount(viewMatch[1]) : 0;
        data.metaText = text;
      }

      // Thumbnail URL (for quality analysis)
      const img = element.querySelector('img');
      data.thumbnailUrl = img?.src || img?.getAttribute('data-thumbs') || '';

      // Duration
      const durationEl = element.querySelector('ytd-thumbnail-overlay-time-status-renderer span, .badge-shape-wiz__text');
      data.duration = durationEl?.textContent?.trim() || '';

      // Upload recency
      const timeEl = element.querySelector('#metadata-line span:nth-child(2), ytd-video-meta-block span:nth-child(2)');
      data.uploadAge = timeEl?.textContent?.trim() || '';
    } catch (e) { /* silent */ }

    return data;
  }

  /**
   * Scrape channel data from a channel page
   */
  function scrapeChannelData() {
    const initialData = getInitialData();
    const data = {};

    try {
      // Channel header data
      const header = initialData?.header?.c4TabbedHeaderRenderer;
      if (header) {
        data.channelId = header.channelId;
        data.title = header.title;
        data.subscribers = parseCount(header.subscriberCountText?.simpleText || '0');
        data.videosCount = parseCount(header.videosCountText?.runs?.[0]?.text || '0');
        data.avatar = header.avatar?.thumbnails?.[0]?.url || '';
      }

      // Channel metadata
      const meta = initialData?.metadata?.channelMetadataRenderer;
      if (meta) {
        data.description = meta.description || '';
        data.externalId = meta.externalId;
        data.tvBanner = meta.tvBanner?.thumbnails?.[0]?.url;
      }

      // Sidebar stats
      const sidebar = initialData?.sidebar?.channelSidebarRenderer;
      if (sidebar) {
        const items = sidebar?.items?.[0]?.channelSidebarUserInfoRenderer;
        if (items) {
          data.joinedDate = items?.joinedDateText?.content || '';
          data.viewCount = parseCount(items?.subscriberCountText?.simpleText || '0');
        }
      }
    } catch (e) { /* silent */ }

    data._scrapedAt = Date.now();
    return data;
  }

  // ═══════════════════════════════════════════════
  // SECTION 2: Score Calculations (Real, Not Random)
  // ═══════════════════════════════════════════════

  /**
   * Calculate Viral Score based on actual metrics
   * Factors: views-to-time ratio, engagement rate, CTR estimate, niche average
   */
  function calculateViralScore(data) {
    if (!data || !data.views) return null;

    let score = 50; // Base score

    // Views factor (logarithmic scale — 1M views = 70pts, 10M = 85pts)
    const viewLog = Math.log10(Math.max(data.views, 1));
    score += Math.min(viewLog * 10, 25);

    // Engagement rate factor
    const engRate = data.likes > 0 ? (data.likes / data.views) * 100 : 0;
    if (engRate > 5) score += 15;      // Exceptional
    else if (engRate > 3) score += 10;  // Great
    else if (engRate > 1.5) score += 5; // Average
    else score -= 5;                     // Below average

    // Comment engagement
    if (data.commentCount && data.views > 0) {
      const commentRate = (data.commentCount / data.views) * 100;
      if (commentRate > 0.5) score += 5;
      else if (commentRate > 0.1) score += 2;
    }

    // Duration factor (ideal is 8-15 min for long-form)
    if (data.lengthSeconds) {
      const mins = data.lengthSeconds / 60;
      if (mins >= 8 && mins <= 15) score += 5;
      else if (mins >= 3 && mins <= 25) score += 2;
      else if (mins < 1) score -= 10; // Shorts get penalized for long-form virality
    }

    // Keyword optimization (title length, tag count)
    if (data.title) {
      if (data.title.length >= 40 && data.title.length <= 65) score += 3; // Optimal title length
      if (/[\d!?]/.test(data.title)) score += 2; // Number or punctuation in title
    }
    if (data.keywords && data.keywords.length >= 5) score += 3;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate Engagement Rate
   */
  function calculateEngagementRate(data) {
    if (!data || !data.views || data.views === 0) return null;
    const likes = data.likes || 0;
    const comments = data.commentCount || 0;
    return Math.round(((likes + comments) / data.views) * 10000) / 100; // percentage
  }

  /**
   * Calculate SEO Score based on title, description, tags
   */
  function calculateSEOScore(data) {
    if (!data) return null;
    let score = 30; // Base

    // Title optimization
    const title = data.title || '';
    if (title.length >= 40 && title.length <= 65) score += 15;
    else if (title.length >= 30 && title.length <= 75) score += 8;
    else score -= 5;

    // Power words in title
    const powerWords = ['how', 'why', 'best', 'top', 'ultimate', 'secret', 'never', 'always', 'amazing', 'incredible'];
    const titleLower = title.toLowerCase();
    const powerCount = powerWords.filter(w => titleLower.includes(w)).length;
    score += Math.min(powerCount * 3, 9);

    // Description length and quality
    const desc = data.description || '';
    if (desc.length > 200) score += 10;
    else if (desc.length > 100) score += 5;
    if (desc.includes('#') || desc.includes('http')) score += 3; // Hashtags/links

    // Tags
    const tags = data.keywords || [];
    if (tags.length >= 10) score += 8;
    else if (tags.length >= 5) score += 4;
    if (tags.length > 0) {
      const titleWords = titleLower.split(/\s+/);
      const tagOverlap = tags.filter(t => titleWords.some(w => t.toLowerCase().includes(w))).length;
      score += Math.min(tagOverlap * 2, 6);
    }

    // Category match
    if (data.category) score += 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Estimate CTR (Click-Through Rate) from available data
   */
  function estimateCTR(data) {
    if (!data) return null;
    let ctr = 4; // YouTube average is ~4-6%

    if (data.title) {
      const title = data.title;
      // Curiosity gap
      if (/\?|!|never|secret|why|how/.test(title.toLowerCase())) ctr += 1.5;
      // Number in title
      if (/\d/.test(title)) ctr += 0.8;
      // Brackets or parentheses
      if (/[[(]/.test(title)) ctr += 1;
      // Length sweet spot
      if (title.length >= 40 && title.length <= 55) ctr += 0.5;
    }

    // If has many likes relative to views, suggests high CTR
    if (data.views > 100 && data.likes > 0) {
      const engRate = (data.likes / data.views) * 100;
      if (engRate > 4) ctr += 2;
      else if (engRate > 2) ctr += 1;
    }

    return Math.max(1, Math.min(20, Math.round(ctr * 100) / 100));
  }

  // ═══════════════════════════════════════════════
  // SECTION 3: UI Rendering (Badges + Overlay)
  // ═══════════════════════════════════════════════

  function injectStyles() {
    if (document.getElementById(`${NS}-styles`)) return;
    const style = document.createElement('style');
    style.id = `${NS}-styles`;
    style.textContent = `
      .nychiq-score-badge {
        position: absolute; top: 8px; right: 8px; z-index: 1000;
        padding: 3px 7px; border-radius: 6px; font-size: 10px; font-weight: 800;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(10px); pointer-events: none; display: flex;
        align-items: center; gap: 3px; opacity: 0; animation: nychiq-fi 0.3s ease forwards;
      }
      .nychiq-score-badge .nq-num { font-size: 11px; font-weight: 900; }
      .nychiq-score-badge .nq-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
      .nq-high { background: rgba(16,185,129,0.9); color: #FFF; border: 1px solid rgba(16,185,129,0.4); box-shadow: 0 2px 8px rgba(16,185,129,0.3); }
      .nq-med { background: rgba(253,186,45,0.9); color: #000; border: 1px solid rgba(253,186,45,0.4); }
      .nq-low { background: rgba(0,0,0,0.75); color: #888; border: 1px solid rgba(255,255,255,0.08); }
      .nq-high { animation: nychiq-fi 0.3s ease forwards, nq-pulse 2s infinite 0.5s; }
      .nychiq-analyze-btn {
        position: fixed; bottom: 80px; right: 24px; z-index: 9999;
        width: 48px; height: 48px; border-radius: 50%;
        background: linear-gradient(135deg, #8B5CF6, #FDBA2D); color: #FFF; border: none;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(253,186,45,0.3); transition: all 0.3s ease;
        animation: nychiq-su 0.5s ease;
      }
      .nychiq-analyze-btn:hover { transform: scale(1.1); }
      .nychiq-analyze-btn.analyzing { animation: nq-spin 1s linear infinite; }
      .nychiq-overlay {
        position: fixed; bottom: 140px; right: 24px; z-index: 9999; width: 360px;
        background: #141414; border: 1px solid #1F1F1F; border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden; animation: nychiq-su 0.4s ease;
      }
      .nq-oh { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #1F1F1F; background: #0D0D0D; }
      .nq-ot { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #FFF; }
      .nq-ot span.amber { color: #FDBA2D; }
      .nq-oc { width: 28px; height: 28px; border-radius: 8px; background: transparent; border: 1px solid #1F1F1F; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .nq-oc:hover { background: #1F1F1F; color: #FFF; }
      .nq-ob { padding: 16px; max-height: 480px; overflow-y: auto; }
      .nq-ob::-webkit-scrollbar { width: 4px; }
      .nq-ob::-webkit-scrollbar-thumb { background: #1F1F1F; border-radius: 2px; }
      .nq-mr { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
      .nq-mr:last-child { border-bottom: none; }
      .nq-ml { font-size: 11px; color: #A3A3A3; }
      .nq-mv { font-size: 13px; font-weight: 700; color: #FFF; }
      .nq-meter { width: 100%; height: 5px; background: #1F1F1F; border-radius: 3px; overflow: hidden; margin-top: 3px; }
      .nq-mf { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
      .nq-of { padding: 12px 16px; border-top: 1px solid #1F1F1F; }
      .nq-of a { display: block; width: 100%; text-align: center; padding: 10px; border-radius: 10px; background: linear-gradient(135deg, #FDBA2D, #C69320); color: #000; font-size: 12px; font-weight: 700; text-decoration: none; }
      .nq-of a:hover { filter: brightness(1.1); }
      .nq-section { margin-bottom: 12px; }
      .nq-section-title { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
      .nq-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #1F1F1F; color: #A3A3A3; font-size: 10px; margin: 2px; }
      .nq-tag.good { background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.2); }
      .nq-tag.warn { background: rgba(253,186,45,0.15); color: #FDBA2D; border: 1px solid rgba(253,186,45,0.2); }
      .nq-tag.bad { background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }
      .nq-ai-tip { background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 10px 12px; margin-top: 8px; font-size: 11px; color: #C4B5FD; line-height: 1.5; }
      @keyframes nychiq-fi { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      @keyframes nychiq-su { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes nq-pulse { 0%,100% { box-shadow: 0 2px 8px rgba(16,185,129,0.3); } 50% { box-shadow: 0 2px 16px rgba(16,185,129,0.6); } }
      @keyframes nq-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  function addScoreBadge(el, data) {
    if (!el || !settings.showBadges || !data) return;
    if (el.dataset.nychiqScored) return;
    el.dataset.nychiqScored = '1';

    const score = calculateViralScore(data);
    if (score === null) return;

    const cls = score >= 75 ? 'nq-high' : score >= 50 ? 'nq-med' : 'nq-low';
    const label = score >= 75 ? 'VIRAL' : score >= 50 ? 'HOT' : 'NEW';

    const badge = document.createElement('div');
    badge.className = `nychiq-score-badge ${cls}`;
    badge.innerHTML = `<span class="nq-num">${score}</span><span class="nq-lbl">${label}</span>`;

    const anchor = el.querySelector('a#thumbnail, a.ytd-thumbnail');
    if (anchor) { anchor.style.position = 'relative'; anchor.appendChild(badge); }
  }

  function processThumbnails() {
    if (!settings.showBadges) return;
    const thumbnails = document.querySelectorAll('ytd-rich-item-renderer:not([data-nychiq-scored]), ytd-video-renderer:not([data-nychiq-scored]), ytd-grid-video-renderer:not([data-nychiq-scored])');
    // Use requestIdleCallback for performance
    const processBatch = (items) => {
      for (let i = 0; i < Math.min(items.length, 10); i++) {
        const item = items[i];
        const data = scrapeThumbnailData(item);
        item.dataset.nychiqScored = '1';
        addScoreBadge(item, data);
      }
      if (items.length > 10) requestIdleCallback(() => processBatch(Array.from(items).slice(10)));
    };
    processBatch(Array.from(thumbnails));
  }

  function addFloatingButton() {
    if (document.getElementById(`${NS}-fab`)) return;
    if (!window.location.pathname.includes('/watch')) return;
    const btn = document.createElement('button');
    btn.id = `${NS}-fab`;
    btn.className = 'nychiq-analyze-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>';
    btn.addEventListener('click', showAnalysisOverlay);
    document.body.appendChild(btn);
  }

  function formatNumber(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }

  function getScoreColor(s) { return s >= 75 ? '#10B981' : s >= 50 ? '#FDBA2D' : '#EF4444'; }

  function showAnalysisOverlay() {
    if (document.getElementById(`${NS}-overlay`)) return;
    const data = scrapeVideoData();
    if (!data) return;

    const viral = calculateViralScore(data) || 0;
    const engRate = calculateEngagementRate(data) || 0;
    const seo = calculateSEOScore(data) || 0;
    const ctr = estimateCTR(data) || 0;
    const retention = Math.max(20, Math.min(90, Math.round(50 + (engRate * 3) + (data.description?.length > 200 ? 10 : 0))));

    const overlay = document.createElement('div');
    overlay.id = `${NS}-overlay`;
    overlay.className = 'nychiq-overlay';
    overlay.innerHTML = `
      <div class="nq-oh">
        <div class="nq-ot">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 6L18 12L10 18V6Z" fill="#FDBA2D"/><rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/></svg>
          NY<span class="amber">CHIQ</span> Analysis
        </div>
        <button class="nq-oc" id="${NS}-close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="nq-ob">
        <div class="nq-section">
          <div class="nq-section-title">Performance Scores</div>
          ${renderMetric('Viral Score', viral, 100)}
          ${renderMetric('Engagement Rate', engRate, 10)}
          ${renderMetric('SEO Score', seo, 100)}
          ${renderMetric('Est. CTR', ctr, 20)}
          ${renderMetric('Retention Pred.', retention, 100)}
        </div>
        <div class="nq-section">
          <div class="nq-section-title">Video Data</div>
          <div class="nq-mr"><span class="nq-ml">Views</span><span class="nq-mv">${formatNumber(data.views || 0)}</span></div>
          <div class="nq-mr"><span class="nq-ml">Likes</span><span class="nq-mv">${formatNumber(data.likes || 0)}</span></div>
          <div class="nq-mr"><span class="nq-ml">Comments</span><span class="nq-mv">${formatNumber(data.commentCount || 0)}</span></div>
          <div class="nq-mr"><span class="nq-ml">Duration</span><span class="nq-mv">${data.lengthSeconds ? Math.floor(data.lengthSeconds/60) + ':' + String(data.lengthSeconds%60).padStart(2,'0') : 'N/A'}</span></div>
          <div class="nq-mr"><span class="nq-ml">Channel Subs</span><span class="nq-mv">${data.channelSubscribers ? formatNumber(data.channelSubscribers) : 'N/A'}</span></div>
        </div>
        ${data.keywords && data.keywords.length > 0 ? `
        <div class="nq-section">
          <div class="nq-section-title">Tags (${data.keywords.length})</div>
          <div>${data.keywords.slice(0, 15).map(t => `<span class="nq-tag">${t}</span>`).join('')}${data.keywords.length > 15 ? `<span class="nq-tag">+${data.keywords.length - 15} more</span>` : ''}</div>
        </div>
        ` : ''}
        <div class="nq-section">
          <div class="nq-section-title">AI Insights</div>
          <div class="nq-ai-tip" id="${NS}-ai-tip">Loading AI analysis...</div>
        </div>
      </div>
      <div class="nq-of">
        <a href="https://nychiq.com" target="_blank">Open NychIQ Dashboard</a>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById(`${NS}-close`).addEventListener('click', () => { overlay.remove(); document.getElementById(`${NS}-fab`)?.remove(); });

    // Trigger AI analysis in background
    requestAIAnalysis(data, (tip) => {
      const el = document.getElementById(`${NS}-ai-tip`);
      if (el) el.textContent = tip;
    });
  }

  function renderMetric(label, value, max) {
    const pct = Math.min((value / max) * 100, 100);
    const color = getScoreColor((value / max) * 100);
    const displayVal = max === 10 ? value + '%' : max === 20 ? value + '%' : value + '/100';
    return `<div class="nq-mr"><span class="nq-ml">${label}</span><span class="nq-mv" style="color:${color}">${displayVal}</span></div><div class="nq-meter"><div class="nq-mf" style="width:${pct}%;background:${color}"></div></div><div style="height:8px"></div>`;
  }

  // ═══════════════════════════════════════════════
  // SECTION 4: AI Analysis via NychIQ API
  // ═══════════════════════════════════════════════

  async function requestAIAnalysis(data, callback) {
    // Try cached insights first
    const cacheKey = `ai_${data.videoId}`;
    try {
      const cached = await chrome.storage.local.get(cacheKey);
      if (cached[cacheKey] && Date.now() - cached[cacheKey].ts < CACHE_TTL) {
        callback(cached[cacheKey].tip);
        return;
      }
    } catch (e) { /* silent */ }

    // Quick local analysis as fallback
    const localTips = [];
    const engRate = calculateEngagementRate(data) || 0;
    const seo = calculateSEOScore(data) || 0;
    const ctr = estimateCTR(data) || 0;

    if (engRate > 4) localTips.push('Exceptional engagement rate — this video resonates strongly with its audience');
    else if (engRate < 1) localTips.push('Low engagement — consider improving hooks in the first 5 seconds');

    if (seo < 40) localTips.push('SEO score is low — add more relevant tags and optimize title length (40-65 chars)');
    if (ctr > 8) localTips.push('High estimated CTR — thumbnail and title are working well together');
    if ((data.keywords || []).length < 5) localTips.push('Few tags detected — add 10-15 relevant tags to improve discoverability');

    const fallbackTip = localTips.length > 0 ? localTips[0] : 'Analyzing patterns...';

    // Set fallback immediately
    callback(fallbackTip);

    // Then try API
    try {
      const prompt = `Analyze this YouTube video in one actionable sentence. Title: "${data.title || ''}". Views: ${data.views}. Likes: ${data.likes}. Engagement: ${engRate}%. SEO: ${seo}. CTR: ${ctr}%. Tags: ${(data.keywords || []).slice(0,10).join(', ')}. Duration: ${data.lengthSeconds}s. Give ONE specific improvement tip.`;

      const resp = await fetch(`${config.apiBase}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt: 'You are a YouTube growth analyst. Give ONE specific, actionable tip. Keep it under 2 sentences.' }),
      });
      if (resp.ok) {
        const result = await resp.json();
        const tip = result.text || fallbackTip;
        callback(tip);
        // Cache
        try { await chrome.storage.local.set({ [cacheKey]: { tip, ts: Date.now() } }); } catch (e) {}
        return;
      }
    } catch (e) { /* API failed — local tip is already shown */ }

    // Enhanced local analysis as final fallback
    if (localTips.length > 1) {
      callback(localTips[Math.floor(Math.random() * localTips.length)]);
    }
  }

  // ═══════════════════════════════════════════════
  // SECTION 5: Mutation Observer (Performance Optimized)
  // ═══════════════════════════════════════════════

  let observerTimer = null;
  function observeDOM() {
    const observer = new MutationObserver(() => {
      // Debounce thumbnail processing — batch updates every 500ms
      if (observerTimer) return;
      observerTimer = setTimeout(() => {
        observerTimer = null;
        processThumbnails();
        if (window.location.pathname.includes('/watch')) addFloatingButton();
      }, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ═══════════════════════════════════════════════
  // SECTION 6: Settings & Initialization
  // ═══════════════════════════════════════════════

  const STORAGE_KEY = 'nychiq_ext_state';

  // ── Settings object (referenced by addScoreBadge) ──
  let settings = {
    showBadges: true,
    autoAnalyze: false,
  };

  function loadSettings() {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      settings.showBadges = state.showBadges !== false;
      settings.autoAnalyze = state.autoAnalyze === true;
      settings.apiBase = state.apiBase || API_BASE;
      if (state.connected) {
        injectStyles();
        processThumbnails();
        addFloatingButton();
        observeDOM();
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'ANALYZE_PAGE') showAnalysisOverlay();
    if (msg.type === 'SETTINGS_CHANGED') {
      settings = msg.settings;
      if (settings.showBadges) { if (!document.getElementById(`${NS}-styles`)) { injectStyles(); processThumbnails(); observeDOM(); } else processThumbnails(); }
    }
    if (msg.type === 'REINJECT') { loadSettings(); }
  });

  // Utility: parse count strings like "1.2K", "3.5M", "456,789"
  function parseCount(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    str = String(str).replace(/,/g, '').trim();
    const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
    const match = str.match(/^([\d.]+)([KMBT]?)$/i);
    if (match) return Math.round(parseFloat(match[1]) * (mult[match[2].toUpperCase()] || 1));
    return parseInt(str) || 0;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSettings);
  else loadSettings();
})();
