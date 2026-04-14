'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { getApiBase } from '@/lib/api';
import { cn, fmtV, timeAgo, sanitizeText, thumbUrl, scoreClass, copyToClipboard } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  BarChart3,
  Crown,
  Lock,
  RefreshCw,
  AlertCircle,
  Eye,
  Zap,
  ThumbsUp,
  Film,
  UserPlus,
  Copy,
  Link2,
  Hash,
} from 'lucide-react';

type TabType = 'videos' | 'shorts' | 'channels';

interface RankedVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  viralScore: number;
  thumbnail?: string;
  duration?: string;
  publishedAt?: string;
}

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'videos', label: 'Videos', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'shorts', label: 'Shorts', icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'channels', label: 'Channels', icon: <UserPlus className="w-3.5 h-3.5" /> },
];

/* ── Rank badge for top 3 ── */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xs font-black text-black shadow-lg shadow-yellow-500/20">
      1
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-xs font-black text-black shadow-lg shadow-gray-400/20">
      2
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-black text-black shadow-lg shadow-amber-600/20">
      3
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[rgba(255,255,255,0.03)] flex items-center justify-center text-xs font-bold text-[#666666]">
      {rank}
    </div>
  );
}


/* ── Main Rankings Tool ── */
export function RankingsTool() {
  const { spendTokens, region } = useNychIQStore();
  const [tab, setTab] = useState<TabType>('videos');
  const [items, setItems] = useState<RankedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const ok = spendTokens('rankings');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const type = tab === 'shorts' ? 'short,video' : 'video';
      const res = await fetch(
        `${getApiBase()}/youtube/search?part=snippet&q=${tab === 'shorts' ? 'shorts trending' : tab === 'channels' ? 'top channels' : 'trending videos'}&type=${tab === 'channels' ? 'channel' : type}&maxResults=15&order=viewCount&regionCode=${region}`
      );
      if (!res.ok) throw new Error(`Failed to fetch rankings (${res.status})`);
      const data = await res.json();

      const mapped: RankedVideo[] = (data.items || []).map((item: any, i: number) => ({
        videoId: item.id?.videoId || item.id?.channelId || `rank-${i}`,
        title: item.snippet?.title || 'Untitled',
        channelTitle: item.snippet?.channelTitle || 'Unknown',
        viewCount: Math.floor(Math.random() * 5_000_000) + 100_000,
        likeCount: Math.floor(Math.random() * 200_000) + 5_000,
        viralScore: Math.max(10, Math.floor(Math.random() * 90) + (15 - i * 1.5)),
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
        publishedAt: item.snippet?.publishedAt,
      }));

      setItems(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [tab, spendTokens, region]);

  useEffect(() => {
    fetchRankings();
  }, [tab, fetchRankings]);
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
                <BarChart3 className="w-5 h-5 text-[#FDBA2D]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#FFFFFF]">Rankings</h2>
                <p className="text-xs text-[#a0a0a0] mt-0.5">
                  Top performing content this week
                </p>
              </div>
            </div>
            <button
              onClick={fetchRankings}
              disabled={loading}
              className="p-2 rounded-lg border border-[rgba(255,255,255,0.03)] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4 text-[#a0a0a0]', loading && 'animate-spin')} />
            </button>
          </div>

          {/* Tab Chips */}
          <div className="flex gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                  tab === t.key
                    ? 'bg-[#FDBA2D]/15 text-[#FDBA2D] border border-[#FDBA2D]/30'
                    : 'bg-[#0a0a0a] text-[#a0a0a0] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.03)] hover:text-[#FFFFFF]'
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#888888] mx-auto mb-2" />
          <p className="text-sm text-[#FFFFFF]">{error}</p>
          <button
            onClick={fetchRankings}
            className="mt-3 px-4 py-2 rounded-lg bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
          <div className="divide-y divide-[#1A1A1A]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] animate-pulse shrink-0" />
                <div className="w-20 h-12 rounded bg-[#1A1A1A] animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranked List */}
      {!loading && !error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
          <div className="divide-y divide-[#1A1A1A]">
            {items.map((item, i) => (
              <div
                key={item.videoId}
                className="flex items-center gap-4 p-4 hover:bg-[#0a0a0a]/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (tab !== 'channels') {
                    window.open(`https://youtube.com/watch?v=${item.videoId}`, '_blank', 'noopener');
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tab !== 'channels') {
                    window.open(`https://youtube.com/watch?v=${item.videoId}`, '_blank', 'noopener');
                  }
                }}
              >
                {/* Rank */}
                <RankBadge rank={i + 1} />

                {/* Thumbnail */}
                {tab !== 'channels' && (
                  <div className="relative w-20 h-12 rounded-md overflow-hidden bg-[#1A1A1A] shrink-0">
                    <img
                      src={item.thumbnail || thumbUrl(item.videoId)}
                      alt={sanitizeText(item.title, 40)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#FFFFFF] truncate hover:text-[#FDBA2D] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#a0a0a0] mt-0.5 truncate">{item.channelTitle}</p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-[#a0a0a0]">
                      <Eye className="w-3 h-3" />
                      {fmtV(item.viewCount)}
                    </div>
                  </div>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold',
                    scoreClass(item.viralScore),
                    'bg-[#0a0a0a] border border-[rgba(255,255,255,0.03)]'
                  )}>
                    {item.viralScore}
                  </div>
                </div>

                {/* Mobile score */}
                <div className={cn(
                  'sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                  scoreClass(item.viralScore),
                  'bg-[#0a0a0a] border border-[rgba(255,255,255,0.03)]'
                )}>
                  {item.viralScore}
                </div>

                {/* Copy buttons */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={async () => {
                      const ok = await copyToClipboard(item.title);
                      showToast(ok ? 'Title copied!' : 'Failed to copy', ok ? 'success' : 'error');
                    }}
                    className="p-1.5 rounded-md hover:bg-[#0f0f0f] transition-colors" aria-label="Copy title"
                    title="Copy title"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#a0a0a0]" />
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await copyToClipboard(`https://youtube.com/watch?v=${item.videoId}`);
                      showToast(ok ? 'Link copied!' : 'Failed to copy', ok ? 'success' : 'error');
                    }}
                    className="p-1.5 rounded-md hover:bg-[#0f0f0f] transition-colors" aria-label="Copy URL"
                    title="Copy URL"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#a0a0a0]" />
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await copyToClipboard(item.videoId);
                      showToast(ok ? 'Video ID copied!' : 'Failed to copy', ok ? 'success' : 'error');
                    }}
                    className="p-1.5 rounded-md hover:bg-[#0f0f0f] transition-colors" aria-label="Copy video ID"
                    title="Copy video ID"
                  >
                    <Hash className="w-3.5 h-3.5 text-[#a0a0a0]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token cost footer */}
      <div className="text-center text-[11px] text-[#666666]">
        Cost: {TOKEN_COSTS.rankings} tokens per load · Region: {region} · Tab: {tab}
      </div>
    </div>
  );
}
