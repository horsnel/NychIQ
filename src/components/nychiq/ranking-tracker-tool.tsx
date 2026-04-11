'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Target,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Minus,
  Eye,
  Zap,
} from 'lucide-react';

interface TrackedKeyword {
  id: string;
  keyword: string;
  currentPosition: number;
  change: number;
  bestPosition: number;
  searchVolume: number;
  history: number[];
}

const MOCK_KEYWORDS: TrackedKeyword[] = [
  { id: '1', keyword: 'how to edit youtube videos', currentPosition: 3, change: 2, bestPosition: 1, searchVolume: 245000, history: [8, 6, 5, 4, 3, 3] },
  { id: '2', keyword: 'best video editing software 2025', currentPosition: 7, change: -3, bestPosition: 4, searchVolume: 182000, history: [4, 4, 5, 6, 8, 7] },
  { id: '3', keyword: 'youtube thumbnail tutorial', currentPosition: 1, change: 0, bestPosition: 1, searchVolume: 91000, history: [1, 1, 2, 1, 1, 1] },
  { id: '4', keyword: 'grow youtube channel fast', currentPosition: 12, change: 5, bestPosition: 8, searchVolume: 320000, history: [24, 20, 18, 15, 14, 12] },
  { id: '5', keyword: 'faceless youtube channel ideas', currentPosition: 5, change: -1, bestPosition: 2, searchVolume: 148000, history: [3, 4, 4, 5, 5, 5] },
  { id: '6', keyword: 'youtube shorts algorithm explained', currentPosition: 2, change: 3, bestPosition: 2, searchVolume: 67000, history: [9, 7, 5, 4, 3, 2] },
  { id: '7', keyword: 'make money on youtube', currentPosition: 18, change: -4, bestPosition: 10, searchVolume: 450000, history: [12, 13, 14, 15, 16, 18] },
  { id: '8', keyword: 'youtube seo tips for beginners', currentPosition: 6, change: 1, bestPosition: 3, searchVolume: 88000, history: [9, 8, 7, 7, 6, 6] },
  { id: '9', keyword: 'video editing tips for youtube', currentPosition: 9, change: 2, bestPosition: 5, searchVolume: 73000, history: [15, 13, 12, 11, 10, 9] },
  { id: '10', keyword: 'channel trailer best practices', currentPosition: 22, change: -6, bestPosition: 14, searchVolume: 34000, history: [14, 16, 17, 18, 20, 22] },
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function formatVolume(vol: number): string {
  if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
  return String(vol);
}

export function RankingTrackerTool() {
  const { spendTokens } = useNychIQStore();
  const [keywords, setKeywords] = useState<TrackedKeyword[]>(MOCK_KEYWORDS);
  const [newKeyword, setNewKeyword] = useState('');
  const [filter, setFilter] = useState<'all' | 'improving' | 'declining'>('all');

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const kw: TrackedKeyword = {
      id: Date.now().toString(),
      keyword: newKeyword.trim(),
      currentPosition: Math.floor(Math.random() * 40) + 5,
      change: Math.floor(Math.random() * 20) - 10,
      bestPosition: Math.floor(Math.random() * 10) + 1,
      searchVolume: Math.floor(Math.random() * 300000) + 10000,
      history: Array.from({ length: 6 }, () => Math.floor(Math.random() * 30) + 1),
    };
    setKeywords((prev) => [kw, ...prev]);
    setNewKeyword('');
  };

  const handleRefresh = () => {
    spendTokens('ranking-tracker');
    setKeywords((prev) =>
      prev.map((kw) => ({
        ...kw,
        change: Math.floor(Math.random() * 10) - 5,
        history: [...kw.history.slice(1), kw.currentPosition + Math.floor(Math.random() * 6) - 3],
      }))
    );
  };

  const filtered = keywords.filter((kw) => {
    if (filter === 'improving') return kw.change > 0;
    if (filter === 'declining') return kw.change < 0;
    return true;
  });

  const avgPosition = Math.round(keywords.reduce((s, k) => s + k.currentPosition, 0) / keywords.length);
  const improvingCount = keywords.filter((k) => k.change > 0).length;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
                <Target className="w-5 h-5 text-[#9B72CF]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E8E8E8]">Ranking Tracker</h2>
                <p className="text-xs text-[#888888] mt-0.5">Monitor keyword positions daily</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-[#222222] hover:bg-[#1A1A1A] transition-colors"
            >
              <Zap className="w-4 h-4 text-[#F5A623]" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-center">
              <p className="text-[11px] text-[#666666] uppercase tracking-wider">Tracked</p>
              <p className="text-lg font-bold text-[#E8E8E8] mt-0.5">{keywords.length}</p>
            </div>
            <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-center">
              <p className="text-[11px] text-[#666666] uppercase tracking-wider">Avg Position</p>
              <p className="text-lg font-bold text-[#9B72CF] mt-0.5">#{avgPosition}</p>
            </div>
            <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-center">
              <p className="text-[11px] text-[#666666] uppercase tracking-wider">Improving</p>
              <p className="text-lg font-bold text-[#00C48C] mt-0.5">{improvingCount}</p>
            </div>
          </div>

          {/* Add Keyword Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                placeholder="Enter a keyword to track..."
                className="w-full bg-[#0A0A0A] border border-[#222222] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
              />
            </div>
            <button
              onClick={handleAddKeyword}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#9B72CF] text-white text-sm font-semibold hover:bg-[#8A62BF] transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Keyword</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5">
        {([
          { key: 'all', label: 'All' },
          { key: 'improving', label: 'Improving', icon: <TrendingUp className="w-3 h-3" /> },
          { key: 'declining', label: 'Declining', icon: <TrendingDown className="w-3 h-3" /> },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              filter === t.key
                ? 'bg-[#9B72CF]/15 text-[#9B72CF] border border-[#9B72CF]/30'
                : 'bg-[#111111] text-[#888888] border border-[#222222] hover:border-[#333333] hover:text-[#E8E8E8]'
            }`}
          >
            {'icon' in t && t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Keywords Table */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-[#1A1A1A] text-[11px] text-[#666666] uppercase tracking-wider font-semibold">
          <div className="col-span-4">Keyword</div>
          <div className="col-span-1 text-center">Position</div>
          <div className="col-span-1 text-center">Change</div>
          <div className="col-span-1 text-center">Best</div>
          <div className="col-span-2 text-center">Volume</div>
          <div className="col-span-3 text-right">7-Day Trend</div>
        </div>

        <div className="divide-y divide-[#1A1A1A]">
          {filtered.map((kw) => (
            <div key={kw.id} className="px-4 py-3.5 hover:bg-[#0D0D0D]/50 transition-colors">
              {/* Desktop Row */}
              <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                <div className="col-span-4">
                  <p className="text-sm font-medium text-[#E8E8E8] truncate">{kw.keyword}</p>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-sm font-bold text-[#E8E8E8]">#{kw.currentPosition}</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  {kw.change > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-[#00C48C]">
                      <ArrowUp className="w-3 h-3" />
                      +{kw.change}
                    </span>
                  ) : kw.change < 0 ? (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-[#E05252]">
                      <ArrowDown className="w-3 h-3" />
                      {kw.change}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-[#888888]">
                      <Minus className="w-3 h-3" />
                      0
                    </span>
                  )}
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-xs text-[#00C48C] font-medium">#{kw.bestPosition}</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="flex items-center justify-center gap-1 text-xs text-[#888888]">
                    <Eye className="w-3 h-3" />
                    {formatVolume(kw.searchVolume)}
                  </span>
                </div>
                <div className="col-span-3 flex justify-end">
                  <MiniSparkline
                    data={kw.history}
                    color={kw.change >= 0 ? '#00C48C' : '#E05252'}
                  />
                </div>
              </div>

              {/* Mobile Row */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#E8E8E8] truncate pr-3">{kw.keyword}</p>
                  {kw.change > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-[#00C48C] shrink-0">
                      <ArrowUp className="w-3 h-3" />+{kw.change}
                    </span>
                  ) : kw.change < 0 ? (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-[#E05252] shrink-0">
                      <ArrowDown className="w-3 h-3" />{kw.change}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-[#888888] shrink-0">
                      <Minus className="w-3 h-3" />0
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-[#666666]">
                  <span>Pos #{kw.currentPosition}</span>
                  <span>Best #{kw.bestPosition}</span>
                  <span>{formatVolume(kw.searchVolume)} vol</span>
                </div>
                <MiniSparkline data={kw.history} color={kw.change >= 0 ? '#00C48C' : '#E05252'} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-[11px] text-[#444444]">
        Positions updated daily · {filtered.length} keyword{filtered.length !== 1 ? 's' : ''} shown
      </div>
    </div>
  );
}
