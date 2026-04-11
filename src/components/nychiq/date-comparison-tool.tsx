'use client';

import React, { useState } from 'react';
import { Calendar, BarChart3, ArrowLeftRight, TrendingUp, TrendingDown } from 'lucide-react';

const PRESETS = ['7 days', '28 days', '90 days', '12 months', 'Custom'];

const MOCK_DATA: Record<string, { views: string; subs: string; watchTime: string; revenue: string; ctr: string }> = {
  '7 days': { views: '84.2K', subs: '+1,247', watchTime: '1,820 hrs', revenue: '$842', ctr: '7.8%' },
  '28 days': { views: '342K', subs: '+4,890', watchTime: '7,240 hrs', revenue: '$3,420', ctr: '7.2%' },
  '90 days': { views: '1.1M', subs: '+14.2K', watchTime: '22K hrs', revenue: '$10,800', ctr: '7.5%' },
  '12 months': { views: '4.8M', subs: '+52K', watchTime: '89K hrs', revenue: '$42,600', ctr: '6.9%' },
};

const CHANGES: Record<string, { views: string; subs: string; watchTime: string; revenue: string; ctr: string }> = {
  '7 days': { views: '+18%', subs: '+12%', watchTime: '+8%', revenue: '+22%', ctr: '+0.3%' },
  '28 days': { views: '+24%', subs: '+15%', watchTime: '+12%', revenue: '+28%', ctr: '+0.5%' },
  '90 days': { views: '+45%', subs: '+38%', watchTime: '+32%', revenue: '+52%', ctr: '+1.1%' },
  '12 months': { views: '+120%', subs: '+85%', watchTime: '+95%', revenue: '+145%', ctr: '+1.8%' },
};

const METRICS = [
  { key: 'views', label: 'Views', color: '#4A9EFF' },
  { key: 'subs', label: 'Subscribers', color: '#9B72CF' },
  { key: 'watchTime', label: 'Watch Time', color: '#00C48C' },
  { key: 'revenue', label: 'Revenue', color: '#F5A623' },
  { key: 'ctr', label: 'Avg CTR', color: '#E05252' },
];

export function DateComparisonTool() {
  const [periodA, setPeriodA] = useState('28 days');
  const [periodB, setPeriodB] = useState('7 days');

  const dataA = MOCK_DATA[periodA];
  const dataB = MOCK_DATA[periodB];
  const changeA = CHANGES[periodA];
  const changeB = CHANGES[periodB];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
            <Calendar className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Date Comparison</h2>
            <p className="text-xs text-[#888888] mt-0.5">Compare any two periods side-by-side.</p>
          </div>
        </div>

        {/* Period Selectors */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-[#666] font-semibold uppercase tracking-wider mb-1.5 block">Period A</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setPeriodA(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${periodA === p ? 'bg-[#9B72CF] text-black' : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#888]'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center py-2 sm:py-0">
            <ArrowLeftRight className="w-4 h-4 text-[#555]" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-[#666] font-semibold uppercase tracking-wider mb-1.5 block">Period B</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setPeriodB(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${periodB === p ? 'bg-[#4A9EFF] text-black' : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#888]'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left px-4 py-3 text-[#888888] font-semibold text-xs">Metric</th>
                <th className="text-right px-4 py-3 text-[#9B72CF] font-semibold text-xs">Period A</th>
                <th className="text-right px-4 py-3 text-[#4A9EFF] font-semibold text-xs">Period B</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m, i) => (
                <tr key={m.key} className="border-b border-[#1A1A1A]/50 hover:bg-[#0D0D0D]/50">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="text-[#E8E8E8] font-medium">{m.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-bold text-[#E8E8E8]">{dataA[m.key as keyof typeof dataA]}</span>
                    <span className="ml-2 text-[10px] text-[#00C48C] font-semibold">{changeA[m.key as keyof typeof changeA]}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-bold text-[#E8E8E8]">{dataB[m.key as keyof typeof dataB]}</span>
                    <span className="ml-2 text-[10px] text-[#00C48C] font-semibold">{changeB[m.key as keyof typeof changeB]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison Bars */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-[#9B72CF]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Visual Comparison</h3>
        </div>
        <div className="space-y-4">
          {METRICS.map((m) => (
            <div key={m.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#888888]">{m.label}</span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-[#9B72CF] font-semibold">{dataA[m.key as keyof typeof dataA]}</span>
                  <span className="text-[#4A9EFF] font-semibold">{dataB[m.key as keyof typeof dataB]}</span>
                </div>
              </div>
              <div className="flex gap-1.5 h-3">
                <div className="flex-1 bg-[#0D0D0D] rounded-full overflow-hidden flex">
                  <div className="h-full rounded-full bg-[#9B72CF]/60 transition-all duration-500" style={{ width: `${m.key === 'ctr' ? 78 : 65}%` }} />
                </div>
                <div className="flex-1 bg-[#0D0D0D] rounded-full overflow-hidden flex">
                  <div className="h-full rounded-full bg-[#4A9EFF]/60 transition-all duration-500" style={{ width: `${m.key === 'ctr' ? 82 : 45}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
