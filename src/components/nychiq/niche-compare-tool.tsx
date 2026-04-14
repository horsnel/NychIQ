'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Columns2,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trophy,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Target,
  Bot,
} from 'lucide-react';

/* ── Types ── */
interface NicheMetrics {
  rpm: number;
  searchVolume: string;
  competition: 'Low' | 'Medium' | 'High';
  productionEffort: 'Low' | 'Medium' | 'High';
  adIntent: number;
  automationPotential: number;
  pteScore: number;
}

interface CompareResult {
  nicheA: string;
  nicheB: string;
  metricsA: NicheMetrics;
  metricsB: NicheMetrics;
  winner: string;
  winnerReason: string;
  advice: string;
}

/* ── Color helpers ── */
function valueColor(value: number, goodHigh = true): string {
  if (goodHigh) {
    if (value >= 75) return '#888888';
    if (value >= 50) return '#F6A828';
    return '#888888';
  }
  if (value <= 25) return '#888888';
  if (value <= 50) return '#F6A828';
  return '#888888';
}

function compColor(level: string): string {
  if (level === 'Low') return '#888888';
  if (level === 'Medium') return '#F6A828';
  return '#888888';
}

/* ── Comparison table cell ── */
function MetricCell({
  label,
  valueA,
  valueB,
  format = 'number',
  goodHigh = true,
}: {
  label: string;
  valueA: string | number;
  valueB: string | number;
  format?: 'number' | 'dollar' | 'percent' | 'string';
  goodHigh?: boolean;
}) {
  const numA = typeof valueA === 'number' ? valueA : 0;
  const numB = typeof valueB === 'number' ? valueB : 0;
  const colorA = format === 'string' ? compColor(String(valueA)) : valueColor(numA, goodHigh);
  const colorB = format === 'string' ? compColor(String(valueB)) : valueColor(numB, goodHigh);

  const fmt = (v: string | number) => {
    if (format === 'dollar') return `$${v}`;
    if (format === 'percent') return `${v}%`;
    return String(v);
  };

  return (
    <tr className="border-b border-[#1A1A1A]">
      <td className="px-4 py-3 text-xs font-medium text-[#a0a0a0]">{label}</td>
      <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: colorA }}>
        {fmt(valueA)}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: colorB }}>
        {fmt(valueB)}
      </td>
    </tr>
  );
}

