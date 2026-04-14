'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { getApiBase } from '@/lib/api';
import { VideoCard, VideoCardSkeleton, type VideoData } from '@/components/nychiq/video-card';
import { StatCard } from '@/components/nychiq/stat-card';
import { cn, fmtV, copyToClipboard } from '@/lib/utils';
import { showToast } from '@/lib/toast';
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
  Copy,
  Check,
  Sparkles,
  Loader2,
  Flame,
  FileText,
  List,
  Image as ImageIcon,
  Calendar,
  Search,
  Target,
  Hash,
  Megaphone,
  ChevronRight,
  Star,
  Rocket,
  BrainCircuit,
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
type TrendingTab = 'live' | 'pipeline';

/* ── Trend Pipeline Types ── */
interface TrendTopic {
  id: string;
  name: string;
  emoji: string;
  category: string;
  momentum: number;
  color: string;
}

interface PipelineStep1 {
  title: string;
  hook: string;
}

interface PipelineStep2 {
  sections: { heading: string; bullets: string[] }[];
}

interface PipelineStep3 {
  thumbnailConcept: string;
  description: string;
  tags: string[];
  hashtags: string[];
}

interface PipelineStep4 {
  bestTime: string;
  seoKeywords: string[];
  promoStrategy: string[];
}

interface PipelineData {
  score: number;
  step1: PipelineStep1 | null;
  step2: PipelineStep2 | null;
  step3: PipelineStep3 | null;
  step4: PipelineStep4 | null;
}

/* ── Mock Trend Data ── */
const MOCK_TRENDS: TrendTopic[] = [
  { id: 'ai-revolution', name: 'AI Revolution 2026', emoji: '🤖', category: 'Technology', momentum: 94, color: '#888888' },
  { id: 'react-20', name: 'React 20 Features', emoji: '⚛️', category: 'Programming', momentum: 87, color: '#888888' },
  { id: 'space-tourism', name: 'Space Tourism 2026', emoji: '🚀', category: 'Science', momentum: 82, color: '#888888' },
  { id: 'crypto-comeback', name: 'Crypto Comeback', emoji: '₿', category: 'Finance', momentum: 79, color: '#F6A828' },
  { id: 'indie-games', name: 'Indie Game Renaissance', emoji: '🎮', category: 'Gaming', momentum: 76, color: '#888888' },
  { id: 'remote-work-2', name: 'Remote Work 2.0', emoji: '🏠', category: 'Business', momentum: 73, color: '#888888' },
  { id: 'climate-tech', name: 'Climate Tech Boom', emoji: '🌱', category: 'Environment', momentum: 70, color: '#22C55E' },
  { id: 'creator-economy', name: 'Creator Economy Shift', emoji: '🎨', category: 'Culture', momentum: 68, color: '#888888' },
];

