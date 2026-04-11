/**
 * NychIQ Worker — YouTube Data Routes
 * Fallback chain: Piped → Invidious (dynamic mirror list) → LightTube → YouTube Data API v3
 * All responses are normalized to YouTube API v3 format for frontend compatibility.
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { withFallback, rotateKey } from '../lib/fallback';
import { getCached, setCached, cacheKey, CACHE_TTL } from '../lib/cache';

export const youtubeRoutes = new Hono<{ Bindings: Env }>();

// ── Piped / Invidious / LightTube instances ──
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
];
const STATIC_INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.fdn.fr',
];
const LIGHTTUBE_INSTANCES = [
  'https://lt.frill.ws',
];

// ── Dynamic Invidious mirror discovery ──
let _dynamicInvidiousCache: { instances: string[]; fetchedAt: number } | null = null;

async function getInvidiousInstances(kv?: KVNamespace): Promise<string[]> {
  // Check in-memory cache first (5 min TTL)
  if (_dynamicInvidiousCache && Date.now() - _dynamicInvidiousCache.fetchedAt < 300000) {
    return _dynamicInvidiousCache.instances;
  }

  // Try KV cache
  if (kv) {
    try {
      const cached = await kv.get('invidious:instances', 'json');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        _dynamicInvidiousCache = { instances: cached, fetchedAt: Date.now() };
        return cached;
      }
    } catch { /* ignore */ }
  }

  // Fetch fresh instance list from invidious.io
  try {
    const res = await fetch('https://invidious.io/instances.json', {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data: any[] = await res.json();
      const instances = data
        .filter((inst: any) => {
          try {
            const url = new URL(inst?.url || inst?.uri || '');
            return url.protocol === 'https:' && inst?.type === 'https' && inst?.api !== false && inst?.stats?.software?.version;
          } catch { return false; }
        })
        .slice(0, 8)
        .map((inst: any) => {
          try { return new URL(inst?.url || inst?.uri || '').origin; } catch { return ''; }
        })
        .filter(Boolean);

      if (instances.length > 0) {
        _dynamicInvidiousCache = { instances, fetchedAt: Date.now() };
        if (kv) {
          await kv.put('invidious:instances', JSON.stringify(instances), { expirationTtl: 3600 });
        }
        return instances;
      }
    }
  } catch (err: any) {
    console.error('Invidious mirror fetch error:', err?.message);
  }

  // Fallback to static instances
  return STATIC_INVIDIOUS_INSTANCES;
}

