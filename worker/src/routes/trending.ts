/**
 * NychIQ Worker — Multi-Platform Trending Routes
 * Fallback: Piped/Invidious (YouTube) → Trends24 (TikTok/Twitter hashtags) → Tokcount (TikTok) → Pentos
 * Cache: All trending → KV, TTL 1hr
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { getCached, setCached, cacheKey, CACHE_TTL } from '../lib/cache';

export const trendingRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/trending/youtube — YouTube trending by region
 * Params: regionCode (default NG), maxResults (default 20)
 */
trendingRoutes.get('/youtube', async (c) => {
  const regionCode = c.req.query('regionCode') || 'NG';
  const maxResults = c.req.query('maxResults') || '20';

  const ck = cacheKey('trending:youtube', { regionCode, maxResults });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  const errors: string[] = [];

  // 1. Piped trending
  try {
    const res = await fetch(`https://pipedapi.kavin.rocks/trending?region=${regionCode}`);
    if (res.ok) {
      const data: any = await res.json();
      const items = (data || []).slice(0, parseInt(maxResults)).map((v: any) => ({
        id: v.url?.replace('/watch?v=', ''),
        title: v.title || '',
        channelTitle: v.uploaderName || '',
        thumbnail: v.thumbnail || '',
        views: v.views || 0,
        publishedAt: v.uploaded ? new Date(v.uploaded).toISOString() : '',
        duration: v.duration || 0,
        source: 'piped',
      }));
      await setCached(c.env.CACHE, ck, { items, region: regionCode }, CACHE_TTL.TRENDING);
      return c.json({ items, region: regionCode });
    }
  } catch (err: any) {
    errors.push(`piped: ${err?.message}`);
  }

  // 2. Invidious trending
  try {
    const res = await fetch(`https://inv.tux.pizza/api/v1/trending?region=${regionCode}`);
    if (res.ok) {
      const data: any = await res.json();
      const items = (data || []).slice(0, parseInt(maxResults)).map((v: any) => ({
        id: v.videoId,
        title: v.title || '',
        channelTitle: v.author || '',
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        views: v.viewCount || 0,
        publishedAt: v.published ? new Date(v.published * 1000).toISOString() : '',
        duration: v.lengthSeconds || 0,
        source: 'invidious',
      }));
      await setCached(c.env.CACHE, ck, { items, region: regionCode }, CACHE_TTL.TRENDING);
      return c.json({ items, region: regionCode });
    }
  } catch (err: any) {
    errors.push(`invidious: ${err?.message}`);
  }

  return c.json({ error: 'YouTube trending failed', errors }, 500);
});

/**
 * GET /api/trending/tiktok — TikTok trending hashtags and trends
 * Fallback: Trends24 → Tokcount → Trendtok
 */
