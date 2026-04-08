'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Handshake,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  DollarSign,
} from 'lucide-react';

const NICHES = ['Technology', 'Finance', 'Gaming', 'Lifestyle', 'Education', 'Health', 'Entertainment', 'Food', 'Beauty', 'Sports', 'Music', 'Business', 'Other'];

interface SponsorshipResult {
  minRate: number;
  midRate: number;
  premiumRate: number;
  ratePerKViews: number;
  ratePerKSubs: number;
  marketComparison: string;
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#00C48C] transition-colors" title="Copy">
      {copied ? <><Check className="w-3 h-3 text-[#00C48C]" /> Copied</> : <><Copy className="w-3 h-3" /> {label || 'Copy'}</>}
    </button>
  );
}

function PlanGate() {
  const { setUpgradeModalOpen } = useNychIQStore();
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="max-w-sm w-full rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mx-auto mb-4"><Lock className="w-7 h-7 text-[#F5A623]" /></div>
        <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">Sponsorship ROI Locked</h2>
        <p className="text-sm text-[#888888] mb-6">Upgrade your plan to access this feature.</p>
        <button onClick={() => setUpgradeModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"><Crown className="w-4 h-4" /> Upgrade Now</button>
      </div>
    </div>
  );
}

function fmtDollar(n: number): string {
  return `$${n.toLocaleString()}`;
}

