/**
 * NychIQ Worker — Web Search Routes
 * Fallback: Brave → Tavily → DuckDuckGo HTML (no key needed)
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { rotateKey } from '../lib/fallback';
import { getCached, setCached, cacheKey, CACHE_TTL } from '../lib/cache';

export const searchRoutes = new Hono<{ Bindings: Env }>();

interface SearchResult {
  url: string;
  name: string;
  snippet: string;
  rank: number;
  host_name: string;
}

/**
 * GET /api/search/web — Web search
 * Params: q, num (default 10)
 */
searchRoutes.get('/web', async (c) => {
  const q = c.req.query('q') || '';
  const num = parseInt(c.req.query('num') || '10', 10);

  if (!q) return c.json({ error: 'Query parameter "q" is required' }, 400);

  const ck = cacheKey('search:web', { q, num: String(num) });
  const cached = await getCached<{ results: SearchResult[] }>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  const results: SearchResult[] = [];

  // 1. Brave Search
  try {
    const key = rotateKey([c.env.BRAVE_KEY_1, c.env.BRAVE_KEY_2]);
    if (key) {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=${num}`,
        { headers: { 'X-Subscription-Token': key, 'Accept': 'application/json' } }
      );
      if (res.ok) {
        const data: any = await res.json();
        const items = (data.web?.results || []).map((r: any, i: number) => ({
          url: r.url || '',
          name: r.title || '',
          snippet: r.description || '',
          rank: i + 1,
          host_name: new URL(r.url || 'https://example.com').hostname,
        }));
        results.push(...items);
        await setCached(c.env.CACHE, ck, { results: items.slice(0, num) }, CACHE_TTL.SEARCH);
        return c.json({ results: items.slice(0, num) });
      }
    }
  } catch (err: any) {
    console.error('Brave Search error:', err?.message);
  }

  // 2. Tavily
  try {
    const key = rotateKey([c.env.TAVILY_KEY_1, c.env.TAVILY_KEY_2]);
    if (key && results.length === 0) {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, max_results: num, include_answer: false }),
      });
      if (res.ok) {
        const data: any = await res.json();
        const items = (data.results || []).map((r: any, i: number) => ({
          url: r.url || '',
          name: r.title || '',
          snippet: r.content || '',
          rank: i + 1,
          host_name: new URL(r.url || 'https://example.com').hostname,
        }));
        results.push(...items);
        await setCached(c.env.CACHE, ck, { results: items.slice(0, num) }, CACHE_TTL.SEARCH);
        return c.json({ results: items.slice(0, num) });
      }
    }
  } catch (err: any) {
    console.error('Tavily error:', err?.message);
  }

  // 3. DuckDuckGo HTML (no API key needed)
  try {
    if (results.length === 0) {
      const res = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NychIQ-Bot/1.0)',
          },
        }
      );
      if (res.ok) {
        const html = await res.text();
        // Parse DuckDuckGo HTML results
        const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)<\/a>.*?<a class="result__snippet"[^>]*>(.*?)<\/a>/gs;
        let match;
        let rank = 1;
        while ((match = resultRegex.exec(html)) !== null && rank <= num) {
          // DuckDuckGo wraps URLs in a redirector — extract the actual URL
          let url = match[1];
          try {
            const ddgUrl = new URL(url);
            const uddg = ddgUrl.searchParams.get('uddg');
            if (uddg) url = uddg;
          } catch { /* keep original */ }
          results.push({
            url,
            name: match[2].replace(/<[^>]*>/g, ''),
            snippet: match[3].replace(/<[^>]*>/g, ''),
            rank: rank++,
            host_name: (() => { try { return new URL(url).hostname; } catch { return ''; } })(),
          });
        }
      }
    }
  } catch (err: any) {
    console.error('DuckDuckGo error:', err?.message);
  }

  // 4. SerpAPI fallback
  try {
    if (results.length === 0 && c.env.SERP_KEY_1) {
      const params = new URLSearchParams({ q, num: String(num), api_key: c.env.SERP_KEY_1 });
      const res = await fetch(`https://serpapi.com/search?${params}`);
      if (res.ok) {
        const data: any = await res.json();
        const items = (data.organic_results || []).map((r: any, i: number) => ({
          url: r.link || '',
          name: r.title || '',
          snippet: r.snippet || '',
          rank: i + 1,
          host_name: new URL(r.link || 'https://example.com').hostname,
        }));
        results.push(...items);
      }
    }
  } catch (err: any) {
    console.error('SerpAPI error:', err?.message);
  }

  if (results.length > 0) {
    await setCached(c.env.CACHE, ck, { results: results.slice(0, num) }, CACHE_TTL.SEARCH);
    return c.json({ results: results.slice(0, num) });
  }

  return c.json({ error: 'All search providers failed' }, 500);
});
