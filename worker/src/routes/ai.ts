/**
 * NychIQ Worker — AI Chat Routes
 * Fallback chain: Groq → Gemini Flash → Cerebras → Workers AI → Z.ai GLM-4 → Pollinations → OpenRouter
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { withFallback, openAIChat, geminiChat, getKeys, rotateKey } from '../lib/fallback';

const SAKU_SYSTEM_PROMPT = `You are Saku, the AI assistant for NychIQ — a YouTube Intelligence Platform. You help YouTube creators with:
- Content strategy and viral prediction
- SEO optimization (titles, descriptions, tags)
- Trend analysis and niche discovery
- Channel growth tips and monetization advice
- Competitor analysis insights
- Thumbnail and hook optimization

Be concise, actionable, and specific. Use data and examples when possible. Keep responses under 200 words unless asked for detailed analysis. Use a friendly, expert tone.`;

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
            c.env.GROQ_KEY_3, c.env.GROQ_KEY_4,
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
            c.env.GEMINI_KEY_3, c.env.GEMINI_KEY_4,
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
          const ai = (c.env as any).AI;
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

    // Try providers in order — return first successful stream
    const errors: Array<{ provider: string; error: string }> = [];

    // 1. Groq
    try {
      const key = rotateKey([c.env.GROQ_KEY_1, c.env.GROQ_KEY_2, c.env.GROQ_KEY_3, c.env.GROQ_KEY_4]);
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
      const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3, c.env.GEMINI_KEY_4]);
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
      const ai = (c.env as any).AI;
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
