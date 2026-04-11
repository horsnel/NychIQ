'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Key,
  BarChart3,
  Target,
  Zap,
  ArrowRight,
  Search,
  RefreshCw,
  Loader2,
  Check,
  Copy,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface GapKeyword {
  keyword: string;
  yourPosition: number | null;
  competitorPosition: number;
  searchVolume: string;
  competition: 'Low' | 'Medium' | 'High';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  opportunityScore: number;
  trend: 'up' | 'down' | 'stable';
}

const MOCK_DATA: GapKeyword[] = [
  { keyword: 'best video editing software 2025', yourPosition: null, competitorPosition: 1, searchVolume: '22.4K', competition: 'High', difficulty: 'Hard', opportunityScore: 92, trend: 'up' },
  { keyword: 'how to grow youtube channel fast', yourPosition: null, competitorPosition: 2, searchVolume: '18.1K', competition: 'Medium', difficulty: 'Medium', opportunityScore: 87, trend: 'up' },
  { keyword: 'faceless youtube channel ideas', yourPosition: null, competitorPosition: 3, searchVolume: '14.7K', competition: 'Low', difficulty: 'Easy', opportunityScore: 95, trend: 'stable' },
  { keyword: 'youtube shorts algorithm secrets', yourPosition: null, competitorPosition: 1, searchVolume: '11.2K', competition: 'Medium', difficulty: 'Medium', opportunityScore: 78, trend: 'up' },
  { keyword: 'youtube automation tutorial beginners', yourPosition: null, competitorPosition: 4, searchVolume: '9.8K', competition: 'Low', difficulty: 'Easy', opportunityScore: 91, trend: 'stable' },
  { keyword: 'thumbnail design tips that get clicks', yourPosition: null, competitorPosition: 2, searchVolume: '8.3K', competition: 'Low', difficulty: 'Easy', opportunityScore: 88, trend: 'down' },
  { keyword: 'youtube niche selection guide', yourPosition: null, competitorPosition: 5, searchVolume: '7.6K', competition: 'Low', difficulty: 'Easy', opportunityScore: 84, trend: 'up' },
  { keyword: 'make money on youtube without filming', yourPosition: null, competitorPosition: 3, searchVolume: '6.9K', competition: 'Medium', difficulty: 'Medium', opportunityScore: 76, trend: 'stable' },
  { keyword: 'youtube tags seo optimization 2025', yourPosition: null, competitorPosition: 2, searchVolume: '5.4K', competition: 'Low', difficulty: 'Easy', opportunityScore: 93, trend: 'up' },
  { keyword: 'how to get monetized fast', yourPosition: null, competitorPosition: 6, searchVolume: '4.1K', competition: 'Medium', difficulty: 'Medium', opportunityScore: 72, trend: 'down' },
];

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = {
    Easy: { color: '#00C48C', bg: 'rgba(0,196,140,0.1)', border: 'rgba(0,196,140,0.2)' },
    Medium: { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' },
    Hard: { color: '#E05252', bg: 'rgba(224,82,82,0.1)', border: 'rgba(224,82,82,0.2)' },
  }[difficulty] || { color: '#888', bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.2)' };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}
    >
      {difficulty}
    </span>
  );
}

function CompetitionBar({ level }: { level: string }) {
  const width = level === 'Low' ? 30 : level === 'Medium' ? 60 : 90;
  const color = level === 'Low' ? '#00C48C' : level === 'Medium' ? '#F5A623' : '#E05252';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] text-[#888888] w-10">{level}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-[#00C48C]" />;
  if (trend === 'down') return <TrendingUp className="w-3 h-3 text-[#E05252] rotate-180" />;
  return <div className="w-3 h-3 rounded-full bg-[#555555]" />;
}

function OpportunityScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? '#00C48C' : score >= 70 ? '#F5A623' : '#E05252';
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold min-w-[24px] text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export function KeywordGapTool() {
  const { spendTokens } = useNychIQStore();
  const [yourChannel, setYourChannel] = useState('');
  const [competitorChannel, setCompetitorChannel] = useState('');
  const [results, setResults] = useState<GapKeyword[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'volume' | 'difficulty'>('score');

  const handleAnalyze = async () => {
    if (!yourChannel.trim() || !competitorChannel.trim()) return;
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('keyword-gap');
    if (!ok) { setLoading(false); return; }
    await new Promise((r) => setTimeout(r, 1800));
    setResults(MOCK_DATA);
    setLoading(false);
  };

  const handleCopyAll = () => {
    if (!results) return;
    const text = results.map((k) => `"${k.keyword}" — Pos: #${k.competitorPosition}, Vol: ${k.searchVolume}, Score: ${k.opportunityScore}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedResults = [...(results || [])].sort((a, b) => {
    if (sortBy === 'score') return b.opportunityScore - a.opportunityScore;
    if (sortBy === 'difficulty') {
      const order = { Easy: 0, Medium: 1, Hard: 2 };
      return order[a.difficulty] - order[b.difficulty];
    }
    return parseFloat(b.searchVolume) - parseFloat(a.searchVolume);
  });

  const easyCount = results?.filter((k) => k.difficulty === 'Easy').length ?? 0;
  const highOppCount = results?.filter((k) => k.opportunityScore >= 85).length ?? 0;
  const avgScore = results ? Math.round(results.reduce((s, k) => s + k.opportunityScore, 0) / results.length) : 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Input Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
              <Key className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Keyword Gap Analyzer</h2>
              <p className="text-xs text-[#888888] mt-0.5">Discover keywords your competitor ranks for that you don&apos;t.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <input
                  type="text"
                  value={yourChannel}
                  onChange={(e) => setYourChannel(e.target.value)}
                  placeholder="Your channel name..."
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                />
              </div>
              <ArrowRight className="w-4 h-4 text-[#444444] shrink-0 hidden sm:block" />
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <input
                  type="text"
                  value={competitorChannel}
                  onChange={(e) => setCompetitorChannel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
                  placeholder="Competitor channel name..."
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !yourChannel.trim() || !competitorChannel.trim()}
              className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E59613] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Analyze Keyword Gap
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-4 flex items-center gap-4">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse flex-1" />
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-16" />
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gap Keywords', value: results.length, color: '#F5A623', icon: Key },
              { label: 'High Opportunity', value: highOppCount, color: '#00C48C', icon: TrendingUp },
              { label: 'Easy to Rank', value: easyCount, color: '#4A9EFF', icon: Zap },
              { label: 'Avg Score', value: avgScore, color: '#9B72CF', icon: BarChart3 },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-3 sm:p-4 flex items-center gap-3">
                  <div className="p-1.5 rounded-md shrink-0" style={{ backgroundColor: `${stat.color}15` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] text-[#888888] uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keyword Table */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Keyword Opportunities</h4>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {(['score', 'volume', 'difficulty'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        sortBy === s ? 'bg-[#F5A623]/15 text-[#F5A623]' : 'text-[#555555] hover:text-[#888888]'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <button onClick={handleCopyAll} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888888] hover:text-[#E8E8E8]" title="Copy all">
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {/* Table Header */}
            <div className="px-4 py-2.5 grid grid-cols-12 gap-2 sm:gap-3 text-[10px] font-bold text-[#555555] uppercase tracking-wider border-b border-[#1A1A1A] bg-[#0D0D0D]">
              <div className="col-span-4">Keyword</div>
              <div className="col-span-1 text-center hidden sm:block">Trend</div>
              <div className="col-span-2 text-center">Position</div>
              <div className="col-span-1 text-center hidden sm:block">Volume</div>
              <div className="col-span-2 hidden sm:block">Competition</div>
              <div className="col-span-2 sm:col-span-1 text-center">Difficulty</div>
              <div className="col-span-3 sm:col-span-1 text-right">Score</div>
            </div>
            {/* Table Body */}
            <div className="max-h-[420px] overflow-y-auto">
              {sortedResults.map((kw, i) => (
                <div
                  key={i}
                  className="px-4 py-3 grid grid-cols-12 gap-2 sm:gap-3 items-center border-b border-[#1A1A1A] last:border-0 hover:bg-[#0D0D0D] transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-[#444444] shrink-0">{i + 1}</span>
                    <span className="text-xs sm:text-sm text-[#E8E8E8] truncate">{kw.keyword}</span>
                  </div>
                  <div className="col-span-1 text-center hidden sm:flex sm:justify-center">
                    <TrendIcon trend={kw.trend} />
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs sm:text-sm font-semibold text-[#9B72CF]">#{kw.competitorPosition}</span>
                  </div>
                  <div className="col-span-1 text-center hidden sm:block">
                    <span className="text-xs text-[#888888]">{kw.searchVolume}</span>
                  </div>
                  <div className="col-span-2 hidden sm:block">
                    <CompetitionBar level={kw.competition} />
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-center">
                    <DifficultyBadge difficulty={kw.difficulty} />
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex justify-end">
                    <OpportunityScoreBar score={kw.opportunityScore} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insight */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-[rgba(245,166,35,0.1)] shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F5A623]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#E8E8E8] mb-1">Gap Analysis Insight</h4>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Your competitor has <span className="text-[#F5A623] font-semibold">{results.length} keywords</span> where they rank in the top 6 but you don&apos;t appear at all.
                  The top opportunities are in the <span className="text-[#00C48C] font-semibold">&quot;Easy&quot; difficulty</span> range — these are your fastest wins.
                  Prioritize keywords with an opportunity score above <span className="text-[#F5A623] font-semibold">85</span> for maximum impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-[#F5A623]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Find Keyword Gaps</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Enter your channel and a competitor to uncover keyword opportunities you&apos;re missing out on.</p>
        </div>
      )}
    </div>
  );
}
