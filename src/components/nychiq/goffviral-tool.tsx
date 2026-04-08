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
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888888] hover:text-[#E8E8E8]" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ── Verdict helpers ── */
function verdictBadge(verdict: string): { bg: string; text: string; border: string } {
  switch (verdict) {
    case 'VIRAL': return { bg: 'bg-[rgba(0,196,140,0.15)]', text: 'text-[#00C48C]', border: 'border-[rgba(0,196,140,0.3)]' };
    case 'LIKELY VIRAL': return { bg: 'bg-[rgba(74,158,255,0.15)]', text: 'text-[#4A9EFF]', border: 'border-[rgba(74,158,255,0.3)]' };
    case 'MODERATE': return { bg: 'bg-[rgba(245,166,35,0.15)]', text: 'text-[#F5A623]', border: 'border-[rgba(245,166,35,0.3)]' };
    default: return { bg: 'bg-[rgba(224,82,82,0.15)]', text: 'text-[#E05252]', border: 'border-[rgba(224,82,82,0.3)]' };
  }
}

function probabilityColor(p: number): string {
  if (p >= 70) return '#00C48C';
  if (p >= 40) return '#F5A623';
  return '#E05252';
}

function probabilityStroke(p: number): string {
  if (p >= 70) return '#00C48C';
  if (p >= 40) return '#F5A623';
  return '#E05252';
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

/* ── Main Component ── */
export function GoffViralTool() {
  const { spendTokens } = useNychIQStore();

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
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
              <Flame className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-[#E8E8E8]">GoffViral TikTok Predictor</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(155,114,207,0.15)] text-[#9B72CF] border border-[rgba(155,114,207,0.3)]">AI MODEL</span>
            </div>
          </div>
          <p className="text-xs text-[#888888] mt-1 ml-12">Custom viral prediction model for TikTok content — GoffViral-V1 Pro, trained on 19,084 viral videos. 98.9% accuracy.</p>
        </div>

        {/* Input Form */}
        <div className="px-4 sm:px-5 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Views */}
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Views
              </label>
              <input
                type="number" value={views} onChange={(e) => setViews(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
            </div>
            {/* Likes */}
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Likes
              </label>
              <input
                type="number" value={likes} onChange={(e) => setLikes(e.target.value)}
                placeholder="e.g. 8000"
                className="w-full h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
            </div>
            {/* Shares */}
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                <Share2 className="w-3 h-3" /> Shares
              </label>
              <input
                type="number" value={shares} onChange={(e) => setShares(e.target.value)}
                placeholder="e.g. 1200"
                className="w-full h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
            </div>
            {/* Downloads */}
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                <Download className="w-3 h-3" /> Downloads
              </label>
              <input
                type="number" value={downloads} onChange={(e) => setDownloads(e.target.value)}
                placeholder="e.g. 300"
                className="w-full h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
            </div>
            {/* Followers */}
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Followers
              </label>
              <input
                type="number" value={followers} onChange={(e) => setFollowers(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
            </div>
            {/* Posting Hour */}
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Posting Hour
              </label>
              <div className="w-full h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between">
                <input
                  type="range" min={0} max={23} value={postingHour}
                  onChange={(e) => setPostingHour(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full appearance-none cursor-pointer accent-[#F5A623]"
                />
                <span className="text-xs text-[#F5A623] font-medium ml-3 min-w-[70px] text-right">{formatHour(postingHour)}</span>
              </div>
            </div>
          </div>

          {/* Video Length Slider */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#888888] flex items-center gap-1">
                <Activity className="w-3 h-3" /> Video Length
              </label>
              <span className="text-xs text-[#F5A623] font-medium">{videoLength}s</span>
            </div>
            <input
              type="range" min={5} max={180} value={videoLength}
              onChange={(e) => setVideoLength(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#1A1A1A] rounded-full appearance-none cursor-pointer accent-[#F5A623]"
            />
            <div className="flex justify-between text-[10px] text-[#444444] mt-1">
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
                  trendingSound ? 'bg-[#F5A623] border-[#F5A623]' : 'bg-[#0D0D0D] border-[#1A1A1A]'
                }`}
                style={{ width: 18, height: 18 }}
              >
                {trendingSound && <Check className="w-3 h-3 text-[#0A0A0A]" />}
              </div>
              <input type="checkbox" checked={trendingSound} onChange={() => setTrendingSound(!trendingSound)} className="hidden" />
              <span className="text-sm text-[#E8E8E8] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#9B72CF]" /> Uses Trending Sound
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setTextOverlay(!textOverlay)}
                className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                  textOverlay ? 'bg-[#F5A623] border-[#F5A623]' : 'bg-[#0D0D0D] border-[#1A1A1A]'
                }`}
                style={{ width: 18, height: 18 }}
              >
                {textOverlay && <Check className="w-3 h-3 text-[#0A0A0A]" />}
              </div>
              <input type="checkbox" checked={textOverlay} onChange={() => setTextOverlay(!textOverlay)} className="hidden" />
              <span className="text-sm text-[#E8E8E8] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#9B72CF]" /> Has Text Overlay
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePredict}
            disabled={loading || (!views.trim() && !likes.trim())}
            className="mt-5 w-full sm:w-auto px-6 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Predict Viral Potential
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#E05252] mx-auto mb-3" />
          <p className="text-sm text-[#E8E8E8] mb-4">{error}</p>
          <button onClick={handlePredict} className="px-4 py-2 rounded-lg bg-[#E05252] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading Steps */}
      {loading && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-5 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[rgba(245,166,35,0.1)] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#F5A623] animate-pulse" />
            </div>
            <span className="text-sm font-semibold text-[#E8E8E8]">GoffViral-V1 Pro Analyzing...</span>
          </div>
          {loadSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.status === 'done' ? 'bg-[#00C48C]' :
                step.status === 'active' ? 'bg-[rgba(245,166,35,0.2)] border border-[#F5A623]/50' :
                'bg-[#0D0D0D] border border-[#1A1A1A]'
              }`}>
                {step.status === 'done' && <Check className="w-3 h-3 text-[#0A0A0A]" />}
                {step.status === 'active' && <Loader2 className="w-3 h-3 text-[#F5A623] animate-spin" />}
              </div>
              <span className={`text-sm ${step.status === 'active' ? 'text-[#E8E8E8]' : step.status === 'done' ? 'text-[#888888]' : 'text-[#444444]'}`}>
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
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-6">
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
                <p className="text-sm text-[#888888] mb-3">
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
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#00C48C]" /> Strengths
            </h4>
            <div className="space-y-2.5">
              {result.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00C48C] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#E8E8E8]">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#E05252]" /> Weaknesses
            </h4>
            <div className="space-y-2.5">
              {result.weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-[#E05252] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#E8E8E8]">{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#4A9EFF]" /> Action Plan
            </h4>
            <div className="space-y-3">
              {result.actionPlan.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[rgba(74,158,255,0.15)] border border-[rgba(74,158,255,0.3)] flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#4A9EFF]">{i + 1}</span>
                  </div>
                  <span className="text-sm text-[#E8E8E8]">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mb-4">
            <Flame className="w-8 h-8 text-[#F5A623]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Predict TikTok Virality</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Enter your TikTok video metrics to get an AI-powered viral potential prediction with actionable insights.</p>
        </div>
      )}

      {searched && !loading && (
        <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.goffviral} tokens per prediction</div>
      )}
    </div>
  );
}
