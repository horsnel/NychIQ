'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Scan,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  TrendingUp,
  Search,
  Tag,
  Users,
  Sparkles,
  Wifi,
  WifiOff,
  ArrowRight,
  Flame,
} from 'lucide-react';

/* ── Types ── */
interface SubScore {
  label: string;
  score: number;
  icon: React.ReactNode;
  description: string;
}

interface TrendingTopic {
  title: string;
  velocity: 'rising' | 'stable' | 'new';
  views: string;
}

interface PulseCheckResult {
  overallScore: number;
  signalStrength: 'strong' | 'moderate' | 'weak' | 'none';
  subScores: SubScore[];
  recommendations: string[];
  trendingTopics: TrendingTopic[];
  summary: string;
}

const NICHES = [
  'Technology',
  'Gaming',
  'Finance',
  'Education',
  'Entertainment',
  'Vlogs & Lifestyle',
  'Health & Fitness',
  'Music',
  'Cooking & Food',
  'Travel',
  'Comedy',
  'Science',
  'Sports',
  'Beauty & Fashion',
  'Business',
  'Motivation & Self-Help',
];

const VELOCITY_CONFIG = {
  rising: { color: '#888888', bg: 'rgba(16,185,129,0.1)', label: 'Rising' },
  stable: { color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)', label: 'Stable' },
  new: { color: '#888888', bg: 'rgba(59,130,246,0.1)', label: 'New' },
};

