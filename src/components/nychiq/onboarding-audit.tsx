'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  ArrowRight,
  Play,
  Eye,
  Users,
  BarChart3,
  Zap,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ThumbsUp,
  MessageSquare,
  DollarSign,
  Heart,
  Globe,
  Check,
  Loader2,
} from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { ytFetch, askAI } from '@/lib/api';
import { fmtV, thumbUrl, vidDuration } from '@/lib/utils';

/* ────────────────────────────────────────────
   LOADING STEPS
   ──────────────────────────────────────────── */
const ANALYSIS_STEPS = [
  'Finding channel...',
  'Fetching videos...',
  'Analyzing performance...',
  'Generating insights...',
];

/* ────────────────────────────────────────────
   PARSE CHANNEL INPUT
   ──────────────────────────────────────────── */
function parseChannelInput(input: string): {
  type: 'handle' | 'id' | 'query';
  value: string;
} {
  const trimmed = input.trim();

  // youtube.com/@handle or youtube.com/channel/UCxxx
  const handleMatch = trimmed.match(/(?:youtube\.com\/|youtu\.be\/)(?:@([\w.-]+)|channel\/(UC[\w-]+))/);
  if (handleMatch) {
    if (handleMatch[2]) return { type: 'id', value: handleMatch[2] };
    return { type: 'handle', value: `@${handleMatch[1]}` };
  }

  // bare @handle
  if (trimmed.startsWith('@')) return { type: 'handle', value: trimmed };

  // bare channel ID starting with UC
  if (/^UC[\w-]+$/.test(trimmed)) return { type: 'id', value: trimmed };

  // treat as search query
  return { type: 'query', value: trimmed };
}

/* ────────────────────────────────────────────
   HEALTH SCORE CALCULATION (deterministic)
   ──────────────────────────────────────────── */
function calcHealthScore(
  subscribers: number,
  totalViews: number,
  videoCount: number,
  avgViews: number
): number {
  let score = 40; // base

  // Subscriber tiers
  if (subscribers >= 1000000) score += 20;
  else if (subscribers >= 100000) score += 15;
  else if (subscribers >= 10000) score += 10;
  else if (subscribers >= 1000) score += 5;

  // View-to-sub ratio
  if (subscribers > 0) {
    const ratio = avgViews / subscribers;
    if (ratio >= 0.5) score += 15;
    else if (ratio >= 0.2) score += 10;
    else if (ratio >= 0.05) score += 5;
  }

  // Content volume
  if (videoCount >= 500) score += 10;
  else if (videoCount >= 100) score += 7;
  else if (videoCount >= 50) score += 4;
  else if (videoCount >= 10) score += 2;

  // Total views
  if (totalViews >= 10000000) score += 10;
  else if (totalViews >= 1000000) score += 7;
  else if (totalViews >= 100000) score += 4;

  return Math.min(100, Math.max(5, score));
}

/* ────────────────────────────────────────────
   VIRAL SCORE (based on top video performance)
   ──────────────────────────────────────────── */
function calcViralScore(videos: Array<{ views: number; likes: number; comments: number }>): number {
  if (!videos.length) return 0;
  const topViews = videos[0]?.views || 0;
  const avgLikes = videos.reduce((s, v) => s + v.likes, 0) / videos.length;
  const avgComments = videos.reduce((s, v) => s + v.comments, 0) / videos.length;

  let score = 20;
  if (topViews >= 10000000) score += 30;
  else if (topViews >= 1000000) score += 25;
  else if (topViews >= 100000) score += 15;
  else if (topViews >= 10000) score += 10;

  if (avgLikes >= 50000) score += 15;
  else if (avgLikes >= 10000) score += 10;
  else if (avgLikes >= 1000) score += 5;

  if (avgComments >= 5000) score += 15;
  else if (avgComments >= 1000) score += 10;
  else if (avgComments >= 100) score += 5;

  return Math.min(100, Math.max(0, score));
}

/* ────────────────────────────────────────────
   REVENUE ESTIMATE (deterministic CPM model)
   ──────────────────────────────────────────── */
function calcRevenue(totalViews: number, videoCount: number): string {
  // Conservative: $1-4 CPM depending on niche/view volume
  const avgCPM = totalViews > 5000000 ? 3.5 : totalViews > 500000 ? 2.0 : 1.0;
  const monthlyViews = videoCount > 0 ? (totalViews / videoCount) * 4 : 0; // ~4 uploads/month
  const monthly = (monthlyViews / 1000) * avgCPM;
  if (monthly >= 1000) return `$${(monthly / 1000).toFixed(1)}K/mo`;
  if (monthly >= 100) return `$${Math.round(monthly)}/mo`;
  return `$${Math.round(monthly)}/mo`;
}

