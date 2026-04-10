'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  Scale,
  Loader2,
  Copy,
  Check,
  Search,
  Globe,
  ChevronDown,
  RefreshCw,
  Sparkles,
  DollarSign,
  Tag,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

/* ── Types ── */
interface ArbitrageResult {
  cpmRange: string;
  cpmLow: number;
  cpmHigh: number;
  highValueTags: { tag: string; cpmImpact: string }[];
  revenueKeywords: { phrase: string; multiplier: string }[];
  avoidTags: { tag: string; reason: string }[];
  cpmMultipliers: { word: string; effect: string }[];
  revenueScore: number;
  tips: string[];
}

const COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'IN', label: 'India' },
  { code: 'KE', label: 'Kenya' },
  { code: 'GH', label: 'Ghana' },
  { code: 'ZA', label: 'South Africa' },
];

/* ── Revenue Score Ring ── */
function RevenueScoreRing({ score }: { score: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#FDBA2D' : '#EF4444';
  const label = score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[72px] h-[72px]">
        <svg width="72" height="72" className="-rotate-90">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="#1A1A1A" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={radius} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold" style={{ color }}>{score}</span>
          <span className="text-[9px] text-[#666666]">{label}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-[#666666]">Revenue Score</span>
    </div>
  );
}

/* ── Mock Data ── */
function getMockArbitrage(topic: string): ArbitrageResult {
  return {
    cpmRange: '$15-$45',
    cpmLow: 15,
    cpmHigh: 45,
    highValueTags: [
      { tag: `${topic} tutorial 2025`, cpmImpact: '+$12 CPM' },
      { tag: `${topic} for professionals`, cpmImpact: '+$18 CPM' },
      { tag: `${topic} course review`, cpmImpact: '+$14 CPM' },
      { tag: `best ${topic.toLowerCase()} tools`, cpmImpact: '+$10 CPM' },
      { tag: `${topic} masterclass`, cpmImpact: '+$16 CPM' },
      { tag: `${topic} certification`, cpmImpact: '+$20 CPM' },
      { tag: `${topic} software comparison`, cpmImpact: '+$15 CPM' },
      { tag: `${topic} enterprise solutions`, cpmImpact: '+$22 CPM' },
    ],
    revenueKeywords: [
      { phrase: `${topic.toLowerCase()} for business`, multiplier: '2.5x' },
      { phrase: `enterprise ${topic.toLowerCase()}`, multiplier: '3.1x' },
      { phrase: `${topic.toLowerCase()} training course`, multiplier: '2.8x' },
      { phrase: `${topic.toLowerCase()} software pricing`, multiplier: '2.2x' },
      { phrase: `${topic.toLowerCase()} ROI calculator`, multiplier: '2.6x' },
    ],
    avoidTags: [
      { tag: `${topic} funny moments`, reason: 'Attracts entertainment ads ($2-4 CPM)' },
      { tag: `${topic} memes`, reason: 'Extremely low CPM category' },
      { tag: `${topic} compilation`, reason: 'Compilations attract low-value advertisers' },
      { tag: `free ${topic.toLowerCase()}`, reason: '"Free" keywords attract budget advertisers' },
      { tag: `${topic} vlog`, reason: 'Vlog category has lowest average CPM' },
    ],
    cpmMultipliers: [
      { word: 'Enterprise', effect: '2-3x CPM boost' },
      { word: 'Professional', effect: '1.8-2.5x CPM boost' },
      { word: 'Course / Training', effect: '2-2.8x CPM boost' },
      { word: 'Review / Comparison', effect: '1.5-2x CPM boost' },
      { word: 'Pricing / Cost', effect: '1.8-2.5x CPM boost' },
      { word: 'Certification', effect: '2-3x CPM boost' },
    ],
    revenueScore: 78,
    tips: [
      'Target viewers in the US, UK, and AU for highest CPM rates',
      'Include "enterprise" or "professional" in your title to attract premium advertisers',
      'Avoid "free" and "funny" keywords which attract low-CPM ads',
      'Create content comparing tools/products — comparison content has 2x higher CPM',
      'Use timestamps and structured content to increase watch time and ad impressions',
    ],
  };
}

/* ════════════════════════════════════════════════
   ARBITRAGE TOOL
   ════════════════════════════════════════════════ */
export function ArbitrageTool() {
  const { spendTokens } = useNychIQStore();
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ArbitrageResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const countryLabel = COUNTRIES.find((c) => c.code === country)?.label ?? 'United States';

  const handleFind = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('arbitrage');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube revenue optimization expert specializing in CPM (Cost Per Mille) analysis. Analyze the topic/niche: "${trimmed}" for the country: ${countryLabel}.

Return a JSON object with these exact keys:
- "cpmRange": string (e.g., "$15-$45")
- "cpmLow": number (lowest estimated CPM)
- "cpmHigh": number (highest estimated CPM)
- "highValueTags": array of 7-10 objects with "tag" (string) and "cpmImpact" (string like "+$12 CPM") — tags that attract premium advertisers
- "revenueKeywords": array of 5-7 objects with "phrase" (string) and "multiplier" (string like "2.5x") — specific phrases that increase ad value
- "avoidTags": array of 4-6 objects with "tag" (string) and "reason" (string) — tags that attract low-CPM ads
- "cpmMultipliers": array of 5-7 objects with "word" (string) and "effect" (string like "2-3x CPM boost") — words that multiply CPM
- "revenueScore": number 0-100 (revenue optimization score)
- "tips": array of 4-5 strings (revenue optimization tips)

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setResult({
        cpmRange: parsed.cpmRange || '$10-$30',
        cpmLow: typeof parsed.cpmLow === 'number' ? parsed.cpmLow : 10,
        cpmHigh: typeof parsed.cpmHigh === 'number' ? parsed.cpmHigh : 30,
        highValueTags: Array.isArray(parsed.highValueTags) ? parsed.highValueTags : getMockArbitrage(trimmed).highValueTags,
        revenueKeywords: Array.isArray(parsed.revenueKeywords) ? parsed.revenueKeywords : getMockArbitrage(trimmed).revenueKeywords,
        avoidTags: Array.isArray(parsed.avoidTags) ? parsed.avoidTags : getMockArbitrage(trimmed).avoidTags,
        cpmMultipliers: Array.isArray(parsed.cpmMultipliers) ? parsed.cpmMultipliers : getMockArbitrage(trimmed).cpmMultipliers,
        revenueScore: typeof parsed.revenueScore === 'number' ? Math.min(100, Math.max(0, parsed.revenueScore)) : 65,
        tips: Array.isArray(parsed.tips) ? parsed.tips : getMockArbitrage(trimmed).tips,
      });
    } catch {
      setResult(getMockArbitrage(trimmed));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTags = () => {
    if (!result) return;
    const tags = result.highValueTags.map((t) => t.tag).join(', ');
    copyToClipboard(tags).then(() => showToast('High-value tags copied!', 'success'));
  };

  const handleCopyKeywords = () => {
    if (!result) return;
    const kw = result.revenueKeywords.map((k) => k.phrase).join('\n');
    copyToClipboard(kw).then(() => showToast('Revenue keywords copied!', 'success'));
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <Scale className="w-5 h-5" style={{ color: '#10B981' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Arbitrage</h2>
              <p className="text-xs text-[#888888] mt-0.5">Revenue Tagging — Optimize tags for higher CPM ads</p>
            </div>
          </div>
          <p className="text-sm text-[#888888] mb-4">
            Enter a video topic and discover tags &amp; keywords that trigger higher-value ads, maximizing your YouTube revenue.
          </p>

          {/* Input Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFind(); }}
                placeholder="Enter video topic or niche..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none transition-colors"
                style={{ caretColor: '#10B981' }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
              />
            </div>
            {/* Country Dropdown */}
            <div className="relative w-full sm:w-48">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
              <button
                onClick={() => setCountryOpen(!countryOpen)}
                className="w-full h-11 pl-10 pr-10 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-left flex items-center justify-between transition-colors hover:border-[#333333]"
              >
                <span className="text-[#E8E8E8]">{countryLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
              </button>
              {countryOpen && (
                <div className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-[#151515] border border-[#222222] shadow-xl">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCountry(c.code); setCountryOpen(false); }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-[#1A1A1A] transition-colors ${country === c.code ? 'text-[#10B981]' : 'text-[#E8E8E8]'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Find Button */}
            <button
              onClick={handleFind}
              disabled={loading || !topic.trim()}
              className="px-5 h-11 rounded-lg text-[#0D0D0D] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              style={{ backgroundColor: '#10B981' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Find Revenue Tags
            </button>
          </div>
        </div>
      </div>

      {/* Click-outside for country dropdown */}
      {countryOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setCountryOpen(false)} />
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-5 text-center">
          <p className="text-sm text-[#EF4444] mb-3">{error}</p>
          <button onClick={handleFind} className="px-4 py-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-xs font-medium hover:bg-[#EF4444]/20 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {/* CPM Range skeleton */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <div className="flex items-center gap-6">
              <div className="w-[72px] h-[72px] rounded-full bg-[#1A1A1A] animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-[#1A1A1A] rounded animate-pulse w-1/3" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
              </div>
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#141414] border border-[#222222] p-5">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-5/6" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#10B981' }} />
              Revenue Analysis
            </h3>
            <button onClick={handleFind} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#E8E8E8] transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {/* CPM Range + Revenue Score */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <RevenueScoreRing score={result.revenueScore} />
              <div className="flex-1 text-center sm:text-left">
                <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Estimated CPM Range</span>
                <div className="flex items-center gap-2 mt-1.5 justify-center sm:justify-start">
                  <DollarSign className="w-5 h-5" style={{ color: '#10B981' }} />
                  <span className="text-2xl font-bold text-[#E8E8E8]">{result.cpmRange}</span>
                </div>
                <p className="text-xs text-[#666666] mt-1">
                  For &ldquo;{topic}&rdquo; in {countryLabel} · {result.highValueTags.length} premium tags found
                </p>
              </div>
            </div>
          </div>

          {/* High-Value Tags */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" style={{ color: '#10B981' }} /> High-Value Tags
              </h4>
              <button onClick={handleCopyTags} className="flex items-center gap-1 text-[10px] font-medium hover:opacity-80 transition-opacity" style={{ color: '#10B981' }}>
                <Copy className="w-3 h-3" /> Copy All Tags
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.highValueTags.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-colors hover:border-[rgba(16,185,129,0.3)]" style={{ backgroundColor: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.12)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#10B981' }} />
                    <span className="text-sm text-[#E8E8E8] truncate">{t.tag}</span>
                  </div>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: '#10B981' }}>{t.cpmImpact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Keywords */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10B981' }} /> Revenue Keywords
              </h4>
              <button onClick={handleCopyKeywords} className="flex items-center gap-1 text-[10px] font-medium hover:opacity-80 transition-opacity" style={{ color: '#10B981' }}>
                <Copy className="w-3 h-3" /> Copy All
              </button>
            </div>
            <div className="space-y-2">
              {result.revenueKeywords.map((k, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" style={{ color: '#FDBA2D' }} />
                    <span className="text-sm text-[#E8E8E8]">{k.phrase}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded shrink-0" style={{ color: '#FDBA2D', backgroundColor: 'rgba(253,186,45,0.1)' }}>
                    {k.multiplier}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CPM Multipliers */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#10B981' }} /> CPM Multiplier Words
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.cpmMultipliers.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg border" style={{ backgroundColor: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}>
                  <span className="text-sm font-bold text-[#E8E8E8]">{m.word}</span>
                  <span className="text-[10px] font-medium" style={{ color: '#10B981' }}>{m.effect}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Avoid Tags */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" /> Avoid Tags (Low-CPM)
            </h4>
            <div className="space-y-2">
              {result.avoidTags.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0D0D0D] border border-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.25)] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <XCircle className="w-3.5 h-3.5 shrink-0 text-[#EF4444]" />
                    <span className="text-sm text-[#EF4444]">{t.tag}</span>
                  </div>
                  <span className="text-[11px] text-[#666666] text-right shrink-0">{t.reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Tips */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <DollarSign className="w-3.5 h-3.5" style={{ color: '#10B981' }} /> Revenue Optimization Tips
            </h4>
            <div className="space-y-1.5">
              {result.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                    {i + 1}
                  </span>
                  <span className="text-[#888888] leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <Scale className="w-8 h-8" style={{ color: '#10B981' }} />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Find Revenue Tags</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">
            Enter a video topic to discover high-CPM tags and revenue-boosting keywords for your YouTube content.
          </p>
        </div>
      )}

      {/* Token Cost Footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS.arbitrage} tokens per analysis
        </div>
      )}
    </div>
  );
}
