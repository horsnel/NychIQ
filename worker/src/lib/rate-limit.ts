/**
 * NychIQ Worker — Rate Limiting
 * Fallback: Upstash Redis → CloudFlare KV → in-memory (per-request)
 */

import type { Env } from './env';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  source: string;
}

const DEFAULT_LIMIT = 100;    // requests per window
const DEFAULT_WINDOW = 3600;  // seconds (1 hour)

/**
 * Check rate limit for a given identifier.
 * Tries Upstash Redis first, falls back to KV.
 */
export async function checkRateLimit(
  env: Env,
  identifier: string,
  limit: number = DEFAULT_LIMIT,
  windowSec: number = DEFAULT_WINDOW
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSec;
  const key = `ratelimit:${identifier}`;

  // 1. Upstash Redis (fastest, atomic INCR)
  try {
    if (env.UPSTASH_REDIS_URL && env.UPSTASH_REDIS_TOKEN) {
      const result = await upstashIncr(env.UPSTASH_REDIS_URL, env.UPSTASH_REDIS_TOKEN, key, windowSec);
      if (result !== null) {
        const remaining = Math.max(0, limit - result);
        return {
          allowed: result <= limit,
          remaining,
          limit,
          resetAt,
          source: 'upstash',
        };
      }
    }
  } catch (err: any) {
    console.error('Upstash rate limit error:', err?.message);
  }

  // 2. CloudFlare KV (eventually consistent but reliable)
  try {
    const raw = await env.CACHE.get(key, 'json') as { count: number; expiresAt: number } | null;
    if (raw && raw.expiresAt > now) {
      const newCount = raw.count + 1;
      await env.CACHE.put(key, JSON.stringify({ count: newCount, expiresAt: resetAt }), {
        expirationTtl: windowSec,
      });
      const remaining = Math.max(0, limit - newCount);
      return {
        allowed: newCount <= limit,
        remaining,
        limit,
        resetAt,
        source: 'kv',
      };
    } else {
      // New window
      await env.CACHE.put(key, JSON.stringify({ count: 1, expiresAt: resetAt }), {
        expirationTtl: windowSec,
      });
      return {
        allowed: true,
        remaining: limit - 1,
        limit,
        resetAt,
        source: 'kv',
      };
    }
  } catch (err: any) {
    console.error('KV rate limit error:', err?.message);
  }

  // 3. No backend available — allow all (fail-open)
  return {
    allowed: true,
    remaining: limit,
    limit,
    resetAt,
    source: 'none',
  };
}

/**
 * Atomic INCR via Upstash Redis REST API.
 * Returns the current count or null on failure.
 */
async function upstashIncr(
  url: string,
  token: string,
  key: string,
  ttlSec: number
): Promise<number | null> {
  // Pipeline: INCR + EXPIRE
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(ttlSec)],
    ]),
  });

  if (!res.ok) return null;

  const data: any = await res.json();
  // Pipeline returns array of results
  const count = Array.isArray(data) ? data[0]?.result : data?.result;
  return typeof count === 'number' ? count : null;
}

/**
 * Rate limit tiers by user plan.
 */
export const RATE_LIMITS: Record<string, { limit: number; window: number }> = {
  trial:  { limit: 50,   window: 3600 },
  starter: { limit: 200,  window: 3600 },
  pro:     { limit: 500,  window: 3600 },
  elite:   { limit: 2000, window: 3600 },
  agency:  { limit: 5000, window: 3600 },
};