/* ────────────────────────────────────────────
   HEALTH GAUGE SVG
   ──────────────────────────────────────────── */
function HealthGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const radius = 54;
  const c = 2 * Math.PI * radius;
  const offset = c - (animated / 100) * c;
  const color =
    score >= 80 ? '#10B981' : score >= 60 ? '#FDBA2D' : score >= 40 ? '#3B82F6' : '#EF4444';

  useEffect(() => {
    let cur = 0;
    const timer = setInterval(() => {
      cur += 2;
      if (cur >= score) { cur = score; clearInterval(timer); }
      setAnimated(cur);
    }, 18);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="#1A1A1A" strokeWidth="7" fill="none" />
        <circle
          cx="70" cy="70" r={radius}
          stroke={color} strokeWidth="7" fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-100"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold" style={{ color }}>{animated}</span>
        <span className="text-[9px] text-[#555555] font-medium mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   SPINNER COMPONENT
   ──────────────────────────────────────────── */
function Spinner({ size = 16, color = '#FDBA2D' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="#1F1F1F" strokeWidth="3" fill="none" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export function OnboardingAudit() {
  const { setActiveTool, region } = useNychIQStore();

  // ── State ──
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [channelData, setChannelData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [insights, setInsights] = useState<
    Array<{ priority: 'high' | 'medium' | 'low'; title: string; description: string; icon: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Derived metrics ──
  const subscribers = channelData?.subscriberCount || 0;
  const totalViews = channelData?.viewCount || 0;
  const videoCount = channelData?.videoCount || 0;
  const avgViews = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
  const engagementRate =
    videos.length > 0 && totalViews > 0
      ? ((videos.reduce((s, v) => s + v.likes + v.comments, 0) / totalViews) * 100).toFixed(1)
      : null;
  const healthScore = calcHealthScore(subscribers, totalViews, videoCount, avgViews);
  const viralScore = calcViralScore(videos);
  const revenue = calcRevenue(totalViews, videoCount);

  const hasResults = channelData !== null;

  // ── PARSE & FETCH ──
  const handleAnalyze = useCallback(async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setLoadingStep(ANALYSIS_STEPS[0]);
    setProgress(0);
    setChannelData(null);
    setVideos([]);
    setInsights([]);
    setError(null);

    try {
      // Step 1: Resolve channel
      const parsed = parseChannelInput(query);
      let channelId = '';
      let channelResponse: any = null;

      if (parsed.type === 'id') {
        channelResponse = await ytFetch('channels', {
          part: 'snippet,statistics',
          id: parsed.value,
        });
      } else if (parsed.type === 'handle') {
        channelResponse = await ytFetch('channels', {
          part: 'snippet,statistics',
          forHandle: parsed.value,
        });
      } else {
        // Search by name
        const searchResult = await ytFetch('search', {
          q: parsed.value,
          type: 'channel',
          maxResults: 1,
        });
        const found = searchResult?.items?.[0];
        if (found?.snippet?.channelId) {
          channelId = found.snippet.channelId;
          channelResponse = await ytFetch('channels', {
            part: 'snippet,statistics',
            id: channelId,
          });
        }
      }

      // If forHandle didn't return directly, try the channel endpoint
      if (!channelResponse) {
        channelResponse = await ytFetch('channel', { handle: query.trim() });
      }

      const channel = channelResponse?.items
        ? channelResponse.items[0]
        : channelResponse;

      if (!channel?.snippet?.title) {
        throw new Error('Channel not found. Please check the URL or name and try again.');
      }

      channelId = channelId || channel.id || '';

      const normalizedChannel = {
        id: channelId,
        name: channel.snippet.title,
        handle: channel.snippet.customUrl || query.trim(),
        description: channel.snippet.description || '',
        avatar:
          channel.snippet.thumbnails?.high?.url ||
          channel.snippet.thumbnails?.medium?.url ||
          channel.snippet.thumbnails?.default?.url ||
          '',
        banner:
          channel.snippet.thumbnails?.banner?.url ||
          channel.brandingSettings?.image?.bannerExternalUrl ||
          '',
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
        videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
        viewCount: parseInt(channel.statistics?.viewCount || '0', 10),
        publishedAt: channel.snippet.publishedAt || '',
      };

      setChannelData(normalizedChannel);
      setProgress(35);
      setLoadingStep(ANALYSIS_STEPS[1]);

      // Step 2: Fetch top videos
      let videoList: any[] = [];
      try {
        const searchVideos = await ytFetch('search', {
          channelId: channelId,
          maxResults: 10,
          type: 'video',
          order: 'viewCount',
        });
        const videoItems = searchVideos?.items || [];
        const videoIds = videoItems.map((v: any) => v.id?.videoId).filter(Boolean);

        if (videoIds.length > 0) {
          setProgress(55);
          setLoadingStep(ANALYSIS_STEPS[2]);

          const videoStats = await ytFetch('videos', {
            id: videoIds.join(','),
            part: 'statistics,contentDetails',
          });
          const statsItems = videoStats?.items || [];

          videoList = videoItems.slice(0, 8).map((v: any, i: number) => {
            const stats = statsItems.find(
              (s: any) => s.id === v.id?.videoId
            );
            return {
              id: v.id?.videoId,
              title: v.snippet?.title || 'Untitled',
              thumbnail:
                v.snippet?.thumbnails?.high?.url ||
                v.snippet?.thumbnails?.medium?.url ||
                v.snippet?.thumbnails?.default?.url ||
                '',
              publishedAt: v.snippet?.publishedAt || '',
              views: parseInt(stats?.statistics?.viewCount || '0', 10),
              likes: parseInt(stats?.statistics?.likeCount || '0', 10),
              comments: parseInt(stats?.statistics?.commentCount || '0', 10),
              duration: stats?.contentDetails?.duration || '',
            };
          });

          // Sort by views descending
          videoList.sort((a, b) => b.views - a.views);
        }
      } catch {
        // Videos fetch failed — continue without them
      }

      setVideos(videoList);
      setProgress(70);
      setLoadingStep(ANALYSIS_STEPS[3]);

      // Step 3: AI insights
      try {
        const videoLines = videoList
          .slice(0, 5)
          .map(
            (v) =>
              `- "${v.title}" (${fmtV(v.views)} views, ${fmtV(v.likes)} likes)`
          )
          .join('\n');

        const prompt = `Analyze this YouTube channel:
Name: ${normalizedChannel.name}
Subscribers: ${fmtV(normalizedChannel.subscriberCount)}
Total Views: ${fmtV(normalizedChannel.viewCount)}
Videos: ${normalizedChannel.videoCount}
Channel Age: ${normalizedChannel.publishedAt ? new Date(normalizedChannel.publishedAt).getFullYear() : 'Unknown'}
Average Views: ${fmtV(avgViews)}
Description: ${(normalizedChannel.description || '').substring(0, 300)}
Top videos:
${videoLines || 'No video data available'}

Provide 5 actionable insights for channel growth. Format each insight exactly as:
**[Priority: HIGH/MEDIUM/LOW]** Title
Description text here (1-2 sentences, specific and actionable).

Use a mix of priority levels. Focus on content strategy, SEO, engagement, monetization, and growth tactics.`;

        const aiResponse = await askAI(prompt);
        const parsedInsights: Array<{
          priority: 'high' | 'medium' | 'low';
          title: string;
          description: string;
          icon: string;
        }> = [];

        const regex = /\*\*\[Priority:\s*(HIGH|MEDIUM|LOW)\]\*\*\s+(.+)/gi;
        let match;
        let lastIndex = 0;

        const iconMap: Record<string, string> = {
          high: 'AlertTriangle',
          medium: 'Zap',
          low: 'Check',
        };

        while ((match = regex.exec(aiResponse)) !== null) {
          const priority = match[1].toLowerCase() as 'high' | 'medium' | 'low';
          const title = match[2].trim();
          const descStart = match.index + match[0].length;
          const nextMatch = aiResponse.indexOf('**[Priority:', descStart);
          const description = (nextMatch > 0
            ? aiResponse.substring(descStart, nextMatch)
            : aiResponse.substring(descStart)
          )
            .trim()
            .split('\n')[0]
            .trim();

          if (title && description) {
            parsedInsights.push({
              priority,
              title,
              description,
              icon: iconMap[priority],
            });
          }
          lastIndex = descStart;
        }

        // If regex parsing failed, try splitting by double newlines
        if (parsedInsights.length === 0) {
          const lines = aiResponse.split('\n').filter((l) => l.trim());
          let currentInsight: any = null;
          for (const line of lines) {
            const pMatch = line.match(/\[Priority:\s*(HIGH|MEDIUM|LOW)\]/i);
            if (pMatch) {
              if (currentInsight?.title) parsedInsights.push(currentInsight);
              const p = pMatch[1].toLowerCase() as 'high' | 'medium' | 'low';
              currentInsight = {
                priority: p,
                title: line.replace(/\*\*\[Priority:.*?\]\*\*\s*/i, '').trim(),
                description: '',
                icon: iconMap[p],
              };
            } else if (currentInsight && !currentInsight.description) {
              currentInsight.description = line.trim();
            }
          }
          if (currentInsight?.title) parsedInsights.push(currentInsight);
        }

        setInsights(parsedInsights.slice(0, 6));
      } catch {
        // AI failed — generate fallback insights from real data
        const fallback = [
          {
            priority: 'high' as const,
            title: 'Increase Upload Frequency',
            description: `With ${videoCount} videos total, increasing output to 2-3 videos per week can significantly boost algorithmic reach and audience retention.`,
            icon: 'TrendingUp',
          },
          {
            priority: 'high' as const,
            title: 'Optimize Video Titles & Thumbnails',
            description: `Top video "${videos[0]?.title?.slice(0, 40) || 'your best content'}" got ${fmtV(videos[0]?.views || 0)} views. Replicate this success by analyzing what made it perform.`,
            icon: 'Eye',
          },
          {
            priority: 'medium' as const,
            title: 'Improve Audience Engagement',
            description: `With ${fmtV(subscribers)} subscribers and ${fmtV(avgViews)} avg views, focus on calls-to-action to increase viewer-to-subscriber conversion.`,
            icon: 'Users',
          },
          {
            priority: 'medium' as const,
            title: 'SEO & Discoverability',
            description: normalizedChannel.description
              ? `Your ${normalizedChannel.description.length > 200 ? 'good' : 'short'} description can be optimized with more target keywords for better search rankings.`
              : 'Add a detailed channel description with niche keywords to improve YouTube SEO.',
            icon: 'Search',
          },
          {
            priority: 'low' as const,
            title: 'Revenue Optimization',
            description: `Estimated revenue: ${revenue}. Explore mid-rolls, memberships, and merch integration to diversify income beyond AdSense.`,
            icon: 'DollarSign',
          },
        ];
        setInsights(fallback);
      }

      // Step 4: Save channel profile
      const profileToSave = {
        name: normalizedChannel.name,
        handle: normalizedChannel.handle,
        url: query.trim(),
        avatarUrl: normalizedChannel.avatar,
      };
      localStorage.setItem(
        'nychiq_channel_profile',
        JSON.stringify(profileToSave)
      );

      // Save to store via setPersonalChannel
      try {
        const store = useNychIQStore.getState();
        if (store?.setPersonalChannel) {
          store.setPersonalChannel({
            handle: normalizedChannel.handle,
            title: normalizedChannel.name,
            description: normalizedChannel.description,
            avatar: normalizedChannel.avatar,
            subscriberCount: normalizedChannel.subscriberCount,
            videoCount: normalizedChannel.videoCount,
            viewCount: normalizedChannel.viewCount,
            publishedAt: normalizedChannel.publishedAt,
            healthScore,
            auditDate: Date.now(),
            auditCategories: [
              { name: 'Content', score: Math.min(100, videoCount > 50 ? 75 : 50), icon: '📹' },
              { name: 'SEO', score: Math.min(100, normalizedChannel.description?.length > 200 ? 70 : 40), icon: '🔍' },
              { name: 'Engagement', score: Math.min(100, engagementRate ? Math.round(parseFloat(engagementRate) * 10 + 40) : 50), icon: '💬' },
              { name: 'Growth', score: healthScore, icon: '📈' },
              { name: 'Revenue', score: viralScore, icon: '💰' },
            ],
          });
        }
      } catch {
        // store save is best-effort
      }

      setProgress(100);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [query, loading, subscribers, totalViews, videoCount, avgViews, engagementRate, healthScore, viralScore, revenue]);

  // ── Progress animation during loading ──
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        // Slowly creep towards 95% (never reach 100 until actual data arrives)
        if (p >= 94) return 94;
        return p + 0.3;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Handle Enter key ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  return (
    <div style={{ background: '#0D0D0D' }} className="min-h-screen w-full flex flex-col">
      {/* ── Branding Top Bar ── */}
      <div
        className="flex items-center gap-2.5 px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center"
          style={{ background: '#FDBA2D' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M10 6L18 12L10 18V6Z" fill="#0D0D0D" />
            <rect x="5" y="5" width="2.5" height="14" rx="1" fill="#0D0D0D" />
          </svg>
        </div>
        <span
          className="text-sm font-black tracking-widest uppercase"
          style={{ color: '#FDBA2D' }}
        >
          NYCHIQ
        </span>
      </div>

      {/* ── Main Content Area ── */}
      <div
        className={`flex-1 flex flex-col ${!hasResults && !loading && !error ? 'items-center justify-center' : ''} px-4 sm:px-6 lg:px-8 py-8`}
      >
        {/* ═══════════════════════════════════════
            SEARCH STATE (centered, no results yet)
            ═══════════════════════════════════════ */}
        {!hasResults && !loading && !error && (
          <div className="text-center w-full max-w-xl animate-fade-in-up">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(253,186,45,0.1)',
                  border: '1px solid rgba(253,186,45,0.2)',
                }}
              >
                <BarChart3 size={24} style={{ color: '#FDBA2D' }} />
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: '#FFFFFF' }}
            >
              Free Channel Audit
            </h1>

            {/* Description */}
            <p
              className="text-sm mb-8 max-w-md mx-auto leading-relaxed"
              style={{ color: '#A3A3A3' }}
            >
              Enter a YouTube channel URL or name to get a comprehensive audit
            </p>

            {/* Search Input — Pill Shaped */}
            <div
              className="relative mx-auto mb-6"
              style={{ maxWidth: 600 }}
            >
              <div
                className="flex items-center rounded-full px-2 gap-1 h-14 border transition-colors duration-200"
                style={{
                  background: '#141414',
                  borderColor: '#1F1F1F',
                }}
                onFocus={() => {
                  if (inputRef.current?.parentElement)
                    inputRef.current.parentElement.style.borderColor = 'rgba(253,186,45,0.5)';
                }}
                onBlur={() => {
                  if (inputRef.current?.parentElement)
                    inputRef.current.parentElement.style.borderColor = '#1F1F1F';
                }}
              >
                <div className="flex items-center justify-center pl-3 pr-1" style={{ color: '#555555' }}>
                  <Search size={20} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter YouTube channel URL or name..."
                  className="flex-1 bg-transparent outline-none text-base h-full"
                  style={{ color: '#FFFFFF' }}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!query.trim()}
                  className="flex items-center gap-2 px-5 h-11 rounded-full text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  style={{
                    background: '#FDBA2D',
                    color: '#0D0D0D',
                  }}
                >
                  Analyze
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {[
                { icon: Zap, label: 'Viral Score', color: '#10B981' },
                { icon: TrendingUp, label: 'Growth Tips', color: '#3B82F6' },
                { icon: Sparkles, label: 'AI Insights', color: '#8B5CF6' },
                { icon: DollarSign, label: 'Revenue Est.', color: '#FDBA2D' },
              ].map((f) => (
                <span
                  key={f.label}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: '#555555' }}
                >
                  <f.icon size={14} style={{ color: f.color }} />
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            LOADING STATE
            ═══════════════════════════════════════ */}
        {loading && (
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto animate-fade-in-up">
            {/* Logo with pulse */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
              style={{
                background: 'rgba(253,186,45,0.1)',
                border: '1px solid rgba(253,186,45,0.2)',
              }}
            >
              <BarChart3 size={32} style={{ color: '#FDBA2D' }} className="animate-pulse" />
            </div>

            {/* Channel name being analyzed */}
            <p className="text-lg font-bold mb-1" style={{ color: '#FFFFFF' }}>
              Analyzing{' '}
              <span style={{ color: '#FDBA2D' }}>
                {query.trim().split('/').pop()?.replace('@', '') || query.trim()}
              </span>
            </p>
            <p className="text-xs mb-8" style={{ color: '#555555' }}>
              This may take a few moments...
            </p>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full mb-8" style={{ background: '#1F1F1F' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #FDBA2D, #FDE68A)',
                  boxShadow: '0 0 12px rgba(253,186,45,0.4)',
                }}
              />
            </div>

            {/* Steps */}
            <div className="w-full space-y-3">
              {ANALYSIS_STEPS.map((step, i) => {
                const stepIndex = ANALYSIS_STEPS.indexOf(loadingStep);
                const isActive = i === stepIndex;
                const isDone = i < stepIndex;
                return (
                  <div
                    key={step}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-300"
                    style={{
                      background: isActive
                        ? 'rgba(253,186,45,0.06)'
                        : isDone
                        ? 'rgba(16,185,129,0.04)'
                        : '#0D0D0D',
                      borderColor: isActive
                        ? 'rgba(253,186,45,0.2)'
                        : isDone
                        ? 'rgba(16,185,129,0.15)'
                        : '#1F1F1F',
                    }}
                  >
                    {isDone ? (
                      <Check size={16} style={{ color: '#10B981' }} className="shrink-0" />
                    ) : isActive ? (
                      <Spinner size={16} color="#FDBA2D" />
                    ) : (
                      <div
                        className="w-4 h-4 rounded-full border shrink-0"
                        style={{ borderColor: '#333333' }}
                      />
                    )}
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: isActive
                          ? '#FDBA2D'
                          : isDone
                          ? '#10B981'
                          : '#555555',
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            ERROR STATE
            ═══════════════════════════════════════ */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center flex-1 max-w-md mx-auto text-center animate-fade-in-up">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertTriangle size={32} style={{ color: '#EF4444' }} />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: '#FFFFFF' }}
            >
              Analysis Failed
            </h2>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: '#A3A3A3' }}>
              {error}
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  setError(null);
                  setProgress(0);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                style={{
                  background: '#FDBA2D',
                  color: '#0D0D0D',
                }}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={() => setActiveTool('dashboard')}
                className="text-xs transition-colors"
                style={{ color: '#555555' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#A3A3A3')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555555')}
              >
                Back to Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            RESULTS STATE
            ═══════════════════════════════════════ */}
        {hasResults && !loading && (
          <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
            {/* ── Re-analyze bar ── */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setChannelData(null);
                  setVideos([]);
                  setInsights([]);
                  setError(null);
                  setProgress(0);
                }}
                className="flex items-center gap-2 text-xs font-medium transition-colors"
                style={{ color: '#A3A3A3' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FDBA2D')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#A3A3A3')}
              >
                <RefreshCw size={14} />
                Analyze another channel
              </button>
              <span className="text-xs font-mono" style={{ color: '#555555' }}>
                {new Date().toLocaleDateString()}
              </span>
            </div>

            {/* ══════════════════════════════════════
                1. CHANNEL HEADER
                ══════════════════════════════════════ */}
            <div
              className="overflow-hidden"
              style={{
                background: '#141414',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Banner */}
              <div
                className="h-28 sm:h-32 relative"
                style={{
                  background:
                    'linear-gradient(135deg, #0D0D0D 0%, #141414 50%, rgba(253,186,45,0.08) 100%)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    opacity: 0.15,
                    backgroundImage:
                      'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(253,186,45,0.06) 50px, rgba(253,186,45,0.06) 51px)',
                  }}
                />
                {/* Audit badge */}
                <div
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: '#10B981' }}
                  />
                  <span
                    className="font-bold uppercase tracking-wider"
                    style={{ fontSize: 10, color: '#10B981' }}
                  >
                    Audit Complete
                  </span>
                </div>
              </div>

              {/* Profile row */}
              <div className="px-5 sm:px-6 pb-5 -mt-10 relative z-10">
                <div className="flex items-end gap-4">
                  {channelData.avatar ? (
                    <img
                      src={channelData.avatar}
                      alt={channelData.name}
                      className="w-20 h-20 rounded-2xl object-cover border-4 shadow-lg"
                      style={{ borderColor: '#141414' }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-4 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #FDBA2D, #C69320)',
                        borderColor: '#141414',
                        color: '#0D0D0D',
                      }}
                    >
                      {channelData.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pb-1">
                    <h1
                      className="text-lg sm:text-xl font-bold truncate"
                      style={{ color: '#FFFFFF' }}
                    >
                      {channelData.name}
                    </h1>
                    <p className="text-xs truncate" style={{ color: '#A3A3A3' }}>
                      {channelData.handle}
                      {channelData.publishedAt &&
                        ` · Joined ${new Date(channelData.publishedAt).getFullYear()}`}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {channelData.subscriberCount >= 100000 && (
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        background: 'rgba(253,186,45,0.1)',
                        color: '#FDBA2D',
                        border: '1px solid rgba(253,186,45,0.2)',
                      }}
                    >
                      Established Creator
                    </span>
                  )}
                  {channelData.subscriberCount >= 10000 && channelData.subscriberCount < 100000 && (
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        background: 'rgba(59,130,246,0.1)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59,130,246,0.2)',
                      }}
                    >
                      Growing Channel
                    </span>
                  )}
                  {channelData.videoCount >= 100 && (
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        background: 'rgba(16,185,129,0.1)',
                        color: '#10B981',
                        border: '1px solid rgba(16,185,129,0.2)',
                      }}
                    >
                      Active Creator
                    </span>
                  )}
                  {channelData.videoCount > 0 && channelData.videoCount < 100 && (
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        background: 'rgba(139,92,246,0.1)',
                        color: '#8B5CF6',
                        border: '1px solid rgba(139,92,246,0.2)',
                      }}
                    >
                      Emerging
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      color: '#A3A3A3',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {fmtV(videoCount)} videos
                  </span>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════
                2. HEALTH GAUGE + STATS ROW
                ══════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {/* Health Score Gauge */}
              <div
                className="flex flex-col items-center justify-center p-5"
                style={{
                  background: '#141414',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: '#A3A3A3' }}
                >
                  Health Score
                </span>
                <HealthGauge score={healthScore} />
                <span
                  className="text-xs mt-2"
                  style={{
                    color:
                      healthScore >= 80
                        ? '#10B981'
                        : healthScore >= 60
                        ? '#FDBA2D'
                        : healthScore >= 40
                        ? '#3B82F6'
                        : '#EF4444',
                  }}
                >
                  {healthScore >= 80
                    ? 'Excellent'
                    : healthScore >= 60
                    ? 'Good'
                    : healthScore >= 40
                    ? 'Needs Work'
                    : 'Critical'}
                </span>
              </div>

              {/* 6 Stats Cards in 3x2 grid */}
              <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: 'TOTAL VIEWS',
                    value: fmtV(totalViews),
                    icon: Eye,
                    color: '#FDBA2D',
                  },
                  {
                    label: 'SUBSCRIBERS',
                    value: fmtV(subscribers),
                    icon: Users,
                    color: '#10B981',
                  },
                  {
                    label: 'ENGAGEMENT',
                    value: engagementRate ? `${engagementRate}%` : 'N/A',
                    icon: Heart,
                    color: '#3B82F6',
                  },
                  {
                    label: 'HEALTH SCORE',
                    value: `${healthScore}/100`,
                    icon: BarChart3,
                    color: healthScore >= 60 ? '#10B981' : '#EF4444',
                  },
                  {
                    label: 'VIRAL SCORE',
                    value: `${viralScore}/100`,
                    icon: Zap,
                    color: viralScore >= 60 ? '#10B981' : '#FDBA2D',
                  },
                  {
                    label: 'EST. REVENUE',
                    value: revenue,
                    icon: DollarSign,
                    color: '#8B5CF6',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col justify-center p-4"
                    style={{
                      background: '#1F1F1F',
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.05)',
                      height: 120,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{
                          background: `${stat.color}15`,
                          color: stat.color,
                        }}
                      >
                        <stat.icon size={14} />
                      </div>
                      <span
                        className="font-bold uppercase tracking-wider"
                        style={{ fontSize: 9, color: '#555555' }}
                      >
                        {stat.label}
                      </span>
                    </div>
                    <span
                      className="text-xl font-bold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════
                3. AI-POWERED INSIGHTS
                ══════════════════════════════════════ */}
            <div
              className="p-5 sm:p-6"
              style={{
                background: '#141414',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="p-1.5 rounded-lg"
                  style={{
                    background: 'rgba(139,92,246,0.1)',
                    color: '#8B5CF6',
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <h2
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: '#FFFFFF' }}
                >
                  AI-Powered Insights
                </h2>
                <span
                  className="ml-auto px-2 py-0.5 rounded text-xs font-bold"
                  style={{
                    background: 'rgba(139,92,246,0.1)',
                    color: '#8B5CF6',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  {insights.length} insights
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, i) => {
                  const pColor =
                    insight.priority === 'high'
                      ? '#EF4444'
                      : insight.priority === 'medium'
                      ? '#FDBA2D'
                      : '#10B981';
                  const pBg =
                    insight.priority === 'high'
                      ? 'rgba(239,68,68,0.1)'
                      : insight.priority === 'medium'
                      ? 'rgba(253,186,45,0.1)'
                      : 'rgba(16,185,129,0.1)';

                  const IconComponent =
                    insight.icon === 'AlertTriangle'
                      ? AlertTriangle
                      : insight.icon === 'Zap'
                      ? Zap
                      : insight.icon === 'TrendingUp'
                      ? TrendingUp
                      : insight.icon === 'Eye'
                      ? Eye
                      : insight.icon === 'Users'
                      ? Users
                      : insight.icon === 'Search'
                      ? Search
                      : insight.icon === 'DollarSign'
                      ? DollarSign
                      : Check;

                  return (
                    <div
                      key={i}
                      className="p-4 flex gap-3"
                      style={{
                        background: '#0D0D0D',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div
                        className="p-2 rounded-lg shrink-0 mt-0.5"
                        style={{
                          background: pBg,
                          color: pColor,
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-sm font-bold truncate"
                            style={{ color: '#FFFFFF' }}
                          >
                            {insight.title}
                          </span>
                          <span
                            className="ml-auto shrink-0 font-bold uppercase tracking-wider"
                            style={{ fontSize: 9, color: pColor }}
                          >
                            {insight.priority}
                          </span>
                        </div>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: '#A3A3A3' }}
                        >
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════════
                4. TOP VIDEOS
                ══════════════════════════════════════ */}
            {videos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{
                        background: 'rgba(253,186,45,0.1)',
                        color: '#FDBA2D',
                      }}
                    >
                      <TrendingUp size={16} />
                    </div>
                    <h2
                      className="text-sm font-bold uppercase tracking-wider"
                      style={{ color: '#FFFFFF' }}
                    >
                      Top Videos
                    </h2>
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: '#555555' }}
                  >
                    By views · {videos.length} videos
                  </span>
                </div>

                <div
                  className="flex gap-4 overflow-x-auto pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {videos.map((video, i) => (
                    <div
                      key={video.id || i}
                      className="shrink-0 group cursor-pointer"
                      style={{ width: 260 }}
                    >
                      {/* Thumbnail */}
                      <div
                        className="relative overflow-hidden"
                        style={{
                          borderRadius: 12,
                          height: 146,
                          background: '#1F1F1F',
                        }}
                      >
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: '#1F1F1F' }}
                          >
                            <Play size={32} style={{ color: '#333333' }} />
                          </div>
                        )}
                        {/* Duration badge */}
                        {video.duration && (
                          <div
                            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold"
                            style={{
                              background: 'rgba(0,0,0,0.85)',
                              color: '#FFFFFF',
                              fontSize: 10,
                            }}
                          >
                            {vidDuration(video.duration)}
                          </div>
                        )}
                        {/* Rank badge */}
                        <div
                          className="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            background:
                              i === 0
                                ? 'rgba(253,186,45,0.9)'
                                : 'rgba(0,0,0,0.7)',
                            color: i === 0 ? '#0D0D0D' : '#FFFFFF',
                          }}
                        >
                          {i + 1}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="mt-2 px-0.5">
                        <p
                          className="text-xs font-semibold line-clamp-2 mb-1 leading-snug"
                          style={{ color: '#FFFFFF' }}
                        >
                          {video.title}
                        </p>
                        <div
                          className="flex items-center gap-3"
                          style={{ color: '#A3A3A3', fontSize: 11 }}
                        >
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {fmtV(video.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp size={12} />
                            {fmtV(video.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            {fmtV(video.comments)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════
                5. ACTION BUTTONS
                ══════════════════════════════════════ */}
            <div
              className="p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 justify-center"
              style={{
                background: '#141414',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <button
                onClick={() => setActiveTool('my-channel')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 w-full sm:w-auto justify-center"
                style={{
                  background: '#FDBA2D',
                  color: '#0D0D0D',
                  boxShadow: '0 4px 24px rgba(253,186,45,0.2)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#E5A520')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = '#FDBA2D')
                }
              >
                View Full Channel
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setActiveTool('channel-assistant')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 w-full sm:w-auto justify-center"
                style={{
                  background: 'rgba(139,92,246,0.1)',
                  color: '#8B5CF6',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(139,92,246,0.2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')
                }
              >
                Talk to Channel Assistant
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Bottom spacer */}
            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
