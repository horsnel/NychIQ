/**
 * NychIQ Worker — Social Media Scraping Routes
 * TikTok, Instagram, Twitter/X data via multiple providers with fallback chains.
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { rotateKey } from '../lib/fallback';
import { getCached, setCached, cacheKey } from '../lib/cache';

export const socialRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/social/tiktok/video — TikTok video data
 * Params: url (TikTok video URL)
 * Fallback: TikWM (free) → TikTok oEmbed (free) → SociaVault → EnsembleData → Tikhub
 */
socialRoutes.get('/tiktok/video', async (c) => {
  const url = c.req.query('url') || '';
  if (!url) return c.json({ error: 'url parameter is required' }, 400);

  const ck = cacheKey('social:tiktok', { url });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  // 1. TikWM (no key needed)
  try {
    const res = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data: any = await res.json();
      if (data.code === 0 && data.data) {
        const result = {
          id: data.data.id,
          title: data.data.title,
          playCount: data.data.play_count,
          likeCount: data.data.digg_count,
          shareCount: data.data.share_count,
          commentCount: data.data.comment_count,
          author: data.data.author?.nickname || '',
          authorId: data.data.author?.unique_id || '',
          avatar: data.data.author?.avatar || '',
          cover: data.data.cover || '',
          playUrl: data.data.play || '',
          musicTitle: data.data.music_info?.title || '',
          duration: data.data.duration || 0,
          source: 'tikwm',
        };
        await setCached(c.env.CACHE, ck, result, 7200);
        return c.json(result);
      }
    }
  } catch (err: any) {
    console.error('TikWM error:', err?.message);
  }

  // 2. TikTok oEmbed (no key needed)
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data: any = await res.json();
      const result = {
        title: data.title || '',
        author: data.author_name || '',
        authorId: data.author_unique_id || '',
        thumbnail: data.thumbnail_url || '',
        source: 'oembed',
      };
      await setCached(c.env.CACHE, ck, result, 7200);
      return c.json(result);
    }
  } catch (err: any) {
    console.error('TikTok oEmbed error:', err?.message);
  }

  // 3. SociaVault (key needed)
  try {
    const key = rotateKey([c.env.SOCIAVAULT_KEY_1, c.env.SOCIAVAULT_KEY_2]);
    if (key) {
      const res = await fetch(`https://api.sociavault.com/v1/scrape/tiktok/video?url=${encodeURIComponent(url)}`, {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      if (res.ok) {
        const data: any = await res.json();
        await setCached(c.env.CACHE, ck, { ...(data as Record<string, any>), source: 'sociavault' }, 7200);
        return c.json({ ...(data as Record<string, any>), source: 'sociavault' });
      }
    }
  } catch (err: any) {
    console.error('SociaVault TikTok error:', err?.message);
  }

  // 4. EnsembleData (key needed)
  try {
    const key = c.env.ENSEMBLE_KEY_1;
    if (key) {
      const res = await fetch(`https://api.ensembledata.com/v1/tiktok/video?url=${encodeURIComponent(url)}`, {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      if (res.ok) {
        const data: any = await res.json();
        await setCached(c.env.CACHE, ck, { ...(data as Record<string, any>), source: 'ensembledata' }, 7200);
        return c.json({ ...(data as Record<string, any>), source: 'ensembledata' });
      }
    }
  } catch (err: any) {
    console.error('EnsembleData error:', err?.message);
  }

  // 5. Tikhub via RapidAPI (key needed)
  try {
    const key = c.env.TIKHUB_KEY_1;
    if (key) {
      const res = await fetch(`https://tikhub-api.p.rapidapi.com/api/v1/tiktok/web/fetch_one_video?url=${encodeURIComponent(url)}`, {
        headers: {
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': 'tikhub-api.p.rapidapi.com',
        },
      });
      if (res.ok) {
        const data: any = await res.json();
        await setCached(c.env.CACHE, ck, { ...(data as Record<string, any>), source: 'tikhub' }, 7200);
        return c.json({ ...(data as Record<string, any>), source: 'tikhub' });
      }
    }
  } catch (err: any) {
    console.error('Tikhub error:', err?.message);
  }

  return c.json({ error: 'All TikTok providers failed' }, 500);
});

/**
 * GET /api/social/instagram/profile — Instagram profile data
 * Params: username
 * Fallback: SociaVault → EnsembleData → Gemini Flash insight inference
 */
socialRoutes.get('/instagram/profile', async (c) => {
  const username = c.req.query('username') || '';
  if (!username) return c.json({ error: 'username parameter is required' }, 400);

  const ck = cacheKey('social:instagram', { username });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  // 1. SociaVault
  try {
    const key = rotateKey([c.env.SOCIAVAULT_KEY_1, c.env.SOCIAVAULT_KEY_2]);
    if (key) {
      const res = await fetch(
        `https://api.sociavault.com/v1/scrape/instagram/profile?username=${encodeURIComponent(username)}`,
        { headers: { 'Authorization': `Bearer ${key}` } }
      );
      if (res.ok) {
        const data: any = await res.json();
        await setCached(c.env.CACHE, ck, { ...(data as Record<string, any>), source: 'sociavault' }, 21600);
        return c.json({ ...(data as Record<string, any>), source: 'sociavault' });
      }
    }
  } catch (err: any) {
    console.error('SociaVault Instagram error:', err?.message);
  }

  // 2. EnsembleData
  try {
    const key = c.env.ENSEMBLE_KEY_1;
    if (key) {
      const res = await fetch(
        `https://api.ensembledata.com/v1/instagram/profile?username=${encodeURIComponent(username)}`,
        { headers: { 'Authorization': `Bearer ${key}` } }
      );
      if (res.ok) {
        const data: any = await res.json();
        await setCached(c.env.CACHE, ck, { ...(data as Record<string, any>), source: 'ensembledata' }, 21600);
        return c.json({ ...(data as Record<string, any>), source: 'ensembledata' });
      }
    }
  } catch (err: any) {
    console.error('EnsembleData Instagram error:', err?.message);
  }

  // 3. Gemini Flash — infer insights from available data
  try {
    const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3]);
    if (key) {
      const messages = [
        {
          role: 'system',
          content: 'You are a social media analyst. Given an Instagram username, provide a structured analysis with estimated follower count range, likely content niche, engagement profile, and growth potential. Return as JSON with keys: username, estimatedFollowers (string like "10k-50k"), likelyNiche (string), engagementProfile (string), growthPotential (string "low"/"medium"/"high"). Be realistic in estimates.',
        },
        { role: 'user', content: `Analyze this Instagram profile: @${username}` },
      ];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: messages.map(m => m.content).join('\n\n') }] }],
          }),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const result = { username, analysis: text, source: 'gemini-inferred' };
          await setCached(c.env.CACHE, ck, result, 21600);
          return c.json(result);
        }
      }
    }
  } catch (err: any) {
    console.error('Gemini Instagram fallback error:', err?.message);
  }

  return c.json({ error: 'All Instagram providers failed' }, 500);
});

