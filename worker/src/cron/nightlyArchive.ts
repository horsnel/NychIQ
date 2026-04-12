/**
 * NychIQ Cron — Nightly Archive
 * Runs at 01:00 daily: compresses old data, cleans up expired cache,
 * archives analytics, generates daily report stats.
 */

import type { Env } from '../lib/env';

export async function nightlyArchive(env: Env): Promise<void> {
  console.log('[Cron:NightlyArchive] Starting nightly archive process...');

  const stats = {
    d1RowsArchived: 0,
    d1RowsDeleted: 0,
    kvKeysPruned: 0,
    r2ObjectsArchived: 0,
  };

  // 1. Archive old scraped_data rows (older than 30 days)
  try {
    // Move rows older than 30 days to an archive table
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS scraped_data_archive (
        LIKE scraped_data
      );
    `);

    const archiveResult = await env.DB.prepare(`
      INSERT INTO scraped_data_archive
      SELECT * FROM scraped_data
      WHERE scraped_at < datetime('now', '-30 days')
      AND synced = 1
    `).run();
    stats.d1RowsArchived = archiveResult.meta.changes || 0;

    // Delete archived rows from main table
    if (stats.d1RowsArchived > 0) {
      const deleteResult = await env.DB.prepare(`
        DELETE FROM scraped_data
        WHERE scraped_at < datetime('now', '-30 days')
        AND synced = 1
      `).run();
      stats.d1RowsDeleted = deleteResult.meta.changes || 0;
    }

    console.log(`[Cron:NightlyArchive] D1: archived ${stats.d1RowsArchived}, deleted ${stats.d1RowsDeleted}`);
  } catch (err: any) {
    console.error('[Cron:NightlyArchive] D1 archive error:', err?.message);
  }

  // 2. Clean up old analysis results in D1
  try {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS analysis_archive (
        LIKE analysis_results
      );
    `);

    await env.DB.prepare(`
      INSERT INTO analysis_archive
      SELECT * FROM analysis_results
      WHERE created_at < datetime('now', '-30 days')
    `).run();

    await env.DB.prepare(`
      DELETE FROM analysis_results
      WHERE created_at < datetime('now', '-30 days')
    `).run();
  } catch (err: any) {
    console.error('[Cron:NightlyArchive] Analysis archive error:', err?.message);
  }

  // 3. Prune expired KV cache entries
  try {
    // List KV keys with prefix and delete expired ones
    // CloudFlare KV doesn't support listing by prefix in Workers,
    // so we track cache keys in a separate list
    const cacheIndex = await env.CACHE.get('nychiq:cache-index', 'json');
    if (cacheIndex && Array.isArray(cacheIndex.keys)) {
      const now = Date.now();
      const validKeys: string[] = [];
      const expiredKeys: string[] = [];

      for (const entry of cacheIndex.keys) {
        if (now - entry.ts > 172800000) { // 48 hours
          expiredKeys.push(entry.key);
        } else {
          validKeys.push(entry.key);
        }
      }

      // Delete expired keys (in batches to avoid timeout)
      const batchSize = 50;
      for (let i = 0; i < expiredKeys.length; i += batchSize) {
        const batch = expiredKeys.slice(i, i + batchSize);
        await Promise.all(batch.map(key => env.CACHE.delete(key)));
        stats.kvKeysPruned += batch.length;
      }

      // Update cache index
      await env.CACHE.put('nychiq:cache-index', JSON.stringify({ keys: validKeys }), {
        expirationTtl: 86400 * 7, // 7 days
      });

      console.log(`[Cron:NightlyArchive] KV: pruned ${stats.kvKeysPruned} expired keys`);
    }
  } catch (err: any) {
    console.error('[Cron:NightlyArchive] KV prune error:', err?.message);
  }

  // 4. Generate daily stats report and cache it
  try {
    const dailyStats = await env.DB.prepare(`
      SELECT
        platform,
        COUNT(*) as total_scraped,
        SUM(CASE WHEN synced = 1 THEN 1 ELSE 0 END) as synced,
        SUM(CASE WHEN synced = 0 THEN 1 ELSE 0 END) as pending,
        MAX(scraped_at) as latest_scrape
      FROM scraped_data
      WHERE scraped_at > datetime('now', '-1 day')
      GROUP BY platform
    `).all();

    const totalUsers = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();

    const report = {
      generatedAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      archiveStats: stats,
      platformBreakdown: dailyStats.results || [],
      totalUsers: totalUsers?.count || 0,
    };

    await env.CACHE.put(
      `nychiq:reports:daily:${new Date().toISOString().split('T')[0]}`,
      JSON.stringify(report),
      { expirationTtl: 604800 } // 7 days
    );

    console.log(`[Cron:NightlyArchive] Daily report generated`);
  } catch (err: any) {
    console.error('[Cron:NightlyArchive] Report generation error:', err?.message);
  }

  // 5. Vacuum D1 database (optimize storage)
  try {
    await env.DB.prepare('VACUUM').run();
    console.log('[Cron:NightlyArchive] D1 VACUUM completed');
  } catch (err: any) {
    console.error('[Cron:NightlyArchive] VACUUM error:', err?.message);
  }

  console.log(`[Cron:NightlyArchive] Completed — archive: ${stats.d1RowsArchived}, deleted: ${stats.d1RowsDeleted}, pruned: ${stats.kvKeysPruned}`);
}
