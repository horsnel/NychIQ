'use client';

import React, { useState, useMemo } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { showToast } from '@/lib/toast';
import { fmtV, viralScore as getViralScore } from '@/lib/utils';
import { StatCard } from '@/components/nychiq/stat-card';
import {
  ListVideo,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Eye,
  ThumbsUp,
  MessageSquare,
  ArrowDownUp,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Zap,
  Crown,
} from 'lucide-react';

/* ── Types ── */
interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  viralScore: number;
  engagementRate: number;
  seoScore: number;
  rec: 'Keep' | 'Improve' | 'Remove';
}

interface PlaylistInfo {
  title: string;
  channel: string;
  totalVideos: number;
  videos: PlaylistVideo[];
}

type SortKey = 'viralScore' | 'views' | 'engagementRate' | 'uploadDate';

const MOCK_PLAYLIST: PlaylistInfo = {
  title: 'Tech Tips for Beginners',
  channel: 'TechWithTim',
  totalVideos: 8,
  videos: [
    { id: 'v1', title: 'Why Most Developers Fail at System Design', thumbnail: '', views: 125000, likes: 8200, comments: 340, viralScore: 92, engagementRate: 6.8, seoScore: 85, rec: 'Keep' },
    { id: 'v2', title: 'React vs Vue in 2026 — Full Comparison', thumbnail: '', views: 89000, likes: 5100, comments: 210, viralScore: 78, engagementRate: 5.9, seoScore: 72, rec: 'Keep' },
    { id: 'v3', title: 'Learn CSS Grid in 15 Minutes', thumbnail: '', views: 45000, likes: 2100, comments: 85, viralScore: 65, engagementRate: 4.9, seoScore: 68, rec: 'Improve' },
    { id: 'v4', title: 'JavaScript Array Methods You Should Know', thumbnail: '', views: 32000, likes: 1800, comments: 72, viralScore: 71, engagementRate: 5.8, seoScore: 60, rec: 'Keep' },
    { id: 'v5', title: 'Node.js Project Setup Tutorial', thumbnail: '', views: 18000, likes: 680, comments: 32, viralScore: 42, engagementRate: 4.0, seoScore: 45, rec: 'Improve' },
    { id: 'v6', title: 'What is an API? Explained Simply', thumbnail: '', views: 15600, likes: 520, comments: 28, viralScore: 55, engagementRate: 3.5, seoScore: 58, rec: 'Remove' },
    { id: 'v7', title: 'Full Stack App Deployment Guide', thumbnail: '', views: 28000, likes: 1500, comments: 65, viralScore: 68, engagementRate: 5.5, seoScore: 70, rec: 'Keep' },
    { id: 'v8', title: 'VS Code Extensions for Productivity', thumbnail: '', views: 22000, likes: 980, comments: 41, viralScore: 62, engagementRate: 4.6, seoScore: 52, rec: 'Improve' },
  ],
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'viralScore', label: 'Viral Score' },
  { key: 'views', label: 'Views' },
  { key: 'engagementRate', label: 'Engagement' },
  { key: 'uploadDate', label: 'Upload Date' },
];

/* ── Helpers ── */
function getGrade(avgScore: number): { grade: string; color: string } {
  if (avgScore >= 85) return { grade: 'A', color: '#10B981' };
  if (avgScore >= 70) return { grade: 'B', color: '#3B82F6' };
  if (avgScore >= 55) return { grade: 'C', color: '#FDBA2D' };
  if (avgScore >= 40) return { grade: 'D', color: '#F97316' };
  return { grade: 'F', color: '#EF4444' };
}

function viralScoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#FDBA2D';
  if (score >= 40) return '#3B82F6';
  return '#EF4444';
}