async function getHealthyInstance(kv: KVNamespace | undefined, staticList: string[]): Promise<string> {
  // Try dynamic instances first
  const dynamic = await getInvidiousInstances(kv);
  for (const inst of [...dynamic, ...staticList]) {
    try {
      const res = await fetch(`${inst}/api/v1/stats`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return inst;
    } catch { /* skip unhealthy */ }
  }
  return staticList[0];
}

// ── Normalizers: convert Piped/Invidious/LightTube → YouTube API v3 format ──

function pipedToYtSearch(items: any[]): any[] {
  return items.filter((v: any) => v.type === 'stream').map((v: any) => ({
    id: { videoId: v.url?.replace('/watch?v=', '') || v.videoId },
    snippet: {
      title: v.title || '',
      channelTitle: v.uploaderName || '',
      channelId: v.uploaderUrl?.replace('/channel/', '') || '',
      publishedAt: v.uploaded ? new Date(v.uploaded).toISOString() : '',
      thumbnails: {
        high: { url: v.thumbnail || '' },
        medium: { url: v.thumbnail || '' },
        default: { url: v.thumbnail || '' },
      },
      description: v.shortDescription || '',
    },
  }));
}

function invidiousToYtSearch(items: any[]): any[] {
  return items.map((v: any) => ({
    id: { videoId: v.videoId },
    snippet: {
      title: v.title || '',
      channelTitle: v.author || '',
      channelId: v.authorId || '',
      publishedAt: v.published ? new Date(v.published * 1000).toISOString() : '',
      thumbnails: {
        high: { url: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg` },
        medium: { url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` },
        default: { url: `https://i.ytimg.com/vi/${v.videoId}/default.jpg` },
      },
      description: v.description || '',
    },
  }));
}

function invidiousToYtVideos(items: any[]): any[] {
  return items.map((v: any) => ({
    id: v.videoId,
    snippet: {
      title: v.title || '',
      channelTitle: v.author || '',
      channelId: v.authorId || '',
      publishedAt: v.published ? new Date(v.published * 1000).toISOString() : '',
      thumbnails: {
        high: { url: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg` },
        medium: { url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` },
        default: { url: `https://i.ytimg.com/vi/${v.videoId}/default.jpg` },
      },
    },
    statistics: {
      viewCount: String(v.viewCount || 0),
      likeCount: String(v.likeCount || 0),
      commentCount: String(v.subCountText || 0),
    },
    contentDetails: {
      duration: v.lengthSeconds ? `PT${Math.floor(v.lengthSeconds / 60)}M${v.lengthSeconds % 60}S` : 'PT0S',
    },
  }));
}

function invidiousToYtChannel(ch: any): any {
  return {
    id: ch.authorId || ch.channelId,
    snippet: {
      title: ch.author || ch.name || '',
      description: ch.description || '',
      thumbnails: {
        high: { url: ch.authorThumbnails?.[0]?.url || '' },
        default: { url: ch.authorThumbnails?.[ch.authorThumbnails.length - 1]?.url || '' },
      },
    },
    statistics: {
      subscriberCount: String(ch.subCount || 0),
      videoCount: String(ch.videoCount || 0),
      viewCount: String(ch.totalViews || 0),
    },
  };
}

/**
 * GET /api/youtube/search — Search YouTube videos/channels
 */
youtubeRoutes.get('/search', async (c) => {
  const q = c.req.query('q') || '';
  const regionCode = c.req.query('regionCode') || '';
  const type = c.req.query('type') || 'video';
  const maxResults = c.req.query('maxResults') || '20';
  const pageToken = c.req.query('pageToken') || '';

  if (!q) return c.json({ error: 'Query parameter "q" is required' }, 400);

  const ck = cacheKey('yt:search', { q, regionCode, type, maxResults, pageToken });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  try {
    const result = await withFallback<any>([
      // 1. Piped
      {
        name: 'piped',
        fn: async () => {
          const filter = type === 'channel' ? 'channels' : 'videos';
          const params = new URLSearchParams({ q, filter });
          if (regionCode) params.set('region', regionCode);
          const res = await fetch(`${PIPED_INSTANCES[0]}/search?${params}`);
          if (!res.ok) throw new Error(`Piped ${res.status}`);
          const data: any = await res.json();
          const items = pipedToYtSearch(data.items || data || []);
          return { items, pageInfo: { totalResults: items.length, resultsPerPage: items.length } };
        },
        timeout: 10000,
      },
      // 2. Invidious (dynamic mirror list)
      {
        name: 'invidious',
        fn: async () => {
          const instance = await getHealthyInstance(c.env.CACHE, STATIC_INVIDIOUS_INSTANCES);
          const params = new URLSearchParams({ q, type });
          if (regionCode) params.set('region', regionCode);
          const res = await fetch(`${instance}/api/v1/search?${params}`);
          if (!res.ok) throw new Error(`Invidious ${res.status}`);
          const data: any = await res.json();
          const items = invidiousToYtSearch(data || []);
          return { items, pageInfo: { totalResults: items.length, resultsPerPage: items.length } };
        },
        timeout: 10000,
      },
      // 3. LightTube
      {
        name: 'lighttube',
        fn: async () => {
          const params = new URLSearchParams({ q, type: type === 'channel' ? 'channel' : 'video' });
          const res = await fetch(`${LIGHTTUBE_INSTANCES[0]}/api/search?${params}`);
          if (!res.ok) throw new Error(`LightTube ${res.status}`);
          const data: any = await res.json();
          const items = (data?.items || data || []).map((v: any) => ({
            id: { videoId: v.id || v.videoId || v.url?.replace('/watch?v=', '') },
            snippet: {
              title: v.title || '',
              channelTitle: v.channelTitle || v.author || '',
              channelId: v.channelId || v.authorId || '',
              publishedAt: v.publishedAt || v.uploaded ? new Date(v.publishedAt || v.uploaded).toISOString() : '',
              thumbnails: { high: { url: v.thumbnails?.high?.url || v.thumbnail || '' }, medium: { url: v.thumbnails?.medium?.url || v.thumbnail || '' }, default: { url: v.thumbnail || '' } },
              description: v.description || '',
            },
          }));
          return { items, pageInfo: { totalResults: items.length, resultsPerPage: items.length } };
        },
        timeout: 10000,
      },
      // 4. YouTube Data API v3
      {
        name: 'youtube-v3',
        fn: async () => {
          const key = rotateKey([c.env.YT_KEY_1, c.env.YT_KEY_2, c.env.YT_KEY_3, c.env.YT_KEY_4]);
          if (!key) throw new Error('No YouTube API key');
          const params = new URLSearchParams({ part: 'snippet', q, type, maxResults });
          if (regionCode) params.set('regionCode', regionCode);
          if (pageToken) params.set('pageToken', pageToken);
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${key}&${params}`);
          if (!res.ok) throw new Error(`YouTube v3 ${res.status}`);
          return res.json();
        },
        timeout: 10000,
      },
    ], 'YouTube search');

    await setCached(c.env.CACHE, ck, result, CACHE_TTL.SEARCH);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'YouTube search failed' }, 500);
  }
});

/**
 * GET /api/youtube/videos — Get video data by IDs or trending
 */
youtubeRoutes.get('/videos', async (c) => {
  const id = c.req.query('id') || '';
  const chart = c.req.query('chart') || 'mostPopular';
  const regionCode = c.req.query('regionCode') || 'US';
  const maxResults = c.req.query('maxResults') || '20';

  const ck = cacheKey('yt:videos', { id, chart, regionCode, maxResults });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  try {
    const result = await withFallback<any>([
      // Invidious for specific IDs
      ...(id ? [{
        name: 'invidious' as const,
        fn: async () => {
          const instance = await getHealthyInstance(c.env.CACHE, STATIC_INVIDIOUS_INSTANCES);
          const ids = id.split(',').slice(0, 10);
          const videos = await Promise.all(
            ids.map(vid => fetch(`${instance}/api/v1/videos/${vid}`).then(r => r.json()).catch(() => null))
          );
          const items = invidiousToYtVideos(videos.filter(Boolean));
          return { items, pageInfo: { totalResults: items.length, resultsPerPage: items.length } };
        },
        timeout: 10000,
      }] : []),
      // YouTube Data API v3
      {
        name: 'youtube-v3',
        fn: async () => {
          const key = rotateKey([c.env.YT_KEY_1, c.env.YT_KEY_2, c.env.YT_KEY_3, c.env.YT_KEY_4]);
          if (!key) throw new Error('No YouTube API key');
          const params = new URLSearchParams({ part: 'snippet,statistics,contentDetails', maxResults, regionCode });
          if (id) { params.set('id', id); params.delete('regionCode'); }
          else { params.set('chart', chart); }
          const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${key}&${params}`);
          if (!res.ok) throw new Error(`YouTube v3 ${res.status}`);
          return res.json();
        },
        timeout: 10000,
      },
    ], 'YouTube videos');

    await setCached(c.env.CACHE, ck, result, CACHE_TTL.VIDEO_LIST);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'YouTube videos failed' }, 500);
  }
});

