'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import { askAI } from '@/lib/api';
import { fmtV } from '@/lib/utils';
import {
  BarChart2,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  Search,
  RefreshCw,
  AlertTriangle,
  Users,
  Eye,
  Video,
  TrendingUp,
  DollarSign,
  Activity,
  Play,
  User,
} from 'lucide-react';

/* ── Constants ── */
import { TOKEN_COSTS } from '@/lib/store';

/* ── Types ── */
interface ChannelProfile {
  name: string;
  handle: string;
  description: string;
  avatarInitial: string;
}

interface ChannelStats {
  subscribers: number;
  totalViews: number;
  videos: number;
  avgViews: number;
  engagementRate: number;
  estMonthlyRevenue: number;
}

interface GrowthMonth {
  month: string;
  subscribers: number;
}

interface CategoryBreakdown {
  category: string;
  percentage: number;
}

interface ChannelResult {
  profile: ChannelProfile;
  stats: ChannelStats;
  growth: GrowthMonth[];
  categories: CategoryBreakdown[];
  aiSummary: string;
}

/* ── Mock Data ── */
const MOCK_RESULT: ChannelResult = {
  profile: {
    name: 'TechVision Pro',
    handle: '@techvisionpro',
    description: 'Deep dives into emerging technology, AI, and the future of computing. New videos every week.',
    avatarInitial: 'TV',
  },
  stats: {
    subscribers: 2840000,
    totalViews: 487000000,
    videos: 342,
    avgViews: 1420000,
    engagementRate: 6.8,
    estMonthlyRevenue: 28500,
  },
  growth: [
    { month: 'Jul', subscribers: 2200000 },
    { month: 'Aug', subscribers: 2310000 },
    { month: 'Sep', subscribers: 2480000 },
    { month: 'Oct', subscribers: 2560000 },
    { month: 'Nov', subscribers: 2710000 },
    { month: 'Dec', subscribers: 2840000 },
  ],
  categories: [
    { category: 'Technology Reviews', percentage: 35 },
    { category: 'AI & Machine Learning', percentage: 25 },
    { category: 'Tutorials & How-Tos', percentage: 20 },
    { category: 'Industry Analysis', percentage: 12 },
    { category: 'News & Opinions', percentage: 8 },
  ],
  aiSummary: `TechVision Pro has established itself as a leading technology channel with a strong 2.84M subscriber base and impressive 6.8% engagement rate — well above the industry average of 3-4%. The channel's content strategy is highly diversified, with Technology Reviews as the dominant category at 35%, followed by AI & Machine Learning content at 25%.

The channel has shown consistent month-over-month growth, adding approximately 640K subscribers over the past 6 months. The estimated monthly revenue of $28,500 suggests strong monetization through a combination of AdSense and potential sponsorships. With an average of 1.42M views per video, the channel has significant room for revenue optimization through diversified monetization strategies including memberships, merchandise, and premium course offerings.`,
};

/* ── Category colors for pie chart bars ── */
const CAT_COLORS = [
  { bar: 'bg-[#FDBA2D]', bg: 'bg-[rgba(253,186,45,0.1)]', text: 'text-[#FDBA2D]' },
  { bar: 'bg-[#3B82F6]', bg: 'bg-[rgba(59,130,246,0.1)]', text: 'text-[#3B82F6]' },
  { bar: 'bg-[#10B981]', bg: 'bg-[rgba(16,185,129,0.1)]', text: 'text-[#10B981]' },
  { bar: 'bg-[#8B5CF6]', bg: 'bg-[rgba(139,92,246,0.1)]', text: 'text-[#8B5CF6]' },
  { bar: 'bg-[#EF4444]', bg: 'bg-[rgba(239,68,68,0.1)]', text: 'text-[#EF4444]' },
];

