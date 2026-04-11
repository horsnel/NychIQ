'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Activity,
  AlertTriangle,
  Sparkles,
  Target,
  Clock,
  TrendingDown,
  BarChart3,
  Upload,
  ChevronDown,
  Zap,
} from 'lucide-react';

interface RetentionDataPoint {
  second: number;
  retention: number;
  label?: string;
  isDropOff?: boolean;
}

interface DropOffSuggestion {
  time: string;
  retention: number;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

const MOCK_RETENTION: RetentionDataPoint[] = [
  { second: 0, retention: 100, label: '0:00' },
  { second: 3, retention: 95 },
  { second: 6, retention: 88 },
  { second: 9, retention: 78, isDropOff: true, label: '0:09' },
  { second: 12, retention: 70 },
  { second: 15, retention: 65 },
  { second: 18, retention: 60 },
  { second: 21, retention: 55 },
  { second: 24, retention: 50, isDropOff: true, label: '0:24' },
  { second: 27, retention: 46 },
  { second: 30, retention: 44 },
  { second: 33, retention: 42 },
  { second: 36, retention: 40 },
  { second: 39, retention: 38 },
  { second: 42, retention: 35, isDropOff: true, label: '0:42' },
  { second: 45, retention: 33 },
  { second: 48, retention: 31 },
  { second: 51, retention: 29 },
  { second: 54, retention: 28, isDropOff: true, label: '0:54' },
  { second: 57, retention: 27 },
  { second: 60, retention: 26 },
  { second: 63, retention: 25 },
  { second: 66, retention: 24 },
  { second: 69, retention: 23 },
  { second: 72, retention: 22, isDropOff: true, label: '1:12' },
  { second: 75, retention: 21 },
  { second: 78, retention: 20 },
  { second: 81, retention: 19 },
  { second: 84, retention: 18 },
  { second: 87, retention: 17 },
  { second: 90, retention: 16, label: '1:30' },
];

const MOCK_BENCHMARK: RetentionDataPoint[] = [
  { second: 0, retention: 100 },
  { second: 10, retention: 60 },
  { second: 20, retention: 48 },
  { second: 30, retention: 40 },
  { second: 40, retention: 34 },
  { second: 50, retention: 30 },
  { second: 60, retention: 27 },
  { second: 70, retention: 24 },
  { second: 80, retention: 22 },
  { second: 90, retention: 20 },
];

const MOCK_SUGGESTIONS: DropOffSuggestion[] = [
  { time: '0:09', retention: 78, severity: 'high', suggestion: 'Hook lost viewers — your intro dragged too long. Cut the first 5 seconds and start with the payoff.' },
  { time: '0:24', retention: 50, severity: 'high', suggestion: '50% audience lost at the quarter mark. Add a tease or visual change here to re-engage.' },
  { time: '0:42', retention: 35, severity: 'medium', suggestion: 'Mid-video dip detected. Consider inserting a pattern break, B-roll, or question to viewers.' },
  { time: '0:54', retention: 28, severity: 'medium', suggestion: 'Pacing slowed down. This section has lower energy — speed up edits or add graphics.' },
  { time: '1:12', retention: 22, severity: 'low', suggestion: 'Standard late-video drop-off. Use this moment to tease the end screen or next video.' },
];

const MOCK_VIDEOS = [
  { id: '1', title: 'How to Edit Like a Pro in 2025', duration: '12:34', views: '245K' },
  { id: '2', title: 'My SECRET Editing Workflow', duration: '8:21', views: '189K' },
  { id: '3', title: '10 Tips for Better Thumbnails', duration: '15:07', views: '312K' },
  { id: '4', title: 'YouTube Algorithm Explained', duration: '10:45', views: '567K' },
];

function RetentionGraph({ data, benchmark, width = 700, height = 250 }: { data: RetentionDataPoint[]; benchmark: RetentionDataPoint[]; width?: number; height?: number }) {
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxSec = data[data.length - 1].second;
  const xScale = (s: number) => padding.left + (s / maxSec) * chartW;
  const yScale = (r: number) => padding.top + chartH - (r / 100) * chartH;

  const retentionPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.second)},${yScale(d.retention)}`).join(' ');
  const areaPath = retentionPath + ` L${xScale(data[data.length - 1].second)},${yScale(0)} L${xScale(0)},${yScale(0)} Z`;
  const benchmarkPath = benchmark.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.second)},${yScale(d.retention)}`).join(' ');

  const avgRetention = Math.round(data.reduce((s, d) => s + d.retention, 0) / data.length);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid Lines */}
      {[0, 25, 50, 75, 100].map((pct) => (
        <React.Fragment key={pct}>
          <line x1={padding.left} y1={yScale(pct)} x2={width - padding.right} y2={yScale(pct)} stroke="#1A1A1A" strokeWidth="1" />
          <text x={padding.left - 8} y={yScale(pct) + 4} textAnchor="end" fill="#555555" fontSize="10">{pct}%</text>
        </React.Fragment>
      ))}

      {/* Time Labels */}
      {[0, 15, 30, 45, 60, 75, 90].map((sec) => (
        <text key={sec} x={xScale(sec)} y={height - 8} textAnchor="middle" fill="#555555" fontSize="10">
          {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
        </text>
      ))}

      {/* Benchmark Line */}
      <path d={benchmarkPath} fill="none" stroke="#4A9EFF" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
      <text x={xScale(maxSec) - 5} y={yScale(20) - 6} textAnchor="end" fill="#4A9EFF" fontSize="9" opacity="0.7">Industry Avg</text>

      {/* Area Fill */}
      <defs>
        <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9B72CF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#9B72CF" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#retentionGrad)" />

      {/* Retention Curve */}
      <path d={retentionPath} fill="none" stroke="#9B72CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Drop-off Points */}
      {data.filter((d) => d.isDropOff).map((d, i) => (
        <g key={i}>
          <circle cx={xScale(d.second)} cy={yScale(d.retention)} r="5" fill="#E05252" stroke="#111111" strokeWidth="2" />
          <circle cx={xScale(d.second)} cy={yScale(d.retention)} r="8" fill="#E05252" opacity="0.2" />
        </g>
      ))}

      {/* Average Line */}
      <line x1={padding.left} y1={yScale(avgRetention)} x2={width - padding.right} y2={yScale(avgRetention)} stroke="#F5A623" strokeWidth="1" strokeDasharray="6 3" opacity="0.6" />
      <text x={padding.left + 4} y={yScale(avgRetention) - 5} fill="#F5A623" fontSize="9" opacity="0.8">Avg: {avgRetention}%</text>

      {/* Start/End Labels */}
      <circle cx={xScale(0)} cy={yScale(100)} r="3" fill="#00C48C" />
      <text x={xScale(0) + 8} y={yScale(100) + 3} fill="#00C48C" fontSize="9">100%</text>
    </svg>
  );
}

