/**
 * NychIQ Worker — Multi-Layer Cache
 * Layer 1: Upstash Redis (fastest, distributed, atomic)
 * Layer 2: CloudFlare KV (always available, globally distributed)
 * Both are checked on read; writes go to both.
 */

import type { Env } from './env';

/** Cache TTL constants matching the platform spec */
export const CACHE_TTL = {
  TRENDING: 3600,      // 1 hour
  SEARCH: 1800,        // 30 minutes
  CHANNEL: 21600,      // 6 hours
  VIDEO_LIST: 7200,    // 2 hours
  AUDIT: 86400,        // 24 hours
  HASHTAG: 14400,      // 4 hours
  TRANSCRIPT: -1,      // permanent (never expires)
  RATE_LIMIT: 3600,    // 1 hour
} as const;

/**
 * Get a cached value — tries Upstash Redis first, falls back to KV.
 */
export async function getCached<T>(kv: KVNamespace, key: string, env?: Env): Promise<T | null> {
  // 1. Upstash Redis
  if (env?.UPSTASH_REDIS_URL && env?.UPSTASH_REDIS_TOKEN) {
    try {
      const res = await fetch(`${env.UPSTASH_REDIS_URL}/get/${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${env.UPSTASH_REDIS_TOKEN}` },
      });
      if (res.ok) {
        const raw = await res.text();
        if (raw && raw !== 'null' && raw !== '"null"') {
          return JSON.parse(raw) as T;
        }
      }
    } catch {
      // fall through to KV
    }
  }

  // 2. CloudFlare KV
  try {
    const raw = await kv.get(key, 'json');
    if (raw === null) return null;
    return raw as T;
  } catch {
    return null;
  }
}

/**
 * Store a value in both Upstash Redis and KV.
 */
export async function setCached(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds: number,
  env?: Env
): Promise<void> {
  const serialized = JSON.stringify(value);
  const expirationTtl = ttlSeconds > 0 ? ttlSeconds : undefined;

  // 1. Upstash Redis (parallel)
  if (env?.UPSTASH_REDIS_URL && env?.UPSTASH_REDIS_TOKEN) {
    const redisProm = fetch(`${env.UPSTASH_REDIS_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.UPSTASH_REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: serialized,
        ex: expirationTtl,
      }),
    }).catch(() => {});

    // Don't await — fire and forget for Redis
    // If it fails, KV has it covered
    void redisProm;
  }

  // 2. CloudFlare KV (awaited — primary guarantee)
  try {
    await kv.put(key, serialized, { expirationTtl });
  } catch (err) {
    console.error('KV cache set error:', err);
  }
}

/**
 * Build a cache key from route + params.
 */
/**
 * Invalidate a cached value from both layers.
 */
export async function invalidateCached(kv: KVNamespace, key: string, env?: Env): Promise<void> {
  if (env?.UPSTASH_REDIS_URL && env?.UPSTASH_REDIS_TOKEN) {
    fetch(`${env.UPSTASH_REDIS_URL}/del/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.UPSTASH_REDIS_TOKEN}` },
    }).catch(() => {});
  }
  try {
    await kv.delete(key);
  } catch {}
}

export function cacheKey(route: string, params: Record<string, string>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const paramStr = sorted.map(([k, v]) => `${k}=${v}`).join('&');
  return `nychiq:${route}:${paramStr}`;
}
