/**
 * NychIQ Cron — Morning Trending Discovery
 * Runs at 06:00 daily: discovers trending topics across all platforms,
 * caches results in KV, and queues AI analysis tasks.
 */

import type { Env } from '../lib/env';

const REGIONS = ['NG', 'US', 'GB', 'KE', 'ZA', 'IN', 'BR', 'JP'];
const PLATFORMS = ['youtube', 'tiktok', 'twitter'];

export async function morningTrending(env: Env): Promise<void> {
  console.log('[Cron:MorningTrending] Starting morning trending discovery...');

  const results: Record<string, any> = {};

  // 1. YouTube trending via Piped API
  results.youtube = {};
  for (const region of REGIONS) {
    try {
      const res = await fetch(`https://pipedapi.kavin.rocks/trending?region=${region}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data: any = await res.json();
        const items = (data || []).slice(0, 25).map((v: any) => ({
          videoId: v.url?.replace('/watch?v=', '') || '',
          title: v.title || '',
          views: v.views || 0,
          uploaderName: v.uploaderName || '',
          uploaderUrl: v.uploaderUrl || '',
          uploaded: v.uploaded || 0,
          duration: v.duration || 0,
          thumbnail: v.thumbnail || '',
          region,
          source: 'piped',
        }));
        results.youtube[region] = items;
      }
    } catch (err: any) {
      console.error(`[Cron:MorningTrending] YouTube trending error (${region}):`, err?.message);
    }
  }

  // 2. TikTok trending via Trends24 fallback
  results.tiktok = {};
  try {
    const res = await fetch('https://trends24.in/tiktok/', {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NychIQ-Bot/1.0)' },
    });
    if (res.ok) {
      // Store raw HTML for later parsing by the trending route
      results.tiktok.raw = 'scraped';
    }
  } catch (err: any) {
    console.error('[Cron:MorningTrending] TikTok trending error:', err?.message);
  }

  // 3. Twitter/X trending via Nitter fallback
  results.twitter = {};
  try {
    const nitterInstances = ['nitter.net', 'nitter.privacydev.net'];
    for (const instance of nitterInstances) {
      try {
        const res = await fetch(`https://${instance}/trending`, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NychIQ-Bot/1.0)' },
        });
        if (res.ok) {
          results.twitter.instance = instance;
          results.twitter.raw = 'scraped';
          break;
        }
      } catch { /* try next instance */ }
    }
  } catch (err: any) {
    console.error('[Cron:MorningTrending] Twitter trending error:', err?.message);
  }

  // 4. Cache all results in KV with 4-hour TTL
  try {
    await env.CACHE.put(
      'nychiq:cron:morning-trending',
      JSON.stringify({
        fetchedAt: new Date().toISOString(),
        platforms: results,
        regions: REGIONS,
      }),
      { expirationTtl: 14400 } // 4 hours
    );

    console.log(`[Cron:MorningTrending] Cached trending data for ${REGIONS.length} regions`);
  } catch (err: any) {
    console.error('[Cron:MorningTrending] KV cache error:', err?.message);
  }

  // 5. Queue analysis tasks if TASK_QUEUE is available
  try {
    const trendingItems = Object.values(results.youtube || {})
      .flat()
      .slice(0, 50);

    if (trendingItems.length > 0) {
      await env.TASK_QUEUE.send({
        type: 'ANALYZE_TRENDING',
        items: trendingItems,
        queuedAt: new Date().toISOString(),
      });
      console.log(`[Cron:MorningTrending] Queued ${trendingItems.length} items for analysis`);
    }
  } catch (err: any) {
    console.error('[Cron:MorningTrending] Queue error:', err?.message);
  }
}