function recConfig(rec: string) {
  switch (rec) {
    case 'Keep': return { color: '#10B981', icon: CheckCircle2, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
    case 'Improve': return { color: '#FDBA2D', icon: AlertTriangle, bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.2)' };
    case 'Remove': return { color: '#EF4444', icon: XCircle, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
    default: return { color: '#A3A3A3', icon: CheckCircle2, bg: 'rgba(163,163,163,0.1)', border: 'rgba(163,163,163,0.2)' };
  }
}

/* ── Score bar component ── */
function ScoreBar({ score, label }: { score: number; label?: string }) {
  const color = viralScoreColor(score);
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] text-[#555555] w-8 shrink-0">{label}</span>}
      <div className="flex-1 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-bold w-6 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

/* ── Main component ── */
export function VideoBatchTool() {
  const { spendTokens } = useNychIQStore();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('viralScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleAnalyze = async () => {
    if (!playlistUrl.trim()) {
      showToast('Enter a playlist URL', 'warning');
      return;
    }
    setLoading(true);
    const ok = spendTokens('video-batch');
    if (!ok) {
      setLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setPlaylist(MOCK_PLAYLIST);
    setAnalyzed(true);
    setLoading(false);
    showToast('Playlist analyzed successfully!', 'success');
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const sortedVideos = useMemo(() => {
    if (!playlist) return [];
    const videos = [...playlist.videos];
    videos.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
    return videos;
  }, [playlist, sortBy, sortDir]);

  const summaryStats = useMemo(() => {
    if (!playlist) return null;
    const videos = playlist.videos;
    const avgViral = Math.round(videos.reduce((s, v) => s + v.viralScore, 0) / videos.length);
    const avgEngagement = (videos.reduce((s, v) => s + v.engagementRate, 0) / videos.length).toFixed(1);
    const topVideo = [...videos].sort((a, b) => b.viralScore - a.viralScore)[0];
    const weakestVideo = [...videos].sort((a, b) => a.viralScore - b.viralScore)[0];
    const gradeInfo = getGrade(avgViral);

    const keepCount = videos.filter((v) => v.rec === 'Keep').length;
    const improveCount = videos.filter((v) => v.rec === 'Improve').length;
    const removeCount = videos.filter((v) => v.rec === 'Remove').length;

    return { avgViral, avgEngagement, topVideo, weakestVideo, gradeInfo, keepCount, improveCount, removeCount };
  }, [playlist]);

  const handleExportCSV = () => {
    if (!playlist) return;
    const headers = ['Title', 'Views', 'Likes', 'Comments', 'Viral Score', 'Engagement Rate', 'SEO Score', 'Recommendation'];
    const rows = playlist.videos.map((v) => [
      v.title,
      v.views,
      v.likes,
      v.comments,
      v.viralScore,
      v.engagementRate,
      v.seoScore,
      v.rec,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.title.replace(/[^a-zA-Z0-9]/g, '_')}_analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
  };

  const handleApplyBestPractices = () => {
    showToast('Best practices optimization plan generated!', 'success');
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
              <ListVideo className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Video Batch Analyzer</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">Analyze entire playlists with viral scoring, engagement metrics, and actionable recommendations.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
              placeholder="Paste YouTube playlist URL..."
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !playlistUrl.trim()}
              className="px-5 h-11 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Analyze Playlist
            </button>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#141414] border border-[#1F1F1F] rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-[#141414] border border-[#1F1F1F] rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Analyzed results */}
      {!loading && analyzed && playlist && summaryStats && (
        <>
          {/* Playlist info bar */}
          <div className="rounded-lg bg-[rgba(253,186,45,0.05)] border border-[rgba(253,186,45,0.15)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(253,186,45,0.1)] flex items-center justify-center">
                <ListVideo className="w-5 h-5 text-[#FDBA2D]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#FFFFFF]">{playlist.title}</p>
                <p className="text-xs text-[#A3A3A3]">{playlist.channel} · {playlist.totalVideos} videos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A3A3A3]">Overall Grade:</span>
              <span
                className="text-2xl font-black w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${summaryStats.gradeInfo.color}15`, color: summaryStats.gradeInfo.color }}
              >
                {summaryStats.gradeInfo.grade}
              </span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Videos Analyzed"
              value={playlist.totalVideos}
              color="#FDBA2D"
              icon={<ListVideo className="w-4 h-4" />}
            />
            <StatCard
              label="Avg Viral Score"
              value={`${summaryStats.avgViral}/100`}
              color="#10B981"
              icon={<Zap className="w-4 h-4" />}
              change={summaryStats.avgViral >= 70 ? 'Above Average' : 'Below Average'}
              changeType={summaryStats.avgViral >= 70 ? 'up' : 'down'}
            />
            <StatCard
              label="Avg Engagement"
              value={`${summaryStats.avgEngagement}%`}
              color="#8B5CF6"
              icon={<ThumbsUp className="w-4 h-4" />}
            />
            <StatCard
              label="Keep Rate"
              value={`${Math.round((summaryStats.keepCount / playlist.totalVideos) * 100)}%`}
              color="#3B82F6"
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
          </div>

          {/* Top / Weakest highlight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Top performing */}
            <div className="rounded-lg bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.15)] p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                <h4 className="text-xs font-bold text-[#10B981] uppercase tracking-wider">Top Performing</h4>
              </div>
              <p className="text-sm font-semibold text-[#FFFFFF] mb-1 truncate">{summaryStats.topVideo.title}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#A3A3A3]">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {fmtV(summaryStats.topVideo.views)}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {fmtV(summaryStats.topVideo.likes)}</span>
                <span
                  className="font-bold"
                  style={{ color: viralScoreColor(summaryStats.topVideo.viralScore) }}
                >
                  {summaryStats.topVideo.viralScore} VS
                </span>
              </div>
            </div>
            {/* Weakest */}
            <div className="rounded-lg bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />
                <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">Needs Attention</h4>
              </div>
              <p className="text-sm font-semibold text-[#FFFFFF] mb-1 truncate">{summaryStats.weakestVideo.title}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#A3A3A3]">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {fmtV(summaryStats.weakestVideo.views)}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {fmtV(summaryStats.weakestVideo.likes)}</span>
                <span
                  className="font-bold"
                  style={{ color: viralScoreColor(summaryStats.weakestVideo.viralScore) }}
                >
                  {summaryStats.weakestVideo.viralScore} VS
                </span>
              </div>
            </div>
          </div>

          {/* Sort bar + Bulk actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-[#555555] uppercase tracking-wider shrink-0">Sort:</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => toggleSort(opt.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border ${
                    sortBy === opt.key
                      ? 'border-[rgba(253,186,45,0.3)] bg-[rgba(253,186,45,0.1)] text-[#FDBA2D]'
                      : 'border-[#1A1A1A] bg-[#0D0D0D] text-[#555555] hover:border-[#2A2A2A] hover:text-[#A3A3A3]'
                  }`}
                >
                  <ArrowDownUp className="w-3 h-3" />
                  {opt.label}
                  {sortBy === opt.key && (
                    <span className="text-[9px]">{sortDir === 'desc' ? '↓' : '↑'}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-xs font-semibold text-[#A3A3A3] hover:border-[#2A2A2A] hover:text-[#FFFFFF] transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={handleApplyBestPractices}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] text-xs font-semibold text-[#FDBA2D] hover:bg-[rgba(253,186,45,0.2)] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply Best Practices
              </button>
            </div>
          </div>

          {/* Video list */}
          <div className="space-y-2">
            {sortedVideos.map((video, index) => {
              const vInfo = getViralScore(video.viralScore);
              const rec = recConfig(video.rec);
              const RecIcon = rec.icon;
              return (
                <div
                  key={video.id}
                  className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Left: rank + thumbnail placeholder */}
                    <div className="flex items-start gap-3 shrink-0">
                      <span className="text-xs font-bold text-[#555555] w-5 text-center pt-1">#{index + 1}</span>
                      <div className="w-28 h-16 sm:w-32 sm:h-[72px] rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] flex items-center justify-center shrink-0 overflow-hidden">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Play className="w-5 h-5 text-[#555555] mx-auto mb-0.5" />
                            <span className="text-[8px] text-[#555555]">No thumb</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: info + scores */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-[#FFFFFF] leading-snug line-clamp-2">{video.title}</h4>
                        <span
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: rec.bg, color: rec.color, border: `1px solid ${rec.border}` }}
                        >
                          <RecIcon className="w-3 h-3" />
                          {video.rec}
                        </span>
                      </div>

                      {/* Metrics row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-[#A3A3A3]">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {fmtV(video.views)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {fmtV(video.likes)}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {fmtV(video.comments)}</span>
                      </div>

                      {/* Score bars */}
                      <div className="space-y-1.5">
                        <ScoreBar score={video.viralScore} label="VS" />
                        <ScoreBar score={video.engagementRate * 10} label="ER" />
                        <ScoreBar score={video.seoScore} label="SEO" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendation summary */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Playlist Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.15)] p-3 text-center">
                <p className="text-2xl font-black text-[#10B981]">{summaryStats.keepCount}</p>
                <p className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mt-0.5">Keep</p>
              </div>
              <div className="rounded-lg bg-[rgba(253,186,45,0.05)] border border-[rgba(253,186,45,0.15)] p-3 text-center">
                <p className="text-2xl font-black text-[#FDBA2D]">{summaryStats.improveCount}</p>
                <p className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mt-0.5">Improve</p>
              </div>
              <div className="rounded-lg bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] p-3 text-center">
                <p className="text-2xl font-black text-[#EF4444]">{summaryStats.removeCount}</p>
                <p className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mt-0.5">Remove</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !analyzed && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mb-4">
            <ListVideo className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Analyze Entire Playlists</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center mb-4">
            Paste a YouTube playlist URL to get viral scores, engagement metrics, and recommendations for every video.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#555555]">
            <Crown className="w-3 h-3 text-[#FDBA2D]" />
            <span>Requires Pro plan or above · {TOKEN_COSTS['video-batch']} tokens per analysis</span>
          </div>
        </div>
      )}

      {/* Token cost footer */}
      {analyzed && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS['video-batch']} tokens per playlist analysis
        </div>
      )}
    </div>
  );
}

/* ── Inline Play icon (standalone) ── */
function Play({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