function getMockPipeline(trend: TrendTopic): PipelineData {
  const score = Math.floor(Math.random() * 20) + 75;
  return {
    score,
    step1: {
      title: `${trend.emoji} The Truth About ${trend.name} That Nobody Is Talking About`,
      hook: `What if I told you ${trend.name} is about to change everything you know about ${trend.category.toLowerCase()}? In the next 60 seconds, I'll show you the 3 shifts that are happening right now and why 90% of people are completely missing them.`,
    },
    step2: {
      sections: [
        {
          heading: 'Introduction & Pattern Interrupt',
          bullets: [
            'Open with a bold counter-claim that challenges common assumptions',
            'Show a rapid montage of before/after evidence within first 5 seconds',
            'Use data visualization to establish credibility immediately',
          ],
        },
        {
          heading: 'Core Revelation (The "Aha" Moment)',
          bullets: [
            `Reveal the hidden force driving ${trend.name} adoption`,
            'Share 2-3 concrete examples with real numbers',
            'Include expert quote or insider perspective for authority',
          ],
        },
        {
          heading: 'Practical Application',
          bullets: [
            'Show viewers exactly how to capitalize on this trend today',
            'Provide a 3-step actionable framework they can implement',
            'Address common objections and counterarguments',
          ],
        },
        {
          heading: 'Future Projection & CTA',
          bullets: [
            'Paint a vivid picture of where this trend is heading in 6 months',
            'Create urgency by showing what happens if they wait',
            'Strong CTA: subscribe + comment with their take',
          ],
        },
      ],
    },
    step3: {
      thumbnailConcept: `Split-screen: Left side shows the "old way" (greyed out, dull), right side shows the "new way" (vibrant ${trend.color}). Big bold text: "${trend.name.split(' ')[0]} IS BACK". Creator face with shocked expression. Subtle ${trend.emoji} emoji watermark in corner.`,
      description: `${trend.emoji} ${trend.name} — The Shift Nobody Saw Coming (2026 Update)\n\nIn this video, I break down the biggest changes happening in ${trend.category.toLowerCase()} right now and exactly how you can position yourself ahead of the curve.\n\n🔑 Key Timestamps:\n0:00 — The Pattern Interrupt\n0:45 — What's Really Happening\n2:30 — How to Take Action Now\n4:15 — Future Predictions\n5:00 — Final Takeaways\n\n#${trend.name.replace(/\s+/g, '')} #Trending #${trend.category} #2026`,
      tags: [trend.name.toLowerCase(), trend.category.toLowerCase(), 'trending', '2026', 'what to know', 'explained', 'guide', 'update', 'breakdown'],
      hashtags: [trend.name.replace(/\s+/g, ''), 'TrendingNow', trend.category, 'ViralContent', 'Explained', 'MustWatch', '2026Trends'],
    },
    step4: {
      bestTime: "Tuesday or Thursday at 2:00 PM — 4:00 PM EST. This timing aligns with peak algorithm activity for 'discover' content and captures both lunch break and after-work scrolling sessions.",
      seoKeywords: [trend.name.toLowerCase(), `${trend.category.toLowerCase()} trends 2026`, `why ${trend.name.toLowerCase()} matters`, `${trend.name.toLowerCase()} explained`, `future of ${trend.category.toLowerCase()}`, `${trend.name.toLowerCase()} guide`],
      promoStrategy: [
        'Post a Community Poll teaser 24 hours before: "What do you think about [trend]?"',
        'Create 3 Shorts from the video — hook, core insight, and CTA as separate clips',
        'Pin a comment asking viewers to share their experience with the topic',
        'Cross-post to Twitter/X and LinkedIn with a provocative poll question',
        'Follow up with a behind-the-scenes "making of" story on Instagram',
      ],
    },
  };
}

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
    <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
              <TrendingUp className="w-5 h-5 text-[#888888]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                Live Trending
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#888888]/10 text-[10px] font-bold text-[#888888]">
                  <span className="live-dot" />
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Top trending videos right now
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg border border-[rgba(255,255,255,0.03)] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4 text-[#a0a0a0]', loading && 'animate-spin')} />
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
                    ? 'bg-[#888888]/15 text-[#888888] border border-[#888888]/30'
                    : 'bg-[#0a0a0a] text-[#a0a0a0] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.03)] hover:text-[#FFFFFF]'
                )}
              >
                {r.code}
              </button>
            ))}
          </div>
        </div>

        {/* Sort chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
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
                  ? 'bg-[#F6A828]/15 text-[#F6A828] border border-[#F6A828]/30'
                  : 'bg-[#0a0a0a] text-[#a0a0a0] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.03)] hover:text-[#FFFFFF]'
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


/* ── Tab config ── */
const TABS: { id: TrendingTab; label: string; icon: React.ReactNode }[] = [
  { id: 'live', label: 'Live Trending', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'pipeline', label: 'Trend Pipeline', icon: <Rocket className="w-3.5 h-3.5" /> },
];

/* ── Main Trending Tool ── */
export function TrendingTool() {
  const [activeTab, setActiveTab] = useState<TrendingTab>('live');

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card with Tabs */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
              <TrendingUp className="w-5 h-5 text-[#888888]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Trending</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Live trending videos &amp; AI-powered trend content pipelines</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 -mb-1 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[rgba(255,255,255,0.03)] text-[#888888] border border-[rgba(255,255,255,0.03)] shadow-[rgba(0,0,0,0.3)]'
                    : 'text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'live' && <LiveTab />}
      {activeTab === 'pipeline' && <PipelineTab />}
    </div>
  );
}

/* ════════════════════════════════════════════════
   LIVE TRENDING TAB (original content)
   ════════════════════════════════════════════════ */
