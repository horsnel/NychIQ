/**
 * NychIQ Worker — Email Routes
 * Send notifications, reports, and scheduled emails.
 * Backend: Brevo → Resend → Workers Queue
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { sendEmail } from '../lib/email';

export const emailRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/email/send — Send an email
 * Body: { to, subject, html, from?, replyTo? }
 */
emailRoutes.post('/send', async (c) => {
  try {
    const { to, subject, html, from, replyTo } = await c.req.json<{
      to?: string; subject?: string; html?: string; from?: string; replyTo?: string;
    }>();

    if (!to || !subject || !html) {
      return c.json({ error: 'to, subject, and html are required' }, 400);
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return c.json({ error: 'Invalid email address' }, 400);
    }

    if (html.length > 500000) {
      return c.json({ error: 'HTML content exceeds maximum size' }, 400);
    }

    const result = await sendEmail(c.env, { to, subject, html, from, replyTo });

    if (result.success) {
      return c.json({ sent: true, messageId: result.messageId, source: result.source });
    }

    return c.json({ error: 'All email providers failed' }, 500);
  } catch (err: any) {
    console.error('Email send error:', err?.message);
    return c.json({ error: err?.message || 'Email send failed' }, 500);
  }
});

/**
 * POST /api/email/notify — Send a platform notification
 * Body: { userId, type: 'audit_complete' | 'report_ready' | 'trend_alert' | 'payment_success', data?: any }
 */
