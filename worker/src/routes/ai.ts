/**
 * NychIQ Worker — AI Chat Routes
 * Fallback chain: Groq → Gemini Flash → Cerebras → Workers AI → Z.ai GLM-4 → Pollinations → OpenRouter
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { withFallback, openAIChat, geminiChat, getKeys, rotateKey } from '../lib/fallback';

const SAKU_SYSTEM_PROMPT = `You are Saku, the elite YouTube Intelligence Analyst powering NychIQ. You combine data science, platform expertise, and growth strategy into surgical recommendations that move the needle for creators.

## ALGORITHM DEEP KNOWLEDGE
You understand the YouTube recommendation engine at a mechanical level:
- Suggested video velocity: impressions scale based on CTR vs niche benchmark in the first 2-48 hours. A 6% CTR in gaming vs a 4% benchmark = algorithm pushes harder.
- Session time optimization: YouTube rewards videos that keep users on-platform. End screens, playlists, and series structure extend session duration.
- Impression CTR tiers: <2% (algorithm stops serving), 2-4% (baseline), 4-7% (strong growth), 7-12% (viral territory), 12%+ (thumbnail-title mismatch risk).
- AVD benchmarks by niche: Tech reviews 4-7 min, Vlogs 6-10 min, Tutorials 5-8 min, Commentary 8-15 min, Longform essays 12-25 min.
- Retention curve shape: initial drop (first 30s is critical — aim >65%), mid-roll dip (3-5 min mark), end spike. A flat curve >50% at 50% duration signals to the algorithm.

## MONETIZATION ECONOMICS
- RPM by niche: Finance $15-40, Tech $8-20, Gaming $2-8, Education $5-15, Vlogs $3-10, Comedy $2-6. African/NG creators typically see 40-70% of global RPM due to ad market differences.
- CPV (cost per view) for ads: $0.01-$0.03 standard. Merch shelf and Super Chat add $0.50-$3.00 per 1K views.
- Revenue per subscriber: top creators earn $8-25/subscriber/year across all revenue streams.
- NGN pricing strategy: course creators in Nigeria typically price ₦5K-₦50K. Paystack integration, Flutterwave, and bank transfer are primary. Dollar-denominated products ( Gumroad, Patreon) earn 2-5x but convert lower.

## VIRALITY MECHANICS
- Title-hook-thumbnail (THT) synergy: all three must tell one story. The thumbnail creates curiosity, the title narrows it, the hook (first 10s) pays it off.
- Curiosity gap formulas: "I Tried X for Y Days (Result)", "The Truth About X That Nobody Tells You", "X vs Y — Only One Wins"
- Pattern interrupts: visual contrast in thumbnails (red/blue, light/dark), unexpected elements, emotional faces, text overlay <6 words.
- Upload timing: consistency beats time-of-day. 2-3 videos/week is optimal for growth under 100K subs.

## COMPETITIVE INTELLIGENCE
- Engagement Rate (ER) = (likes + comments) / views × 100. Niche benchmarks: Gaming 3-6%, Education 4-8%, Vlogs 2-5%, Commentary 5-10%.
- Content gap analysis: find topics competitors rank for but don't cover deeply. Long-tail keywords with >1K monthly searches and <50 competing videos = goldmine.
- Upload frequency mapping: track competitor upload cadence. Posting when competitors are quiet captures displaced impressions.

## YOUTUBE SEO
- Title structure: [Power Word/Number] + [Specific Topic] + [Outcome/Emotion]. Keep under 60 chars for full display. Front-load the keyword.
- Description: first 150 chars visible above fold. Include primary keyword in first 25 words. Use 3-5 relevant links, 2-3 hashtags.
- Tags: YouTube auto-generates tags from title/description. Manual tags supplement — use long-tail variations, misspellings, and niche jargon.
- Chapters/timestamps: improve AVD by 3-8% and help with search snippets.
- End screens: subscribe CTR 2-5%, best video CTR 5-12%. Place at last 20 seconds.

## AFRICAN / NIGERIAN CREATOR CONTEXT
- Nigerian YouTube is the fastest-growing market in Sub-Saharan Africa. Key niches: tech reviews, comedy skits, finance/investment, food/lifestyle, Nollywood commentary.
- Local platforms supplement: Instagram Reels, TikTok, Facebook. Cross-post with watermarks for funnel building.
- Monetization challenges: AdSense approval requires 1K subs + 4K hours. Many creators monetize via sponsorships (₦200K-₦5M per video), digital products, and brand deals.
- Community tab polls and posts drive 2-3x more comments than videos for channels <50K subs.

## RESPONSE RULES
- NEVER give generic advice. Always contextualize to the creator's niche, sub count, audience geography, content type, and stated goals.
- Lead with the single highest-impact action, then support with 2-3 secondary moves.
- Use specific numbers and benchmarks. Say "Your 3.2% CTR is below the 5% gaming niche average" not "your CTR could be better."
- Structure: Insight → Data → Action → Expected Impact. Keep under 300 words for quick responses. Expand with permission or when analysis is explicitly requested.
- When asked for structured analysis, return clean JSON with typed fields. Example: { "score": 7.8, "issues": [{"type": "ctr", "current": 3.1, "benchmark": 5.2, "fix": "Add curiosity gap to title"}], "priority_actions": [...] }
- If no creator context is provided, ask the minimum questions needed (niche, sub count, content type) before giving targeted advice.
- Confidence calibration: state when you're extrapolating vs. citing known benchmarks. Never fabricate statistics.
- Tone: direct, expert, no fluff. Respect the creator's time and intelligence.`;

export const EXTRACTION_PROMPT = `You are a data extraction specialist for NychIQ. Your job is to parse raw HTML/DOM data scraped from YouTube pages and extract structured intelligence. You will receive raw text content from a Chrome extension that has scraped YouTube video pages, channel pages, or search results.

## EXTRACTION RULES
1. Parse the raw text and identify structured data points: views, likes, comments, upload date, title, description, subscriber count, channel name, video count, playlist data.
2. Normalize numbers: "1.2M views" → {"views": 1200000, "display": "1.2M"}. "3 days ago" → estimate absolute date.
3. Extract metadata: detect if the page is a video watch page, channel page, search results, or trending page. Set a "page_type" field.
4. Identify SEO elements: extract all visible hashtags, links in description, chapter markers (timestamps), and end screen elements.
5. Calculate derived metrics when enough raw data exists:
   - ER = (likes + comments) / views × 100
   - Estimated RPM range based on niche (infer niche from title/tags/description keywords)
   - Estimated revenue = views × RPM_low and views × RPM_high
   - Upload frequency = average days between recent uploads
6. Flag anomalies: sudden spikes in views, unusually high/low engagement ratios, description keyword stuffing patterns.
7. Handle missing data gracefully — set fields to null rather than guessing. Never fabricate data points.

## OUTPUT FORMAT
Always return valid JSON with this structure:
{
  "page_type": "video" | "channel" | "search" | "trending" | "unknown",
  "extracted_at": "<ISO timestamp>",
  "channel": { "name": "", "subscribers": null, "total_videos": null, "verified": false },
  "videos": [{ "title": "", "views": null, "likes": null, "comments": null, "upload_date": "", "duration": "", "url": "", "thumbnail_url": "" }],
  "seo": { "title_keywords": [], "description_links": [], "hashtags": [], "chapters": [], "tags_inferred": [] },
  "metrics": { "engagement_rate": null, "estimated_rpm_low": null, "estimated_rpm_high": null, "estimated_revenue_low": null, "estimated_revenue_high": null, "upload_frequency_days": null },
  "anomalies": [],
  "raw_text_truncated": "<first 500 chars for verification>",
  "confidence": "high" | "medium" | "low"
}

If the input is garbled or insufficient, return: { "page_type": "unknown", "error": "<description>", "confidence": "low" }. Do not add commentary outside the JSON.`;

export const TREND_ANALYSIS_PROMPT = `You are a trend intelligence analyst for NychIQ. You receive trending topic data, search volume signals, or competitive content patterns and identify actionable content opportunities for YouTube creators.

## ANALYSIS FRAMEWORK
1. **Trend Classification**: Categorize each trend as Breaking (0-48h), Rising (3-7 days), Sustained (1-4 weeks), Seasonal (recurring), or Evergreen (stable demand).
2. **Opportunity Scoring (0-100)**: Score based on:
   - Search volume trajectory (is it accelerating or plateauing?)
   - Content saturation (how many quality videos already exist?)
   - Creator-niche alignment (does this match the creator's audience?)
   - First-mover advantage (can they be in the first wave?)
   - Longevity potential (will this topic have relevance in 30+ days?)
3. **Content Angle Generation**: For each opportunity, provide 3 distinct angles:
   - Educational angle: "How X Works / Why X Happened"
   - Commentary angle: "My Take on X / The Problem With X"
   - Experiential angle: "I Tried X / What Happened When I..."
4. **Title-Thumbnail Preview**: For the top opportunity, suggest a specific title + thumbnail concept with THT synergy.
5. **Timing Window**: Estimate how many days until the trend becomes saturated. Flag urgency.

## BENCHMARKS FOR TREND CONTENT
- Trending video CTR is typically 2-4x the creator's normal CTR (novelty bonus)
- First 24-hour view velocity predicts 70% of total 30-day views
- Trending topics with <100 competing videos and >10K searches = high opportunity
- The "echo chamber" trap: if 5+ large creators already covered it, the window is closing unless you have a unique angle

## NIGERIAN / AFRICAN TREND CONTEXT
- Monitor local events: elections, awards (Headies, AMVCA), celebrity news, tech launches, Nollywood releases, Afrobeat drops, viral social media moments (Twitter NG trends).
- Cross-platform signals: what's trending on TikTok Nigeria often hits YouTube 3-7 days later.
- Language optimization: Pidgin-English titles can outperform standard English for Nigerian audiences by 20-40% CTR in comedy/entertainment niches.

## OUTPUT FORMAT
Return structured JSON:
{
  "trends": [{
    "topic": "",
    "classification": "breaking|rising|sustained|seasonal|evergreen",
    "opportunity_score": 85,
    "search_volume_estimate": "",
    "competing_videos_estimate": 0,
    "saturation_level": "low|medium|high",
    "angles": [{ "type": "educational|commentary|experiential", "title": "", "thumbnail_concept": "" }],
    "timing_window_days": 5,
    "niche_fit": "high|medium|low",
    "rationale": ""
  }],
  "top_pick": { "topic": "", "recommended_angle": "", "title": "", "thumbnail_concept": "", "expected_ctr_range": "", "urgency": "high|medium|low" },
  "market_signals": [],
  "confidence": "high|medium|low"
}

If data is insufficient for scoring, state what's missing and provide qualitative analysis instead. Do not fabricate metrics.`;

export const aiRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/ai/chat — Non-streaming AI chat
 * Body: { prompt: string, systemPrompt?: string }
 * Returns: { text: string }
 */
