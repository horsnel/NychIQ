'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  Upload,
  Loader2,
  Sparkles,
  Link2,
  FileText,
  Eye,
  Palette,
  Fingerprint,
  ShieldCheck,
  TrendingUp,
  Clock,
  BarChart3,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  Flame,
  Users,
  RefreshCw,
  Copy,
  Check,
  Activity,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  DollarSign,
  Calendar,
  Lightbulb,
  BrainCircuit,
  Radar,
  CircleDot,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  Send,
} from 'lucide-react';

/* ════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════ */

type UploaderTab = 'analysis' | 'recent' | 'insights';

interface RetentionPoint {
  mark: string;
  seconds: number;
  retention: number;
  label: string;
}

interface LatestVideo {
  title: string;
  views: string;
  avgViewDuration: string;
  retentionRate: number;
  likes: string;
  ctr: string;
  engagement: number;
  published: string;
  /* Enhanced fields */
  retentionGraph: number[];
  sentimentPositive: number;
  sentimentNeutral: number;
  sentimentNegative: number;
  thumbnailScore: number;
  nicheAvgEngagement: number;
  ctrAnalysis: string;
}

interface DeeperAnalytics {
  audienceSatisfaction: number;
  hiddenGrowth: string;
  contentGaps: string[];
  optimalPostingWindow: string;
  aiSummary: string;
}

interface UploadAnalysis {
  retentionData: RetentionPoint[];
  brandScore: number;
  noveltyScore: number;
  authenticityScore: number;
  latestVideos: LatestVideo[];
  deeperAnalytics: DeeperAnalytics;
  overallVerdict: string;
  goNoGo: 'go' | 'nogo' | 'caution';
}

interface ChannelConfig {
  channelName?: string;
  niche?: string;
  tone?: string;
  targetAudience?: string;
  contentStyle?: string;
}

/* ════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════ */

const TOOL_COLOR = '#888888';
const TOOL_BG = 'rgba(255,255,255,0.03)';
const TOOL_BORDER = 'rgba(255,255,255,0.03)';
const TOOL_TOKEN_COST = 10;

const TABS: { id: UploaderTab; label: string; icon: React.ElementType }[] = [
  { id: 'analysis', label: 'Content Analysis', icon: BrainCircuit },
  { id: 'recent', label: 'Recent Videos', icon: Flame },
  { id: 'insights', label: 'Deep Insights', icon: Radar },
];

/* ── Score color helper ── */
function scoreColor(score: number): string {
  if (score >= 80) return '#888888';
  if (score >= 60) return '#F6A828';
  if (score >= 40) return '#888888';
  return '#888888';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 25) return 'Weak';
  return 'Poor';
}

function noveltyLevel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'High', color: '#888888' };
  if (score >= 45) return { label: 'Medium', color: '#F6A828' };
  return { label: 'Low', color: '#888888' };
}

/* ── Retention bar color based on value ── */
function retentionColor(retention: number): string {
  if (retention >= 70) return '#888888';
  if (retention >= 50) return '#F6A828';
  if (retention >= 30) return '#888888';
  return '#888888';
}

/* ════════════════════════════════════════════════
   MOCK DATA GENERATOR
   ════════════════════════════════════════════════ */

function generateRetentionGraph(base: number): number[] {
  const points: number[] = [];
  let val = base;
  for (let i = 0; i < 12; i++) {
    val = Math.max(5, val - (Math.random() * 8 + 2));
    points.push(Math.round(val));
  }
  return points;
}

function getMockAnalysis(input: string, channelConfig: ChannelConfig): UploadAnalysis {
  const niche = channelConfig.niche || 'technology';
  const brandBase = channelConfig.channelName ? 68 : 45;
  const hash = input.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const brandScore = Math.min(100, Math.max(20, brandBase + (hash % 20)));
  const noveltyScore = Math.min(100, Math.max(15, 42 + (hash % 45)));
  const authenticityScore = Math.min(100, Math.max(30, 55 + (hash % 35)));
  const overallAvg = Math.round((brandScore + noveltyScore + authenticityScore) / 3);
  const goNoGo: UploadAnalysis['goNoGo'] = overallAvg >= 70 ? 'go' : overallAvg >= 50 ? 'caution' : 'nogo';

  return {
    retentionData: [
      { mark: '0s', seconds: 0, retention: 100, label: 'Intro' },
      { mark: '30s', seconds: 30, retention: 82 + (hash % 12), label: 'Hook drop-off' },
      { mark: '1m', seconds: 60, retention: 68 + (hash % 15), label: 'Topic transition' },
      { mark: '3m', seconds: 180, retention: 54 + (hash % 10), label: 'Mid-roll risk' },
      { mark: '5m', seconds: 300, retention: 41 + (hash % 14), label: 'Deep dive point' },
      { mark: '10m', seconds: 600, retention: 28 + (hash % 12), label: 'Tail retention' },
    ],
    brandScore,
    noveltyScore,
    authenticityScore,
    latestVideos: [
      {
        title: `${niche.charAt(0).toUpperCase() + niche.slice(1)} Trends Breaking Down the Latest Changes`,
        views: '124.8K', avgViewDuration: '6:42', retentionRate: 58, likes: '8.2K', ctr: '7.3%',
        engagement: 6.8, published: '3 days ago',
        retentionGraph: generateRetentionGraph(92),
        sentimentPositive: 68, sentimentNeutral: 24, sentimentNegative: 8,
        thumbnailScore: 74, nicheAvgEngagement: 5.2,
        ctrAnalysis: 'CTR 42% above niche average — strong thumbnail/title combo',
      },
      {
        title: `Complete ${niche.charAt(0).toUpperCase() + niche.slice(1)} Guide for Beginners in 2025`,
        views: '89.3K', avgViewDuration: '9:15', retentionRate: 48, likes: '5.6K', ctr: '5.9%',
        engagement: 5.4, published: '1 week ago',
        retentionGraph: generateRetentionGraph(85),
        sentimentPositive: 72, sentimentNeutral: 20, sentimentNegative: 8,
        thumbnailScore: 61, nicheAvgEngagement: 5.2,
        ctrAnalysis: 'CTR near niche average — consider A/B testing thumbnail variants',
      },
      {
        title: `Honest Review: ${niche.charAt(0).toUpperCase() + niche.slice(1)} Tools That Actually Work`,
        views: '203.1K', avgViewDuration: '5:03', retentionRate: 72, likes: '14.7K', ctr: '9.1%',
        engagement: 8.9, published: '2 weeks ago',
        retentionGraph: generateRetentionGraph(96),
        sentimentPositive: 81, sentimentNeutral: 14, sentimentNegative: 5,
        thumbnailScore: 88, nicheAvgEngagement: 5.2,
        ctrAnalysis: 'CTR 78% above niche average — exceptional title curiosity gap',
      },
    ],
    deeperAnalytics: {
      audienceSatisfaction: 67 + (hash % 20),
      hiddenGrowth: 'Your content has untapped potential in the 18-24 demographic segment. Cross-platform promotion on Shorts could yield an estimated 40-60% subscriber boost within 30 days based on niche performance benchmarks.',
      contentGaps: [
        `There is high search demand for "${niche} for beginners 2025" with low competition — an opportunity for your next upload.`,
        'Your audience consistently asks about practical tutorials but most of your recent content is review/opinion based.',
        `Seasonal ${niche} content around Q2 trends shows 3.2x higher engagement than evergreen topics in this niche.`,
      ],
      optimalPostingWindow: 'Tuesday 2:00 PM – 4:00 PM (EST) or Thursday 3:00 PM – 5:00 PM (EST) — your audience engagement data shows 42% higher CTR during these windows.',
      aiSummary: `Based on the analysis of "${input.slice(0, 60)}${input.length > 60 ? '...' : ''}", this video has moderate-to-strong potential. The ${niche} niche is competitive but there are clear content gaps you can exploit. Focus on strengthening your hook in the first 30 seconds and front-loading value to improve retention past the 3-minute mark.`,
    },
    overallVerdict: goNoGo === 'go'
      ? 'Strong signal detected. This content aligns well with your brand and shows high audience demand. Recommended to proceed with minor optimizations to the hook and mid-video pacing.'
      : goNoGo === 'caution'
      ? 'Moderate potential with some risk factors. The content has merit but needs refinement in hook strength and topic differentiation. Consider reworking the angle before uploading.'
      : 'Weak signal detected. This content idea shows low novelty and may struggle to differentiate in the current algorithm landscape. Recommend pivoting to one of the suggested alternatives.',
    goNoGo,
  };
}

