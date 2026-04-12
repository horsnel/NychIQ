'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Target,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Bot,
  TrendingUp,
  Zap,
  Rocket,
  DollarSign,
  Calendar,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

/* ── Types ── */
interface Phase {
  name: string;
  icon: React.ElementType;
  color: string;
  subsRange: string;
  timeline: string;
  goals: string[];
  strategies: string[];
}

interface RoadmapResult {
  niche: string;
  currentSubs: number;
  currentViews: number;
  viewsFor1K: number;
  rpmBenchmark: number;
  currentPhase: number;
  phases: Phase[];
  seasonalPredictions: string[];
  bottlenecks: string[];
  advice: string;
}

/* ── Phase Icon Map ── */
const PHASE_CONFIG = [
  { name: 'Foundation', icon: Zap, color: '#3B82F6', subsRange: '0 → 1K' },
  { name: 'Acceleration', icon: Rocket, color: '#FDBA2D', subsRange: '1K → 10K' },
  { name: 'Diversification', icon: DollarSign, color: '#10B981', subsRange: '$1K/mo+' },
];

/* ── Phase card ── */
function PhaseCard({ phase, index, isActive, totalPhases }: { phase: Phase; index: number; isActive: boolean; totalPhases: number }) {
  const Icon = phase.icon;

  return (
    <div className="rounded-lg bg-[#141414] border overflow-hidden transition-all duration-300" style={{ borderColor: isActive ? phase.color + '60' : '#1F1F1F' }}>
      {/* Phase header */}
      <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${phase.color}15` }}>
            <Icon className="w-4 h-4" style={{ color: phase.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold" style={{ color: phase.color }}>PHASE {index + 1}</span>
              {isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: `${phase.color}20`, color: phase.color }}>YOU ARE HERE</span>}
            </div>
            <h4 className="text-sm font-bold text-[#FFFFFF]">{phase.name}</h4>
          </div>
        </div>
        <span className="text-[10px] font-medium text-[#666666]">{phase.timeline}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Subscribers range */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
          <Target className="w-3.5 h-3.5 text-[#666666]" />
          <span className="text-[11px] text-[#A3A3A3]">{phase.subsRange}</span>
        </div>

        {/* Goals */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-2">Goals</h5>
          <ul className="space-y-1">
            {phase.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#A3A3A3]">
                <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: phase.color }} />
                {g}
              </li>
            ))}
          </ul>
        </div>

        {/* Strategies */}
        <div>
          <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-2">Strategy</h5>
          <ul className="space-y-1">
            {phase.strategies.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#A3A3A3]">
                <Sparkles className="w-3 h-3 shrink-0 mt-0.5" style={{ color: phase.color }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Mock fallback ── */
function mockRoadmap(niche: string, subs: number, views: number): RoadmapResult {
  const currentPhase = subs < 1000 ? 0 : subs < 10000 ? 1 : 2;
  const rpm = +(Math.random() * 15 + 4).toFixed(2);
  return {
    niche,
    currentSubs: subs,
    currentViews: views,
    viewsFor1K: Math.ceil((1000 / (rpm * 0.55)) * 1000),
    rpmBenchmark: rpm,
    currentPhase,
    phases: [
      {
        name: 'Foundation',
        icon: Zap,
        color: '#3B82F6',
        subsRange: '0 → 1K subscribers',
        timeline: '3-6 months',
        goals: [
          'Reach 1,000 subscribers and 4,000 watch hours',
          'Establish consistent upload schedule (2x/week)',
          'Find your unique content angle in ' + niche,
          'Build a recognizable brand and thumbnail style',
        ],
        strategies: [
          'Focus on search-optimized "how-to" content',
          'Create 3 pillar videos that demonstrate expertise',
          'Engage every comment in the first hour of upload',
          'Cross-promote on X and relevant subreddits',
        ],
      },
      {
        name: 'Acceleration',
        icon: Rocket,
        color: '#FDBA2D',
        subsRange: '1K → 10K subscribers',
        timeline: '6-12 months',
        goals: [
          'Scale to 10K subscribers with viral potential',
          'Grow average views from 500 to 5K+ per video',
          'Monetize via AdSense + first sponsorship deal',
          'Build a community (Discord, email list)',
        ],
        strategies: [
          'Double down on top-performing content formats',
          'Launch a series or recurring content theme',
          'Collaborate with creators in adjacent niches',
          'Invest in better thumbnails and editing',
        ],
      },
      {
        name: 'Diversification',
        icon: DollarSign,
        color: '#10B981',
        subsRange: '$1K/month revenue+',
        timeline: '12-18 months',
        goals: [
          'Reach consistent $1,000+ monthly revenue',
          'Diversify income (sponsorships, affiliates, products)',
          'Scale to 50K+ subscribers',
          'Build systems for content batching and scheduling',
        ],
        strategies: [
          'Launch a digital product or course in ' + niche,
          'Negotiate long-term brand deals',
          'Hire a video editor to increase output',
          'Expand to Shorts for channel discovery',
        ],
      },
    ],
    seasonalPredictions: [
      `CPM in ${niche} typically peaks during Q4 (Oct-Dec) due to holiday advertising budgets — plan high-value content then.`,
      `Q1 (Jan-Mar) often sees a CPM dip of 15-25% as advertisers reset budgets after the holidays.`,
      `Summer months (Jun-Aug) may have lower viewership for educational ${niche} content — consider lighter, entertainment-style videos.`,
    ],
    bottlenecks: [
      `Your current subscriber count (${subs.toLocaleString()}) means limited algorithm push — focus on improving click-through rate above 5%.`,
      `${niche} has moderate competition — differentiating with a unique format or personality is critical before Phase 2.`,
      views < 5000 ? 'Your monthly view count is low — prioritize discoverability (SEO, Shorts) over production quality.' : 'Your views are growing — now focus on watch time and engagement to signal the algorithm.',
    ],
    advice: `For the ${niche} niche, your path to $1K/month requires approximately ${Math.ceil((1000 / (rpm * 0.55)) * 1000).toLocaleString()} monthly views at the niche RPM of $${rpm}. Start by doubling your upload frequency and optimizing every title for search. The biggest lever right now is improving your CTR to unlock the algorithm's recommendation engine.`,
  };
}

