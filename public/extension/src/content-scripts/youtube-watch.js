/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — YouTube Watch Page Scraper
   Scrapes video metadata, comments, recommendations from /watch and /shorts
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';
  if (window.__nychiq_initialized) return;
  window.__nychiq_initialized = true;

  const CACHE_TTL = 30 * 60 * 1000;
  const videoCache = new Map();
  const MAX_COMMENT_SCROLL = 20;
  let settings = { deepScraping: false };

  /* ── Load settings ── */
  chrome.storage.local.get('nychiq_ext_state', (result) => {
    const state = result['nychiq_ext_state'] || {};
    settings.deepScraping = !!state.deepScraping;
    runInitialScrape();
  });

  /* ── Video ID extraction ── */
  function getVideoId() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('v')) return p.get('v');
    const m = window.location.pathname.match(/\/shorts\/([^/]+)/);
    return m ? m[1] : '';
  }

  /* ── YouTube data extractors ── */
  function getYTInitialData() {
    try {
      if (window.ytInitialData) return window.ytInitialData;
      for (const s of document.querySelectorAll('script')) {
        const t = s.textContent || '';
        const m = t.match(/var ytInitialData\s*=\s*(\{.+?\});/s);
        if (m) return safeJSONParse(m[1]);
      }
    } catch { /* silent */ }
    return null;
  }

  function getYTPlayerResponse() {
    try {
      if (window.ytInitialPlayerResponse) return window.ytInitialPlayerResponse;
      if (window.ytplayer?.config?.args?.ytInitialPlayerResponse) return window.ytplayer.config.args.ytInitialPlayerResponse;
      for (const s of document.querySelectorAll('script')) {
        const t = s.textContent || '';
        const m = t.match(/var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
        if (m) return safeJSONParse(m[1]);
      }
    } catch { /* silent */ }
    return null;
  }

  function parseCount(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    str = String(str).replace(/,/g, '').replace(/\s/g, '').trim();
    const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
    const match = str.match(/^([\d.]+)([KMBT]?)$/i);
    if (match) return Math.round(parseFloat(match[1]) * (mult[match[2].toUpperCase()] || 1));
    return parseInt(str, 10) || 0;
  }

  function safeJSONParse(text) {
    try { return JSON.parse(text); } catch { return null; }
  }

  function envelope(platform, dataType, data, source) {
    return { platform, dataType, scrapedAt: new Date().toISOString(), source: source || 'dom', reliability: computeReliability(data), url: window.location.href, ...data };
  }

  function computeReliability(data) {
    if (!data || typeof data !== 'object') return 0;
    const fields = Object.values(data).filter(v => v !== undefined && v !== null && v !== '' && v !== 0);
    return Math.min(100, Math.round((fields.length / Math.max(Object.keys(data).length, 1)) * 100));
  }

  /* ── Main scrape: video data ── */
  function scrapeVideoData() {
    const videoId = getVideoId();
    if (!videoId) return null;
    const cached = videoCache.get(videoId);
    if (cached && Date.now() - cached._ts < CACHE_TTL) return cached;

    const data = { videoId, _ts: Date.now() };
    let source = 'dom';

    // Player response (highest fidelity)
    const pr = getYTPlayerResponse();
    if (pr) {
      source = 'playerResponse';
      const vd = pr.videoDetails || {};
      data.title = vd.title || '';
      data.author = vd.author || '';
      data.channelId = vd.channelId || '';
      data.viewCount = parseCount(vd.viewCount);
      data.likes = parseInt(vd.likes, 10) || 0;
      data.description = vd.shortDescription || '';
      data.lengthSeconds = parseInt(vd.lengthSeconds, 10) || 0;
      data.keywords = vd.keywords || [];
      data.isFamilySafe = vd.isFamilySafe;
      data.category = vd.category;
      data.thumbnails = vd.thumbnail?.thumbnails || [];
      data.averageRating = parseFloat(vd.averageRating) || 0;
      data.isLiveContent = vd.isLiveContent;
      data.isPrivate = vd.isPrivate;
    }

    // ytInitialData enrichment
    const init = getYTInitialData();
    if (init) {
      try {
        const contents = init?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
        if (contents) {
          for (const item of contents) {
            const ri = item?.videoPrimaryInfoRenderer;
            if (ri) {
              const vs = ri?.viewCount?.videoViewCountRenderer?.viewCount || '';
              if (vs && !data.viewCount) { data.viewCount = parseCount(vs); source = 'initialData'; }
              data.uploadDate = ri?.dateText?.simpleText || '';
            }
            const si = item?.videoSecondaryInfoRenderer;
            if (si) {
              const sub = si?.owner?.videoOwnerRenderer?.subscriberCountText?.simpleText || '';
              data.channelSubscribers = parseCount(sub);
              const descAttr = si?.attributedDescriptionBodyText?.attributedBodyText?.content;
              if (descAttr) data.description = descAttr;
            }
          }
        }

        // Recommendations
        data.recommendations = [];
        const recs = init?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results;
        if (recs) {
          for (const r of recs) {
            const cvo = r?.compactVideoRenderer || r?.compactAutoplayRenderer?.videoRenderer;
            if (cvo) {
              data.recommendations.push({
                videoId: cvo.videoId || '',
                title: cvo.title?.simpleText || cvo.title?.runs?.[0]?.text || '',
                views: parseCount(cvo.viewCountText?.simpleText || ''),
                length: cvo.lengthText?.simpleText || '',
                channel: cvo.shortBylineText?.runs?.[0]?.text || '',
                verified: !!cvo.ownerBadges?.length,
              });
            }
          }
        }

        // End screen
        data.endScreen = [];
        const es = init?.playerOverlays?.playerOverlayRenderer?.endScreen?.watchNextEndScreenRenderer?.results;
        if (es) {
          for (const e of es) {
            const er = e?.endScreenVideoRenderer;
            if (er) {
              data.endScreen.push({ videoId: er.videoId || '', title: er.title?.simpleText || '', views: parseCount(er.shortViewCountText?.simpleText || ''), length: er.lengthText?.simpleText || '' });
            }
          }
        }

        // Microformat
        const mf = init?.microformat?.playerMicroformatRenderer;
        if (mf) {
          data.publishDate = mf.publishDate || '';
          data.uploadDate = data.uploadDate || mf.publishDate || '';
          data.category = data.category || mf.category;
          data.availableCountries = mf.availableCountries;
        }
      } catch { /* silent */ }
    }

    // DOM: Likes
    const likeBtn = document.querySelector('like-button-view-model button[aria-label], #top-level-buttons-computed ytd-toggle-button-renderer button[aria-label]');
    if (likeBtn) {
      const lt = likeBtn.getAttribute('aria-label') || '';
      const lm = lt.match(/([\d,]+)/);
      if (lm) { data.likes = parseCount(lm[1]); source = 'dom'; }
    }

    // DOM: Views meta
    const viewMeta = document.querySelector('meta[itemprop="interactionCount"]');
    if (viewMeta) data.viewCount = parseInt(viewMeta.getAttribute('content'), 10) || data.viewCount;

    // DOM: Full description
    const descEl = document.querySelector('#description-inner yt-attributed-string, #attributed-description-inner, ytd-text-inline-expander #inline-expander');
    if (descEl) {
      const dt = descEl.textContent || '';
      if (dt.length > (data.description || '').length) data.description = dt;
    }

    // DOM: Description links
    data.descriptionLinks = [];
    document.querySelectorAll('#description-inner a[href], #attributed-description-inner a[href], ytd-text-inline-expander a[href]').forEach(a => {
      data.descriptionLinks.push({ text: a.textContent.trim(), href: a.href });
    });

    // DOM: Tags
    const metaTags = document.querySelector('meta[name="keywords"]');
    if (metaTags) data.keywords = (metaTags.getAttribute('content') || '').split(',').map(t => t.trim()).filter(Boolean);

    // DOM: Comment count
    const commentHeader = document.querySelector('#comments #count yt-formatted-string, ytd-comments-header-renderer h2, #comments-title yt-formatted-string');
    if (commentHeader) {
      data.commentCount = parseCount(commentHeader.textContent);
    } else {
      data.commentCount = document.querySelectorAll('ytd-comment-thread-renderer').length;
    }

    // DOM: Channel fallbacks
    if (!data.author) {
      const ch = document.querySelector('#channel-name a, ytd-video-owner-renderer a, #owner-name a');
      if (ch) data.author = ch.textContent.trim();
    }
    if (!data.channelId) {
      const ch = document.querySelector('#channel-name a, ytd-video-owner-renderer a');
      if (ch) {
        const m = (ch.getAttribute('href') || '').match(/\/(channel|@)\/([^/?]+)/);
        if (m) data.channelId = m[1] === 'channel' ? m[2] : '@' + m[2];
      }
    }

    videoCache.set(videoId, envelope('youtube', 'video', data, source));
    return envelope('youtube', 'video', data, source);
  }

  /* ── Comment scraping ── */
  async function scrapeComments(scrollDepth) {
    scrollDepth = scrollDepth || (settings.deepScraping ? MAX_COMMENT_SCROLL : 3);
    const comments = [];

    const showMoreBtn = document.querySelector('#sort-menu yt-formatted-string, ytd-comments ytd-button-renderer button');
    if (showMoreBtn) showMoreBtn.click();
    await new Promise(r => setTimeout(r, 500));

    collectVisibleComments(comments);

    const commentSection = document.querySelector('#comments #sections, ytd-item-section-renderer #contents, ytd-comments ytd-item-section-renderer');
    if (!commentSection) return comments;

    for (let i = 0; i < scrollDepth; i++) {
      document.querySelectorAll('ytd-comment-thread-renderer ytd-button-renderer button').forEach(btn => {
        if (btn.textContent.includes('more replies') || btn.textContent.includes('View')) btn.click();
      });
      await new Promise(r => setTimeout(r, 300));
      commentSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
      await new Promise(r => setTimeout(r, 400));
      document.querySelectorAll('#show-more button, ytd-continuation-item-renderer button').forEach(btn => btn.click());
      await new Promise(r => setTimeout(r, 500));
      collectVisibleComments(comments);
    }

    return comments;
  }

  function collectVisibleComments(comments) {
    const seen = new Set(comments.map(c => c.id));
    document.querySelectorAll('ytd-comment-thread-renderer').forEach(thread => {
      try {
        const id = thread.getAttribute('id') || '';
        if (seen.has(id)) return;
        const authorEl = thread.querySelector('#header-author a span, #header-author a yt-formatted-string, #name');
        const textEl = thread.querySelector('#content-text');
        const likeEl = thread.querySelector('#vote-count-middle, #action-buttons ytd-toggle-button-renderer button[aria-label]');
        const timeEl = thread.querySelector('#published-time-text a, .yt-time-info');
        const replyCountEl = thread.querySelector('#more-replies button, #reply-count');

        const author = authorEl?.textContent?.trim() || '';
        const text = textEl?.textContent?.trim() || '';
        if (!author && !text) return;

        let likes = 0;
        if (likeEl) {
          const lt = likeEl.getAttribute('aria-label') || likeEl.textContent || '';
          const lm = lt.match(/([\d,]+)/);
          if (lm) likes = parseCount(lm[1]);
        }

        const comment = {
          id, author, text: text.substring(0, 2000), likes,
          timestamp: timeEl?.textContent?.trim() || '',
          replyCount: parseCount(replyCountEl?.textContent || '0'),
          platform: 'youtube',
        };

        comment.replies = [];
        thread.querySelectorAll('ytd-comment-replies-renderer ytd-comment-renderer').forEach(reply => {
          const rText = reply.querySelector('#content-text')?.textContent?.trim() || '';
          const rLike = reply.querySelector('#vote-count-middle');
          let rLikes = 0;
          if (rLike) { const lm = (rLike.textContent || '').match(/([\d,]+)/); if (lm) rLikes = parseCount(lm[1]); }
          if (rText) comment.replies.push({ author: reply.querySelector('#author span, #name')?.textContent?.trim() || '', text: rText.substring(0, 1000), likes: rLikes });
        });

        comments.push(comment);
        seen.add(id);
      } catch { /* silent */ }
    });
  }

  /* ── Main execution ── */
  async function runInitialScrape() {
    const videoData = scrapeVideoData();
    if (videoData) {
      sendBatch('youtube', [videoData]);
    }

    // Scrape comments after short delay
    setTimeout(async () => {
      const comments = await scrapeComments();
      if (comments.length > 0) {
        sendBatch('youtube', [{ dataType: 'comments', videoId: getVideoId(), comments, url: window.location.href, scrapedAt: new Date().toISOString() }]);
      }
    }, 3000);
  }

  function sendBatch(platform, items) {
    try {
      chrome.runtime.sendMessage({ type: 'BATCH_DATA', payload: { platform, items, url: window.location.href } }).catch(() => {});
    } catch { /* extension context invalidated */ }
  }

  /* ── SPA navigation detection ── */
  let lastUrl = window.location.href;
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function (...args) { originalPushState.apply(this, args); checkNav(); };
  history.replaceState = function (...args) { originalReplaceState.apply(this, args); checkNav(); };
  window.addEventListener('popstate', checkNav);

  function checkNav() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(runInitialScrape, 1500);
    }
  }

  /* ── Message listener ── */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REINJECT') {
      setTimeout(runInitialScrape, 1000);
      sendResponse({ ok: true });
      return false;
    }
    if (message.type === 'GET_PAGE_DATA') {
      const videoData = scrapeVideoData();
      sendResponse({ payload: { items: videoData ? [videoData] : [], platform: 'youtube', url: window.location.href } });
      return false;
    }
    return false;
  });
})();
