/* ══════════════════════════════════════════════════════════════════
   NychIQ Chrome Extension v3.0 — Content Script
   Multi-Platform Deep Scraper (YouTube · TikTok · Twitter/X)
   DOM-only extraction — no API keys, no remote dependencies
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const NS = 'nychiq-ext';
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  const API_BASE = 'https://nychiq.com/api';
  const BATCH_KEY = 'nychiq_batch_queue';
  const MAX_BATCH_SIZE = 50;
  const MAX_COMMENTS_SCROLL = 20; // scroll iterations for comment loading

  /* ── Global State ── */
  let config = { showBadges: true, autoAnalyze: false, deepScraping: false, apiBase: API_BASE, cacheTTL: CACHE_TTL };
  let settings = { showBadges: true, autoAnalyze: false, deepScraping: false };
  const STORAGE_KEY = 'nychiq_ext_state';

  /* ── Data Caches ── */
  const videoCache = new Map();
  const channelCache = new Map();
  const batchQueue = [];
  let lastFullScrape = 0;
  let activeCommentObserver = null;
  let activeScrollObserver = null;

  /* ═══════════════════════════════════════════════════════════════
     UTILITY LAYER
     ═══════════════════════════════════════════════════════════════ */

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
   * Heuristic reliability score 0-100 based on how many fields were populated.
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
   * Schedule work in requestAnimationFrame to avoid jank.
   */
  function rafBatch(items, fn, batchSize) {
    batchSize = batchSize || 8;
    let i = 0;
    function tick() {
      const end = Math.min(i + batchSize, items.length);
      for (; i < end; i++) fn(items[i], i);
      if (i < items.length) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /**
   * Debounce helper.
   */
  function debounce(fn, ms) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }

  /**
   * Sleep for ms (used during scroll-to-load).
   */
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 1: PLATFORM DETECTION
     ═══════════════════════════════════════════════════════════════ */

  const PLATFORMS = { YOUTUBE: 'youtube', TIKTOK: 'tiktok', TWITTER: 'twitter' };

  function detectPlatform() {
    const h = window.location.hostname;
    if (/^(www\.)?youtube\.com$/.test(h)) return PLATFORMS.YOUTUBE;
    if (/^(www\.)?tiktok\.com$/.test(h)) return PLATFORMS.TIKTOK;
    if (/^(www\.)?(twitter|x)\.com$/.test(h)) return PLATFORMS.TWITTER;
    return null;
  }

  function isYouTube() { return detectPlatform() === PLATFORMS.YOUTUBE; }
  function isTikTok()  { return detectPlatform() === PLATFORMS.TIKTOK; }
  function isTwitter() { return detectPlatform() === PLATFORMS.TWITTER; }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 2: YOUTUBE DEEP SCRAPER
     ═══════════════════════════════════════════════════════════════ */

  /* ── 2A: Page-data extractors ── */

  function getVideoId() {
    const p = new URLSearchParams(window.location.search);
    if (p.get('v')) return p.get('v');
    const m = window.location.pathname.match(/\/shorts\/([^/]+)/);
    return m ? m[1] : '';
  }

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

  /* ── 2B: scrapeVideoData — full watch-page extraction ── */

  function scrapeVideoData() {
    const videoId = getVideoId();
    if (!videoId) return null;
    const cached = videoCache.get(videoId);
    if (cached && Date.now() - cached._ts < CACHE_TTL) return cached;

    const data = { videoId, _ts: Date.now() };
    let source = 'dom';

    // -- Player response (highest fidelity) --
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
      data.allowRatings = vd.allowRatings;
      data.isLiveContent = vd.isLiveContent;
      data.isPrivate = vd.isPrivate;
      data.isUnpluggedCrop = vd.isUnpluggedCrop;
    }

    // -- ytInitialData enrichment --
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
              // Description expansion (full description)
              const descAttr = si?.attributedDescriptionBodyText?.attributedBodyText?.content;
              if (descAttr) data.description = descAttr;
            }
          }
        }

        // -- Recommended videos --
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

        // -- End screen data --
        data.endScreen = [];
        const es = init?.playerOverlays?.playerOverlayRenderer?.endScreen?.watchNextEndScreenRenderer?.results;
        if (es) {
          for (const e of es) {
            const er = e?.endScreenVideoRenderer;
            if (er) {
              data.endScreen.push({
                videoId: er.videoId || '',
                title: er.title?.simpleText || '',
                views: parseCount(er.shortViewCountText?.simpleText || ''),
                length: er.lengthText?.simpleText || '',
              });
            }
          }
        }

        // -- Engagement buttons from microformat --
        const mf = init?.microformat?.playerMicroformatRenderer;
        if (mf) {
          data.publishDate = mf.publishDate || '';
          data.uploadDate = data.uploadDate || mf.publishDate || '';
          data.category = data.category || mf.category;
          data.availableCountries = mf.availableCountries;
        }
      } catch { /* silent */ }
    }

    // -- DOM: Likes (most reliable live count) --
    const likeBtn = document.querySelector('like-button-view-model button[aria-label], #top-level-buttons-computed ytd-toggle-button-renderer button[aria-label]');
    if (likeBtn) {
      const lt = likeBtn.getAttribute('aria-label') || '';
      const lm = lt.match(/([\d,]+)/);
      if (lm) { data.likes = parseCount(lm[1]); source = 'dom'; }
    }

    // -- DOM: Views from meta --
    const viewMeta = document.querySelector('meta[itemprop="interactionCount"]');
    if (viewMeta) data.viewCount = parseInt(viewMeta.getAttribute('content'), 10) || data.viewCount;

    // -- DOM: Full description --
    const descEl = document.querySelector('#description-inner yt-attributed-string, #attributed-description-inner, ytd-text-inline-expander #inline-expander');
    if (descEl) {
      const dt = descEl.textContent || '';
      if (dt.length > (data.description || '').length) data.description = dt;
    }

    // -- DOM: Description links --
    data.descriptionLinks = [];
    document.querySelectorAll('#description-inner a[href], #attributed-description-inner a[href], ytd-text-inline-expander a[href]').forEach(a => {
      data.descriptionLinks.push({ text: a.textContent.trim(), href: a.href });
    });

    // -- DOM: Tags from meta --
    const metaTags = document.querySelector('meta[name="keywords"]');
    if (metaTags) data.keywords = (metaTags.getAttribute('content') || '').split(',').map(t => t.trim()).filter(Boolean);

    // -- DOM: Comment count --
    const commentHeader = document.querySelector('#comments #count yt-formatted-string, ytd-comments-header-renderer h2, #comments-title yt-formatted-string');
    if (commentHeader) {
      const ct = commentHeader.textContent || '';
      data.commentCount = parseCount(ct);
    } else {
      data.commentCount = document.querySelectorAll('ytd-comment-thread-renderer').length;
    }

    // -- DOM: Channel name fallback --
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

  /* ── 2C: scrapeComments — scroll-to-load deep comment extraction ── */

  async function scrapeComments(scrollDepth) {
    scrollDepth = scrollDepth || (settings.deepScraping ? MAX_COMMENTS_SCROLL : 3);
    const comments = [];

    // Expand comment section if collapsed
    const showMoreBtn = document.querySelector('#sort-menu yt-formatted-string, ytd-comments ytd-button-renderer button');
    if (showMoreBtn) showMoreBtn.click();
    await sleep(500);

    // Collect already visible comments
    collectVisibleComments(comments);

    // Scroll comment section to load more
    const commentSection = document.querySelector('#comments #sections, ytd-item-section-renderer #contents, ytd-comments ytd-item-section-renderer');
    if (!commentSection) return comments;

    for (let i = 0; i < scrollDepth; i++) {
      // Click "Show more replies" buttons
      document.querySelectorAll('ytd-comment-thread-renderer ytd-button-renderer button').forEach(btn => {
        if (btn.textContent.includes('more replies') || btn.textContent.includes('View')) btn.click();
      });
      await sleep(300);

      // Scroll to bottom of comment section
      commentSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
      await sleep(400);

      // Click "Show more" if present
      document.querySelectorAll('#show-more button, ytd-continuation-item-renderer button').forEach(btn => btn.click());
      await sleep(500);

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

        const header = thread.querySelector('#header-author');
        const authorEl = header?.querySelector('a span, a yt-formatted-string, #name');
        const authorAvatar = thread.querySelector('#avatar img');
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
          id,
          author,
          authorAvatar: authorAvatar?.src || '',
          text: text.substring(0, 2000), // cap at 2k chars
          likes,
          timestamp: timeEl?.textContent?.trim() || '',
          replyCount: parseCount(replyCountEl?.textContent || '0'),
          platform: 'youtube',
        };

        // Extract nested replies
        comment.replies = [];
        thread.querySelectorAll('ytd-comment-replies-renderer ytd-comment-renderer').forEach(reply => {
          const rAuthor = reply.querySelector('#author span, #name')?.textContent?.trim() || '';
          const rText = reply.querySelector('#content-text')?.textContent?.trim() || '';
          const rLike = reply.querySelector('#vote-count-middle, #action-buttons ytd-toggle-button-renderer button[aria-label]');
          let rLikes = 0;
          if (rLike) {
            const lt = rLike.getAttribute('aria-label') || rLike.textContent || '';
            const lm = lt.match(/([\d,]+)/);
            if (lm) rLikes = parseCount(lm[1]);
          }
          if (rText) {
            comment.replies.push({ author: rAuthor, text: rText.substring(0, 1000), likes: rLikes });
          }
        });

        comments.push(comment);
        seen.add(id);
      } catch { /* silent */ }
    });
  }

  /* ── 2D: scrapeChannelPage — full channel data extraction ── */

  function scrapeChannelPage() {
    const init = getYTInitialData();
    const data = {};
    let source = 'dom';

    try {
      // -- Header data --
      const header = init?.header?.c4TabbedHeaderRenderer;
      if (header) {
        source = 'initialData';
        data.channelId = header.channelId || '';
        data.title = header.title || '';
        data.subscribers = parseCount(header.subscriberCountText?.simpleText || '0');
        data.videosCount = parseCount(header.videosCountText?.runs?.[0]?.text || '0');
        data.avatar = header.avatar?.thumbnails?.[0]?.url || '';
        data.banner = header.banner?.thumbnails?.[0]?.url || '';
        data.mobileBanner = header.mobileBanner?.thumbnails?.[0]?.url || '';
        data.tvBanner = header.tvBanner?.thumbnails?.[0]?.url || '';
      }

      // -- Metadata --
      const meta = init?.metadata?.channelMetadataRenderer;
      if (meta) {
        data.description = meta.description || '';
        data.externalId = meta.externalId || '';
        data.vanityUrl = meta.vanityChannelUrl || '';
        data.keywords = meta.keywords || '';
      }

      // -- Sidebar --
      const sidebar = init?.sidebar?.channelSidebarRenderer;
      if (sidebar) {
        const ui = sidebar?.items?.[0]?.channelSidebarUserInfoRenderer;
        if (ui) data.joinedDate = ui?.joinedDateText?.content || '';
      }

      // -- Tab contents --
      const tabs = init?.contents?.twoColumnBrowseResultsRenderer?.tabs;
      data.tabs = {};
      if (tabs) {
        for (const tab of tabs) {
          const tr = tab.tabRenderer;
          if (!tr) continue;
          const tabName = tr.title?.toLowerCase() || '';
          const content = tab.content;

          // Videos tab
          if ((tabName === 'videos' || tabName === 'home') && content?.richGridRenderer) {
            data.tabs.videos = extractVideoGrid(content.richGridRenderer);
          }
          // Shorts tab
          if (tabName === 'shorts' && content?.richGridRenderer) {
            data.tabs.shorts = extractShortsGrid(content.richGridRenderer);
          }
          // Playlists tab
          if (tabName === 'playlists' && content?.sectionListRenderer) {
            data.tabs.playlists = [];
            content.sectionListRenderer.contents?.forEach(sec => {
              (sec.itemSectionRenderer?.contents || []).forEach(item => {
                const gr = item.gridRenderer || item.horizontalListRenderer;
                if (gr) {
                  (gr.items || []).forEach(gi => {
                    const sr = gi.gridPlaylistRenderer || gi.lockupMetadataViewModel;
                    if (sr) {
                      data.tabs.playlists.push({
                        title: sr.title?.simpleText || sr.title?.runs?.[0]?.text || sr.titleText?.content || '',
                        videoCount: parseCount(sr.videoCount || sr.thumbnailOverlays?.[0]?.thumbnailOverlayBottomPanelRenderer?.text?.simpleText || '0'),
                        videos: sr.videos || [],
                      });
                    }
                  });
                }
              });
            });
          }
          // Community tab
          if (tabName === 'community' && content?.sectionListRenderer) {
            data.tabs.community = [];
            content.sectionListRenderer.contents?.forEach(sec => {
              (sec.itemSectionRenderer?.contents || []).forEach(item => {
                const cr = item.backstagePostThreadRenderer;
                if (cr) {
                  const post = cr.post?.backstagePostRenderer;
                  if (post) {
                    data.tabs.community.push({
                      text: post.contentText?.content || post.contentText?.runs?.map(r => r.text).join('') || '',
                      likes: parseCount(post.voteCount?.simpleText || '0'),
                      comments: parseCount(post.actionButtons?.commentActionButtonsRenderer?.replyButton?.buttonRenderer?.text?.simpleText || '0'),
                      attachmentType: post.attachment?.backstageAttachmentRenderer?.type || 'none',
                    });
                  }
                }
              });
            });
          }
          // About tab
          if (tabName === 'about' && content?.sectionListRenderer) {
            data.tabs.about = {};
            content.sectionListRenderer.contents?.forEach(sec => {
              const items = sec.itemSectionRenderer?.contents || [];
              items.forEach(item => {
                const cr = item.channelAboutFullMetadataRenderer;
                if (cr) {
                  data.tabs.about = {
                    description: cr.description?.simpleText || '',
                    links: (cr.links || []).map(l => ({ title: l.title?.simpleText || '', url: l.navigationEndpoint?.urlEndpoint?.url || '' })),
                    country: cr.country || '',
                    joinedDate: cr.joinedDateText?.content || '',
                    viewCount: parseCount(cr.viewCountText || '0'),
                    tags: (cr.tags || []).map(t => ''),
                  };
                }
              });
            });
          }
        }
      }

      // -- DOM fallbacks --
      if (!data.subscribers) {
        const subEl = document.querySelector('#subscriber-count');
        if (subEl) data.subscribers = parseCount(subEl.textContent);
      }
      if (!data.description) {
        const descEl = document.querySelector('#description-container, #channel-description');
        if (descEl) data.description = descEl.textContent.trim();
      }
    } catch { /* silent */ }

    data._ts = Date.now();
    const chId = data.channelId || window.location.pathname;
    channelCache.set(chId, data);
    return envelope('youtube', 'channel', data, source);
  }

  function extractVideoGrid(grid) {
    const videos = [];
    (grid.items || []).forEach(item => {
      const ri = item.richItemRenderer?.content?.videoRenderer;
      if (!ri) return;
      videos.push({
        videoId: ri.videoId || '',
        title: ri.title?.simpleText || ri.title?.runs?.[0]?.text || '',
        views: parseCount(ri.viewCountText?.simpleText || ri.viewCountText?.runs?.[0]?.text || ''),
        length: ri.lengthText?.simpleText || '',
        published: ri.publishedTimeText?.simpleText || '',
        thumbnails: ri.thumbnail?.thumbnails || [],
      });
    });
    return videos;
  }

  function extractShortsGrid(grid) {
    const shorts = [];
    (grid.items || []).forEach(item => {
      const ri = item.richItemRenderer?.content?.reelItemRenderer;
      if (!ri) return;
      shorts.push({
        videoId: ri.videoId || '',
        title: ri.headline?.simpleText || '',
        views: parseCount(ri.viewCountText?.simpleText || ri.accessibility?.accessibilityData?.label || ''),
        thumbnail: ri.thumbnail?.thumbnails?.[0]?.url || '',
      });
    });
    return shorts;
  }

  /* ── 2E: scrapeHomePage — batch-scrape visible thumbnails ── */

  function scrapeHomePage() {
    const videos = [];
    const selectors = 'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-rich-section-renderer ytd-rich-grid-row ytd-rich-item-renderer';
    document.querySelectorAll(selectors).forEach(el => {
      const data = scrapeThumbnailData(el);
      if (data.videoId || data.title) videos.push(data);
    });

    // Also grab shelf content (trending, subscriptions rows)
    document.querySelectorAll('ytd-shelf-renderer, ytd-horizontal-list-renderer').forEach(shelf => {
      const title = shelf.querySelector('#title, .title')?.textContent?.trim() || '';
      shelf.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer').forEach(el => {
        const d = scrapeThumbnailData(el);
        if (d.videoId || d.title) { d.shelf = title; videos.push(d); }
      });
    });

    return videos;
  }

  function scrapeThumbnailData(el) {
    const data = {};
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
      const chEl = el.querySelector('ytd-channel-name a, #channel-name a, .ytd-channel-name a');
      data.channel = chEl?.textContent?.trim() || '';
      const viewEl = el.querySelector('#metadata-line span, ytd-video-meta-block span');
      if (viewEl) {
        const t = viewEl.textContent || '';
        const vm = t.match(/([\d.]+[KMB]?)/i);
        data.views = vm ? parseCount(vm[1]) : 0;
        data.metaText = t;
      }
      const img = el.querySelector('img');
      data.thumbnailUrl = img?.src || '';
      const durEl = el.querySelector('ytd-thumbnail-overlay-time-status-renderer span, .badge-shape-wiz__text, ytd-thumbnail-overlay-time-status-renderer');
      data.duration = durEl?.textContent?.trim() || '';
      const timeEl = el.querySelector('#metadata-line span:nth-child(2), ytd-video-meta-block span:nth-child(2)');
      data.uploadAge = timeEl?.textContent?.trim() || '';
    } catch { /* silent */ }
    return data;
  }

  /* ── 2F: scrapeSearchResults — search page data with rankings ── */

  function scrapeSearchResults() {
    const results = [];
    let rank = 0;
    document.querySelectorAll('ytd-video-renderer, ytd-promoted-sparkles-web-renderer ytd-video-renderer, ytd-promoted-video-renderer').forEach(el => {
      rank++;
      const data = scrapeThumbnailData(el);
      data.rank = rank;
      data.isAd = !!el.closest('ytd-promoted-sparkles-web-renderer, ytd-ad-slot-renderer, ytd-promoted-video-renderer');
      // Extract channel verification badge
      data.channelVerified = !!el.querySelector('ytd-channel-name ytd-badge-supported-renderer, .verified-badge');
      // Extract description snippet
      const snip = el.querySelector('#description-text, .metadata-snippet-text');
      data.descriptionSnippet = snip?.textContent?.trim() || '';
      if (data.videoId || data.title) results.push(data);
    });
    return results;
  }

  /* ── 2G: scrapeNotifications — notification panel data ── */

  function scrapeNotifications() {
    const notifications = [];
    // Try to open notification panel briefly
    const notifBtn = document.querySelector('ytd-notification-topbar-button-renderer button, #notifications-button');
    if (!notifBtn) return notifications;

    // We'll scrape whatever is visible
    document.querySelectorAll('ytd-notification-renderer').forEach(el => {
      try {
        const title = el.querySelector('#header yt-formatted-string, .notification-title')?.textContent?.trim() || '';
        const msg = el.querySelector('#message yt-formatted-string, .notification-message')?.textContent?.trim() || '';
        const time = el.querySelector('#timestamp, .notification-time')?.textContent?.trim() || '';
        const thumb = el.querySelector('img')?.src || '';
        const href = el.querySelector('a')?.getAttribute('href') || '';
        const vm = href.match(/[?&]v=([^&]+)/);
        if (title || msg) {
          notifications.push({ title, message: msg, timestamp: time, thumbnail: thumb, videoId: vm ? vm[1] : '', url: href });
        }
      } catch { /* silent */ }
    });
    return notifications;
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 3: TIKTOK SCRAPER
     ═══════════════════════════════════════════════════════════════ */

  function getTikTokVideoId() {
    const m = window.location.pathname.match(/\/video\/(\d+)/);
    return m ? m[1] : '';
  }

  function getTikTokUsername() {
    const m = window.location.pathname.match(/\/@([^/]+)/);
    return m ? m[1] : '';
  }

  function scrapeTikTokVideo() {
    const videoId = getTikTokVideoId();
    if (!videoId) return null;
    const data = { videoId, _ts: Date.now() };
    let source = 'dom';

    try {
      // -- Description/caption --
      const descEl = document.querySelector('[data-e2e="video-desc"], .tiktok-1ywj7cz-DivDescContainer, h1');
      data.description = descEl?.textContent?.trim() || '';

      // -- Author --
      const authorEl = document.querySelector('[data-e2e="video-author-uniqueid"], .tiktok-1c7igrj-StyledAuthorAnchor a, .author-uniqueId');
      data.author = authorEl?.textContent?.trim()?.replace('@', '') || '';
      data.authorDisplayName = document.querySelector('[data-e2e="video-author-name"], .tiktok-1c7igrj-StyledAuthorAnchor span')?.textContent?.trim() || '';

      // -- Stats: likes, comments, shares, bookmarks, views --
      data.likes = parseCount(document.querySelector('[data-e2e="like-count"], .tiktok-x6y88p-DivLikeCount span:last-child, .e1t7o1yu0 a[title]')?.textContent);
      data.commentCount = parseCount(document.querySelector('[data-e2e="comment-count"], .tiktok-x6y88p-DivCommentCount span:last-child')?.textContent);
      data.shares = parseCount(document.querySelector('[data-e2e="share-count"], .tiktok-x6y88p-DivShareCount span:last-child')?.textContent);
      data.bookmarks = parseCount(document.querySelector('[data-e2e="undefined-count"], .tiktok-x6y88p-DivBookmarkCount span:last-child')?.textContent);
      data.views = parseCount(document.querySelector('[data-e2e="video-view-count"], .tiktok-1g0ph1n-StrongVideoCount span, .view-count')?.textContent);

      // -- Music info --
      data.musicTitle = document.querySelector('[data-e2e="video-music"], .tiktok-1d94e4x-DivMusicInfo .tiktok-1p0q2ls-AvatarContainer, .music-info .name')?.textContent?.trim() || '';
      data.musicAuthor = document.querySelector('[data-e2e="video-music"] a, .tiktok-1p0q2ls-AvatarContainer + a')?.textContent?.trim() || '';

      // -- Hashtags from description --
      data.hashtags = [];
      const desc = data.description || '';
      const hashRegex = /#(\w+)/g;
      let match;
      while ((match = hashRegex.exec(desc)) !== null) data.hashtags.push(match[1]);

      // Also get hashtags from tag containers
      document.querySelectorAll('[data-e2e="video-hashtag"], .tiktok-yz6ijl-DivTagContainer a, .hashtag-link').forEach(el => {
        const t = el.textContent?.trim()?.replace('#', '') || '';
        if (t && !data.hashtags.includes(t)) data.hashtags.push(t);
      });

      // -- Author stats (followers, following, totalLikes) --
      data.authorFollowers = parseCount(document.querySelector('[data-e2e="video-author-follower"], .tiktok-1c7igrj-StyledAuthorAnchor [title]')?.textContent);
      data.authorFollowing = 0;
      data.authorTotalLikes = 0;
      // Try to get from meta
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        const md = metaDesc.getAttribute('content') || '';
        const fm = md.match(/([\d.]+[KMB]?)\s*(?:followers?|fans?)/i);
        if (fm) data.authorFollowers = parseCount(fm[1]);
        const lm = md.match(/([\d.]+[KMB]?)\s*(?:likes?)/i);
        if (lm) data.authorTotalLikes = parseCount(lm[1]);
      }

      // -- Creation date from DOM --
      data.uploadDate = document.querySelector('[data-e2e="video-publish-date"], time')?.textContent?.trim() || '';

      // -- Engagement rate calculation --
      if (data.views > 0) {
        data.engagementRate = Math.round(((data.likes + data.commentCount + data.shares) / data.views) * 10000) / 100;
      }

      source = 'dom';
    } catch { /* silent */ }

    return envelope('tiktok', 'video', data, source);
  }

  function scrapeTikTokProfile() {
    const username = getTikTokUsername();
    if (!username) return null;
    const data = { username, _ts: Date.now() };
    let source = 'dom';

    try {
      data.displayName = document.querySelector('[data-e2e="user-title"], h2, .tiktok-1ery3x1-StyledRealName')?.textContent?.trim() || '';
      data.bio = document.querySelector('[data-e2e="user-bio"], .tiktok-1jx1b1d-DivContainer, .user-bio')?.textContent?.trim() || '';

      // Stats: follower count, following count, likes total
      const statsEls = document.querySelectorAll('[data-e2e="user-post-item-count"], .tiktok-18zf8sx-DivUserStats .tiktok-1amjzpx-SpanText');
      const statsTexts = [];
      statsEls.forEach(el => statsTexts.push(el.textContent.trim()));
      // Also try strong elements
      document.querySelectorAll('.tiktok-18zf8sx-DivUserStats strong, .user-count strong').forEach(el => {
        statsTexts.push(el.textContent.trim());
      });

      // Parse: typically "Following" | "Followers" | "Likes"
      const allStatEls = document.querySelectorAll('[data-e2e="user-post-item-count"], [data-e2e="followers-count"], [data-e2e="following-count"], [data-e2e="likes-count"], .count-number');
      if (allStatEls.length >= 3) {
        data.followingCount = parseCount(allStatEls[0]?.textContent);
        data.followersCount = parseCount(allStatEls[1]?.textContent);
        data.likesCount = parseCount(allStatEls[2]?.textContent);
      } else {
        // Fallback: scan all strong spans
        const counts = document.querySelectorAll('.tiktok-18zf8sx-DivUserStats span, .tiktok-1amjzpx-SpanText');
        if (counts.length >= 3) {
          data.followingCount = parseCount(counts[0]?.textContent);
          data.followersCount = parseCount(counts[1]?.textContent);
          data.likesCount = parseCount(counts[2]?.textContent);
        }
      }

      // Video count
      data.videoCount = parseCount(document.querySelector('[data-e2e="user-tab-item-count"]')?.textContent || '0');

      // Profile link
      data.profileUrl = window.location.href;

      // Social links
      data.socialLinks = [];
      document.querySelectorAll('[data-e2e="user-link-item"] a, .social-link a').forEach(a => {
        data.socialLinks.push({ text: a.textContent.trim(), href: a.href });
      });

      source = 'dom';
    } catch { /* silent */ }

    return envelope('tiktok', 'profile', data, source);
  }

  function scrapeTikTokComments() {
    const comments = [];
    try {
      document.querySelectorAll('[data-e2e="comment-list"] > div, .tiktok-x6f6za-DivCommentItemContainer, .comment-item').forEach(el => {
        const author = el.querySelector('[data-e2e="comment-username"], .comment-author')?.textContent?.trim()?.replace('@', '') || '';
        const text = el.querySelector('[data-e2e="comment-text"], .comment-text')?.textContent?.trim() || '';
        const likes = parseCount(el.querySelector('[data-e2e="comment-like-count"], .comment-likes span:last-child')?.textContent);
        const time = el.querySelector('[data-e2e="comment-time"], .comment-time, time')?.textContent?.trim() || '';
        const avatar = el.querySelector('img')?.src || '';
        if (author || text) {
          comments.push({ author, text: text.substring(0, 2000), likes, timestamp: time, avatar });
        }
      });
    } catch { /* silent */ }
    return comments;
  }

  function scrapeTikTokFeed() {
    const videos = [];
    try {
      // For You page / feed — scrape visible video cards
      document.querySelectorAll('[data-e2e="recommend-list-item-container"], .tiktok-1srot6y-DivItemContainerForFeed').forEach(el => {
        const data = {};
        data.author = el.querySelector('[data-e2e="video-author-uniqueid"], .author-uniqueId')?.textContent?.trim()?.replace('@', '') || '';
        data.description = el.querySelector('[data-e2e="video-desc"], .video-desc')?.textContent?.trim() || '';
        data.likes = parseCount(el.querySelector('[data-e2e="like-count"] span:last-child')?.textContent);
        data.commentCount = parseCount(el.querySelector('[data-e2e="comment-count"] span:last-child')?.textContent);
        data.music = el.querySelector('[data-e2e="video-music"], .music-info')?.textContent?.trim() || '';
        data.thumbnail = el.querySelector('img')?.src || '';
        data.link = el.querySelector('a')?.getAttribute('href') || '';
        const vm = data.link.match(/\/video\/(\d+)/);
        data.videoId = vm ? vm[1] : '';
        if (data.videoId || data.author) videos.push(data);
      });
    } catch { /* silent */ }
    return videos;
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 4: TWITTER/X SCRAPER
     ═══════════════════════════════════════════════════════════════ */

  function getTweetId() {
    const m = window.location.pathname.match(/\/status\/(\d+)/);
    return m ? m[1] : '';
  }

  function getTwitterUsername() {
    const m = window.location.pathname.match(/\/([^/]+)/);
    if (m && !['home', 'explore', 'search', 'notifications', 'messages', 'settings', 'i'].includes(m[1])) return m[1];
    return '';
  }

  function scrapeTweet() {
    const tweetId = getTweetId();
    if (!tweetId) return null;
    const data = { tweetId, _ts: Date.now() };
    let source = 'dom';

    try {
      // -- Tweet text --
      const tweetEl = document.querySelector('[data-testid="tweetText"]') || document.querySelector('article [lang]');
      data.text = tweetEl?.textContent?.trim() || '';

      // Get ALL tweet text (multiple paragraphs)
      if (!data.text) {
        const texts = [];
        document.querySelectorAll('article [data-testid="tweetText"]').forEach(el => texts.push(el.textContent.trim()));
        data.text = texts.join('\n');
      }

      // -- Author --
      const authorEl = document.querySelector('article [data-testid="User-Name"]') || document.querySelector('[data-testid="UserName"]');
      if (authorEl) {
        data.authorName = authorEl.querySelector('span')?.textContent?.trim() || '';
        data.authorHandle = authorEl.querySelector('a')?.getAttribute('href')?.replace('/', '') || '';
        const timeEl = authorEl.querySelector('time');
        data.timestamp = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || '';
      }

      // -- Engagement metrics --
      // Twitter/X shows these in the action bar
      const actionBar = document.querySelector('article [data-testid="tweet"]') || document.querySelector('article');
      if (actionBar) {
        // Replies
        data.replyCount = parseCount(actionBar.querySelector('[data-testid="reply"] [data-testid="app-text-transition-container"]')?.textContent);
        // Retweets (includes quote tweets sometimes)
        data.retweetCount = parseCount(actionBar.querySelector('[data-testid="retweet"] [data-testid="app-text-transition-container"]')?.textContent);
        // Likes
        data.likeCount = parseCount(actionBar.querySelector('[data-testid="like"] [data-testid="app-text-transition-container"]')?.textContent);
        // Bookmarks
        data.bookmarkCount = parseCount(actionBar.querySelector('[data-testid="bookmark"] [data-testid="app-text-transition-container"]')?.textContent);
        // Views (impressions)
        data.views = parseCount(actionBar.querySelector('[href*="/analytics"] span, [data-testid="app-text-transition-container"]')?.textContent);
      }

      // -- View count (often separate from action bar) --
      if (!data.views) {
        const viewEl = document.querySelector('article a[href*="analytics"] span, article [data-testid="view"]') ||
                       document.querySelector('[data-testid="tweet"] [data-testid="app-text-transition-container"]:last-of-type');
        if (viewEl) data.views = parseCount(viewEl.textContent);
      }

      // -- Media (images, videos, polls) --
      data.media = [];
      document.querySelectorAll('article [data-testid="videoPlayer"], article video').forEach(el => {
        data.media.push({ type: 'video' });
      });
      document.querySelectorAll('article [data-testid="tweetPhoto"], article img[src*="pbs.twimg.com"]').forEach(el => {
        data.media.push({ type: 'image', src: el.src || '' });
      });

      // -- Quote tweet --
      const quoteEl = document.querySelector('article [data-testid="card.wrapper"]');
      if (quoteEl) {
        data.quoteTweetText = quoteEl.textContent.trim().substring(0, 500);
      }

      // -- Card/link preview --
      const cardEl = document.querySelector('article [data-testid="card.layoutLarge.media"], article [data-testid="card.layoutSmall.media"]');
      if (cardEl) {
        data.cardTitle = cardEl.querySelector('[data-testid="card.wrapper"] span')?.textContent?.trim() || '';
        data.cardUrl = cardEl.querySelector('a')?.getAttribute('href') || '';
      }

      // -- Hashtags and mentions --
      data.hashtags = (data.text.match(/#(\w+)/g) || []).map(h => h.replace('#', ''));
      data.mentions = (data.text.match(/@(\w+)/g) || []).map(m => m.replace('@', ''));

      // -- Engagement rate --
      if (data.views > 0) {
        data.engagementRate = Math.round(((data.likeCount + data.replyCount + data.retweetCount) / data.views) * 10000) / 100;
      }

      source = 'dom';
    } catch { /* silent */ }

    return envelope('twitter', 'tweet', data, source);
  }

  function scrapeTwitterProfile() {
    const username = getTwitterUsername();
    if (!username) return null;
    const data = { username, _ts: Date.now() };
    let source = 'dom';

    try {
      // -- Profile header --
      data.displayName = document.querySelector('[data-testid="UserName"] > div:first-child span, [data-testid="UserDescription"]')?.parentElement?.querySelector('h2 span')?.textContent?.trim() ||
                          document.querySelector('[data-testid="UserName"] div[dir="ltr"]')?.textContent?.trim() || '';
      data.handle = '@' + username;

      // -- Bio --
      data.bio = document.querySelector('[data-testid="UserDescription"], [data-testid="UserName"] + div div')?.textContent?.trim() || '';

      // -- Stats: Following, Followers, Tweet count --
      const statLinks = document.querySelectorAll('a[href*="/following"], a[href*="/verified_followers"], a[href*="/followers"], a[href*="/status"]');
      statLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.querySelector('span')?.textContent?.trim() || link.textContent?.trim() || '';
        const val = parseCount(text);
        if (href.includes('/following') && !href.includes('verified')) data.following = val;
        if (href.includes('/verified_followers') || href.includes('/followers')) data.followers = val;
      });

      // Fallback: look for specific test IDs
      const followingEl = document.querySelector('[data-testid="UserName"] + div a[href*="following"] span');
      if (followingEl) data.following = parseCount(followingEl.textContent);

      const followersEl = document.querySelector('a[href*="verified_followers"] span, a[href*="/followers"] span');
      if (followersEl) data.followers = parseCount(followersEl.textContent);

      // -- Location, link, joined date --
      data.location = document.querySelector('[data-testid="UserLocation"] span')?.textContent?.trim() || '';
      data.url = document.querySelector('[data-testid="UserUrl"] a')?.getAttribute('href') || '';
      data.joinedDate = document.querySelector('[data-testid="UserJoinDate"] span')?.textContent?.trim() || '';

      // -- Professional / verified --
      data.verified = !!document.querySelector('[data-testid="icon-verified"], [data-testid="Badge"]');
      data.isPremium = !!document.querySelector('[data-testid="icon-verified-blue"], [aria-label*="verified"]');

      // -- Tweet count (from profile stats) --
      // Often "123 Posts" or just the number
      const postCountEls = document.querySelectorAll('[data-testid="UserName"] ~ div span, .css-175oi2r span');
      for (const el of postCountEls) {
        const t = el.textContent?.trim() || '';
        if (/\d+[KMB]?\s*(Post|Tweet|post|tweet)/.test(t)) {
          data.tweetCount = parseCount(t);
          break;
        }
      }

      source = 'dom';
    } catch { /* silent */ }

    return envelope('twitter', 'profile', data, source);
  }

  function scrapeTwitterTrends() {
    const trends = [];
    try {
      document.querySelectorAll('[data-testid="trend"], [aria-label*="Trends"] section > div > div').forEach(el => {
        const name = el.querySelector('span')?.textContent?.trim() || '';
        const category = el.querySelector('[data-testid="trend-name"] + div, div:nth-child(2)')?.textContent?.trim() || '';
        const postCount = parseCount(el.querySelector('[data-testid="trend-name"] + div + div, div:nth-child(3)')?.textContent || '0');
        if (name) trends.push({ name, category, postCount });
      });

      // Alternative selectors for the "What's happening" / "Trends for you" sidebar
      document.querySelectorAll('section[aria-label*="Trend"] [role="listitem"], [data-testid="trend"]').forEach(el => {
        const spans = el.querySelectorAll('span');
        let name = '', category = '', postCount = 0;
        spans.forEach((span, i) => {
          const t = span.textContent.trim();
          if (i === 0) { if (t) name = t; }
          else if (i === 1 && t.length < 20) category = t;
          else postCount = parseCount(t);
        });
        if (name && !trends.find(tr => tr.name === name)) {
          trends.push({ name, category, postCount });
        }
      });
    } catch { /* silent */ }
    return trends;
  }

  function scrapeTwitterFeed() {
    const tweets = [];
    try {
      document.querySelectorAll('[data-testid="tweetText"]').forEach(el => {
        const article = el.closest('article') || el.closest('[data-testid="tweet"]');
        if (!article) return;
        const text = el.textContent?.trim() || '';
        const authorEl = article.querySelector('[data-testid="User-Name"]');
        const authorName = authorEl?.querySelector('span')?.textContent?.trim() || '';
        const authorHandle = authorEl?.querySelector('a')?.getAttribute('href')?.replace('/', '') || '';
        const timeEl = authorEl?.querySelector('time');
        const timestamp = timeEl?.getAttribute('datetime') || '';
        const linkEl = article.querySelector('a[href*="/status/"]');
        const href = linkEl?.getAttribute('href') || '';
        const tm = href.match(/\/status\/(\d+)/);
        const tweetId = tm ? tm[1] : '';
        const likes = parseCount(article.querySelector('[data-testid="like"] [data-testid="app-text-transition-container"]')?.textContent);
        const retweets = parseCount(article.querySelector('[data-testid="retweet"] [data-testid="app-text-transition-container"]')?.textContent);
        const replies = parseCount(article.querySelector('[data-testid="reply"] [data-testid="app-text-transition-container"]')?.textContent);
        if (text && !tweets.find(t => t.tweetId === tweetId)) {
          tweets.push({ tweetId, text: text.substring(0, 2000), authorName, authorHandle, timestamp, likes, retweets, replies });
        }
      });
    } catch { /* silent */ }
    return tweets;
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 5: BATCH COLLECTION
     ═══════════════════════════════════════════════════════════════ */

  /**
   * Gather ALL platform data into a single structured payload.
   */
  function collectAllVisibleData() {
    const payload = { platform: detectPlatform(), url: window.location.href, collectedAt: new Date().toISOString(), items: [] };
    const add = (data) => { if (data) payload.items.push(data); };

    if (isYouTube()) {
      // Watch page
      if (window.location.pathname.includes('/watch') || window.location.pathname.includes('/shorts')) {
        add(scrapeVideoData());
        // Deep mode: also scrape comments, recommendations, end screen
        if (settings.deepScraping) {
          const comments = scrapeComments(5); // moderate depth for batch
          if (comments.length) add(envelope('youtube', 'comments', { videoId: getVideoId(), count: comments.length, comments }, 'dom'));
        }
      }
      // Channel page
      if (window.location.pathname.startsWith('/@') || window.location.pathname.startsWith('/channel/')) {
        add(scrapeChannelPage());
      }
      // Search page
      if (window.location.pathname === '/results') {
        const results = scrapeSearchResults();
        if (results.length) add(envelope('youtube', 'search', { query: new URLSearchParams(window.location.search).get('search_query') || '', results }, 'dom'));
      }
      // Home / browse
      if (window.location.pathname === '/' || window.location.pathname === '/feed/trending' || window.location.pathname === '/feed/subscriptions') {
        const homeVideos = scrapeHomePage();
        if (homeVideos.length) add(envelope('youtube', 'home', { videos: homeVideos }, 'dom'));
      }
      // Notifications
      const notifs = scrapeNotifications();
      if (notifs.length) add(envelope('youtube', 'notifications', { notifications: notifs }, 'dom'));
    }

    if (isTikTok()) {
      if (window.location.pathname.includes('/video/')) {
        add(scrapeTikTokVideo());
        if (settings.deepScraping) {
          const comments = scrapeTikTokComments();
          if (comments.length) add(envelope('tiktok', 'comments', { videoId: getTikTokVideoId(), count: comments.length, comments }, 'dom'));
        }
      }
      if (window.location.pathname.startsWith('/@') && !window.location.pathname.includes('/video/')) {
        add(scrapeTikTokProfile());
      }
      // For You / feed
      if (window.location.pathname === '/foryou' || window.location.pathname === '/' || window.location.pathname === '/feed') {
        const feed = scrapeTikTokFeed();
        if (feed.length) add(envelope('tiktok', 'feed', { videos: feed }, 'dom'));
      }
    }

    if (isTwitter()) {
      if (window.location.pathname.match(/\/status\//)) {
        add(scrapeTweet());
      }
      if (getTwitterUsername() && !getTweetId()) {
        add(scrapeTwitterProfile());
      }
      // Trends (home page, explore)
      const trends = scrapeTwitterTrends();
      if (trends.length) add(envelope('twitter', 'trends', { trends }, 'dom'));
      // Timeline feed
      if (window.location.pathname === '/home' || window.location.pathname === '/') {
        const feed = scrapeTwitterFeed();
        if (feed.length) add(envelope('twitter', 'feed', { tweets: feed }, 'dom'));
      }
    }

    return payload;
  }

  /**
   * Send collected data to background script, which batches and syncs to the Worker API.
   */
  function sendBatchToWorker(data) {
    if (!data || !data.items || data.items.length === 0) return;
    try {
      chrome.runtime.sendMessage({ type: 'BATCH_DATA', payload: data }, (resp) => {
        // Best-effort: we don't need to await this
        if (chrome.runtime.lastError) {
          console.debug('[NychIQ] Batch send error:', chrome.runtime.lastError.message);
        }
      });
    } catch { /* silent */ }
  }

  /**
   * Convenience: collect and send.
   */
  function collectAndSend() {
    const data = collectAllVisibleData();
    if (data.items.length > 0) sendBatchToWorker(data);
    return data;
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 6: SCORE CALCULATIONS
     ═══════════════════════════════════════════════════════════════ */

  function calculateViralScore(data) {
    if (!data || !data.views) return null;
    let score = 50;
    const viewLog = Math.log10(Math.max(data.views, 1));
    score += Math.min(viewLog * 10, 25);

    const engRate = data.likes > 0 ? (data.likes / data.views) * 100 : 0;
    if (engRate > 5) score += 15;
    else if (engRate > 3) score += 10;
    else if (engRate > 1.5) score += 5;
    else score -= 5;

    if (data.commentCount && data.views > 0) {
      const cr = (data.commentCount / data.views) * 100;
      if (cr > 0.5) score += 5;
      else if (cr > 0.1) score += 2;
    }

    if (data.lengthSeconds) {
      const mins = data.lengthSeconds / 60;
      if (mins >= 8 && mins <= 15) score += 5;
      else if (mins >= 3 && mins <= 25) score += 2;
      else if (mins < 1) score -= 10;
    }

    if (data.title) {
      if (data.title.length >= 40 && data.title.length <= 65) score += 3;
      if (/[\d!?]/.test(data.title)) score += 2;
    }
    if (data.keywords && data.keywords.length >= 5) score += 3;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function calculateEngagementRate(data) {
    if (!data || !data.views || data.views === 0) return null;
    const likes = data.likes || 0;
    const comments = data.commentCount || 0;
    const shares = data.shares || 0;
    return Math.round(((likes + comments + shares) / data.views) * 10000) / 100;
  }

  function calculateSEOScore(data) {
    if (!data) return null;
    let score = 30;
    const title = data.title || '';
    if (title.length >= 40 && title.length <= 65) score += 15;
    else if (title.length >= 30 && title.length <= 75) score += 8;
    else score -= 5;
    const pw = ['how', 'why', 'best', 'top', 'ultimate', 'secret', 'never', 'always', 'amazing', 'incredible'];
    const pc = pw.filter(w => title.toLowerCase().includes(w)).length;
    score += Math.min(pc * 3, 9);
    const desc = data.description || '';
    if (desc.length > 200) score += 10;
    else if (desc.length > 100) score += 5;
    if (desc.includes('#') || desc.includes('http')) score += 3;
    const tags = data.keywords || [];
    if (tags.length >= 10) score += 8;
    else if (tags.length >= 5) score += 4;
    if (tags.length > 0) {
      const tw = title.toLowerCase().split(/\s+/);
      const to = tags.filter(t => tw.some(w => t.toLowerCase().includes(w))).length;
      score += Math.min(to * 2, 6);
    }
    if (data.category) score += 3;
    return Math.max(0, Math.min(100, score));
  }

  function estimateCTR(data) {
    if (!data) return null;
    let ctr = 4;
    if (data.title) {
      if (/\?|!|never|secret|why|how/.test(data.title.toLowerCase())) ctr += 1.5;
      if (/\d/.test(data.title)) ctr += 0.8;
      if (/[[(]/.test(data.title)) ctr += 1;
      if (data.title.length >= 40 && data.title.length <= 55) ctr += 0.5;
    }
    if (data.views > 100 && data.likes > 0) {
      const er = (data.likes / data.views) * 100;
      if (er > 4) ctr += 2;
      else if (er > 2) ctr += 1;
    }
    return Math.max(1, Math.min(20, Math.round(ctr * 100) / 100));
  }

  /**
   * NEW: Niche Score — how defined is this content's niche?
   */
  function calculateNicheScore(data) {
    if (!data) return null;
    let score = 30;

    // Tag coherence (tags sharing words with title)
    const title = (data.title || '').toLowerCase();
    const tags = data.keywords || [];
    if (tags.length > 0 && title.length > 0) {
      const titleWords = new Set(title.split(/\s+/).filter(w => w.length > 3));
      const tagOverlap = tags.filter(t => titleWords.has(t.toLowerCase())).length;
      score += Math.min(tagOverlap * 8, 24);
    }

    // Category specificity
    if (data.category) score += 15;

    // Description richness
    const desc = data.description || '';
    if (desc.length > 500) score += 10;
    else if (desc.length > 200) score += 5;

    // Hashtag usage (TikTok/Twitter)
    if (data.hashtags && data.hashtags.length > 3) score += 10;

    // Consistent naming
    if (data.author && title.includes(data.author.toLowerCase())) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * NEW: Monetization Potential — estimate revenue capacity.
   */
  function calculateMonetizationPotential(data) {
    if (!data || !data.views) return null;
    let score = 0;
    const views = data.views;

    // View threshold tiers
    if (views > 100000) score += 30;
    else if (views > 10000) score += 20;
    else if (views > 1000) score += 10;

    // Engagement signals
    const engRate = calculateEngagementRate(data) || 0;
    if (engRate > 5) score += 20;
    else if (engRate > 2) score += 10;

    // Content length (longer = more ad slots)
    if (data.lengthSeconds) {
      if (data.lengthSeconds > 600) score += 15; // 10+ min
      else if (data.lengthSeconds > 180) score += 8; // 3+ min
    }

    // Subscriber base
    if (data.channelSubscribers > 100000) score += 15;
    else if (data.channelSubscribers > 10000) score += 10;
    else if (data.channelSubscribers > 1000) score += 5;

    // CTR bonus
    const ctr = estimateCTR(data) || 0;
    if (ctr > 8) score += 10;
    else if (ctr > 5) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * NEW: Growth Velocity — estimate growth trajectory.
   */
  function calculateGrowthVelocity(data) {
    if (!data) return null;
    let score = 40; // base

    // Recency of upload (newer = higher velocity potential)
    const age = data.uploadAge || data.uploadDate || '';
    if (age.match(/\d+ (hour|minute|min|sec)/i)) score += 25;
    else if (age.match(/\d+ day/i)) score += 15;
    else if (age.match(/\d+ week/i)) score += 5;
    else if (age.match(/\d+ month/i)) score -= 5;

    // Views-to-age ratio proxy (high views on recent = high velocity)
    if (data.views && data.views > 0) {
      const viewLog = Math.log10(data.views);
      if (viewLog > 5) score += 15; // 100K+
      else if (viewLog > 4) score += 10; // 10K+
      else if (viewLog > 3) score += 5;
    }

    // Engagement acceleration
    const engRate = calculateEngagementRate(data) || 0;
    if (engRate > 5) score += 10;
    else if (engRate > 2) score += 5;

    // Comment activity (active discussion = growth)
    if (data.commentCount && data.views) {
      const commentRatio = data.commentCount / data.views * 100;
      if (commentRatio > 0.3) score += 5;
    }

    // Share velocity (especially for TikTok/Twitter)
    if (data.shares && data.views) {
      const shareRatio = data.shares / data.views * 100;
      if (shareRatio > 1) score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 7: UI RENDERING (Badges + Overlay)
     ═══════════════════════════════════════════════════════════════ */

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
        position: fixed; bottom: 140px; right: 24px; z-index: 9999; width: 380px;
        background: #141414; border: 1px solid #1F1F1F; border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden; animation: nychiq-su 0.4s ease;
      }
      .nq-oh { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #1F1F1F; background: #0D0D0D; }
      .nq-ot { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #FFF; }
      .nq-ot span.amber { color: #FDBA2D; }
      .nq-ot .nq-platform-tag { font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(139,92,246,0.2); color: #C4B5FD; text-transform: uppercase; letter-spacing: 0.5px; }
      .nq-oc { width: 28px; height: 28px; border-radius: 8px; background: transparent; border: 1px solid #1F1F1F; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      .nq-oc:hover { background: #1F1F1F; color: #FFF; }
      .nq-ob { padding: 16px; max-height: 500px; overflow-y: auto; }
      .nq-ob::-webkit-scrollbar { width: 4px; }
      .nq-ob::-webkit-scrollbar-thumb { background: #1F1F1F; border-radius: 2px; }
      .nq-mr { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
      .nq-mr:last-child { border-bottom: none; }
      .nq-ml { font-size: 11px; color: #A3A3A3; }
      .nq-mv { font-size: 13px; font-weight: 700; color: #FFF; }
      .nq-meter { width: 100%; height: 5px; background: #1F1F1F; border-radius: 3px; overflow: hidden; margin-top: 3px; }
      .nq-mf { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
      .nq-of { padding: 12px 16px; border-top: 1px solid #1F1F1F; display: flex; gap: 8px; }
      .nq-of a, .nq-of button { display: block; flex: 1; text-align: center; padding: 10px; border-radius: 10px; background: linear-gradient(135deg, #FDBA2D, #C69320); color: #000; font-size: 12px; font-weight: 700; text-decoration: none; border: none; cursor: pointer; }
      .nq-of button.secondary { background: #1F1F1F; color: #A3A3A3; }
      .nq-of a:hover, .nq-of button:hover { filter: brightness(1.1); }
      .nq-section { margin-bottom: 12px; }
      .nq-section-title { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
      .nq-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #1F1F1F; color: #A3A3A3; font-size: 10px; margin: 2px; }
      .nq-tag.good { background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.2); }
      .nq-tag.warn { background: rgba(253,186,45,0.15); color: #FDBA2D; border: 1px solid rgba(253,186,45,0.2); }
      .nq-tag.bad { background: rgba(239,68,68,0.15); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }
      .nq-ai-tip { background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 10px 12px; margin-top: 8px; font-size: 11px; color: #C4B5FD; line-height: 1.5; }
      .nq-reliability { font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
      .nq-reliability.high { background: rgba(16,185,129,0.15); color: #10B981; }
      .nq-reliability.med { background: rgba(253,186,45,0.15); color: #FDBA2D; }
      .nq-reliability.low { background: rgba(239,68,68,0.15); color: #EF4444; }
      @keyframes nychiq-fi { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      @keyframes nychiq-su { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes nq-pulse { 0%,100% { box-shadow: 0 2px 8px rgba(16,185,129,0.3); } 50% { box-shadow: 0 2px 16px rgba(16,185,129,0.6); } }
      @keyframes nq-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      /* Platform-specific badge colors */
      .nq-tiktok-badge { background: rgba(254,44,85,0.85) !important; border-color: rgba(254,44,85,0.4) !important; }
      .nq-twitter-badge { background: rgba(29,155,240,0.85) !important; border-color: rgba(29,155,240,0.4) !important; }
    `;
    document.head.appendChild(style);
  }

  function getScoreColor(s) { return s >= 75 ? '#10B981' : s >= 50 ? '#FDBA2D' : '#EF4444'; }

  function renderMetric(label, value, max) {
    const pct = Math.min((value / max) * 100, 100);
    const color = getScoreColor((value / max) * 100);
    const displayVal = max === 10 ? value + '%' : max === 20 ? value + '%' : value + '/100';
    return `<div class="nq-mr"><span class="nq-ml">${label}</span><span class="nq-mv" style="color:${color}">${displayVal}</span></div><div class="nq-meter"><div class="nq-mf" style="width:${pct}%;background:${color}"></div></div><div style="height:6px"></div>`;
  }

  /* ── YouTube badges ── */
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

    const anchor = el.querySelector('a#thumbnail, a.ytd-thumbnail, ytd-thumbnail');
    if (anchor) {
      anchor.style.position = 'relative';
      anchor.appendChild(badge);
    }
  }

  function processYouTubeThumbnails() {
    if (!settings.showBadges || !isYouTube()) return;
    const thumbs = document.querySelectorAll('ytd-rich-item-renderer:not([data-nychiq-scored]), ytd-video-renderer:not([data-nychiq-scored]), ytd-grid-video-renderer:not([data-nychiq-scored])');
    rafBatch(Array.from(thumbs), (item) => {
      const d = scrapeThumbnailData(item);
      item.dataset.nychiqScored = '1';
      addScoreBadge(item, d);
    });
  }

  /* ── TikTok badges ── */
  function processTikTokCards() {
    if (!settings.showBadges || !isTikTok()) return;
    const cards = document.querySelectorAll('[data-e2e="recommend-list-item-container"]:not([data-nychiq-scored]), .tiktok-1srot6y-DivItemContainerForFeed:not([data-nychiq-scored])');
    rafBatch(Array.from(cards), (card) => {
      card.dataset.nychiqScored = '1';
      const likes = parseCount(card.querySelector('[data-e2e="like-count"] span:last-child')?.textContent);
      const views = parseCount(card.querySelector('[data-e2e="video-view-count"] span')?.textContent);
      const followers = parseCount(card.querySelector('[data-e2e="video-author-follower"]')?.textContent);
      if (!views && !likes) return;
      // Simple score for TikTok based on engagement metrics
      let score = 50;
      if (views > 0) { score += Math.min(Math.log10(views) * 10, 30); }
      if (likes > 0 && views > 0) { const er = (likes / views) * 100; if (er > 5) score += 15; else if (er > 2) score += 8; }
      score = Math.max(0, Math.min(100, Math.round(score)));
      const cls = score >= 75 ? 'nq-high nq-tiktok-badge' : score >= 50 ? 'nq-med nq-tiktok-badge' : 'nq-low nq-tiktok-badge';
      const label = score >= 75 ? 'VIRAL' : score >= 50 ? 'HOT' : 'NEW';
      const badge = document.createElement('div');
      badge.className = `nychiq-score-badge ${cls}`;
      badge.innerHTML = `<span class="nq-num">${score}</span><span class="nq-lbl">${label}</span>`;
      card.style.position = 'relative';
      card.appendChild(badge);
    });
  }

  /* ── Twitter badges ── */
  function processTwitterTweets() {
    if (!settings.showBadges || !isTwitter()) return;
    const tweets = document.querySelectorAll('article[data-testid="tweet"]:not([data-nychiq-scored])');
    rafBatch(Array.from(tweets), (tweet) => {
      tweet.dataset.nychiqScored = '1';
      const likes = parseCount(tweet.querySelector('[data-testid="like"] [data-testid="app-text-transition-container"]')?.textContent);
      const retweets = parseCount(tweet.querySelector('[data-testid="retweet"] [data-testid="app-text-transition-container"]')?.textContent);
      const replies = parseCount(tweet.querySelector('[data-testid="reply"] [data-testid="app-text-transition-container"]')?.textContent);
      if (!likes && !retweets && !replies) return;
      let score = 40 + Math.min(Math.log10(Math.max(likes, 1)) * 8, 25) + Math.min(retweets * 2, 15) + Math.min(replies, 10);
      score = Math.max(0, Math.min(100, Math.round(score)));
      const cls = score >= 75 ? 'nq-high nq-twitter-badge' : score >= 50 ? 'nq-med nq-twitter-badge' : 'nq-low nq-twitter-badge';
      const label = score >= 75 ? 'VIRAL' : score >= 50 ? 'HOT' : 'NEW';
      const badge = document.createElement('div');
      badge.className = `nychiq-score-badge ${cls}`;
      badge.innerHTML = `<span class="nq-num">${score}</span><span class="nq-lbl">${label}</span>`;
      const container = tweet.querySelector('[data-testid="tweetText"]')?.parentElement;
      if (container) {
        container.style.position = 'relative';
        container.insertBefore(badge, container.firstChild);
      }
    });
  }

  /* ── Floating analyze button ── */
  function addFloatingButton() {
    if (document.getElementById(`${NS}-fab`)) return;
    const platform = detectPlatform();
    const showFab = (platform === PLATFORMS.YOUTUBE && window.location.pathname.includes('/watch')) ||
                    (platform === PLATFORMS.TIKTOK && window.location.pathname.includes('/video/')) ||
                    (platform === PLATFORMS.TWITTER && !!getTweetId());
    if (!showFab) return;

    const btn = document.createElement('button');
    btn.id = `${NS}-fab`;
    btn.className = 'nychiq-analyze-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>';
    btn.addEventListener('click', showAnalysisOverlay);
    document.body.appendChild(btn);
  }

  /* ── Analysis overlay ── */
  function showAnalysisOverlay() {
    if (document.getElementById(`${NS}-overlay`)) return;
    const platform = detectPlatform();

    let data, platformLabel;
    if (platform === PLATFORMS.YOUTUBE) {
      data = scrapeVideoData();
      platformLabel = 'YouTube';
    } else if (platform === PLATFORMS.TIKTOK) {
      data = scrapeTikTokVideo();
      platformLabel = 'TikTok';
    } else if (platform === PLATFORMS.TWITTER) {
      data = scrapeTweet();
      platformLabel = 'Twitter/X';
    }
    if (!data) return;

    const viral = calculateViralScore(data) || 0;
    const engRate = calculateEngagementRate(data) || 0;
    const seo = calculateSEOScore(data) || 0;
    const ctr = estimateCTR(data) || 0;
    const niche = calculateNicheScore(data) || 0;
    const monet = calculateMonetizationPotential(data) || 0;
    const growth = calculateGrowthVelocity(data) || 0;

    const relClass = data.reliability >= 80 ? 'high' : data.reliability >= 50 ? 'med' : 'low';
    const relLabel = `Data: ${data.reliability}% (${data.source})`;

    // Platform-specific data rows
    let dataRows = '';
    if (platform === PLATFORMS.YOUTUBE) {
      dataRows = `
        <div class="nq-mr"><span class="nq-ml">Views</span><span class="nq-mv">${formatNumber(data.views || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Likes</span><span class="nq-mv">${formatNumber(data.likes || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Comments</span><span class="nq-mv">${formatNumber(data.commentCount || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Duration</span><span class="nq-mv">${data.lengthSeconds ? Math.floor(data.lengthSeconds / 60) + ':' + String(data.lengthSeconds % 60).padStart(2, '0') : 'N/A'}</span></div>
        <div class="nq-mr"><span class="nq-ml">Channel Subs</span><span class="nq-mv">${data.channelSubscribers ? formatNumber(data.channelSubscribers) : 'N/A'}</span></div>
      `;
    } else if (platform === PLATFORMS.TIKTOK) {
      dataRows = `
        <div class="nq-mr"><span class="nq-ml">Views</span><span class="nq-mv">${formatNumber(data.views || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Likes</span><span class="nq-mv">${formatNumber(data.likes || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Comments</span><span class="nq-mv">${formatNumber(data.commentCount || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Shares</span><span class="nq-mv">${formatNumber(data.shares || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Bookmarks</span><span class="nq-mv">${formatNumber(data.bookmarks || 0)}</span></div>
      `;
    } else if (platform === PLATFORMS.TWITTER) {
      dataRows = `
        <div class="nq-mr"><span class="nq-ml">Views</span><span class="nq-mv">${formatNumber(data.views || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Likes</span><span class="nq-mv">${formatNumber(data.likeCount || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Retweets</span><span class="nq-mv">${formatNumber(data.retweetCount || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Replies</span><span class="nq-mv">${formatNumber(data.replyCount || 0)}</span></div>
        <div class="nq-mr"><span class="nq-ml">Bookmarks</span><span class="nq-mv">${formatNumber(data.bookmarkCount || 0)}</span></div>
      `;
    }

    // Tags display
    let tagsHTML = '';
    const tags = data.keywords || data.hashtags || [];
    if (tags.length > 0) {
      tagsHTML = `<div class="nq-section"><div class="nq-section-title">Tags (${tags.length})</div><div>${tags.slice(0, 15).map(t => `<span class="nq-tag">${t}</span>`).join('')}${tags.length > 15 ? `<span class="nq-tag">+${tags.length - 15} more</span>` : ''}</div></div>`;
    }

    const overlay = document.createElement('div');
    overlay.id = `${NS}-overlay`;
    overlay.className = 'nychiq-overlay';
    overlay.innerHTML = `
      <div class="nq-oh">
        <div class="nq-ot">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10 6L18 12L10 18V6Z" fill="#FDBA2D"/><rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/></svg>
          NY<span class="amber">CHIQ</span> <span class="nq-platform-tag">${platformLabel}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="nq-reliability ${relClass}">${relLabel}</span>
          <button class="nq-oc" id="${NS}-close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>
      <div class="nq-ob">
        <div class="nq-section">
          <div class="nq-section-title">Performance Scores</div>
          ${renderMetric('Viral Score', viral, 100)}
          ${renderMetric('Engagement Rate', engRate, 10)}
          ${renderMetric('SEO Score', seo, 100)}
          ${renderMetric('Est. CTR', ctr, 20)}
          ${renderMetric('Niche Score', niche, 100)}
          ${renderMetric('Monetization', monet, 100)}
          ${renderMetric('Growth Velocity', growth, 100)}
        </div>
        <div class="nq-section">
          <div class="nq-section-title">Content Data</div>
          ${dataRows}
        </div>
        ${tagsHTML}
        <div class="nq-section">
          <div class="nq-section-title">AI Insights</div>
          <div class="nq-ai-tip" id="${NS}-ai-tip">Loading AI analysis...</div>
        </div>
      </div>
      <div class="nq-of">
        <button class="secondary" id="${NS}-deep-btn">Deep Scrape</button>
        <a href="https://nychiq.com" target="_blank">Open Dashboard</a>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close handlers
    document.getElementById(`${NS}-close`).addEventListener('click', () => { overlay.remove(); document.getElementById(`${NS}-fab`)?.remove(); });

    // Deep scrape button
    const deepBtn = document.getElementById(`${NS}-deep-btn`);
    if (deepBtn) {
      deepBtn.addEventListener('click', async () => {
        deepBtn.textContent = 'Scraping...';
        deepBtn.disabled = true;
        const result = collectAndSend();
        deepBtn.textContent = `Done (${result.items.length} items)`;
        deepBtn.style.background = 'rgba(16,185,129,0.2)';
        deepBtn.style.color = '#10B981';
      });
    }

    // AI analysis
    requestAIAnalysis(data, (tip) => {
      const el = document.getElementById(`${NS}-ai-tip`);
      if (el) el.textContent = tip;
    });
  }

  /* ── AI Analysis (via background API proxy) ── */
  async function requestAIAnalysis(data, callback) {
    const cacheKey = `ai_${data.videoId || data.tweetId || data._ts}`;
    try {
      const cached = await chrome.storage.local.get(cacheKey);
      if (cached[cacheKey] && Date.now() - cached[cacheKey].ts < CACHE_TTL) {
        callback(cached[cacheKey].tip);
        return;
      }
    } catch { /* silent */ }

    // Local fallback
    const engRate = calculateEngagementRate(data) || 0;
    const seo = calculateSEOScore(data) || 0;
    const ctr = estimateCTR(data) || 0;
    const tips = [];
    if (engRate > 4) tips.push('Exceptional engagement rate — this content resonates strongly with its audience');
    else if (engRate < 1) tips.push('Low engagement — consider improving hooks in the first few seconds');
    if (seo < 40) tips.push('SEO score is low — add more relevant tags and optimize title length');
    if (ctr > 8) tips.push('High estimated CTR — thumbnail and title are working well together');
    if ((data.keywords || data.hashtags || []).length < 5) tips.push('Few tags detected — add more relevant tags for better discoverability');

    const fallbackTip = tips.length > 0 ? tips[0] : 'Analyzing patterns...';
    callback(fallbackTip);

    // Try API via background
    try {
      const platform = data.platform || detectPlatform() || 'unknown';
      const prompt = `Analyze this ${platform} content in one actionable sentence. Title: "${data.title || data.text || ''}". Views: ${data.views || 0}. Likes: ${data.likes || data.likeCount || 0}. Engagement: ${engRate}%. SEO: ${seo}. CTR: ${ctr}%. Give ONE specific improvement tip.`;

      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'API_REQUEST',
          endpoint: '/ai/chat',
          method: 'POST',
          body: { prompt, systemPrompt: `You are a ${platform} growth analyst. Give ONE specific, actionable tip. Keep it under 2 sentences.` },
        }, resolve);
      });

      if (resp && resp.ok && resp.data) {
        const tip = resp.data.text || fallbackTip;
        callback(tip);
        try { await chrome.storage.local.set({ [cacheKey]: { tip, ts: Date.now() } }); } catch {}
        return;
      }
    } catch { /* API failed */ }

    if (tips.length > 1) callback(tips[Math.floor(Math.random() * tips.length)]);
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 8: MUTATION OBSERVER (Platform-Aware)
     ═══════════════════════════════════════════════════════════════ */

  let observerTimer = null;

  function observeDOM() {
    const handler = debounce(() => {
      const platform = detectPlatform();

      if (platform === PLATFORMS.YOUTUBE) {
        processYouTubeThumbnails();
        if (window.location.pathname.includes('/watch')) addFloatingButton();
      } else if (platform === PLATFORMS.TIKTOK) {
        processTikTokCards();
        if (window.location.pathname.includes('/video/')) addFloatingButton();
      } else if (platform === PLATFORMS.TWITTER) {
        processTwitterTweets();
        if (getTweetId()) addFloatingButton();
      }
    }, 500);

    const observer = new MutationObserver(() => handler());
    observer.observe(document.body, { childList: true, subtree: true });

    // IntersectionObserver for infinite scroll feed loading
    setupScrollObserver();
  }

  function setupScrollObserver() {
    if (activeScrollObserver) return;

    activeScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const platform = detectPlatform();
          if (platform === PLATFORMS.YOUTUBE) processYouTubeThumbnails();
          else if (platform === PLATFORMS.TIKTOK) processTikTokCards();
          else if (platform === PLATFORMS.TWITTER) processTwitterTweets();
        }
      });
    }, { rootMargin: '200px', threshold: 0.1 });

    // Observe the main content area for new items entering viewport
    const container = document.querySelector('ytd-rich-grid-renderer, #main-content, [data-testid="primaryColumn"], [role="main"]');
    if (container) activeScrollObserver.observe(container);
  }

  /* ═══════════════════════════════════════════════════════════════
     SECTION 9: SETTINGS & INITIALIZATION
     ═══════════════════════════════════════════════════════════════ */

  function loadSettings() {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      settings.showBadges = state.showBadges !== false;
      settings.autoAnalyze = state.autoAnalyze === true;
      settings.deepScraping = state.deepScraping === true;
      config.apiBase = state.apiBase || API_BASE;
      if (state.connected) {
        injectStyles();
        const platform = detectPlatform();
        if (platform === PLATFORMS.YOUTUBE) processYouTubeThumbnails();
        else if (platform === PLATFORMS.TIKTOK) processTikTokCards();
        else if (platform === PLATFORMS.TWITTER) processTwitterTweets();
        addFloatingButton();
        observeDOM();

        // Auto-collect on page load if autoAnalyze is on
        if (settings.autoAnalyze) {
          setTimeout(() => collectAndSend(), 2000);
        }
      }
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'ANALYZE_PAGE') {
      showAnalysisOverlay();
    }
    if (msg.type === 'DEEP_SCRAPE') {
      collectAndSend();
    }
    if (msg.type === 'SETTINGS_CHANGED') {
      settings = { ...settings, ...msg.settings };
      if (settings.showBadges) {
        if (!document.getElementById(`${NS}-styles`)) {
          injectStyles();
          const platform = detectPlatform();
          if (platform === PLATFORMS.YOUTUBE) processYouTubeThumbnails();
          else if (platform === PLATFORMS.TIKTOK) processTikTokCards();
          else if (platform === PLATFORMS.TWITTER) processTwitterTweets();
          observeDOM();
        } else {
          const platform = detectPlatform();
          if (platform === PLATFORMS.YOUTUBE) processYouTubeThumbnails();
          else if (platform === PLATFORMS.TIKTOK) processTikTokCards();
          else if (platform === PLATFORMS.TWITTER) processTwitterTweets();
        }
        addFloatingButton();
      } else {
        // Remove badges
        document.querySelectorAll('.nychiq-score-badge').forEach(el => el.remove());
      }
    }
    if (msg.type === 'REINJECT') {
      loadSettings();
    }
    if (msg.type === 'GET_PAGE_DATA') {
      // Respond with collected data
      const data = collectAllVisibleData();
      try { chrome.runtime.sendMessage({ type: 'PAGE_DATA_RESPONSE', payload: data }); } catch {}
    }
  });

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettings);
  } else {
    loadSettings();
  }
})();