/* ── Main Component ── */
export function MonetizationRoadmapTool() {
  const { spendTokens } = useNychIQStore();
  const [niche, setNiche] = useState('');
  const [subs, setSubs] = useState('');
  const [views, setViews] = useState('');
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const n = niche.trim();
    const s = parseInt(subs, 10) || 0;
    const v = parseInt(views, 10) || 0;
    if (!n) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('monetization-roadmap');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube monetization strategist. Create a 3-phase monetization roadmap for a creator in the "${n}" niche.

Current stats:
- Subscribers: ${s}
- Monthly Views: ${v}

Return a JSON object with:
- "niche": "${n}"
- "currentSubs": ${s}
- "currentViews": ${v}
- "viewsFor1K": estimated monthly views needed to earn $1K/month (number)
- "rpmBenchmark": estimated RPM for this niche in dollars (number, 1-30)
- "currentPhase": 0 if subs<1000, 1 if subs<10000, else 2 (number)
- "phases": Array of 3 objects, each with: "name" (string), "subsRange" (string), "timeline" (string), "goals" (array of 4 strings), "strategies" (array of 4 strings)
- "seasonalPredictions": Array of 3 strings about when CPM rises/drops for this niche
- "bottlenecks": Array of 3 strings identifying the biggest growth bottlenecks
- "advice": 2-3 sentences of strategic advice

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const phases = Array.isArray(parsed.phases)
        ? parsed.phases.map((p: any, i: number) => ({
            ...PHASE_CONFIG[i],
            name: p.name || PHASE_CONFIG[i].name,
            subsRange: p.subsRange || PHASE_CONFIG[i].subsRange,
            timeline: p.timeline || '3-6 months',
            goals: Array.isArray(p.goals) ? p.goals.slice(0, 4) : ['Build channel authority'],
            strategies: Array.isArray(p.strategies) ? p.strategies.slice(0, 4) : ['Focus on consistency'],
          }))
        : [];

      setResult({
        niche: parsed.niche || n,
        currentSubs: parsed.currentSubs ?? s,
        currentViews: parsed.currentViews ?? v,
        viewsFor1K: Number(parsed.viewsFor1K) || Math.ceil((1000 / 5) * 1000),
        rpmBenchmark: Number(parsed.rpmBenchmark) || 8,
        currentPhase: Number(parsed.currentPhase) || 0,
        phases: phases.length === 3 ? phases : mockRoadmap(n, s, v).phases,
        seasonalPredictions: Array.isArray(parsed.seasonalPredictions) ? parsed.seasonalPredictions.slice(0, 3) : [],
        bottlenecks: Array.isArray(parsed.bottlenecks) ? parsed.bottlenecks.slice(0, 3) : [],
        advice: parsed.advice || 'Focus on consistency and audience growth.',
      });
    } catch {
      setResult(mockRoadmap(n, s, v));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `Revenue Roadmap: ${result.niche}\nViews for $1K/mo: ${result.viewsFor1K.toLocaleString()}\nRPM: $${result.rpmBenchmark}\n\n${result.advice}`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const powerLevel = result ? Math.min(100, Math.round((result.currentSubs / 10000) * 100)) : 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(253,186,45,0.1)' }}>
              <Target className="w-5 h-5" style={{ color: '#FDBA2D' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Revenue Roadmap</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                3-phase monetization roadmap from $0 to $1,000/month
              </p>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                placeholder="Your niche..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 focus:ring-1 focus:ring-[#FDBA2D]/20 transition-colors"
              />
            </div>
            <input
              type="number"
              value={subs}
              onChange={(e) => setSubs(e.target.value)}
              placeholder="Current subscribers"
              className="w-full h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 focus:ring-1 focus:ring-[#FDBA2D]/20 transition-colors"
            />
            <input
              type="number"
              value={views}
              onChange={(e) => setViews(e.target.value)}
              placeholder="Monthly views"
              className="w-full h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 focus:ring-1 focus:ring-[#FDBA2D]/20 transition-colors"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !niche.trim()}
            className="w-full mt-3 px-5 h-11 rounded-lg text-[#0D0D0D] text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: '#FDBA2D' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            Generate Roadmap
          </button>
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

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
            <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-2/3 mb-4" />
            <div className="h-3 rounded-full bg-[#1A1A1A] animate-pulse" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5 space-y-3">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <>
          {/* Power Level + Key Metrics */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: '#FDBA2D' }} />
                <h3 className="text-sm font-bold text-[#FFFFFF]">Power Level</h3>
                <span className="ml-auto text-xs font-bold" style={{ color: '#FDBA2D' }}>{powerLevel}%</span>
              </div>
              <div className="h-3 rounded-full bg-[#1A1A1A] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${powerLevel}%`, background: `linear-gradient(90deg, #3B82F6, #FDBA2D, #10B981)` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#555555]">
                <span>0 subs</span>
                <span>1K</span>
                <span>10K</span>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <p className="text-base font-bold text-[#10B981]">{result.viewsFor1K.toLocaleString()}</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5">Views for $1K/mo</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <p className="text-base font-bold text-[#FDBA2D]">${result.rpmBenchmark}</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5">RPM Benchmark</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] col-span-2 sm:col-span-1">
                  <p className="text-base font-bold text-[#3B82F6]">{result.currentSubs.toLocaleString()}</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5">Current Subs</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Phase Timeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <BarChart3 className="w-4 h-4" style={{ color: '#FDBA2D' }} />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">3-Phase Roadmap</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {result.phases.map((phase, i) => (
                <PhaseCard key={i} phase={phase} index={i} isActive={i === result.currentPhase} totalPhases={3} />
              ))}
            </div>
          </div>

          {/* Seasonal Predictions */}
          {result.seasonalPredictions.length > 0 && (
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                <Calendar className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Seasonal Predictions</h3>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {result.seasonalPredictions.map((pred, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-xs text-[#A3A3A3] leading-relaxed">{pred}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottleneck Detection */}
          {result.bottlenecks.length > 0 && (
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Bottleneck Detection</h3>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {result.bottlenecks.map((b, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-xs text-[#A3A3A3] leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Advice */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#FDBA2D' }} />
                <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Strategic Advice</h3>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#FDBA2D] transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(253,186,45,0.1)' }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: '#FDBA2D' }} />
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{result.advice}</p>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <div className="flex justify-center">
            <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#A3A3A3] hover:text-[#FDBA2D] transition-colors">
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          </div>
        </>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.2)' }}>
            <Target className="w-8 h-8" style={{ color: '#FDBA2D' }} />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Your Revenue Roadmap</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">
            Enter your niche and current stats to get a personalized 3-phase monetization roadmap to $1,000/month.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS['monetization-roadmap']} tokens per analysis
        </div>
      )}
    </div>
  );
}
