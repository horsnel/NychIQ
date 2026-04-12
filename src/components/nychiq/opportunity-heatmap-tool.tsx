'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Grid3x3,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Bot,
  Flame,
  Info,
} from 'lucide-react';

/* ── Types ── */
interface HeatmapTopic {
  name: string;
  demand: number;
  frustration: number;
  topQuestion: string;
}

interface HeatmapResult {
  niche: string;
  topics: HeatmapTopic[];
  advice: string;
}

/* ── Color scale: blue (low opportunity) → red (high opportunity) ── */
function heatColor(demand: number, frustration: number): string {
  const score = (demand * 0.5 + frustration * 0.5);
  if (score >= 75) return '#EF4444';
  if (score >= 60) return '#E87D3E';
  if (score >= 45) return '#FDBA2D';
  if (score >= 30) return '#3B82F6';
  return '#3B7DD8';
}

function heatBg(demand: number, frustration: number): string {
  const c = heatColor(demand, frustration);
  return c + '25';
}

function isGoldMine(demand: number, frustration: number): boolean {
  return demand >= 65 && frustration >= 65;
}

/* ── Tooltip ── */
function HeatmapCell({ topic, index }: { topic: HeatmapTopic; index: number }) {
  const [showTip, setShowTip] = useState(false);
  const gold = isGoldMine(topic.demand, topic.frustration);
  const color = heatColor(topic.demand, topic.frustration);
  const bg = heatBg(topic.demand, topic.frustration);

  return (
    <div className="relative">
      <div
        className="relative rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:z-10 min-h-[72px] flex flex-col justify-between border"
        style={{ backgroundColor: bg, borderColor: color + '40' }}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {gold && (
          <span className="absolute -top-2 -right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#FDBA2D] text-[#0D0D0D] z-10 shadow-lg">
            GOLD MINE
          </span>
        )}
        <span className="text-[11px] font-semibold text-[#FFFFFF] leading-tight line-clamp-2">{topic.name}</span>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
            D:{topic.demand}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
            F:{topic.frustration}
          </span>
        </div>
      </div>

      {/* Tooltip */}
      {showTip && (
        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] shadow-xl pointer-events-none">
          <p className="text-xs font-bold text-[#FFFFFF] mb-2">{topic.name}</p>
          <div className="space-y-1 mb-2">
            <div className="flex justify-between">
              <span className="text-[10px] text-[#A3A3A3]">Demand</span>
              <span className="text-[10px] font-bold" style={{ color: '#3B82F6' }}>{topic.demand}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-[#A3A3A3]">Frustration</span>
              <span className="text-[10px] font-bold" style={{ color: '#EF4444' }}>{topic.frustration}/100</span>
            </div>
          </div>
          <div className="border-t border-[#2A2A2A] pt-2">
            <p className="text-[10px] text-[#A3A3A3] leading-relaxed">{topic.topQuestion}</p>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45 bg-[#1A1A1A] border-r border-b border-[#2A2A2A]" />
        </div>
      )}
    </div>
  );
}

/* ── Mock fallback data ── */
function generateMockTopics(niche: string): HeatmapTopic[] {
  const prefixes = ['Beginner', 'Advanced', 'Tools', 'Mistakes', 'Passive Income', 'Career', 'Tutorials', 'Updates', 'Automation', 'Comparisons', 'Tips', 'Troubleshooting'];
  return prefixes.map((p) => ({
    name: `${p} ${niche}`,
    demand: Math.floor(Math.random() * 60) + 30,
    frustration: Math.floor(Math.random() * 60) + 30,
    topQuestion: `What are the most common ${p.toLowerCase()} ${niche.toLowerCase()} questions that existing videos fail to answer?`,
  }));
}

/* ── Main Component ── */
export function OpportunityHeatmapTool() {
  const { spendTokens } = useNychIQStore();
  const [nicheInput, setNicheInput] = useState('');
  const [result, setResult] = useState<HeatmapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const niche = nicheInput.trim();
    if (!niche) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('opportunity-heatmap');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube opportunity research expert. For the broad niche "${niche}", generate 16 sub-topic opportunities.

For each sub-topic, score:
- "demand": How much audience demand exists (0-100)
- "frustration": How frustrated viewers are with existing content (0-100)
- "topQuestion": The #1 unanswered question viewers have about this sub-topic

Return a JSON object with:
- "niche": "${niche}"
- "topics": Array of 16 objects, each with "name" (string), "demand" (number 0-100), "frustration" (number 0-100), "topQuestion" (string)
- "advice": 2-3 sentences of tactical advice for the best opportunities, mentioning specific sub-topics

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const topics = Array.isArray(parsed.topics)
        ? parsed.topics.slice(0, 16).map((t: any) => ({
            name: String(t.name || 'Untitled Topic'),
            demand: Math.min(100, Math.max(0, Number(t.demand) || 50)),
            frustration: Math.min(100, Math.max(0, Number(t.frustration) || 50)),
            topQuestion: String(t.topQuestion || 'What are viewers looking for?'),
          }))
        : [];

      setResult({
        niche: parsed.niche || niche,
        topics: topics.length >= 8 ? topics : generateMockTopics(niche),
        advice: parsed.advice || `Focus on the top-right quadrant sub-topics with high demand AND high frustration. These represent content gaps where viewers need answers.`,
      });
    } catch {
      setResult({
        niche,
        topics: generateMockTopics(niche),
        advice: `Based on the heatmap analysis for "${niche}", the sub-topics in the high-demand, high-frustration quadrant (top-right) represent your best opportunities. Create content that directly answers the top unanswered questions shown on hover.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const goldMines = result.topics.filter((t) => isGoldMine(t.demand, t.frustration));
    const text = `Opportunity Heatmap: ${result.niche}\nGold Mines (${goldMines.length}): ${goldMines.map((t) => t.name).join(', ')}\n\n${result.advice}`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goldMines = result ? result.topics.filter((t) => isGoldMine(t.demand, t.frustration)) : [];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <Grid3x3 className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Opportunity Heatmap</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                Sub-topics plotted by Demand vs. Frustration
              </p>
            </div>
          </div>
          <p className="text-xs text-[#A3A3A3] mb-4">
            Enter a broad niche. AI identifies sub-topics where demand is high but existing content fails viewers — your biggest opportunities.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                placeholder="Enter a broad niche (e.g., Personal Finance)..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#EF4444]/50 focus:ring-1 focus:ring-[#EF4444]/20 transition-colors"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !nicheInput.trim()}
              className="px-5 h-11 rounded-lg text-[#0D0D0D] text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              style={{ backgroundColor: '#EF4444' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Grid3x3 className="w-4 h-4" />}
              Generate Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
          <p className="text-sm text-[#FFFFFF] mb-3">{error}</p>
          <button onClick={handleGenerate} className="px-4 py-2 rounded-lg bg-[#EF4444]/15 text-[#EF4444] text-xs font-medium hover:bg-[#EF4444]/25 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="rounded-lg h-[72px] bg-[#1A1A1A] animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <>
          {/* Legend + Stats */}
          <div className="flex flex-wrap items-center gap-4 px-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FDBA2D]" />
              <span className="text-xs text-[#A3A3A3]">
                <span className="font-bold text-[#FDBA2D]">{goldMines.length}</span> Gold Mines found
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#666666]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#3B7DD840' }} /> Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#FDBA2D40' }} /> Medium</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: '#EF444440' }} /> High</span>
            </div>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-[#666666]">
              <Info className="w-3 h-3" />
              Hover for details
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            {/* Axis labels */}
            <div className="flex items-end gap-2 mb-3">
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-wider" style={{ color: '#3B82F6' }}>DEMAND →</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] font-bold tracking-wider" style={{ color: '#EF4444' }}>↑</span>
                <span className="text-[10px] font-bold tracking-wider" style={{ color: '#EF4444' }}>FRUSTRATION</span>
              </div>
            </div>

            {/* Grid: sort by frustration (desc) for top-to-bottom layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...result.topics]
                .sort((a, b) => (b.demand + b.frustration) - (a.demand + a.frustration))
                .map((topic, i) => (
                  <HeatmapCell key={i} topic={topic} index={i} />
                ))}
            </div>
          </div>

          {/* AI Tactical Advice */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#EF4444' }} />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Tactical Advice</h3>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#EF4444] transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{result.advice}</p>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <div className="flex justify-center">
            <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#A3A3A3] hover:text-[#EF4444] transition-colors">
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          </div>
        </>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Grid3x3 className="w-8 h-8" style={{ color: '#EF4444' }} />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Discover Opportunities</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">
            Enter a broad niche to visualize sub-topics by demand and frustration. Gold Mine items in the high-demand, high-frustration zone are your best bets.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS['opportunity-heatmap']} tokens per analysis
        </div>
      )}
    </div>
  );
}
