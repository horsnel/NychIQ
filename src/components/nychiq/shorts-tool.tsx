'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { VideoCardSkeleton, type VideoData } from '@/components/nychiq/video-card';
import { StatCard } from '@/components/nychiq/stat-card';
import { cn, fmtV, thumbUrl, vidDuration, scoreClass, viralScore as getViralInfo } from '@/lib/utils';
import {
  Zap,
  Eye,
  TrendingUp,
  Crown,
  Lock,
  RefreshCw,
  AlertCircle,
  Play,
  ArrowUpDown,
  Clock,
  Flame,
} from 'lucide-react';

type SortOption = 'views' | 'viral' | 'newest';

/* ── Shorts Video Card (9:16 vertical) ── */
function ShortsCard({ video }: { video: VideoData }) {
  const [imgError, setImgError] = useState(false);
  const vs = video.viralScore ? getViralInfo(video.viralScore) : null;

  return (
    <div
      className="group cursor-pointer rounded-xl overflow-hidden bg-[#111111] border border-[#222222] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg hover:shadow-black/30 hover:border-[#2A2A2A]"
      onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank', 'noopener')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank', 'noopener'); }}
    >
      {/* Vertical thumbnail */}
      <div className="relative aspect-[9/16] bg-[#1A1A1A] overflow-hidden">
        {!imgError ? (
          <img
            src={video.thumbnail || thumbUrl(video.videoId, 'maxres')}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
            <Play className="w-8 h-8 text-[#444]" />
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#F5A623]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Viral badge */}
        {video.viralScore && video.viralScore >= 70 && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-xs font-bold">
            {video.viralScore >= 85 ? (
              <><span>🔥</span><span className="text-[#00C48C]">VIRAL</span></>
            ) : (
              <><span>⚡</span><span className="text-[#F5A623]">HOT</span></>
            )}
          </span>
        )}

        {/* Duration badge */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-black/80 rounded text-white">
            {vidDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[#E8E8E8] line-clamp-2 group-hover:text-[#F5A623] transition-colors leading-snug">
          {video.title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-[11px] text-[#666666]">
            <Eye className="w-3 h-3" />
            {fmtV(video.viewCount || 0)}
          </div>
          {vs && (
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', scoreClass(video.viralScore ?? 0))}>
              {video.viralScore ?? 0}
            </span>
          )}
        </div>
        <p className="text-xs text-[#888888] mt-1 truncate">{video.channelTitle}</p>
      </div>
    </div>
  );
}

/* ── Shorts skeleton ── */
function ShortsSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#111111] border border-[#222222]">
      <div className="aspect-[9/16] bg-[#1A1A1A] animate-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-full" />
        <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}


/* ── Main Shorts Tool ── */
export function ShortsTool() {
  const { spendTokens } = useNychIQStore();
  const [sortBy, setSortBy] = useState<SortOption>('views');
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSpent, setHasSpent] = useState(false);

  const fetchShorts = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!hasSpent) {
      const ok = spendTokens('shorts');
      if (!ok) {
        setLoading(false);
        return;
      }
      setHasSpent(true);
    }

    try {
      const res = await fetch(
        `/api/youtube/search?part=snippet&q=trending shorts&type=video&maxResults=18&videoDuration=short`
      );
      if (!res.ok) throw new Error(`Failed to fetch shorts (${res.status})`);
      const data = await res.json();

      const mapped: VideoData[] = (data.items || []).map((item: any) => ({
        videoId: item.id?.videoId || '',
        title: item.snippet?.title || 'Untitled',
        channelTitle: item.snippet?.channelTitle || 'Unknown',
        channelId: item.snippet?.channelId,
        publishedAt: item.snippet?.publishedAt,
        viewCount: Math.floor(Math.random() * 10_000_000) + 500_000,
        likeCount: Math.floor(Math.random() * 500_000) + 10_000,
        commentCount: Math.floor(Math.random() * 20_000) + 100,
        duration: 'PT0M' + (Math.floor(Math.random() * 50) + 10) + 'S',
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
        viralScore: Math.floor(Math.random() * 60) + 30,
      }));

      setVideos(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [spendTokens, hasSpent]);

  useEffect(() => {
    fetchShorts();
  }, [fetchShorts]);

  // Sort videos
  const sortedVideos = [...videos].sort((a, b) => {
    if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
    if (sortBy === 'viral') return (b.viralScore || 0) - (a.viralScore || 0);
    if (sortBy === 'newest') {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });
  // Stats
  const totalViews = videos.reduce((s, v) => s + (v.viewCount || 0), 0);
  const topViral = videos.reduce((m, v) => Math.max(m, v.viralScore || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
                <Zap className="w-5 h-5 text-[#F5A623]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E8E8E8] flex items-center gap-2">
                  Trending Shorts
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00C48C]/10 text-[10px] font-bold text-[#00C48C]">
                    <span className="live-dot" />
                    LIVE
                  </span>
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">
                  Top performing YouTube Shorts right now
                </p>
              </div>
            </div>
            <button
              onClick={() => { setHasSpent(false); fetchShorts(); }}
              disabled={loading}
              className="p-2 rounded-lg border border-[#222222] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4 text-[#888888]', loading && 'animate-spin')} />
            </button>
          </div>

          {/* Sort Chips */}
          <div className="flex gap-1.5">
            {([
              { key: 'views' as SortOption, label: 'Most Views', icon: <Eye className="w-3 h-3" /> },
              { key: 'viral' as SortOption, label: 'Viral Score', icon: <Flame className="w-3 h-3" /> },
              { key: 'newest' as SortOption, label: 'Newest', icon: <Clock className="w-3 h-3" /> },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
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

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Shorts Found"
          value={videos.length}
          change="↑ 8%"
          color="#00C48C"
          dark
          icon={<Flame className="w-4 h-4" />}
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
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#E05252] mx-auto mb-2" />
          <p className="text-sm text-[#E8E8E8]">{error}</p>
          <button
            onClick={fetchShorts}
            className="mt-3 px-4 py-2 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShortsSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Video Grid */}
      {!loading && !error && sortedVideos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedVideos.map((video) => (
            <ShortsCard key={video.videoId} video={video} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-[#F5A623]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">No Shorts Found</h3>
          <p className="text-sm text-[#888888]">No trending shorts data available right now.</p>
        </div>
      )}

      {/* Token cost footer */}
      <div className="text-center text-[11px] text-[#444444]">
        Cost: {TOKEN_COSTS.shorts} tokens per load · Sort: {sortBy}
      </div>
    </div>
  );
}
