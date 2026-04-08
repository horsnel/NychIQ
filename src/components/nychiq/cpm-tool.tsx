'use client';

import React, { useState, useMemo } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { cn, fmtV } from '@/lib/utils';
import {
  DollarSign,
  Crown,
  Lock,
  Calculator,
  TrendingUp,
  Info,
} from 'lucide-react';

/* ── CPM Data ── */
interface CPMEntry {
  niche: string;
  cpm: number;
  change: number;
  color: string;
}

const CPM_DATA: CPMEntry[] = [
  { niche: 'Finance & Investing', cpm: 32.50, change: 12.3, color: '#00C48C' },
  { niche: 'Technology', cpm: 24.80, change: 8.7, color: '#4A9EFF' },
  { niche: 'Education', cpm: 18.40, change: -2.1, color: '#F5A623' },
  { niche: 'Health & Fitness', cpm: 15.20, change: 5.4, color: '#9B72CF' },
  { niche: 'Gaming', cpm: 8.60, change: -4.2, color: '#E05252' },
  { niche: 'Entertainment', cpm: 5.30, change: 1.8, color: '#F5A623' },
  { niche: 'Vlogs & Lifestyle', cpm: 3.80, change: -1.3, color: '#888888' },
  { niche: 'Music & Dance', cpm: 2.10, change: 3.6, color: '#9B72CF' },
];

/* ── Plan Gate ── */
function PlanGate() {
  const { setUpgradeModalOpen } = useNychIQStore();

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="max-w-sm w-full rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-[#F5A623]" />
        </div>
        <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">CPM Estimator Locked</h2>
        <p className="text-sm text-[#888888] mb-6">
          This feature requires the Elite plan or higher. Upgrade to access CPM analytics.
        </p>
        <button
          onClick={() => setUpgradeModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"
        >
          <Crown className="w-4 h-4" />
          Upgrade Now
        </button>
      </div>
    </div>
  );
}

/* ── Main CPM Tool ── */
export function CPMTool() {
  const { canAccess, spendTokens } = useNychIQStore();
  const [monthlyViews, setMonthlyViews] = useState('100000');
  const [selectedNiche, setSelectedNiche] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleLoad = () => {
    if (!hasLoaded) {
      const ok = spendTokens('cpm');
      if (!ok) return;
      setHasLoaded(true);
    }
  };

  // Calculate on any input change if already loaded
  const handleViewsChange = (val: string) => {
    setMonthlyViews(val);
    handleLoad();
  };

  const handleNicheChange = (idx: number) => {
    setSelectedNiche(idx);
    handleLoad();
  };

  // Revenue calculation
  const views = parseInt(monthlyViews.replace(/[^0-9]/g, ''), 10) || 0;
  const cpm = CPM_DATA[selectedNiche].cpm;
  const revenue = (views / 1000) * cpm;
  const yearlyRevenue = revenue * 12;

  if (!canAccess('cpm')) {
    return <PlanGate />;
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
              <DollarSign className="w-5 h-5 text-[#00C48C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">CPM Estimator</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Estimate your YouTube AdSense revenue
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CPM Rates Table */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#222222]">
          <TrendingUp className="w-4 h-4 text-[#F5A623]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">CPM Rates by Niche</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888888] uppercase tracking-wider">Niche</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[#888888] uppercase tracking-wider">CPM</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[#888888] uppercase tracking-wider">Change</th>
                <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[#888888] uppercase tracking-wider">Select</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {CPM_DATA.map((entry, i) => (
                <tr
                  key={i}
                  className={cn(
                    'transition-colors cursor-pointer',
                    selectedNiche === i ? 'bg-[#F5A623]/5' : 'hover:bg-[#0D0D0D]/50'
                  )}
                  onClick={() => handleNicheChange(i)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-[#E8E8E8]">{entry.niche}</span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className="text-sm font-semibold text-[#E8E8E8]">${entry.cpm.toFixed(2)}</span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        entry.change >= 0 ? 'text-[#00C48C]' : 'text-[#E05252]'
                      )}
                    >
                      {entry.change >= 0 ? '+' : ''}{entry.change}%
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 mx-auto transition-colors',
                        selectedNiche === i ? 'bg-[#F5A623] border-[#F5A623]' : 'border-[#444444]'
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Calculator */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#222222]">
          <Calculator className="w-4 h-4 text-[#4A9EFF]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Revenue Calculator</h3>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {/* Monthly Views Input */}
            <div>
              <label className="block text-xs font-medium text-[#888888] mb-2">Monthly Views</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <input
                  type="text"
                  value={monthlyViews}
                  onChange={(e) => handleViewsChange(e.target.value)}
                  placeholder="Enter monthly views..."
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 focus:ring-1 focus:ring-[#F5A623]/20 transition-colors"
                />
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {['10K', '50K', '100K', '500K', '1M', '5M'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleViewsChange(preset)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                    monthlyViews === preset
                      ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                      : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#E8E8E8]'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Selected Niche Display */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CPM_DATA[selectedNiche].color }} />
              <span className="text-xs text-[#888888]">Selected Niche:</span>
              <span className="text-xs font-semibold text-[#E8E8E8]">{CPM_DATA[selectedNiche].niche}</span>
              <span className="text-xs text-[#888888]">(${CPM_DATA[selectedNiche].cpm.toFixed(2)} CPM)</span>
            </div>
          </div>

          {/* Revenue Display */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 bg-[#0D0D0D] border border-[#1A1A1A] text-center">
              <p className="text-[11px] font-medium text-[#888888] uppercase tracking-wider mb-2">Monthly Revenue</p>
              <p className="text-2xl font-bold text-[#00C48C]">
                ${hasLoaded ? revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
              </p>
            </div>
            <div className="rounded-lg p-4 bg-[#0D0D0D] border border-[#1A1A1A] text-center">
              <p className="text-[11px] font-medium text-[#888888] uppercase tracking-wider mb-2">Yearly Revenue</p>
              <p className="text-2xl font-bold text-[#4A9EFF]">
                ${hasLoaded ? yearlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}
              </p>
            </div>
            <div className="rounded-lg p-4 bg-[#0D0D0D] border border-[#1A1A1A] text-center">
              <p className="text-[11px] font-medium text-[#888888] uppercase tracking-wider mb-2">RPM</p>
              <p className="text-2xl font-bold text-[#F5A623]">
                ${hasLoaded ? (cpm * 0.45).toFixed(2) : '—'}
              </p>
              <p className="text-[10px] text-[#666666] mt-1">~45% of CPM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(74,158,255,0.05)] border border-[rgba(74,158,255,0.15)]">
        <Info className="w-4 h-4 text-[#4A9EFF] shrink-0 mt-0.5" />
        <p className="text-xs text-[#888888] leading-relaxed">
          CPM rates are estimates based on industry averages and may vary by region, audience demographics, seasonality, and content type. RPM (Revenue Per Mille) is typically 45-55% of CPM after YouTube&apos;s revenue share.
        </p>
      </div>

      {/* Token cost footer */}
      <div className="text-center text-[11px] text-[#444444]">
        Cost: {TOKEN_COSTS.cpm} tokens per load
      </div>
    </div>
  );
}
