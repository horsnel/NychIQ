/**
 * NychIQ Worker — Web Reader / Scraper Routes
 * Extract readable content from URLs for analysis.
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { getCached, setCached, cacheKey } from '../lib/cache';

export const webRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/web/read — Extract readable content from a URL
 * Params: url (required), format (text|html, default text)
 * Returns: { title, text, description, url, wordCount }
 */
webRoutes.get('/read', async (c) => {
  const url = c.req.query('url') || '';
  const format = c.req.query('format') || 'text';

  if (!url) return c.json({ error: 'url parameter is required' }, 400);

  // Validate URL
  try { new URL(url); } catch { return c.json({ error: 'Invalid URL' }, 400); }

  const ck = cacheKey('web:read', { url });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NychIQ-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return c.json({ error: `Fetch failed: ${res.status}` }, 502);

    const html = await res.text();

    if (format === 'html') {
      const result = { url, html, title: extractTitle(html), source: 'fetch' };
      await setCached(c.env.CACHE, ck, result, 3600);
      return c.json(result);
    }

    // Extract text content
    const title = extractTitle(html);
    const description = extractMeta(html, 'description');
    const text = htmlToText(html);
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    const result = { url, title, description, text: text.slice(0, 50000), wordCount, source: 'fetch' };
    await setCached(c.env.CACHE, ck, result, 3600);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Web read failed' }, 500);
  }
});

/**
 * POST /api/web/analyze — Fetch a URL and analyze with AI
 * Body: { url, prompt? }
 */
webRoutes.post('/analyze', async (c) => {
  const { url, prompt } = await c.req.json<{ url?: string; prompt?: string }>();
  if (!url) return c.json({ error: 'url is required' }, 400);

  try { new URL(url); } catch { return c.json({ error: 'Invalid URL' }, 400); }

  // Fetch the page
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NychIQ-Bot/1.0', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return c.json({ error: `Fetch failed: ${res.status}` }, 502);

    const html = await res.text();
    const title = extractTitle(html);
    const text = htmlToText(html).slice(0, 20000); // Limit for AI context

    // Analyze with AI
    const analysisPrompt = prompt || `Analyze this webpage content for a YouTube creator. Extract key insights, relevant data points, and actionable takeaways. Title: "${title}"\n\nContent:\n${text.slice(0, 15000)}`;

    const aiRes = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: 'You are a web content analyst for YouTube creators. Extract key insights and actionable takeaways. Be concise and structured.' },
          { role: 'user', content: analysisPrompt },
        ],
      }),
    });

    if (aiRes.ok) {
      const data: any = await aiRes.json();
      return c.json({
        url,
        title,
        analysis: data.choices?.[0]?.message?.content || '',
        source: 'ai-analyzed',
      });
    }

    return c.json({ url, title, text: text.slice(0, 5000), source: 'raw' });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Web analysis failed' }, 500);
  }
});

// ── Helpers ──

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/is);
  if (match) return match[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const ogMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  return ogMatch ? ogMatch[1].trim() : '';
}

function extractMeta(html: string, name: string): string {
  const match = html.match(new RegExp(`<meta[^>]*(?:name|property)="${name}"[^>]*content="([^"]+)"`, 'i'));
  return match ? match[1].trim() : '';
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
