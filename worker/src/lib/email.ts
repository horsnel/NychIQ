/**
 * NychIQ Worker — Email Service
 * Fallback: Brevo → Resend → Workers Queue (deferred delivery)
 */

import type { Env } from './env';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  source: string;
}

const DEFAULT_FROM = 'NychIQ <noreply@nychiq.com>';

/**
 * Send an email using the fallback chain: Brevo → Resend → Queue.
 */
export async function sendEmail(env: Env, payload: EmailPayload): Promise<EmailResult> {
  const from = payload.from || DEFAULT_FROM;

  // 1. Brevo (formerly Sendinblue) — 300/day free
  try {
    if (env.BREVO_KEY) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'NychIQ', email: from.match(/<(.+)>/)?.[1] || from },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: payload.html,
          replyTo: payload.replyTo ? { email: payload.replyTo } : undefined,
        }),
      });
      if (res.ok) {
        const data: any = await res.json();
        return { success: true, messageId: data.messageId, source: 'brevo' };
      }
    }
  } catch (err: any) {
    console.error('Brevo email error:', err?.message);
  }

  // 2. Resend — 100/day free
  try {
    if (env.RESEND_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          reply_to: payload.replyTo,
        }),
      });
      if (res.ok) {
        const data: any = await res.json();
        return { success: true, messageId: data.id, source: 'resend' };
      }
    }
  } catch (err: any) {
    console.error('Resend email error:', err?.message);
  }

  // 3. Queue for deferred processing (last resort)
  try {
    await env.TASK_QUEUE.send({
      type: 'send_email',
      payload: { ...payload, from },
      attemptedAt: Date.now(),
    });
    return { success: true, source: 'queue' };
  } catch (err: any) {
    console.error('Queue email error:', err?.message);
  }

  return { success: false, source: 'none' };
}

/**
 * Schedule an email via QStash (Upstash).
 * Delivers email via a callback to our own worker endpoint.
 */
export async function scheduleEmail(
  env: Env,
  payload: EmailPayload,
  delaySeconds: number = 0
): Promise<boolean> {
  if (!env.QSTASH_TOKEN || !env.APP_URL) return false;

  try {
    const res = await fetch('https://qstash.upstash.io/v1/publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${env.APP_URL}/api/email/send`,
        body: payload,
        delay: delaySeconds > 0 ? `${delaySeconds}s` : undefined,
      }),
    });
    return res.ok;
  } catch (err: any) {
    console.error('QStash schedule error:', err?.message);
    return false;
  }
}