export function SponsorshipTool() {
  const { canAccess } = useNychIQStore();
  const [subs, setSubs] = useState('');
  const [views, setViews] = useState('');
  const [niche, setNiche] = useState('Technology');
  const [engagement, setEngagement] = useState('');
  const [result, setResult] = useState<SponsorshipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleCalculate = async () => {
    const subsNum = parseInt(subs, 10) || 0;
    const viewsNum = parseInt(views, 10) || 0;
    const engNum = parseFloat(engagement) || 3;
    if (subsNum < 1 || viewsNum < 1) return;

    setLoading(true);
    setSearched(true);

    try {
      const prompt = `You are a YouTube sponsorship pricing expert. Calculate what a creator should charge for brand deals.

Channel stats:
- Subscribers: ${subsNum}
- Average views: ${viewsNum}
- Niche: ${niche}
- Engagement rate: ${engNum}%

Return a JSON object with:
- "minRate": minimum rate per integration (number in USD)
- "midRate": mid-range rate per integration (number)
- "premiumRate": premium rate per integration (number)
- "ratePerKViews": rate per 1,000 views (number)
- "ratePerKSubs": rate per 1,000 subscribers (number)
- "marketComparison": a brief paragraph comparing these rates to market averages

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        minRate: parseFloat(parsed.minRate) || 200,
        midRate: parseFloat(parsed.midRate) || 500,
        premiumRate: parseFloat(parsed.premiumRate) || 1000,
        ratePerKViews: parseFloat(parsed.ratePerKViews) || 20,
        ratePerKSubs: parseFloat(parsed.ratePerKSubs) || 10,
        marketComparison: parsed.marketComparison || 'Market data unavailable.',
      });
    } catch {
      // Calculate based on formulas
      const cpmMultiplier = { Technology: 1.3, Finance: 1.5, Gaming: 0.8, Lifestyle: 1.0, Education: 1.1, Health: 1.2, Entertainment: 0.6, Food: 0.7, Beauty: 1.0, Sports: 0.9, Music: 0.5, Business: 1.4, Other: 1.0 }[niche] || 1.0;
      const engMultiplier = engNum >= 8 ? 1.5 : engNum >= 5 ? 1.2 : engNum >= 3 ? 1.0 : 0.8;
      const baseRate = Math.max(100, (viewsNum / 1000) * 15 * cpmMultiplier * engMultiplier);
      setResult({
        minRate: Math.round(baseRate * 0.6),
        midRate: Math.round(baseRate),
        premiumRate: Math.round(baseRate * 1.8),
        ratePerKViews: Math.round(15 * cpmMultiplier * engMultiplier * 10) / 10,
        ratePerKSubs: Math.round((baseRate / Math.max(1, subsNum / 1000)) * 10) / 10,
        marketComparison: `Based on ${niche} niche benchmarks, your rates are ${baseRate > 500 ? 'above average' : baseRate > 200 ? 'within market range' : 'below average'}. Channels in the ${niche} space with similar metrics typically charge $${Math.round(baseRate * 0.5)}-$${Math.round(baseRate * 2)} per integration. Your engagement rate of ${engNum}% ${engNum >= 5 ? 'is strong and supports premium pricing' : 'could be improved to justify higher rates'}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess('sponsorship-roi')) return <PlanGate />;

  const rateCardText = result ? `Sponsorship Rate Card\n━━━━━━━━━━━━━━━━\nMinimum Rate: ${fmtDollar(result.minRate)}\nMid-Range Rate: ${fmtDollar(result.midRate)}\nPremium Rate: ${fmtDollar(result.premiumRate)}\nRate per 1K Views: ${fmtDollar(result.ratePerKViews)}\nRate per 1K Subs: ${fmtDollar(result.ratePerKSubs)}\n\n${result.marketComparison}` : '';

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]"><Handshake className="w-5 h-5 text-[#00C48C]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Sponsorship ROI Calculator</h2>
              <p className="text-xs text-[#888888] mt-0.5">Calculate exact what to charge for brand deals.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#666666] mb-1 block">Subscriber Count</label>
              <input type="number" value={subs} onChange={(e) => setSubs(e.target.value)} placeholder="e.g., 50000"
                className="w-full h-10 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#00C48C]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666666] mb-1 block">Average Views</label>
              <input type="number" value={views} onChange={(e) => setViews(e.target.value)} placeholder="e.g., 10000"
                className="w-full h-10 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#00C48C]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#666666] mb-1 block">Niche</label>
              <select value={niche} onChange={(e) => setNiche(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] focus:outline-none appearance-none cursor-pointer">
                {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#666666] mb-1 block">Engagement Rate (%)</label>
              <input type="number" step="0.1" value={engagement} onChange={(e) => setEngagement(e.target.value)} placeholder="e.g., 4.5"
                className="w-full h-10 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#00C48C]/50 transition-colors"
              />
            </div>
          </div>
          <button onClick={handleCalculate} disabled={loading || !subs || !views} className="w-full sm:w-auto mt-3 px-5 h-11 rounded-lg bg-[#00C48C] text-[#0A0A0A] text-sm font-bold hover:bg-[#00B07C] transition-colors disabled:opacity-50 flex items-center gap-2 justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            Calculate Rates
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00C48C] mx-auto mb-3" />
          <p className="text-sm text-[#888888]">Calculating sponsorship rates...</p>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#00C48C]" /> Your Rate Card</h3>
            <CopyBtn text={rateCardText} label="Copy Rate Card" />
          </div>

          {/* Rate Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 text-center">
              <p className="text-[10px] text-[#666666] uppercase mb-1">Minimum Rate</p>
              <p className="text-2xl font-bold text-[#4A9EFF]">{fmtDollar(result.minRate)}</p>
              <p className="text-[10px] text-[#666666] mt-1">per integration</p>
            </div>
            <div className="rounded-lg bg-[#111111] border border-[rgba(0,196,140,0.3)] p-4 text-center">
              <p className="text-[10px] text-[#666666] uppercase mb-1">Mid-Range Rate</p>
              <p className="text-2xl font-bold text-[#00C48C]">{fmtDollar(result.midRate)}</p>
              <p className="text-[10px] text-[#666666] mt-1">per integration</p>
            </div>
            <div className="rounded-lg bg-[#111111] border border-[rgba(245,166,35,0.3)] p-4 text-center">
              <p className="text-[10px] text-[#666666] uppercase mb-1">Premium Rate</p>
              <p className="text-2xl font-bold text-[#F5A623]">{fmtDollar(result.premiumRate)}</p>
              <p className="text-[10px] text-[#666666] mt-1">per integration</p>
            </div>
          </div>

          {/* Per-metric rates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
              <p className="text-[10px] text-[#666666] uppercase">Per 1K Views</p>
              <p className="text-lg font-bold text-[#E8E8E8]">{fmtDollar(result.ratePerKViews)}</p>
            </div>
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
              <p className="text-[10px] text-[#666666] uppercase">Per 1K Subs</p>
              <p className="text-lg font-bold text-[#E8E8E8]">{fmtDollar(result.ratePerKSubs)}</p>
            </div>
          </div>

          {/* Market Comparison */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">Market Comparison</h4>
            <p className="text-sm text-[#E8E8E8] leading-relaxed">{result.marketComparison}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)] flex items-center justify-center mb-4"><Handshake className="w-8 h-8 text-[#00C48C]" /></div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Calculate Your Worth</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Enter your channel stats to get a detailed sponsorship rate card.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['sponsorship-roi']} tokens per calculation</div>}
    </div>
  );
}
