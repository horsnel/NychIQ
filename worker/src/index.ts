/**
 * NychIQ API Worker — Entry Point
 * Routes all /api/* requests to their respective handlers.
 * CloudFlare Workers + Hono framework.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './lib/env';
import { RealtimeRoom } from './realtime';

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

// ── Export Durable Object class ──
export { RealtimeRoom };

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
      exposeHeaders: ['Content-Length'],
      maxAge: 86400,
      credentials: true,
    })(c, next);
  }
  // Dev mode: allow all origins
  return cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
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

// ── Health check ──
app.get('/', (c) => {
  return c.json({
    name: 'NychIQ API',
    version: '1.0.0',
    status: 'healthy',
    environment: c.env.ENVIRONMENT || 'unknown',
    timestamp: new Date().toISOString(),
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

// ── 404 handler ──
app.notFound((c) => {
  return c.json({ error: 'Not found', path: new URL(c.req.url).pathname }, 404);
});

// ── Global error handler ──
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
