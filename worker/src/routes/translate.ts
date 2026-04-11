/**
 * NychIQ Worker — Translation Routes
 * Primary: Gemini Flash → MyMemory API → LibreTranslate
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { rotateKey } from '../lib/fallback';
import { geminiChat } from '../lib/fallback';

export const translateRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/translate — Translate text
 * Body: { text: string, from: string, to: string }
 * Returns: { translatedText: string, source: string }
 */
translateRoutes.post('/translate', async (c) => {
  try {
    const { text, from, to } = await c.req.json<{ text?: string; from?: string; to?: string }>();

    if (!text || !to) {
      return c.json({ error: 'text and "to" language are required' }, 400);
    }
    if (text.length > 10000) {
      return c.json({ error: 'Text exceeds maximum length of 10,000 characters' }, 400);
    }

    const fromLang = from || 'auto';

    // 1. Gemini Flash (prompt-based translation)
    try {
      const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3, c.env.GEMINI_KEY_4]);
      if (key) {
        const messages = [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text from "${fromLang}" to "${to}". Return ONLY the translated text, no explanations or quotes.`,
          },
          { role: 'user', content: text },
        ];
        const res = await geminiChat(key, messages);
        if (res.ok) {
          const data: any = await res.json();
          const translated = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (translated) {
            return c.json({ translatedText: translated, source: 'gemini' });
          }
        }
      }
    } catch (err: any) {
      console.error('Gemini translate error:', err?.message);
    }

    // 2. MyMemory API (no key needed, 1k/day)
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${to}`
      );
      if (res.ok) {
        const data: any = await res.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          return c.json({ translatedText: data.responseData.translatedText, source: 'mymemory' });
        }
      }
    } catch (err: any) {
      console.error('MyMemory error:', err?.message);
    }

    // 3. LibreTranslate (free public instance)
    try {
      const res = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: fromLang, target: to, format: 'text' }),
      });
      if (res.ok) {
        const data: any = await res.json();
        if (data.translatedText) {
          return c.json({ translatedText: data.translatedText, source: 'libretranslate' });
        }
      }
    } catch (err: any) {
      console.error('LibreTranslate error:', err?.message);
    }

    return c.json({ error: 'All translation providers failed' }, 500);
  } catch (err: any) {
    console.error('Translate error:', err?.message);
    return c.json({ error: err?.message || 'Translation failed' }, 500);
  }
});
