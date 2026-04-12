/**
 * NychIQ Worker — Vision / Image Understanding Routes
 * Fallback: Gemini Flash Vision → Workers AI LLaVA → Z.ai GLM-4V → OpenRouter vision
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { rotateKey } from '../lib/fallback';

export const visionRoutes = new Hono<{ Bindings: Env }>();

interface VisionRequest {
  imageUrl?: string;
  imageBase64?: string;
  prompt?: string;
}

/**
 * POST /api/vision/analyze — Analyze an image
 * Body: { imageUrl?: string, imageBase64?: string, prompt?: string }
 * Returns: { text: string, source: string }
 */
visionRoutes.post('/analyze', async (c) => {
  try {
    const { imageUrl, imageBase64, prompt } = await c.req.json<VisionRequest>();

    if (!imageUrl && !imageBase64) {
      return c.json({ error: 'imageUrl or imageBase64 is required' }, 400);
    }

    const queryPrompt = prompt || 'Describe this image in detail. Focus on visual elements, text content, and any notable features.';
    const mimeType = imageBase64?.startsWith('/9j/') ? 'image/jpeg'
      : imageBase64?.startsWith('iVBOR') ? 'image/png'
      : imageBase64?.startsWith('R0lGOD') ? 'image/gif'
      : imageBase64?.startsWith('UklGR') ? 'image/webp'
      : 'image/jpeg';

    // 1. Gemini Flash Vision
    try {
      const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3, c.env.GEMINI_KEY_4]);
      if (key) {
        const parts: any[] = [{ text: queryPrompt }];
        if (imageBase64) {
          parts.unshift({ inline_data: { mime_type: mimeType, data: imageBase64 } });
        } else if (imageUrl) {
          parts.unshift({ file_data: { mime_type: 'image/jpeg', file_uri: imageUrl } });
        }
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
          }
        );
        if (res.ok) {
          const data: any = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return c.json({ text, source: 'gemini' });
        }
      }
    } catch (err: any) {
      console.error('Gemini Vision error:', err?.message);
    }

    // 2. Workers AI LLaVA (free, built-in)
    try {
      const ai = c.env.AI;
      if (ai && imageUrl) {
        // Fetch image and convert to array buffer for Workers AI
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
        if (imgRes.ok) {
          const imageBuffer: ArrayBuffer = await imgRes.arrayBuffer();
          const res = await ai.run('@cf/llava-hf/llava-1.5-7b-hf', {
            image: Array.from(new Uint8Array(imageBuffer)),
            prompt: queryPrompt,
            max_tokens: 256,
          });
          const text = (res as any)?.description || (res as any)?.response || '';
          if (text) return c.json({ text, source: 'workers-ai' });
        }
      } else if (ai && imageBase64) {
        const binaryString = atob(imageBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const res = await ai.run('@cf/llava-hf/llava-1.5-7b-hf', {
          image: Array.from(bytes),
          prompt: queryPrompt,
          max_tokens: 256,
        });
        const text = (res as any)?.description || (res as any)?.response || '';
        if (text) return c.json({ text, source: 'workers-ai' });
      }
    } catch (err: any) {
      console.error('Workers AI LLaVA error:', err?.message);
    }

    // 3. Z.ai GLM-4V
    try {
      const key = rotateKey([c.env.ZAI_KEY_1, c.env.ZAI_KEY_2]);
      if (key) {
        const imageContent = imageBase64 || imageUrl || '';
        const body: any = {
          model: 'glm-4v',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: imageBase64 ? `data:${mimeType};base64,${imageBase64}` : imageUrl } },
                { type: 'text', text: queryPrompt },
              ],
            },
          ],
        };
        const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data: any = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return c.json({ text, source: 'zai' });
        }
      }
    } catch (err: any) {
      console.error('Z.ai GLM-4V error:', err?.message);
    }

    // 4. OpenRouter free vision models (LLaVA, Idefics)
    try {
      const key = rotateKey([c.env.OPENROUTER_KEY_1, c.env.OPENROUTER_KEY_2]);
      if (key) {
        const imageContent = imageBase64 ? `data:${mimeType};base64,${imageBase64}` : imageUrl;
        const body = {
          model: 'openai/clip-vision-large-patch14-336',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: imageContent } },
                { type: 'text', text: queryPrompt },
              ],
            },
          ],
        };
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data: any = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return c.json({ text, source: 'openrouter' });
        }
      }
    } catch (err: any) {
      console.error('OpenRouter vision error:', err?.message);
    }

    return c.json({ error: 'All vision providers failed' }, 500);
  } catch (err: any) {
    console.error('Vision error:', err?.message);
    return c.json({ error: err?.message || 'Vision analysis failed' }, 500);
  }
});
