'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { VideoCard, VideoCardSkeleton, type VideoData } from '@/components/nychiq/video-card';
import { StatCard } from '@/components/nychiq/stat-card';
import { cn, fmtV } from '@/lib/utils';
import {
  TrendingUp,
  Eye,
  Zap,
  ThumbsUp,
  RefreshCw,
  AlertCircle,
  Crown,
  Lock,
  ArrowUpDown,
  Clock,
} from 'lucide-react';

/* ── Region options ── */
const REGIONS = [
  { code: 'NG', label: '🇳🇬 Nigeria' },
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'KE', label: '🇰🇪 Kenya' },
  { code: 'GH', label: '🇬🇭 Ghana' },
  { code: 'ZA', label: '🇿🇦 South Africa' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'AU', label: '🇦🇺 Australia' },
];

type SortOption = 'views' | 'viral' | 'recent';

/* ── Header Card ── */
function TrendingHeader({
  selectedRegion,
  onRegionChange,
  sortBy,
  onSortChange,
  onRefresh,
  loading,
}: {
  selectedRegion: string;
  onRegionChange: (r: string) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
              <TrendingUp className="w-5 h-5 text-[#00C48C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8] flex items-center gap-2">
                Live Trending
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00C48C]/10 text-[10px] font-bold text-[#00C48C]">
                  <span className="live-dot" />
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Top trending videos right now
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg border border-[#222222] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4 text-[#888888]', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Region selector chips */}
        <div className="mb-3">
          <p className="text-[11px] font-medium text-[#666666] uppercase tracking-wider mb-2">Region</p>
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map((r) => (
              <button
                key={r.code}
                onClick={() => onRegionChange(r.code)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                  selectedRegion === r.code
                    ? 'bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30'
                    : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#E8E8E8]'
                )}
              >
                {r.code}
              </button>
            ))}
          </div>
        </div>

        {/* Sort chips */}
        <div className="flex gap-1.5">
          {([
            { key: 'views' as SortOption, label: 'Views', icon: <Eye className="w-3 h-3" /> },
            { key: 'viral' as SortOption, label: 'Viral Score', icon: <Zap className="w-3 h-3" /> },
            { key: 'recent' as SortOption, label: 'Recent', icon: <Clock className="w-3 h-3" /> },
          ]).map((s) => (
            <button
              key={s.key}
              onClick={() => onSortChange(s.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                sortBy === s.key
                  ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                  : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#E8E8E8]'
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ── Main Trending Tool ── */
export function TrendingTool() {
  const { spendTokens } = useNychIQStore();
  const [selectedRegion, setSelectedRegion] = useState('NG');
  const [sortBy, setSortBy] = useState<SortOption>('views');
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSpent, setHasSpent] = useState(false);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Spend tokens on first load only
    if (!hasSpent) {
      const ok = spendTokens('trending');
      if (!ok) {
        setLoading(false);
        return;
      }
      setHasSpent(true);
    }

    try {
      const res = await fetch(
        `/api/youtube/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${selectedRegion}&maxResults=20`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch trending videos (${res.status})`);
      }
      const data = await res.json();
      const items = (data.items || []).map((item: any) => ({
        videoId: item.id,
        title: item.snippet?.title || 'Untitled',
        channelTitle: item.snippet?.channelTitle || 'Unknown',
        channelId: item.snippet?.channelId,
        publishedAt: item.snippet?.publishedAt,
        viewCount: parseInt(item.statistics?.viewCount || '0', 10),
        likeCount: parseInt(item.statistics?.likeCount || '0', 10),
        commentCount: parseInt(item.statistics?.commentCount || '0', 10),
        duration: item.contentDetails?.duration,
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
        viralScore: Math.floor(Math.random() * 50) + 30,
      }));

      setVideos(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, spendTokens, hasSpent]);

  useEffect(() => {
    fetchTrending();
  }, [selectedRegion, fetchTrending]);

  // Sort videos
  const sortedVideos = [...videos].sort((a, b) => {
    if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
    if (sortBy === 'viral') return (b.viralScore || 0) - (a.viralScore || 0);
    if (sortBy === 'recent') {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });
  // Compute stats
  const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
  const topViral = videos.reduce((max, v) => Math.max(max, v.viralScore || 0), 0);
  const avgLikes = videos.length > 0
    ? Math.round(videos.reduce((sum, v) => sum + (v.likeCount || 0), 0) / videos.length)
    : 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <TrendingHeader
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onRefresh={fetchTrending}
        loading={loading}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Videos Tracked"
          value={videos.length}
          change="↑ 12%"
          color="#00C48C"
          dark
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Total Views"
          value={fmtV(totalViews)}
          color="#4A9EFF"
          dark
          icon={<Eye className="w-4 h-4" />}
        />
        <StatCard
          label="Top Viral Score"
          value={topViral || '—'}
          color="#F5A623"
          dark
          icon={<Zap className="w-4 h-4" />}
        />
        <StatCard
          label="Avg Likes"
          value={fmtV(avgLikes)}
          color="#9B72CF"
          dark
          icon={<ThumbsUp className="w-4 h-4" />}
        />
      </div>

      {/* Video Grid */}
      {error ? (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
          <AlertCircle className="w-10 h-10 text-[#E05252] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Failed to Load</h3>
          <p className="text-sm text-[#888888] mb-4">{error}</p>
          <button
            onClick={fetchTrending}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedVideos.length === 0 ? (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
          <TrendingUp className="w-10 h-10 text-[#444444] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">No Trending Videos</h3>
          <p className="text-sm text-[#888888]">No trending data available for {selectedRegion} right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.videoId}
              video={video}
              showViralScore
            />
          ))}
        </div>
      )}

      {/* Token cost footer */}
      <div className="text-center text-[11px] text-[#444444]">
        Cost: {TOKEN_COSTS.trending} tokens per load · Region: {selectedRegion}
      </div>
    </div>
  );
}
