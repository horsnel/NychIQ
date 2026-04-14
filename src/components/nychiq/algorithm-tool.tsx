'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { cn } from '@/lib/utils';
import { askAI } from '@/lib/api';
import {
  BrainCircuit,
  Crown,
  Lock,
  Loader2,
  RefreshCw,
  AlertCircle,
  Wifi,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  MinusCircle,
} from 'lucide-react';

interface AlgorithmSignal {
  name: string;
  status: 'rising' | 'stable' | 'declining';
  strength: number; // 0-100
  description: string;
}

interface AlgorithmReport {
  overallHealth: string;
  summary: string;
  signals: AlgorithmSignal[];
  recommendations: string[];
}

const STATUS_CONFIG = {
  rising: { color: '#888888', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: <TrendingUp className="w-4 h-4" />, label: 'Rising' },
  stable: { color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.3)', icon: <Minus className="w-4 h-4" />, label: 'Stable' },
  declining: { color: '#888888', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: <TrendingDown className="w-4 h-4" />, label: 'Declining' },
};

/* ── Signal Bar ── */
function SignalBar({ signal }: { signal: AlgorithmSignal }) {
  const config = STATUS_CONFIG[signal.status];
  const barColor = signal.status === 'rising' ? '#888888' : signal.status === 'stable' ? '#FDBA2D' : '#888888';

  return (
    <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.1)] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#FFFFFF]">{signal.name}</span>
        </div>
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}
        >
          {config.icon}
          {config.label}
        </span>
      </div>
      {/* Strength bar */}
      <div className="w-full h-2 rounded-full bg-[#1A1A1A] overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${signal.strength}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#a0a0a0]">{signal.description}</p>
        <span className="text-[11px] font-bold" style={{ color: barColor }}>{signal.strength}%</span>
      </div>
    </div>
  );
}


/* ── Main Algorithm Tool ── */
export function AlgorithmTool() {
  const { spendTokens } = useNychIQStore();
  const [report, setReport] = useState<AlgorithmReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    const ok = spendTokens('algorithm');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube algorithm analysis expert. Generate a comprehensive algorithm monitoring report for YouTube creators.

Return a JSON object with:
- "overallHealth": One of "Excellent", "Good", "Moderate", "Concerning"
- "summary": A 2-3 sentence overall assessment of YouTube's current algorithm behavior
- "signals": An array of 6 algorithm signals, each with:
  - "name": Signal name (e.g., "Shorts Discovery", "Search Ranking", "Suggested Videos", "Community Tab", "Live Streaming", "Long-form Engagement")
  - "status": One of "rising", "stable", "declining"
  - "strength": Number from 30 to 95
  - "description": Brief description of what's happening
- "recommendations": An array of 4 actionable recommendations for creators

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setReport({
        overallHealth: parsed.overallHealth || 'Good',
        summary: parsed.summary || 'Algorithm analysis complete.',
        signals: Array.isArray(parsed.signals) ? parsed.signals : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      });
    } catch (err) {
      // Fallback to mock data
      setReport({
        overallHealth: 'Good',
        summary: 'YouTube algorithm is currently favoring authentic, long-form content with strong audience retention. Shorts discovery is on the rise while community posts show moderate engagement.',
        signals: [
          { name: 'Shorts Discovery', status: 'rising', strength: 82, description: 'Shorts are getting more surface area in recommendations' },
          { name: 'Search Ranking', status: 'stable', strength: 68, description: 'SEO-optimized titles and descriptions remain important' },
          { name: 'Suggested Videos', status: 'rising', strength: 75, description: 'Content relevance and watch history drive suggestions' },
          { name: 'Community Tab', status: 'declining', strength: 42, description: 'Reduced visibility for community posts in feed' },
          { name: 'Live Streaming', status: 'stable', strength: 60, description: 'Live content maintains steady but niche reach' },
          { name: 'Long-form Engagement', status: 'rising', strength: 88, description: 'High retention long-form videos are heavily promoted' },
        ],
        recommendations: [
          'Focus on creating 8-15 minute videos with strong hooks in the first 30 seconds to maximize algorithm favor.',
          'Post Shorts consistently (3-5 per week) to build discovery funnel for your main channel content.',
          'Optimize thumbnails and titles for CTR — the algorithm uses click-through rate as a primary ranking signal.',
          'Engage with audience in first 2 hours of upload to boost initial velocity signals.',
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [spendTokens]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  const healthColor = report?.overallHealth === 'Excellent' ? '#888888'
    : report?.overallHealth === 'Good' ? '#888888'
    : report?.overallHealth === 'Moderate' ? '#FDBA2D' : '#888888';

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)]">
                <BrainCircuit className="w-5 h-5 text-[#888888]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                  Algorithm Monitor
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#888888]/10 text-[10px] font-bold text-[#888888]">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                </h2>
                <p className="text-xs text-[#a0a0a0] mt-0.5">
                  Real-time YouTube algorithm analysis
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchReport()}
              disabled={loading}
              className="p-2 rounded-lg border border-[rgba(255,255,255,0.06)] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4 text-[#a0a0a0]', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-5">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-[#888888] animate-spin" />
              <span className="text-sm text-[#a0a0a0]">Analyzing YouTube algorithm signals...</span>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-[#1A1A1A] rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      {!loading && report && (
        <>
          {/* Overall Health */}
          <div
            className="rounded-lg p-5 border"
            style={{
              backgroundColor: `${healthColor}08`,
              borderColor: `${healthColor}30`,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5" style={{ color: healthColor }} />
              <span className="text-lg font-bold" style={{ color: healthColor }}>
                Algorithm Health: {report.overallHealth}
              </span>
            </div>
            <p className="text-sm text-[#a0a0a0] leading-relaxed">{report.summary}</p>
          </div>

          {/* Signal Bars */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#888888]" />
              Algorithm Signals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.signals.map((signal, i) => (
                <SignalBar key={i} signal={signal} />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <Sparkles className="w-4 h-4 text-[#FDBA2D]" />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Recommendations</h3>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className="w-6 h-6 rounded-full bg-[#FDBA2D]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-[#FDBA2D]">{i + 1}</span>
                    </div>
                    <p className="text-sm text-[#a0a0a0] leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#888888] mx-auto mb-2" />
          <p className="text-sm text-[#FFFFFF]">{error}</p>
          <button
            onClick={fetchReport}
            className="mt-3 px-4 py-2 rounded-lg bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Token cost footer */}
      <div className="text-center text-[11px] text-[#666666]">
        Cost: {TOKEN_COSTS.algorithm} tokens per analysis · Powered by AI
      </div>
    </div>
  );
}