function severityColor(sev: 'high' | 'medium' | 'low') {
  if (sev === 'high') return { bg: 'bg-[#E05252]/10', border: 'border-[#E05252]/20', text: 'text-[#E05252]', dot: 'bg-[#E05252]' };
  if (sev === 'medium') return { bg: 'bg-[#F5A623]/10', border: 'border-[#F5A623]/20', text: 'text-[#F5A623]', dot: 'bg-[#F5A623]' };
  return { bg: 'bg-[#4A9EFF]/10', border: 'border-[#4A9EFF]/20', text: 'text-[#4A9EFF]', dot: 'bg-[#4A9EFF]' };
}

export function RetentionCurveTool() {
  const { spendTokens } = useNychIQStore();
  const [selectedVideo, setSelectedVideo] = useState(MOCK_VIDEOS[0]);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setAnalyzing(true);
    spendTokens('retention-curve');
    setTimeout(() => setAnalyzing(false), 1500);
  };

  const avgRetention = Math.round(MOCK_RETENTION.reduce((s, d) => s + d.retention, 0) / MOCK_RETENTION.length);
  const benchmarkAvg = 32;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
              <Activity className="w-5 h-5 text-[#4A9EFF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Retention Curve</h2>
              <p className="text-xs text-[#888888] mt-0.5">Analyze audience retention & optimize drop-off points</p>
            </div>
          </div>

          {/* Video Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <select
                value={selectedVideo.id}
                onChange={(e) => setSelectedVideo(MOCK_VIDEOS.find((v) => v.id === e.target.value) || MOCK_VIDEOS[0])}
                className="w-full appearance-none bg-[#0A0A0A] border border-[#222222] rounded-lg px-3 py-2.5 pr-8 text-sm text-[#E8E8E8] focus:outline-none focus:border-[#4A9EFF]/50 transition-colors"
              >
                {MOCK_VIDEOS.map((v) => (
                  <option key={v.id} value={v.id}>{v.title} ({v.duration})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none" />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#4A9EFF] text-white text-sm font-bold hover:bg-[#3A8EEF] transition-colors disabled:opacity-50 shrink-0"
            >
              <BarChart3 className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Analyze Retention'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
          <p className="text-[11px] text-[#666666] uppercase tracking-wider">Avg Retention</p>
          <p className={`text-xl font-bold mt-1 ${avgRetention >= benchmarkAvg ? 'text-[#00C48C]' : 'text-[#E05252]'}`}>{avgRetention}%</p>
        </div>
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
          <p className="text-[11px] text-[#666666] uppercase tracking-wider">Industry Avg</p>
          <p className="text-xl font-bold text-[#4A9EFF] mt-1">{benchmarkAvg}%</p>
        </div>
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
          <p className="text-[11px] text-[#666666] uppercase tracking-wider">vs Benchmark</p>
          <p className={`text-xl font-bold mt-1 ${avgRetention >= benchmarkAvg ? 'text-[#00C48C]' : 'text-[#E05252]'}`}>
            {avgRetention >= benchmarkAvg ? '+' : ''}{avgRetention - benchmarkAvg}%
          </p>
        </div>
      </div>

      {/* Retention Graph */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#9B72CF]" />
            <span className="text-sm font-semibold text-[#E8E8E8]">{selectedVideo.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-[#9B72CF]"><span className="w-2.5 h-0.5 bg-[#9B72CF] rounded-full inline-block" />Your Retention</span>
            <span className="flex items-center gap-1 text-[11px] text-[#4A9EFF]"><span className="w-2.5 h-0.5 bg-[#4A9EFF] rounded-full inline-block opacity-50" style={{ borderTop: '1px dashed #4A9EFF' }} />Industry</span>
            <span className="flex items-center gap-1 text-[11px] text-[#E05252]"><span className="w-2 h-2 bg-[#E05252] rounded-full inline-block" />Drop-off</span>
          </div>
        </div>
        <div className="p-4">
          <RetentionGraph data={MOCK_RETENTION} benchmark={MOCK_BENCHMARK} />
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F5A623]" />
          <span className="text-sm font-semibold text-[#E8E8E8]">AI Suggestions for Drop-off Points</span>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {MOCK_SUGGESTIONS.map((sug, i) => {
            const colors = severityColor(sug.severity);
            return (
              <div key={i} className={`p-4 ${colors.bg} border-l-2 ${colors.border}`}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="text-sm font-bold text-[#E8E8E8] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#888888]" />
                      {sug.time}
                    </span>
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      {sug.retention}% — {sug.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#AAAAAA] mt-2 ml-5 leading-relaxed">{sug.suggestion}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-[11px] text-[#444444]">
        Analysis based on last 30 days of data · Red dots indicate significant audience drop-off
      </div>
    </div>
  );
}