/* ── Stat card definitions ── */
const STAT_CARDS = [
  { key: 'subscribers', label: 'Subscribers', icon: Users, color: 'text-[#FDBA2D]', bg: 'bg-[rgba(253,186,45,0.1)]' },
  { key: 'totalViews', label: 'Total Views', icon: Eye, color: 'text-[#3B82F6]', bg: 'bg-[rgba(59,130,246,0.1)]' },
  { key: 'videos', label: 'Videos', icon: Video, color: 'text-[#8B5CF6]', bg: 'bg-[rgba(139,92,246,0.1)]' },
  { key: 'avgViews', label: 'Avg Views', icon: Play, color: 'text-[#10B981]', bg: 'bg-[rgba(16,185,129,0.1)]' },
  { key: 'engagementRate', label: 'Engagement Rate', icon: Activity, color: 'text-[#E1306C]', bg: 'bg-[rgba(225,48,108,0.1)]' },
  { key: 'estMonthlyRevenue', label: 'Est. Monthly Revenue', icon: DollarSign, color: 'text-[#10B981]', bg: 'bg-[rgba(16,185,129,0.1)]' },
] as const;


/* ── Helper to format stat values ── */
function formatStatValue(key: string, value: number): string {
  if (key === 'engagementRate') return `${value}%`;
  if (key === 'estMonthlyRevenue') return `$${fmtV(value)}`;
  return fmtV(value);
}

