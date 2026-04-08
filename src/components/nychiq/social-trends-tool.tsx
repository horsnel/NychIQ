'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { fmtV } from '@/lib/utils';
import {
  Share2,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Filter,
  Globe,
  Zap,
  Eye,
  MessageSquare,
  Heart,
  ArrowUpRight,
} from 'lucide-react';

/* ── Constants ── */
const PLATFORMS = ['All', 'TikTok', 'Twitter/X', 'Instagram', 'YouTube'] as const;
type Platform = (typeof PLATFORMS)[number];

const REGIONS = [
  { code: 'NG', label: 'Nigeria' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IN', label: 'India' },
  { code: 'KE', label: 'Kenya' },
  { code: 'GH', label: 'Ghana' },
  { code: 'ZA', label: 'South Africa' },
];

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  TikTok: { bg: 'bg-[rgba(255,0,80,0.1)]', text: 'text-[#FF0050]', border: 'border-[rgba(255,0,80,0.2)]' },
  'Twitter/X': { bg: 'bg-[rgba(74,158,255,0.1)]', text: 'text-[#4A9EFF]', border: 'border-[rgba(74,158,255,0.2)]' },
  Instagram: { bg: 'bg-[rgba(225,48,108,0.1)]', text: 'text-[#E1306C]', border: 'border-[rgba(225,48,108,0.2)]' },
  YouTube: { bg: 'bg-[rgba(255,0,0,0.1)]', text: 'text-[#FF0000]', border: 'border-[rgba(255,0,0,0.2)]' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Comedy: 'bg-[rgba(245,166,35,0.1)] text-[#F5A623] border-[rgba(245,166,35,0.2)]',
  Music: 'bg-[rgba(155,114,207,0.1)] text-[#9B72CF] border-[rgba(155,114,207,0.2)]',
  Tech: 'bg-[rgba(74,158,255,0.1)] text-[#4A9EFF] border-[rgba(74,158,255,0.2)]',
  Gaming: 'bg-[rgba(0,196,140,0.1)] text-[#00C48C] border-[rgba(0,196,140,0.2)]',
  Fashion: 'bg-[rgba(225,48,108,0.1)] text-[#E1306C] border-[rgba(225,48,108,0.2)]',
  Food: 'bg-[rgba(245,166,35,0.1)] text-[#F5A623] border-[rgba(245,166,35,0.2)]',
  Sports: 'bg-[rgba(0,196,140,0.1)] text-[#00C48C] border-[rgba(0,196,140,0.2)]',
  News: 'bg-[rgba(74,158,255,0.1)] text-[#4A9EFF] border-[rgba(74,158,255,0.2)]',
  Lifestyle: 'bg-[rgba(155,114,207,0.1)] text-[#9B72CF] border-[rgba(155,114,207,0.2)]',
  Education: 'bg-[rgba(74,158,255,0.1)] text-[#4A9EFF] border-[rgba(74,158,255,0.2)]',
};

interface TrendItem {
  platform: string;
  title: string;
  spike: number;
  category: string;
  engagement: { views: number; likes: number; shares: number };
  crossingToYouTube: boolean;
}

/* ── Mock data ── */
const MOCK_TRENDS: TrendItem[] = [
  { platform: 'TikTok', title: '#AfroBeatDanceChallenge2025', spike: 342, category: 'Music', engagement: { views: 4200000, likes: 890000, shares: 156000 }, crossingToYouTube: true },
  { platform: 'Twitter/X', title: 'AI Coding Assistants comparison thread', spike: 218, category: 'Tech', engagement: { views: 3100000, likes: 124000, shares: 89000 }, crossingToYouTube: true },
  { platform: 'Instagram', title: 'Minimalist home office setups 2025', spike: 156, category: 'Lifestyle', engagement: { views: 1800000, likes: 267000, shares: 45000 }, crossingToYouTube: true },
  { platform: 'TikTok', title: 'Street food ASMR Lagos edition', spike: 287, category: 'Food', engagement: { views: 5600000, likes: 1200000, shares: 234000 }, crossingToYouTube: true },
  { platform: 'YouTube', title: 'Building a $1M business from scratch', spike: 89, category: 'Education', engagement: { views: 2400000, likes: 189000, shares: 34000 }, crossingToYouTube: false },
  { platform: 'Twitter/X', title: 'Premier League transfer window rumors', spike: 198, category: 'Sports', engagement: { views: 4700000, likes: 210000, shares: 156000 }, crossingToYouTube: false },
  { platform: 'Instagram', title: 'Thrifting haul finds in Lagos markets', spike: 167, category: 'Fashion', engagement: { views: 2100000, likes: 345000, shares: 67000 }, crossingToYouTube: true },
  { platform: 'TikTok', title: 'Stand-up comedy clips going viral', spike: 412, category: 'Comedy', engagement: { views: 8900000, likes: 2100000, shares: 456000 }, crossingToYouTube: true },
];


export function SocialTrendsTool() {
  const { spendTokens } = useNychIQStore();
  const [platform, setPlatform] = useState<Platform>('All');
  const [region, setRegion] = useState('NG');
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    setSearched(true);
    setError(null);
    const ok = spendTokens('social-trends');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a social media trend analyst. Analyze the latest trending topics across TikTok, Twitter/X, Instagram, and YouTube for the ${region} region${platform !== 'All' ? `, focused on ${platform}` : ''}.

Return a JSON array of 8 trend objects with these exact fields:
- "platform": one of "TikTok", "Twitter/X", "Instagram", "YouTube"
- "title": the trend topic or hashtag
- "spike": percentage spike (number, e.g. 342)
- "category": one of "Comedy", "Music", "Tech", "Gaming", "Fashion", "Food", "Sports", "News", "Lifestyle", "Education"
- "engagement": object with "views" (number), "likes" (number), "shares" (number)
- "crossingToYouTube": boolean predicting if this trend will cross to YouTube

Return ONLY the JSON array, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        setTrends(Array.isArray(parsed) ? parsed.slice(0, 8) : MOCK_TRENDS);
      } catch {
        setTrends(MOCK_TRENDS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trends. Please try again.');
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrends = platform === 'All' ? trends : trends.filter((t) => t.platform === platform);
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
              <Share2 className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Cross-Platform Trends</h2>
              <p className="text-xs text-[#888888] mt-0.5">TikTok, Twitter/X, Instagram, YouTube trends before they blow up</p>
            </div>
          </div>

          {/* Platform Filter Chips */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[#888888] mb-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Platform
            </label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {PLATFORMS.map((p) => {
                const colors = p !== 'All' ? PLATFORM_COLORS[p] : null;
                const isActive = platform === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isActive
                        ? colors
                          ? `${colors.bg} ${colors.text} ${colors.border}`
                          : 'bg-[rgba(245,166,35,0.1)] text-[#F5A623] border-[rgba(245,166,35,0.2)]'
                        : 'bg-[#0D0D0D] text-[#888888] border-[#1A1A1A] hover:border-[#333333]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region Selector */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full sm:w-56 h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] focus:outline-none focus:border-[#F5A623]/50 transition-colors appearance-none cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label} ({r.code})
                </option>
              ))}
            </select>
          </div>

          {/* Fetch Button */}
          <button
            onClick={fetchTrends}
            disabled={loading}
            className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Fetch Trends
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#E05252] mx-auto mb-3" />
          <p className="text-sm text-[#E8E8E8] mb-4">{error}</p>
          <button
            onClick={fetchTrends}
            className="px-4 py-2 rounded-lg bg-[#E05252] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-16 h-6 bg-[#1A1A1A] rounded-full animate-pulse" />
                <div className="w-12 h-6 bg-[#1A1A1A] rounded-full animate-pulse" />
              </div>
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
              <div className="flex gap-4">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-20" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && filteredTrends.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F5A623]" />
            {filteredTrends.length} Trend{filteredTrends.length !== 1 ? 's' : ''} Found
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTrends.map((trend, i) => {
              const pColors = PLATFORM_COLORS[trend.platform] || PLATFORM_COLORS['TikTok'];
              const catColor = CATEGORY_COLORS[trend.category] || 'bg-[#1A1A1A] text-[#888888] border-[#1A1A1A]';
              const isPositive = trend.spike > 0;
              return (
                <div
                  key={i}
                  className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#333333] transition-all group"
                >
                  {/* Top row: platform + category + spike */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${pColors.bg} ${pColors.text} border ${pColors.border}`}>
                        {trend.platform}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${catColor}`}>
                        {trend.category}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-[#00C48C]' : 'text-[#E05252]'}`}>
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {Math.abs(trend.spike)}%
                    </div>
                  </div>

                  {/* Trend Title */}
                  <h4 className="text-sm font-semibold text-[#E8E8E8] mb-3 group-hover:text-[#F5A623] transition-colors leading-snug">
                    {trend.title}
                  </h4>

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-[11px] text-[#888888] mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {fmtV(trend.engagement.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {fmtV(trend.engagement.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {fmtV(trend.engagement.shares)}
                    </span>
                  </div>

                  {/* YouTube Prediction */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]">
                    <span className="text-[10px] text-[#666666]">Crossing to YouTube?</span>
                    {trend.crossingToYouTube ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(0,196,140,0.1)] text-[#00C48C] border border-[rgba(0,196,140,0.2)]">
                        <ArrowUpRight className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(136,136,136,0.1)] text-[#888888] border border-[rgba(136,136,136,0.2)]">
                        No
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtered Empty */}
      {!loading && searched && trends.length > 0 && filteredTrends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Filter className="w-8 h-8 text-[#444444] mb-3" />
          <h3 className="text-sm font-semibold text-[#E8E8E8] mb-1">No trends for {platform}</h3>
          <p className="text-xs text-[#888888]">Try selecting &quot;All&quot; or a different platform</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mb-4">
            <Share2 className="w-8 h-8 text-[#F5A623]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Discover Cross-Platform Trends</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Select a region and fetch the hottest trends before they blow up on YouTube.</p>
        </div>
      )}

      {searched && !loading && (
        <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.crossplatform} tokens per search</div>
      )}
    </div>
  );
}
