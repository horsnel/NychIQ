/**
 * NychIQ Cron — Metadata Backfill
 * Runs at 09:00, 12:00, 15:00: bulk updates video/channel metadata
 * from extension-scraped data, backfills missing fields via APIs.
 */

import type { Env } from '../lib/env';

const BATCH_SIZE = 50;

export async function metadataBackfill(env: Env): Promise<void> {
  console.log('[Cron:MetadataBackfill] Starting metadata backfill...');

  // 1. Check for pending scraped items in D1
  let pendingItems: any[] = [];
  try {
    const result = await env.DB.prepare(
      `SELECT id, video_id, platform, data, scraped_at
       FROM scraped_data
       WHERE synced = 0 AND scraped_at > datetime('now', '-7 days')
       ORDER BY scraped_at DESC
       LIMIT ?`
    ).bind(BATCH_SIZE).all();
    pendingItems = result.results || [];
  } catch (err: any) {
    console.error('[Cron:MetadataBackfill] D1 query error:', err?.message);
    return;
  }

  if (pendingItems.length === 0) {
    console.log('[Cron:MetadataBackfill] No pending items to backfill');
    return;
  }

  console.log(`[Cron:MetadataBackfill] Processing ${pendingItems.length} pending items`);

  // 2. Group by platform
  const byPlatform: Record<string, any[]> = {};
  for (const item of pendingItems) {
    const platform = item.platform || 'unknown';
    if (!byPlatform[platform]) byPlatform[platform] = [];
    byPlatform[platform].push(item);
  }

  // 3. YouTube backfill: enrich with YouTube API data
  if (byPlatform.youtube?.length > 0 && env.YT_KEY_1) {
    await backfillYouTube(env, byPlatform.youtube);
  }

  // 4. Mark processed items as synced
  const ids = pendingItems.map((i: any) => i.id);
  try {
    if (ids.length > 0) {
      await env.DB.prepare(
        `UPDATE scraped_data SET synced = 1, synced_at = datetime('now') WHERE id IN (${ids.map(() => '?').join(',')})`
      ).bind(...ids).run();
    }
  } catch (err: any) {
    console.error('[Cron:MetadataBackfill] D1 update error:', err?.message);
  }

  // 5. Cache enriched data in KV
  try {
    const cacheKey = `nychiq:cron:backfill:${new Date().toISOString().split('T')[0]}`;
    await env.CACHE.put(cacheKey, JSON.stringify({
      processedAt: new Date().toISOString(),
      count: pendingItems.length,
      byPlatform: Object.fromEntries(
        Object.entries(byPlatform).map(([k, v]) => [k, v.length])
      ),
    }), { expirationTtl: 86400 }); // 24h
  } catch (err: any) {
    console.error('[Cron:MetadataBackfill] KV cache error:', err?.message);
  }

  console.log(`[Cron:MetadataBackfill] Completed: ${pendingItems.length} items processed`);
}

/**
 * Enrich YouTube scraped data with official API metadata.
 */
async function backfillYouTube(env: Env, items: any[]): Promise<void> {
  // Get unique video IDs
  const videoIds = [...new Set(items.map((i: any) => i.video_id).filter(Boolean))];
  if (videoIds.length === 0) return;

  // Batch fetch from YouTube API (max 50 per request)
  const key = env.YT_KEY_1;
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch.join(',')}&key=${key}`,
        { signal: AbortSignal.timeout(15000) }
      );
      if (res.ok) {
        const data: any = await res.json();
        const videos = data.items || [];

        // Cache each video's enriched data
        for (const video of videos) {
          await env.CACHE.put(
            `nychiq:video:${video.id}`,
            JSON.stringify({
              id: video.id,
              title: video.snippet?.title || '',
              description: video.snippet?.description || '',
              thumbnails: video.snippet?.thumbnails || {},
              channelTitle: video.snippet?.channelTitle || '',
              channelId: video.snippet?.channelId || '',
              publishedAt: video.snippet?.publishedAt || '',
              tags: video.snippet?.tags || [],
              categoryId: video.snippet?.categoryId || '',
              defaultAudioLanguage: video.snippet?.defaultAudioLanguage || '',
              statistics: video.statistics || {},
              contentDetails: video.contentDetails || {},
              enrichedAt: new Date().toISOString(),
              source: 'youtube-api',
            }),
            { expirationTtl: 86400 } // 24h
          );
        }

        console.log(`[Cron:MetadataBackfill] Enriched ${videos.length} YouTube videos`);
      }
    } catch (err: any) {
      console.error('[Cron:MetadataBackfill] YouTube API error:', err?.message);
    }
  }
}
