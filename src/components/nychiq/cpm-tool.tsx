'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { cn, fmtV } from '@/lib/utils';
import {
  DollarSign,
  Loader2,
  Calculator,
  TrendingUp,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface CPMEntry {
  niche: string;
  cpm: number;
  rpm: number;
  change: number;
  color: string;
  competition: 'Low' | 'Medium' | 'High';
}

export function CPMTool() {
  const { spendTokens, region } = useNychIQStore();
  const [monthlyViews, setMonthlyViews] = useState('100000');
  const [selectedNiche, setSelectedNiche] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cpmData, setCpmData] = useState<CPMEntry[]>([]);

  const loadCPMData = async () => {
    setLoading(true);
    setError(null);
    const ok = spendTokens('cpm');
    if (!ok) { setLoading(false); return; }
    try {
      const prompt = `You are a YouTube monetization expert. Analyze current YouTube CPM (cost per mille) rates for the ${region} market. Provide CPM data for 8 popular niches.

Return ONLY a JSON array (no other text):
[{"niche":"Finance","cpm":22.40,"change":12.3,"competition":"Medium"},{"niche":"Business","cpm":20.10,"change":8.7,"competition":"High"}]

Rules:
- cpm: realistic CPM in USD for the ${region} market (consider local ad buying power)
- change: monthly percentage change (-10 to +20)
- competition: "Low", "Medium", or "High" based on creator saturation
- Include these niches: Finance, Business, AI/Tech, Health, Fitness, Education, Food/Cooking, Gaming, Entertainment, News, Beauty, Sports
- Pick the 8 highest-CPM niches
- Make CPMs realistic: ${region} market typically has lower CPMs than US
- Sort by CPM descending`;

      const text = await askAI(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const data = parsed.map((entry: any) => ({
            niche: entry.niche,
            cpm: typeof entry.cpm === 'number' ? entry.cpm : 10,
            rpm: typeof entry.cpm === 'number' ? +(entry.cpm * 0.45).toFixed(2) : 4.50,
            change: typeof entry.change === 'number' ? entry.change : 0,
            color: (entry.competition === 'Low' ? '#10B981' : entry.competition === 'High' ? '#EF4444' : '#FDBA2D'),
            competition: ['Low', 'Medium', 'High'].includes(entry.competition) ? entry.competition : 'Medium',
          }));
          setCpmData(data);
          setSelectedNiche(0);
        } else {
          setCpmData([]);
          setError('Could not parse CPM data. Please try again.');
        }
      } else {
        setError('Could not fetch CPM data. Please try again.');
      }
    } catch {
      setError('Failed to load CPM rates. Please try again.');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const handleViewsChange = (val: string) => {
    setMonthlyViews(val);
    if (!hasLoaded) loadCPMData();
  };

  const handleNicheChange = (idx: number) => {
    setSelectedNiche(idx);
  };

  const views = parseInt(monthlyViews.replace(/[^0-9]/g, ''), 10) || 0;
  const cpm = cpmData.length > 0 ? cpmData[selectedNiche]?.cpm ?? 10 : 10;
  const rpm = cpmData.length > 0 ? cpmData[selectedNiche]?.rpm ?? 4.50 : 4.50;
  const revenue = (views / 1000) * cpm;
  const yearlyRevenue = revenue * 12;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(16,185,129,0.1)]">
              <DollarSign className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">CPM Estimator</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                AI-powered YouTube AdSense revenue estimation for {region}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!hasLoaded && (
        <button
          onClick={loadCPMData}
          disabled={loading}
          className="w-full p-4 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#10B981]/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-[#FFFFFF]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#10B981]" />}
          {loading ? 'Loading CPM rates...' : `Load CPM Rates for ${region}`}
          <span className="text-[10px] text-[#FDBA2D] ml-2">({TOKEN_COSTS.cpm} tokens)</span>
        </button>
      )}

      {/* CPM Rates Table */}
      {hasLoaded && (
        <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FDBA2D]" />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">CPM Rates by Niche — {region}</h3>
            </div>
            <button onClick={loadCPMData} disabled={loading} className="text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#EF4444]">{error}</p>
              <button onClick={loadCPMData} className="mt-2 text-xs text-[#FDBA2D] underline">Try Again</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider">Niche</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider">CPM</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider">RPM</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider">MoM</th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider">Competition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {cpmData.map((entry, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'transition-colors cursor-pointer',
                        selectedNiche === i ? 'bg-[#FDBA2D]/5' : 'hover:bg-[#0D0D0D]/50'
                      )}
                      onClick={() => handleNicheChange(i)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-[#FFFFFF]">{entry.niche}</span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3">
                        <span className="text-sm font-semibold text-[#10B981]">${entry.cpm.toFixed(2)}</span>
                      </td>
                      <td className="text-right px-4 py-3">
                        <span className="text-sm font-semibold text-[#3B82F6]">${entry.rpm.toFixed(2)}</span>
                      </td>
                      <td className="text-right px-4 py-3">
                        <span className={cn('text-sm font-medium flex items-center justify-end gap-1', entry.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                          {entry.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {entry.change >= 0 ? '+' : ''}{entry.change}%
                        </span>
                      </td>
                      <td className="text-right px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                          color: entry.competition === 'Low' ? '#10B981' : entry.competition === 'Medium' ? '#FDBA2D' : '#EF4444',
                          backgroundColor: entry.competition === 'Low' ? 'rgba(16,185,129,0.1)' : entry.competition === 'Medium' ? 'rgba(253,186,45,0.1)' : 'rgba(239,68,68,0.1)',
                        }}>{entry.competition}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Revenue Calculator */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#222222]">
          <Calculator className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Revenue Calculator</h3>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A3A3A3] mb-2">Monthly Views</label>
              <div className="relative">
                <input
                  type="text"
                  value={monthlyViews}
                  onChange={(e) => handleViewsChange(e.target.value)}
                  placeholder="Enter monthly views..."
                  className="w-full h-11 pl-4 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['10K', '50K', '100K', '500K', '1M', '5M'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleViewsChange(preset)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                    monthlyViews === preset
                      ? 'bg-[#FDBA2D]/15 text-[#FDBA2D] border border-[#FDBA2D]/30'
                      : 'bg-[#0D0D0D] text-[#A3A3A3] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#FFFFFF]'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>

            {cpmData.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cpmData[selectedNiche].color }} />
                <span className="text-xs text-[#A3A3A3]">Selected:</span>
                <span className="text-xs font-semibold text-[#FFFFFF]">{cpmData[selectedNiche].niche}</span>
                <span className="text-xs text-[#A3A3A3]">(${cpmData[selectedNiche].cpm.toFixed(2)} CPM · ${cpmData[selectedNiche].rpm.toFixed(2)} RPM)</span>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 bg-[#0D0D0D] border border-[#1A1A1A] text-center">
              <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider mb-2">Monthly Revenue</p>
              <p className="text-2xl font-bold text-[#10B981]">
                ${hasLoaded ? revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
              </p>
            </div>
            <div className="rounded-lg p-4 bg-[#0D0D0D] border border-[#1A1A1A] text-center">
              <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider mb-2">Yearly Revenue</p>
              <p className="text-2xl font-bold text-[#3B82F6]">
                ${hasLoaded ? yearlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}
              </p>
            </div>
            <div className="rounded-lg p-4 bg-[#0D0D0D] border border-[#1A1A1A] text-center">
              <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider mb-2">RPM</p>
              <p className="text-2xl font-bold text-[#FDBA2D]">
                ${hasLoaded ? rpm.toFixed(2) : '—'}
              </p>
              <p className="text-[10px] text-[#666666] mt-1">~45% of CPM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.15)]">
        <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
        <p className="text-xs text-[#A3A3A3] leading-relaxed">
          CPM rates are AI-estimated for the {region} market based on current trends. RPM (Revenue Per Mille) is typically 40-55% of CPM after YouTube&apos;s 45% revenue share. Actual rates vary by seasonality, audience demographics, and video length.
        </p>
      </div>

      <div className="text-center text-[11px] text-[#444444]">
        Cost: {TOKEN_COSTS.cpm} tokens per load · Region: {region}
      </div>
    </div>
  );
}