function getSuggestedIdeas(niche: string): string[] {
  const ideas: Record<string, string[]> = {
    technology: [
      'I Built an AI Agent That Replaces My Entire Workflow — Here\'s What Happened',
      'The Hidden Feature in [Tool] That 99% of Developers Don\'t Know About',
      'I Compared Every [Category] App in 2025 — Only 3 Are Worth Using',
    ],
    general: [
      'The Strategy That 10x\'d My Results in 30 Days (With Proof)',
      'Everyone Gets This Wrong About [Topic] — Here\'s the Truth',
      'I Tried the Latest Trend for a Week and the Results Shocked Me',
    ],
  };
  const nicheIdeas = ideas[niche.toLowerCase()] || ideas.general;
  return nicheIdeas.length >= 3 ? nicheIdeas : ideas.general;
}

/* ════════════════════════════════════════════════
   SHARED DESIGN COMPONENTS (from studio-tool.tsx)
   ════════════════════════════════════════════════ */

/* ── Tactical Corner Bracket ── */
function TacticalCorners({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative ${className}`} style={style}>
      <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[#888888] opacity-40 rounded-tl-sm pointer-events-none" />
      <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[#888888] opacity-40 rounded-tr-sm pointer-events-none" />
      <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[#888888] opacity-40 rounded-bl-sm pointer-events-none" />
      <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[#888888] opacity-40 rounded-br-sm pointer-events-none" />
      {children}
    </div>
  );
}

/* ── Scanning Line Animation ── */
function ScanLine() {
  return (
    <div className="relative w-full overflow-hidden h-1 rounded-full bg-[#1A1A1A]">
      <div
        className="absolute inset-y-0 w-1/3 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #888888, transparent)',
          animation: 'scanLine 2s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes scanLine {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

/* ── Glow Pulse Dot ── */
function GlowDot({ color = '#888888' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
    </span>
  );
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════ */

/* ── Circular Score Gauge with glow ── */
function ScoreGauge({ score, label, icon: Icon, size = 88, showGlow = false }: {
  score: number;
  label: string;
  icon: React.ElementType;
  size?: number;
  showGlow?: boolean;
}) {
  const color = scoreColor(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size, ...(showGlow ? { filter: `drop-shadow(0 0 8px ${color}40)` } : {}) }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#1A1A1A" strokeWidth="6" />
          <circle
            cx={center} cy={center} r={radius} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-3.5 h-3.5 mb-0.5" style={{ color }} />
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-[#FFFFFF]">{label}</p>
        <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{scoreLabel(score)}</p>
      </div>
    </div>
  );
}

/* ── Go / No-Go / Caution Verdict Badge ── */
function GoNoGoBadge({ verdict }: { verdict: 'go' | 'nogo' | 'caution' }) {
  const config = {
    go: { label: 'GO', color: '#888888', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.1)', icon: CheckCircle2, desc: 'Strong signal — recommended to publish' },
    nogo: { label: 'NO-GO', color: '#888888', bg: 'rgba(136,136,136,0.2)', border: 'rgba(136,136,136,0.2)', icon: XCircle, desc: 'Weak signal — recommend pivoting' },
    caution: { label: 'CAUTION', color: '#F6A828', bg: 'rgba(246,168,40,0.12)', border: 'rgba(246,168,40,0.3)', icon: AlertTriangle, desc: 'Moderate potential — optimize before publishing' },
  }[verdict];
  const Icon = config.icon;

  return (
    <TacticalCorners className="rounded-lg p-4" style={{ backgroundColor: config.bg }}>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: config.border, boxShadow: `0 0 16px ${config.color}30` }}
        >
          <Icon className="w-6 h-6" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-wider" style={{ color: config.color }}>{config.label}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}>VERDICT</span>
          </div>
          <p className="text-xs text-[#a0a0a0] mt-0.5">{config.desc}</p>
        </div>
      </div>
    </TacticalCorners>
  );
}

/* ── Retention Bar Chart (SVG) ── */
function RetentionChart({ data }: { data: RetentionPoint[] }) {
  const chartW = 100;
  const chartH = 160;
  const barW = 10;
  const gap = (chartW - barW * data.length) / (data.length - 1);
  const maxRetention = 100;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${chartW + 20} ${chartH + 40}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {[100, 75, 50, 25, 0].map((pct) => {
          const y = 10 + ((100 - pct) / maxRetention) * chartH;
          return (
            <g key={pct}>
              <line x1="10" y1={y} x2={chartW + 10} y2={y} stroke="#1A1A1A" strokeWidth="0.5" />
              <text x="6" y={y + 3} fill="#666666" fontSize="3.5" textAnchor="end">{pct}%</text>
            </g>
          );
        })}
        {data.map((point, i) => {
          const x = 10 + i * (barW + gap);
          const barHeight = (point.retention / maxRetention) * chartH;
          const y = 10 + chartH - barHeight;
          const color = retentionColor(point.retention);
          return (
            <g key={point.mark}>
              <rect x={x} y={y} width={barW} height={barHeight} rx={3} ry={3} fill={color} opacity={0.85} style={{ transition: 'all 0.6s ease-out' }} />
              <text x={x + barW / 2} y={y - 3} fill={color} fontSize="4" textAnchor="middle" fontWeight="bold">{point.retention}%</text>
              <text x={x + barW / 2} y={10 + chartH + 10} fill="#a0a0a0" fontSize="3.5" textAnchor="middle" fontWeight="500">{point.mark}</text>
              <text x={x + barW / 2} y={10 + chartH + 16} fill="#666666" fontSize="2.5" textAnchor="middle">{point.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Mini Retention Sparkline (for video cards) ── */
function MiniRetentionGraph({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
      <defs>
        <linearGradient id={`grad-${data[0]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TOOL_COLOR} stopOpacity="0.3" />
          <stop offset="100%" stopColor={TOOL_COLOR} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${data[0]})`} />
      <polyline points={points} fill="none" stroke={TOOL_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Metric Pill ── */
function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md bg-[#0f0f0f] border border-[#1A1A1A] px-2 py-1.5 text-center">
      <p className="text-[9px] text-[#666666] uppercase tracking-wider">{label}</p>
      <p className="text-[11px] font-semibold mt-0.5" style={{ color: color || '#FFFFFF' }}>{value}</p>
    </div>
  );
}

/* ── Enhanced Video Card ── */
function EnhancedVideoCard({ video, index }: { video: LatestVideo; index: number }) {
  const retColor = retentionColor(video.retentionRate);
  const sentColor = video.sentimentPositive >= 70 ? '#888888' : video.sentimentPositive >= 50 ? '#F6A828' : '#888888';
  const thumbColor = video.thumbnailScore >= 75 ? '#888888' : video.thumbnailScore >= 50 ? '#F6A828' : '#888888';
  const engDiff = video.engagement - video.nicheAvgEngagement;
  const engPositive = engDiff >= 0;

  return (
    <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 hover:border-[rgba(255,255,255,0.03)] transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ backgroundColor: `${TOOL_COLOR}15`, color: TOOL_COLOR }}
        >
          #{index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#FFFFFF] line-clamp-2 leading-relaxed">{video.title}</p>
          <p className="text-[10px] text-[#666666] mt-1">{video.published}</p>
        </div>
      </div>

      {/* Mini retention graph */}
      <div className="mb-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A] p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-[#666666] uppercase tracking-wider">Retention Curve</span>
          <span className="text-[10px] font-bold" style={{ color: retColor }}>{video.retentionRate}% avg</span>
        </div>
        <MiniRetentionGraph data={video.retentionGraph} />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
        <MetricPill label="Views" value={video.views} />
        <MetricPill label="Avg. Watch" value={video.avgViewDuration} />
        <MetricPill label="CTR" value={video.ctr} color={parseFloat(video.ctr) >= 7 ? '#888888' : '#FFFFFF'} />
        <MetricPill label="Likes" value={video.likes} />
        <MetricPill label="Thumbnail" value={`${video.thumbnailScore}/100`} color={thumbColor} />
        <MetricPill
          label="Engagement"
          value={`${video.engagement}%`}
          color={scoreColor(video.engagement)}
        />
      </div>

      {/* Engagement vs Niche */}
      <div className="rounded-md bg-[#0a0a0a] border border-[#1A1A1A] p-2 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#666666] uppercase tracking-wider">Engagement vs Niche Avg</span>
          <div className="flex items-center gap-1">
            {engPositive ? <ArrowUpRight className="w-3 h-3 text-[#888888]" /> : <ArrowDownRight className="w-3 h-3 text-[#888888]" />}
            <span className="text-[10px] font-bold" style={{ color: engPositive ? '#888888' : '#888888' }}>
              {engPositive ? '+' : ''}{engDiff.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden mt-1.5">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (video.engagement / 10) * 100)}%`, backgroundColor: scoreColor(video.engagement) }} />
        </div>
      </div>

      {/* CTR Analysis */}
      <div className="rounded-md bg-[#0a0a0a] border border-[#1A1A1A] p-2 mb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Target className="w-3 h-3 text-[#F6A828]" />
          <span className="text-[9px] text-[#666666] uppercase tracking-wider">CTR Analysis</span>
        </div>
        <p className="text-[10px] text-[#a0a0a0] leading-relaxed">{video.ctrAnalysis}</p>
      </div>

      {/* Sentiment breakdown */}
      <div className="rounded-md bg-[#0a0a0a] border border-[#1A1A1A] p-2">
        <div className="flex items-center gap-1.5 mb-2">
          <MessageSquare className="w-3 h-3" style={{ color: TOOL_COLOR }} />
          <span className="text-[9px] text-[#666666] uppercase tracking-wider">Comment Sentiment</span>
        </div>
        <div className="flex gap-1.5 h-2 rounded-full overflow-hidden">
          <div className="rounded-l-full" style={{ width: `${video.sentimentPositive}%`, backgroundColor: '#888888' }} title="Positive" />
          <div style={{ width: `${video.sentimentNeutral}%`, backgroundColor: '#F6A828' }} title="Neutral" />
          <div className="rounded-r-full" style={{ width: `${video.sentimentNegative}%`, backgroundColor: '#888888' }} title="Negative" />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-2.5 h-2.5 text-[#888888]" />
            <span className="text-[9px] text-[#a0a0a0]">{video.sentimentPositive}%</span>
          </div>
          <div className="flex items-center gap-1">
            <CircleDot className="w-2.5 h-2.5 text-[#F6A828]" />
            <span className="text-[9px] text-[#a0a0a0]">{video.sentimentNeutral}%</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="w-2.5 h-2.5 text-[#888888]" />
            <span className="text-[9px] text-[#a0a0a0]">{video.sentimentNegative}%</span>
          </div>
        </div>
      </div>
    </TacticalCorners>
  );
}

