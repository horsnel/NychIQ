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

// ── Cron modules ──
import { morningTrending } from './cron/morningTrending';
import { metadataBackfill } from './cron/metadataBackfill';
import { aiOptimization } from './cron/aiOptimization';
import { nightlyArchive } from './cron/nightlyArchive';

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
  // Dev mode: allow all origins (no credentials with wildcard)
  return cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-RateLimit-Remaining', 'X-Cache-Status'],
    maxAge: 86400,
    credentials: false,
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

  // Skip rate limiting for webhook and health check
  if (path.startsWith('/api/payments/webhook') || path === '/') {
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
  const tier = RATE_LIMITS.trial;

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
app.get('/api/health', (c) => {
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

// ── GitHub Webhook: Auto-deploy trigger ──
// Receives push events from GitHub and triggers Cloudflare Pages build
app.post('/webhook/github', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid payload' }, 400);

  const ref = body.ref || '';
  const branch = ref.replace('refs/heads/', '');

  if (branch !== 'main') {
    return c.json({ skipped: true, reason: `Branch ${branch} is not main` });
  }

  // Trigger Cloudflare Pages deploy via API
  const accountId = c.env.CLOUDFLARE_ACCOUNT_ID || 'a3b3d388de22a4074b01905e65aeb92c';
  const cfToken = c.env.CF_API_TOKEN;
  const hookId = c.env.PAGES_DEPLOY_HOOK_ID;

  if (cfToken && hookId) {
    try {
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/nychiq/deploy_hooks/${hookId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`[Webhook] Triggered Pages deploy for push to main`);
    } catch (err: any) {
      console.error(`[Webhook] Pages deploy trigger failed:`, err?.message);
    }
  }

  return c.json({ received: true, branch, commits: (body.commits || []).length });
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
        const data: any = await res.json();
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
    const url = new URL(request.url);

    // API routes go through Hono
    // Static assets are served automatically by [assets] config
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx);
    }

    // Non-API: let the [assets] config serve static files
    // If no static file matches, fall through to Hono (which returns 404)
    return app.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const body = message.body as any;
      try {
        if (body.type === 'send_email') {
          // Retry email delivery via fallback chain
          console.log(`[Queue] Retrying email to: ${body.to || 'unknown'}`);
          // Import dynamically to avoid circular deps at startup
          const emailLib = await import('./lib/email');
          if (emailLib?.sendEmail) {
            await emailLib.sendEmail(env, body.payload || body);
          }
          message.ack();
        } else if (body.type === 'ANALYZE_TRENDING') {
          console.log(`[Queue] Processing trending analysis for region: ${body.region || 'unknown'}`);
          message.ack();
        } else {
          console.log(`[Queue] Unknown message type: ${body.type}, acking`);
          message.ack();
        }
      } catch (err: any) {
        console.error(`[Queue] Error processing message:`, err?.message);
        message.retry({ delaySeconds: 60 });
      }
    }
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

    // 06:00 — Morning trending discovery; 09,12,15 — Metadata backfill
    if (event.cron === '0 6,9,12,15 * * *') {
      const hour = new Date().getUTCHours();
      if (hour === 6) {
        ctx.waitUntil(morningTrending(env));
      } else {
        ctx.waitUntil(metadataBackfill(env));
      }
    }

    // 18:00 — Batch AI optimization
    if (event.cron === '0 18 * * *') {
      ctx.waitUntil(aiOptimization(env));
    }

    // 01:00 — Nightly archive
    if (event.cron === '0 1 * * *') {
      ctx.waitUntil(nightlyArchive(env));
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
