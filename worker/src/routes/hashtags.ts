/**
 * NychIQ Worker — Hashtag / Keyword Research Routes
 * Fallback: Trends24 (free) → Brave Search (hashtag volume) → Hashtag.ai → KeywordsEverywhere → Gemini Flash (analysis)
 * Cache: Hashtag data → KV, TTL 4hrs
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { rotateKey } from '../lib/fallback';
import { getCached, setCached, cacheKey, CACHE_TTL } from '../lib/cache';

export const hashtagRoutes = new Hono<{ Bindings: Env }>();

interface HashtagResult {
  tag: string;
  volume?: number;
  trend?: 'up' | 'down' | 'stable';
  reach?: number;
  competition?: 'low' | 'medium' | 'high';
  source: string;
}

/**
 * GET /api/hashtags/research — Research hashtags for a niche
 * Params: q (niche/keyword), platform (youtube/tiktok/twitter), limit (default 20)
 */
hashtagRoutes.get('/research', async (c) => {
  const q = c.req.query('q') || '';
  const platform = c.req.query('platform') || 'youtube';
  const limit = parseInt(c.req.query('limit') || '20', 10);

  if (!q) return c.json({ error: 'Query parameter "q" is required' }, 400);

  const ck = cacheKey('hashtags:research', { q, platform, limit: String(limit) });
  const cached = await getCached<{ results: HashtagResult[] }>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  const allResults: HashtagResult[] = [];
  const errors: string[] = [];

  // 1. Trends24 — regional real-time hashtags (no key needed)
  try {
    const regionMap: Record<string, string> = {
      youtube: 'ng', tiktok: 'ng', twitter: 'ng',
      yt: 'ng', ig: 'ng', instagram: 'ng',
    };
    const region = regionMap[platform.toLowerCase()] || 'ng';
    const res = await fetch(`https://trends24.in/${region}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NychIQ-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const html = await res.text();
      const trendRegex = /<a[^>]*class="[^"]*trend[^"]*"[^>]*>([^<]+)<\/a>/gi;
      let match;
      const found: string[] = [];
      while ((match = trendRegex.exec(html)) !== null && found.length < 100) {
        const tag = match[1].trim().replace(/^#/, '');
        if (tag && tag.toLowerCase().includes(q.toLowerCase()) && !found.includes(tag.toLowerCase())) {
          found.push(tag.toLowerCase());
          allResults.push({ tag, source: 'trends24' });
        }
      }
    }
  } catch (err: any) {
    errors.push(`trends24: ${err?.message}`);
  }

  // 2. Brave Search — hashtag volume estimation
  try {
    const key = rotateKey([c.env.BRAVE_KEY_1, c.env.BRAVE_KEY_2]);
    if (key && allResults.length < limit) {
      const searchQuery = platform === 'youtube'
        ? `site:youtube.com ${q} hashtags trending`
        : platform === 'tiktok'
          ? `site:tiktok.com ${q} hashtags trending`
          : `${q} trending hashtags ${platform}`;
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=10`,
        { headers: { 'X-Subscription-Token': key, 'Accept': 'application/json' } }
      );
      if (res.ok) {
        const data: any = await res.json();
        const hashtagRegex = /#([\w]+)/g;
        for (const item of data.web?.results || []) {
          const description = `${item.title || ''} ${item.description || ''}`;
          let hMatch;
          while ((hMatch = hashtagRegex.exec(description)) !== null) {
            const tag = hMatch[1];
            if (tag && !allResults.find(r => r.tag.toLowerCase() === tag.toLowerCase())) {
              allResults.push({ tag, source: 'brave' });
            }
          }
        }
      }
    }
  } catch (err: any) {
    errors.push(`brave: ${err?.message}`);
  }

  // 3. Hashtag.ai — free tier estimates
  try {
    const key = c.env.HASHTAG_AI_KEY;
    if (key && allResults.length < limit) {
      const res = await fetch(`https://api.hashtag-ai.com/v1/suggest?keyword=${encodeURIComponent(q)}&platform=${platform}&limit=${limit}`, {
        headers: key ? { 'Authorization': `Bearer ${key}` } : {},
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data: any = await res.json();
        const items = Array.isArray(data) ? data : data?.hashtags || data?.suggestions || [];
        for (const item of items) {
          const tag = item.tag || item.name || item.hashtag || item.text || '';
          if (tag && !allResults.find(r => r.tag.toLowerCase() === tag.replace(/^#/, '').toLowerCase())) {
            allResults.push({
              tag: tag.replace(/^#/, ''),
              volume: item.volume || item.count || item.searches,
              trend: item.trend || item.growth > 0 ? 'up' : 'stable',
              competition: item.competition || item.difficulty || 'medium',
              source: 'hashtag-ai',
            });
          }
        }
      }
    }
  } catch (err: any) {
    errors.push(`hashtag-ai: ${err?.message}`);
  }

  // 4. KeywordsEverywhere — free credits
  try {
    const key = c.env.KEYWORDSEVERYWHERE_KEY;
    if (key && allResults.length < limit) {
      const res = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: [q],
          dataSource: platform === 'youtube' ? 'yt' : platform === 'tiktok' ? 'tt' : 'gkp',
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data: any = await res.json();
        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        for (const item of items) {
          const tag = item.keyword || item.tag || '';
          if (tag && !allResults.find(r => r.tag.toLowerCase() === tag.toLowerCase())) {
            allResults.push({
              tag,
              volume: item.volume || item.search_volume || item.estimated_searches,
              competition: item.competition || 'medium',
              source: 'keywords-everywhere',
            });
          }
        }
      }
    }
  } catch (err: any) {
    errors.push(`keywords-everywhere: ${err?.message}`);
  }

  // 5. Gemini Flash — analyze hashtag potential
  try {
    const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3, c.env.GEMINI_KEY_4]);
    if (key && allResults.length < 5) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `You are a YouTube/social media hashtag strategist. Generate exactly ${limit} hashtags for "${q}" on ${platform}.

Rules:
- Mix sizes: 40% niche-specific (10k-100k volume), 30% mid-range (100k-500k), 30% broad (500k+)
- Include 2-3 trending tags if relevant
- Prioritize tags with high discovery potential
- Return ONLY a JSON array, no explanation

Format: [{"tag":"string","volume":number,"competition":"low|medium|high","trend":"up|down|stable"}]`,
              }],
            }],
          }),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const items: any[] = JSON.parse(jsonMatch[0]);
            for (const item of items) {
              const tag = item.tag || '';
              if (tag && !allResults.find(r => r.tag.toLowerCase() === tag.replace(/^#/, '').toLowerCase())) {
                allResults.push({
                  tag: tag.replace(/^#/, ''),
                  volume: item.volume,
                  trend: item.trend,
                  competition: item.competition,
                  source: 'gemini',
                });
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    errors.push(`gemini: ${err?.message}`);
  }

  if (allResults.length > 0) {
    const results = allResults.slice(0, limit);
    await setCached(c.env.CACHE, ck, { results }, CACHE_TTL.HASHTAG);
    return c.json({ results, query: q, platform });
  }

  return c.json({ error: 'All hashtag providers failed', errors }, 500);
});

/**
 * GET /api/hashtags/analyze — Analyze a specific hashtag
 * Params: tag (hashtag without #), platform
 */
hashtagRoutes.get('/analyze', async (c) => {
  const tag = c.req.query('tag') || '';
  const platform = c.req.query('platform') || 'youtube';

  if (!tag) return c.json({ error: 'tag parameter is required' }, 400);

  const ck = cacheKey('hashtags:analyze', { tag, platform });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  // Gemini Flash — deep hashtag analysis
  try {
    const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3, c.env.GEMINI_KEY_4]);
    if (key) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `Analyze #${tag} for ${platform} creators. Provide actionable intelligence.

Return ONLY valid JSON:
{
  "tag": "${tag}",
  "estimatedVolume": number,
  "competition": "low|medium|high",
  "trend": "up|down|stable",
  "bestPostingTimes": ["day/time1","day/time2"],
  "relatedHashtags": ["tag1","tag2","tag3","tag4","tag5"],
  "contentTips": ["tip1","tip2","tip3"],
  "nicheRelevance": "description"
}

Base volume estimates on real ${platform} hashtag data patterns. Be specific and actionable.`,
              }],
            }],
          }),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            result.source = 'gemini';
            await setCached(c.env.CACHE, ck, result, CACHE_TTL.HASHTAG);
            return c.json(result);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Gemini hashtag analyze error:', err?.message);
  }

  return c.json({ error: 'Hashtag analysis failed' }, 500);
});
