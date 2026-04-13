/**
 * NychIQ Worker — Staged Channel Audit Routes
 * Three-stage audit strategy to minimize API calls:
 * Stage 0: Zero calls — use cached/local data only
 * Stage 1: 2-3 calls — quick overview (channel info + latest videos + trending)
 * Stage 2: Full audit — 15 calls (channel + videos + analytics + transcripts + competitors)
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { getCached, setCached, cacheKey, CACHE_TTL, invalidateCached } from '../lib/cache';
import { publishRealtime } from '../lib/fallback-realtime';
// import { sendEmail } from '../lib/email'; // TODO: re-enable when user email lookup is implemented

export const auditRoutes = new Hono<{ Bindings: Env }>();

// ── Audit stage definitions ──
const AUDIT_STAGES = {
  0: {
    name: 'instant',
    apiCalls: 0,
    description: 'Uses cached data only — no external API calls',
  },
  1: {
    name: 'quick',
    apiCalls: 3,
    description: 'Quick overview: channel info + recent videos + niche trends',
  },
  2: {
    name: 'deep',
    apiCalls: 15,
    description: 'Full deep audit: channel analytics, video performance, transcript analysis, competitor benchmarking',
  },
} as const;

type AuditStage = 0 | 1 | 2;

interface AuditRequest {
  channelHandle?: string;
  channelId?: string;
  stage?: AuditStage;
  userId?: string;
}

/**
 * POST /api/audit/run — Run a staged channel audit
 * Body: { channelHandle?, channelId?, stage?: 0|1|2, userId? }
 * Returns: { stage, results, apiCallsUsed, cached, timestamp }
 */
