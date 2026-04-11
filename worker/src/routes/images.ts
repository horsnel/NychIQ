/**
 * NychIQ Worker — Image Generation Routes
 * Primary: Pollinations AI (no key) → Workers AI SDXL → HuggingFace FLUX.1
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';

export const imageRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/images/generate — Generate image from text prompt
 * Params: prompt, size (default 1024x1024)
 * Returns: redirects to the generated image URL
 */
imageRoutes.get('/generate', async (c) => {
  const prompt = c.req.query('prompt') || '';
  const size = c.req.query('size') || '1024x1024';

  if (!prompt) return c.json({ error: 'prompt parameter is required' }, 400);

  // Validate size
  const validSizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'];
  const [w, h] = size.split('x').map(Number);
  const finalSize = validSizes.includes(size) ? size : '1024x1024';
  const [fw, fh] = finalSize.split('x').map(Number);

  // 1. Pollinations AI (no key needed — primary)
  try {
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${fw}&height=${fh}&nologo=true&seed=${Date.now()}`;
    const res = await fetch(pollinationsUrl);
    if (res.ok && res.headers.get('content-type')?.startsWith('image')) {
      return new Response(res.body, {
        headers: {
          'Content-Type': res.headers.get('content-type') || 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch (err: any) {
    console.error('Pollinations error:', err?.message);
  }

  // 2. Workers AI SDXL
  try {
    const ai = (c.env as any).AI;
    if (ai) {
      const response = await ai.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
        prompt,
        width: fw,
        height: fh,
      });
      if (response?.image) {
        return new Response(response.image, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }
  } catch (err: any) {
    console.error('Workers AI SDXL error:', err?.message);
  }

  // 3. HuggingFace FLUX.1
  try {
    const key = c.env.HF_TOKEN_1 || c.env.HF_TOKEN_2;
    if (key) {
      const res = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width: fw, height: fh },
        }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/png';
        return new Response(res.body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }
  } catch (err: any) {
    console.error('HuggingFace error:', err?.message);
  }

  return c.json({ error: 'All image generation providers failed' }, 500);
});
