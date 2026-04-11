'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Image as ImageIcon,
  Type,
  Loader2,
  Upload,
  Sparkles,
  TrendingUp,
  Target,
  Eye,
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

interface AnalysisResult {
  ctrScore: number;
  emotionalImpact: number;
  clarity: number;
  curiosityGap: number;
  overallGrade: string;
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
}

const MOCK_RESULTS: Record<string, AnalysisResult> = {
  default: {
    ctrScore: 72,
    emotionalImpact: 65,
    clarity: 88,
    curiosityGap: 54,
    overallGrade: 'B',
    suggestions: [
      'Add a power word like "Secret" or "Proven" to boost emotional impact by ~15%',
      'Include a specific number or statistic to increase credibility',
      'Shorten the title to 8-10 words for better mobile visibility',
      'Add brackets like [2025] or (Step-by-Step) to increase CTR by 33%',
      'Use a contrasting color for your face/emotion in the thumbnail',
    ],
    strengths: ['Clear messaging', 'Good keyword usage', 'Readable font choice'],
    weaknesses: ['Low curiosity gap', 'No emotional trigger words', 'Thumbnail lacks contrast'],
  },
};

function ScoreBar({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-1.5 rounded-md shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#E8E8E8]">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{value}/100</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    A: { color: '#00C48C', bg: 'rgba(0,196,140,0.15)' },
    B: { color: '#4A9EFF', bg: 'rgba(74,158,255,0.15)' },
    C: { color: '#F5A623', bg: 'rgba(245,166,35,0.15)' },
    D: { color: '#E05252', bg: 'rgba(224,82,82,0.15)' },
    F: { color: '#E05252', bg: 'rgba(224,82,82,0.15)' },
  };
  const c = config[grade] || config.C;
  return (
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: `${c.color}30` }}
    >
      {grade}
    </div>
  );
}

export function ThumbnailTitleAnalyzerTool() {
  const { spendTokens } = useNychIQStore();
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
    setThumbnail('uploaded');
  };

  const handleAnalyze = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setAnalyzed(true);
    const ok = spendTokens('thumbnail-title-analyzer');
    if (!ok) { setLoading(false); return; }
    await new Promise((r) => setTimeout(r, 2000));
    setResults(MOCK_RESULTS.default);
    setLoading(false);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
              <ImageIcon className="w-5 h-5 text-[#4A9EFF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Thumbnail & Title Analyzer</h2>
              <p className="text-xs text-[#888888] mt-0.5">AI-powered CTR prediction and optimization for your video packaging.</p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[#666666] mb-2 block">Thumbnail Preview</label>
            <button
              onClick={handleUpload}
              className="w-full h-40 rounded-lg bg-[#0D0D0D] border-2 border-dashed border-[#222222] hover:border-[#4A9EFF]/40 transition-colors flex flex-col items-center justify-center gap-2 group"
            >
              {uploaded ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-[#00C48C]" />
                  <span className="text-xs text-[#00C48C]">Thumbnail uploaded</span>
                  <span className="text-[10px] text-[#555555]">Click to replace</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#555555] group-hover:text-[#4A9EFF] transition-colors" />
                  <span className="text-xs text-[#888888] group-hover:text-[#E8E8E8] transition-colors">Click to upload thumbnail</span>
                  <span className="text-[10px] text-[#555555]">1280 x 720 recommended</span>
                </>
              )}
            </button>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-medium text-[#666666] mb-2 block">Video Title</label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
                placeholder="Enter your video title..."
                maxLength={100}
                className="w-full h-11 pl-10 pr-16 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#4A9EFF]/50 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#555555]">
                {title.length}/100
              </span>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !title.trim()}
            className="w-full sm:w-auto mt-4 px-5 h-11 rounded-lg bg-[#4A9EFF] text-[#0A0A0A] text-sm font-bold hover:bg-[#3A8EEF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Analyze Title & Thumbnail
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-xl bg-[rgba(74,158,255,0.1)] flex items-center justify-center mb-4 animate-pulse">
              <Sparkles className="w-6 h-6 text-[#4A9EFF]" />
            </div>
            <p className="text-sm text-[#888888]">Analyzing your title & thumbnail...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4">
          {/* Grade + Scores */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Score Breakdown</h4>
              <GradeBadge grade={results.overallGrade} />
            </div>
            <div className="space-y-4">
              <ScoreBar label="CTR Score" value={results.ctrScore} color="#4A9EFF" icon={TrendingUp} />
              <ScoreBar label="Emotional Impact" value={results.emotionalImpact} color="#F5A623" icon={Target} />
              <ScoreBar label="Clarity" value={results.clarity} color="#00C48C" icon={Eye} />
              <ScoreBar label="Curiosity Gap" value={results.curiosityGap} color="#9B72CF" icon={Lightbulb} />
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
                <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Strengths</h4>
              </div>
              <div className="space-y-2">
                {results.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#00C48C] mt-1.5 shrink-0" />
                    <span className="text-xs text-[#E8E8E8]">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-[#E05252]" />
                <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Weaknesses</h4>
              </div>
              <div className="space-y-2">
                {results.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#E05252] mt-1.5 shrink-0" />
                    <span className="text-xs text-[#E8E8E8]">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-md bg-[rgba(155,114,207,0.1)]">
                <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
              </div>
              <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">AI Suggestions</h4>
            </div>
            <div className="space-y-2.5">
              {results.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <span className="text-[10px] font-bold text-[#9B72CF] bg-[rgba(155,114,207,0.1)] px-1.5 py-0.5 rounded shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-[#E8E8E8] leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Benchmark */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-[#F5A623]" />
              <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Industry Benchmark</h4>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: 'Your Title', value: results.ctrScore, color: '#4A9EFF' },
                { label: 'Avg Creator', value: 58, color: '#888888' },
                { label: 'Top 10%', value: 89, color: '#00C48C' },
              ].map((item, i) => (
                <div key={i} className="flex-1 text-center">
                  <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-[10px] text-[#888888] uppercase tracking-wider mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !analyzed && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(74,158,255,0.1)] border border-[rgba(74,158,255,0.2)] flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 text-[#4A9EFF]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Analyze Your Packaging</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Upload a thumbnail and enter your title to get an AI-powered CTR analysis with actionable suggestions.</p>
        </div>
      )}
    </div>
  );
}
