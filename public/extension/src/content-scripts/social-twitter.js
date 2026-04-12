/* ══════════════════════════════════════════════════════════════════
   NychIQ Extension — Twitter/X Scraper
   Tweets, profiles, trending topics, timeline data
   ══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const CACHE_TTL = 30 * 60 * 1000;
  const tweetCache = new Map();

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

  function getTweetId() {
    const m = window.location.pathname.match(/\/status\/(\d+)/);
    return m ? m[1] : '';
  }

  function getUsername() {
    const m = window.location.pathname.match(/\/([^/]+)/);
    if (m && !['home', 'explore', 'search', 'notifications', 'messages', 'settings', 'i', 'compose'].includes(m[1])) return m[1];
    return '';
  }

  function isExploreTrending() {
    return window.location.pathname.includes('/explore/trending') || window.location.pathname.includes('/explore');
  }

  function isTweetPage() { return !!getTweetId(); }
  function isProfilePage() { return !!getUsername() && !isTweetPage() && !isExploreTrending(); }

  function runScrape() {
    if (isTweetPage()) scrapeTweetPage();
    else if (isProfilePage()) scrapeProfilePage();
    else if (isExploreTrending()) scrapeTrending();
    else scrapeTimeline();
  }

  function scrapeTweetPage() {
    const tweetId = getTweetId();
    if (!tweetId) return;
    const cached = tweetCache.get(tweetId);
    if (cached && Date.now() - cached._ts < CACHE_TTL) return;

    const data = { tweetId, dataType: 'tweet', _ts: Date.now() };

    try {
      // Tweet text
      const tweetEls = document.querySelectorAll('article [data-testid="tweetText"]');
      data.text = Array.from(tweetEls).map(el => el.textContent.trim()).join('\n');

      // Author
      const authorEl = document.querySelector('article [data-testid="User-Name"]');
      if (authorEl) {
        const spans = authorEl.querySelectorAll('span');
        data.authorName = spans[0]?.textContent?.trim() || '';
        data.authorHandle = authorEl.querySelector('a')?.getAttribute('href')?.replace('/', '') || '';
        const timeEl = authorEl.querySelector('time');
        data.timestamp = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || '';
      }

      // Engagement metrics
      const actionBar = document.querySelector('article [data-testid="tweet"]') || document.querySelector('article');
      if (actionBar) {
        data.replyCount = parseCount(actionBar.querySelector('[data-testid="reply"]')?.textContent);
        data.retweetCount = parseCount(actionBar.querySelector('[data-testid="retweet"]')?.textContent);
        data.likeCount = parseCount(actionBar.querySelector('[data-testid="like"]')?.textContent);
        data.bookmarkCount = parseCount(actionBar.querySelector('[data-testid="bookmark"]')?.textContent);
        data.views = parseCount(actionBar.querySelector('[href*="/analytics"]')?.textContent);
      }

      // Hashtags and mentions
      data.hashtags = [];
      data.mentions = [];
      const fullText = data.text || '';
      const hashMatches = fullText.match(/#(\w+)/g);
      if (hashMatches) data.hashtags = hashMatches.map(h => h.replace('#', ''));
      const mentionMatches = fullText.match(/@(\w+)/g);
      if (mentionMatches) data.mentions = mentionMatches.map(m => m.replace('@', ''));

      // Media (images)
      data.media = [];
      document.querySelectorAll('article img[src*="pbs.twimg.com"]').forEach(img => {
        if (!img.src.includes('profile_images')) {
          data.media.push({ type: 'image', url: img.src });
        }
      });

      // Quote tweet detection
      const quoteEl = document.querySelector('article [data-testid="tweetText"] ~ div a[href*="/status/"]');
      if (quoteEl) {
        const qm = quoteEl.getAttribute('href')?.match(/\/status\/(\d+)/);
        if (qm && qm[1] !== tweetId) data.quoteTweetId = qm[1];
      }

      // Views fallback
      if (!data.views) {
        const viewEl = document.querySelector('article a[href*="/analytics"] + span, [data-testid="app-text-transition-container"]');
        if (viewEl) data.views = parseCount(viewEl.textContent);
      }

      // Engagement rate
      if (data.views > 0) {
        data.engagementRate = Math.round(((data.replyCount + data.retweetCount + data.likeCount) / data.views) * 10000) / 100;
      }

      tweetCache.set(tweetId, data);
      sendBatch('twitter', [{ ...data, platform: 'twitter', scrapedAt: new Date().toISOString(), url: window.location.href }]);
    } catch { /* silent */ }
  }

  function scrapeProfilePage() {
    const username = getUsername();
    if (!username) return null;

    const data = { username, dataType: 'profile', scrapedAt: new Date().toISOString(), url: window.location.href };

    try {
      data.displayName = document.querySelector('[data-testid="UserName"] span')?.textContent?.trim() || '';
      const bioEl = document.querySelector('[data-testid="UserDescription"]');
      data.bio = bioEl?.textContent?.trim() || '';

      // Stats: Following, Followers, listed
      data.followingCount = 0;
      data.followersCount = 0;
      document.querySelectorAll('a[href*="/following"], a[href*="/followers"], a[href*="/lists"]').forEach(el => {
        const text = el.textContent || '';
        const count = parseCount(text);
        if (el.href.includes('/following')) data.followingCount = count;
        if (el.href.includes('/followers') && !el.href.includes('/following')) data.followersCount = count;
      });

      // Alt stats location
      const statLinks = document.querySelectorAll('[data-testid="UserName"] + div a');
      if (statLinks.length >= 2) {
        data.followingCount = data.followingCount || parseCount(statLinks[0]?.querySelector('span')?.textContent);
        data.followersCount = data.followersCount || parseCount(statLinks[1]?.querySelector('span')?.textContent);
      }

      data.tweetCount = parseCount(document.querySelector('a[href*="/with_replies"] span, [data-testid="UserName"] ~ div a span')?.textContent);

      // Joined date and location
      const detailSpans = document.querySelectorAll('[data-testid="UserDescription"] ~ div span');
      detailSpans.forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('Joined')) data.joinedDate = text;
        else if (text.includes('2006') || text.includes('2007') || text.includes('2008') || text.includes('2009') || text.includes('201') || text.includes('202')) {
          if (!data.joinedDate) data.joinedDate = text;
        }
      });

      // Pinned tweet
      const pinnedArticle = document.querySelector('article');
      if (pinnedArticle) {
        const pinnedText = pinnedArticle.querySelector('[data-testid="tweetText"]')?.textContent?.trim();
        const pinnedLink = pinnedArticle.querySelector('a[href*="/status/"]');
        if (pinnedLink) {
          const pm = pinnedLink.getAttribute('href')?.match(/\/status\/(\d+)/);
          data.pinnedTweet = { id: pm ? pm[1] : '', text: pinnedText?.substring(0, 200) || '' };
        }
      }

      sendBatch('twitter', [{ ...data, platform: 'twitter' }]);
    } catch { /* silent */ }
    return data;
  }

  function scrapeTrending() {
    const trends = [];
    try {
      document.querySelectorAll('article, [data-testid="trend"], section[aria-label*="Trending"]').forEach(el => {
        const name = el.querySelector('a[href*="/search?q="], [data-testid="trend-name"], span')?.textContent?.trim();
        const category = el.querySelector('[data-testid="trend-category"], div:first-child')?.textContent?.trim() || '';
        if (name) {
          trends.push({ name, category, dataType: 'trend' });
        }
      });

      if (trends.length > 0) {
        sendBatch('twitter', trends.map(t => ({ ...t, platform: 'twitter', scrapedAt: new Date().toISOString(), url: window.location.href })));
      }
    } catch { /* silent */ }
  }

  function scrapeTimeline() {
    const tweets = [];
    let rank = 0;
    try {
      document.querySelectorAll('article[data-testid="tweet"]').forEach(article => {
        rank++;
        const textEl = article.querySelector('[data-testid="tweetText"]');
        if (!textEl) return;

        const data = { rank, dataType: 'timeline-tweet' };
        data.text = textEl.textContent.trim().substring(0, 500);

        const authorEl = article.querySelector('[data-testid="User-Name"]');
        if (authorEl) {
          data.authorName = authorEl.querySelector('span')?.textContent?.trim() || '';
          data.authorHandle = authorEl.querySelector('a')?.getAttribute('href')?.replace('/', '') || '';
        }

        data.likeCount = parseCount(article.querySelector('[data-testid="like"]')?.textContent);
        data.retweetCount = parseCount(article.querySelector('[data-testid="retweet"]')?.textContent);
        data.replyCount = parseCount(article.querySelector('[data-testid="reply"]')?.textContent);
        data.isAd = !!article.closest('[data-testid="placementTracking"]');

        const tweetLink = article.querySelector('a[href*="/status/"]');
        if (tweetLink) {
          const tm = tweetLink.getAttribute('href')?.match(/\/status\/(\d+)/);
          data.tweetId = tm ? tm[1] : '';
        }

        if (data.text) tweets.push(data);
      });

      if (tweets.length > 0) {
        sendBatch('twitter', tweets.map(t => ({ ...t, platform: 'twitter', scrapedAt: new Date().toISOString(), url: window.location.href })));
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
      if (isTweetPage()) {
        const tweetId = getTweetId();
        if (tweetId) {
          const cached = tweetCache.get(tweetId);
          if (cached) items.push(cached);
        }
      } else if (isProfilePage()) {
        const d = scrapeProfilePage();
        if (d) items.push(d);
      } else if (isExploreTrending()) {
        scrapeTrending(); // sends directly via sendBatch
      }
      sendResponse({ payload: { items, platform: 'twitter', url: window.location.href } });
      return false;
    }
    return false;
  });

})();
