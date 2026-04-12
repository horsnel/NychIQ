/**
 * NychIQ Worker — Multi-Layer Cache
 * Layer 1: Upstash Redis (fastest, distributed, atomic)
 * Layer 2: CloudFlare KV (always available, globally distributed)
 * Both are checked on read; writes go to both.
 */

import type { Env } from './env';

/** In-flight request deduplication map — prevents thundering herd on identical keys */
const inFlightRequests = new Map<string, { promise: Promise<unknown>; expiresAt: number }>();

/** Cache TTL constants matching the platform spec */
export const CACHE_TTL = {
  TRENDING: 3600,      // 1 hour
  SEARCH: 1800,        // 30 minutes
  CHANNEL: 21600,      // 6 hours
  VIDEO_LIST: 7200,    // 2 hours
  AUDIT: 86400,        // 24 hours
  HASHTAG: 14400,      // 4 hours
  TRANSCRIPT: 604800,   // 7 days
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

// ---------------------------------------------------------------------------
// Request deduplication & conditional fetch — ultra API call minimization
// ---------------------------------------------------------------------------

/** Shape of a timestamped cache entry used by conditionalFetch */
interface TimestampedCacheEntry<T> {
  data: T;
  ts: number; // epoch ms when this entry was written
}

/**
 * Deduplicate in-flight requests for the same key.
 *
 * When multiple callers request the same data simultaneously (e.g. trending
 * data being refreshed while users request it), only ONE actual fetch happens.
 * Everyone else awaits the shared Promise.
 *
 * - Key format inside the dedup map: `req:${key}`
 * - TTL for dedup entries: 10 seconds (prevents duplicate fetches within a burst)
 * - Returns: `{ result: T | null, wasDuplicate: boolean }`
 *
 * If a request is already in-flight for this key, the caller waits for it.
 * If the in-flight request fails, the entry is evicted so the next caller retries.
 */
export async function deduplicateRequest<T>(
  kv: KVNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 10,
): Promise<{ result: T | null; wasDuplicate: boolean }> {
  const dedupKey = `req:${key}`;
  const now = Date.now();

  // ---- housekeeping: purge any entries that have exceeded their TTL ----
  for (const [k, entry] of inFlightRequests) {
    if (entry.expiresAt <= now) {
      inFlightRequests.delete(k);
    }
  }

  // ---- check for an existing in-flight request ----
  const existing = inFlightRequests.get(dedupKey);
  if (existing) {
    try {
      const result = (await existing.promise) as T;
      return { result, wasDuplicate: true };
    } catch {
      // The in-flight request failed — evict so the next caller retries.
      inFlightRequests.delete(dedupKey);
      // Fall through to create a new request below.
    }
  }

  // ---- no in-flight request — create one ----
  const promise = fetchFn();
  inFlightRequests.set(dedupKey, {
    promise,
    expiresAt: now + ttl * 1000,
  });

  try {
    const result = await promise;
    return { result, wasDuplicate: false };
  } catch (err) {
    // Evict failed request so subsequent callers get a fresh chance.
    inFlightRequests.delete(dedupKey);
    console.error(`[deduplicateRequest] fetch failed for key "${key}":`, err);
    return { result: null, wasDuplicate: false };
  }
}

/**
 * Smart conditional fetching — serves cached data when possible and only
 * calls the upstream API when absolutely necessary.
 *
 * | Scenario                    | Behaviour                                |
 * |-----------------------------|------------------------------------------|
 * | data ≤ freshTtl old         | Return cache — **NO API call**           |
 * | data > freshTtl but ≤ staleTtl | Return cache + **background refresh**  |
 * | no data / data > staleTtl   | Fetch fresh — **blocking API call**      |
 *
 * @param kv        - KV namespace to read/write cached entries
 * @param key       - Cache key
 * @param fetchFn   - Async function that fetches fresh data from upstream
 * @param staleTtl  - Max acceptable age (seconds). **Required.**
 * @param freshTtl  - Age below which data is considered fresh. Defaults to `staleTtl * 0.5`.
 * @returns `{ data: T, fromCache: 'fresh' | 'stale' | 'miss' }`
 */
export async function conditionalFetch<T>(
  kv: KVNamespace,
  key: string,
  fetchFn: () => Promise<T>,
  staleTtl: number,
  freshTtl?: number,
): Promise<{ data: T; fromCache: 'fresh' | 'stale' | 'miss' }> {
  const effectiveFreshTtl = freshTtl ?? Math.floor(staleTtl * 0.5);
  const now = Date.now();

  // ---- attempt to read the cached, timestamped entry ----
  try {
    const raw = await kv.get(key, 'json');
    if (raw !== null) {
      const entry = raw as TimestampedCacheEntry<T>;
      const ageSec = (now - entry.ts) / 1000;

      if (ageSec <= effectiveFreshTtl) {
        // ✅ FRESH — serve from cache, zero API cost
        return { data: entry.data, fromCache: 'fresh' };
      }

      if (ageSec <= staleTtl) {
        // ⚠️  STALE but usable — serve immediately, refresh in background
        deduplicateRequest(kv, key, fetchFn, 10).then(async ({ result }) => {
          if (result !== null) {
            try {
              await kv.put(
                key,
                JSON.stringify({ data: result, ts: Date.now() } satisfies TimestampedCacheEntry<T>),
                { expirationTtl: staleTtl },
              );
            } catch {
              // Background refresh write failed — non-critical
            }
          }
        }).catch(() => {}); // fire-and-forget

        return { data: entry.data, fromCache: 'stale' };
      }

      // Beyond staleTtl — fall through to fresh fetch below
    }
  } catch {
    // KV read error — treat as cache miss
  }

  // ❌ CACHE MISS / EXPIRED — must fetch fresh (deduped)
  const { result } = await deduplicateRequest(kv, key, fetchFn, 10);
  if (result !== null) {
    try {
      await kv.put(
        key,
        JSON.stringify({ data: result, ts: Date.now() } satisfies TimestampedCacheEntry<T>),
        { expirationTtl: staleTtl },
      );
    } catch {
      // Best-effort cache write
    }
    return { data: result, fromCache: 'miss' };
  }

  throw new Error(`conditionalFetch: upstream fetch returned null for key "${key}"`);
}
