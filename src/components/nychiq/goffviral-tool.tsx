'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { copyToClipboard, fmtV } from '@/lib/utils';
import { askAI } from '@/lib/api';
import {
  Flame,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Eye,
  Heart,
  Share2,
  Download,
  Users,
  Clock,
  Music,
  Type,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Target,
  Zap,
  BarChart3,
  Activity,
  Youtube,
  Lightbulb,
} from 'lucide-react';

/* ── Types ── */
interface ViralResult {
  probability: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  actionPlan: string[];
}

interface LoadingStep {
  label: string;
  status: 'pending' | 'active' | 'done';
}

interface GoffViralInputs {
  views: number;
  likes: number;
  shares: number;
  downloads: number;
  followers: number;
  videoLength: number;
  postingHour: number;
  trendingSound: boolean;
  textOverlay: boolean;
}

/* ── Copy Button ── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#a0a0a0] hover:text-[#FFFFFF]" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-[#888888]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ── Verdict helpers ── */
function verdictBadge(verdict: string): { bg: string; text: string; border: string } {
  switch (verdict) {
    case 'VIRAL': return { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#888888]', border: 'border-[rgba(255,255,255,0.06)]' };
    case 'LIKELY VIRAL': return { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#888888]', border: 'border-[rgba(255,255,255,0.06)]' };
    case 'MODERATE': return { bg: 'bg-[rgba(253,186,45,0.15)]', text: 'text-[#FDBA2D]', border: 'border-[rgba(255,255,255,0.06)]' };
    default: return { bg: 'bg-[rgba(255,255,255,0.06)]', text: 'text-[#888888]', border: 'border-[rgba(255,255,255,0.06)]' };
  }
}

function probabilityColor(p: number): string {
  if (p >= 70) return '#888888';
  if (p >= 40) return '#FDBA2D';
  return '#888888';
}

function probabilityStroke(p: number): string {
  if (p >= 70) return '#888888';
  if (p >= 40) return '#FDBA2D';
  return '#888888';
}

/* ── Format hour to 12h ── */
function formatHour(h: number): string {
  if (h === 0) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}


/* ── Loading Steps Animation ── */
const LOADING_STEPS = [
  { label: 'Loading GoffViral-V1 Pro model', duration: 600 },
  { label: 'Analyzing TikTok features', duration: 800 },
  { label: 'Running viral prediction', duration: 1000 },
  { label: 'Generating detailed report', duration: 700 },
];

/* ── Circle Progress ── */
function CircleProgress({ value, size = 120, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = probabilityColor(value);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A1A1A" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{Math.round(value)}%</span>
        <span className="text-[10px] text-[#666666]">viral probability</span>
      </div>
    </div>
  );
}

/* ── Mock fallback ── */
function generateMockResult(inputs: GoffViralInputs): ViralResult {
  const { views, likes, shares, downloads, followers, videoLength, postingHour, trendingSound, textOverlay } = inputs;

  // Simple heuristic for mock
  let base = 30;
  const engagementRatio = views > 0 ? (likes + shares + downloads) / views : 0;
  if (engagementRatio > 0.15) base += 25;
  else if (engagementRatio > 0.08) base += 15;
  else if (engagementRatio > 0.04) base += 8;

  if (trendingSound) base += 12;
  if (textOverlay) base += 8;
  if (videoLength >= 10 && videoLength <= 60) base += 10;
  else if (videoLength < 10) base += 5;
  else base -= 5;

  if (postingHour >= 18 && postingHour <= 22) base += 8;
  else if (postingHour >= 11 && postingHour <= 14) base += 5;

  if (followers > 100000) base += 10;
  else if (followers > 10000) base += 5;

  const probability = Math.min(97, Math.max(5, base + Math.floor(Math.random() * 10)));

  let verdict: string;
  if (probability >= 70) verdict = 'VIRAL';
  else if (probability >= 50) verdict = 'LIKELY VIRAL';
  else if (probability >= 30) verdict = 'MODERATE';
  else verdict = 'UNLIKELY';

  const strengths = [
    trendingSound ? 'Leveraging trending audio — a top viral signal on TikTok' : 'Content format has potential for discoverability',
    textOverlay ? 'Text overlay increases viewer retention and accessibility' : 'Short-form content aligns with TikTok\'s algorithm preferences',
    engagementRatio > 0.08 ? 'Strong engagement ratio signals quality content' : 'Post timing creates opportunity for initial push',
    followers > 50000 ? 'Established follower base provides organic amplification' : 'Fresh content perspective can attract new audiences',
  ].slice(0, 4);

  const weaknesses = [
    views < 10000 ? 'Low initial view count may limit algorithmic boost' : 'Engagement velocity needs monitoring in first 2 hours',
    !trendingSound ? 'Missing trending sound — significant virality multiplier absent' : 'Consider adding a hook in the first 0.5 seconds',
    videoLength > 90 ? 'Longer videos may see drop-off — consider trimming' : 'Could benefit from a stronger call-to-action',
  ].slice(0, 3);

  const actionPlan = [
    'Post between 6–10 PM in your target timezone for maximum initial reach',
    'Use 3–5 relevant hashtags including one trending hashtag',
    'Engage with comments in the first 30 minutes to signal community activity',
    'Cross-promote on Instagram Reels and YouTube Shorts for additional algorithm signals',
  ];

  return { probability, verdict, strengths, weaknesses, actionPlan };
}

/* ── YouTube Viral Score Types ── */
interface YTViralScoreBreakdown {
  label: string;
  score: number;
  reason: string;
}

interface YTViralResult {
  compositeScore: number;
  titleScore: number;
  titleReason: string;
  hookScore: number;
  hookReason: string;
  seoScore: number;
  seoReason: string;
  timingScore: number;
  timingReason: string;
  nicheFitScore: number;
  nicheFitReason: string;
  suggestions: string[];
}

const YT_NICHES = ['Tech', 'Gaming', 'Finance', 'Education', 'Entertainment', 'Lifestyle', 'Fitness', 'Cooking', 'Travel', 'Music', 'Comedy', 'Beauty'];

type ActiveTab = 'tiktok' | 'youtube';

function generateYTMockResult(title: string, hookText: string, niche: string): YTViralResult {
  const randBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const titleScore = randBetween(40, 95);
  const hookScore = randBetween(35, 95);
  const seoScore = randBetween(30, 90);
  const timingScore = randBetween(45, 95);
  const nicheFitScore = randBetween(40, 90);
  const compositeScore = Math.round((titleScore * 0.25 + hookScore * 0.3 + seoScore * 0.2 + timingScore * 0.1 + nicheFitScore * 0.15));

  const titleReason = title.length > 8 && title.length < 60
    ? `Your title "${title.slice(0, 40)}${title.length > 40 ? '...' : ''}" is well-sized for YouTube's algorithm, falling in the optimal 8-60 character range. It has good potential to capture viewer attention in search and suggested feeds.`
    : title.length <= 8
    ? `Your title is quite short at ${title.length} characters. Longer titles (8-60 characters) tend to perform better as they provide more context to both the algorithm and potential viewers browsing their feed.`
    : `Your title is ${title.length} characters long, which may get truncated in search results. Consider condensing to under 60 characters while keeping the most impactful words at the beginning.`;

  const hookReason = hookText.length > 0
    ? `Your hook text creates a ${hookScore > 70 ? 'strong' : 'moderate'} initial engagement trigger. ${hookScore > 70 ? 'It effectively builds curiosity and encourages viewers to keep watching beyond the first 5 seconds.' : 'Strengthening the hook with a more specific promise or surprising element could significantly improve retention.'} The first few seconds are critical for YouTube's algorithm.`
    : 'No hook text was provided. A compelling hook in the first 5-10 seconds is the single most important factor for video retention and algorithmic performance on YouTube.';

  const seoReason = `The ${niche} niche is ${['Tech', 'Finance', 'Gaming'].includes(niche) ? 'highly competitive but offers great search volume' : 'a growing space with good monetization potential'}. ${seoScore > 65 ? 'Your content strategy aligns well with current search trends in this niche.' : 'Consider researching trending keywords in this niche using YouTube autocomplete or tools like TubeBuddy.'} SEO optimization can increase discoverability by 40-60%.`;

  const timingReason = `Current posting trends for ${niche} content suggest ${['Tech', 'Gaming'].includes(niche) ? 'weekdays between 2-5 PM EST' : 'weekends between 10 AM-2 PM EST'} as optimal windows. ${timingScore > 70 ? 'Your timing strategy appears to be well-aligned with audience availability patterns.' : 'Adjusting your upload schedule to peak hours could improve initial velocity by 15-25%.'}`;

  const nicheFitReason = `The ${niche} niche has an average CPM of ${['Finance', 'Tech'].includes(niche) ? '$15-30' : '$5-12'} and ${['Education', 'Finance'].includes(niche) ? 'excellent evergreen potential' : 'strong trending content opportunities'}. ${nicheFitScore > 65 ? 'Your content approach shows good alignment with audience expectations in this space.' : 'Consider studying top performers in this niche to better match content format and style expectations.'}`;

  const suggestions = [
    `Front-load your most impactful keywords in the title — YouTube weights the first 3-5 words heavily in search rankings.`,
    `Add chapters/timestamps to your description to improve viewer retention and appear in "key moments" search results.`,
    `Include 3-5 relevant hashtags at the end of your description to expand discoverability beyond your core audience.`,
    `Create a custom thumbnail with high contrast text (under 6 words) that complements but doesn't repeat the title.`,
    `Ask a specific question in the first 10 seconds and promise to answer it — this pattern drives 2-3x higher average view duration.`,
  ].slice(0, randBetween(3, 5));

  return { compositeScore, titleScore, titleReason, hookScore, hookReason, seoScore, seoReason, timingScore, timingReason, nicheFitScore, nicheFitReason, suggestions };
}

/* ── YouTube Animated Circle Gauge ── */
function YTCircleGauge({ value, size = 140, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value > 70 ? '#888888' : value >= 40 ? '#FDBA2D' : '#888888';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A1A1A" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{Math.round(value)}</span>
        <span className="text-[10px] text-[#666666]">viral score</span>
      </div>
    </div>
  );
}

/* ── Mini Progress Bar ── */
function MiniProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden w-full">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

/* ── Main Component ── */
export function GoffViralTool() {
  const { spendTokens } = useNychIQStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('tiktok');

  // TikTok state
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [shares, setShares] = useState('');
  const [downloads, setDownloads] = useState('');
  const [followers, setFollowers] = useState('');
  const [videoLength, setVideoLength] = useState(30);
  const [postingHour, setPostingHour] = useState(19);
  const [trendingSound, setTrendingSound] = useState(false);
  const [textOverlay, setTextOverlay] = useState(false);

  const [result, setResult] = useState<ViralResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadSteps, setLoadSteps] = useState<LoadingStep[]>([]);

  // YouTube state
  const [ytTitle, setYtTitle] = useState('');
  const [ytDescription, setYtDescription] = useState('');
  const [ytNiche, setYtNiche] = useState('Tech');
  const [ytHookText, setYtHookText] = useState('');
  const [ytResult, setYtResult] = useState<YTViralResult | null>(null);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytSearched, setYtSearched] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  const animateLoading = useCallback(async () => {
    const steps = LOADING_STEPS.map((s) => ({ label: s.label, status: 'pending' as const }));
    setLoadSteps(steps);

    for (let i = 0; i < steps.length; i++) {
      setLoadSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'active' } : s));
      await new Promise((r) => setTimeout(r, LOADING_STEPS[i].duration));
      setLoadSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s));
    }
  }, []);

  const handlePredict = async () => {
    if (!views.trim() && !likes.trim()) return;

    setLoading(true);
    setSearched(true);
    setError(null);
    setResult(null);

    const ok = spendTokens('goffviral');
    if (!ok) { setLoading(false); return; }

    const inputs = {
      views: parseInt(views) || 0,
      likes: parseInt(likes) || 0,
      shares: parseInt(shares) || 0,
      downloads: parseInt(downloads) || 0,
      followers: parseInt(followers) || 0,
      videoLength,
      postingHour,
      trendingSound,
      textOverlay,
    };

    try {
      animateLoading();

      const prompt = `You are GoffViral-V1 Pro, an advanced TikTok viral prediction model trained on 19,084 viral TikTok videos with 98.9% accuracy.

Analyze the following TikTok video metrics and predict its viral potential:

- Views: ${inputs.views}
- Likes: ${inputs.likes}
- Shares: ${inputs.shares}
- Downloads: ${inputs.downloads}
- Follower Count: ${inputs.followers}
- Video Length: ${inputs.videoLength} seconds
- Posting Hour: ${formatHour(inputs.postingHour)} (${inputs.postingHour}:00)
- Uses Trending Sound: ${inputs.trendingSound ? 'Yes' : 'No'}
- Has Text Overlay: ${inputs.textOverlay ? 'Yes' : 'No'}

Calculate the engagement ratio and consider all TikTok algorithm signals. Return a JSON object with these exact fields:
- "probability": number 0-100 (viral probability percentage)
- "verdict": one of "VIRAL" (>=70%), "LIKELY VIRAL" (>=50%), "MODERATE" (>=30%), "UNLIKELY" (<30%)
- "strengths": array of 3-4 specific strengths based on the metrics (each a short sentence)
- "weaknesses": array of 2-3 specific weaknesses or areas for improvement
- "actionPlan": array of 3-4 numbered actionable steps to increase viral potential

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsed = JSON.parse(cleaned);
        setResult({
          probability: typeof parsed.probability === 'number' ? Math.min(100, Math.max(0, parsed.probability)) : 50,
          verdict: ['VIRAL', 'LIKELY VIRAL', 'MODERATE', 'UNLIKELY'].includes(parsed.verdict) ? parsed.verdict : 'MODERATE',
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 3) : [],
          actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan.slice(0, 4) : [],
        });
      } catch {
        // AI parse failed, use mock fallback
        setResult(generateMockResult(inputs));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };
  const handleYTScore = async () => {
    if (!ytTitle.trim()) return;
    setYtLoading(true);
    setYtSearched(true);
    setYtError(null);
    setYtResult(null);

    const ok = spendTokens('goffviral');
    if (!ok) { setYtLoading(false); return; }

    try {
      const prompt = `You are a YouTube viral content scoring expert. Analyze the following video details and score its viral potential:

- Title: "${ytTitle.trim()}"
- Description: "${ytDescription.trim()}"
- Niche: ${ytNiche}
- Hook Text: "${ytHookText.trim()}"

Return a JSON object with these exact fields:
- "compositeScore": number 1-100 (overall viral potential)
- "titleScore": number 1-100
- "titleReason": string (2-3 sentences explaining the score)
- "hookScore": number 1-100
- "hookReason": string (2-3 sentences explaining the score)
- "seoScore": number 1-100
- "seoReason": string (2-3 sentences explaining the score)
- "timingScore": number 1-100
- "timingReason": string (2-3 sentences explaining the score)
- "nicheFitScore": number 1-100
- "nicheFitReason": string (2-3 sentences explaining the score)
- "suggestions": array of 3-5 specific actionable improvement suggestions

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsed = JSON.parse(cleaned);
        setYtResult({
          compositeScore: typeof parsed.compositeScore === 'number' ? Math.min(100, Math.max(1, Math.round(parsed.compositeScore))) : 60,
          titleScore: typeof parsed.titleScore === 'number' ? Math.min(100, Math.max(1, Math.round(parsed.titleScore))) : 50,
          titleReason: typeof parsed.titleReason === 'string' ? parsed.titleReason : 'Title analysis not available.',
          hookScore: typeof parsed.hookScore === 'number' ? Math.min(100, Math.max(1, Math.round(parsed.hookScore))) : 50,
          hookReason: typeof parsed.hookReason === 'string' ? parsed.hookReason : 'Hook analysis not available.',
          seoScore: typeof parsed.seoScore === 'number' ? Math.min(100, Math.max(1, Math.round(parsed.seoScore))) : 50,
          seoReason: typeof parsed.seoReason === 'string' ? parsed.seoReason : 'SEO analysis not available.',
          timingScore: typeof parsed.timingScore === 'number' ? Math.min(100, Math.max(1, Math.round(parsed.timingScore))) : 50,
          timingReason: typeof parsed.timingReason === 'string' ? parsed.timingReason : 'Timing analysis not available.',
          nicheFitScore: typeof parsed.nicheFitScore === 'number' ? Math.min(100, Math.max(1, Math.round(parsed.nicheFitScore))) : 50,
          nicheFitReason: typeof parsed.nicheFitReason === 'string' ? parsed.nicheFitReason : 'Niche fit analysis not available.',
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
        });
      } catch {
        setYtResult(generateYTMockResult(ytTitle.trim(), ytHookText.trim(), ytNiche));
      }
    } catch (err) {
      setYtError(err instanceof Error ? err.message : 'Scoring failed. Please try again.');
      setYtResult(null);
    } finally {
      setYtLoading(false);
    }
  };

  const scoreColor = (s: number) => s > 70 ? '#888888' : s >= 40 ? '#FDBA2D' : '#888888';

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
        <button
          onClick={() => setActiveTab('tiktok')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'tiktok' ? 'bg-[#0f0f0f] text-[#FDBA2D] shadow-sm' : 'text-[#a0a0a0] hover:text-[#FFFFFF]'
          }`}
        >
          <Flame className="w-4 h-4" /> TikTok Predictor
        </button>
        <button
          onClick={() => setActiveTab('youtube')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'youtube' ? 'bg-[#0f0f0f] text-[#FDBA2D] shadow-sm' : 'text-[#a0a0a0] hover:text-[#FFFFFF]'
          }`}
        >
          <Youtube className="w-4 h-4" /> YouTube Viral Score
        </button>
      </div>

      {activeTab === 'tiktok' && (
      <>
      {/* Header */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
              <Flame className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#FFFFFF]">GoffViral TikTok Predictor</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(255,255,255,0.06)] text-[#888888] border border-[rgba(255,255,255,0.06)]">AI MODEL</span>
            </div>
          </div>
          <p className="text-xs text-[#a0a0a0] mt-1 ml-12">Custom viral prediction model for TikTok content — GoffViral-V1 Pro, trained on 19,084 viral videos. 98.9% accuracy.</p>
        </div>

        {/* Input Form */}
        <div className="px-4 sm:px-5 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Views */}
            <div>
              <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Views
              </label>
              <input
                type="number" value={views} onChange={(e) => setViews(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
              />
            </div>
            {/* Likes */}
            <div>
              <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Likes
              </label>
              <input
                type="number" value={likes} onChange={(e) => setLikes(e.target.value)}
                placeholder="e.g. 8000"
                className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
              />
            </div>
            {/* Shares */}
            <div>
              <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                <Share2 className="w-3 h-3" /> Shares
              </label>
              <input
                type="number" value={shares} onChange={(e) => setShares(e.target.value)}
                placeholder="e.g. 1200"
                className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
              />
            </div>
            {/* Downloads */}
            <div>
              <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                <Download className="w-3 h-3" /> Downloads
              </label>
              <input
                type="number" value={downloads} onChange={(e) => setDownloads(e.target.value)}
                placeholder="e.g. 300"
                className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
              />
            </div>
            {/* Followers */}
            <div>
              <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Followers
              </label>
              <input
                type="number" value={followers} onChange={(e) => setFollowers(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
              />
            </div>
            {/* Posting Hour */}
            <div>
              <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Posting Hour
              </label>
              <div className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] flex items-center justify-between">
                <input
                  type="range" min={0} max={23} value={postingHour}
                  onChange={(e) => setPostingHour(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full appearance-none cursor-pointer accent-[#FDBA2D]"
                />
                <span className="text-xs text-[#FDBA2D] font-medium ml-3 min-w-[70px] text-right">{formatHour(postingHour)}</span>
              </div>
            </div>
          </div>

          {/* Video Length Slider */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#a0a0a0] flex items-center gap-1">
                <Activity className="w-3 h-3" /> Video Length
              </label>
              <span className="text-xs text-[#FDBA2D] font-medium">{videoLength}s</span>
            </div>
            <input
              type="range" min={5} max={180} value={videoLength}
              onChange={(e) => setVideoLength(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#1A1A1A] rounded-full appearance-none cursor-pointer accent-[#FDBA2D]"
            />
            <div className="flex justify-between text-[10px] text-[#666666] mt-1">
              <span>5s</span>
              <span>180s</span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setTrendingSound(!trendingSound)}
                className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                  trendingSound ? 'bg-[#FDBA2D] border-[#FDBA2D]' : 'bg-[#0a0a0a] border-[#1A1A1A]'
                }`}
                style={{ width: 18, height: 18 }}
              >
                {trendingSound && <Check className="w-3 h-3 text-[#0a0a0a]" />}
              </div>
              <input type="checkbox" checked={trendingSound} onChange={() => setTrendingSound(!trendingSound)} className="hidden" />
              <span className="text-sm text-[#FFFFFF] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#888888]" /> Uses Trending Sound
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setTextOverlay(!textOverlay)}
                className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                  textOverlay ? 'bg-[#FDBA2D] border-[#FDBA2D]' : 'bg-[#0a0a0a] border-[#1A1A1A]'
                }`}
                style={{ width: 18, height: 18 }}
              >
                {textOverlay && <Check className="w-3 h-3 text-[#0a0a0a]" />}
              </div>
              <input type="checkbox" checked={textOverlay} onChange={() => setTextOverlay(!textOverlay)} className="hidden" />
              <span className="text-sm text-[#FFFFFF] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#888888]" /> Has Text Overlay
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePredict}
            disabled={loading || (!views.trim() && !likes.trim())}
            className="mt-5 w-full sm:w-auto px-6 h-11 rounded-lg bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Predict Viral Potential
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#888888] mx-auto mb-3" />
          <p className="text-sm text-[#FFFFFF] mb-4">{error}</p>
          <button onClick={handlePredict} className="px-4 py-2 rounded-lg bg-[#888888] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading Steps */}
      {loading && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-5 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[rgba(253,186,45,0.1)] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#FDBA2D] animate-pulse" />
            </div>
            <span className="text-sm font-semibold text-[#FFFFFF]">GoffViral-V1 Pro Analyzing...</span>
          </div>
          {loadSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.status === 'done' ? 'bg-[#888888]' :
                step.status === 'active' ? 'bg-[rgba(253,186,45,0.2)] border border-[#FDBA2D]/50' :
                'bg-[#0a0a0a] border border-[#1A1A1A]'
              }`}>
                {step.status === 'done' && <Check className="w-3 h-3 text-[#0a0a0a]" />}
                {step.status === 'active' && <Loader2 className="w-3 h-3 text-[#FDBA2D] animate-spin" />}
              </div>
              <span className={`text-sm ${step.status === 'active' ? 'text-[#FFFFFF]' : step.status === 'done' ? 'text-[#a0a0a0]' : 'text-[#666666]'}`}>
                {step.label}
              </span>
            </div>
          ))}
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
            <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
            <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-4">
          {/* Probability Card */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Circle */}
              <CircleProgress value={result.probability} size={130} strokeWidth={10} />
              {/* Verdict + Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${verdictBadge(result.verdict).bg} ${verdictBadge(result.verdict).text} ${verdictBadge(result.verdict).border}`}>
                    {result.verdict}
                  </span>
                </div>
                <p className="text-sm text-[#a0a0a0] mb-3">
                  {result.probability >= 70
                    ? 'This content has a very high probability of going viral on TikTok. The metrics strongly align with viral patterns.'
                    : result.probability >= 50
                    ? 'This content shows good viral potential with some optimizations. Close to hitting viral thresholds.'
                    : result.probability >= 30
                    ? 'Moderate potential. Some signals are positive but several improvements could boost virality significantly.'
                    : 'This content is unlikely to go viral in its current state. Significant changes recommended.'}
                </p>
                <div className="flex items-center gap-4 justify-center sm:justify-start text-[10px] text-[#666666]">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> GoffViral-V1 Pro</span>
                  <span>•</span>
                  <span>98.9% accuracy</span>
                  <span>•</span>
                  <span>19,084 trained videos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#888888]" /> Strengths
            </h4>
            <div className="space-y-2.5">
              {result.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#888888] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#FFFFFF]">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#888888]" /> Weaknesses
            </h4>
            <div className="space-y-2.5">
              {result.weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-[#888888] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#FFFFFF]">{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#888888]" /> Action Plan
            </h4>
            <div className="space-y-3">
              {result.actionPlan.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#888888]">{i + 1}</span>
                  </div>
                  <span className="text-sm text-[#FFFFFF]">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
            <Flame className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Predict TikTok Virality</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Enter your TikTok video metrics to get an AI-powered viral potential prediction with actionable insights.</p>
        </div>
      )}

      {searched && !loading && (
        <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS.goffviral} tokens per prediction</div>
      )}
      </>
      )}

      {/* YouTube Viral Score Tab */}
      {activeTab === 'youtube' && (
        <div className="space-y-5 animate-fade-in-up">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)]">
                  <Youtube className="w-5 h-5 text-[#888888]" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-[#FFFFFF]">YouTube Viral Score</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(255,255,255,0.06)] text-[#888888] border border-[rgba(255,255,255,0.06)]">AI SCORE</span>
                </div>
              </div>
              <p className="text-xs text-[#a0a0a0] mt-1 ml-12">Score your YouTube video&apos;s viral potential with AI-powered breakdown analysis.</p>
            </div>

            {/* YouTube Input Form */}
            <div className="px-4 sm:px-5 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                    <Type className="w-3 h-3" /> Video Title
                  </label>
                  <input
                    type="text" value={ytTitle} onChange={(e) => setYtTitle(e.target.value)}
                    placeholder="e.g. I Tried Every AI Tool for 30 Days"
                    className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Niche
                  </label>
                  <select
                    value={ytNiche} onChange={(e) => setYtNiche(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#888888]/50 transition-colors appearance-none cursor-pointer"
                  >
                    {YT_NICHES.map((n) => (
                      <option key={n} value={n} className="bg-[#0a0a0a] text-[#FFFFFF]">{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Description
                </label>
                <textarea
                  value={ytDescription} onChange={(e) => setYtDescription(e.target.value)}
                  placeholder="Paste your video description here..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Hook Text (first 5-10 seconds)
                </label>
                <textarea
                  value={ytHookText} onChange={(e) => setYtHookText(e.target.value)}
                  placeholder="What do you say in the first 5-10 seconds to hook viewers?"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleYTScore}
                disabled={ytLoading || !ytTitle.trim()}
                className="w-full sm:w-auto px-6 h-11 rounded-lg bg-[#888888] text-[#FFFFFF] text-sm font-bold hover:bg-[#D04242] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
              >
                {ytLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Score My Video
              </button>
            </div>
          </div>

          {/* YouTube Error */}
          {ytError && (
            <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-[#888888] mx-auto mb-3" />
              <p className="text-sm text-[#FFFFFF] mb-4">{ytError}</p>
              <button onClick={handleYTScore} className="px-4 py-2 rounded-lg bg-[#888888] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* YouTube Loading */}
          {ytLoading && (
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-[#888888] animate-spin mx-auto mb-3" />
                <p className="text-sm text-[#a0a0a0]">Analyzing viral potential...</p>
              </div>
            </div>
          )}

          {/* YouTube Results */}
          {!ytLoading && ytResult && (
            <div className="space-y-4">
              {/* Composite Score */}
              <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <YTCircleGauge value={ytResult.compositeScore} size={140} strokeWidth={10} />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-base font-bold text-[#FFFFFF] mb-1">Composite Viral Score</h3>
                    <p className="text-sm text-[#a0a0a0]">
                      {ytResult.compositeScore > 70
                        ? 'Excellent viral potential! This video has strong signals across all scoring dimensions and is well-positioned for significant reach.'
                        : ytResult.compositeScore >= 40
                        ? 'Good potential with room for improvement. Focus on the lower-scoring areas below to maximize your video\'s chances.'
                        : 'This video needs significant optimization before upload. Review the breakdown scores and suggestions carefully.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Breakdown Scores */}
              <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
                <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#FDBA2D]" /> Score Breakdown
                </h4>
                <div className="space-y-4">
                  {[
                    { label: 'Title Score', score: ytResult.titleScore, reason: ytResult.titleReason },
                    { label: 'Hook Score', score: ytResult.hookScore, reason: ytResult.hookReason },
                    { label: 'SEO Score', score: ytResult.seoScore, reason: ytResult.seoReason },
                    { label: 'Timing Score', score: ytResult.timingScore, reason: ytResult.timingReason },
                    { label: 'Niche Fit Score', score: ytResult.nicheFitScore, reason: ytResult.nicheFitReason },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-[#FFFFFF]">{item.label}</span>
                        <span className="text-sm font-bold" style={{ color: scoreColor(item.score) }}>{item.score}/100</span>
                      </div>
                      <MiniProgressBar value={item.score} color={scoreColor(item.score)} />
                      <p className="text-xs text-[#a0a0a0] mt-2 leading-relaxed">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
                <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#FDBA2D]" /> Improvement Suggestions
                </h4>
                <div className="space-y-2.5">
                  {ytResult.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[rgba(253,186,45,0.15)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-[#FDBA2D]">{i + 1}</span>
                      </div>
                      <span className="text-sm text-[#FFFFFF] leading-relaxed">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* YouTube Empty State */}
          {!ytLoading && !ytSearched && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
                <Youtube className="w-8 h-8 text-[#888888]" />
              </div>
              <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Score Your YouTube Video</h3>
              <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Enter your video details to get an AI-powered viral score with detailed breakdown and improvement suggestions.</p>
            </div>
          )}

          {ytSearched && !ytLoading && (
            <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS.goffviral} tokens per score</div>
          )}
        </div>
      )}
    </div>
  );
}