trendingRoutes.get('/tiktok', async (c) => {
  const region = c.req.query('region') || 'ng';

  const ck = cacheKey('trending:tiktok', { region });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  const errors: string[] = [];

  // 1. Trends24 — TikTok hashtags
  try {
    const res = await fetch(`https://trends24.in/${region}/tiktok/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NychIQ-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const html = await res.text();
      const hashtagRegex = /<a[^>]*class="[^"]*trend[^"]*"[^>]*>([^<]+)<\/a>/gi;
      let match;
      const hashtags: Array<{ tag: string; rank: number }> = [];
      let rank = 1;
      while ((match = hashtagRegex.exec(html)) !== null && rank <= 50) {
        const tag = match[1].trim().replace(/^#/, '');
        if (tag && !hashtags.find(h => h.tag === tag)) {
          hashtags.push({ tag, rank: rank++ });
        }
      }
      if (hashtags.length > 0) {
        const result = { hashtags, source: 'trends24', region };
        await setCached(c.env.CACHE, ck, result, CACHE_TTL.TRENDING);
        return c.json(result);
      }
    }
  } catch (err: any) {
    errors.push(`trends24: ${err?.message}`);
  }

  // 2. Tokcount — TikTok trend data
  try {
    const res = await fetch('https://tokcount.com/api/trending/hashtags', {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data: any = await res.json();
      const hashtags = (Array.isArray(data) ? data : data?.hashtags || data?.data || [])
        .slice(0, 50)
        .map((h: any, i: number) => ({
          tag: h.name || h.tag || h.hashtag || h.title || '',
          rank: i + 1,
          views: h.views || h.count || h.volume || 0,
        }));
      if (hashtags.length > 0) {
        const result = { hashtags, source: 'tokcount', region };
        await setCached(c.env.CACHE, ck, result, CACHE_TTL.TRENDING);
        return c.json(result);
      }
    }
  } catch (err: any) {
    errors.push(`tokcount: ${err?.message}`);
  }

  // 3. Trendtok (50 req/day free)
  try {
    const key = c.env.TRENDTOK_KEY;
    const res = await fetch('https://trendtok.io/api/v1/trending-hashtags', {
      headers: key ? { 'Authorization': `Bearer ${key}` } : {},
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data: any = await res.json();
      const hashtags = (Array.isArray(data) ? data : data?.hashtags || data?.data || [])
        .slice(0, 50)
        .map((h: any, i: number) => ({
          tag: h.name || h.tag || h.hashtag || '',
          rank: i + 1,
          views: h.views || h.count || h.volume || 0,
        }));
      if (hashtags.length > 0) {
        const result = { hashtags, source: 'trendtok', region };
        await setCached(c.env.CACHE, ck, result, CACHE_TTL.TRENDING);
        return c.json(result);
      }
    }
  } catch (err: any) {
    errors.push(`trendtok: ${err?.message}`);
  }

  return c.json({ error: 'TikTok trending failed', errors }, 500);
});

/**
 * GET /api/trending/twitter — Twitter/X trending topics
 * Fallback: Trends24 → Nitter
 */
trendingRoutes.get('/twitter', async (c) => {
  const region = c.req.query('region') || 'ng';

  const ck = cacheKey('trending:twitter', { region });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  const errors: string[] = [];

  // 1. Trends24
  try {
    const res = await fetch(`https://trends24.in/${region}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NychIQ-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const html = await res.text();
      const trendRegex = /<a[^>]*class="[^"]*trend[^"]*"[^>]*>([^<]+)<\/a>/gi;
      let match;
      const trends: Array<{ topic: string; rank: number }> = [];
      let rank = 1;
      while ((match = trendRegex.exec(html)) !== null && rank <= 50) {
        const topic = match[1].trim().replace(/^#/, '');
        if (topic && !trends.find(t => t.topic === topic)) {
          trends.push({ topic, rank: rank++ });
        }
      }
      if (trends.length > 0) {
        const result = { trends, source: 'trends24', region };
        await setCached(c.env.CACHE, ck, result, CACHE_TTL.TRENDING);
        return c.json(result);
      }
    }
  } catch (err: any) {
    errors.push(`trends24: ${err?.message}`);
  }

  // 2. Nitter trending
  try {
    const res = await fetch('https://nitter.net/search?f=tweets&q=&e-nativeretweets=on', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const html = await res.text();
      const hashtagRegex = /href="\/search\?q=([^"]+)"/gi;
      let match;
      const trends: Array<{ topic: string; rank: number }> = [];
      let rank = 1;
      while ((match = hashtagRegex.exec(html)) !== null && rank <= 30) {
        const topic = decodeURIComponent(match[1]).trim();
        if (topic && !trends.find(t => t.topic === topic) && topic.length > 2) {
          trends.push({ topic, rank: rank++ });
        }
      }
      if (trends.length > 0) {
        const result = { trends, source: 'nitter', region };
        await setCached(c.env.CACHE, ck, result, CACHE_TTL.TRENDING);
        return c.json(result);
      }
    }
  } catch (err: any) {
    errors.push(`nitter: ${err?.message}`);
  }

  return c.json({ error: 'Twitter trending failed', errors }, 500);
});

/**
 * GET /api/trending/pentos — Pentos TikTok hashtag analytics (free tier)
 * Params: hashtag
 */
trendingRoutes.get('/pentos', async (c) => {
  const hashtag = c.req.query('hashtag') || '';

  if (!hashtag) return c.json({ error: 'hashtag parameter is required' }, 400);

  const key = c.env.PENTOS_KEY;
  if (!key) {
    return c.json({ error: 'Pentos API key not configured' }, 400);
  }

  const ck = cacheKey('trending:pentos', { hashtag });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  try {
    const res = await fetch(`https://app.pentos.ai/api/analytics/hashtags/${encodeURIComponent(hashtag.replace(/^#/, ''))}`, {
      headers: { 'Authorization': `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      await setCached(c.env.CACHE, ck, data, CACHE_TTL.HASHTAG);
      return c.json(data);
    }
    return c.json({ error: `Pentos API error: ${res.status}` }, 500);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Pentos request failed' }, 500);
  }
});
