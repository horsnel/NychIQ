'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useNychIQStore } from '@/lib/store';
import { ytFetch } from '@/lib/api';
import { cn, fmtV, timeAgo, thumbUrl, vidDuration, copyToClipboard, debounce } from '@/lib/utils';
import { Search, Loader2, Copy, Check, AlertCircle, Play, Clock, Eye, Heart, TrendingUp, X, SlidersHorizontal } from 'lucide-react';

/* ── Types ── */
type FilterType = 'all' | 'video' | 'shorts' | 'channel';
type SortType = 'relevance' | 'date' | 'viewCount' | 'rating';

interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnail: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  description: string;
  /* Derived metrics */
  viralScore: number;
  seoScore: number;
  engagementRate: number;
}

interface ChannelResult {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}

/* ── Constants ── */
const FILTER_CYCLE: FilterType[] = ['all', 'video', 'shorts', 'channel'];
const FILTER_LABELS: Record<FilterType, string> = {
  all: 'All',
  video: 'Videos',
  shorts: 'Shorts',
  channel: 'Channels',
};
const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'date', label: 'Upload Date' },
  { key: 'viewCount', label: 'View Count' },
  { key: 'rating', label: 'Rating' },
];

/* ── Derived Metric Calculators ── */

function calcViralScore(likes: number, views: number, comments: number): number {
  if (views === 0) return 0;
  const raw = (likes / views) * 100 + (comments / views) * 500;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function calcSeoScore(title: string, description: string): number {
  let score = 50; // base
  const titleLen = title.length;
  // Title length: 40-60 chars optimal
  if (titleLen >= 40 && titleLen <= 60) score += 30;
  else if (titleLen >= 30 && titleLen <= 70) score += 20;
  else if (titleLen >= 20 && titleLen <= 80) score += 10;
  else score -= 10;
  // Description length bonus
  if (description.length > 100) score += 10;
  if (description.length > 300) score += 10;
  return Math.max(0, Math.min(100, score));
}

function calcEngagementRate(likes: number, comments: number, views: number): number {
  if (views === 0) return 0;
  return ((likes + comments) / views) * 100;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#FDBA2D';
  return '#EF4444';
}

function scoreBg(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#FDBA2D';
  return '#EF4444';
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="rounded-[12px] bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] overflow-hidden animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="w-full aspect-video bg-[#141414]" />
      {/* Text placeholders */}
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-[#141414] rounded w-full" />
        <div className="h-3.5 bg-[#141414] rounded w-3/4" />
        <div className="h-3 bg-[#141414] rounded w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-10 bg-[#141414] rounded-full" />
          <div className="h-5 w-12 bg-[#141414] rounded-full" />
          <div className="h-5 w-10 bg-[#141414] rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Video Result Card ── */
function VideoCard({
  video,
  copiedId,
  onCopy,
}: {
  video: VideoResult;
  copiedId: string | null;
  onCopy: (id: string) => void;
}) {
  const isCopied = copiedId === video.videoId;
  const viralColor = scoreColor(video.viralScore);

  return (
    <div className="rounded-[12px] bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] overflow-hidden flex flex-col hover:border-[rgba(255,255,255,0.1)] transition-colors duration-200">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-[#141414] overflow-hidden">
        <img
          src={thumbUrl(video.videoId, 'maxres')}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = thumbUrl(video.videoId, 'high');
          }}
        />
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[rgba(13,13,13,0.8)] text-[11px] text-[#FFFFFF] font-medium leading-none">
            {vidDuration(video.duration)}
          </div>
        )}
        {/* Score badge */}
        <div
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: scoreBg(video.viralScore) }}
        >
          <span className="text-[11px] font-bold text-[#FFFFFF] leading-none">
            {video.viralScore}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 pt-3 flex-1 flex flex-col">
        {/* Title */}
        <h3
          className="text-[14px] text-[#FFFFFF] font-medium leading-snug line-clamp-2 mb-1"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </h3>
        {/* Channel */}
        <p className="text-[12px] text-[#A3A3A3] truncate">{video.channelTitle}</p>
        {/* Stats */}
        <p className="text-[11px] text-[#555555] mt-0.5">
          {fmtV(video.viewCount)} views &bull; {timeAgo(video.publishedAt)}
        </p>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {/* SEO Score */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: 'rgba(253,186,45,0.15)', color: '#FDBA2D' }}>
            {video.seoScore}
          </span>
          {/* Engagement */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
            {video.engagementRate.toFixed(1)}%
          </span>
          {/* Viral Score */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: viralColor === '#10B981' ? 'rgba(16,185,129,0.15)' : viralColor === '#FDBA2D' ? 'rgba(253,186,45,0.15)' : 'rgba(239,68,68,0.15)',
              color: viralColor,
            }}>
            {video.viralScore}
          </span>
        </div>
      </div>

      {/* Copy button */}
      <div className="px-3 pb-3 flex justify-end">
        <button
          onClick={() => onCopy(video.videoId)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150 hover:scale-110 active:scale-95"
          style={{ backgroundColor: 'rgba(253,186,45,0.1)' }}
          title="Copy video info"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
          ) : (
            <Copy className="w-3.5 h-3.5" style={{ color: '#FDBA2D' }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Channel Result Card ── */
function ChannelResultCard({ channel }: { channel: ChannelResult }) {
  return (
    <div
      className="rounded-[12px] bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] overflow-hidden flex items-center gap-4 p-4 hover:border-[rgba(255,255,255,0.1)] transition-colors duration-200 cursor-pointer"
      onClick={() => window.open(`https://youtube.com/channel/${channel.channelId}`, '_blank', 'noopener')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') window.open(`https://youtube.com/channel/${channel.channelId}`, '_blank', 'noopener'); }}
    >
      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#141414] shrink-0 ring-2 ring-[rgba(255,255,255,0.05)]">
        <img
          src={channel.thumbnail}
          alt={channel.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-medium text-[#FFFFFF] truncate">{channel.title}</h3>
        <p className="text-[12px] text-[#A3A3A3] mt-0.5">Channel</p>
        {channel.description && (
          <p className="text-[11px] text-[#555555] mt-1 truncate">{channel.description}</p>
        )}
      </div>
    </div>
  );
}

/* ── Empty State (no search yet) ── */
function EmptyStateInitial() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <Search className="w-12 h-12 mb-4" style={{ color: '#555555' }} />
      <p className="text-[16px] text-[#A3A3A3] font-medium mb-1">
        Search for videos, channels, and more
      </p>
      <p className="text-[13px] text-[#555555]">
        Enter a query to get started
      </p>
    </div>
  );
}

/* ── No Results State ── */
function EmptyStateNoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <Search className="w-12 h-12 mb-4" style={{ color: '#555555' }} />
      <p className="text-[16px] text-[#A3A3A3] font-medium mb-1">
        No results found for &ldquo;{query}&rdquo;
      </p>
      <p className="text-[13px] text-[#555555]">
        Try different keywords or check your spelling
      </p>
    </div>
  );
}

/* ── Error State ── */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <AlertCircle className="w-12 h-12 mb-4" style={{ color: '#EF4444' }} />
      <p className="text-[14px] font-medium mb-4" style={{ color: '#EF4444' }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        className="px-5 py-2 rounded-full text-[13px] font-medium text-[#FFFFFF] transition-colors duration-150 hover:opacity-90"
        style={{ backgroundColor: '#FDBA2D', color: '#0D0D0D' }}
      >
        Try again
      </button>
    </div>
  );
}

/* ── Map store filter string to internal type ── */
function mapStoreFilter(val: string): FilterType {
  switch (val) {
    case 'Videos': return 'video';
    case 'Shorts': return 'shorts';
    case 'Channels': return 'channel';
    default: return 'all';
  }
}

/* ── Main Search Tool ── */
export function SearchTool() {
  const { region, searchFilter, setSearchFilter, spendTokens } = useNychIQStore();

  /* State */
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>(mapStoreFilter(searchFilter));
  const [sort, setSort] = useState<SortType>('relevance');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [channelResults, setChannelResults] = useState<ChannelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* Sync store filter → internal */
  useEffect(() => {
    setFilter(mapStoreFilter(searchFilter));
  }, [searchFilter]);

  /* Clear copy feedback after 2s */
  useEffect(() => {
    if (!copiedId) return;
    const t = setTimeout(() => setCopiedId(null), 2000);
    return () => clearTimeout(t);
  }, [copiedId]);

  /* Cycle filter */
  const cycleFilter = useCallback(() => {
    const idx = FILTER_CYCLE.indexOf(filter);
    const next = FILTER_CYCLE[(idx + 1) % FILTER_CYCLE.length];
    setFilter(next);
    setSearchFilter(FILTER_LABELS[next]);
  }, [filter, setSearchFilter]);

  /* Clear filter */
  const clearFilter = useCallback(() => {
    setFilter('all');
    setSearchFilter('All');
  }, [setSearchFilter]);

  /* Copy video info */
  const handleCopy = useCallback(async (videoId: string) => {
    const video = results.find((v) => v.videoId === videoId);
    if (!video) return;
    const text = `${video.title}\nhttps://youtube.com/watch?v=${video.videoId}\nID: ${video.videoId}`;
    const ok = await copyToClipboard(text);
    if (ok) setCopiedId(videoId);
  }, [results]);

  /* Perform search */
  const handleSearch = useCallback(async (overrideQuery?: string) => {
    const trimmed = (overrideQuery ?? query).trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    /* Spend tokens */
    const ok = spendTokens('search');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      if (filter === 'channel') {
        /* Channel search */
        const data = await ytFetch('search', {
          q: trimmed,
          maxResults: 12,
          type: 'channel',
          order: sort,
          regionCode: region,
        });
        const items = data.items || [];
        const channels: ChannelResult[] = items.map((item: any) => ({
          channelId: item.snippet?.channelId || item.id?.channelId || '',
          title: item.snippet?.title || 'Unknown Channel',
          description: item.snippet?.description || '',
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          publishedAt: item.snippet?.publishedAt || '',
        }));
        setChannelResults(channels);
        setResults([]);
      } else {
        /* Video search */
        const data = await ytFetch('search', {
          q: trimmed,
          maxResults: 12,
          type: 'video',
          order: sort,
          regionCode: region,
        });
        const items = data.items || [];
        const videoIds = items
          .map((item: any) => item.id?.videoId)
          .filter(Boolean);

        /* Fetch video statistics in parallel */
        let statsMap = new Map<string, any>();
        if (videoIds.length > 0) {
          try {
            const statsData = await ytFetch('videos', {
              id: videoIds.join(','),
              part: 'statistics,contentDetails',
            });
            (statsData.items || []).forEach((item: any) => {
              statsMap.set(item.id, item);
            });
          } catch {
            /* Stats fetch failed — continue with basic info */
          }
        }

        /* Build result objects */
        const videos: VideoResult[] = items.map((item: any) => {
          const videoId = item.id?.videoId || '';
          const stats = statsMap.get(videoId);
          const views = parseInt(stats?.statistics?.viewCount || '0', 10);
          const likes = parseInt(stats?.statistics?.likeCount || '0', 10);
          const comments = parseInt(stats?.statistics?.commentCount || '0', 10);
          const title = item.snippet?.title || '';
          const description = item.snippet?.description || '';
          const duration = stats?.contentDetails?.duration || '';

          return {
            videoId,
            title,
            channelTitle: item.snippet?.channelTitle || 'Unknown',
            channelId: item.snippet?.channelId || '',
            publishedAt: item.snippet?.publishedAt || '',
            thumbnail: item.snippet?.thumbnails?.high?.url || '',
            duration,
            viewCount: views,
            likeCount: likes,
            commentCount: comments,
            description,
            viralScore: calcViralScore(likes, views, comments),
            seoScore: calcSeoScore(title, description),
            engagementRate: calcEngagementRate(likes, comments, views),
          };
        });

        setResults(videos);
        setChannelResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  }, [query, filter, sort, region, spendTokens]);

  /* Re-search when sort changes (if already searched) */
  useEffect(() => {
    if (searched && query.trim()) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  return (
    <div className="w-full animate-fade-in-up">
      {/* ── Search Input (centered pill) ── */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-[640px]">
          <div
            className="relative flex items-center h-14 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: '#141414',
              border: '1px solid #1F1F1F',
            }}
          >
            {/* Search icon */}
            <div className="pl-5 flex items-center">
              <Search className="w-5 h-5" style={{ color: '#555555' }} />
            </div>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Search YouTube videos, channels..."
              className="flex-1 h-full bg-transparent text-[16px] text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none px-3"
            />

            {/* Filter toggle button */}
            <button
              onClick={cycleFilter}
              className="mr-2 h-8 px-3 rounded-full text-[12px] font-medium flex items-center gap-1.5 transition-colors duration-150 whitespace-nowrap"
              style={{
                color: '#FDBA2D',
                backgroundColor: 'rgba(253,186,45,0.08)',
              }}
            >
              {FILTER_LABELS[filter]}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Active filter pill */}
        {filter !== 'all' && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium"
            style={{
              backgroundColor: 'rgba(253,186,45,0.1)',
              color: '#FDBA2D',
              border: '1px solid rgba(253,186,45,0.2)',
            }}
          >
            Filter: {FILTER_LABELS[filter]}
            <button
              onClick={clearFilter}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Sort options (show when searched) */}
        {searched && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={cn(
                  'px-3 py-1 rounded-full text-[12px] font-medium transition-colors duration-150 border',
                )}
                style={
                  sort === opt.key
                    ? { backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6', borderColor: 'rgba(59,130,246,0.2)' }
                    : { backgroundColor: '#141414', color: '#A3A3A3', borderColor: '#1F1F1F' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── Error State ── */}
      {!loading && error && (
        <ErrorState message={error} onRetry={() => handleSearch()} />
      )}

      {/* ── Results ── */}
      {!loading && !error && searched && filter !== 'channel' && results.length > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {results.map((video) => (
            <VideoCard
              key={video.videoId}
              video={video}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      {/* ── Channel Results ── */}
      {!loading && !error && searched && filter === 'channel' && channelResults.length > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {channelResults.map((ch) => (
            <ChannelResultCard key={ch.channelId} channel={ch} />
          ))}
        </div>
      )}

      {/* ── No Results ── */}
      {!loading && !error && searched && results.length === 0 && channelResults.length === 0 && (
        <EmptyStateNoResults query={query} />
      )}

      {/* ── Initial Empty State (no search yet) ── */}
      {!loading && !error && !searched && (
        <EmptyStateInitial />
      )}
    </div>
  );
}