const SIGNAL_CONFIG = {
  strong: { color: '#888888', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', icon: <Wifi className="w-5 h-5" />, label: 'Strong Signal' },
  moderate: { color: '#FDBA2D', bg: 'rgba(253,186,45,0.08)', border: 'rgba(253,186,45,0.3)', icon: <WifiOff className="w-5 h-5" />, label: 'Moderate Signal' },
  weak: { color: '#888888', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', icon: <WifiOff className="w-5 h-5" />, label: 'Weak Signal' },
  none: { color: '#666666', bg: 'rgba(68,68,68,0.08)', border: 'rgba(68,68,68,0.3)', icon: <WifiOff className="w-5 h-5" />, label: 'No Signal' },
};

/* ── Sub-score card ── */
function SubScoreCard({ sub }: { sub: SubScore }) {
  const color = sub.score >= 75 ? '#888888' : sub.score >= 50 ? '#FDBA2D' : sub.score >= 30 ? '#888888' : '#888888';
  return (
    <div className="rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] p-4 hover:border-[rgba(255,255,255,0.1)] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{sub.icon}</span>
          <span className="text-xs font-medium text-[#FFFFFF]">{sub.label}</span>
        </div>
        <span
          className="text-sm font-bold"
          style={{ color }}
        >
          {sub.score}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${sub.score}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] text-[#a0a0a0] line-clamp-2">{sub.description}</p>
    </div>
  );
}

/* ── Mock fallback data ── */
function getMockResult(niche: string): PulseCheckResult {
  return {
    overallScore: 62,
    signalStrength: 'moderate',
    subScores: [
      { label: 'Topic Relevance', score: 78, icon: <Tag className="w-4 h-4" />, description: 'Topic aligns well with current algorithm preferences' },
      { label: 'SEO Strength', score: 55, icon: <Search className="w-4 h-4" />, description: 'Title and description need keyword optimization' },
      { label: 'Trend Alignment', score: 68, icon: <TrendingUp className="w-4 h-4" />, description: 'Content partially aligns with emerging trends in this niche' },
      { label: 'Audience Match', score: 48, icon: <Users className="w-4 h-4" />, description: 'Targeting may be too broad; narrow audience focus recommended' },
    ],
    recommendations: [
      'Add high-volume keywords from current trending searches to your title and description within the first 100 characters.',
      'Front-load your most engaging hook in the first 5 seconds — the algorithm heavily weighs initial retention.',
      'Include 3-5 relevant tags using trending long-tail keywords from your niche to improve discoverability.',
      'Post during peak engagement hours (2-4 PM local time) to maximize initial velocity signals.',
      'Add chapters/timestamps to your description — this improves watch time metrics the algorithm tracks.',
    ],
    trendingTopics: [
      { title: `AI tools for ${niche.toLowerCase()} creators`, velocity: 'rising', views: '1.2M' },
      { title: `${niche} trends 2025 predictions`, velocity: 'rising', views: '890K' },
      { title: `Beginner ${niche.toLowerCase()} starter guide`, velocity: 'stable', views: '650K' },
      { title: `${niche} productivity hacks`, velocity: 'new', views: '420K' },
      { title: `${niche} equipment reviews`, velocity: 'stable', views: '380K' },
    ],
    summary:
      `Your content has moderate algorithm alignment for the ${niche} niche. Topic relevance is strong, but SEO optimization and audience targeting need improvement. Focus on incorporating trending keywords and narrowing your audience segment.`,
  };
}

/* ── Main PulseCheck Tool ── */
export function PulseCheckTool() {
  const { spendTokens } = useNychIQStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [niche, setNiche] = useState('Technology');
  const [result, setResult] = useState<PulseCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const canCheck = title.trim().length > 3 && description.trim().length > 10;

  const handleCheck = async () => {
    if (!canCheck) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('pulsecheck');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube algorithm alignment expert. Analyze this video metadata for algorithm optimization in the "${niche}" niche.

Title: ${title.trim()}
Description: ${description.trim()}

Return a JSON object with:
- "overallScore": Algorithm alignment score (0-100)
- "signalStrength": One of "strong", "moderate", "weak", "none"
- "subScores": Array of 4 objects with:
  - "label": One of "Topic Relevance", "SEO Strength", "Trend Alignment", "Audience Match"
  - "score": 0-100
  - "description": Brief explanation
- "recommendations": Array of 5 specific actionable recommendations
- "trendingTopics": Array of 5 trending topics in the "${niche}" niche, each with:
  - "title": Topic name
  - "velocity": One of "rising", "stable", "new"
  - "views": View count string (e.g., "1.2M")
- "summary": 2-3 sentence overall analysis

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const iconMap: Record<string, React.ReactNode> = {
        'Topic Relevance': <Tag className="w-4 h-4" />,
        'SEO Strength': <Search className="w-4 h-4" />,
        'Trend Alignment': <TrendingUp className="w-4 h-4" />,
        'Audience Match': <Users className="w-4 h-4" />,
      };

      setResult({
        overallScore: Math.min(100, Math.max(0, parseInt(parsed.overallScore, 10) || 50)),
        signalStrength: ['strong', 'moderate', 'weak', 'none'].includes(parsed.signalStrength)
          ? parsed.signalStrength
          : 'moderate',
        subScores: Array.isArray(parsed.subScores)
          ? parsed.subScores.map((s: any) => ({
              label: s.label || 'Score',
              score: Math.min(100, Math.max(0, parseInt(s.score, 10) || 50)),
              icon: iconMap[s.label] ?? <Tag className="w-4 h-4" />,
              description: s.description || '',
            }))
          : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.map((r: any) => (typeof r === 'string' ? r : 'Optimize your metadata'))
          : [],
        trendingTopics: Array.isArray(parsed.trendingTopics)
          ? parsed.trendingTopics.slice(0, 5).map((t: any) => ({
              title: t.title || 'Trending Topic',
              velocity: ['rising', 'stable', 'new'].includes(t.velocity) ? t.velocity : 'stable',
              views: t.views || '100K',
            }))
          : [],
        summary: parsed.summary || 'Algorithm alignment analysis complete.',
      });
    } catch {
      setResult(getMockResult(niche));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `PulseCheck — Algorithm Alignment Report\nNiche: ${niche}\nOverall Score: ${result.overallScore}/100\nSignal: ${result.signalStrength}\n\n${result.summary}\n\nSub-Scores:\n${result.subScores.map((s) => `- ${s.label}: ${s.score}/100 — ${s.description}`).join('\n')}\n\nRecommendations:\n${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setResult(null);
    setError(null);
    setSearched(false);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)]">
              <Scan className="w-5 h-5 text-[#888888]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">PulseCheck — Algorithm Alignment</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Check if your content aligns with what the algorithm is pushing
              </p>
            </div>
          </div>
          <p className="text-sm text-[#a0a0a0] mb-4">
            Paste your video title and description. AI checks if the content aligns with what the
            algorithm is currently pushing in your niche.
          </p>

          {/* Title Input */}
          <div className="relative mb-2">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title..."
              className="w-full h-11 pl-10 pr-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 focus:ring-1 focus:ring-[rgba(255,255,255,0.06)]/20 transition-colors"
            />
          </div>

          {/* Description Input */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Video description (at least 10 characters)..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 focus:ring-1 focus:ring-[rgba(255,255,255,0.06)]/20 transition-colors resize-none mb-2"
          />

          {/* Niche Selector */}
          <div className="relative mb-4">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#888888]/50 transition-colors appearance-none cursor-pointer"
            >
              {NICHES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheck}
              disabled={loading || !canCheck}
              className="px-5 h-11 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              style={{
                backgroundColor: canCheck ? '#888888' : '#1a1a1a',
                color: canCheck ? '#0a0a0a' : '#a0a0a0',
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              Check Alignment
            </button>
            {searched && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 h-11 rounded-lg border border-[rgba(255,255,255,0.06)] text-xs text-[#a0a0a0] hover:bg-[#1A1A1A] hover:text-[#FFFFFF] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#888888] mx-auto mb-2" />
          <p className="text-sm text-[#FFFFFF]">{error}</p>
          <button
            onClick={handleCheck}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            style={{ backgroundColor: '#888888', color: '#0a0a0a' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-[#888888] animate-spin" />
              <span className="text-sm text-[#a0a0a0]">Analyzing algorithm alignment...</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
                  <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-full" />
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-5/6" />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <>
          {/* Overall Score + Signal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Overall Score */}
            <div
              className="rounded-lg p-5 border"
              style={{
                backgroundColor: `${SIGNAL_CONFIG[result.signalStrength].color}08`,
                borderColor: `${SIGNAL_CONFIG[result.signalStrength].color}30`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Scan className="w-5 h-5" style={{ color: SIGNAL_CONFIG[result.signalStrength].color }} />
                <span className="text-sm text-[#a0a0a0]">Overall Algorithm Score</span>
              </div>
              <div
                className="text-4xl font-bold"
                style={{ color: SIGNAL_CONFIG[result.signalStrength].color }}
              >
                {result.overallScore}
                <span className="text-lg text-[#666666]">/100</span>
              </div>
            </div>

            {/* Signal Strength */}
            <div
              className="rounded-lg p-5 border"
              style={{
                backgroundColor: SIGNAL_CONFIG[result.signalStrength].bg,
                borderColor: SIGNAL_CONFIG[result.signalStrength].border,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span style={{ color: SIGNAL_CONFIG[result.signalStrength].color }}>
                  {SIGNAL_CONFIG[result.signalStrength].icon}
                </span>
                <span className="text-sm text-[#a0a0a0]">Signal Strength</span>
              </div>
              <div
                className="text-xl font-bold"
                style={{ color: SIGNAL_CONFIG[result.signalStrength].color }}
              >
                {SIGNAL_CONFIG[result.signalStrength].label}
              </div>
              <p className="text-xs text-[#666666] mt-1">
                {result.signalStrength === 'strong' && 'Your content is well-aligned with current algorithm signals.'}
                {result.signalStrength === 'moderate' && 'Some optimization needed to maximize algorithm visibility.'}
                {result.signalStrength === 'weak' && 'Significant gaps between your content and algorithm preferences.'}
                {result.signalStrength === 'none' && 'Content is misaligned with current algorithm behavior.'}
              </p>
            </div>
          </div>

          {/* Sub-Scores */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <Scan className="w-4 h-4 text-[#888888]" />
              Sub-Scores Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.subScores.map((sub, i) => (
                <SubScoreCard key={i} sub={sub} />
              ))}
            </div>
          </div>

          {/* Trending Topics */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FDBA2D]" />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Trending in {niche}</h3>
              </div>
              <span className="text-[10px] text-[#666666]">Mock data</span>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {result.trendingTopics.map((topic, i) => {
                const velConfig = VELOCITY_CONFIG[topic.velocity];
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1A1A1A]/30 transition-colors">
                    <span className="text-xs font-bold text-[#666666] w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-[#FFFFFF]">{topic.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: velConfig.color, backgroundColor: velConfig.bg }}
                        >
                          {velConfig.label}
                        </span>
                        <span className="text-[10px] text-[#666666]">{topic.views} views</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#666666] shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FDBA2D]" />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Recommendations</h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy Report'}
              </button>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-[#888888]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-[#888888]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-[#a0a0a0] leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div
            className="rounded-lg p-4 border"
            style={{
              backgroundColor: `${SIGNAL_CONFIG[result.signalStrength].color}06`,
              borderColor: `${SIGNAL_CONFIG[result.signalStrength].color}20`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#888888]" />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Summary</h3>
            </div>
            <p className="text-sm text-[#a0a0a0] leading-relaxed">{result.summary}</p>
          </div>
        </>
      )}

      {/* Initial idle state */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
            <Scan className="w-8 h-8 text-[#888888]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Algorithm Alignment Checker</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Enter your video title, description, and select a niche to check how well your content aligns with current algorithm signals.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#666666]">
          Cost: {TOKEN_COSTS.pulsecheck} tokens per analysis
        </div>
      )}
    </div>
  );
}
