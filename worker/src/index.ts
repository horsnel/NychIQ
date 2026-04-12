/**
 * NychIQ API Worker — Entry Point
 * Routes all /api/* requests to their respective handlers.
 * CloudFlare Workers + Hono framework.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './lib/env';
import { checkRateLimit, RATE_LIMITS } from './lib/rate-limit';

// ── Route modules ──
import { aiRoutes } from './routes/ai';
import { youtubeRoutes } from './routes/youtube';
import { searchRoutes } from './routes/search';
import { socialRoutes } from './routes/social';
import { imageRoutes } from './routes/images';
import { translateRoutes } from './routes/translate';
import { authRoutes } from './routes/auth';
import { paystackRoutes } from './routes/payments';
import { visionRoutes } from './routes/vision';
import { embeddingsRoutes } from './routes/embeddings';
import { mapsRoutes } from './routes/maps';
import { trendingRoutes } from './routes/trending';
import { hashtagRoutes } from './routes/hashtags';
import { emailRoutes } from './routes/email';
import { storageRoutes } from './routes/storage';
import { auditRoutes } from './routes/audit';
import { realtimeRoutes } from './routes/realtime';
import { geolocationRoutes } from './routes/geolocation';
import { webRoutes } from './routes/web';

const app = new Hono<{ Bindings: Env }>();

// ── CORS middleware ──
app.use('*', async (c, next) => {
  const origins = c.env.CORS_ORIGINS;
  if (origins) {
    const allowed = origins.split(',').map(s => s.trim());
    return cors({
      origin: allowed,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length', 'X-RateLimit-Remaining', 'X-Cache-Status'],
      maxAge: 86400,
      credentials: true,
    })(c, next);
  }
  // Dev mode: allow all origins
  return cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-RateLimit-Remaining', 'X-Cache-Status'],
    maxAge: 86400,
  })(c, next);
});

// ── Request logger ──
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const status = c.res.status;
  const method = c.req.method;
  const path = new URL(c.req.url).pathname;
  console.log(`${status} ${method} ${path} ${ms}ms`);
});

// ── Rate limiting middleware (skipped for health check, static assets, and auth) ──
app.use('/api/*', async (c, next) => {
  const path = new URL(c.req.url).pathname;

  // Skip rate limiting for auth endpoints, health, and static
  if (path.startsWith('/api/auth') || path.startsWith('/api/payments/webhook') || path === '/') {
    await next();
    return;
  }

  // Extract identifier from Authorization header or IP
  const authHeader = c.req.header('Authorization');
  let identifier: string;
  if (authHeader?.startsWith('Bearer ')) {
    // Use token hash as identifier
    const token = authHeader.slice(7);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    identifier = `user:${Array.from(new Uint8Array(hash)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  } else {
    // Use IP as identifier
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    identifier = `ip:${ip}`;
  }

  // Determine rate limit based on plan (default: trial)
  const plan = c.req.header('X-User-Plan') || 'trial';
  const tier = RATE_LIMITS[plan] || RATE_LIMITS.trial;

  const result = await checkRateLimit(c.env, identifier, tier.limit, tier.window);

  c.header('X-RateLimit-Limit', String(tier.limit));
  c.header('X-RateLimit-Remaining', String(result.remaining));
  c.header('X-RateLimit-Source', result.source);

  if (!result.allowed) {
    return c.json({
      error: 'Rate limit exceeded',
      limit: tier.limit,
      remaining: 0,
      resetAt: result.resetAt,
    }, 429);
  }

  await next();
});

// ── Cache status tracker (injects X-Cache-Status header) ──
app.use('/api/*', async (c, next) => {
  await next();
  // This is set by route handlers that return cached data
  if (!c.res.headers.get('X-Cache-Status')) {
    c.header('X-Cache-Status', 'MISS');
  }
});

// ── Health check ──
app.get('/', (c) => {
  return c.json({
    name: 'NychIQ API',
    version: '2.0.0',
    status: 'healthy',
    environment: c.env.ENVIRONMENT || 'unknown',
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!(c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_KEY),
      upstash: !!(c.env.UPSTASH_REDIS_URL && c.env.UPSTASH_REDIS_TOKEN),
      brevo: !!c.env.BREVO_KEY,
      resend: !!c.env.RESEND_KEY,
      backblaze: !!(c.env.BACKBLAZE_KEY_ID && c.env.BACKBLAZE_APP_KEY),
      ably: !!c.env.ABLY_KEY,
      soketi: !!c.env.SOKETI_URL,
      turso: !!(c.env.TURSO_DB_URL && c.env.TURSO_DB_TOKEN),
      qstash: !!c.env.QSTASH_TOKEN,
      paystack: !!c.env.PAYSTACK_SECRET,
    },
  });
});

// ── Mount API routes ──
app.route('/api/ai', aiRoutes);
app.route('/api/youtube', youtubeRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/social', socialRoutes);
app.route('/api/images', imageRoutes);
app.route('/api/translate', translateRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/payments', paystackRoutes);
app.route('/api/vision', visionRoutes);
app.route('/api/embeddings', embeddingsRoutes);
app.route('/api/maps', mapsRoutes);
app.route('/api/trending', trendingRoutes);
app.route('/api/hashtags', hashtagRoutes);
app.route('/api/email', emailRoutes);
app.route('/api/storage', storageRoutes);
app.route('/api/audit', auditRoutes);
app.route('/api/realtime', realtimeRoutes);
app.route('/api/geolocation', geolocationRoutes);
app.route('/api/web', webRoutes);

// ── Cron Handler ──
// Triggered every 15 min and every 6 hrs via wrangler.toml cron triggers.

/**
 * Refresh trending data from all platforms.
 */
async function refreshTrendingCache(env: Env) {
  const regions = ['NG', 'US', 'GB', 'KE', 'ZA'];

  for (const region of regions) {
    try {
      // YouTube trending via Piped
      const res = await fetch(`https://pipedapi.kavin.rocks/trending?region=${region}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        const key = `nychiq:trending:youtube:maxResults=20&regionCode=${region}`;
        await env.CACHE.put(key, JSON.stringify({
          items: (data || []).slice(0, 20),
          region,
        }), { expirationTtl: 3600 });
      }
    } catch (err: any) {
      console.error(`Trending refresh error (${region}):`, err?.message);
    }
  }

  console.log('Trending cache refreshed for regions:', regions.join(', '));
}

/**
 * Clean up expired cache entries and run maintenance tasks.
 */
async function cleanupExpiredCache(env: Env) {
  if (env.UPSTASH_REDIS_URL && env.UPSTASH_REDIS_TOKEN) {
    try {
      await fetch(`${env.UPSTASH_REDIS_URL}/ping`, {
        headers: { 'Authorization': `Bearer ${env.UPSTASH_REDIS_TOKEN}` },
      });
    } catch (err: any) {
      console.error('Redis health check error:', err?.message);
    }
  }

  console.log('Cache maintenance completed');
}

// ── Worker Export ──
const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(`Cron triggered: ${event.cron}`);

    if (event.cron === '*/15 * * * *') {
      ctx.waitUntil(refreshTrendingCache(env));
    }

    if (event.cron === '0 */6 * * *') {
      ctx.waitUntil(refreshTrendingCache(env));
      ctx.waitUntil(cleanupExpiredCache(env));
    }
  },
};

export default worker;

// ── 404 handler ──
app.notFound((c) => {
  return c.json({ error: 'Not found', path: new URL(c.req.url).pathname }, 404);
});

// ── Global error handler ──
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});
