/**
 * NychIQ Worker — Realtime Routes
 * HTTP-based pub/sub for real-time features.
 * Backend: Supabase Realtime (primary) → Ably (free 6M msg/mo) → Soketi (self-hosted).
 * No Durable Objects required — fully free-tier compatible.
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { publishRealtime, getRealtimeEndpoint } from '../lib/fallback-realtime';

export const realtimeRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/realtime/endpoint — Get the best realtime WebSocket URL for a channel
 * Query: channel
 */
realtimeRoutes.get('/endpoint', (c) => {
  const channel = c.req.query('channel') || 'default';
  const endpoint = getRealtimeEndpoint(c.env, channel);
  return c.json(endpoint);
});

/**
 * POST /api/realtime/publish — Publish a message to a channel
 * Body: { channel, event, data }
 */
realtimeRoutes.post('/publish', async (c) => {
  try {
    const { channel, event, data } = await c.req.json<{
      channel?: string;
      event?: string;
      data?: unknown;
    }>();

    if (!channel || !event) {
      return c.json({ error: 'channel and event are required' }, 400);
    }

    const result = await publishRealtime(c.env, channel, event, data);

    if (result.success) {
      return c.json({ published: true, source: result.source, clients: result.clients });
    }

    return c.json({ error: 'All realtime providers failed', hint: 'Set ABLY_KEY or configure Supabase Realtime RPC' }, 503);
  } catch (err: any) {
    console.error('Realtime publish error:', err?.message);
    return c.json({ error: err?.message || 'Publish failed' }, 500);
  }
});

/**
 * GET /api/realtime/health — Check which realtime providers are available
 */
realtimeRoutes.get('/health', (c) => {
  return c.json({
    supabase: !!(c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_KEY),
    ably: !!c.env.ABLY_KEY,
    soketi: !!c.env.SOKETI_URL,
    anyAvailable: !!(
      (c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_KEY) ||
      c.env.ABLY_KEY ||
      c.env.SOKETI_URL
    ),
  });
});