function LiveTab() {
  const { spendTokens, region: storeRegion, setRegion } = useNychIQStore();
  const [selectedRegion, setSelectedRegion] = useState(storeRegion || 'NG');
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
        `${getApiBase()}/youtube/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${selectedRegion}&maxResults=20`
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
  }, [selectedRegion, spendTokens, hasSpent, storeRegion]);

  // Sync with store region when it changes (e.g., from geolocation detection)
  useEffect(() => {
    if (storeRegion && storeRegion !== selectedRegion) {
      setSelectedRegion(storeRegion);
    }
  }, [storeRegion]);

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
    <>
      {/* Region / Sort Controls */}
      <TrendingHeader
        selectedRegion={selectedRegion}
        onRegionChange={(r) => { setSelectedRegion(r); setRegion(r); }}
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
          color="#888888"
          dark
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Total Views"
          value={fmtV(totalViews)}
          color="#888888"
          dark
          icon={<Eye className="w-4 h-4" />}
        />
        <StatCard
          label="Top Viral Score"
          value={topViral || '—'
          }
          color="#F6A828"
          dark
          icon={<Zap className="w-4 h-4" />}
        />
        <StatCard
          label="Avg Likes"
          value={fmtV(avgLikes)}
          color="#888888"
          dark
          icon={<ThumbsUp className="w-4 h-4" />}
        />
      </div>

      {/* Video Grid */}
      {error ? (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-8 text-center">
          <AlertCircle className="w-10 h-10 text-[#888888] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Failed to Load</h3>
          <p className="text-sm text-[#a0a0a0] mb-4">{error}</p>
          <button
            onClick={fetchTrending}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-[#F6A828] text-[#0a0a0a] text-sm font-bold hover:bg-[#FFB340] transition-colors"
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
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-8 text-center">
          <TrendingUp className="w-10 h-10 text-[#666666] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">No Trending Videos</h3>
          <p className="text-sm text-[#a0a0a0]">No trending data available for {selectedRegion} right now.</p>
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
      <div className="text-center text-[11px] text-[#666666]">
        Cost: {TOKEN_COSTS.trending} tokens per load · Region: {selectedRegion}
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════
   TREND PIPELINE TAB
   ════════════════════════════════════════════════ */
function PipelineTab() {
  const { spendTokens } = useNychIQStore();
  const [selectedTrend, setSelectedTrend] = useState<TrendTopic | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData>({
    score: 0,
    step1: null,
    step2: null,
    step3: null,
    step4: null,
  });
  const [generatingStep, setGeneratingStep] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const generateStep = useCallback(async (stepNum: number, trend: TrendTopic) => {
    setGeneratingStep(stepNum);
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

    setPipeline((prev) => {
      const mock = getMockPipeline(trend);
      const updated = { ...prev, score: mock.score };
      if (stepNum === 1) updated.step1 = mock.step1;
      if (stepNum === 2) updated.step2 = mock.step2;
      if (stepNum === 3) updated.step3 = mock.step3;
      if (stepNum === 4) updated.step4 = mock.step4;
      return updated;
    });

    setGeneratingStep(null);
  }, []);

  const handleGenerateAll = useCallback(async () => {
    if (!selectedTrend) return;

    const ok = spendTokens('trending');
    if (!ok) return;

    setGeneratingAll(true);
    setPipeline({ score: 0, step1: null, step2: null, step3: null, step4: null });

    for (let i = 1; i <= 4; i++) {
      setGeneratingStep(i);
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 500));
    }

    const mock = getMockPipeline(selectedTrend);
    setPipeline(mock);
    setGeneratingStep(null);
    setGeneratingAll(false);
  }, [selectedTrend, spendTokens]);

  const handleSelectTrend = useCallback((trend: TrendTopic) => {
    setSelectedTrend(trend);
    setPipeline({ score: 0, step1: null, step2: null, step3: null, step4: null });
  }, []);

  const handleCopySection = useCallback(async (stepNum: number, text: string) => {
    await copyToClipboard(text);
    setCopiedStep(stepNum);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedStep(null), 2000);
  }, []);

  const scoreColor = pipeline.score >= 85 ? '#888888' : pipeline.score >= 70 ? '#F6A828' : '#888888';
  const scoreBg = pipeline.score >= 85 ? 'rgba(34,197,94,0.1)' : pipeline.score >= 70 ? 'rgba(246,168,40,0.12)' : 'rgba(136,136,136,0.2)';
  const scoreLabel = pipeline.score >= 85 ? 'Excellent' : pipeline.score >= 70 ? 'Good' : 'Needs Work';

  return (
    <div className="space-y-4">
      {/* Pick a Trend Section */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4" style={{ color: '#F6A828' }} />
          <h3 className="text-sm font-bold text-[#FFFFFF]">Pick a Trend</h3>
          <span className="text-[10px] text-[#a0a0a0] ml-1">Select a trending topic to generate a full content pipeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MOCK_TRENDS.map((trend) => (
            <button
              key={trend.id}
              onClick={() => handleSelectTrend(trend)}
              className={cn(
                'p-4 rounded-lg border text-left transition-all duration-300 group relative overflow-hidden',
                selectedTrend?.id === trend.id
                  ? 'bg-[#0f0f0f] border-[#888888]/40 shadow-[rgba(0,0,0,0.3)]'
                  : 'bg-[#0a0a0a] border-[#1A1A1A] hover:border-[rgba(255,255,255,0.03)]'
              )}
              onMouseEnter={(e) => {
                if (selectedTrend?.id !== trend.id) {
                  e.currentTarget.style.boxShadow = `0 0 20px ${trend.color}15`;
                  e.currentTarget.style.borderColor = `${trend.color}30`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTrend?.id !== trend.id) {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#1A1A1A';
                }
              }}
            >
              {/* Glow background on selected */}
              {selectedTrend?.id === trend.id && (
                <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 50%, ${trend.color}, transparent 70%)` }} />
              )}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{trend.emoji}</span>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" style={{ color: trend.color }} />
                    <span className="text-[10px] font-bold" style={{ color: trend.color }}>{trend.momentum}</span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-[#FFFFFF] mb-1 group-hover:text-white transition-colors">{trend.name}</h4>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: trend.color, backgroundColor: `${trend.color}15` }}>
                  {trend.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      {selectedTrend && (
        <div className="space-y-4">
          {/* Pipeline Score + Full Pipeline Button */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${selectedTrend.color}15` }}>
                  <BrainCircuit className="w-5 h-5" style={{ color: selectedTrend.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">
                    {selectedTrend.emoji} {selectedTrend.name} Pipeline
                  </h3>
                  <p className="text-[10px] text-[#a0a0a0] mt-0.5">4-step AI-powered content generation</p>
                </div>
              </div>

              {/* Pipeline Score Badge */}
              {pipeline.score > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: scoreBg, border: `1px solid ${scoreColor}25` }}>
                  <Star className="w-4 h-4" style={{ color: scoreColor }} />
                  <div>
                    <span className="text-lg font-bold" style={{ color: scoreColor }}>{pipeline.score}</span>
                    <span className="text-[10px] text-[#a0a0a0] ml-1">/ 100</span>
                    <span className="text-[10px] font-bold ml-1" style={{ color: scoreColor }}>{scoreLabel}</span>
                  </div>
                </div>
              )}

              {/* Full Pipeline Button */}
              <button
                onClick={handleGenerateAll}
                disabled={generatingAll}
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: selectedTrend.color, color: '#FFFFFF' }}
              >
                {generatingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Full Pipeline
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 1: Title & Hook */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(246,168,40,0.15)', color: '#F6A828' }}>1</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#F6A828]" />
                    Title &amp; Hook
                  </h4>
                  <p className="text-[10px] text-[#a0a0a0]">Generated title + hook script</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pipeline.step1 && (
                  <button
                    onClick={() => handleCopySection(1, `Title: ${pipeline.step1!.title}\n\nHook: ${pipeline.step1!.hook}`)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-all"
                  >
                    {copiedStep === 1 ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
                    {copiedStep === 1 ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button
                  onClick={() => generateStep(1, selectedTrend)}
                  disabled={generatingStep === 1 || generatingAll}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50"
                  style={{ backgroundColor: 'rgba(246,168,40,0.15)', color: '#F6A828', border: '1px solid rgba(246,168,40,0.3)' }}
                >
                  {generatingStep === 1 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </button>
              </div>
            </div>

            {generatingStep === 1 && (
              <div className="space-y-2">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-4/5" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-3/5" />
              </div>
            )}

            {pipeline.step1 && generatingStep !== 1 && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <span className="text-[10px] font-bold text-[#F6A828] uppercase tracking-wider mb-1 block">Title</span>
                  <p className="text-sm text-[#FFFFFF] font-medium">{pipeline.step1.title}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider mb-1 block">Hook Script</span>
                  <p className="text-xs text-[#D4D4D4] leading-relaxed">{pipeline.step1.hook}</p>
                </div>
              </div>
            )}

            {!pipeline.step1 && generatingStep !== 1 && (
              <p className="text-xs text-[#666666] text-center py-4">Click "Generate" or use "Full Pipeline" to create content</p>
            )}
          </div>

          {/* Step 2: Script Outline */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1a1a1a', color: '#888888' }}>2</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <List className="w-3.5 h-3.5 text-[#888888]" />
                    Script Outline
                  </h4>
                  <p className="text-[10px] text-[#a0a0a0]">Sections with bullet points</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pipeline.step2 && (
                  <button
                    onClick={() => handleCopySection(2, pipeline.step2!.sections.map((s) => `${s.heading}\n${s.bullets.map((b) => `• ${b}`).join('\n')}`).join('\n\n'))}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-all"
                  >
                    {copiedStep === 2 ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
                    {copiedStep === 2 ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button
                  onClick={() => generateStep(2, selectedTrend)}
                  disabled={generatingStep === 2 || generatingAll}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50"
                  style={{ backgroundColor: '#1a1a1a', color: '#888888', border: '1px solid rgba(34,197,94,0.1)' }}
                >
                  {generatingStep === 2 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </button>
              </div>
            </div>

            {generatingStep === 2 && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/5" />
                    <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-full ml-4" />
                    <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-4/5 ml-4" />
                  </div>
                ))}
              </div>
            )}

            {pipeline.step2 && generatingStep !== 2 && (
              <div className="space-y-3 max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
                {pipeline.step2.sections.map((section, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: '#1a1a1a', color: '#888888' }}>
                        {i + 1}
                      </div>
                      <span className="text-xs font-bold text-[#FFFFFF]">{section.heading}</span>
                    </div>
                    <div className="ml-7 space-y-1">
                      {section.bullets.map((bullet, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs text-[#a0a0a0]">
                          <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#aaa' }} />
                          <span className="leading-relaxed">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!pipeline.step2 && generatingStep !== 2 && (
              <p className="text-xs text-[#666666] text-center py-4">Click "Generate" or use "Full Pipeline" to create content</p>
            )}
          </div>

          {/* Step 3: Metadata */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1a1a1a', color: '#888888' }}>3</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#888888]" />
                    Metadata
                  </h4>
                  <p className="text-[10px] text-[#a0a0a0]">Thumbnail concept, description, tags &amp; hashtags</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pipeline.step3 && (
                  <button
                    onClick={() => handleCopySection(3, `Thumbnail: ${pipeline.step3!.thumbnailConcept}\n\nDescription:\n${pipeline.step3!.description}\n\nTags: ${pipeline.step3!.tags.join(', ')}\n\nHashtags: ${pipeline.step3!.hashtags.join(' ')}`)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-all"
                  >
                    {copiedStep === 3 ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
                    {copiedStep === 3 ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button
                  onClick={() => generateStep(3, selectedTrend)}
                  disabled={generatingStep === 3 || generatingAll}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50"
                  style={{ backgroundColor: '#1a1a1a', color: '#888888', border: '1px solid rgba(255,255,255,0.03)' }}
                >
                  {generatingStep === 3 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </button>
              </div>
            </div>

            {generatingStep === 3 && (
              <div className="space-y-3">
                <div className="h-20 bg-[#1A1A1A] rounded animate-pulse w-full" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-5/6" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                </div>
              </div>
            )}

            {pipeline.step3 && generatingStep !== 3 && (
              <div className="space-y-3 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
                {/* Thumbnail Concept */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ImageIcon className="w-3 h-3 text-[#888888]" />
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Thumbnail Concept</span>
                  </div>
                  <p className="text-xs text-[#D4D4D4] leading-relaxed">{pipeline.step3.thumbnailConcept}</p>
                </div>

                {/* Description */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3 h-3 text-[#a0a0a0]" />
                    <span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider">Description</span>
                  </div>
                  <p className="text-xs text-[#D4D4D4] leading-relaxed whitespace-pre-line">{pipeline.step3.description}</p>
                </div>

                {/* Tags */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-3 h-3 text-[#888888]" />
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pipeline.step3.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium text-[#888888] bg-[rgba(255,255,255,0.03)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hashtags */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash className="w-3 h-3 text-[#888888]" />
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Hashtags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pipeline.step3.hashtags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium text-[#888888] bg-[rgba(255,255,255,0.03)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!pipeline.step3 && generatingStep !== 3 && (
              <p className="text-xs text-[#666666] text-center py-4">Click "Generate" or use "Full Pipeline" to create content</p>
            )}
          </div>

          {/* Step 4: Publishing Plan */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#1a1a1a', color: '#888888' }}>4</div>
                <div>
                  <h4 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                    Publishing Plan
                  </h4>
                  <p className="text-[10px] text-[#a0a0a0]">Best time, SEO keywords &amp; promo strategy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pipeline.step4 && (
                  <button
                    onClick={() => handleCopySection(4, `Best Time: ${pipeline.step4!.bestTime}\n\nSEO Keywords:\n${pipeline.step4!.seoKeywords.map((k) => `• ${k}`).join('\n')}\n\nPromo Strategy:\n${pipeline.step4!.promoStrategy.map((s) => `${s.split('.').length > 0 ? s : s}`).join('\n')}`)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-all"
                  >
                    {copiedStep === 4 ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
                    {copiedStep === 4 ? 'Copied' : 'Copy'}
                  </button>
                )}
                <button
                  onClick={() => generateStep(4, selectedTrend)}
                  disabled={generatingStep === 4 || generatingAll}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50"
                  style={{ backgroundColor: '#1a1a1a', color: '#888888', border: '1px solid rgba(255,255,255,0.03)' }}
                >
                  {generatingStep === 4 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </button>
              </div>
            </div>

            {generatingStep === 4 && (
              <div className="space-y-3">
                <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-4/5" />
                </div>
              </div>
            )}

            {pipeline.step4 && generatingStep !== 4 && (
              <div className="space-y-3">
                {/* Best Time */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3 h-3 text-[#F6A828]" />
                    <span className="text-[10px] font-bold text-[#F6A828] uppercase tracking-wider">Best Publishing Time</span>
                  </div>
                  <p className="text-xs text-[#D4D4D4] leading-relaxed">{pipeline.step4.bestTime}</p>
                </div>

                {/* SEO Keywords */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Search className="w-3 h-3 text-[#888888]" />
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">SEO Keywords</span>
                  </div>
                  <div className="space-y-1">
                    {pipeline.step4.seoKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#a0a0a0]">
                        <div className="w-1 h-1 rounded-full bg-[#888888] shrink-0" />
                        {kw}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Promo Strategy */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Megaphone className="w-3 h-3 text-[#888888]" />
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Promo Strategy</span>
                  </div>
                  <div className="space-y-2">
                    {pipeline.step4.promoStrategy.map((strategy, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#a0a0a0]">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: '#1a1a1a', color: '#888888' }}>
                          {i + 1}
                        </div>
                        <span className="leading-relaxed">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!pipeline.step4 && generatingStep !== 4 && (
              <p className="text-xs text-[#666666] text-center py-4">Click "Generate" or use "Full Pipeline" to create content</p>
            )}
          </div>

          {/* Token cost footer */}
          <div className="text-center text-[11px] text-[#666666]">
            Cost: {TOKEN_COSTS.trending} tokens per full pipeline generation
          </div>
        </div>
      )}

      {/* No trend selected */}
      {!selectedTrend && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4" style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.03)' }}>
            <Flame className="w-8 h-8" style={{ color: '#aaa' }} />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Trend Pipeline</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Select a trending topic above to generate a full 4-step content pipeline with title, script outline, metadata, and publishing plan.
          </p>
        </div>
      )}
    </div>
  );
}
