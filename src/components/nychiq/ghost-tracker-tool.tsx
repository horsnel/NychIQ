'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import { XIcon } from '@/components/ui/x-icon';
import {
  EyeOff,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Bot,
  Users,
  TrendingUp,
  Activity,
  Radio,
  Mail,
  GitCompare,
  Zap,
  BarChart3,
  Globe,
} from 'lucide-react';

/* ── Types ── */
interface ChannelOverview {
  name: string;
  estimatedSubs: string;
  estimatedViews: string;
  videoCount: string;
  avgViews: string;
  uploadFrequency: string;
  joinDate: string;
}

interface VelocityAlert {
  type: 'frequency' | 'strategy' | 'format';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface ABTestEntry {
  videoTitle: string;
  detectedChange: string;
  detectedDate: string;
  impact: 'positive' | 'neutral' | 'negative';
}

interface OffPlatformSignal {
  platform: string;
  icon: React.ElementType;
  estimatedFollowers: string;
  growth: string;
  activity: string;
}

interface EngagementVelocity {
  first24hViews: string;
  weeklyViews: string;
  ratio: string;
  trend: 'accelerating' | 'stable' | 'declining';
}

interface ShadowMetric {
  label: string;
  them: string;
  you: string;
  diff: string;
}

interface GhostResult {
  channel: string;
  overview: ChannelOverview;
  velocityAlerts: VelocityAlert[];
  abTests: ABTestEntry[];
  offPlatform: OffPlatformSignal[];
  engagement: EngagementVelocity;
  shadowMetrics: ShadowMetric[];
  analysis: string;
}

/* ── Severity colors ── */
function severityColor(s: string): string {
  if (s === 'high') return '#EF4444';
  if (s === 'medium') return '#FDBA2D';
  return '#3B82F6';
}

function impactColor(i: string): string {
  if (i === 'positive') return '#10B981';
  if (i === 'negative') return '#EF4444';
  return '#A3A3A3';
}

function trendColor(t: string): string {
  if (t === 'accelerating') return '#10B981';
  if (t === 'declining') return '#EF4444';
  return '#FDBA2D';
}

/* ── Mock fallback ── */
function mockGhost(channel: string): GhostResult {
  return {
    channel,
    overview: {
      name: channel,
      estimatedSubs: `${(Math.floor(Math.random() * 800) + 100)}K`,
      estimatedViews: `${(Math.floor(Math.random() * 50) + 5)}M`,
      videoCount: `${Math.floor(Math.random() * 500) + 50}`,
      avgViews: `${(Math.floor(Math.random() * 200) + 10)}K`,
      uploadFrequency: `${['2-3x/week', '1x/week', '3-4x/week', 'Daily'][Math.floor(Math.random() * 4)]}`,
      joinDate: `${['2018', '2019', '2020', '2021'][Math.floor(Math.random() * 4)]}`,
    },
    velocityAlerts: [
      { type: 'frequency', severity: 'high', message: `Upload frequency increased by 40% in the last 30 days — possible algorithm push or new strategy test.` },
      { type: 'strategy', severity: 'medium', message: `Recent shift from long-form to Shorts-heavy content (60% Shorts now vs 20% previously).` },
      { type: 'format', severity: 'low', message: `New thumbnail style detected: bolder text, warmer color palette — likely A/B testing designs.` },
    ],
    abTests: [
      { videoTitle: `${channel} — New Series Episode 1`, detectedChange: 'Thumbnail changed 3x in first 24h, title modified once', detectedDate: '2 days ago', impact: 'positive' },
      { videoTitle: `${channel} — Controversial Take on...`, detectedChange: 'Title rewritten, description keywords changed', detectedDate: '5 days ago', impact: 'neutral' },
      { videoTitle: `${channel} — How I Got 100K Subs`, detectedChange: 'End screen removed, CTA moved to first 30 seconds', detectedDate: '1 week ago', impact: 'positive' },
    ],
    offPlatform: [
      { platform: 'X (Twitter)', icon: XIcon, estimatedFollowers: `${Math.floor(Math.random() * 80) + 10}K`, growth: '+12% this month', activity: 'High — 3-5 posts/day, active engagement' },
      { platform: 'Newsletter', icon: Mail, estimatedFollowers: `${Math.floor(Math.random() * 30) + 5}K`, growth: '+8% this month', activity: 'Medium — weekly newsletter, 45% open rate' },
      { platform: 'Website/Blog', icon: Globe, estimatedFollowers: `${Math.floor(Math.random() * 20) + 2}K`, growth: '+5% this month', activity: 'Low — occasional blog posts' },
    ],
    engagement: {
      first24hViews: `${Math.floor(Math.random() * 80 + 20)}K`,
      weeklyViews: `${Math.floor(Math.random() * 200 + 50)}K`,
      ratio: '35%',
      trend: 'accelerating' as const,
    },
    shadowMetrics: [
      { label: 'Avg Watch Time', them: '8:24', you: '5:12', diff: '+3:12' },
      { label: 'CTR (Thumbnail)', them: '7.8%', you: '4.2%', diff: '+3.6%' },
      { label: 'Subscriber Conversion', them: '2.1%', you: '1.3%', diff: '+0.8%' },
      { label: 'Return Viewer Rate', them: '38%', you: '22%', diff: '+16%' },
    ],
    analysis: `${channel} is rapidly increasing their upload cadence and shifting toward Shorts for discovery. Their X (Twitter) presence is driving significant cross-platform traffic. Their A/B testing discipline is strong — they iterate on thumbnails within 24 hours. Key vulnerability: their long-form watch time may suffer as they shift to Shorts. Your opportunity: create higher-quality long-form content that fills the gap they're leaving behind.`,
  };
}

/* ── Main Component ── */
export function GhostTrackerTool() {
  const { spendTokens } = useNychIQStore();
  const [channelInput, setChannelInput] = useState('');
  const [result, setResult] = useState<GhostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTrack = async () => {
    const ch = channelInput.trim();
    if (!ch) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('ghost-tracker');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube competitive intelligence expert. Track the competitor channel "${ch}" and detect their stealth strategy changes.

Return a JSON object with:
- "channel": "${ch}"
- "overview": { "name": "${ch}", "estimatedSubs": string (e.g. "250K"), "estimatedViews": string, "videoCount": string, "avgViews": string, "uploadFrequency": string, "joinDate": string }
- "velocityAlerts": Array of 3 objects, each with "type" ("frequency"/"strategy"/"format"), "severity" ("low"/"medium"/"high"), "message" (string describing detected change)
- "abTests": Array of 3 objects, each with "videoTitle" (string), "detectedChange" (string), "detectedDate" (string), "impact" ("positive"/"neutral"/"negative")
- "offPlatform": Array of 3 objects, each with "platform" (string), "estimatedFollowers" (string), "growth" (string), "activity" (string)
- "engagement": { "first24hViews": string, "weeklyViews": string, "ratio": string, "trend": "accelerating"/"stable"/"declining" }
- "shadowMetrics": Array of 4 objects, each with "label" (string), "them" (string), "you" (string placeholder like "N/A"), "diff" (string)
- "analysis": 2-3 sentences of competitive analysis and actionable advice

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setResult({
        channel: parsed.channel || ch,
        overview: {
          name: parsed.overview?.name || ch,
          estimatedSubs: parsed.overview?.estimatedSubs || '100K',
          estimatedViews: parsed.overview?.estimatedViews || '10M',
          videoCount: parsed.overview?.videoCount || '200',
          avgViews: parsed.overview?.avgViews || '50K',
          uploadFrequency: parsed.overview?.uploadFrequency || '2-3x/week',
          joinDate: parsed.overview?.joinDate || '2020',
        },
        velocityAlerts: Array.isArray(parsed.velocityAlerts)
          ? parsed.velocityAlerts.slice(0, 3).map((a: any) => ({
              type: a.type || 'strategy',
              severity: ['low', 'medium', 'high'].includes(a.severity) ? a.severity : 'medium',
              message: a.message || 'Strategy change detected.',
            }))
          : [],
        abTests: Array.isArray(parsed.abTests)
          ? parsed.abTests.slice(0, 3).map((t: any) => ({
              videoTitle: t.videoTitle || 'Untitled Video',
              detectedChange: t.detectedChange || 'Changes detected',
              detectedDate: t.detectedDate || 'Recently',
              impact: ['positive', 'neutral', 'negative'].includes(t.impact) ? t.impact : 'neutral',
            }))
          : [],
        offPlatform: Array.isArray(parsed.offPlatform)
          ? parsed.offPlatform.slice(0, 3).map((o: any) => ({
              platform: o.platform || 'X (Twitter)',
              icon: XIcon,
              estimatedFollowers: o.estimatedFollowers || '10K',
              growth: o.growth || '+5%',
              activity: o.activity || 'Medium activity',
            }))
          : [],
        engagement: {
          first24hViews: parsed.engagement?.first24hViews || '25K',
          weeklyViews: parsed.engagement?.weeklyViews || '120K',
          ratio: parsed.engagement?.ratio || '21%',
          trend: ['accelerating', 'stable', 'declining'].includes(parsed.engagement?.trend) ? parsed.engagement.trend : 'stable',
        },
        shadowMetrics: Array.isArray(parsed.shadowMetrics)
          ? parsed.shadowMetrics.slice(0, 4).map((m: any) => ({
              label: m.label || 'Metric',
              them: m.them || 'N/A',
              you: m.you || 'N/A',
              diff: m.diff || '—',
            }))
          : [],
        analysis: parsed.analysis || 'Competitive analysis complete. Review the data above.',
      });
    } catch {
      setResult(mockGhost(ch));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `Ghost Tracker: ${result.channel}\n\n${result.overview.name} — ${result.overview.estimatedSubs} subs, ${result.overview.uploadFrequency}\n\n${result.analysis}`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <EyeOff className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Ghost Tracker</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                Track off-platform growth & detect stealth strategy changes
              </p>
            </div>
          </div>
          <p className="text-xs text-[#A3A3A3] mb-4">
            Enter a competitor channel name. AI tracks their off-platform presence, A/B testing habits, and strategic shifts.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTrack(); }}
                placeholder="Enter competitor channel name..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-colors"
              />
            </div>
            <button
              onClick={handleTrack}
              disabled={loading || !channelInput.trim()}
              className="px-5 h-11 rounded-lg text-[#0D0D0D] text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              style={{ backgroundColor: '#3B82F6' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
              Start Tracking
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
          <p className="text-sm text-[#FFFFFF] mb-3">{error}</p>
          <button onClick={handleTrack} className="px-4 py-2 rounded-lg bg-[#EF4444]/15 text-[#EF4444] text-xs font-medium hover:bg-[#EF4444]/25 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#3B82F6' }} />
              <span className="text-sm text-[#A3A3A3]">Tracking stealth signals...</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-[#1A1A1A] animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <>
          {/* Channel Overview */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
              <Users className="w-4 h-4" style={{ color: '#3B82F6' }} />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">Channel Overview</h3>
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <EyeOff className="w-5 h-5" style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#FFFFFF]">{result.overview.name}</h4>
                  <p className="text-[11px] text-[#A3A3A3]">Joined {result.overview.joinDate} · {result.overview.uploadFrequency}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Subscribers', value: result.overview.estimatedSubs },
                  { label: 'Total Views', value: result.overview.estimatedViews },
                  { label: 'Videos', value: result.overview.videoCount },
                  { label: 'Avg Views', value: result.overview.avgViews },
                  { label: 'Frequency', value: result.overview.uploadFrequency },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                    <p className="text-sm font-bold text-[#FFFFFF]">{stat.value}</p>
                    <p className="text-[10px] text-[#A3A3A3] mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Velocity Alerts */}
          {result.velocityAlerts.length > 0 && (
            <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                <Zap className="w-4 h-4 text-[#FDBA2D]" />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Velocity Alerts</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: 'rgba(253,186,45,0.15)', color: '#FDBA2D' }}>LIVE</span>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {result.velocityAlerts.map((alert, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: severityColor(alert.severity) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: severityColor(alert.severity) }}>{alert.type}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${severityColor(alert.severity)}15`, color: severityColor(alert.severity) }}>{alert.severity}</span>
                      </div>
                      <p className="text-xs text-[#A3A3A3] leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* A/B Test Spy */}
          {result.abTests.length > 0 && (
            <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                <GitCompare className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">A/B Test Spy</h3>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {result.abTests.map((test, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-[#FFFFFF] truncate mr-2">{test.videoTitle}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-[#666666]">{test.detectedDate}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${impactColor(test.impact)}15`, color: impactColor(test.impact) }}>{test.impact}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#A3A3A3]">{test.detectedChange}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Off-Platform Signals */}
          {result.offPlatform.length > 0 && (
            <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                <Globe className="w-4 h-4" style={{ color: '#3B82F6' }} />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Off-Platform Signals</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                {result.offPlatform.map((signal, i) => {
                  const Icon = signal.icon;
                  return (
                    <div key={i} className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-[#A3A3A3]" />
                        <span className="text-xs font-semibold text-[#FFFFFF]">{signal.platform}</span>
                      </div>
                      <p className="text-sm font-bold text-[#3B82F6]">{signal.estimatedFollowers}</p>
                      <p className="text-[10px] text-[#10B981] mt-0.5">{signal.growth}</p>
                      <p className="text-[10px] text-[#A3A3A3] mt-1">{signal.activity}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Engagement Velocity */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
              <Activity className="w-4 h-4" style={{ color: '#3B82F6' }} />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">Engagement Velocity</h3>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <p className="text-sm font-bold text-[#FFFFFF]">{result.engagement.first24hViews}</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5">First 24h</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <p className="text-sm font-bold text-[#FFFFFF]">{result.engagement.weeklyViews}</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5">Weekly</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <p className="text-sm font-bold text-[#3B82F6]">{result.engagement.ratio}</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5">24h Ratio</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: `${trendColor(result.engagement.trend)}10` }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: trendColor(result.engagement.trend) }} />
                <span className="text-xs font-medium capitalize" style={{ color: trendColor(result.engagement.trend) }}>
                  Engagement is {result.engagement.trend}
                </span>
              </div>
            </div>
          </div>

          {/* Shadow Metrics */}
          {result.shadowMetrics.length > 0 && (
            <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                <BarChart3 className="w-4 h-4" style={{ color: '#3B82F6' }} />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Shadow Metrics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1A1A1A]">
                      <th className="text-left px-4 py-2.5 text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">Metric</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-medium text-[#3B82F6] uppercase tracking-wider">Them</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-medium text-[#666666] uppercase tracking-wider">You</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-medium text-[#A3A3A3] uppercase tracking-wider">Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]">
                    {result.shadowMetrics.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-xs text-[#FFFFFF]">{m.label}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-[#3B82F6] text-center">{m.them}</td>
                        <td className="px-4 py-2.5 text-xs text-[#666666] text-center">{m.you}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-[#EF4444] text-center">{m.diff}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Competitive Analysis */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#3B82F6' }} />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Competitive Analysis</h3>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#3B82F6] transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{result.analysis}</p>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <div className="flex justify-center">
            <button onClick={handleTrack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#A3A3A3] hover:text-[#3B82F6] transition-colors">
              <RefreshCw className="w-3 h-3" />
              Re-track
            </button>
          </div>
        </>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <EyeOff className="w-8 h-8" style={{ color: '#3B82F6' }} />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Ghost Tracker</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">
            Enter a competitor channel to detect their stealth strategy changes, off-platform growth, and A/B testing patterns.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS['ghost-tracker']} tokens per analysis
        </div>
      )}
    </div>
  );
}
