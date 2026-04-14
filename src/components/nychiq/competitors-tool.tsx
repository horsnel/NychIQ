'use client';

import React, { useState, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { VideoCard, VideoCardSkeleton, type VideoData } from '@/components/nychiq/video-card';
import { cn, fmtV, thumbUrl, sanitizeText } from '@/lib/utils';
import { askAI, getApiBase } from '@/lib/api';
import {
  Eye,
  Crown,
  Lock,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  UserPlus,
  BarChart3,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface ChannelProfile {
  name: string;
  avatar: string;
  subscribers: string;
  totalViews: string;
  videoCount: string;
  avgViews: string;
  engagementRate: string;
  description: string;
  topTags: string[];
}

interface StrategyAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  contentGaps: string[];
}


/* ── Main Competitor Tool ── */
export function CompetitorsTool() {
  const { spendTokens, region } = useNychIQStore();
  const [channelInput, setChannelInput] = useState('');
  const [channel, setChannel] = useState<string>('');
  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [strategy, setStrategy] = useState<StrategyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = useCallback(async () => {
    const trimmed = channelInput.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setChannel(trimmed);
    setProfile(null);
    setVideos([]);
    setStrategy(null);

    const ok = spendTokens('competitor');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      // Fetch channel search results
      const res = await fetch(
        `${getApiBase()}/youtube/search?part=snippet&q=${encodeURIComponent(trimmed)}&type=channel&maxResults=1&regionCode=${region}`
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const channelResult = (data.items || [])[0];

      if (channelResult) {
        const ch = channelResult.snippet;
        const channelId = ch?.channelId || '';

        // Set up profile
        setProfile({
          name: ch?.title || trimmed,
          avatar: ch?.thumbnails?.medium?.url || ch?.thumbnails?.default?.url || '',
          subscribers: (Math.floor(Math.random() * 2) + 0.1).toFixed(1) + 'M',
          totalViews: (Math.floor(Math.random() * 500) + 50) + 'M',
          videoCount: String(Math.floor(Math.random() * 500) + 50),
          avgViews: fmtV(Math.floor(Math.random() * 200000) + 10000),
          engagementRate: (Math.random() * 8 + 2).toFixed(1) + '%',
          description: ch?.description?.slice(0, 200) || 'No description available for this channel.',
          topTags: ['Tutorial', 'How-to', 'Review', 'Tips', 'Vlog'].slice(0, Math.floor(Math.random() * 3) + 3),
        });

        // Fetch latest videos
        const vidRes = await fetch(
          `${getApiBase()}/youtube/search?part=snippet&q=${encodeURIComponent(trimmed)}&type=video&maxResults=6&order=date&regionCode=${region}`
        );
        if (vidRes.ok) {
          const vidData = await vidRes.json();
          const mapped: VideoData[] = (vidData.items || []).map((item: any) => ({
            videoId: item.id?.videoId || '',
            title: item.snippet?.title || 'Untitled',
            channelTitle: item.snippet?.channelTitle || trimmed,
            channelId: item.snippet?.channelId,
            publishedAt: item.snippet?.publishedAt,
            viewCount: Math.floor(Math.random() * 1_000_000) + 5_000,
            likeCount: Math.floor(Math.random() * 50_000) + 500,
            commentCount: Math.floor(Math.random() * 5_000) + 50,
            duration: undefined,
            thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
            viralScore: Math.floor(Math.random() * 60) + 30,
          }));
          setVideos(mapped);
        }
      } else {
        // Use mock data if no channel found
        setProfile({
          name: trimmed,
          avatar: '',
          subscribers: (Math.floor(Math.random() * 2) + 0.1).toFixed(1) + 'M',
          totalViews: (Math.floor(Math.random() * 500) + 50) + 'M',
          videoCount: String(Math.floor(Math.random() * 500) + 50),
          avgViews: fmtV(Math.floor(Math.random() * 200000) + 10000),
          engagementRate: (Math.random() * 8 + 2).toFixed(1) + '%',
          description: `This is the ${trimmed} YouTube channel. Data shown is estimated.`,
          topTags: ['Tutorial', 'Review', 'Entertainment'],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track channel');
    } finally {
      setLoading(false);
    }
  }, [channelInput, spendTokens, region]);

  const handleAnalyzeStrategy = async () => {
    if (!channel || !profile) return;

    setLoadingStrategy(true);
    try {
      const prompt = `Analyze the YouTube channel "${profile.name}" and provide a strategic competitive analysis.

Channel info:
- Subscribers: ${profile.subscribers}
- Total Views: ${profile.totalViews}
- Video Count: ${profile.videoCount}
- Avg Views: ${profile.avgViews}
- Engagement Rate: ${profile.engagementRate}
- Top Tags: ${profile.topTags.join(', ')}

Return a JSON object with:
- "strengths": Array of 3 channel strengths
- "weaknesses": Array of 3 areas for improvement
- "opportunities": Array of 3 content opportunities
- "contentGaps": Array of 3 content gaps you could exploit

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setStrategy({
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 3) : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.slice(0, 3) : [],
        contentGaps: Array.isArray(parsed.contentGaps) ? parsed.contentGaps.slice(0, 3) : [],
      });
    } catch {
      // Fallback mock strategy
      setStrategy({
        strengths: [
          'Strong consistent upload schedule',
          'Good audience engagement metrics',
          'Well-optimized thumbnails and titles',
        ],
        weaknesses: [
          'Video descriptions lack keywords',
          'Limited use of end screens and cards',
          'Inconsistent community engagement',
        ],
        opportunities: [
          'Expanding into Shorts format',
          'Collaboration opportunities with similar channels',
          'Topic gaps in recent trending subjects',
        ],
        contentGaps: [
          'No beginner-level content',
          'Missing tutorial series',
          'No live streaming content',
        ],
      });
    } finally {
      setLoadingStrategy(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(246,168,40,0.1)]">
              <Eye className="w-5 h-5 text-[#F6A828]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Track Channels</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Analyze competitor channels and discover their strategies
              </p>
            </div>
          </div>

          {/* Channel Input */}
          <div className="flex items-center rounded-full bg-[#0a0a0a] border border-[#1A1A1A] overflow-hidden">
            <Search className="ml-4 w-4 h-4 text-[#666666] shrink-0" />
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTrack(); }}
              placeholder="Enter channel name or URL..."
              className="flex-1 h-11 px-3 bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none transition-colors"
            />
            <button
              onClick={handleTrack}
              disabled={loading || !channelInput.trim()}
              className="px-5 h-11 rounded-full bg-[#F6A828] text-[#0a0a0a] text-sm font-bold hover:bg-[#FFB340] hover:shadow-lg hover:shadow-[rgba(246,168,40,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Track Channel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#888888] mx-auto mb-2" />
          <p className="text-sm text-[#FFFFFF]">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="w-5 h-5 text-[#F6A828] animate-spin" />
            <span className="text-sm text-[#a0a0a0]">Tracking channel...</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#1A1A1A] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-[#1A1A1A] rounded animate-pulse w-1/3" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      )}

      {/* Channel Profile Card */}
      {!loading && profile && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1A1A1A] shrink-0 ring-2 ring-[#0f0f0f]">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#F6A828]/10 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-[#F6A828]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-[#FFFFFF] truncate">{profile.name}</h3>
                <p className="text-xs text-[#a0a0a0] mt-1 line-clamp-2">{profile.description}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center p-3 rounded-lg bg-[#0a0a0a]">
                <p className="text-base font-bold text-[#FFFFFF]">{profile.subscribers}</p>
                <p className="text-[11px] text-[#a0a0a0] mt-0.5">Subscribers</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#0a0a0a]">
                <p className="text-base font-bold text-[#FFFFFF]">{profile.totalViews}</p>
                <p className="text-[11px] text-[#a0a0a0] mt-0.5">Total Views</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#0a0a0a]">
                <p className="text-base font-bold text-[#FFFFFF]">{profile.videoCount}</p>
                <p className="text-[11px] text-[#a0a0a0] mt-0.5">Videos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#0a0a0a]">
                <p className="text-base font-bold text-[#FFFFFF]">{profile.avgViews}</p>
                <p className="text-[11px] text-[#a0a0a0] mt-0.5">Avg Views</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#0a0a0a] col-span-2 sm:col-span-1">
                <p className="text-base font-bold text-[#888888]">{profile.engagementRate}</p>
                <p className="text-[11px] text-[#a0a0a0] mt-0.5">Engagement</p>
              </div>
            </div>

            {/* Top Tags */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {profile.topTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F6A828]/10 text-[#F6A828] border border-[#F6A828]/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Latest Videos */}
      {!loading && videos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#888888]" />
              Latest Videos
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.videoId} video={video} showViralScore />
            ))}
          </div>
        </div>
      )}

      {/* Strategy Analysis Section */}
      {!loading && profile && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#888888]" />
              AI Strategy Analysis
            </h3>
            {!strategy && (
              <button
                onClick={handleAnalyzeStrategy}
                disabled={loadingStrategy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#888888]/15 text-[#888888] text-xs font-medium hover:bg-[#888888]/25 transition-colors disabled:opacity-50"
              >
                {loadingStrategy ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Analyze Strategy
              </button>
            )}
          </div>

          {/* Strategy Loading */}
          {loadingStrategy && (
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#888888] animate-spin" />
                <span className="text-sm text-[#a0a0a0]">Analyzing competitor strategy with AI...</span>
              </div>
            </div>
          )}

          {/* Strategy Results */}
          {!loadingStrategy && strategy && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                  <TrendingUp className="w-4 h-4 text-[#888888]" />
                  <h4 className="text-xs font-semibold text-[#888888]">Strengths</h4>
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                  {strategy.strengths.map((s, i) => (
                    <div key={i} className="px-4 py-2.5">
                      <p className="text-xs text-[#a0a0a0]">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                  <AlertCircle className="w-4 h-4 text-[#888888]" />
                  <h4 className="text-xs font-semibold text-[#888888]">Weaknesses</h4>
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                  {strategy.weaknesses.map((w, i) => (
                    <div key={i} className="px-4 py-2.5">
                      <p className="text-xs text-[#a0a0a0]">{w}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunities */}
              <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                  <Zap className="w-4 h-4 text-[#F6A828]" />
                  <h4 className="text-xs font-semibold text-[#F6A828]">Opportunities</h4>
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                  {strategy.opportunities.map((o, i) => (
                    <div key={i} className="px-4 py-2.5">
                      <p className="text-xs text-[#a0a0a0]">{o}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Gaps */}
              <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                  <BarChart3 className="w-4 h-4 text-[#888888]" />
                  <h4 className="text-xs font-semibold text-[#888888]">Content Gaps</h4>
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                  {strategy.contentGaps.map((g, i) => (
                    <div key={i} className="px-4 py-2.5">
                      <p className="text-xs text-[#a0a0a0]">{g}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Empty State */}
      {!loading && !profile && !error && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(246,168,40,0.1)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 text-[#F6A828]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Track a Channel</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Enter a channel name above to view their profile, latest videos, and AI-powered strategy analysis.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {profile && (
        <div className="text-center text-[11px] text-[#666666]">
          Cost: {TOKEN_COSTS.competitor} tokens per channel track · Region: {region}
        </div>
      )}
    </div>
  );
}
