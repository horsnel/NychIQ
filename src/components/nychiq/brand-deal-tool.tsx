'use client';

import React, { useState } from 'react';
import {
  Handshake,
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles,
  Calculator,
  Award,
  Target,
} from 'lucide-react';

interface ChannelStats {
  subscribers: string;
  monthlyViews: string;
  avgViews: string;
  engagement: string;
}

interface BrandSuggestion {
  name: string;
  category: string;
  estimatedValue: string;
  matchScore: number;
}

const MOCK_STATS: ChannelStats = {
  subscribers: '125K',
  monthlyViews: '2.4M',
  avgViews: '85K',
  engagement: '6.2%',
};

const MOCK_BRANDS: BrandSuggestion[] = [
  { name: 'Skillshare', category: 'Education', estimatedValue: '$3,500 – $7,000', matchScore: 96 },
  { name: 'Notion', category: 'Productivity', estimatedValue: '$2,800 – $5,500', matchScore: 91 },
  { name: 'NordVPN', category: 'Tech/VPN', estimatedValue: '$4,200 – $8,000', matchScore: 88 },
  { name: 'Squarespace', category: 'Web/Design', estimatedValue: '$3,000 – $6,000', matchScore: 85 },
  { name: 'Raycon', category: 'Audio/Consumer', estimatedValue: '$2,500 – $5,000', matchScore: 78 },
];

const BENCHMARKS = [
  { label: 'CPM Rate', value: '$18.50', benchmark: '$14.00', status: 'above' },
  { label: 'Avg Sponsor Rate', value: '$4,200', benchmark: '$3,000', status: 'above' },
  { label: 'Engagement Rate', value: '6.2%', benchmark: '4.5%', status: 'above' },
  { label: 'Audience Age Match', value: '82%', benchmark: '75%', status: 'above' },
];

export function BrandDealTool() {
  const [stats] = useState<ChannelStats>(MOCK_STATS);
  const [customSubs, setCustomSubs] = useState('');
  const [customViews, setCustomViews] = useState('');

  const subs = customSubs || stats.subscribers;
  const views = customViews || stats.monthlyViews;

  const estimatedCpm = 18.5;
  const viewsNum = parseFloat(views.replace(/[^0-9.]/g, '')) || 2400;
  const subsNum = parseFloat(subs.replace(/[^0-9.]/g, '')) || 125;
  const estimatedSponsorRate = Math.round((viewsNum * 0.02 * estimatedCpm));
  const monthlyPotential = Math.round(estimatedSponsorRate * 2.5);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
            <Handshake className="w-5 h-5 text-[#00C48C]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Brand Deal Calculator</h2>
            <p className="text-xs text-[#888888] mt-0.5">Estimate sponsorship value and discover compatible brand partners.</p>
          </div>
        </div>

        {/* Channel Stats Input */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <label className="text-[10px] text-[#666] uppercase tracking-wider block mb-1">Subscribers</label>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#888]" />
              <input
                type="text"
                value={customSubs}
                onChange={(e) => setCustomSubs(e.target.value)}
                placeholder={stats.subscribers}
                className="flex-1 bg-transparent text-sm font-medium text-[#E8E8E8] outline-none placeholder:text-[#555]"
              />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <label className="text-[10px] text-[#666] uppercase tracking-wider block mb-1">Monthly Views</label>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#888]" />
              <input
                type="text"
                value={customViews}
                onChange={(e) => setCustomViews(e.target.value)}
                placeholder={stats.monthlyViews}
                className="flex-1 bg-transparent text-sm font-medium text-[#E8E8E8] outline-none placeholder:text-[#555]"
              />
            </div>
          </div>
        </div>

        {/* Calculator Results */}
        <div className="p-4 rounded-lg bg-[rgba(0,196,140,0.05)] border border-[rgba(0,196,140,0.15)]">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-[#00C48C]" />
            <span className="text-xs font-bold text-[#00C48C] uppercase tracking-wider">Estimated Sponsorship Value</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-[#00C48C]">${estimatedSponsorRate.toLocaleString()}</p>
              <p className="text-[10px] text-[#666] mt-0.5">Per Sponsored Video</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F5A623]">${monthlyPotential.toLocaleString()}</p>
              <p className="text-[10px] text-[#666] mt-0.5">Monthly Potential (2.5 deals)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compatible Brands */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
            Compatible Brands
          </h4>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {MOCK_BRANDS.map((brand, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[rgba(155,114,207,0.1)] flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-[#9B72CF]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#E8E8E8] truncate">{brand.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(74,158,255,0.1)] text-[#4A9EFF]">{brand.category}</span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-bold text-[#00C48C]">{brand.estimatedValue}</p>
                <p className="text-[10px] text-[#888]">{brand.matchScore}% match</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmarks */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-[#F5A623]" />
          Industry Benchmarks
        </h4>
        <div className="space-y-2">
          {BENCHMARKS.map((b, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
              <span className="text-sm text-[#AAAAAA]">{b.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#666]">vs {b.benchmark}</span>
                <span className={`text-xs font-bold ${b.status === 'above' ? 'text-[#00C48C]' : 'text-[#E05252]'}`}>
                  {b.value} ↑
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
