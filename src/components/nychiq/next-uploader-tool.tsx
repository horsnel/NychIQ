'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Flame,
  Users,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';

/* ════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════ */

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

const TOOL_COLOR = '#9B72CF';
const TOOL_BG = 'rgba(155,114,207,0.1)';
const TOOL_BORDER = 'rgba(155,114,207,0.2)';
const TOOL_TOKEN_COST = 10;

/* ── Score color helper ── */
function scoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#FDBA2D';
  if (score >= 40) return '#4A9EFF';
  return '#EF4444';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 25) return 'Weak';
  return 'Poor';
}

/* ── Retention bar color based on value ── */
function retentionColor(retention: number): string {
  if (retention >= 70) return '#10B981';
  if (retention >= 50) return '#FDBA2D';
  if (retention >= 30) return '#4A9EFF';
  return '#EF4444';
}

/* ════════════════════════════════════════════════
   MOCK DATA GENERATOR
   ════════════════════════════════════════════════ */

function getMockAnalysis(input: string, channelConfig: ChannelConfig): UploadAnalysis {
  const niche = channelConfig.niche || 'technology';
  const brandBase = channelConfig.channelName ? 68 : 45;
  const hash = input.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  return {
    retentionData: [
      { mark: '0s', seconds: 0, retention: 100, label: 'Intro' },
      { mark: '30s', seconds: 30, retention: 82 + (hash % 12), label: 'Hook drop-off' },
      { mark: '1m', seconds: 60, retention: 68 + (hash % 15), label: 'Topic transition' },
      { mark: '3m', seconds: 180, retention: 54 + (hash % 10), label: 'Mid-roll risk' },
      { mark: '5m', seconds: 300, retention: 41 + (hash % 14), label: 'Deep dive point' },
      { mark: '10m', seconds: 600, retention: 28 + (hash % 12), label: 'Tail retention' },
    ],
    brandScore: Math.min(100, Math.max(20, brandBase + (hash % 20))),
    noveltyScore: Math.min(100, Math.max(15, 42 + (hash % 45))),
    authenticityScore: Math.min(100, Math.max(30, 55 + (hash % 35))),
    latestVideos: [
      {
        title: `${niche.charAt(0).toUpperCase() + niche.slice(1)} Trends Breaking Down the Latest Changes`,
        views: '124.8K',
        avgViewDuration: '6:42',
        retentionRate: 58,
        likes: '8.2K',
        ctr: '7.3%',
        engagement: 6.8,
        published: '3 days ago',
      },
      {
        title: `Complete ${niche.charAt(0).toUpperCase() + niche.slice(1)} Guide for Beginners in 2025`,
        views: '89.3K',
        avgViewDuration: '9:15',
        retentionRate: 48,
        likes: '5.6K',
        ctr: '5.9%',
        engagement: 5.4,
        published: '1 week ago',
      },
      {
        title: `Honest Review: ${niche.charAt(0).toUpperCase() + niche.slice(1)} Tools That Actually Work`,
        views: '203.1K',
        avgViewDuration: '5:03',
        retentionRate: 72,
        likes: '14.7K',
        ctr: '9.1%',
        engagement: 8.9,
        published: '2 weeks ago',
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
    overallVerdict: 'The video shows strong potential for above-average performance. Key optimization areas: hook intensity in the first 30s, clearer topic transitions at the 1-minute mark, and adding a mid-video payoff around 3:00 to prevent viewer drop-off.',
  };
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════ */

/* ── Circular Score Gauge ── */
function ScoreGauge({ score, label, icon: Icon, size = 88 }: {
  score: number;
  label: string;
  icon: React.ElementType;
  size?: number;
}) {
  const color = scoreColor(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="6"
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-3.5 h-3.5 mb-0.5" style={{ color }} />
          <span className="text-lg font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-[#E8E8E8]">{label}</p>
        <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{scoreLabel(score)}</p>
      </div>
    </div>
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
        {/* Horizontal grid lines */}
        {[100, 75, 50, 25, 0].map((pct) => {
          const y = 10 + ((100 - pct) / maxRetention) * chartH;
          return (
            <g key={pct}>
              <line x1="10" y1={y} x2={chartW + 10} y2={y} stroke="#1A1A1A" strokeWidth="0.5" />
              <text x="6" y={y + 3} fill="#444444" fontSize="3.5" textAnchor="end">{pct}%</text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((point, i) => {
          const x = 10 + i * (barW + gap);
          const barHeight = (point.retention / maxRetention) * chartH;
          const y = 10 + chartH - barHeight;
          const color = retentionColor(point.retention);
          return (
            <g key={point.mark}>
              {/* Bar with rounded top */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barHeight}
                rx={3}
                ry={3}
                fill={color}
                opacity={0.85}
                style={{ transition: 'all 0.6s ease-out' }}
              />
              {/* Retention percentage on top */}
              <text
                x={x + barW / 2}
                y={y - 3}
                fill={color}
                fontSize="4"
                textAnchor="middle"
                fontWeight="bold"
              >
                {point.retention}%
              </text>
              {/* Time label below */}
              <text
                x={x + barW / 2}
                y={10 + chartH + 10}
                fill="#888888"
                fontSize="3.5"
                textAnchor="middle"
                fontWeight="500"
              >
                {point.mark}
              </text>
              {/* Label below time */}
              <text
                x={x + barW / 2}
                y={10 + chartH + 16}
                fill="#555555"
                fontSize="2.5"
                textAnchor="middle"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Latest Video Card ── */
function VideoCard({ video, index }: { video: LatestVideo; index: number }) {
  const retColor = retentionColor(video.retentionRate);
  return (
    <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-4 hover:border-[#2A2A2A] transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ backgroundColor: `${TOOL_COLOR}15`, color: TOOL_COLOR }}
        >
          #{index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#E8E8E8] line-clamp-2 leading-relaxed">{video.title}</p>
          <p className="text-[10px] text-[#555555] mt-1">{video.published}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <MetricPill label="Views" value={video.views} />
        <MetricPill label="Avg. Watch" value={video.avgViewDuration} />
        <MetricPill label="Retention" value={`${video.retentionRate}%`} color={retColor} />
        <MetricPill label="Likes" value={video.likes} />
        <MetricPill label="CTR" value={video.ctr} />
        <MetricPill label="Engagement" value={`${video.engagement}%`} color={scoreColor(video.engagement)} />
      </div>
    </div>
  );
}

function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md bg-[#141414] border border-[#1A1A1A] px-2 py-1.5 text-center">
      <p className="text-[9px] text-[#555555] uppercase tracking-wider">{label}</p>
      <p className="text-[11px] font-semibold mt-0.5" style={{ color: color || '#E8E8E8' }}>{value}</p>
    </div>
  );
}

/* ── Deeper Analytics Section ── */
function DeeperSection({
  analytics,
  expanded,
  onToggle,
}: {
  analytics: DeeperAnalytics;
  expanded: boolean;
  onToggle: () => void;
}) {
  const satColor = scoreColor(analytics.audienceSatisfaction);

  return (
    <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1A]/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: TOOL_COLOR }} />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">What YouTube Won&apos;t Show You</h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: TOOL_COLOR, backgroundColor: TOOL_BG }}>
            DEEP ANALYTICS
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#666666]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#666666]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#1A1A1A] px-4 py-4 space-y-4 animate-fade-in-up">
          {/* Audience Satisfaction */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${satColor}12`, border: `1px solid ${satColor}30` }}
            >
              <span className="text-base font-bold" style={{ color: satColor }}>
                {analytics.audienceSatisfaction}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#E8E8E8]">Audience Satisfaction Score</p>
              <p className="text-[11px] text-[#888888] mt-0.5">
                Based on return viewer rate, comment sentiment, and watch session patterns.
              </p>
              <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${analytics.audienceSatisfaction}%`, backgroundColor: satColor }}
                />
              </div>
            </div>
          </div>

          {/* Hidden Growth Potential */}
          <div className="p-3 rounded-lg border" style={{ backgroundColor: `${TOOL_COLOR}06`, borderColor: `${TOOL_COLOR}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: TOOL_COLOR }} />
              <p className="text-xs font-semibold text-[#E8E8E8]">Hidden Growth Potential</p>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">{analytics.hiddenGrowth}</p>
          </div>

          {/* Content Gap Analysis */}
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <div className="flex items-center gap-2 mb-2.5">
              <Target className="w-4 h-4 text-[#FDBA2D]" />
              <p className="text-xs font-semibold text-[#E8E8E8]">Content Gap Analysis</p>
            </div>
            <div className="space-y-2">
              {analytics.contentGaps.map((gap, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-[#FDBA2D]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-[#FDBA2D]">{i + 1}</span>
                  </div>
                  <p className="text-[11px] text-[#888888] leading-relaxed">{gap}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimal Posting Window */}
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#4A9EFF]" />
              <p className="text-xs font-semibold text-[#E8E8E8]">Optimal Posting Window</p>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">{analytics.optimalPostingWindow}</p>
          </div>

          {/* AI Summary */}
          <div className="p-3 rounded-lg border" style={{ backgroundColor: `${TOOL_COLOR}06`, borderColor: `${TOOL_COLOR}18` }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: TOOL_COLOR }} />
              <p className="text-xs font-semibold text-[#E8E8E8]">AI Insight</p>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">{analytics.aiSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export function NextUploaderTool() {
  const { spendTokens } = useNychIQStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadAnalysis | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedVerdict, setCopiedVerdict] = useState(false);
  const [deeperExpanded, setDeeperExpanded] = useState(true);
  const [channelConfig, setChannelConfig] = useState<ChannelConfig>({});

  /* Load channel config from localStorage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nychiq_channel_assistant_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        setChannelConfig(parsed);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const isYouTubeUrl = (text: string) => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(text.trim());
  };

  const handleAnalyze = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('next-uploader');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
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

      setResult({
        retentionData: Array.isArray(parsed.retentionData)
          ? parsed.retentionData.map((r: any) => ({
              mark: r.mark || '',
              seconds: typeof r.seconds === 'number' ? r.seconds : 0,
              retention: Math.min(100, Math.max(0, parseInt(r.retention, 10) || 50)),
              label: r.label || '',
            }))
          : getMockAnalysis(trimmed, channelConfig).retentionData,
        brandScore: Math.min(100, Math.max(0, parseInt(parsed.brandScore, 10) || 50)),
        noveltyScore: Math.min(100, Math.max(0, parseInt(parsed.noveltyScore, 10) || 50)),
        authenticityScore: Math.min(100, Math.max(0, parseInt(parsed.authenticityScore, 10) || 50)),
        latestVideos: Array.isArray(parsed.latestVideos)
          ? parsed.latestVideos.slice(0, 3).map((v: any) => ({
              title: v.title || 'Untitled Video',
              views: v.views || '0',
              avgViewDuration: v.avgViewDuration || '0:00',
              retentionRate: Math.min(100, Math.max(0, parseInt(v.retentionRate, 10) || 50)),
              likes: v.likes || '0',
              ctr: v.ctr || '0%',
              engagement: Math.min(100, Math.max(0, parseInt(v.engagement, 10) || 50)),
              published: v.published || 'recently',
            }))
          : getMockAnalysis(trimmed, channelConfig).latestVideos,
        deeperAnalytics: parsed.deeperAnalytics
          ? {
              audienceSatisfaction: Math.min(100, Math.max(0, parseInt(parsed.deeperAnalytics.audienceSatisfaction, 10) || 50)),
              hiddenGrowth: parsed.deeperAnalytics.hiddenGrowth || '',
              contentGaps: Array.isArray(parsed.deeperAnalytics.contentGaps) ? parsed.deeperAnalytics.contentGaps.slice(0, 3) : [],
              optimalPostingWindow: parsed.deeperAnalytics.optimalPostingWindow || '',
              aiSummary: parsed.deeperAnalytics.aiSummary || '',
            }
          : getMockAnalysis(trimmed, channelConfig).deeperAnalytics,
        overallVerdict: parsed.overallVerdict || 'Analysis complete.',
      });
    } catch {
      setResult(getMockAnalysis(trimmed, channelConfig));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyVerdict = async () => {
    if (!result) return;
    const text = `NEXT UPLOADER — Pre-Upload Analysis Report\n\nOverall Verdict:\n${result.overallVerdict}\n\nBrand Consistency: ${result.brandScore}/100\nNovelty Score: ${result.noveltyScore}/100\nAuthenticity: ${result.authenticityScore}/100\n\nRetention Predictions:\n${result.retentionData.map(r => `  ${r.mark}: ${r.retention}% (${r.label})`).join('\n')}\n\nDeeper Analytics:\n  Audience Satisfaction: ${result.deeperAnalytics.audienceSatisfaction}/100\n  Hidden Growth: ${result.deeperAnalytics.hiddenGrowth}\n  Optimal Posting: ${result.deeperAnalytics.optimalPostingWindow}\n  Content Gaps:\n${result.deeperAnalytics.contentGaps.map((g, i) => `    ${i + 1}. ${g}`).join('\n')}`;
    await navigator.clipboard.writeText(text);
    setCopiedVerdict(true);
    showToast('Report copied to clipboard', 'success');
    setTimeout(() => setCopiedVerdict(false), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ──────── HEADER CARD ──────── */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: TOOL_BG }}>
              <Upload className="w-5 h-5" style={{ color: TOOL_COLOR }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Next Uploader AI</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Pre-Upload Intelligence — Analyze before you publish
              </p>
            </div>
          </div>
          <p className="text-sm text-[#888888] mb-4">
            Paste a YouTube URL or enter a video topic/title. AI predicts performance metrics
            including audience retention, brand alignment, and growth potential before you hit publish.
          </p>

          {/* Input Section */}
          <div className="space-y-2">
            <div className="relative">
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
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none transition-colors"
                style={{ caretColor: TOOL_COLOR }}
                onFocus={(e) => { e.target.style.borderColor = `${TOOL_COLOR}80`; }}
                onBlur={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
              />
              {input && (
                <button
                  onClick={() => setInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#E8E8E8] transition-colors"
                >
                  ×
                </button>
              )}
            </div>

            {/* Channel Config indicator */}
            {channelConfig.channelName && (
              <div className="flex items-center gap-1.5 px-2">
                <Info className="w-3 h-3 text-[#555555]" />
                <span className="text-[10px] text-[#555555]">
                  Analyzing for channel: <span className="text-[#888888]">{channelConfig.channelName}</span>
                  {channelConfig.niche && <> · Niche: <span className="text-[#888888]">{channelConfig.niche}</span></>}
                </span>
              </div>
            )}

            {/* Analyze Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={loading || !input.trim()}
                className="px-5 h-10 rounded-lg text-[#0D0D0D] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                style={{ backgroundColor: TOOL_COLOR }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Analyze Pre-Upload
              </button>
              {searched && !loading && (
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-1.5 px-3 h-10 rounded-lg border border-[#222222] text-xs text-[#888888] hover:bg-[#1A1A1A] hover:text-[#E8E8E8] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-analyze
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──────── ERROR STATE ──────── */}
      {error && (
        <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-5 text-center">
          <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
          <p className="text-sm text-[#E8E8E8]">{error}</p>
          <button
            onClick={handleAnalyze}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            style={{ backgroundColor: TOOL_COLOR, color: '#0D0D0D' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ──────── LOADING SKELETON ──────── */}
      {loading && (
        <div className="space-y-4">
          {/* Scores skeleton */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3 mb-4" />
            <div className="flex items-center justify-around">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-[#1A1A1A] animate-pulse" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-16" />
                  <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-12" />
                </div>
              ))}
            </div>
          </div>
          {/* Retention skeleton */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/2 mb-4" />
            <div className="h-40 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
          {/* Video cards skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-[#141414] border border-[#222222] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-1/4" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="h-10 bg-[#1A1A1A] rounded-md animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────── RESULTS ──────── */}
      {!loading && result && (
        <div className="space-y-4">
          {/* ── Overall Verdict Banner ── */}
          <div
            className="rounded-lg p-4 border flex items-start gap-3"
            style={{
              backgroundColor: `${TOOL_COLOR}08`,
              borderColor: `${TOOL_COLOR}25`,
            }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: TOOL_COLOR }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-xs font-bold text-[#E8E8E8]">Pre-Upload Verdict</h3>
                <button
                  onClick={handleCopyVerdict}
                  className="flex items-center gap-1 text-[10px] text-[#888888] hover:text-[#E8E8E8] transition-colors shrink-0"
                >
                  {copiedVerdict ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                  {copiedVerdict ? 'Copied' : 'Copy Report'}
                </button>
              </div>
              <p className="text-[11px] text-[#888888] leading-relaxed">{result.overallVerdict}</p>
            </div>
          </div>

          {/* ── Three Core Scores ── */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-5 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: TOOL_COLOR }} />
              Core Scores
            </h3>
            <div className="flex items-start justify-around sm:justify-center sm:gap-12">
              <ScoreGauge score={result.brandScore} label="Brand Consistency" icon={Palette} />
              <ScoreGauge score={result.noveltyScore} label="Novelty" icon={Fingerprint} />
              <ScoreGauge score={result.authenticityScore} label="Authenticity" icon={ShieldCheck} />
            </div>
          </div>

          {/* ── Audience Retention Simulation ── */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" style={{ color: TOOL_COLOR }} />
                Predicted Audience Retention
              </h3>
              <span className="text-[10px] text-[#555555]">Simulated drop-off</span>
            </div>
            <RetentionChart data={result.retentionData} />
            {/* Retention insights */}
            <div className="mt-4 space-y-1.5">
              {result.retentionData.slice(1).map((point, i) => {
                const prev = result.retentionData[i].retention;
                const drop = prev - point.retention;
                const isHighDrop = drop >= 20;
                return (
                  <div key={point.mark} className="flex items-center gap-2 text-[10px]">
                    {isHighDrop && (
                      <AlertTriangle className="w-3 h-3 text-[#FDBA2D] shrink-0" />
                    )}
                    {!isHighDrop && (
                      <div className="w-3 shrink-0" />
                    )}
                    <span className="text-[#888888]">
                      <span className="text-[#E8E8E8] font-medium">{point.mark}</span>
                      {' '}&mdash; {point.label}
                    </span>
                    {isHighDrop && (
                      <span className="font-bold text-[#FDBA2D]">
                        (-{drop}% drop)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 3 Latest Video Analytics ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: TOOL_COLOR }} />
              Channel&apos;s Latest 3 Videos
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: TOOL_COLOR, backgroundColor: TOOL_BG }}>
                ANALYTICS
              </span>
            </h3>
            {result.latestVideos.map((video, i) => (
              <VideoCard key={i} video={video} index={i} />
            ))}
          </div>

          {/* ── Deeper Analytics ── */}
          <DeeperSection
            analytics={result.deeperAnalytics}
            expanded={deeperExpanded}
            onToggle={() => setDeeperExpanded(!deeperExpanded)}
          />
        </div>
      )}

      {/* ──────── INITIAL IDLE STATE ──────── */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              backgroundColor: TOOL_BG,
              border: `1px solid ${TOOL_BORDER}`,
            }}
          >
            <Upload className="w-8 h-8" style={{ color: TOOL_COLOR }} />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Pre-Upload Intelligence</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center mb-6">
            Paste a YouTube URL or enter a video topic to predict performance, retention, and brand alignment before you hit publish.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg w-full">
            {[
              { icon: Eye, label: 'Retention Prediction', desc: 'Simulated drop-off analysis' },
              { icon: Palette, label: 'Brand Alignment', desc: 'Consistency scoring' },
              { icon: Fingerprint, label: 'Novelty Check', desc: 'Content uniqueness rating' },
              { icon: ShieldCheck, label: 'Authenticity Score', desc: 'Clickbait detection' },
              { icon: BarChart3, label: 'Video Analytics', desc: 'Last 3 video metrics' },
              { icon: Activity, label: 'Deep Insights', desc: 'Hidden growth signals' },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-lg bg-[#141414] border border-[#1A1A1A] p-3 text-center hover:border-[#2A2A2A] transition-colors"
              >
                <f.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: TOOL_COLOR }} />
                <p className="text-[11px] font-semibold text-[#E8E8E8]">{f.label}</p>
                <p className="text-[9px] text-[#555555] mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────── TOKEN COST FOOTER ──────── */}
      {searched && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOOL_TOKEN_COST} tokens per analysis
        </div>
      )}
    </div>
  );
}
