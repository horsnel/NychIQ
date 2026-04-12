/**
 * NychIQ Worker — Fallback Realtime (No Durable Objects)
 * Primary: Supabase Realtime RPC → Ably (6M msg/mo free) → Soketi (self-hosted)
 * Fully free-tier compatible.
 */

import type { Env } from './env';

export interface RealtimeMessage {
  event: string;
  data: unknown;
  channel: string;
}

export interface RealtimeResult {
  success: boolean;
  source: string;
  clients?: number;
}

/**
 * Publish a message to a realtime channel.
 * Tries each free provider in order.
 */
export async function publishRealtime(
  env: Env,
  channel: string,
  event: string,
  data: unknown
): Promise<RealtimeResult> {
  const message: RealtimeMessage = { event, data, channel };

  // 1. Supabase Realtime (primary — free, uses Postgres NOTIFY via RPC)
  try {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/broadcast_realtime`, {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ p_channel: channel, p_event: event, p_payload: data }),
      });
      if (res.ok) return { success: true, source: 'supabase' };
      // 404 = RPC not created yet, fall through silently
    }
  } catch (err: any) {
    console.error('Supabase realtime error:', err?.message);
  }

  // 2. Ably (fallback — 6M messages/month free tier)
  try {
    if (env.ABLY_KEY) {
      const channelName = channel.startsWith('nychiq:') ? channel : `nychiq:${channel}`;
      const res = await fetch(
        `https://rest.ably.io/channels/${encodeURIComponent(channelName)}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(env.ABLY_KEY)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: event, data, clientId: 'nychiq-worker' }),
        }
      );
      if (res.ok) {
        const result: any = await res.json();
        return { success: true, source: 'ably', clients: result?.connectionCapacity };
      }
    }
  } catch (err: any) {
    console.error('Ably realtime error:', err?.message);
  }

  // 3. Soketi (self-hosted Pusher-compatible WebSocket server — free)
  try {
    if (env.SOKETI_URL) {
      const res = await fetch(`${env.SOKETI_URL}/apps/1/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, event, data: JSON.stringify(data) }),
      });
      if (res.ok) return { success: true, source: 'soketi' };
    }
  } catch (err: any) {
    console.error('Soketi realtime error:', err?.message);
  }

  return { success: false, source: 'none' };
}

/**
 * Get the WebSocket endpoint URL for a given channel.
 * Clients connect to this URL to receive realtime messages.
 */
export function getRealtimeEndpoint(
  env: Env,
  channel: string
): { url: string; provider: string } {
  // Ably (managed, reliable, 6M free messages/mo)
  if (env.ABLY_KEY) {
    return {
      url: `wss://realtime.ably.io?key=${encodeURIComponent(env.ABLY_KEY)}&channel=${encodeURIComponent(`nychiq:${channel}`)}`,
      provider: 'ably',
    };
  }

  // Soketi (self-hosted Pusher-compatible)
  if (env.SOKETI_URL) {
    const wsUrl = env.SOKETI_URL.replace(/^http/, 'ws');
    return {
      url: `${wsUrl}/app/1?channel=${encodeURIComponent(channel)}`,
      provider: 'soketi',
    };
  }

  // Supabase Realtime WebSocket (free with Supabase project)
  if (env.SUPABASE_URL) {
    const wsUrl = env.SUPABASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    return {
      url: `${wsUrl}/realtime/v1/websocket?apikey=${encodeURIComponent(env.SUPABASE_SERVICE_KEY || '')}&channel=${encodeURIComponent(channel)}`,
      provider: 'supabase',
    };
  }

  // No provider configured — return placeholder
  return {
    url: '',
    provider: 'none',
  };
}
