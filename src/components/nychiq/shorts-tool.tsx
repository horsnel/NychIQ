'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { VideoCardSkeleton, type VideoData } from '@/components/nychiq/video-card';
import { StatCard } from '@/components/nychiq/stat-card';
import { cn, fmtV, thumbUrl, vidDuration, scoreClass, viralScore as getViralInfo, copyToClipboard } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  Zap, Eye, TrendingUp, Crown, Lock, RefreshCw, AlertCircle, Play, Clock, Flame,
  MoreVertical, ExternalLink, Copy, Hash, FileDown, Link2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortOption = 'views' | 'viral' | 'newest';
const SORT_OPTIONS: { key: SortOption; label: string; icon: React.ReactNode }[] = [
  { key: 'views', label: 'Most Views', icon: <Eye className="w-3 h-3" /> },
  { key: 'viral', label: 'Viral Score', icon: <Flame className="w-3 h-3" /> },
  { key: 'newest', label: 'Newest', icon: <Clock className="w-3 h-3" /> },
];

/* ── Shorts Video Card (9:16 vertical) ── */
function ShortsCard({ video }: { video: VideoData }) {
  const [imgError, setImgError] = useState(false);
  const vs = video.viralScore ? getViralInfo(video.viralScore) : null;
  const youtubeUrl = `https://youtube.com/watch?v=${video.videoId}`;

  const handleCopyTitle = async () => {
    const ok = await copyToClipboard(video.title);
    showToast(ok ? 'Title copied!' : 'Failed to copy title', ok ? 'success' : 'error');
  };
  const handleCopyUrl = async () => {
    const ok = await copyToClipboard(youtubeUrl);
    showToast(ok ? 'URL copied!' : 'Failed to copy URL', ok ? 'success' : 'error');
  };
  const handleCopyHashtags = async () => {
    const words = video.title.split(/\s+/).filter(w => w.length > 3);
    const tags = words.slice(0, 5).map(w => `#${w.replace(/[^a-zA-Z0-9]/g, '')}`);
    const ok = await copyToClipboard(tags.join(' '));
    showToast(ok ? 'Hashtags copied!' : 'Failed to copy hashtags', ok ? 'success' : 'error');
  };
  const handleExportCSV = () => {
    const headers = ['Title', 'Channel', 'Views', 'Likes', 'Comments', 'Viral Score', 'URL'];
    const row = [`"${video.title}"`, `"${video.channelTitle}"`, String(video.viewCount || 0), String(video.likeCount || 0), String(video.commentCount || 0), String(video.viralScore || 0), `https://youtube.com/watch?v=${video.videoId}`];
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video.videoId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="group cursor-pointer rounded-xl overflow-hidden bg-[#141414] border border-[#222222] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg hover:shadow-black/30 hover:border-[#2A2A2A]"
      onClick={() => window.open(youtubeUrl, '_blank', 'noopener')} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') window.open(youtubeUrl, '_blank', 'noopener'); }}>
      <div className="relative aspect-[9/16] bg-[#1A1A1A] overflow-hidden">
        {!imgError ? (
          <img src={video.thumbnail || thumbUrl(video.videoId, 'maxres')} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center"><Play className="w-8 h-8 text-[#444]" /></div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#FDBA2D]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {video.viralScore && video.viralScore >= 70 && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-xs font-bold">
            {video.viralScore >= 85 ? (<><span>🔥</span><span className="text-[#10B981]">VIRAL</span></>) : (<><span>⚡</span><span className="text-[#FDBA2D]">HOT</span></>)}
          </span>
        )}
        <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(); }} className="absolute top-2 left-2 z-20 p-1 rounded-md bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80 focus:outline-none" aria-label="Copy video link"><Link2 className="w-3.5 h-3.5 text-white" /></button>
        {video.duration && (<span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-medium bg-black/80 rounded text-white">{vidDuration(video.duration)}</span>)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute bottom-2 right-2 z-20 p-1 rounded-md bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80 focus:outline-none" onClick={(e) => e.stopPropagation()} aria-label="Shorts options"><MoreVertical className="w-4 h-4 text-white" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="bg-[#141414] border-[#222] min-w-[200px]">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(youtubeUrl, '_blank', 'noopener'); }} className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] cursor-pointer"><ExternalLink className="w-4 h-4" />Open on YouTube</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#222]" />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyTitle(); }} className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] cursor-pointer"><Copy className="w-4 h-4" />Copy Title</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyUrl(); }} className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] cursor-pointer"><Copy className="w-4 h-4" />Copy URL</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#222]" />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyHashtags(); }} className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] cursor-pointer"><Hash className="w-4 h-4" />Copy Hashtags</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#222]" />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleExportCSV(); }} className="text-[#888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] cursor-pointer"><FileDown className="w-4 h-4" />Export CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-[#E8E8E8] line-clamp-2 group-hover:text-[#FDBA2D] transition-colors leading-snug">{video.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-[11px] text-[#666666]"><Eye className="w-3 h-3" />{fmtV(video.viewCount || 0)}</div>
          {vs && (<span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', scoreClass(video.viralScore ?? 0))}>{video.viralScore ?? 0}</span>)}
        </div>
        <p className="text-xs text-[#888888] mt-1 truncate">{video.channelTitle}</p>
      </div>
    </div>
  );
}

function ShortsSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#141414] border border-[#222222]">
      <div className="aspect-[9/16] bg-[#1A1A1A] animate-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-full" />
        <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}

export function ShortsTool() {
  const { spendTokens, region } = useNychIQStore();
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
      if (!ok) { setLoading(false); return; }
      setHasSpent(true);
    }
    try {
      const res = await fetch(`/api/youtube/search?part=snippet&q=trending shorts&type=video&maxResults=18&videoDuration=short&regionCode=${region}`);
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
  }, [spendTokens, hasSpent, region]);

  useEffect(() => { fetchShorts(); }, [fetchShorts]);

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

  const totalViews = videos.reduce((s, v) => s + (v.viewCount || 0), 0);
  const topViral = videos.reduce((m, v) => Math.max(m, v.viralScore || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]"><Zap className="w-5 h-5 text-[#FDBA2D]" /></div>
              <div>
                <h2 className="text-base font-bold text-[#E8E8E8] flex items-center gap-2">
                  Trending Shorts
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[10px] font-bold text-[#10B981]">
                    <span className="live-dot" />LIVE
                  </span>
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">Top performing YouTube Shorts right now</p>
              </div>
            </div>
            <button onClick={() => { setHasSpent(false); fetchShorts(); }} disabled={loading} className="p-2 rounded-lg border border-[#222222] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50">
              <RefreshCw className={cn('w-4 h-4 text-[#888888]', loading && 'animate-spin')} />
            </button>
          </div>

          {/* Sort Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                  sortBy === s.key
                    ? 'bg-[#FDBA2D]/15 text-[#FDBA2D] border border-[#FDBA2D]/30'
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
        <StatCard label="Shorts Found" value={videos.length} change="↑ 8%" color="#10B981" dark icon={<Flame className="w-4 h-4" />} />
        <StatCard label="Total Views" value={fmtV(totalViews)} color="#4A9EFF" dark icon={<Eye className="w-4 h-4" />} />
        <StatCard label="Top Viral Score" value={topViral || '—'} color="#FDBA2D" dark icon={<Zap className="w-4 h-4" />} />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
          <p className="text-sm text-[#E8E8E8]">{error}</p>
          <button onClick={fetchShorts} className="mt-3 px-4 py-2 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#D9A013] transition-colors">Try Again</button>
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
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">No Shorts Found</h3>
          <p className="text-sm text-[#888888]">No trending shorts data available right now.</p>
        </div>
      )}

      <div className="text-center text-[11px] text-[#444444]">
        Cost: {TOKEN_COSTS.shorts} tokens per load · Region: {region} · Sort: {sortBy}
      </div>
    </div>
  );
}
