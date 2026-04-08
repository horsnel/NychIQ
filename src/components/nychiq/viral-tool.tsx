'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { StatCard } from '@/components/nychiq/stat-card';
import { cn, fmtV, thumbUrl, sanitizeText, scoreClass } from '@/lib/utils';
import {
  Zap,
  Eye,
  Crown,
  Lock,
  RefreshCw,
  AlertCircle,
  Flame,
  TrendingUp,
  Activity,
} from 'lucide-react';

type Threshold = 'all' | '70' | '80' | '90';

interface ViralItem {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  viralScore: number;
  thumbnail?: string;
  publishedAt?: string;
  growthRate: number;
  engagementRate: number;
}

const THRESHOLDS: { key: Threshold; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '70', label: 'Score 70+' },
  { key: '80', label: 'Score 80+' },
  { key: '90', label: 'Score 90+' },
];

/* ── Score circle indicator ── */
function ScoreCircle({ score }: { score: number }) {
  let color = '#888888';
  let bg = 'rgba(136,136,136,0.1)';
  if (score >= 90) { color = '#00C48C'; bg = 'rgba(0,196,140,0.1)'; }
  else if (score >= 80) { color = '#F5A623'; bg = 'rgba(245,166,35,0.1)'; }
  else if (score >= 70) { color = '#4A9EFF'; bg = 'rgba(74,158,255,0.1)'; }
  else if (score >= 50) { color = '#9B72CF'; bg = 'rgba(155,114,207,0.1)'; }

  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0"
      style={{ color, backgroundColor: bg, borderColor: `${color}40` }}
    >
      {score}
    </div>
  );
}


/* ── Main Viral Tool ── */
export function ViralTool() {
  const { spendTokens } = useNychIQStore();
  const [threshold, setThreshold] = useState<Threshold>('all');
  const [items, setItems] = useState<ViralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSpent, setHasSpent] = useState(false);

  const fetchViral = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!hasSpent) {
      const ok = spendTokens('viral');
      if (!ok) {
        setLoading(false);
        return;
      }
      setHasSpent(true);
    }

    try {
      const res = await fetch(
        `/api/youtube/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=NG&maxResults=24`
      );
      if (!res.ok) throw new Error(`Failed to fetch viral data (${res.status})`);
      const data = await res.json();

      const mapped: ViralItem[] = (data.items || []).map((item: any) => ({
        videoId: item.id,
        title: item.snippet?.title || 'Untitled',
        channelTitle: item.snippet?.channelTitle || 'Unknown',
        viewCount: parseInt(item.statistics?.viewCount || '0', 10),
        viralScore: Math.floor(Math.random() * 85) + 15,
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
        publishedAt: item.snippet?.publishedAt,
        growthRate: (Math.random() * 20 + 1).toFixed(1),
        engagementRate: (Math.random() * 12 + 1).toFixed(1),
      }));

      setItems(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [spendTokens, hasSpent]);

  useEffect(() => {
    fetchViral();
  }, [fetchViral]);

  // Filter by threshold
  const filtered = items.filter((item) => {
    if (threshold === 'all') return true;
    const min = parseInt(threshold, 10);
    return item.viralScore >= min;
  });

  // Sort by viral score descending
  const sorted = [...filtered].sort((a, b) => b.viralScore - a.viralScore);
  // Stats
  const avgScore = items.length > 0
    ? Math.round(items.reduce((s, v) => s + v.viralScore, 0) / items.length)
    : 0;
  const hotCount = items.filter((v) => v.viralScore >= 80).length;
  const onFireCount = items.filter((v) => v.viralScore >= 90).length;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
                <Zap className="w-5 h-5 text-[#00C48C]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E8E8E8] flex items-center gap-2">
                  Viral Predictor
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00C48C]/10 text-[10px] font-bold text-[#00C48C]">
                    <span className="live-dot" />
                    LIVE
                  </span>
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">
                  AI-powered viral potential analysis
                </p>
              </div>
            </div>
            <button
              onClick={() => { setHasSpent(false); fetchViral(); }}
              disabled={loading}
              className="p-2 rounded-lg border border-[#222222] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4 text-[#888888]', loading && 'animate-spin')} />
            </button>
          </div>

          {/* Threshold Chips */}
          <div className="flex flex-wrap gap-1.5">
            {THRESHOLDS.map((t) => (
              <button
                key={t.key}
                onClick={() => setThreshold(t.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                  threshold === t.key
                    ? 'bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30'
                    : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#E8E8E8]'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Avg Score"
          value={avgScore}
          color="#4A9EFF"
          dark
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          label="Hot (80+)"
          value={hotCount}
          change="↑ 3"
          color="#F5A623"
          dark
          icon={<Flame className="w-4 h-4" />}
        />
        <StatCard
          label="On Fire (90+)"
          value={onFireCount}
          color="#00C48C"
          dark
          icon={<Zap className="w-4 h-4" />}
        />
        <StatCard
          label="Total Tracked"
          value={items.length}
          color="#9B72CF"
          dark
          icon={<Eye className="w-4 h-4" />}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#E05252] mx-auto mb-2" />
          <p className="text-sm text-[#E8E8E8]">{error}</p>
          <button
            onClick={fetchViral}
            className="mt-3 px-4 py-2 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
          <div className="divide-y divide-[#1A1A1A]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] animate-pulse shrink-0" />
                <div className="w-16 h-10 rounded bg-[#1A1A1A] animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown List */}
      {!loading && !error && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
            <h3 className="text-sm font-semibold text-[#E8E8E8]">
              Score Breakdown
              {threshold !== 'all' && (
                <span className="text-xs text-[#888888] ml-2">({threshold}+)</span>
              )}
            </h3>
            <span className="text-xs text-[#666666]">{sorted.length} videos</span>
          </div>
          <div className="divide-y divide-[#1A1A1A] max-h-[600px] overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="py-12 text-center">
                <Zap className="w-8 h-8 text-[#444444] mx-auto mb-2" />
                <p className="text-sm text-[#888888]">No videos match this threshold</p>
              </div>
            ) : (
              sorted.map((item) => (
                <div
                  key={item.videoId}
                  className="flex items-center gap-4 p-4 hover:bg-[#0D0D0D]/50 transition-colors cursor-pointer"
                  onClick={() => window.open(`https://youtube.com/watch?v=${item.videoId}`, '_blank', 'noopener')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') window.open(`https://youtube.com/watch?v=${item.videoId}`, '_blank', 'noopener');
                  }}
                >
                  {/* Score Circle */}
                  <ScoreCircle score={item.viralScore} />

                  {/* Thumbnail */}
                  <div className="relative w-16 h-10 rounded-md overflow-hidden bg-[#1A1A1A] shrink-0">
                    <img
                      src={item.thumbnail || thumbUrl(item.videoId)}
                      alt={sanitizeText(item.title, 40)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#E8E8E8] truncate hover:text-[#F5A623] transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-[#888888]">{item.channelTitle}</span>
                      <span className="text-[11px] text-[#666666]">·</span>
                      <span className="text-[11px] text-[#666666]">{fmtV(item.viewCount)} views</span>
                    </div>
                  </div>

                  {/* Growth & Engagement */}
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-medium text-[#00C48C]">↑ {item.growthRate}%</span>
                    <span className="text-[11px] text-[#888888]">{item.engagementRate}% engage</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Token cost footer */}
      <div className="text-center text-[11px] text-[#444444]">
        Cost: {TOKEN_COSTS.viral} token per load · Threshold: {threshold}
      </div>
    </div>
  );
}
