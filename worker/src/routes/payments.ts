/**
 * NychIQ Worker — Paystack Payment Routes
 * Initialize transactions + handle webhooks for plan upgrades.
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { getSupabase } from '../lib/supabase';

export const paystackRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/payments/initialize — Start a Paystack transaction
 * Body: { email: string, plan: 'starter' | 'pro' | 'elite' | 'agency', userId: string }
 * Returns: { authorization_url, reference, access_code }
 */
paystackRoutes.post('/initialize', async (c) => {
  const secretKey = c.env.PAYSTACK_SECRET;
  if (!secretKey) {
    return c.json({ error: 'Payment service not configured' }, 503);
  }

  try {
    const { email, plan, userId } = await c.req.json<{
      email?: string; plan?: string; userId?: string;
    }>();

    if (!email || !plan || !userId) {
      return c.json({ error: 'email, plan, and userId are required' }, 400);
    }

    const validPlans = ['starter', 'pro', 'elite', 'agency'];
    if (!validPlans.includes(plan)) {
      return c.json({ error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` }, 400);
    }

    // Plan amounts in kobo (NGN)
    const PLAN_AMOUNTS: Record<string, number> = {
      starter: 200000,   // ₦2,000
      pro: 500000,       // ₦5,000
      elite: 1000000,    // ₦10,000
      agency: 2500000,   // ₦25,000
    };

    const amount = PLAN_AMOUNTS[plan] || PLAN_AMOUNTS.starter;

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        currency: 'NGN',
        reference: `nychiq_${plan}_${userId}_${Date.now()}`,
        metadata: {
          plan,
          userId,
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: plan },
            { display_name: 'User ID', variable_name: 'user_id', value: userId },
          ],
        },
        channels: ['card', 'bank_transfer', 'ussd', 'mobile_money', 'bank'],
      }),
    });

    const data: any = await res.json();

    if (!res.ok || !data.status) {
      return c.json({ error: data.message || 'Payment initialization failed' }, 400);
    }

    return c.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    });
  } catch (err: any) {
    console.error('Paystack init error:', err?.message);
    return c.json({ error: err?.message || 'Payment initialization failed' }, 500);
  }
});

/**
 * POST /api/payments/verify — Verify a completed transaction
 * Body: { reference: string }
 * Returns: { status, plan, amount, verified }
 */
paystackRoutes.post('/verify', async (c) => {
  const secretKey = c.env.PAYSTACK_SECRET;
  if (!secretKey) {
    return c.json({ error: 'Payment service not configured' }, 503);
  }

  try {
    const { reference } = await c.req.json<{ reference?: string }>();
    if (!reference) {
      return c.json({ error: 'reference is required' }, 400);
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });

    const data: any = await res.json();

    if (!res.ok || !data.status) {
      return c.json({ error: data.message || 'Verification failed' }, 400);
    }

    const tx = data.data;
    const plan = tx.metadata?.plan;
    const userId = tx.metadata?.user_id;

    // Update user plan in Supabase if payment is successful
    if (tx.status === 'success' && plan && userId) {
      const supabase = getSupabase(c.env);
      if (supabase) {
        await fetch(`${c.env.SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': c.env.SUPABASE_SERVICE_KEY!,
            'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_KEY!}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({ plan, updated_at: new Date().toISOString() }),
        }).catch(() => {/* non-critical */});
      }
    }

    return c.json({
      status: tx.status,
      plan: tx.metadata?.plan,
      amount: tx.amount,
      currency: tx.currency,
      verified: tx.status === 'success',
      paid_at: tx.paid_at,
    });
  } catch (err: any) {
    console.error('Paystack verify error:', err?.message);
    return c.json({ error: err?.message || 'Verification failed' }, 500);
  }
});

/**
 * POST /api/payments/webhook — Paystack webhook handler
 * Paystack sends this when a payment event occurs.
 * Validates the signature and processes the event.
 */
paystackRoutes.post('/webhook', async (c) => {
  const secretKey = c.env.PAYSTACK_SECRET;
  if (!secretKey) {
    return c.json({ error: 'Not configured' }, 503);
  }

  try {
    // Validate Paystack signature
    const signature = c.req.header('x-paystack-signature');
    const body = await c.req.text();

    if (!signature) {
      return c.json({ error: 'Missing signature' }, 400);
    }

    // HMAC-SHA512 signature verification
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secretKey),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(body));
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== expectedSig) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const event: any = JSON.parse(body);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const tx = event.data;
      const plan = tx.metadata?.plan;
      const userId = tx.metadata?.user_id;

      if (plan && userId) {
        const supabase = getSupabase(c.env);
        if (supabase) {
          // Update user plan
          await fetch(`${c.env.SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
              'apikey': c.env.SUPABASE_SERVICE_KEY!,
              'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_KEY!}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({ plan, updated_at: new Date().toISOString() }),
          }).catch(() => {/* non-critical */});

          // Record subscription
          await fetch(`${c.env.SUPABASE_URL}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: {
              'apikey': c.env.SUPABASE_SERVICE_KEY!,
              'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_KEY!}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              user_id: userId,
              plan,
              status: 'active',
              paystack_ref: tx.reference,
              amount: tx.amount,
              currency: tx.currency || 'NGN',
              started_at: tx.paid_at || new Date().toISOString(),
            }),
          }).catch(() => {/* non-critical */});

          // Add token bonus
          const PLAN_TOKENS: Record<string, number> = {
            starter: 200,
            pro: 600,
            elite: 1500,
            agency: 5000,
          };
          const bonus = PLAN_TOKENS[plan] || 200;
          await fetch(`${c.env.SUPABASE_URL}/rest/v1/token_transactions`, {
            method: 'POST',
            headers: {
              'apikey': c.env.SUPABASE_SERVICE_KEY!,
              'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_KEY!}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              user_id: userId,
              amount: bonus,
              type: 'purchase',
              description: `Plan upgrade to ${plan} via Paystack (${tx.reference})`,
            }),
          }).catch(() => {/* non-critical */});
        }
      }
    }

    // Always return 200 to acknowledge the webhook
    return c.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err?.message);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

/**
 * GET /api/payments/plans — List available plans and pricing
 */
paystackRoutes.get('/plans', async (c) => {
  return c.json({
    plans: [
      { id: 'trial', name: 'Trial', price: 0, tokens: 100, features: ['Basic tools', '5 searches/day', 'Community support'] },
      { id: 'starter', name: 'Starter', price: 2000, tokens: 200, currency: 'NGN', features: ['All tools', '50 searches/day', 'AI analysis', 'Channel audit'] },
      { id: 'pro', name: 'Pro', price: 5000, tokens: 600, currency: 'NGN', features: ['Everything in Starter', 'Unlimited searches', 'Deep forensics', 'Priority AI'] },
      { id: 'elite', name: 'Elite', price: 10000, tokens: 1500, currency: 'NGN', features: ['Everything in Pro', 'Sovereign Vault', 'API access', 'Agency tools'] },
      { id: 'agency', name: 'Agency', price: 25000, tokens: 5000, currency: 'NGN', features: ['Everything in Elite', 'Multi-channel', 'White-label reports', 'Dedicated support'] },
    ],
  });
});
