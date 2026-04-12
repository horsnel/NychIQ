/**
 * NychIQ Worker — Maps / Geocoding Routes
 * Fallback: Nominatim (no key) → LocationIQ (5k/day free) → Radar.io
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { getCached, setCached, cacheKey } from '../lib/cache';

export const mapsRoutes = new Hono<{ Bindings: Env }>();

interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
  address: Record<string, string>;
  source: string;
}

interface ReverseGeoResult {
  displayName: string;
  address: Record<string, string>;
  lat: number;
  lon: number;
  source: string;
}

/**
 * GET /api/maps/geocode — Forward geocoding (address → coordinates)
 * Params: q (address/query), limit (default 5)
 */
mapsRoutes.get('/geocode', async (c) => {
  const q = c.req.query('q') || '';
  const limit = parseInt(c.req.query('limit') || '5', 10);

  if (!q) return c.json({ error: 'Query parameter "q" is required' }, 400);

  const ck = cacheKey('maps:geocode', { q, limit: String(limit) });
  const cached = await getCached<{ results: GeoResult[] }>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  const results: GeoResult[] = [];

  // 1. Nominatim / OpenStreetMap (no key needed)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        q, format: 'json', limit: String(limit), addressdetails: '1',
      })}`,
      {
        headers: { 'User-Agent': 'NychIQ-Platform/1.0' },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (res.ok) {
      const data: any[] = await res.json();
      for (const item of data.slice(0, limit)) {
        results.push({
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name || '',
          address: item.address || {},
          source: 'nominatim',
        });
      }
      if (results.length > 0) {
        await setCached(c.env.CACHE, ck, { results }, 86400);
        return c.json({ results });
      }
    }
  } catch (err: any) {
    console.error('Nominatim error:', err?.message);
  }

  // 2. LocationIQ (5k/day free)
  try {
    const key = c.env.LOCATIONIQ_KEY;
    if (key) {
      const res = await fetch(
        `https://us1.locationiq.com/v1/search?${new URLSearchParams({
          key, q, format: 'json', limit: String(limit), addressdetails: '1',
        })}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data: any[] = await res.json();
        for (const item of data.slice(0, limit)) {
          results.push({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            displayName: item.display_name || '',
            address: item.address || {},
            source: 'locationiq',
          });
        }
        if (results.length > 0) {
          await setCached(c.env.CACHE, ck, { results }, 86400);
          return c.json({ results });
        }
      }
    }
  } catch (err: any) {
    console.error('LocationIQ error:', err?.message);
  }

  // 3. Radar.io (100k/month free)
  try {
    const key = c.env.RADAR_KEY;
    if (key) {
      const res = await fetch(
        `https://api.radar.io/v1/geocode/forward?${new URLSearchParams({ query: q, limit: String(limit) })}`,
        {
          headers: { 'Authorization': key },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const addresses = data?.addresses || data?.places || [];
        for (const item of addresses.slice(0, limit)) {
          results.push({
            lat: item.latitude || item.geometry?.coordinates?.[1] || 0,
            lon: item.longitude || item.geometry?.coordinates?.[0] || 0,
            displayName: item.formattedAddress || item.placeLabel || '',
            address: item.address || item.addressElements || {},
            source: 'radar',
          });
        }
        if (results.length > 0) {
          await setCached(c.env.CACHE, ck, { results }, 86400);
          return c.json({ results });
        }
      }
    }
  } catch (err: any) {
    console.error('Radar.io error:', err?.message);
  }

  return c.json({ error: 'All geocoding providers failed', results: [] }, 500);
});

/**
 * GET /api/maps/reverse — Reverse geocoding (coordinates → address)
 * Params: lat, lon
 */
mapsRoutes.get('/reverse', async (c) => {
  const lat = c.req.query('lat') || '';
  const lon = c.req.query('lon') || '';

  if (!lat || !lon) return c.json({ error: 'lat and lon parameters are required' }, 400);

  const ck = cacheKey('maps:reverse', { lat, lon });
  const cached = await getCached<ReverseGeoResult>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  // 1. Nominatim (no key needed)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${new URLSearchParams({
        lat, lon, format: 'json', addressdetails: '1',
      })}`,
      {
        headers: { 'User-Agent': 'NychIQ-Platform/1.0' },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (res.ok) {
      const data: any = await res.json();
      if (data && !data.error) {
        const result = {
          displayName: data.display_name || '',
          address: data.address || {},
          lat: parseFloat(data.lat),
          lon: parseFloat(data.lon),
          source: 'nominatim',
        };
        await setCached(c.env.CACHE, ck, result, 86400);
        return c.json(result);
      }
    }
  } catch (err: any) {
    console.error('Nominatim reverse error:', err?.message);
  }

  // 2. LocationIQ
  try {
    const key = c.env.LOCATIONIQ_KEY;
    if (key) {
      const res = await fetch(
        `https://us1.locationiq.com/v1/reverse?${new URLSearchParams({
          key, lat, lon, format: 'json', addressdetails: '1',
        })}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data: any = await res.json();
        if (data && !data.error) {
          const result = {
            displayName: data.display_name || '',
            address: data.address || {},
            lat: parseFloat(data.lat),
            lon: parseFloat(data.lon),
            source: 'locationiq',
          };
          await setCached(c.env.CACHE, ck, result, 86400);
          return c.json(result);
        }
      }
    }
  } catch (err: any) {
    console.error('LocationIQ reverse error:', err?.message);
  }

  // 3. Radar.io
  try {
    const key = c.env.RADAR_KEY;
    if (key) {
      const res = await fetch(
        `https://api.radar.io/v1/geocode/reverse?${new URLSearchParams({ coordinates: `${lat},${lon}` })}`,
        {
          headers: { 'Authorization': key },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const address = data?.addresses?.[0] || data?.places?.[0];
        if (address) {
          const result = {
            displayName: address.formattedAddress || address.placeLabel || '',
            address: address.address || address.addressElements || {},
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            source: 'radar',
          };
          await setCached(c.env.CACHE, ck, result, 86400);
          return c.json(result);
        }
      }
    }
  } catch (err: any) {
    console.error('Radar.io reverse error:', err?.message);
  }

  return c.json({ error: 'All reverse geocoding providers failed' }, 500);
});
