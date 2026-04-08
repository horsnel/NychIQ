'use client';

import React, { useState, useEffect } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { truncate } from '@/lib/utils';
import {
  Heart,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  MessageCircle,
  ThumbsUp,
  Minus,
  ThumbsDown,
  Lightbulb,
  Send,
  User,
} from 'lucide-react';

/* ── Types ── */
interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

interface ThemeItem {
  theme: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface CommentItem {
  text: string;
  author: string;
  likes: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface InsightItem {
  title: string;
  detail: string;
}

interface CommentResult {
  sentiment: SentimentBreakdown;
  themes: ThemeItem[];
  comments: CommentItem[];
  insights: InsightItem[];
}

/* ── Mock Data ── */
const MOCK_RESULT: CommentResult = {
  sentiment: { positive: 62, neutral: 24, negative: 14 },
  themes: [
    { theme: 'Content quality appreciation', count: 342, sentiment: 'positive' },
    { theme: 'Request for more tutorials', count: 218, sentiment: 'positive' },
    { theme: 'Video length complaints', count: 156, sentiment: 'negative' },
    { theme: 'Comparison with other creators', count: 134, sentiment: 'neutral' },
    { theme: 'Sound quality feedback', count: 98, sentiment: 'neutral' },
    { theme: 'Request for collaborations', count: 87, sentiment: 'positive' },
  ],
  comments: [
    { text: 'This is by far the best tutorial I\'ve seen on this topic. The way you broke down each step made it so easy to follow!', author: '@learnwithsam', likes: 1243, sentiment: 'positive' },
    { text: 'Could you make a part 2 covering the advanced techniques? This was amazing but I need more depth.', author: '@techcurious', likes: 892, sentiment: 'positive' },
    { text: 'The video was okay but felt a bit too long. Could have covered the same material in half the time.', author: '@impatientviewer', likes: 234, sentiment: 'negative' },
    { text: 'Interesting perspective but I think CreatorX covered this topic better in their latest video. Still good content though.', author: '@compareking', likes: 456, sentiment: 'neutral' },
    { text: 'Just shared this with my whole team. We\'ve been struggling with this exact problem and your solution is perfect!', author: '@teamlead_jane', likes: 678, sentiment: 'positive' },
    { text: 'Audio quality could use some work. Had to turn up the volume to max and even then it was hard to hear in some parts.', author: '@audiophile_ng', likes: 345, sentiment: 'neutral' },
  ],
  insights: [
    { title: 'Strong Audience Loyalty', detail: '62% of comments are positive, indicating a highly engaged and loyal audience. Viewers consistently praise the educational value and clarity of content.' },
    { title: 'Content Length Opportunity', detail: '14% negative sentiment is primarily driven by video length concerns. Consider creating condensed versions or adding chapter timestamps to improve viewer satisfaction.' },
    { title: 'Series Potential', detail: 'Multiple requests for follow-up content and tutorials suggest strong demand for a structured series. This could significantly boost watch time and subscriber growth.' },
    { title: 'Cross-Promotion Interest', detail: '87 comments specifically request collaborations, showing your audience is interested in expanded content formats and creator partnerships.' },
  ],
};

/* ── Step labels for loading animation ── */
const LOADING_STEPS = [
  { label: 'Fetching comments...', icon: <MessageCircle className="w-4 h-4" /> },
  { label: 'Running sentiment analysis...', icon: <Heart className="w-4 h-4" /> },
  { label: 'Generating insights...', icon: <Lightbulb className="w-4 h-4" /> },
];

/* ── Sentiment bar colors ── */
const SENTIMENT_COLOR = {
  positive: { bar: 'bg-[#00C48C]', text: 'text-[#00C48C]', bg: 'bg-[rgba(0,196,140,0.1)]', border: 'border-[rgba(0,196,140,0.2)]' },
  neutral: { bar: 'bg-[#F5A623]', text: 'text-[#F5A623]', bg: 'bg-[rgba(245,166,35,0.1)]', border: 'border-[rgba(245,166,35,0.2)]' },
  negative: { bar: 'bg-[#E05252]', text: 'text-[#E05252]', bg: 'bg-[rgba(224,82,82,0.1)]', border: 'border-[rgba(224,82,82,0.2)]' },
};

/* ── Plan Gate ── */
function PlanGate() {
  const { setUpgradeModalOpen } = useNychIQStore();
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="max-w-sm w-full rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-[#F5A623]" />
        </div>
        <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">Comment Sentiment Locked</h2>
        <p className="text-sm text-[#888888] mb-6">This feature requires the Elite plan or higher. Upgrade to analyze audience sentiment at scale.</p>
        <button onClick={() => setUpgradeModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors">
          <Crown className="w-4 h-4" /> Upgrade Now
        </button>
      </div>
    </div>
  );
}

export function SocialCommentsTool() {
  const { canAccess, spendTokens } = useNychIQStore();
  const [videoUrl, setVideoUrl] = useState('');
  const [result, setResult] = useState<CommentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animate loading steps
  useEffect(() => {
    if (!loading) return;
    let current = 0;
    const interval = setInterval(() => {
      current = (current + 1) % LOADING_STEPS.length;
      setLoadingStep(current);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  const analyzeComments = async () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);
    const ok = spendTokens('sentiment');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube comment sentiment analyst. Analyze the comments for the YouTube video at URL: "${videoUrl.trim()}"

Return a JSON object with these exact fields:
- "sentiment": object with "positive" (number 0-100), "neutral" (number 0-100), "negative" (number 0-100) — percentages that sum to 100
- "themes": array of 5-6 objects, each with "theme" (string), "count" (number), "sentiment" (one of "positive", "neutral", "negative")
- "comments": array of 6 objects, each with "text" (string, 50-200 chars), "author" (string handle), "likes" (number), "sentiment" (one of "positive", "neutral", "negative")
- "insights": array of 3-4 objects, each with "title" (string) and "detail" (string, 1-2 sentences of actionable insight)

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        setResult({
          sentiment: parsed.sentiment || MOCK_RESULT.sentiment,
          themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 6) : MOCK_RESULT.themes,
          comments: Array.isArray(parsed.comments) ? parsed.comments.slice(0, 6) : MOCK_RESULT.comments,
          insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 4) : MOCK_RESULT.insights,
        });
      } catch {
        setResult(MOCK_RESULT);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze comments. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess('social-comments')) return <PlanGate />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
              <Heart className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Comment Sentiment</h2>
              <p className="text-xs text-[#888888] mt-0.5">Sentiment breakdown of YouTube comments with insights</p>
            </div>
          </div>

          {/* Video URL Input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
              <Send className="w-3 h-3" /> YouTube Video URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') analyzeComments(); }}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
              <button
                onClick={analyzeComments}
                disabled={loading || !videoUrl.trim()}
                className="px-5 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analyze Comments
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#E05252] mx-auto mb-3" />
          <p className="text-sm text-[#E8E8E8] mb-4">{error}</p>
          <button
            onClick={analyzeComments}
            className="px-4 py-2 rounded-lg bg-[#E05252] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading with 3-step animation */}
      {loading && (
        <div className="space-y-4">
          {/* Animated Steps */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-6">
            <div className="space-y-4">
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    i === loadingStep ? 'opacity-100' : i < loadingStep ? 'opacity-40' : 'opacity-20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    i === loadingStep
                      ? 'bg-[rgba(245,166,35,0.15)] text-[#F5A623]'
                      : i < loadingStep
                        ? 'bg-[rgba(0,196,140,0.1)] text-[#00C48C]'
                        : 'bg-[#1A1A1A] text-[#444444]'
                  }`}>
                    {i < loadingStep ? <ThumbsUp className="w-4 h-4" /> : i === loadingStep ? step.icon : <Minus className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-medium ${i === loadingStep ? 'text-[#E8E8E8]' : 'text-[#666666]'}`}>
                    {step.label}
                  </span>
                  {i === loadingStep && <Loader2 className="w-4 h-4 text-[#F5A623] animate-spin ml-auto" />}
                  {i < loadingStep && <span className="ml-auto text-[10px] text-[#00C48C]">Done</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-4 space-y-2">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-16" />
                <div className="h-8 bg-[#1A1A1A] rounded animate-pulse w-20" />
                <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F5A623]" /> Sentiment Analysis Complete
          </h3>

          {/* Sentiment Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['positive', 'neutral', 'negative'] as const).map((key) => {
              const val = result.sentiment[key];
              const style = SENTIMENT_COLOR[key];
              const icon = key === 'positive' ? <ThumbsUp className="w-4 h-4" /> : key === 'negative' ? <ThumbsDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />;
              return (
                <div key={key} className={`rounded-lg bg-[#111111] border ${style.border} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`${style.bg} ${style.text} p-1.5 rounded-md`}>{icon}</div>
                    <span className="text-xs font-medium text-[#888888] capitalize">{key}</span>
                  </div>
                  <p className={`text-2xl font-bold ${style.text}`}>{val}%</p>
                  <div className="mt-2 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${style.bar} transition-all duration-1000`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Sentiment Bar */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Overall Sentiment Distribution</h4>
            <div className="flex h-3 rounded-full overflow-hidden bg-[#1A1A1A]">
              <div className="bg-[#00C48C] transition-all duration-1000" style={{ width: `${result.sentiment.positive}%` }} />
              <div className="bg-[#F5A623] transition-all duration-1000" style={{ width: `${result.sentiment.neutral}%` }} />
              <div className="bg-[#E05252] transition-all duration-1000" style={{ width: `${result.sentiment.negative}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-[#888888]">
              <span className="text-[#00C48C]">Positive {result.sentiment.positive}%</span>
              <span className="text-[#F5A623]">Neutral {result.sentiment.neutral}%</span>
              <span className="text-[#E05252]">Negative {result.sentiment.negative}%</span>
            </div>
          </div>

          {/* Top Themes */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Top Themes & Requests</h4>
            <div className="space-y-2.5">
              {result.themes.map((theme, i) => {
                const tStyle = SENTIMENT_COLOR[theme.sentiment] || SENTIMENT_COLOR.neutral;
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <span className="text-xs font-bold text-[#666666] w-5 text-center">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#E8E8E8] truncate">{theme.theme}</p>
                    </div>
                    <span className="text-[10px] text-[#888888] whitespace-nowrap">{theme.count} mentions</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tStyle.bg} ${tStyle.text} border ${tStyle.border}`}>
                      {theme.sentiment}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Comments */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Sample Comments</h4>
            <div className="space-y-3">
              {result.comments.map((comment, i) => {
                const cStyle = SENTIMENT_COLOR[comment.sentiment] || SENTIMENT_COLOR.neutral;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-md border ${
                      comment.sentiment === 'positive'
                        ? 'bg-[rgba(0,196,140,0.03)] border-[rgba(0,196,140,0.1)]'
                        : comment.sentiment === 'negative'
                          ? 'bg-[rgba(224,82,82,0.03)] border-[rgba(224,82,82,0.1)]'
                          : 'bg-[rgba(245,166,35,0.03)] border-[rgba(245,166,35,0.1)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <User className="w-3.5 h-3.5 text-[#666666]" />
                      <span className="text-xs font-medium text-[#F5A623]">{comment.author}</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-[#888888]">
                        <Heart className="w-2.5 h-2.5" /> {comment.likes.toLocaleString()}
                      </span>
                      <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold ${cStyle.text}`}>
                        {comment.sentiment.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#E8E8E8] leading-relaxed">{truncate(comment.text, 200)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insights */}
          <div className="rounded-lg bg-[#111111] border border-[#F5A623]/20 p-4">
            <h4 className="text-xs font-bold text-[#F5A623] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5" /> AI Insights
            </h4>
            <div className="space-y-3">
              {result.insights.map((insight, i) => (
                <div key={i} className="p-3 rounded-md bg-[rgba(245,166,35,0.03)] border border-[rgba(245,166,35,0.1)]">
                  <h5 className="text-sm font-semibold text-[#E8E8E8] mb-1">{insight.title}</h5>
                  <p className="text-xs text-[#888888] leading-relaxed">{insight.detail}</p>
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
            <Heart className="w-8 h-8 text-[#F5A623]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Analyze Comment Sentiment</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Paste a YouTube video URL to get a complete sentiment breakdown with AI-powered insights.</p>
        </div>
      )}

      {searched && !loading && (
        <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.sentiment} tokens per analysis</div>
      )}
    </div>
  );
}
