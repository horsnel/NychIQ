/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — TikTok Scraper
   Videos, profiles, comments, feed data
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const CACHE_TTL = 30 * 60 * 1000;
  const videoCache = new Map();

  chrome.storage.local.get('nychiq_ext_state', () => runScrape());

  function parseCount(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    str = String(str).replace(/,/g, '').replace(/\s/g, '').trim();
    const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };
    const match = str.match(/^([\d.]+)([KMBT]?)$/i);
    if (match) return Math.round(parseFloat(match[1]) * (mult[match[2].toUpperCase()] || 1));
    return parseInt(str, 10) || 0;
  }

  function getVideoId() { const m = window.location.pathname.match(/\/video\/(\d+)/); return m ? m[1] : ''; }
  function getUsername() { const m = window.location.pathname.match(/\/@([^/]+)/); return m ? m[1] : ''; }
  function isVideoPage() { return !!getVideoId(); }
  function isProfilePage() { return !!getUsername() && !isVideoPage(); }
  function isFeedPage() { return window.location.pathname === '/' || window.location.pathname === '/foryou' || window.location.pathname === '/following'; }

  function runScrape() {
    if (isVideoPage()) scrapeVideo();
    else if (isProfilePage()) scrapeProfile();
    else if (isFeedPage()) scrapeFeed();
  }

  function scrapeVideo() {
    const videoId = getVideoId();
    if (!videoId) return;
    const cached = videoCache.get(videoId);
    if (cached && Date.now() - cached._ts < CACHE_TTL) return;

    const data = { videoId, dataType: 'video', _ts: Date.now() };

    try {
      // Description
      data.description = document.querySelector('[data-e2e="video-desc"], .tiktok-1ywj7cz-DivDescContainer, h1')?.textContent?.trim() || '';

      // Author
      data.author = document.querySelector('[data-e2e="video-author-uniqueid"], .tiktok-1c7igrj-StyledAuthorAnchor a, .author-uniqueId')?.textContent?.trim()?.replace('@', '') || '';
      data.authorDisplayName = document.querySelector('[data-e2e="video-author-name"], .tiktok-1c7igrj-StyledAuthorAnchor span')?.textContent?.trim() || '';

      // Stats
      data.likes = parseCount(document.querySelector('[data-e2e="like-count"], .tiktok-x6y88p-DivLikeCount span:last-child')?.textContent);
      data.commentCount = parseCount(document.querySelector('[data-e2e="comment-count"], .tiktok-x6y88p-DivCommentCount span:last-child')?.textContent);
      data.shares = parseCount(document.querySelector('[data-e2e="share-count"], .tiktok-x6y88p-DivShareCount span:last-child')?.textContent);
      data.bookmarks = parseCount(document.querySelector('[data-e2e="undefined-count"], .tiktok-x6y88p-DivBookmarkCount span:last-child')?.textContent);
      data.views = parseCount(document.querySelector('[data-e2e="video-view-count"], .tiktok-1g0ph1n-StrongVideoCount span, .view-count')?.textContent);

      // Music
      data.musicTitle = document.querySelector('[data-e2e="video-music"], .tiktok-1d94e4x-DivMusicInfo')?.textContent?.trim() || '';
      data.musicAuthor = document.querySelector('[data-e2e="video-music"] a')?.textContent?.trim() || '';

      // Hashtags
      data.hashtags = [];
      const hashRegex = /#(\w+)/g;
      let match;
      while ((match = hashRegex.exec(data.description || '')) !== null) data.hashtags.push(match[1]);
      document.querySelectorAll('[data-e2e="video-hashtag"], .hashtag-link').forEach(el => {
        const t = el.textContent?.trim()?.replace('#', '') || '';
        if (t && !data.hashtags.includes(t)) data.hashtags.push(t);
      });

      // Author stats
      data.authorFollowers = parseCount(document.querySelector('[data-e2e="video-author-follower"], .tiktok-1c7igrj-StyledAuthorAnchor [title]')?.textContent);
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        const md = metaDesc.getAttribute('content') || '';
        const fm = md.match(/([\d.]+[KMB]?)\s*(?:followers?|fans?)/i);
        if (fm) data.authorFollowers = parseCount(fm[1]);
      }

      data.uploadDate = document.querySelector('[data-e2e="video-publish-date"], time')?.textContent?.trim() || '';

      // Engagement rate
      if (data.views > 0) {
        data.engagementRate = Math.round(((data.likes + data.commentCount + data.shares) / data.views) * 10000) / 100;
      }

      videoCache.set(videoId, data);
      sendBatch('tiktok', [{ ...data, platform: 'tiktok', scrapedAt: new Date().toISOString(), url: window.location.href }]);

      // Also scrape comments
      setTimeout(scrapeAndSendComments, 2000);
    } catch { /* silent */ }
  }

  function scrapeAndSendComments() {
    const comments = [];
    try {
      document.querySelectorAll('[data-e2e="comment-list"] > div, .tiktok-x6f6za-DivCommentItemContainer, .comment-item').forEach(el => {
        const author = el.querySelector('[data-e2e="comment-username"], .comment-author')?.textContent?.trim()?.replace('@', '') || '';
        const text = el.querySelector('[data-e2e="comment-text"], .comment-text')?.textContent?.trim() || '';
        const likes = parseCount(el.querySelector('[data-e2e="comment-like-count"], .comment-likes span:last-child')?.textContent);
        const time = el.querySelector('[data-e2e="comment-time"], .comment-time, time')?.textContent?.trim() || '';
        const avatar = el.querySelector('img')?.src || '';
        if (author || text) {
          comments.push({ author, text: text.substring(0, 2000), likes, timestamp: time, avatar, platform: 'tiktok' });
        }
      });

      if (comments.length > 0) {
        sendBatch('tiktok', [{ dataType: 'comments', videoId: getVideoId(), comments, platform: 'tiktok', scrapedAt: new Date().toISOString(), url: window.location.href }]);
      }
    } catch { /* silent */ }
  }

  function scrapeProfile() { return scrapeProfileData(); }

  function scrapeProfileData() {
    const username = getUsername();
    if (!username) return null;

    const data = { username, dataType: 'profile', scrapedAt: new Date().toISOString(), url: window.location.href };

    try {
      data.displayName = document.querySelector('[data-e2e="user-title"], h2')?.textContent?.trim() || '';
      data.bio = document.querySelector('[data-e2e="user-bio"], .tiktok-1jx1b1d-DivContainer, .user-bio')?.textContent?.trim() || '';

      // Stats
      const statEls = document.querySelectorAll('[data-e2e="user-post-item-count"], [data-e2e="followers-count"], [data-e2e="following-count"], [data-e2e="likes-count"], .count-number');
      if (statEls.length >= 3) {
        data.followingCount = parseCount(statEls[0]?.textContent);
        data.followersCount = parseCount(statEls[1]?.textContent);
        data.likesCount = parseCount(statEls[2]?.textContent);
      } else {
        const counts = document.querySelectorAll('.tiktok-18zf8sx-DivUserStats span, .tiktok-1amjzpx-SpanText');
        if (counts.length >= 3) {
          data.followingCount = parseCount(counts[0]?.textContent);
          data.followersCount = parseCount(counts[1]?.textContent);
          data.likesCount = parseCount(counts[2]?.textContent);
        }
      }

      data.videoCount = parseCount(document.querySelector('[data-e2e="user-tab-item-count"]')?.textContent || '0');

      // Social links
      data.socialLinks = [];
      document.querySelectorAll('[data-e2e="user-link-item"] a, .social-link a').forEach(a => {
        data.socialLinks.push({ text: a.textContent.trim(), href: a.href });
      });

      sendBatch('tiktok', [{ ...data, platform: 'tiktok' }]);
    } catch { /* silent */ }
    return data;
  }

  function scrapeFeed() {
    const videos = [];
    try {
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
        if (data.videoId || data.author) videos.push({ ...data, dataType: 'feed-video' });
      });

      if (videos.length > 0) {
        sendBatch('tiktok', videos.map(v => ({ ...v, platform: 'tiktok', scrapedAt: new Date().toISOString(), url: window.location.href })));
      }
    } catch { /* silent */ }
  }

  function sendBatch(platform, items) {
    try {
      chrome.runtime.sendMessage({ type: 'BATCH_DATA', payload: { platform, items, url: window.location.href } }).catch(() => {});
    } catch { /* silent */ }
  }

  // SPA nav
  let lastUrl = window.location.href;
  const origPush = history.pushState;
  history.pushState = function (...a) { origPush.apply(this, a); checkNav(); };
  window.addEventListener('popstate', checkNav);
  function checkNav() {
    if (window.location.href !== lastUrl) { lastUrl = window.location.href; setTimeout(runScrape, 1500); }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'REINJECT') { runScrape(); sendResponse({ ok: true }); return false; }
    if (message.type === 'GET_PAGE_DATA') {
      const items = [];
      if (isVideoPage()) {
        const videoId = getVideoId();
        if (videoId) {
          const cached = videoCache.get(videoId);
          if (cached) items.push(cached);
        }
      } else if (isProfilePage()) {
        const d = scrapeProfileData();
        if (d) items.push(d);
      }
      sendResponse({ payload: { items, platform: 'tiktok', url: window.location.href } });
      return false;
    }
    return false;
  });
})();