/**
 * GET /api/youtube/trending — Trending videos by region
 */
youtubeRoutes.get('/trending', async (c) => {
  const regionCode = c.req.query('regionCode') || 'NG';
  const maxResults = c.req.query('maxResults') || '20';

  const ck = cacheKey('yt:trending', { regionCode, maxResults });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  try {
    const result = await withFallback<any>([
      // 1. Piped trending
      {
        name: 'piped',
        fn: async () => {
          const res = await fetch(`${PIPED_INSTANCES[0]}/trending?region=${regionCode}`);
          if (!res.ok) throw new Error(`Piped ${res.status}`);
          const data: any = await res.json();
          const items = (data || []).map((v: any) => ({
            id: v.url?.replace('/watch?v=', ''),
            snippet: {
              title: v.title || '',
              channelTitle: v.uploaderName || '',
              publishedAt: v.uploaded ? new Date(v.uploaded).toISOString() : '',
              thumbnails: { high: { url: v.thumbnail || '' }, medium: { url: v.thumbnail || '' } },
            },
            statistics: { viewCount: String(v.views || 0) },
          }));
          return { items, pageInfo: { totalResults: items.length, resultsPerPage: items.length } };
        },
        timeout: 10000,
      },
      // 2. Invidious trending (dynamic mirrors)
      {
        name: 'invidious',
        fn: async () => {
          const instance = await getHealthyInstance(c.env.CACHE, STATIC_INVIDIOUS_INSTANCES);
          const res = await fetch(`${instance}/api/v1/trending?region=${regionCode}`);
          if (!res.ok) throw new Error(`Invidious ${res.status}`);
          const data: any = await res.json();
          const items = invidiousToYtVideos(data || []);
          return { items, pageInfo: { totalResults: items.length, resultsPerPage: items.length } };
        },
        timeout: 10000,
      },
      // 3. YouTube v3
      {
        name: 'youtube-v3',
        fn: async () => {
          const key = rotateKey([c.env.YT_KEY_1, c.env.YT_KEY_2, c.env.YT_KEY_3, c.env.YT_KEY_4]);
          if (!key) throw new Error('No YouTube API key');
          const params = new URLSearchParams({
            part: 'snippet,statistics,contentDetails', chart: 'mostPopular', regionCode, maxResults,
          });
          const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${key}&${params}`);
          if (!res.ok) throw new Error(`YouTube v3 ${res.status}`);
          return res.json();
        },
        timeout: 10000,
      },
    ], 'YouTube trending');

    await setCached(c.env.CACHE, ck, result, CACHE_TTL.TRENDING);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'YouTube trending failed' }, 500);
  }
});

/**
 * GET /api/youtube/channel — Channel info by handle or channelId
 */
youtubeRoutes.get('/channel', async (c) => {
  const handle = c.req.query('handle') || '';
  const channelId = c.req.query('channelId') || '';

  if (!handle && !channelId) return c.json({ error: 'handle or channelId is required' }, 400);

  const ck = cacheKey('yt:channel', { handle, channelId });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  try {
    const result = await withFallback<any>([
      // 1. Invidious (dynamic mirrors)
      {
        name: 'invidious',
        fn: async () => {
          const instance = await getHealthyInstance(c.env.CACHE, STATIC_INVIDIOUS_INSTANCES);
          const lookup = handle.startsWith('@') ? handle.slice(1) : (channelId || handle);
          const res = await fetch(`${instance}/api/v1/channels/${lookup}`);
          if (!res.ok) throw new Error(`Invidious ${res.status}`);
          const data: any = await res.json();
          return invidiousToYtChannel(data);
        },
        timeout: 10000,
      },
      // 2. YouTube v3
      {
        name: 'youtube-v3',
        fn: async () => {
          const key = rotateKey([c.env.YT_KEY_1, c.env.YT_KEY_2, c.env.YT_KEY_3, c.env.YT_KEY_4]);
          if (!key) throw new Error('No YouTube API key');
          const params = new URLSearchParams({ part: 'snippet,statistics' });
          if (handle) params.set('forHandle', handle);
          if (channelId) params.set('id', channelId);
          const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${key}&${params}`);
          if (!res.ok) throw new Error(`YouTube v3 ${res.status}`);
          const data: any = await res.json();
          return data.items?.[0] || null;
        },
        timeout: 10000,
      },
    ], 'YouTube channel');

    await setCached(c.env.CACHE, ck, result, CACHE_TTL.CHANNEL);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'YouTube channel failed' }, 500);
  }
});

