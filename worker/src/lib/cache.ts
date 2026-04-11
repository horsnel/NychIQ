/**
 * NychIQ Worker — KV Cache utility
 * All external API responses are cached with configurable TTL.
 */

/** Cache TTL constants matching the platform spec */
export const CACHE_TTL = {
  TRENDING: 3600,      // 1 hour
  SEARCH: 1800,        // 30 minutes
  CHANNEL: 21600,      // 6 hours
  VIDEO_LIST: 7200,    // 2 hours
  AUDIT: 86400,        // 24 hours
  HASHTAG: 14400,      // 4 hours
  TRANSCRIPT: -1,      // permanent (never expires)
} as const;

/**
 * Get a cached value from KV.
 * Returns null on cache miss or deserialization error.
 */
export async function getCached<T>(kv: KVNamespace, key: string): Promise<T | null> {
  try {
    const raw = await kv.get(key, 'json');
    if (raw === null) return null;
    return raw as T;
  } catch {
    return null;
  }
}

/**
 * Store a value in KV with a TTL.
 * Pass ttlSeconds = -1 for permanent storage.
 */
export async function setCached(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    const expirationTtl = ttlSeconds > 0 ? ttlSeconds : undefined;
    await kv.put(key, JSON.stringify(value), {
      expirationTtl,
    });
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

/**
 * Build a cache key from route + params.
 */
export function cacheKey(route: string, params: Record<string, string>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const paramStr = sorted.map(([k, v]) => `${k}=${v}`).join('&');
  return `nychiq:${route}:${paramStr}`;
}