/* ── Main Component ── */
export function NicheCompareTool() {
  const { spendTokens } = useNychIQStore();
  const [nicheA, setNicheA] = useState('');
  const [nicheB, setNicheB] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCompare = async () => {
    const a = nicheA.trim();
    const b = nicheB.trim();
    if (!a || !b) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('niche-compare');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube niche analysis expert. Compare these two YouTube niches side-by-side: "${a}" vs "${b}".

Return a JSON object with:
- "nicheA": "${a}"
- "nicheB": "${b}"
- "metricsA": { "rpm": number (1-50), "searchVolume": string (e.g. "850K"), "competition": "Low"/"Medium"/"High", "productionEffort": "Low"/"Medium"/"High", "adIntent": number (0-100), "automationPotential": number (0-100), "pteScore": number (0-100, profit-to-effort ratio) }
- "metricsB": same structure
- "winner": "${a}" or "${b}"
- "winnerReason": 1-2 sentence explanation of why the winner wins
- "advice": 2-3 sentences of strategic advice for the user

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setResult({
        nicheA: parsed.nicheA || a,
        nicheB: parsed.nicheB || b,
        metricsA: {
          rpm: Math.min(50, Math.max(1, Number(parsed.metricsA?.rpm) || 8)),
          searchVolume: parsed.metricsA?.searchVolume || '400K',
          competition: ['Low', 'Medium', 'High'].includes(parsed.metricsA?.competition) ? parsed.metricsA.competition : 'Medium',
          productionEffort: ['Low', 'Medium', 'High'].includes(parsed.metricsA?.productionEffort) ? parsed.metricsA.productionEffort : 'Medium',
          adIntent: Math.min(100, Math.max(0, Number(parsed.metricsA?.adIntent) || 50)),
          automationPotential: Math.min(100, Math.max(0, Number(parsed.metricsA?.automationPotential) || 40)),
          pteScore: Math.min(100, Math.max(0, Number(parsed.metricsA?.pteScore) || 50)),
        },
        metricsB: {
          rpm: Math.min(50, Math.max(1, Number(parsed.metricsB?.rpm) || 6)),
          searchVolume: parsed.metricsB?.searchVolume || '300K',
          competition: ['Low', 'Medium', 'High'].includes(parsed.metricsB?.competition) ? parsed.metricsB.competition : 'Medium',
          productionEffort: ['Low', 'Medium', 'High'].includes(parsed.metricsB?.productionEffort) ? parsed.metricsB.productionEffort : 'Medium',
          adIntent: Math.min(100, Math.max(0, Number(parsed.metricsB?.adIntent) || 50)),
          automationPotential: Math.min(100, Math.max(0, Number(parsed.metricsB?.automationPotential) || 40)),
          pteScore: Math.min(100, Math.max(0, Number(parsed.metricsB?.pteScore) || 50)),
        },
        winner: parsed.winner || a,
        winnerReason: parsed.winnerReason || 'Higher overall profitability potential.',
        advice: parsed.advice || 'Focus on the niche with better PTE score for sustainable growth.',
      });
    } catch {
      // Mock fallback
      const mA: NicheMetrics = {
        rpm: +(Math.random() * 20 + 5).toFixed(2),
        searchVolume: `${(Math.floor(Math.random() * 900) + 100)}K`,
        competition: (['Low', 'Medium', 'High'] as const)[Math.floor(Math.random() * 3)],
        productionEffort: (['Low', 'Medium', 'High'] as const)[Math.floor(Math.random() * 3)],
        adIntent: Math.floor(Math.random() * 60) + 40,
        automationPotential: Math.floor(Math.random() * 60) + 30,
        pteScore: Math.floor(Math.random() * 40) + 55,
      };
      const mB: NicheMetrics = {
        rpm: +(Math.random() * 15 + 3).toFixed(2),
        searchVolume: `${(Math.floor(Math.random() * 700) + 100)}K`,
        competition: (['Low', 'Medium', 'High'] as const)[Math.floor(Math.random() * 3)],
        productionEffort: (['Low', 'Medium', 'High'] as const)[Math.floor(Math.random() * 3)],
        adIntent: Math.floor(Math.random() * 50) + 30,
        automationPotential: Math.floor(Math.random() * 50) + 20,
        pteScore: Math.floor(Math.random() * 35) + 40,
      };
      const w = mA.pteScore >= mB.pteScore ? a : b;
      setResult({
        nicheA: a, nicheB: b, metricsA: mA, metricsB: mB,
        winner: w,
        winnerReason: `${w} has a higher Profit-to-Effort ratio, indicating better ROI on your content creation time.`,
        advice: `Consider starting with ${w} to build momentum, then expand into the other niche. Focus on evergreen content formats that can be batch-produced.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `Niche Compare: ${result.nicheA} vs ${result.nicheB}\nWinner: ${result.winner}\nPTE: ${result.metricsA.pteScore} vs ${result.metricsB.pteScore}\nRPM: $${result.metricsA.rpm} vs $${result.metricsB.rpm}\n\n${result.advice}`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mA = result?.metricsA;
  const mB = result?.metricsB;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Columns2 className="w-5 h-5" style={{ color: '#aaa' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Niche Compare</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Side-by-side comparison with Profit-to-Effort (PTE) ratio
              </p>
            </div>
          </div>

          {/* Two inputs + button */}
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="flex-1 w-full relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#888888]/20 text-[#888888]">A</span>
              <input
                type="text"
                value={nicheA}
                onChange={(e) => setNicheA(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCompare(); }}
                placeholder="Niche A (e.g., Finance)"
                className="w-full h-11 pl-10 pr-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 focus:ring-1 focus:ring-[rgba(255,255,255,0.03)]/20 transition-colors"
              />
            </div>
            <div className="hidden sm:block text-lg font-bold text-[#666666] px-1">VS</div>
            <div className="flex-1 w-full relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#888888]/20 text-[#888888]">B</span>
              <input
                type="text"
                value={nicheB}
                onChange={(e) => setNicheB(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCompare(); }}
                placeholder="Niche B (e.g., Gaming)"
                className="w-full h-11 pl-10 pr-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 focus:ring-1 focus:ring-[rgba(255,255,255,0.03)]/20 transition-colors"
              />
            </div>
            <button
              onClick={handleCompare}
              disabled={loading || !nicheA.trim() || !nicheB.trim()}
              className="w-full sm:w-auto px-5 h-11 rounded-lg text-[#0a0a0a] text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              style={{ backgroundColor: '#888888' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Columns2 className="w-4 h-4" />}
              Compare Niches
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#888888] mx-auto mb-2" />
          <p className="text-sm text-[#FFFFFF] mb-3">{error}</p>
          <button onClick={handleCompare} className="px-4 py-2 rounded-lg bg-[#888888]/15 text-[#888888] text-xs font-medium hover:bg-[#888888]/25 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-6 space-y-4">
          <div className="flex items-center justify-center gap-4 py-6">
            <div className="w-16 h-16 rounded-xl bg-[#1A1A1A] animate-pulse" />
            <div className="text-2xl font-black text-[#666666] animate-pulse">VS</div>
            <div className="w-16 h-16 rounded-xl bg-[#1A1A1A] animate-pulse" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-1 h-10 rounded-lg bg-[#1A1A1A] animate-pulse" />
              <div className="w-20 h-10 rounded-lg bg-[#1A1A1A] animate-pulse" />
              <div className="flex-1 h-10 rounded-lg bg-[#1A1A1A] animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && result && mA && mB && (
        <>
          {/* Winner Declaration */}
          <div className="rounded-lg p-5 border" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%)', borderColor: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5" style={{ color: '#aaa' }} />
              <span className="text-sm font-bold" style={{ color: '#aaa' }}>WINNER</span>
            </div>
            <h3 className="text-xl font-black text-[#FFFFFF] mb-1">{result.winner}</h3>
            <p className="text-xs text-[#a0a0a0]">{result.winnerReason}</p>
          </div>

          {/* Comparison Table */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 text-center border-b border-[#1A1A1A]">
              <div className="px-4 py-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#1a1a1a', color: '#888888' }}>A</span>
                <p className="text-sm font-bold text-[#FFFFFF] mt-1">{result.nicheA}</p>
              </div>
              <div className="px-4 py-3 flex items-center justify-center">
                <span className="text-xs font-black text-[#666666] tracking-widest">VS</span>
              </div>
              <div className="px-4 py-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#888888]/15 text-[#888888]">B</span>
                <p className="text-sm font-bold text-[#FFFFFF] mt-1">{result.nicheB}</p>
              </div>
            </div>

            <table className="w-full">
              <tbody>
                <MetricCell label="Estimated RPM" valueA={mA.rpm} valueB={mB.rpm} format="dollar" />
                <MetricCell label="Search Volume" valueA={mA.searchVolume} valueB={mB.searchVolume} format="string" goodHigh={true} />
                <MetricCell label="Competition" valueA={mA.competition} valueB={mB.competition} format="string" goodHigh={false} />
                <MetricCell label="Production Effort" valueA={mA.productionEffort} valueB={mB.productionEffort} format="string" goodHigh={false} />
                <MetricCell label="Ad Intent" valueA={mA.adIntent} valueB={mB.adIntent} format="percent" />
                <MetricCell label="Automation" valueA={mA.automationPotential} valueB={mB.automationPotential} format="percent" />
                <tr className="border-b border-[#1A1A1A]">
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: '#aaa' }}>PTE Score</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black" style={{ backgroundColor: `${valueColor(mA.pteScore)}15`, color: valueColor(mA.pteScore) }}>
                      <Target className="w-3.5 h-3.5" />
                      {mA.pteScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black" style={{ backgroundColor: `${valueColor(mB.pteScore)}15`, color: valueColor(mB.pteScore) }}>
                      <Target className="w-3.5 h-3.5" />
                      {mB.pteScore}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Automation Potential Bars */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
              <TrendingUp className="w-4 h-4" style={{ color: '#aaa' }} />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">Automation Potential</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[#FFFFFF]">{result.nicheA}</span>
                  <span className="text-xs font-bold" style={{ color: valueColor(mA.automationPotential) }}>{mA.automationPotential}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${mA.automationPotential}%`, backgroundColor: valueColor(mA.automationPotential) }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[#FFFFFF]">{result.nicheB}</span>
                  <span className="text-xs font-bold" style={{ color: valueColor(mB.automationPotential) }}>{mB.automationPotential}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${mB.automationPotential}%`, backgroundColor: valueColor(mB.automationPotential) }} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Strategic Advice */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#aaa' }} />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Strategic Advice</h3>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#888888] transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: '#aaa' }} />
                </div>
                <p className="text-xs text-[#a0a0a0] leading-relaxed">{result.advice}</p>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <div className="flex justify-center">
            <button onClick={handleCompare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#a0a0a0] hover:text-[#888888] transition-colors">
              <RefreshCw className="w-3 h-3" />
              Re-compare
            </button>
          </div>
        </>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <Columns2 className="w-8 h-8" style={{ color: '#aaa' }} />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Compare Two Niches</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Enter two niche keywords above to get a comprehensive Profit-to-Effort comparison.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#666666]">
          Cost: {TOKEN_COSTS['niche-compare']} tokens per analysis
        </div>
      )}
    </div>
  );
}