emailRoutes.post('/notify', async (c) => {
  try {
    const { userId, type, data } = await c.req.json<{
      userId?: string; type?: string; data?: any;
    }>();

    if (!userId || !type) {
      return c.json({ error: 'userId and type are required' }, 400);
    }

    const validTypes = ['audit_complete', 'report_ready', 'trend_alert', 'payment_success', 'weekly_digest', 'channel_milestone'];
    if (!validTypes.includes(type)) {
      return c.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, 400);
    }

    // Look up user email from Supabase
    let userEmail = '';
    try {
      if (c.env.SUPABASE_URL && c.env.SUPABASE_SERVICE_KEY) {
        const res = await fetch(
          `${c.env.SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=email`,
          { headers: { 'apikey': c.env.SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${c.env.SUPABASE_SERVICE_KEY}` } }
        );
        if (res.ok) {
          const profileData: any = await res.json();
          userEmail = profileData?.[0]?.email || '';
        }
      }
    } catch {}

    if (!userEmail) {
      return c.json({ error: 'User email not found' }, 404);
    }

    const templates: Record<string, { subject: string; html: string }> = {
      audit_complete: {
        subject: 'NychIQ — Your Channel Audit is Ready',
        html: `
          <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
              <h1 style="color:#22d3ee;margin:0;font-size:24px">NychIQ</h1>
              <p style="color:#94a3b8;margin:4px 0 0">YouTube Intelligence Platform</p>
            </div>
            <div style="background:#1a1a2e;border:1px solid #334155;border-radius:8px;padding:20px">
              <h2 style="color:#22d3ee;margin-top:0">Channel Audit Complete</h2>
              <p style="color:#e2e8f0">Your channel audit has been completed successfully. Log in to NychIQ to view detailed insights about your channel performance, growth opportunities, and content strategy recommendations.</p>
              ${data?.channelName ? `<p style="color:#10b981;font-weight:bold">Channel: ${data.channelName}</p>` : ''}
            </div>
            <p style="color:#64748b;text-align:center;font-size:12px;margin-top:20px">You received this email because you have notifications enabled on NychIQ.</p>
          </div>
        `,
      },
      report_ready: {
        subject: 'NychIQ — Your Scheduled Report is Ready',
        html: `
          <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
              <h1 style="color:#22d3ee;margin:0;font-size:24px">NychIQ</h1>
              <p style="color:#94a3b8;margin:4px 0 0">YouTube Intelligence Platform</p>
            </div>
            <div style="background:#1a1a2e;border:1px solid #334155;border-radius:8px;padding:20px">
              <h2 style="color:#22d3ee;margin-top:0">Report Ready</h2>
              <p style="color:#e2e8f0">Your scheduled report has been generated. It includes the latest analytics, trending data, and performance metrics for your channels.</p>
              ${data?.reportType ? `<p style="color:#94a3b8">Report Type: ${data.reportType}</p>` : ''}
            </div>
          </div>
        `,
      },
      trend_alert: {
        subject: 'NychIQ — Trend Alert',
        html: `
          <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
              <h1 style="color:#22d3ee;margin:0;font-size:24px">NychIQ</h1>
              <p style="color:#94a3b8;margin:4px 0 0">Trend Alert</p>
            </div>
            <div style="background:#1a1a2e;border:1px solid #334155;border-radius:8px;padding:20px">
              <h2 style="color:#f59e0b;margin-top:0">New Trend Detected</h2>
              <p style="color:#e2e8f0">${data?.description || 'A new trend has been detected in your niche. Check NychIQ for details and content ideas.'}</p>
              ${data?.topic ? `<p style="color:#22d3ee;font-weight:bold">Topic: ${data.topic}</p>` : ''}
            </div>
          </div>
        `,
      },
      payment_success: {
        subject: 'NychIQ — Payment Confirmed',
        html: `
          <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
              <h1 style="color:#22d3ee;margin:0;font-size:24px">NychIQ</h1>
              <p style="color:#94a3b8;margin:4px 0 0">Payment Confirmed</p>
            </div>
            <div style="background:#1a1a2e;border:1px solid #334155;border-radius:8px;padding:20px">
              <h2 style="color:#10b981;margin-top:0">Payment Successful</h2>
              <p style="color:#e2e8f0">Your payment has been confirmed. Your plan has been upgraded and your tokens have been credited.</p>
              ${data?.plan ? `<p style="color:#94a3b8">Plan: <strong style="color:#22d3ee">${data.plan}</strong></p>` : ''}
              ${data?.amount ? `<p style="color:#94a3b8">Amount: <strong style="color:#10b981">${data.amount}</strong></p>` : ''}
            </div>
          </div>
        `,
      },
      weekly_digest: {
        subject: 'NychIQ — Your Weekly Digest',
        html: `
          <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
              <h1 style="color:#22d3ee;margin:0;font-size:24px">NychIQ</h1>
              <p style="color:#94a3b8;margin:4px 0 0">Weekly Digest</p>
            </div>
            <div style="background:#1a1a2e;border:1px solid #334155;border-radius:8px;padding:20px">
              <h2 style="color:#22d3ee;margin-top:0">This Week on NychIQ</h2>
              <p style="color:#e2e8f0">Here is a summary of your channel performance, trending topics, and AI insights from the past week.</p>
              ${data?.summary ? `<div style="background:#0f172a;border-radius:6px;padding:12px;margin:12px 0"><p style="color:#94a3b8;margin:0">${data.summary}</p></div>` : ''}
            </div>
          </div>
        `,
      },
      channel_milestone: {
        subject: 'NychIQ — Channel Milestone Reached!',
        html: `
          <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
              <h1 style="color:#22d3ee;margin:0;font-size:24px">NychIQ</h1>
              <p style="color:#94a3b8;margin:4px 0 0">Milestone</p>
            </div>
            <div style="background:#1a1a2e;border:1px solid #334155;border-radius:8px;padding:20px">
              <h2 style="color:#f59e0b;margin-top:0">Milestone Reached!</h2>
              <p style="color:#e2e8f0">${data?.description || 'Congratulations! Your channel has reached a new milestone.'}</p>
            </div>
          </div>
        `,
      },
    };

    const template = templates[type] || templates.audit_complete;
    const result = await sendEmail(c.env, { to: userEmail, subject: template.subject, html: template.html });

    return c.json({ sent: result.success, source: result.source });
  } catch (err: any) {
    console.error('Email notify error:', err?.message);
    return c.json({ error: err?.message || 'Notification failed' }, 500);
  }
});