/**
 * GET /api/youtube/transcript — Video transcript/captions
 * Fallback: SociaVault → Piped captions → Invidious captions
 */
youtubeRoutes.get('/transcript', async (c) => {
  const videoId = c.req.query('videoId') || '';
  if (!videoId) return c.json({ error: 'videoId is required' }, 400);

  const ck = cacheKey('yt:transcript', { videoId });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  try {
    const result = await withFallback<any>([
      // 1. SociaVault (best quality, uses credits)
      {
        name: 'sociavault',
        fn: async () => {
          const key = rotateKey([c.env.SOCIAVAULT_KEY_1, c.env.SOCIAVAULT_KEY_2]);
          if (!key) throw new Error('No SociaVault key');
          const res = await fetch(`https://api.sociavault.com/v1/scrape/youtube/video/transcript?videoId=${videoId}`, {
            headers: { 'Authorization': `Bearer ${key}` },
          });
          if (!res.ok) throw new Error(`SociaVault ${res.status}`);
          return res.json();
        },
        timeout: 15000,
      },
      // 2. Piped captions (no key needed)
      {
        name: 'piped',
        fn: async () => {
          for (const instance of PIPED_INSTANCES) {
            try {
              const res = await fetch(`${instance}/streams/${videoId}`, { signal: AbortSignal.timeout(8000) });
              if (!res.ok) continue;
              const data: any = await res.json();
              const captions = data?.subtitleStreams || data?.captions || [];
              // Prefer English captions, fallback to first available
              const enCaption = captions.find((s: any) => s?.languageCode === 'en' || s?.lang === 'en');
              const caption = enCaption || captions[0];
              if (!caption) continue;
              const captionUrl = caption.url;
              const captionRes = await fetch(captionUrl);
              if (!captionRes.ok) continue;
              const captionText = await captionRes.text();
              // Parse VTT/SRT to plain text
              const plainText = captionText
                .replace(/<[^>]+>/g, '')
                .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g, '')
                .replace(/WEBVTT[\s\S]*?\n\n/, '')
                .replace(/NOTE[\s\S]*?\n\n/g, '')
                .split('\n')
                .map((l: string) => l.trim())
                .filter(Boolean)
                .join(' ');
              return { text: plainText, source: 'piped', language: caption.languageCode || caption.lang || 'unknown' };
            } catch { /* try next instance */ }
          }
          throw new Error('No Piped captions found');
        },
        timeout: 12000,
      },
      // 3. Invidious captions (no key needed)
      {
        name: 'invidious',
        fn: async () => {
          const instance = await getHealthyInstance(c.env.CACHE, STATIC_INVIDIOUS_INSTANCES);
          const res = await fetch(`${instance}/api/v1/captions/${videoId}`);
          if (!res.ok) throw new Error(`Invidious ${res.status}`);
          const data: any = await res.json();
          const track = data.captions?.find((t: any) => t.language_code === 'en') || data.captions?.[0];
          if (!track) throw new Error('No captions available');
          const captionRes = await fetch(`${instance}/api/v1/captions/${videoId}?label=${encodeURIComponent(track.label)}`);
          if (!captionRes.ok) throw new Error('Caption fetch failed');
          const captionData: any = await captionRes.json();
          return { text: captionData.content || captionData, source: 'invidious' };
        },
        timeout: 10000,
      },
    ], 'YouTube transcript');

    await setCached(c.env.CACHE, ck, result, CACHE_TTL.TRANSCRIPT);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'YouTube transcript failed' }, 500);
  }
});