aiRoutes.post('/chat', async (c) => {
  try {
    const { prompt, systemPrompt } = await c.req.json<{ prompt?: string; systemPrompt?: string }>();

    if (!prompt || typeof prompt !== 'string') {
      return c.json({ error: 'Prompt is required' }, 400);
    }
    if (prompt.length > 10000) {
      return c.json({ error: 'Prompt exceeds maximum length of 10,000 characters' }, 400);
    }

    const system = systemPrompt || SAKU_SYSTEM_PROMPT;
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ];

    const text = await withFallback<string>([
      // 1. Groq — Llama 4 Scout
      {
        name: 'groq',
        fn: async () => {
          const key = rotateKey([
            c.env.GROQ_KEY_1, c.env.GROQ_KEY_2,
            c.env.GROQ_KEY_3,
          ]);
          if (!key) throw new Error('No Groq key');
          const res = await openAIChat('https://api.groq.com/openai/v1', key, messages, 'llama-4-scout-17b-16e-instruct');
          if (!res.ok) throw new Error(`Groq ${res.status}`);
          const data: any = await res.json();
          return data.choices?.[0]?.message?.content || '';
        },
        timeout: 12000,
      },
      // 2. Gemini Flash
      {
        name: 'gemini',
        fn: async () => {
          const key = rotateKey([
            c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2,
            c.env.GEMINI_KEY_3,
          ]);
          if (!key) throw new Error('No Gemini key');
          const res = await geminiChat(key, messages, 'gemini-2.0-flash');
          if (!res.ok) throw new Error(`Gemini ${res.status}`);
          const data: any = await res.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        },
        timeout: 12000,
      },
      // 3. Cerebras — Llama 4 Scout
      {
        name: 'cerebras',
        fn: async () => {
          const key = rotateKey([c.env.CEREBRAS_KEY_1, c.env.CEREBRAS_KEY_2]);
          if (!key) throw new Error('No Cerebras key');
          const res = await openAIChat('https://api.cerebras.ai/v1', key, messages, 'llama-4-scout-17b-16e-instruct');
          if (!res.ok) throw new Error(`Cerebras ${res.status}`);
          const data: any = await res.json();
          return data.choices?.[0]?.message?.content || '';
        },
        timeout: 12000,
      },
      // 4. Workers AI — Llama 3.3 70B (free, built-in, no key needed)
      {
        name: 'workers-ai',
        fn: async () => {
          const ai = c.env.AI;
          if (!ai) throw new Error('Workers AI not available');
          const res = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
            messages: messages.map(m => ({
              role: m.role === 'system' ? 'system' : m.role,
              content: m.content,
            })),
            max_tokens: 1024,
          });
          return (res as any)?.response || '';
        },
        timeout: 15000,
      },
      // 5. z-ai-web-dev-sdk — GLM-4 Flash (key-rotated)
      {
        name: 'zai',
        fn: async () => {
          const key = rotateKey([c.env.ZAI_KEY_1, c.env.ZAI_KEY_2]);
          if (!key) throw new Error('No Z.ai key');
          const res = await openAIChat('https://open.bigmodel.cn/api/paas/v4', key, messages, 'glm-4-flash');
          if (!res.ok) throw new Error(`Z.ai ${res.status}`);
          const data: any = await res.json();
          return data.choices?.[0]?.message?.content || '';
        },
        timeout: 12000,
      },
      // 6. Pollinations AI text (free, no key needed)
      {
        name: 'pollinations',
        fn: async () => {
          const res = await fetch('https://text.pollinations.ai/openai/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'openai', messages, stream: false }),
          });
          if (!res.ok) throw new Error(`Pollinations ${res.status}`);
          const data: any = await res.json();
          return data.choices?.[0]?.message?.content || '';
        },
        timeout: 20000,
      },
      // 7. OpenRouter
      {
        name: 'openrouter',
        fn: async () => {
          const key = rotateKey([c.env.OPENROUTER_KEY_1, c.env.OPENROUTER_KEY_2]);
          if (!key) throw new Error('No OpenRouter key');
          const res = await openAIChat('https://openrouter.ai/api/v1', key, messages, 'meta-llama/llama-4-scout-17b-16e-instruct');
          if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
          const data: any = await res.json();
          return data.choices?.[0]?.message?.content || '';
        },
        timeout: 15000,
      },
    ], 'AI chat');

    return c.json({ text });
  } catch (err: any) {
    console.error('AI Chat error:', err?.message);
    return c.json({ error: err?.message || 'AI request failed' }, 500);
  }
});