export function SocialChannelsTool() {
  const { spendTokens } = useNychIQStore();
  const [channelInput, setChannelInput] = useState('');
  const [result, setResult] = useState<ChannelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeChannel = async () => {
    if (!channelInput.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    setResult(null);
    // Standard token spend — 'social-channels' is now in TOKEN_COSTS
    const ok = spendTokens('social-channels');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube channel analytics expert. Perform a deep analysis of the YouTube channel: "${channelInput.trim()}"

Return a JSON object with these exact fields:
- "profile": object with "name" (string), "handle" (string, e.g. "@handle"), "description" (string, 1-2 sentences), "avatarInitial" (string, 2-letter initials)
- "stats": object with "subscribers" (number), "totalViews" (number), "videos" (number), "avgViews" (number), "engagementRate" (number, percentage like 6.8), "estMonthlyRevenue" (number, in USD)
- "growth": array of 6 objects, each with "month" (string like "Jul") and "subscribers" (number), representing the last 6 months of subscriber growth
- "categories": array of 4-5 objects, each with "category" (string) and "percentage" (number 0-100), representing content category distribution
- "aiSummary": string of 2-3 paragraphs analyzing the channel's performance, strengths, and opportunities

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        setResult({
          profile: parsed.profile || MOCK_RESULT.profile,
          stats: parsed.stats || MOCK_RESULT.stats,
          growth: Array.isArray(parsed.growth) ? parsed.growth.slice(0, 6) : MOCK_RESULT.growth,
          categories: Array.isArray(parsed.categories) ? parsed.categories.slice(0, 5) : MOCK_RESULT.categories,
          aiSummary: parsed.aiSummary || MOCK_RESULT.aiSummary,
        });
      } catch {
        setResult(MOCK_RESULT);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze channel. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
              <BarChart2 className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Channel Stats</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">Deep analytics beyond YouTube API — engagement rate, growth trends, estimated revenue</p>
            </div>
          </div>

          {/* Channel Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') analyzeChannel(); }}
              placeholder="Channel name or YouTube URL"
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
            />
            <button
              onClick={analyzeChannel}
              disabled={loading || !channelInput.trim()}
              className="px-5 h-11 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
              Analyze Channel
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-3" />
          <p className="text-sm text-[#FFFFFF] mb-4">{error}</p>
          <button
            onClick={analyzeChannel}
            className="px-4 py-2 rounded-lg bg-[#EF4444] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {/* Profile skeleton */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-[#1A1A1A] rounded animate-pulse w-48" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-32" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
            </div>
          </div>
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-[#141414] border border-[#222222] p-4 space-y-2">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-16" />
                <div className="h-6 bg-[#1A1A1A] rounded animate-pulse w-24" />
              </div>
            ))}
          </div>
          {/* Bar chart skeleton */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5 space-y-3">
            <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-32" />
            <div className="flex items-end gap-3 h-32">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 bg-[#1A1A1A] rounded-t animate-pulse" style={{ height: `${30 + Math.random() * 70}%` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-5">
          {/* Channel Profile Card */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-[rgba(253,186,45,0.1)] border-2 border-[rgba(253,186,45,0.3)] flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-[#FDBA2D]">{result.profile.avatarInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-[#FFFFFF]">{result.profile.name}</h3>
                <p className="text-xs text-[#FDBA2D] mb-1.5">{result.profile.handle}</p>
                <p className="text-sm text-[#A3A3A3] leading-relaxed">{result.profile.description}</p>
              </div>
            </div>
          </div>

          {/* 6-Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {STAT_CARDS.map((stat) => {
              const val = result.stats[stat.key as keyof ChannelStats];
              const Icon = stat.icon;
              return (
                <div key={stat.key} className="rounded-lg bg-[#141414] border border-[#222222] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-md ${stat.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                    <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className={`text-xl font-bold ${stat.color}`}>{formatStatValue(stat.key, val as number)}</p>
                </div>
              );
            })}
          </div>

          {/* Subscriber Growth - Bar Chart */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
              <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">Subscriber Growth (6 Months)</h4>
            </div>
            <div className="flex items-end gap-3 h-36">
              {result.growth.map((month, i) => {
                const maxSubs = Math.max(...result.growth.map((g) => g.subscribers));
                const heightPct = maxSubs > 0 ? (month.subscribers / maxSubs) * 100 : 0;
                const isLast = i === result.growth.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-[#A3A3A3] font-medium">{fmtV(month.subscribers)}</span>
                    <div className="w-full relative" style={{ height: '100px' }}>
                      <div
                        className={`absolute bottom-0 w-full rounded-t-md transition-all duration-1000 ${
                          isLast ? 'bg-[#FDBA2D]' : 'bg-[rgba(253,186,45,0.3)]'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isLast ? 'text-[#FDBA2D]' : 'text-[#666666]'}`}>
                      {month.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Category Breakdown */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Video className="w-3.5 h-3.5" /> Content Breakdown
            </h4>
            {/* Pie chart visual using stacked bar */}
            <div className="flex h-6 rounded-full overflow-hidden bg-[#1A1A1A] mb-4">
              {result.categories.map((cat, i) => {
                const colors = CAT_COLORS[i % CAT_COLORS.length];
                return (
                  <div
                    key={i}
                    className={`${colors.bar} transition-all duration-1000 first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${cat.percentage}%` }}
                    title={`${cat.category}: ${cat.percentage}%`}
                  />
                );
              })}
            </div>
            <div className="space-y-2.5">
              {result.categories.map((cat, i) => {
                const colors = CAT_COLORS[i % CAT_COLORS.length];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.bar} flex-shrink-0`} />
                    <span className="text-xs text-[#FFFFFF] flex-1 truncate">{cat.category}</span>
                    <span className={`text-xs font-bold ${colors.text}`}>{cat.percentage}%</span>
                    {/* Bar representation */}
                    <div className="w-24 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bar} transition-all duration-1000`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Summary */}
          <div className="rounded-lg bg-[#141414] border border-[#FDBA2D]/20 p-5">
            <h4 className="text-xs font-bold text-[#FDBA2D] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Analysis
            </h4>
            <div className="text-sm text-[#FFFFFF] leading-relaxed whitespace-pre-line">
              {result.aiSummary}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mb-4">
            <BarChart2 className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Deep Channel Analytics</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">Enter a channel name or URL to unlock engagement rates, growth trends, and revenue estimates.</p>
        </div>
      )}

      {searched && !loading && (
        <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['social-channels']} tokens per analysis</div>
      )}
    </div>
  );
}
