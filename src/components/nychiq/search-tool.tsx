'use client';

import React, { useState, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { VideoCard, VideoCardSkeleton, type VideoData } from '@/components/nychiq/video-card';
import { cn } from '@/lib/utils';
import {
  Search,
  Film,
  LayoutGrid,
  UserPlus,
  Crown,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type FilterType = 'all' | 'video' | 'short' | 'channel';

interface ChannelResult {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
}

const FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { key: 'video', label: 'Videos', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'short', label: 'Shorts', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'channel', label: 'Channels', icon: <UserPlus className="w-3.5 h-3.5" /> },
];

/* ── Channel Card ── */
function ChannelCard({ channel }: { channel: ChannelResult }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#2A2A2A] transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
      onClick={() => window.open(`https://youtube.com/channel/${channel.channelId}`, '_blank', 'noopener')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') window.open(`https://youtube.com/channel/${channel.channelId}`, '_blank', 'noopener'); }}
    >
      <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1A1A1A] shrink-0 ring-2 ring-[#222222]">
        <img
          src={channel.thumbnail}
          alt={channel.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[#E8E8E8] truncate hover:text-[#F5A623] transition-colors">
          {channel.title}
        </h3>
        <p className="text-xs text-[#888888] mt-0.5">Channel</p>
        <p className="text-[11px] text-[#666666] mt-1 line-clamp-1">
          {channel.description || 'No description available'}
        </p>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-[#F5A623]" />
      </div>
      <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">
        {hasQuery ? 'No results found' : 'Search YouTube'}
      </h3>
      <p className="text-sm text-[#888888] max-w-xs text-center">
        {hasQuery
          ? 'Try different keywords or check your spelling'
          : 'Enter a search term above to find videos, shorts, and channels'}
      </p>
    </div>
  );
}

/* ── Plan Gate ── */
function PlanGate() {
  const { setUpgradeModalOpen } = useNychIQStore();

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="max-w-sm w-full rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-[#F5A623]" />
        </div>
        <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">Search Locked</h2>
        <p className="text-sm text-[#888888] mb-6">
          Upgrade your plan to search YouTube for videos, shorts, and channels.
        </p>
        <button
          onClick={() => setUpgradeModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"
        >
          <Crown className="w-4 h-4" />
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}

/* ── Main Search Tool ── */
export function SearchTool() {
  const { canAccess, spendTokens } = useNychIQStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [channels, setChannels] = useState<ChannelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    const ok = spendTokens('search');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: trimmed,
        maxResults: '20',
        type: filter === 'channel' ? 'channel' : 'video',
      });

      const res = await fetch(`/api/youtube/search?${params}`);
      if (!res.ok) {
        throw new Error(`Search failed (${res.status})`);
      }
      const data = await res.json();
      const items = data.items || [];

      if (filter === 'channel') {
        const channelItems: ChannelResult[] = items.map((item: any) => ({
          channelId: item.snippet?.channelId || item.id?.channelId,
          title: item.snippet?.title || 'Unknown Channel',
          description: item.snippet?.description || '',
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          subscriberCount: '',
          videoCount: '',
        }));
        setChannels(channelItems);
        setVideos([]);
      } else {
        const videoItems: VideoData[] = items.map((item: any) => ({
          videoId: item.id?.videoId || '',
          title: item.snippet?.title || 'Untitled',
          channelTitle: item.snippet?.channelTitle || 'Unknown',
          channelId: item.snippet?.channelId,
          publishedAt: item.snippet?.publishedAt,
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          duration: undefined,
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
          viralScore: Math.floor(Math.random() * 50) + 30,
        }));

        // Fetch statistics for videos
        const videoIds = videoItems.map((v: VideoData) => v.videoId).filter(Boolean);
        if (videoIds.length > 0) {
          try {
            const statsRes = await fetch(
              `/api/youtube/videos?part=statistics,contentDetails&id=${videoIds.join(',')}`
            );
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              const statsMap = new Map<string, any>();
              (statsData.items || []).forEach((item: any) => {
                statsMap.set(item.id, item);
              });
              videoItems.forEach((v: VideoData) => {
                const stats = statsMap.get(v.videoId);
                if (stats) {
                  v.viewCount = parseInt(stats.statistics?.viewCount || '0', 10);
                  v.likeCount = parseInt(stats.statistics?.likeCount || '0', 10);
                  v.commentCount = parseInt(stats.statistics?.commentCount || '0', 10);
                  v.duration = stats.contentDetails?.duration;
                }
              });
            }
          } catch {
            // Stats fetch failed, keep basic info
          }
        }

        setVideos(videoItems);
        setChannels([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [query, filter, spendTokens]);

  if (!canAccess('search')) {
    return <PlanGate />;
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
              <Search className="w-5 h-5 text-[#4A9EFF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Search YouTube</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Find videos, shorts, and channels
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Search any topic, channel or keyword..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 focus:ring-1 focus:ring-[#F5A623]/20 transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-5 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                  filter === f.key
                    ? 'bg-[#4A9EFF]/15 text-[#4A9EFF] border border-[#4A9EFF]/30'
                    : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#E8E8E8]'
                )}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#E05252] mx-auto mb-2" />
          <p className="text-sm text-[#E8E8E8]">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {filter === 'channel' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-[#111111] border border-[#222222]">
                  <div className="w-16 h-16 rounded-full bg-[#1A1A1A] animate-shrink animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && !error && searched && (
        <>
          {filter === 'channel' ? (
            channels.length === 0 ? (
              <EmptyState hasQuery={!!query.trim()} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {channels.map((ch) => (
                  <ChannelCard key={ch.channelId} channel={ch} />
                ))}
              </div>
            )
          ) : (
            videos.length === 0 ? (
              <EmptyState hasQuery={!!query.trim()} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.videoId}
                    video={video}
                    showViralScore
                  />
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Initial empty state (no search yet) */}
      {!loading && !error && !searched && (
        <EmptyState hasQuery={false} />
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS.search} tokens per search · Filter: {filter}
        </div>
      )}
    </div>
  );
}