/* ── Heatmap Grid (Viewer Behavior) ── */
function HeatmapGrid() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];

  // Generate heatmap data (higher values = more viewer activity)
  const heatData = [
    [15, 30, 55, 72, 60, 45],
    [20, 45, 68, 88, 65, 50],
    [18, 40, 62, 78, 58, 42],
    [22, 48, 70, 92, 68, 55],
    [25, 50, 72, 82, 75, 62],
    [35, 55, 65, 58, 70, 78],
    [30, 48, 58, 52, 65, 72],
  ];

  const getHeatColor = (val: number): string => {
    if (val >= 80) return 'rgba(34,197,94,0.1)';
    if (val >= 65) return 'rgba(34,197,94,0.1)';
    if (val >= 50) return 'rgba(246,168,40,0.5)';
    if (val >= 35) return 'rgba(246,168,40,0.25)';
    return 'rgba(255,255,255,0.03)';
  };

  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: '40px repeat(6, 1fr)' }}>
        {/* Header row */}
        <div />
        {hours.map((h) => (
          <div key={h} className="text-[8px] text-[#666666] text-center">{h}</div>
        ))}
        {/* Data rows */}
        {days.map((day, di) => (
          <React.Fragment key={day}>
            <div className="text-[9px] text-[#666666] flex items-center">{day}</div>
            {heatData[di].map((val, hi) => (
              <div
                key={`${di}-${hi}`}
                className="h-7 rounded-sm flex items-center justify-center text-[8px] font-bold transition-colors"
                style={{ backgroundColor: getHeatColor(val), color: val >= 60 ? '#FFFFFF' : '#a0a0a0' }}
                title={`${day} ${hours[hi]}: ${val}% activity`}
              >
                {val}%
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="text-[8px] text-[#666666]">Low</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#1a1a1a' }} />
          <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'rgba(246,168,40,0.25)' }} />
          <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'rgba(246,168,40,0.5)' }} />
          <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#1a1a1a' }} />
          <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#1a1a1a' }} />
        </div>
        <span className="text-[8px] text-[#666666]">High</span>
      </div>
    </div>
  );
}