/**
 * GET /api/social/twitter/profile — Twitter/X profile data
 * Params: username
 * Fallback: SociaVault → Nitter (free, 2 instances) → Gemini Flash sentiment/analysis
 */
socialRoutes.get('/twitter/profile', async (c) => {
  const username = c.req.query('username') || '';
  if (!username) return c.json({ error: 'username parameter is required' }, 400);

  const ck = cacheKey('social:twitter', { username });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  // 1. SociaVault
  try {
    const key = rotateKey([c.env.SOCIAVAULT_KEY_1, c.env.SOCIAVAULT_KEY_2]);
    if (key) {
      const res = await fetch(
        `https://api.sociavault.com/v1/scrape/twitter/profile?username=${encodeURIComponent(username)}`,
        { headers: { 'Authorization': `Bearer ${key}` } }
      );
      if (res.ok) {
        const data: any = await res.json();
        await setCached(c.env.CACHE, ck, { ...(data as Record<string, any>), source: 'sociavault' }, 21600);
        return c.json({ ...(data as Record<string, any>), source: 'sociavault' });
      }
    }
  } catch (err: any) {
    console.error('SociaVault Twitter error:', err?.message);
  }

  // 2. Nitter public instances (no key needed)
  const NITTER_INSTANCES = [
    'https://nitter.net',
    'https://nitter.privacydev.net',
  ];
  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`${instance}/${username}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const html = await res.text();
        const nameMatch = html.match(/<a class="profile-card-fullname"[^>]*>(.*?)<\/a>/s);
        const bioMatch = html.match(/<div class="profile-bio"[^>]*>(.*?)<\/div>/s);
        const statsMatch = html.match(/<span class="profile-stat-num">([\d.]+)<\/span>\s*<span class="profile-stat-label">([\w\s]+)<\/span>/g);
        const avatarMatch = html.match(/<a class="profile-card-avatar"[^>]*><img src="([^"]+)"/);

        if (nameMatch) {
          const result = {
            username,
            displayName: nameMatch[1]?.replace(/<[^>]*>/g, '').trim() || username,
            bio: bioMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || '',
            avatar: avatarMatch?.[1] || '',
            source: 'nitter',
          };
          await setCached(c.env.CACHE, ck, result, 21600);
          return c.json(result);
        }
      }
    } catch (err: any) {
      console.error(`Nitter ${instance} error:`, err?.message);
    }
  }

  // 3. Gemini Flash — sentiment/analysis fallback
  try {
    const key = rotateKey([c.env.GEMINI_KEY_1, c.env.GEMINI_KEY_2, c.env.GEMINI_KEY_3]);
    if (key) {
      const messages = [
        {
          role: 'system',
          content: 'You are a social media analyst. Given a Twitter/X username, provide a structured analysis with estimated follower count range, likely content focus, engagement profile, and sentiment tendency. Return as JSON with keys: username, estimatedFollowers (string like "10k-50k"), likelyFocus (string), engagementProfile (string), sentimentTendency (string). Be realistic.',
        },
        { role: 'user', content: `Analyze this Twitter/X profile: @${username}` },
      ];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: messages.map(m => m.content).join('\n\n') }] }],
          }),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const result = { username, analysis: text, source: 'gemini-inferred' };
          await setCached(c.env.CACHE, ck, result, 21600);
          return c.json(result);
        }
      }
    }
  } catch (err: any) {
    console.error('Gemini Twitter fallback error:', err?.message);
  }

  return c.json({ error: 'All Twitter providers failed' }, 500);
});

/**
 * GET /api/social/tiktok/comments — Scrape TikTok video comments
 * Params: url (TikTok video URL), count (default 20)
 * Fallback: TikWM → TikTok oEmbed (limited)
 */
socialRoutes.get('/tiktok/comments', async (c) => {
  const url = c.req.query('url') || '';
  const count = parseInt(c.req.query('count') || '20', 10);

  if (!url) return c.json({ error: 'url parameter is required' }, 400);

  const ck = cacheKey('social:tiktok:comments', { url, count: String(count) });
  const cached = await getCached<any>(c.env.CACHE, ck);
  if (cached) return c.json(cached);

  // 1. TikWM (no key needed — has comment data)
  try {
    const res = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
    if (res.ok) {
      const data: any = await res.json();
      if (data.code === 0 && data.data) {
        const comments = (data.data.comments || []).slice(0, count).map((cm: any) => ({
          id: cm.cid || cm.id || '',
          text: cm.text || cm.content || '',
          user: cm.user?.nickname || cm.author?.nickname || '',
          userId: cm.user?.unique_id || cm.author?.unique_id || '',
          likes: cm.digg_count || cm.like_count || 0,
          replies: cm.reply_comment_total || 0,
          timestamp: cm.create_time ? new Date(cm.create_time * 1000).toISOString() : '',
        }));
        if (comments.length > 0) {
          const result = { comments, source: 'tikwm', total: data.data.comment_count || comments.length };
          await setCached(c.env.CACHE, ck, result, 3600);
          return c.json(result);
        }
      }
    }
  } catch (err: any) {
    console.error('TikWM comments error:', err?.message);
  }

  return c.json({ error: 'No comments found', comments: [] }, 200);
});
