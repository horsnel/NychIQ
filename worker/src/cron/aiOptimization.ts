/**
 * NychIQ Cron — AI Optimization
 * Runs at 18:00 daily: batch AI analysis of collected data.
 * Generates title suggestions, hook scores, sentiment analysis,
 * content classification, and engagement predictions.
 */

import type { Env } from '../lib/env';

export async function aiOptimization(env: Env): Promise<void> {
  console.log('[Cron:AIOptimization] Starting batch AI analysis...');

  // 1. Get today's top scraped videos from D1
  let topVideos: any[] = [];
  try {
    const result = await env.DB.prepare(
      `SELECT sd.id, sd.video_id, sd.platform, sd.data, sd.scraped_at,
              COALESCE(json_extract(sd.data, '$.viewCount'), 0) as views
       FROM scraped_data sd
       WHERE sd.platform = 'youtube'
         AND sd.scraped_at > datetime('now', '-2 days')
         AND sd.video_id IS NOT NULL
       ORDER BY views DESC
       LIMIT 30`
    ).all();
    topVideos = result.results || [];
  } catch (err: any) {
    console.error('[Cron:AIOptimization] D1 query error:', err?.message);
    // Fallback: check KV for recent scraped data
    topVideos = await getFallbackVideos(env);
  }

  if (topVideos.length === 0) {
    console.log('[Cron:AIOptimization] No videos to analyze');
    return;
  }

  console.log(`[Cron:AIOptimization] Analyzing ${topVideos.length} top videos`);

  // 2. Get an AI key (try Groq first for speed)
  const aiKey = env.GROQ_KEY_1 || env.GEMINI_KEY_1 || env.CEREBRAS_KEY_1;
  if (!aiKey) {
    console.error('[Cron:AIOptimization] No AI key available');
    return;
  }

  const aiProvider = env.GROQ_KEY_1 ? 'groq' : env.GEMINI_KEY_1 ? 'gemini' : 'cerebras';

  // 3. Process videos in batches of 5 (token efficiency)
  const batchSize = 5;
  let analyzedCount = 0;

  for (let i = 0; i < topVideos.length; i += batchSize) {
    const batch = topVideos.slice(i, i + batchSize);

    const batchPrompt = buildAnalysisPrompt(batch);

    try {
      const analysis = await callAI(env, aiKey, aiProvider, batchPrompt);

      if (analysis) {
        // Cache the analysis results
        for (const video of batch) {
          const videoAnalysis = extractVideoAnalysis(analysis, video.video_id);
          if (videoAnalysis) {
            await env.CACHE.put(
              `nychiq:analysis:${video.video_id}`,
              JSON.stringify({
                ...videoAnalysis,
                analyzedAt: new Date().toISOString(),
                provider: aiProvider,
              }),
              { expirationTtl: 172800 } // 48h
            );
            analyzedCount++;
          }
        }
      }
    } catch (err: any) {
      console.error(`[Cron:AIOptimization] AI analysis error (batch ${i / batchSize + 1}):`, err?.message);
    }

    // Rate limit: small delay between batches
    await new Promise(r => setTimeout(r, 2000));
  }

  // 4. Generate daily insights summary
  try {
    const summary = await generateDailySummary(env, aiKey, aiProvider, topVideos);
    if (summary) {
      await env.CACHE.put(
        `nychiq:cron:daily-insights:${new Date().toISOString().split('T')[0]}`,
        JSON.stringify(summary),
        { expirationTtl: 172800 }
      );
    }
  } catch (err: any) {
    console.error('[Cron:AIOptimization] Summary generation error:', err?.message);
  }

  console.log(`[Cron:AIOptimization] Completed: ${analyzedCount} videos analyzed`);
}

function buildAnalysisPrompt(videos: any[]): string {
  const videoList = videos.map((v: any, i: number) => {
    const data = typeof v.data === 'string' ? JSON.parse(v.data || '{}') : (v.data || {});
    return `${i + 1}. "${data.title || 'Unknown'}" by ${data.author || 'Unknown'} (${v.views || 0} views, ${data.likes || 0} likes)`;
  }).join('\n');

  return `You are NychIQ, an AI YouTube growth strategist. Analyze these videos and provide JSON output.

For each video, provide:
{
  "analyses": [
    {
      "videoId": "<id>",
      "hookScore": <0-100>,
      "titleSuggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
      "niche": "<primary niche>",
      "engagementPrediction": "<high/medium/low>",
      "topHashtags": ["<tag1>", "<tag2>", ...],
      "thumbnailCritique": "<1-sentence critique>",
      "competitorAdvantage": "<what makes this different>"
    }
  ]
}

Videos:
${videoList}

Respond with ONLY the JSON, no markdown.`;
}

function extractVideoAnalysis(analysis: any, videoId: string): any | null {
  try {
    const parsed = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
    const videoAnalysis = (parsed.analyses || []).find((a: any) => a.videoId === videoId);
    return videoAnalysis || (parsed.analyses || [])[0] || null;
  } catch {
    return null;
  }
}

async function callAI(env: Env, key: string, provider: string, prompt: string): Promise<any> {
  const endpoint = provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : provider === 'gemini'
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
    : 'https://api.cerebras.ai/v1/chat/completions';

  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30000),
  };

  if (provider === 'groq') {
    options.headers = { ...options.headers, 'Authorization': `Bearer ${key}` };
    options.body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });
  } else if (provider === 'gemini') {
    options.body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
    });
  } else {
    options.headers = { ...options.headers, 'Authorization': `Bearer ${key}` };
    options.body = JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });
  }

  const res = await fetch(endpoint, options);
  if (!res.ok) throw new Error(`AI API error: ${res.status}`);

  const data: any = await res.json();

  if (provider === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  return data.choices?.[0]?.message?.content || null;
}

async function generateDailySummary(env: Env, aiKey: string, aiProvider: string, videos: any[]): Promise<any> {
  const topTitles = videos.slice(0, 10).map((v: any) => {
    const data = typeof v.data === 'string' ? JSON.parse(v.data || '{}') : (v.data || {});
    return `"${data.title || 'Unknown'}" (${v.views || 0} views)`;
  }).join('\n');

  const prompt = `As NychIQ AI, provide a brief daily insights summary in JSON:
{
  "topTrends": ["<trend1>", "<trend2>", "<trend3>"],
  "hotNiches": ["<niche1>", "<niche2>", "<niche3>"],
  "bestPerformingHook": "<description>",
  "audienceInsight": "<1-2 sentence insight>",
  "tomorrowPrediction": "<1-2 sentence prediction>"
}

Based on today's top videos:
${topTitles}

Respond with ONLY JSON.`;

  const raw = await callAI(env, aiKey, aiProvider, prompt);
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return { raw, error: 'parse_failed' };
  }
}

async function getFallbackVideos(env: Env): Promise<any[]> {
  try {
    const cached = await env.CACHE.get('nychiq:cron:morning-trending', 'json');
    if (cached?.platforms?.youtube) {
      const allVideos = Object.values(cached.platforms.youtube).flat();
      return allVideos.slice(0, 30).map((v: any) => ({
        video_id: v.videoId,
        platform: 'youtube',
        data: JSON.stringify({ title: v.title, author: v.uploaderName }),
        views: v.views,
        scraped_at: cached.fetchedAt,
      }));
    }
  } catch { /* silent */ }
  return [];
}