/* ── CPM Analysis Bars ── */
function CPMAnalysis() {
  const categories = [
    { label: 'Technology', cpm: 18.50, avg: 12.00 },
    { label: 'Finance', cpm: 24.00, avg: 16.00 },
    { label: 'Education', cpm: 14.20, avg: 10.50 },
    { label: 'Entertainment', cpm: 8.50, avg: 7.00 },
    { label: 'Gaming', cpm: 6.80, avg: 5.50 },
  ];

  const maxCpm = Math.max(...categories.map(c => c.cpm));

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const barWidth = (cat.cpm / maxCpm) * 100;
        const avgWidth = (cat.avg / maxCpm) * 100;
        return (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#a0a0a0]">{cat.label}</span>
              <span className="text-[10px] font-bold text-[#F6A828]">${cat.cpm.toFixed(2)}</span>
            </div>
            <div className="relative h-3 rounded-full bg-[#1A1A1A] overflow-hidden">
              {/* Niche average line */}
              <div
                className="absolute top-0 h-full rounded-full bg-[#1a1a1a] opacity-50"
                style={{ width: `${avgWidth}%` }}
              />
              {/* Your CPM bar */}
              <div
                className="absolute top-0 h-full rounded-full transition-all duration-700"
                style={{ width: `${barWidth}%`, backgroundColor: '#F6A828', boxShadow: '0 0 8px rgba(246,168,40,0.3)' }}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-sm bg-[#F6A828]" />
          <span className="text-[8px] text-[#666666]">Your est. CPM</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-sm bg-[#1a1a1a]" />
          <span className="text-[8px] text-[#666666]">Niche avg</span>
        </div>
      </div>
    </div>
  );
}

/* ── Demographics Breakdown ── */
function DemographicsBreakdown() {
  const ageData = [
    { label: '18-24', pct: 32, color: '#888888' },
    { label: '25-34', pct: 38, color: '#888888' },
    { label: '35-44', pct: 17, color: '#F6A828' },
    { label: '45-54', pct: 8, color: '#888888' },
    { label: '55+', pct: 5, color: '#888888' },
  ];

  const genderData = [
    { label: 'Male', pct: 62, color: '#888888' },
    { label: 'Female', pct: 31, color: '#888888' },
    { label: 'Other', pct: 7, color: '#F6A828' },
  ];

  return (
    <div className="space-y-4">
      {/* Age */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Users className="w-3.5 h-3.5 text-[#888888]" />
          <span className="text-[10px] text-[#666666] uppercase tracking-wider font-bold">Age Distribution</span>
        </div>
        <div className="space-y-2">
          {ageData.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="text-[10px] text-[#a0a0a0] w-10 shrink-0">{d.label}</span>
              <div className="flex-1 h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
              </div>
              <span className="text-[10px] font-bold w-8 text-right" style={{ color: d.color }}>{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Users className="w-3.5 h-3.5 text-[#888888]" />
          <span className="text-[10px] text-[#666666] uppercase tracking-wider font-bold">Gender Split</span>
        </div>
        <div className="flex gap-1.5 h-3 rounded-full overflow-hidden">
          {genderData.map((d) => (
            <div key={d.label} style={{ width: `${d.pct}%`, backgroundColor: d.color }} className="rounded-full" title={`${d.label}: ${d.pct}%`} />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {genderData.map((d) => (
            <div key={d.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[9px] text-[#a0a0a0]">{d.label} {d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Scanning Steps (for loading) ── */
const SCANNING_STEPS = [
  { label: 'Analyzing content idea against channel brand DNA', icon: <BrainCircuit className="w-4 h-4" /> },
  { label: 'Simulating audience retention flow', icon: <Eye className="w-4 h-4" /> },
  { label: 'Scanning niche for saturation & novelty', icon: <Fingerprint className="w-4 h-4" /> },
  { label: 'Evaluating authenticity signals', icon: <ShieldCheck className="w-4 h-4" /> },
  { label: 'Generating Go/No-Go verdict', icon: <Sparkles className="w-4 h-4" /> },
];

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export function NextUploaderTool() {
  const { spendTokens } = useNychIQStore();
  const [activeTab, setActiveTab] = useState<UploaderTab>('analysis');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadAnalysis | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedVerdict, setCopiedVerdict] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [channelConfig, setChannelConfig] = useState<ChannelConfig>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nychiq_channel_assistant_config');
      if (stored) setChannelConfig(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const isYouTubeUrl = (text: string) =>
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(text.trim());

  const handleAnalyze = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);
    setScanStep(0);

    const ok = spendTokens('next-uploader');
    if (!ok) { setLoading(false); return; }

    try {
      /* Step-by-step scanning animation */
      for (let i = 0; i < SCANNING_STEPS.length; i++) {
        setScanStep(i);
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
      }

      const isUrl = isYouTubeUrl(trimmed);
      const inputType = isUrl ? 'YouTube URL' : 'topic/title';

      const prompt = `You are a YouTube pre-upload intelligence analyst for the NychIQ platform. Analyze the following ${inputType} BEFORE upload and predict performance.

${isUrl ? `Video URL: ${trimmed}` : `Video Topic/Title: ${trimmed}`}

Channel context:
- Channel: ${channelConfig.channelName || 'Unknown'}
- Niche: ${channelConfig.niche || 'General'}
- Tone: ${channelConfig.tone || 'Informational'}
- Target Audience: ${channelConfig.targetAudience || 'General YouTube audience'}
- Content Style: ${channelConfig.contentStyle || 'Mixed'}

Return a JSON object with these exact keys:
- "retentionData": Array of 6 objects with keys: "mark" (e.g. "0s", "30s", "1m", "3m", "5m", "10m"), "seconds" (number), "retention" (0-100, decreasing), "label" (brief description of drop-off reason)
- "brandScore": Brand consistency score 0-100
- "noveltyScore": Content uniqueness score 0-100
- "authenticityScore": Authenticity judgment 0-100
- "latestVideos": Array of 3 objects, each with: "title", "views" (e.g. "124.8K"), "avgViewDuration" (e.g. "6:42"), "retentionRate" (0-100), "likes" (e.g. "8.2K"), "ctr" (e.g. "7.3%"), "engagement" (0-100), "published" (e.g. "3 days ago")
- "deeperAnalytics": Object with: "audienceSatisfaction" (0-100), "hiddenGrowth" (2-3 sentences), "contentGaps" (array of 3 strings), "optimalPostingWindow" (detailed recommendation), "aiSummary" (3-4 sentence analysis)
- "overallVerdict": 2-3 sentence verdict on expected performance

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const mock = getMockAnalysis(trimmed, channelConfig);

      const brandScore = Math.min(100, Math.max(0, parseInt(parsed.brandScore, 10) || 50));
      const noveltyScore = Math.min(100, Math.max(0, parseInt(parsed.noveltyScore, 10) || 50));
      const authenticityScore = Math.min(100, Math.max(0, parseInt(parsed.authenticityScore, 10) || 50));
      const overallAvg = Math.round((brandScore + noveltyScore + authenticityScore) / 3);
      const goNoGo: UploadAnalysis['goNoGo'] = overallAvg >= 70 ? 'go' : overallAvg >= 50 ? 'caution' : 'nogo';

      setResult({
        retentionData: Array.isArray(parsed.retentionData)
          ? parsed.retentionData.map((r: any) => ({
              mark: r.mark || '', seconds: typeof r.seconds === 'number' ? r.seconds : 0,
              retention: Math.min(100, Math.max(0, parseInt(r.retention, 10) || 50)), label: r.label || '',
            }))
          : mock.retentionData,
        brandScore, noveltyScore, authenticityScore,
        latestVideos: Array.isArray(parsed.latestVideos)
          ? parsed.latestVideos.slice(0, 3).map((v: any) => ({
              title: v.title || 'Untitled Video', views: v.views || '0',
              avgViewDuration: v.avgViewDuration || '0:00',
              retentionRate: Math.min(100, Math.max(0, parseInt(v.retentionRate, 10) || 50)),
              likes: v.likes || '0', ctr: v.ctr || '0%',
              engagement: Math.min(100, Math.max(0, parseInt(v.engagement, 10) || 50)),
              published: v.published || 'recently',
              retentionGraph: generateRetentionGraph(80 + Math.random() * 15),
              sentimentPositive: 55 + Math.floor(Math.random() * 30),
              sentimentNeutral: 10 + Math.floor(Math.random() * 20),
              sentimentNegative: 3 + Math.floor(Math.random() * 10),
              thumbnailScore: 50 + Math.floor(Math.random() * 40),
              nicheAvgEngagement: 5.2,
              ctrAnalysis: v.ctr ? `CTR analysis for this video — ${parseFloat(v.ctr) >= 7 ? 'above' : 'near'} niche average` : mock.latestVideos[0].ctrAnalysis,
            }))
          : mock.latestVideos,
        deeperAnalytics: parsed.deeperAnalytics
          ? {
              audienceSatisfaction: Math.min(100, Math.max(0, parseInt(parsed.deeperAnalytics.audienceSatisfaction, 10) || 50)),
              hiddenGrowth: parsed.deeperAnalytics.hiddenGrowth || '',
              contentGaps: Array.isArray(parsed.deeperAnalytics.contentGaps) ? parsed.deeperAnalytics.contentGaps.slice(0, 3) : [],
              optimalPostingWindow: parsed.deeperAnalytics.optimalPostingWindow || '',
              aiSummary: parsed.deeperAnalytics.aiSummary || '',
            }
          : mock.deeperAnalytics,
        overallVerdict: parsed.overallVerdict || 'Analysis complete.',
        goNoGo,
      });
    } catch {
      setResult(getMockAnalysis(trimmed, channelConfig));
    } finally {
      setLoading(false);
    }
  }, [input, spendTokens, channelConfig]);

  const handleCopyVerdict = async () => {
    if (!result) return;
    const text = `NEXT UPLOADER — Pre-Upload Analysis Report\n\nVerdict: ${result.goNoGo.toUpperCase()}\n${result.overallVerdict}\n\nBrand Consistency: ${result.brandScore}/100\nNovelty Score: ${result.noveltyScore}/100\nAuthenticity: ${result.authenticityScore}/100\n\nRetention Predictions:\n${result.retentionData.map(r => `  ${r.mark}: ${r.retention}% (${r.label})`).join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopiedVerdict(true);
    showToast('Report copied to clipboard', 'success');
    setTimeout(() => setCopiedVerdict(false), 2000);
  };

  const handleUseIdea = useCallback((idea: string) => {
    setInput(idea);
    setActiveTab('analysis');
  }, []);

  const niche = channelConfig.niche || 'general';
  const suggestedIdeas = getSuggestedIdeas(niche);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* ──────── HEADER CARD WITH TABS ──────── */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 relative">
          {/* Background grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#888888 1px, transparent 1px), linear-gradient(90deg, #888888 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10">
            {/* Title row */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg border" style={{ borderColor: `${TOOL_BORDER}`, background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }}>
                <Upload className="w-5 h-5" style={{ color: TOOL_COLOR }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#FFFFFF] tracking-tight">Next Uploader AI</h2>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ color: TOOL_COLOR, backgroundColor: TOOL_BG, border: `1px solid ${TOOL_BORDER}` }}>AGENT</span>
                </div>
                <p className="text-[11px] text-[#a0a0a0] mt-0.5">Pre-Upload Intelligence — Analyze before you publish</p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: TOOL_BG, border: `1px solid ${TOOL_BORDER}` }}>
                <Zap className="w-3 h-3" style={{ color: TOOL_COLOR }} />
                <span className="text-[10px] font-bold" style={{ color: TOOL_COLOR }}>{TOOL_TOKEN_COST} TOKENS / ANALYSIS</span>
              </div>
            </div>

            <ScanLine />

            {/* Tab bar */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 mt-3 -mb-1 scrollbar-none">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-[#888888] border shadow-[rgba(0,0,0,0.3)]'
                      : 'text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] border border-transparent'
                  }`}
                  style={activeTab === tab.id ? { backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.03)' } : undefined}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ──────── CONTENT ANALYSIS TAB ──────── */}
      {activeTab === 'analysis' && (
        <div className="space-y-4">
          {/* Input Section */}
          <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <p className="text-sm text-[#a0a0a0] mb-3">
              Paste a YouTube URL or enter a video topic/title. AI predicts performance metrics
              including audience retention, brand alignment, and growth potential.
            </p>
            <div className="space-y-2">
              <div className="relative group">
                {/* Conic gradient rotating border on hover */}
                <div
                  className="absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'conic-gradient(from var(--angle, 0deg), #888888, #888888, #888888, #F6A828, #888888, #888888)',
                    animation: 'rotateBorder 3s linear infinite',
                  }}
                />
                <style>{`
                  @keyframes rotateBorder {
                    from { --angle: 0deg; }
                    to { --angle: 360deg; }
                  }
                  @property --angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                  }
                `}</style>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      {isYouTubeUrl(input) ? (
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                      ) : (
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                      )}
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
                        placeholder="Paste YouTube URL or enter video topic/title..."
                        className="w-full h-12 pl-10 pr-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/40 transition-all duration-300"
                        style={{ caretColor: TOOL_COLOR }}
                      />
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={loading || !input.trim()}
                      className="px-5 h-12 rounded-full text-[#0a0a0a] text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 shadow-[rgba(0,0,0,0.3)] hover:shadow-[rgba(0,0,0,0.3)]"
                      style={{ backgroundColor: TOOL_COLOR }}
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Scanning</span></>
                      ) : (
                        <><Sparkles className="w-4 h-4" /><span className="hidden sm:inline">Analyze</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Channel Config indicator */}
              {channelConfig.channelName && (
                <div className="flex items-center gap-1.5 px-2">
                  <Info className="w-3 h-3 text-[#666666]" />
                  <span className="text-[10px] text-[#666666]">
                    Analyzing for: <span className="text-[#a0a0a0]">{channelConfig.channelName}</span>
                    {channelConfig.niche && <> · Niche: <span className="text-[#a0a0a0]">{channelConfig.niche}</span></>}
                  </span>
                </div>
              )}

              {searched && !loading && (
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[rgba(255,255,255,0.03)] text-xs text-[#a0a0a0] hover:bg-[#1A1A1A] hover:text-[#FFFFFF] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Re-analyze
                </button>
              )}
            </div>
          </TacticalCorners>

          {/* Suggested Ideas (only when no input and not loading/searched) */}
          {!input.trim() && !loading && !searched && (
            <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(246,168,40,0.2) 0%, transparent 70%)' }}>
                  <Lightbulb className="w-4 h-4 text-[#F6A828]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#FFFFFF]">Suggested Ideas</h3>
                  <p className="text-[10px] text-[#a0a0a0]">AI-generated based on deep analysis of your niche</p>
                </div>
              </div>
              <div className="space-y-2">
                {suggestedIdeas.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => handleUseIdea(idea)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.03)] transition-all group text-left"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: TOOL_BG }}>
                      <span className="text-[10px] font-bold" style={{ color: TOOL_COLOR }}>{i + 1}</span>
                    </div>
                    <p className="text-xs text-[#FFFFFF] line-clamp-2 flex-1 leading-relaxed">{idea}</p>
                    <Send className="w-3.5 h-3.5 text-[#666666] group-hover:text-[#888888] transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </TacticalCorners>
          )}

          {/* ── Loading State (Scanning Animation) ── */}
          {loading && (
            <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-5 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <Radar className="w-5 h-5 text-[#888888] animate-pulse" />
                </div>
                <span className="text-sm font-bold text-[#FFFFFF]">Running Deep Analysis...</span>
                <span className="ml-auto text-[10px] text-[#a0a0a0] font-mono">{scanStep + 1}/{SCANNING_STEPS.length}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden mb-5">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${((scanStep + 1) / SCANNING_STEPS.length) * 100}%`,
                    background: 'linear-gradient(90deg, #888888, #888888)',
                    boxShadow: '0 0 10px rgba(255,255,255,0.03)',
                  }}
                />
              </div>
              <div className="space-y-3">
                {SCANNING_STEPS.map((step, i) => {
                  const isComplete = i < scanStep;
                  const isActive = i === scanStep;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{
                          backgroundColor: isComplete ? 'rgba(34,197,94,0.1)' : isActive ? 'rgba(255,255,255,0.03)' : '#1A1A1A',
                          border: `1px solid ${isComplete ? 'rgba(34,197,94,0.1)' : isActive ? 'rgba(255,255,255,0.03)' : '#0f0f0f'}`,
                        }}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#888888]" />
                        ) : isActive ? (
                          <span style={{ color: '#aaa' }}>{step.icon}</span>
                        ) : (
                          <span className="text-[10px] text-[#666666] font-mono">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs transition-all duration-300 ${isComplete ? 'text-[#a0a0a0]' : isActive ? 'text-[#FFFFFF]' : 'text-[#666666]'}`}>
                        {step.label}
                      </span>
                      {isComplete && <Check className="w-3 h-3 text-[#888888] ml-auto" />}
                      {isActive && <Loader2 className="w-3 h-3 text-[#888888] ml-auto animate-spin" />}
                    </div>
                  );
                })}
              </div>
            </TacticalCorners>
          )}

          {/* ── Error State ── */}
          {error && (
            <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-5 text-center">
              <AlertTriangle className="w-8 h-8 text-[#888888] mx-auto mb-2" />
              <p className="text-sm text-[#FFFFFF]">{error}</p>
              <button onClick={handleAnalyze} className="mt-3 px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: TOOL_COLOR, color: '#0a0a0a' }}>Try Again</button>
            </div>
          )}

          {/* ── Analysis Results ── */}
          {!loading && result && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Go/No-Go Verdict */}
              <GoNoGoBadge verdict={result.goNoGo} />

              {/* Overall Verdict Text */}
              <div className="rounded-lg p-4 border flex items-start gap-3" style={{ backgroundColor: `${TOOL_COLOR}08`, borderColor: `${TOOL_COLOR}25` }}>
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: TOOL_COLOR }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-xs font-bold text-[#FFFFFF]">Analysis Report</h3>
                    <button onClick={handleCopyVerdict} className="flex items-center gap-1 text-[10px] text-[#a0a0a0] hover:text-[#FFFFFF] transition-colors shrink-0">
                      {copiedVerdict ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
                      {copiedVerdict ? 'Copied' : 'Copy Report'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#a0a0a0] leading-relaxed">{result.overallVerdict}</p>
                </div>
              </div>

              {/* Core Scores with Gauges */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-5">
                <h3 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-5 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: TOOL_COLOR }} />
                  Core Scores
                </h3>
                <div className="flex items-start justify-around sm:justify-center sm:gap-12">
                  <ScoreGauge score={result.brandScore} label="Brand Consistency" icon={Palette} showGlow />
                  <ScoreGauge score={result.noveltyScore} label="Novelty" icon={Fingerprint} showGlow />
                  <ScoreGauge score={result.authenticityScore} label="Authenticity" icon={ShieldCheck} showGlow />
                </div>
                {/* Novelty Level Badge */}
                <div className="flex items-center justify-center mt-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{
                    color: noveltyLevel(result.noveltyScore).color,
                    backgroundColor: `${noveltyLevel(result.noveltyScore).color}15`,
                    border: `1px solid ${noveltyLevel(result.noveltyScore).color}30`,
                  }}>
                    <Fingerprint className="w-3 h-3" />
                    Novelty: {noveltyLevel(result.noveltyScore).label}
                  </span>
                </div>
              </TacticalCorners>

              {/* Audience Retention Simulation */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" style={{ color: TOOL_COLOR }} />
                    Audience Retention Simulation
                  </h3>
                  <span className="text-[10px] text-[#666666]">Predicted drop-off</span>
                </div>
                <RetentionChart data={result.retentionData} />
                <div className="mt-4 space-y-1.5">
                  {result.retentionData.slice(1).map((point, i) => {
                    const prev = result.retentionData[i].retention;
                    const drop = prev - point.retention;
                    const isHighDrop = drop >= 20;
                    return (
                      <div key={point.mark} className="flex items-center gap-2 text-[10px]">
                        {isHighDrop ? <AlertTriangle className="w-3 h-3 text-[#F6A828] shrink-0" /> : <div className="w-3 shrink-0" />}
                        <span className="text-[#a0a0a0]">
                          <span className="text-[#FFFFFF] font-medium">{point.mark}</span> &mdash; {point.label}
                        </span>
                        {isHighDrop && <span className="font-bold text-[#F6A828]">(-{drop}% drop)</span>}
                      </div>
                    );
                  })}
                </div>
              </TacticalCorners>
            </div>
          )}

          {/* ── Initial Idle State ── */}
          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: TOOL_BG, border: `1px solid ${TOOL_BORDER}` }}>
                <Upload className="w-8 h-8" style={{ color: TOOL_COLOR }} />
              </div>
              <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Pre-Upload Intelligence</h3>
              <p className="text-sm text-[#a0a0a0] max-w-xs text-center mb-6">
                Enter a video idea above or click a suggestion to get a full performance prediction.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full">
                {[
                  { icon: Eye, label: 'Retention Simulation', desc: 'Predicted viewer drop-off' },
                  { icon: Palette, label: 'Brand Alignment', desc: 'Consistency scoring' },
                  { icon: Fingerprint, label: 'Novelty Check', desc: 'Content uniqueness' },
                  { icon: ShieldCheck, label: 'Authenticity', desc: 'Over-saturation detect' },
                  { icon: BarChart3, label: 'Go/No-Go Verdict', desc: 'AI publish recommendation' },
                  { icon: Activity, label: 'Deep Insights', desc: 'Hidden analytics' },
                ].map((f) => (
                  <div key={f.label} className="rounded-lg bg-[#0f0f0f] border border-[#1A1A1A] p-3 text-center hover:border-[rgba(255,255,255,0.03)] transition-colors">
                    <f.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: TOOL_COLOR }} />
                    <p className="text-[11px] font-semibold text-[#FFFFFF]">{f.label}</p>
                    <p className="text-[9px] text-[#666666] mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────── RECENT VIDEOS TAB ──────── */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          {!result ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: TOOL_BG, border: `1px solid ${TOOL_BORDER}` }}>
                <Flame className="w-8 h-8" style={{ color: TOOL_COLOR }} />
              </div>
              <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Recent Video Analytics</h3>
              <p className="text-sm text-[#a0a0a0] max-w-sm text-center">
                Run a Content Analysis first to unlock deep analytics for your 3 most recent videos — including retention curves, sentiment breakdowns, and thumbnail effectiveness.
              </p>
              <button
                onClick={() => setActiveTab('analysis')}
                className="mt-4 px-4 h-9 rounded-lg text-xs font-bold text-[#0a0a0a] flex items-center gap-2"
                style={{ backgroundColor: TOOL_COLOR }}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                Run Analysis First
              </button>
            </div>
          ) : (
            <>
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }}>
                    <Flame className="w-4 h-4 text-[#888888]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#FFFFFF]">Channel&apos;s Latest 3 Videos</h3>
                    <p className="text-[11px] text-[#a0a0a0]">Deep analytics including retention curves, sentiment, and thumbnail scores</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: TOOL_BG, border: `1px solid ${TOOL_BORDER}` }}>
                    <GlowDot color="#888888" />
                    <span className="text-[10px] font-bold" style={{ color: TOOL_COLOR }}>3 VIDEOS</span>
                  </div>
                </div>
              </TacticalCorners>

              <div className="space-y-4">
                {result.latestVideos.map((video, i) => (
                  <EnhancedVideoCard key={i} video={video} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────── DEEP INSIGHTS TAB ──────── */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {!result ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: TOOL_BG, border: `1px solid ${TOOL_BORDER}` }}>
                <Radar className="w-8 h-8" style={{ color: TOOL_COLOR }} />
              </div>
              <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Deep Insights</h3>
              <p className="text-sm text-[#a0a0a0] max-w-sm text-center">
                Analytics that YouTube doesn&apos;t show you. Run a Content Analysis first to unlock viewer behavior heatmaps, CPM analysis, demographics, and content gap opportunities.
              </p>
              <button
                onClick={() => setActiveTab('analysis')}
                className="mt-4 px-4 h-9 rounded-lg text-xs font-bold text-[#0a0a0a] flex items-center gap-2"
                style={{ backgroundColor: TOOL_COLOR }}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                Run Analysis First
              </button>
            </div>
          ) : (
            <>
              {/* Section header */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }}>
                    <Activity className="w-4 h-4 text-[#888888]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#FFFFFF]">What YouTube Won&apos;t Show You</h3>
                    <p className="text-[11px] text-[#a0a0a0]">Hidden growth signals and deeper analytics</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: TOOL_BG, border: `1px solid ${TOOL_BORDER}` }}>
                    <GlowDot color="#888888" />
                    <span className="text-[10px] font-bold text-[#888888]">DEEP ANALYTICS</span>
                  </div>
                </div>
              </TacticalCorners>

              {/* Viewer Behavior Heatmap */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
                    <Activity className="w-4 h-4 text-[#888888]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FFFFFF]">Viewer Behavior Heatmap</h3>
                    <p className="text-[10px] text-[#a0a0a0]">When your audience is most active (simulated)</p>
                  </div>
                </div>
                <HeatmapGrid />
              </TacticalCorners>

              {/* Best Publishing Window */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
                    <Calendar className="w-4 h-4 text-[#888888]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FFFFFF]">Best Publishing Window</h3>
                    <p className="text-[10px] text-[#a0a0a0]">Calculated from audience engagement patterns</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <p className="text-[11px] text-[#a0a0a0] leading-relaxed">{result.deeperAnalytics.optimalPostingWindow}</p>
                </div>
              </TacticalCorners>

              {/* Revenue per 1000 views (CPM Analysis) */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(246,168,40,0.15)' }}>
                    <DollarSign className="w-4 h-4 text-[#F6A828]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FFFFFF]">Revenue per 1000 Views (CPM Analysis)</h3>
                    <p className="text-[10px] text-[#a0a0a0]">Estimated earnings vs niche averages</p>
                  </div>
                </div>
                <CPMAnalysis />
              </TacticalCorners>

              {/* Audience Demographics */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
                    <Users className="w-4 h-4 text-[#888888]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FFFFFF]">Audience Demographics</h3>
                    <p className="text-[10px] text-[#a0a0a0]">Age and gender breakdown (simulated)</p>
                  </div>
                </div>
                <DemographicsBreakdown />
              </TacticalCorners>

              {/* Content Gap Opportunities */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(246,168,40,0.15)' }}>
                    <Target className="w-4 h-4 text-[#F6A828]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FFFFFF]">Content Gap Opportunities</h3>
                    <p className="text-[10px] text-[#a0a0a0]">High-demand, low-competition topics in your niche</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {result.deeperAnalytics.contentGaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                      <div className="w-5 h-5 rounded-md bg-[#F6A828]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-[#F6A828]">{i + 1}</span>
                      </div>
                      <p className="text-[11px] text-[#a0a0a0] leading-relaxed">{gap}</p>
                    </div>
                  ))}
                </div>
              </TacticalCorners>

              {/* Audience Satisfaction */}
              <TacticalCorners className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
                    <TrendingUp className="w-4 h-4 text-[#888888]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FFFFFF]">Audience Satisfaction Score</h3>
                    <p className="text-[10px] text-[#a0a0a0]">Based on return viewer rate, comment sentiment, and watch sessions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${scoreColor(result.deeperAnalytics.audienceSatisfaction)}12`,
                      border: `1px solid ${scoreColor(result.deeperAnalytics.audienceSatisfaction)}30`,
                      boxShadow: `0 0 16px ${scoreColor(result.deeperAnalytics.audienceSatisfaction)}20`,
                    }}
                  >
                    <span className="text-lg font-bold" style={{ color: scoreColor(result.deeperAnalytics.audienceSatisfaction) }}>
                      {result.deeperAnalytics.audienceSatisfaction}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="w-full h-2.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${result.deeperAnalytics.audienceSatisfaction}%`,
                          backgroundColor: scoreColor(result.deeperAnalytics.audienceSatisfaction),
                          boxShadow: `0 0 8px ${scoreColor(result.deeperAnalytics.audienceSatisfaction)}40`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] mt-1.5" style={{ color: scoreColor(result.deeperAnalytics.audienceSatisfaction) }}>
                      {scoreLabel(result.deeperAnalytics.audienceSatisfaction)} satisfaction
                    </p>
                  </div>
                </div>
              </TacticalCorners>

              {/* Hidden Growth Potential */}
              <TacticalCorners className="rounded-lg p-4" style={{ backgroundColor: `${TOOL_COLOR}06`, borderColor: `${TOOL_COLOR}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: TOOL_COLOR }} />
                  <h3 className="text-xs font-bold text-[#FFFFFF]">Hidden Growth Potential</h3>
                </div>
                <p className="text-[11px] text-[#a0a0a0] leading-relaxed">{result.deeperAnalytics.hiddenGrowth}</p>
              </TacticalCorners>

              {/* AI Insight */}
              <TacticalCorners className="rounded-lg p-4" style={{ backgroundColor: `${TOOL_COLOR}06`, borderColor: `${TOOL_COLOR}18` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" style={{ color: TOOL_COLOR }} />
                  <h3 className="text-xs font-bold text-[#FFFFFF]">AI Insight Summary</h3>
                </div>
                <p className="text-[11px] text-[#a0a0a0] leading-relaxed">{result.deeperAnalytics.aiSummary}</p>
              </TacticalCorners>
            </>
          )}
        </div>
      )}

      {/* ──────── TOKEN COST FOOTER ──────── */}
      <div className="text-center text-[11px] text-[#666666] flex items-center justify-center gap-1.5">
        <Zap className="w-3 h-3" />
        Cost: {TOOL_TOKEN_COST} tokens per analysis
      </div>
    </div>
  );
}