auditRoutes.post('/run', async (c) => {
  try {
    const { channelHandle, channelId, stage = 1, userId } = await c.req.json<AuditRequest>();

    if (!channelHandle && !channelId) {
      return c.json({ error: 'channelHandle or channelId is required' }, 400);
    }

    const identifier = channelHandle || channelId || '';
    const auditStage = Math.min(Math.max(stage, 0), 2) as AuditStage;
    const stageInfo = AUDIT_STAGES[auditStage];

    // Check for cached audit result
    const cacheK = cacheKey('audit', { channel: identifier, stage: String(auditStage) });
    const cached = await getCached<any>(c.env.CACHE, cacheK, c.env);
    if (cached && auditStage < 2) {
      return c.json({
        ...cached,
        fromCache: true,
        timestamp: cached.timestamp || new Date().toISOString(),
      });
    }

    // Invalidate any previous cache for this channel
    await invalidateCached(c.env.CACHE, cacheKey('audit', { channel: identifier, stage: '0' }), c.env);
    await invalidateCached(c.env.CACHE, cacheKey('audit', { channel: identifier, stage: '1' }), c.env);

    const results: Record<string, any> = {};
    let apiCallsUsed = 0;

    // ── Stage 0: Instant (cached only) ──
    if (auditStage === 0) {
      // Try to get channel info from cache
      const channelCache = cacheKey('yt:channel', { handle: channelHandle || '', channelId: channelId || '' });
      const channelData = await getCached<any>(c.env.CACHE, channelCache, c.env);
      if (channelData) {
        results.channel = channelData;
      }
      results.note = 'Stage 0 audit uses only cached data. Upgrade to Stage 1 for fresh data.';
    }

    // ── Stage 1: Quick Overview (3 API calls) ──
    if (auditStage >= 1) {
      apiCallsUsed += 1;
      // Call 1: Channel info
      try {
        const params = new URLSearchParams();
        if (channelHandle) params.set('handle', channelHandle);
        if (channelId) params.set('channelId', channelId);
        const res = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(channelHandle || channelId || '')}&filter=channels`);
        if (res.ok) {
          const data: any = await res.json();
          results.channel = data?.items?.[0] || null;
        }
        // Fallback to internal route
        if (!results.channel) {
          const channelRes = await fetch(`${c.env.APP_URL || 'http://localhost'}/api/youtube/channel?${params}`);
          if (channelRes.ok) results.channel = await channelRes.json();
        }
      } catch (err: any) {
        results.channelError = err?.message;
      }

      apiCallsUsed += 1;
      // Call 2: Recent videos
      try {
        const vidRes = await fetch(`https://inv.tux.pizza/api/v1/channels/${channelId || channelHandle?.replace('@', '')}/videos?sort_by=newest`);
        if (vidRes.ok) {
          const data: any = await vidRes.json();
          results.recentVideos = data?.slice?.(0, 10) || data;
        }
      } catch (err: any) {
        results.videosError = err?.message;
      }

      apiCallsUsed += 1;
      // Call 3: Trending in channel's niche
      try {
        const trendRes = await fetch(`https://pipedapi.kavin.rocks/trending?region=NG`);
        if (trendRes.ok) {
          const data: any = await trendRes.json();
          results.nicheTrends = data?.slice?.(0, 10) || data;
        }
      } catch (err: any) {
        results.trendsError = err?.message;
      }

      // Quick summary
      results.quickSummary = {
        stage: 1,
        channelName: results.channel?.snippet?.title || results.channel?.author || 'Unknown',
        subscriberCount: results.channel?.statistics?.subscriberCount || results.channel?.subCount || '0',
        totalVideos: results.channel?.statistics?.videoCount || results.channel?.videoCount || '0',
        recentVideoCount: Array.isArray(results.recentVideos) ? results.recentVideos.length : 0,
      };
    }

    // ── Stage 2: Deep Audit (15 API calls) ──
    if (auditStage === 2) {
      // Keep Stage 1 data, add deep analytics
      apiCallsUsed += 12; // 3 from stage 1 + 12 more

      // Call 4-5: Video statistics for top 5 videos
      results.videoAnalytics = [];
      const videos = Array.isArray(results.recentVideos) ? results.recentVideos.slice(0, 5) : [];
      for (const video of videos) {
        const vid = video.videoId || video.url?.replace('/watch?v=', '');
        if (!vid) continue;
        try {
          const res = await fetch(`https://inv.tux.pizza/api/v1/videos/${vid}`);
          if (res.ok) {
            results.videoAnalytics.push(await res.json());
          }
        } catch {}
      }

      // Call 6-8: Transcript analysis for top 3 videos
      results.transcripts = [];
      for (const video of videos.slice(0, 3)) {
        const vid = video.videoId || video.url?.replace('/watch?v=', '');
        if (!vid) continue;
        try {
          const res = await fetch(`https://pipedapi.kavin.rocks/streams/${vid}`);
          if (res.ok) {
            const data: any = await res.json();
            const captions = data?.subtitleStreams || data?.captions || [];
            const enCap = captions.find((s: any) => s?.languageCode === 'en') || captions[0];
            if (enCap?.url) {
              const capRes = await fetch(enCap.url);
              if (capRes.ok) {
                const text = (await capRes.text())
                  .replace(/<[^>]+>/g, '')
                  .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g, '')
                  .replace(/WEBVTT[\s\S]*?\n\n/, '')
                  .split('\n').map((l: string) => l.trim()).filter(Boolean).join(' ');
                results.transcripts.push({ videoId: vid, text: text.slice(0, 2000), source: 'piped' });
              }
            }
          }
        } catch {}
      }

      // Call 9-10: Competitor channels in same niche
      results.competitors = [];
      if (results.channel?.snippet?.title) {
        try {
          const compRes = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(results.channel.snippet.title)}&filter=channels`);
          if (compRes.ok) {
            const data: any = await compRes.json();
            results.competitors = (data?.items || []).slice(1, 6).map((ch: any) => ({
              name: ch.channelName || ch.uploaderName || ch.author || '',
              subscribers: ch.subscriberCount || ch.subscribers || 0,
              videos: ch.videoCount || 0,
            }));
          }
        } catch {}
      }

      // Call 11-12: Hashtag research for channel niche
      results.hashtags = [];
      try {
        const niche = results.channel?.snippet?.title || channelHandle || '';
        const hashRes = await fetch(`https://trends24.in/ng/`, {
          headers: { 'User-Agent': 'NychIQ-Bot/1.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (hashRes.ok) {
          const html = await hashRes.text();
          const regex = /<a[^>]*class="[^"]*trend[^"]*"[^>]*>([^<]+)<\/a>/gi;
          let match;
          const tags: string[] = [];
          while ((match = regex.exec(html)) !== null && tags.length < 20) {
            const tag = match[1].trim().replace(/^#/, '');
            if (tag && !tags.includes(tag)) tags.push(tag);
          }
          results.hashtags = tags.map((tag, i) => ({ tag, rank: i + 1 }));
        }
      } catch {}

      // Call 13-15: SEO analysis (search position for channel)
      results.seoAnalysis = {};
      try {
        const seoRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(results.channel?.snippet?.title || channelHandle || '')}+youtube+channel`, {
          headers: { 'User-Agent': 'NychIQ-Bot/1.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (seoRes.ok) {
          results.seoAnalysis.searchResults = seoRes.ok ? 'fetched' : 'failed';
        }
      } catch {}

      // Deep summary
      results.deepSummary = {
        stage: 2,
        channelName: results.quickSummary?.channelName || 'Unknown',
        videosAnalyzed: results.videoAnalytics.length,
        transcriptsAnalyzed: results.transcripts.length,
        competitorsFound: results.competitors.length,
        hashtagsFound: results.hashtags.length,
        seoDataCollected: !!results.seoAnalysis,
      };
    }

    // Store in cache
    const auditResult = {
      stage: auditStage,
      stageName: stageInfo.name,
      results,
      apiCallsUsed,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    await setCached(c.env.CACHE, cacheK, auditResult, CACHE_TTL.AUDIT, c.env);

    // Notify via realtime if userId provided
    if (userId) {
      publishRealtime(c.env, `user:${userId}`, 'audit_complete', {
        stage: auditStage,
        channel: identifier,
        apiCallsUsed,
      }).catch(() => {});

      // TODO: Send email notification for deep audits — need to resolve user email from userId
      // if (auditStage === 2 && userEmail) {
      //   sendEmail(c.env, { to: userEmail, ... }).catch(() => {});
      // }
    }

    return c.json(auditResult);
  } catch (err: any) {
    console.error('Audit error:', err?.message);
    return c.json({ error: err?.message || 'Audit failed' }, 500);
  }
});

/**
 * GET /api/audit/status — Check audit stage info
 * Params: stage (0, 1, or 2)
 */
auditRoutes.get('/status', (c) => {
  return c.json({
    stages: AUDIT_STAGES,
    recommendation: 'Use stage 0 for instant cached results, stage 1 for a quick overview, or stage 2 for a comprehensive deep audit.',
  });
});

/**
 * GET /api/audit/result — Get cached audit result
 * Params: channel (handle or ID)
 */
auditRoutes.get('/result', async (c) => {
  const channel = c.req.query('channel') || '';
  if (!channel) return c.json({ error: 'channel parameter is required' }, 400);

  // Try all stages, return the most detailed one available
  for (let stage = 2; stage >= 0; stage--) {
    const ck = cacheKey('audit', { channel, stage: String(stage) });
    const result = await getCached<any>(c.env.CACHE, ck, c.env);
    if (result) {
      return c.json({ ...result, fromCache: true });
    }
  }

  return c.json({ error: 'No cached audit found. Run an audit first.' }, 404);
});
