/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Instagram Scraper
   Posts, reels, profiles, explore data
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const CACHE_TTL = 30 * 60 * 1000;
  const postCache = new Map();

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

  function getPostId() {
    const m = window.location.pathname.match(/\/p\/([^/]+)/);
    return m ? m[1] : '';
  }

  function getReelId() {
    const m = window.location.pathname.match(/\/reel\/([^/]+)/);
    return m ? m[1] : '';
  }

  function getUsername() {
    const m = window.location.pathname.match(/\/([^/]+)/);
    if (m && !['p', 'reel', 'reels', 'explore', 'direct', 'accounts', 'stories'].includes(m[1])) return m[1];
    return '';
  }

  function isPostPage() { return !!getPostId(); }
  function isReelPage() { return !!getReelId(); }
  function isProfilePage() { return !!getUsername() && !isPostPage() && !isReelPage(); }
  function isExplorePage() { return window.location.pathname.includes('/explore'); }

  function runScrape() {
    if (isPostPage()) scrapePost();
    else if (isReelPage()) scrapeReel();
    else if (isProfilePage()) scrapeProfile();
    else if (isExplorePage()) scrapeExplore();
  }

  function scrapePost() {
    const postId = getPostId();
    if (!postId) return;
    const cached = postCache.get(`post_${postId}`);
    if (cached && Date.now() - cached._ts < CACHE_TTL) return;

    const data = { postId, dataType: 'post', _ts: Date.now() };

    try {
      // Caption
      const captionEl = document.querySelector('h1, [role="button"] span[dir="auto"], span[class*="x1lliihq"]');
      data.caption = captionEl?.textContent?.trim() || '';

      // Also try article-based captions (newer UI)
      document.querySelectorAll('article span').forEach(el => {
        const t = el.textContent.trim();
        if (t.length > 50 && t.length > (data.caption || '').length) data.caption = t;
      });

      // Author
      const authorEl = document.querySelector('header a[href^="/"], article header a');
      if (authorEl) {
        data.author = authorEl.getAttribute('href')?.replace('/', '') || '';
        data.authorDisplayName = authorEl.querySelector('span')?.textContent?.trim() || '';
      }

      // Likes
      data.likes = parseCount(document.querySelector('section button span[class*="html-span"], [aria-label*="like"]')?.textContent);
      // Try other selectors
      if (!data.likes) {
        const likeBtns = document.querySelectorAll('span');
        for (const btn of likeBtns) {
          const text = btn.textContent.trim();
          if (text.match(/^[\d,.]+\s*[KMB]?$/)) {
            const num = parseCount(text);
            if (num > data.likes) data.likes = num;
          }
        }
      }

      // Comments
      data.commentCount = parseCount(document.querySelector('a[href*="/comments"] span, button span')?.textContent);

      // Hashtags and mentions from caption
      data.hashtags = [];
      data.mentions = [];
      const hashMatches = (data.caption || '').match(/#(\w+)/g);
      if (hashMatches) data.hashtags = hashMatches.map(h => h.replace('#', ''));
      const mentionMatches = (data.caption || '').match(/@(\w+)/g);
      if (mentionMatches) data.mentions = mentionMatches.map(m => m.replace('@', ''));

      // Media
      data.media = [];
      document.querySelectorAll('article img[src*="instagram"]').forEach(img => {
        if (!img.src.includes('profile_pic')) {
          data.media.push({ type: 'image', url: img.src });
        }
      });
      document.querySelectorAll('article video').forEach(vid => {
        data.media.push({ type: 'video', url: vid.src || vid.querySelector('source')?.src || '' });
      });

      // Engagement rate (requires follower count — not available on post page, set to 0)
      // We store likes and comments for server-side ER calculation using follower data
      data.engagementNumerator = data.likes + data.commentCount;
      data.engagementRate = 0; // calculated server-side with follower count

      // Date
      const timeEl = document.querySelector('time');
      data.timestamp = timeEl?.getAttribute('datetime') || '';

      postCache.set(`post_${postId}`, data);
      sendBatch('instagram', [{ ...data, platform: 'instagram', scrapedAt: new Date().toISOString(), url: window.location.href }]);
    } catch { /* silent */ }
  }

  function scrapeReel() { scrapeReelData(); }

  function scrapeReelData() {
    const reelId = getReelId();
    if (!reelId) return null;

    const data = { reelId, dataType: 'reel', _ts: Date.now() };

    try {
      // Caption
      const captionEl = document.querySelector('h1, [class*="x1lliihq"]');
      data.caption = captionEl?.textContent?.trim() || '';

      // Author
      const authorEl = document.querySelector('header a[href^="/"]');
      if (authorEl) {
        data.author = authorEl.getAttribute('href')?.replace('/', '') || '';
      }

      // Likes (usually shown as buttons)
      const likeSpan = document.querySelector('[aria-label*="Like"] span, [role="button"] span');
      data.likes = parseCount(likeSpan?.textContent);

      // Comments
      data.commentCount = parseCount(document.querySelector('a[href*="/comments"] span')?.textContent);

      // Views (for reels)
      data.views = parseCount(document.querySelector('[aria-label*="view"] span, [class*="view-count"]')?.textContent);

      // Music/audio
      const musicEl = document.querySelector('a[href*="/audio/"], [class*="music"]');
      data.music = musicEl?.textContent?.trim() || '';

      // Hashtags
      data.hashtags = [];
      const hashMatches = (data.caption || '').match(/#(\w+)/g);
      if (hashMatches) data.hashtags = hashMatches.map(h => h.replace('#', ''));

      // Engagement rate
      if (data.views > 0) {
        data.engagementRate = Math.round(((data.likes + data.commentCount) / data.views) * 10000) / 100;
      }

      sendBatch('instagram', [{ ...data, platform: 'instagram', scrapedAt: new Date().toISOString(), url: window.location.href }]);
    } catch { /* silent */ }
    return data;
  }

  function scrapeProfile() { scrapeProfileData(); }

  function scrapeProfileData() {
    const username = getUsername();
    if (!username) return null;

    const data = { username, dataType: 'profile', scrapedAt: new Date().toISOString(), url: window.location.href };

    try {
      data.displayName = document.querySelector('header h2, header h1')?.textContent?.trim() || '';
      data.bio = document.querySelector('[data-testid="UserDescription"], header + div span')?.textContent?.trim() || '';

      // Bio fallback - try to find the longest span text
      if (!data.bio) {
        let longest = '';
        document.querySelectorAll('header ~ div span, section span').forEach(el => {
          const t = el.textContent.trim();
          if (t.length > longest.length && t.length < 300) longest = t;
        });
        if (longest) data.bio = longest;
      }

      // Stats
      const statLis = document.querySelectorAll('header ul li');
      statLis.forEach(li => {
        const text = li.textContent || '';
        if (text.toLowerCase().includes('post')) data.postCount = parseCount(text);
        if (text.toLowerCase().includes('follower')) data.followersCount = parseCount(text);
        if (text.toLowerCase().includes('following')) data.followingCount = parseCount(text);
      });

      // Verified badge
      data.verified = !!document.querySelector('header svg[aria-label="Verified"], header [data-testid*="verified"]');

      // External link
      const linkEl = document.querySelector('header a[target="_blank"], [data-testid*="external"]');
      data.externalLink = linkEl?.href || '';

      sendBatch('instagram', [{ ...data, platform: 'instagram' }]);
    } catch { /* silent */ }
    return data;
  }

  function scrapeExplore() {
    const items = [];
    try {
      document.querySelectorAll('article, a[href^="/p/"], a[href^="/reel/"]').forEach((el, i) => {
        const link = el.tagName === 'A' ? el : el.querySelector('a[href^="/p/"], a[href^="/reel/"]');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        const pm = href.match(/\/p\/([^/]+)/);
        const rm = href.match(/\/reel\/([^/]+)/);
        if (pm || rm) {
          const img = el.querySelector('img');
          items.push({
            rank: i + 1,
            dataType: 'explore-item',
            postId: pm ? pm[1] : '',
            reelId: rm ? rm[1] : '',
            thumbnail: img?.src || '',
          });
        }
      });

      if (items.length > 0) {
        sendBatch('instagram', items.map(i => ({ ...i, platform: 'instagram', scrapedAt: new Date().toISOString(), url: window.location.href })));
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
      if (isPostPage()) {
        const postId = getPostId();
        if (postId) {
          const cached = postCache.get(`post_${postId}`);
          if (cached) items.push(cached);
        }
      } else if (isReelPage()) {
        // Reels don't cache — do a quick scrape
        const reelId = getReelId();
        if (reelId) {
          const d = scrapeReelData();
          if (d) items.push(d);
        }
      } else if (isProfilePage()) {
        const d = scrapeProfileData();
        if (d) items.push(d);
      } else if (isExplorePage()) {
        // Explore sends directly via sendBatch — no cached data to return
      }
      sendResponse({ payload: { items, platform: 'instagram', url: window.location.href } });
      return false;
    }
    return false;
  });
})();
