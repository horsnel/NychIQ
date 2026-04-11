'use client';

import React from 'react';
import { DollarSign, TrendingUp, Wallet, Gift, Users, ShoppingBag } from 'lucide-react';

const BREAKDOWN = [
  { label: 'AdSense', value: 2450, percent: 58, color: '#4A9EFF', icon: <DollarSign className="w-4 h-4" /> },
  { label: 'Super Chat', value: 680, percent: 16, color: '#F5A623', icon: <Gift className="w-4 h-4" /> },
  { label: 'Memberships', value: 520, percent: 12, color: '#9B72CF', icon: <Users className="w-4 h-4" /> },
  { label: 'Merch Shelf', value: 570, percent: 14, color: '#00C48C', icon: <ShoppingBag className="w-4 h-4" /> },
];

const MONTHLY = [
  { month: 'Jun', value: 2800 }, { month: 'Jul', value: 3100 }, { month: 'Aug', value: 2950 },
  { month: 'Sep', value: 3400 }, { month: 'Oct', value: 3200 }, { month: 'Nov', value: 4220 },
];

const RPM_DATA = [
  { label: 'Overall RPM', value: '$8.42', change: '+12%', positive: true },
  { label: 'CPM', value: '$14.80', change: '+8%', positive: true },
  { label: 'Best Month RPM', value: '$11.20', change: 'Oct 2025', positive: true },
  { label: 'Niche Average RPM', value: '$6.50', change: 'You beat it by 29%', positive: true },
];

export function RevenueTrackerTool() {
  const total = BREAKDOWN.reduce((sum, b) => sum + b.value, 0);
  const maxMonth = Math.max(...MONTHLY.map((m) => m.value));

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
            <Wallet className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Revenue & Monetization Tracker</h2>
            <p className="text-xs text-[#888888] mt-0.5">RPM, CPM, AdSense, Super Chat, Memberships & Merch predictions.</p>
          </div>
        </div>
      </div>

      {/* Total Revenue + RPM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#888888]">Total Revenue (Nov)</span>
            <span className="flex items-center gap-1 text-[10px] text-[#00C48C] font-semibold"><TrendingUp className="w-3 h-3" /> +22%</span>
          </div>
          <p className="text-3xl font-bold text-[#F5A623]">${total.toLocaleString()}</p>
          <p className="text-[10px] text-[#666] mt-1">Estimated for November 2025</p>
        </div>
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#888888]">Current RPM</span>
            <span className="flex items-center gap-1 text-[10px] text-[#00C48C] font-semibold"><TrendingUp className="w-3 h-3" /> +12%</span>
          </div>
          <p className="text-3xl font-bold text-[#4A9EFF]">$8.42</p>
          <p className="text-[10px] text-[#666] mt-1">Per 1,000 views (est.)</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#E8E8E8] mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#F5A623]" /> Revenue Breakdown
        </h3>
        <div className="space-y-4">
          {BREAKDOWN.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span className="text-sm text-[#E8E8E8] font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#E8E8E8]">${item.value.toLocaleString()}</span>
                  <span className="text-[10px] text-[#888888]">{item.percent}%</span>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#0D0D0D] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#E8E8E8] mb-5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#F5A623]" /> Monthly Revenue Trend
        </h3>
        <div className="flex items-end gap-3 h-40">
          {MONTHLY.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] font-bold text-[#F5A623]">${(m.value / 1000).toFixed(1)}K</span>
              <div className="w-full rounded-t-md" style={{
                height: `${(m.value / maxMonth) * 100}%`,
                background: 'linear-gradient(180deg, rgba(245,166,35,0.8), rgba(245,166,35,0.3))',
                minHeight: '8px',
              }} />
              <span className="text-[10px] text-[#888888]">{m.month}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 h-px bg-[#222222]" />
      </div>

      {/* RPM Stats */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#E8E8E8] mb-4">RPM & CPM Insights</h3>
        <div className="grid grid-cols-2 gap-3">
          {RPM_DATA.map((item) => (
            <div key={item.label} className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3">
              <p className="text-[10px] text-[#888888]">{item.label}</p>
              <p className="text-base font-bold text-[#E8E8E8] mt-0.5">{item.value}</p>
              <p className="text-[10px] text-[#00C48C] mt-0.5">{item.change}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
