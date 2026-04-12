/**
 * NychIQ Worker — Geolocation Routes
 * Get user's location from IP. Fallback: ipapi.co (free) → CF headers
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { getCached, setCached, cacheKey } from '../lib/cache';

export const geolocationRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/geolocation — Get location from IP
 * Params: ip (optional, auto-detected from CF-Connecting-IP header)
 */
geolocationRoutes.get('/', async (c) => {
  const ip = c.req.query('ip') || c.req.header('CF-Connecting-IP') || '';
  if (!ip) return c.json({ error: 'IP address required' }, 400);

  const ck = cacheKey('geo', { ip });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  // 1. ipapi.co (free, 1k/day without key, 100k/day with key)
  try {
    const headers: Record<string, string> = { 'User-Agent': 'NychIQ/1.0' };
    const key = c.env.IPAPI_KEY;
    if (key) headers['Authorization'] = `Bearer ${key}`;
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data: any = await res.json();
      const result = {
        ip: data.ip || ip,
        city: data.city || '',
        region: data.region || '',
        country: data.country_name || '',
        countryCode: data.country_code || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        timezone: data.timezone || '',
        org: data.org || '',
        source: 'ipapi',
      };
      await setCached(c.env.CACHE, ck, result, 86400);
      return c.json(result);
    }
  } catch (err: any) {
    console.error('ipapi.co error:', err?.message);
  }

  // 2. CloudFlare headers (no API call needed)
  const cfCountry = c.req.header('CF-IPCountry') || '';
  const cfRegion = c.req.header('CF-Region') || '';
  if (cfCountry) {
    const result = {
      ip,
      countryCode: cfCountry,
      region: cfRegion,
      source: 'cf-headers',
    };
    await setCached(c.env.CACHE, ck, result, 86400);
    return c.json(result);
  }

  return c.json({ error: 'Geolocation failed', ip }, 500);
});