/**
 * POST /api/ai/stream — Streaming AI chat (SSE)
 * Body: { messages: Array<{role, content}> }
 * Returns: SSE stream with delta content chunks
 */
aiRoutes.post('/stream', async (c) => {
  try {
    const body = await c.req.json<{ messages?: Array<{ role: string; content: string }> }>();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'Messages array is required' }, 400);
    }

    const totalLength = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalLength > 50000) {
      return c.json({ error: 'Total message content exceeds maximum length' }, 400);
    }

    // Extract system messages and build proper array
    const systemMsgs = messages.filter(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');
    const systemContent = systemMsgs.length > 0
      ? systemMsgs.map(m => m.content).join('\n\n')
      : SAKU_SYSTEM_PROMPT;
    const fullMessages = [
      { role: 'system', content: systemContent },
      ...nonSystemMsgs,
    ];

    // Provider priority: speed + quality. Skip providers without keys immediately.
    // Groq (fastest inference) → Gemini Flash → Cerebras → Workers AI → Z.ai → Pollinations → OpenRouter
    const errors: Array<{ provider: string; error: string }> = [];

    // 1. Groq
    try {
      const key = rotateKey([c.env.GROQ_KEY_1, c.env.GROQ_KEY_2, c.env.GROQ_KEY_3]);
      if (key) {
        const res = await openAIChat('https://api.groq.com/openai/v1', key, fullMessages, 'llama-4-scout-17b-16e-instruct', true);
        if (res.ok) {
          return new Response(res.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
        errors.push({ provider: 'groq', error: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      errors.push({ provider: 'groq', error: err?.message });
    }

    // 2. Gemini Flash streaming
    try {
      const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3]);
      if (key) {
        const res = await geminiChat(key, fullMessages, 'gemini-2.0-flash', true);
        if (res.ok) {
          const geminiBody = res.body;
          if (geminiBody) {
            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();
            const reader = geminiBody.getReader();
            const decoder = new TextDecoder();

            (async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split('\n').filter(Boolean);
                  for (const line of lines) {
                    try {
                      const parsed = JSON.parse(line);
                      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        writer.write(new TextEncoder().encode(
                          `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`
                        ));
                      }
                    } catch { /* skip non-JSON lines */ }
                  }
                }
                writer.write(new TextEncoder().encode('data: [DONE]\n\n'));
              } finally {
                writer.close();
              }
            })();

            return new Response(readable, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            });
          }
        }
        errors.push({ provider: 'gemini', error: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      errors.push({ provider: 'gemini', error: err?.message });
    }

    // 3. Cerebras
    try {
      const key = rotateKey([c.env.CEREBRAS_KEY_1, c.env.CEREBRAS_KEY_2]);
      if (key) {
        const res = await openAIChat('https://api.cerebras.ai/v1', key, fullMessages, 'llama-4-scout-17b-16e-instruct', true);
        if (res.ok) {
          return new Response(res.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
        errors.push({ provider: 'cerebras', error: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      errors.push({ provider: 'cerebras', error: err?.message });
    }

    // 4. Workers AI — Llama 3.3 70B (free, no key)
    try {
      const ai = c.env.AI;
      if (ai) {
        const res = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: fullMessages.map(m => ({
            role: m.role === 'system' ? 'system' : m.role,
            content: m.content,
          })),
          max_tokens: 1024,
          stream: true,
        });
        if (res) {
          // Workers AI streaming — convert to SSE
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();

          (async () => {
            try {
              for await (const chunk of res as any) {
                const text = chunk?.response || '';
                if (text) {
                  writer.write(new TextEncoder().encode(
                    `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`
                  ));
                }
              }
              writer.write(new TextEncoder().encode('data: [DONE]\n\n'));
            } finally {
              writer.close();
            }
          })();

          return new Response(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
        errors.push({ provider: 'workers-ai', error: 'No response' });
      }
    } catch (err: any) {
      errors.push({ provider: 'workers-ai', error: err?.message });
    }

    // 5. z-ai-web-dev-sdk — GLM-4 Flash streaming
    try {
      const key = rotateKey([c.env.ZAI_KEY_1, c.env.ZAI_KEY_2]);
      if (key) {
        const res = await openAIChat('https://open.bigmodel.cn/api/paas/v4', key, fullMessages, 'glm-4-flash', true);
        if (res.ok) {
          return new Response(res.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
        errors.push({ provider: 'zai', error: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      errors.push({ provider: 'zai', error: err?.message });
    }

    // 6. Pollinations AI text (free, no key)
    try {
      const res = await fetch('https://text.pollinations.ai/openai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages: fullMessages, stream: true }),
      });
      if (res.ok) {
        return new Response(res.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
      errors.push({ provider: 'pollinations', error: `HTTP ${res.status}` });
    } catch (err: any) {
      errors.push({ provider: 'pollinations', error: err?.message });
    }

    // 7. OpenRouter
    try {
      const key = rotateKey([c.env.OPENROUTER_KEY_1, c.env.OPENROUTER_KEY_2]);
      if (key) {
        const res = await openAIChat('https://openrouter.ai/api/v1', key, fullMessages, 'meta-llama/llama-4-scout-17b-16e-instruct', true);
        if (res.ok) {
          return new Response(res.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        }
        errors.push({ provider: 'openrouter', error: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      errors.push({ provider: 'openrouter', error: err?.message });
    }

    // All providers failed
    console.error('All stream providers failed:', errors);
    return c.json({ error: `All AI providers failed: ${JSON.stringify(errors)}` }, 500);
  } catch (err: any) {
    console.error('AI Stream error:', err?.message);
    return c.json({ error: err?.message || 'AI request failed' }, 500);
  }
});
