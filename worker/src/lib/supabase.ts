/**
 * NychIQ Worker — Supabase client helper
 * Server-side Supabase client for CloudFlare Worker.
 * Uses service_role key for admin operations.
 */

interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

interface SupabaseClient {
  from: (table: string) => any;
  auth: {
    signUp: (data: { email: string; password: string }) => Promise<any>;
    signInWithPassword: (data: { email: string; password: string }) => Promise<any>;
    getUser: (jwt: string) => Promise<any>;
    admin: {
      getUserById: (id: string) => Promise<any>;
    };
  };
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<any>;
}

/**
 * Create a Supabase client for the worker.
 * Returns null if credentials are not configured.
 */
export function getSupabase(env: { SUPABASE_URL?: string; SUPABASE_SERVICE_KEY?: string }): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;

  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;

  return {
    async from(table: string) {
      const res = await fetch(`${url}/rest/v1/${table}`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      });
      return {
        select: async (columns = '*') => {
          const r = await fetch(`${url}/rest/v1/${table}?select=${columns}`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            },
          });
          return { data: await r.json(), error: r.ok ? null : await r.json().catch(() => null) };
        },
        insert: async (data: any) => {
          const r = await fetch(`${url}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(data),
          });
          return { data: await r.json(), error: r.ok ? null : await r.json().catch(() => null) };
        },
        update: async (data: any, match: Record<string, string>) => {
          const where = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join('&');
          const r = await fetch(`${url}/rest/v1/${table}?${where}`, {
            method: 'PATCH',
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(data),
          });
          return { data: await r.json(), error: r.ok ? null : await r.json().catch(() => null) };
        },
        delete: async (match: Record<string, string>) => {
          const where = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join('&');
          const r = await fetch(`${url}/rest/v1/${table}?${where}`, {
            method: 'DELETE',
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`,
            },
          });
          return { error: r.ok ? null : await r.json().catch(() => null) };
        },
      };
    },
    auth: {
      async signUp(data: { email: string; password: string }) {
        const r = await fetch(`${url}/auth/v1/signup`, {
          method: 'POST',
          headers: { 'apikey': key, 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return r.json();
      },
      async signInWithPassword(data: { email: string; password: string }) {
        const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': key, 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return r.json();
      },
      async getUser(jwt: string) {
        const r = await fetch(`${url}/auth/v1/user`, {
          headers: { 'apikey': key, 'Authorization': `Bearer ${jwt}` },
        });
        return r.json();
      },
      admin: {
        async getUserById(id: string) {
          const r = await fetch(`${url}/auth/v1/admin/users/${id}`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
          });
          return r.json();
        },
      },
    },
    async rpc(fn: string, params?: Record<string, unknown>) {
      const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });
      return r.json();
    },
  };
}
