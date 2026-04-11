'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  BarChart3,
  Eye,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';

/* ── Date Range Selector ── */
const DATE_RANGES = ['This Week', 'This Month', 'This Quarter', 'Custom'] as const;

/* ── Stat Card ── */
interface StatItem {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}

const STATS: StatItem[] = [
  {
    label: 'Total Views',
    value: '1.2M',
    change: '+12.5%',
    changeType: 'up',
    icon: <Eye className="w-4 h-4" />,
    color: '#4A9EFF',
    bg: 'rgba(74,158,255,0.1)',
    border: 'rgba(74,158,255,0.2)',
  },
  {
    label: 'Watch Time',
    value: '45.2K hrs',
    change: '+8.3%',
    changeType: 'up',
    icon: <Clock className="w-4 h-4" />,
    color: '#00C48C',
    bg: 'rgba(0,196,140,0.1)',
    border: 'rgba(0,196,140,0.2)',
  },
  {
    label: 'Subscribers',
    value: '247.8K',
    change: '+3.2%',
    changeType: 'up',
    icon: <Users className="w-4 h-4" />,
    color: '#9B72CF',
    bg: 'rgba(155,114,207,0.1)',
    border: 'rgba(155,114,207,0.2)',
  },
  {
    label: 'Revenue',
    value: '$3,420',
    change: '-2.1%',
    changeType: 'down',
    icon: <DollarSign className="w-4 h-4" />,
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.1)',
    border: 'rgba(245,166,35,0.2)',
  },
];

/* ── Bar Chart Data (Days of Week) ── */
const BAR_DATA = [
  { day: 'Mon', value: 65 },
  { day: 'Tue', value: 82 },
  { day: 'Wed', value: 45 },
  { day: 'Thu', value: 91 },
  { day: 'Fri', value: 73 },
  { day: 'Sat', value: 100 },
  { day: 'Sun', value: 58 },
];

export function AnalyticsTool() {
  const [activeRange, setActiveRange] = useState<string>('This Week');

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
              <BarChart3 className="w-5 h-5 text-[#4A9EFF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Analytics</h2>
              <p className="text-xs text-[#888888] mt-0.5">Deep dive into your channel performance metrics.</p>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-[#666666] shrink-0" />
            {DATE_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeRange === range
                    ? 'bg-[#4A9EFF] text-[#0A0A0A]'
                    : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#888888] hover:text-[#E8E8E8]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#2A2A2A] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: stat.bg, color: stat.color }}
              >
                {stat.icon}
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stat.changeType === 'up'
                    ? 'text-[#00C48C] bg-[rgba(0,196,140,0.1)]'
                    : 'text-[#E05252] bg-[rgba(224,82,82,0.1)]'
                }`}
              >
                {stat.changeType === 'up' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-xl font-bold text-[#E8E8E8]">{stat.value}</p>
            <p className="text-xs text-[#888888] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#4A9EFF]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Views by Day</h3>
          </div>
          <span className="text-xs text-[#888888]">Last 7 days</span>
        </div>

        {/* Chart Area */}
        <div className="flex items-end gap-2 sm:gap-3 h-48">
          {BAR_DATA.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              {/* Bar */}
              <div className="w-full relative group cursor-pointer" style={{ height: `${item.value}%` }}>
                <div
                  className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-[#4A9EFF]/20"
                  style={{
                    background: `linear-gradient(180deg, rgba(74,158,255,0.8) 0%, rgba(74,158,255,0.4) 100%)`,
                    height: '100%',
                    minHeight: '8px',
                  }}
                />
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#1A1A1A] border border-[#333333] text-[10px] font-semibold text-[#E8E8E8] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {Math.round(item.value * 12.5)}K views
                </div>
              </div>
              {/* Label */}
              <span className="text-[10px] sm:text-xs text-[#888888] font-medium">{item.day}</span>
            </div>
          ))}
        </div>

        {/* X-axis baseline */}
        <div className="mt-1 h-px bg-[#222222]" />
      </div>
    </div>
  );
}
