/**
 * NychIQ Worker — Auth Routes (Supabase Auth)
 * Handles signup, login, logout, user info, and OAuth.
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { getSupabase } from '../lib/supabase';

export const authRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/auth/signup — Email + password signup
 * Body: { email, password, userName? }
 */
authRoutes.post('/signup', async (c) => {
  const supabase = getSupabase(c.env);
  if (!supabase) return c.json({ error: 'Auth service not configured' }, 503);

  try {
    const { email, password, userName } = await c.req.json<{
      email?: string; password?: string; userName?: string;
    }>();

    if (!email || !password) return c.json({ error: 'Email and password are required' }, 400);
    if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);

    const data = await supabase.auth.signUp({ email, password });

    if (data.error) {
      return c.json({ error: data.error.message }, 400);
    }

    // Store userName in user_metadata if provided
    if (data.user && userName) {
      const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/admin/users/${data.user.id}`, {
        method: 'PUT',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_KEY!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_metadata: { user_name: userName } }),
      });
    }

    return c.json({
      user: { id: data.user?.id, email: data.user?.email },
      session: data.session,
    });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Signup failed' }, 500);
  }
});

/**
 * POST /api/auth/login — Email + password login
 * Body: { email, password }
 */
authRoutes.post('/login', async (c) => {
  const supabase = getSupabase(c.env);
  if (!supabase) return c.json({ error: 'Auth service not configured' }, 503);

  try {
    const { email, password } = await c.req.json<{
      email?: string; password?: string;
    }>();

    if (!email || !password) return c.json({ error: 'Email and password are required' }, 400);

    const data = await supabase.auth.signInWithPassword({ email, password });

    if (data.error) {
      return c.json({ error: data.error.message }, 401);
    }

    return c.json({
      user: { id: data.user?.id, email: data.user?.email },
      session: data.session,
    });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Login failed' }, 500);
  }
});

/**
 * POST /api/auth/logout — Clear session
 * Body: {} (or empty)
 * Headers: Authorization: Bearer <access_token>
 */
authRoutes.post('/logout', async (c) => {
  // Logout is client-side — just clear the token
  // Supabase handles session invalidation on its end via JWT expiry
  return c.json({ success: true });
});

/**
 * GET /api/auth/me — Get current user
 * Headers: Authorization: Bearer <access_token>
 */
authRoutes.get('/me', async (c) => {
  const supabase = getSupabase(c.env);
  if (!supabase) return c.json({ error: 'Auth service not configured' }, 503);

  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return c.json({ error: 'Authorization token required' }, 401);

    const data = await supabase.auth.getUser(token);
    if (data.error || !data.user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    return c.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        userName: data.user.user_metadata?.user_name || data.user.email?.split('@')[0] || '',
        createdAt: data.user.created_at,
      },
    });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Auth check failed' }, 500);
  }
});

/**
 * POST /api/auth/oauth/google — Google OAuth
 * Body: { code, redirectUri }
 * Exchanges the Google auth code for Supabase session
 */
authRoutes.post('/oauth/google', async (c) => {
  const supabase = getSupabase(c.env);
  if (!supabase) return c.json({ error: 'Auth service not configured' }, 503);

  try {
    const { code, redirectUri } = await c.req.json<{
      code?: string; redirectUri?: string;
    }>();

    if (!code || !redirectUri) return c.json({ error: 'code and redirectUri are required' }, 400);

    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/token?grant_type=exchange_code`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirectUri }),
    });

    const data: any = await res.json();
    if (data.error) return c.json({ error: data.error.message }, 400);

    return c.json({
      user: { id: data.user?.id, email: data.user?.email },
      session: data,
    });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Google OAuth failed' }, 500);
  }
});

/**
 * POST /api/auth/oauth/github — GitHub OAuth
 * Body: { code, redirectUri }
 */
authRoutes.post('/oauth/github', async (c) => {
  const supabase = getSupabase(c.env);
  if (!supabase) return c.json({ error: 'Auth service not configured' }, 503);

  try {
    const { code, redirectUri } = await c.req.json<{
      code?: string; redirectUri?: string;
    }>();

    if (!code || !redirectUri) return c.json({ error: 'code and redirectUri are required' }, 400);

    const res = await fetch(`${c.env.SUPABASE_URL}/auth/v1/token?grant_type=exchange_code`, {
      method: 'POST',
      headers: {
        'apikey': c.env.SUPABASE_SERVICE_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirectUri }),
    });

    const data: any = await res.json();
    if (data.error) return c.json({ error: data.error.message }, 400);

    return c.json({
      user: { id: data.user?.id, email: data.user?.email },
      session: data,
    });
  } catch (err: any) {
    return c.json({ error: err?.message || 'GitHub OAuth failed' }, 500);
  }
});
