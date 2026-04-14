'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { truncate } from '@/lib/utils';
import {
  AtSign,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  Search,
  RefreshCw,
  AlertTriangle,
  Heart,
  Repeat2,
  MessageCircle,
  ExternalLink,
  ThumbsUp,
  Minus,
  ThumbsDown,
} from 'lucide-react';

/* ── Constants ── */
const MENTION_PLATFORMS = ['All', 'X', 'Reddit', 'TikTok', 'Instagram', 'News'] as const;
type MentionPlatform = (typeof MENTION_PLATFORMS)[number];

const PLATFORM_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'X': { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#888888]', border: 'border-[rgba(255,255,255,0.06)]' },
  Reddit: { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#FF4500]', border: 'border-[rgba(255,255,255,0.06)]' },
  TikTok: { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#FF0050]', border: 'border-[rgba(255,255,255,0.06)]' },
  Instagram: { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#E1306C]', border: 'border-[rgba(255,255,255,0.06)]' },
  News: { bg: 'bg-[rgba(253,186,45,0.1)]', text: 'text-[#FDBA2D]', border: 'border-[rgba(255,255,255,0.06)]' },
};

const SENTIMENT_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  positive: {
    bg: 'bg-[rgba(255,255,255,0.06)]',
    text: 'text-[#888888]',
    border: 'border-[rgba(255,255,255,0.06)]',
    icon: <ThumbsUp className="w-3 h-3" />,
  },
  neutral: {
    bg: 'bg-[rgba(253,186,45,0.1)]',
    text: 'text-[#FDBA2D]',
    border: 'border-[rgba(255,255,255,0.06)]',
    icon: <Minus className="w-3 h-3" />,
  },
  negative: {
    bg: 'bg-[rgba(255,255,255,0.06)]',
    text: 'text-[#888888]',
    border: 'border-[rgba(255,255,255,0.06)]',
    icon: <ThumbsDown className="w-3 h-3" />,
  },
};

interface MentionItem {
  platform: string;
  text: string;
  author: string;
  likes: number;
  retweets: number;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

/* ── Mock data ── */
const MOCK_MENTIONS: MentionItem[] = [
  { platform: 'X', text: 'Just discovered @MKBHD channel — the production quality is insane. Best tech reviews on YouTube by far.', author: '@techlover_ng', likes: 1243, retweets: 89, timestamp: '2h ago', sentiment: 'positive' },
  { platform: 'Reddit', text: 'Can we talk about how MrBeast has completely changed the YouTube landscape? The production budgets are crazy now.', author: 'u/video_analyst', likes: 3421, retweets: 156, timestamp: '5h ago', sentiment: 'neutral' },
  { platform: 'TikTok', text: 'This Nigerian creator on YouTube is literally teaching me Python for free. Thread of all his tutorials below 👇', author: '@devwithk', likes: 5672, retweets: 423, timestamp: '1d ago', sentiment: 'positive' },
  { platform: 'Instagram', text: 'Disappointing content from this YouTube channel lately. The quality has really dropped since they started posting daily.', author: '@mediacritic', likes: 892, retweets: 67, timestamp: '3h ago', sentiment: 'negative' },
  { platform: 'News', text: 'Top YouTube creator announces new streaming platform to rival Twitch. Industry analysts predict major shift in content creation.', author: 'TechCrunch', likes: 8901, retweets: 2100, timestamp: '8h ago', sentiment: 'neutral' },
  { platform: 'X', text: 'Okay but can we appreciate how Taylor Swift has leveraged YouTube Shorts to reach new audiences? Marketing genius.', author: '@musicinsider', likes: 2341, retweets: 178, timestamp: '6h ago', sentiment: 'positive' },
  { platform: 'Reddit', text: 'The algorithm change on YouTube is killing small channels. My views dropped 60% this month. Anyone else experiencing this?', author: 'u/smallcreator', likes: 1567, retweets: 234, timestamp: '12h ago', sentiment: 'negative' },
  { platform: 'TikTok', text: 'POV: You found the best cooking channel on YouTube and now you cook every meal from their recipes. No regrets 😂', author: '@foodie_ke', likes: 8234, retweets: 678, timestamp: '1d ago', sentiment: 'positive' },
];


export function SocialMentionsTool() {
  const { spendTokens } = useNychIQStore();
  const [channelInput, setChannelInput] = useState('');
  const [platformFilter, setPlatformFilter] = useState<MentionPlatform>('All');
  const [mentions, setMentions] = useState<MentionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMentions = async () => {
    if (!channelInput.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    const ok = spendTokens('social-mentions');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a social media intelligence analyst. Find recent mentions of the YouTube channel "${channelInput.trim()}" across social platforms.

Return a JSON array of 8 mention objects with these exact fields:
- "platform": one of "X", "Reddit", "TikTok", "Instagram", "News"
- "text": the mention text (50-200 characters)
- "author": the author handle or name
- "likes": number of likes/ups (number)
- "retweets": number of retweets/shares/replies (number)
- "timestamp": relative time like "2h ago", "1d ago" (string)
- "sentiment": one of "positive", "neutral", "negative"

Return ONLY the JSON array, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        setMentions(Array.isArray(parsed) ? parsed.slice(0, 8) : MOCK_MENTIONS);
      } catch {
        setMentions(MOCK_MENTIONS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search mentions. Please try again.');
      setMentions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentions = platformFilter === 'All' ? mentions : mentions.filter((m) => m.platform === platformFilter);
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
              <AtSign className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Channel Mentions</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Find who&apos;s talking about any YouTube channel across platforms</p>
            </div>
          </div>

          {/* Channel Input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
              <AtSign className="w-3 h-3" /> Channel Name / Handle
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchMentions(); }}
                placeholder="e.g. MrBeast, @mkbhd, Mark Rober"
                className="flex-1 h-11 px-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
              />
              <button
                onClick={searchMentions}
                disabled={loading || !channelInput.trim()}
                className="px-5 h-11 rounded-lg bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search Mentions
              </button>
            </div>
          </div>

          {/* Platform Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {MENTION_PLATFORMS.map((p) => {
              const styles = p !== 'All' ? PLATFORM_STYLES[p] : null;
              const isActive = platformFilter === p;
              return (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isActive
                      ? styles
                        ? `${styles.bg} ${styles.text} ${styles.border}`
                        : 'bg-[rgba(253,186,45,0.1)] text-[#FDBA2D] border-[rgba(255,255,255,0.06)]'
                      : 'bg-[#0a0a0a] text-[#a0a0a0] border-[#1A1A1A] hover:border-[#1a1a1a]'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#888888] mx-auto mb-3" />
          <p className="text-sm text-[#FFFFFF] mb-4">{error}</p>
          <button
            onClick={searchMentions}
            className="px-4 py-2 rounded-lg bg-[#888888] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-14 h-5 bg-[#1A1A1A] rounded-full animate-pulse" />
                <div className="w-12 h-5 bg-[#1A1A1A] rounded-full animate-pulse" />
                <div className="ml-auto w-16 h-5 bg-[#1A1A1A] rounded-full animate-pulse" />
              </div>
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-full" />
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
              <div className="flex gap-3">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-12" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-12" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && filteredMentions.length > 0 && (
        <div className="space-y-3 max-h-[720px] overflow-y-auto custom-scrollbar">
          {filteredMentions.map((mention, i) => {
            const pStyle = PLATFORM_STYLES[mention.platform] || PLATFORM_STYLES['X'];
            const sStyle = SENTIMENT_STYLES[mention.sentiment] || SENTIMENT_STYLES.neutral;
            return (
              <div
                key={i}
                className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 hover:border-[#1a1a1a] transition-all group"
              >
                {/* Top row */}
                <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${pStyle.bg} ${pStyle.text} border ${pStyle.border}`}>
                    {mention.platform}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${sStyle.bg} ${sStyle.text} border ${sStyle.border}`}>
                    {sStyle.icon}
                    {mention.sentiment}
                  </span>
                  <span className="ml-auto text-[10px] text-[#666666]">{mention.timestamp}</span>
                </div>

                {/* Mention Text */}
                <p className="text-sm text-[#FFFFFF] leading-relaxed mb-3">
                  {truncate(mention.text, 200)}
                </p>

                {/* Author + Engagement */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#FDBA2D] flex items-center gap-1">
                    {mention.author}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                  <div className="flex items-center gap-4 text-[11px] text-[#a0a0a0]">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {mention.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="w-3 h-3" /> {mention.retweets.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered Empty */}
      {!loading && searched && mentions.length > 0 && filteredMentions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <MessageCircle className="w-8 h-8 text-[#666666] mb-3" />
          <h3 className="text-sm font-semibold text-[#FFFFFF] mb-1">No mentions on {platformFilter}</h3>
          <p className="text-xs text-[#a0a0a0]">Try selecting &quot;All&quot; or a different platform</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
            <AtSign className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Find Channel Mentions</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Enter a YouTube channel name or handle to discover what people are saying across social platforms.</p>
        </div>
      )}

      {searched && !loading && (
        <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS.crossplatform} tokens per search</div>
      )}
    </div>
  );
}
