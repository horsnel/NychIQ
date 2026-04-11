'use client';

import React, { useState, useEffect } from 'react';
import { useNychIQStore } from '@/lib/store';
import { Activity, Eye, Clock, DollarSign, TrendingUp, Wifi } from 'lucide-react';

export function RealTimeAnalyticsTool() {
  const [subs, setSubs] = useState(247842);
  const [watchTime, setWatchTime] = useState(14520);
  const [revenue, setRevenue] = useState(342.18);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSubs((prev) => prev + Math.floor(Math.random() * 3));
      setWatchTime((prev) => prev + Math.floor(Math.random() * 15));
      setRevenue((prev) => prev + Math.random() * 0.5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const hourlyViews = [42, 58, 35, 67, 89, 120, 95, 78, 145, 112, 88, 156];
  const maxViews = Math.max(...hourlyViews);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
            <Wifi className="w-5 h-5 text-[#00C48C]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#E8E8E8]">Real-Time Analytics</h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.3)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C48C] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C48C]" />
                </span>
                <span className="text-[10px] font-bold text-[#00C48C]">LIVE</span>
              </span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">Live metrics updating every few seconds.</p>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Subscribers */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-[rgba(155,114,207,0.1)]"><Users className="w-4 h-4 text-[#9B72CF]" /></div>
            <span className="text-xs text-[#888888]">Subscribers</span>
          </div>
          <p className="text-2xl font-bold text-[#E8E8E8] tabular-nums">{subs.toLocaleString()}</p>
          <span className="text-[10px] text-[#00C48C] font-semibold">+{Math.floor(Math.random() * 5 + 1)} just now</span>
        </div>

        {/* Watch Time */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-[rgba(74,158,255,0.1)]"><Clock className="w-4 h-4 text-[#4A9EFF]" /></div>
            <span className="text-xs text-[#888888]">Watch Time (hrs today)</span>
          </div>
          <p className="text-2xl font-bold text-[#E8E8E8] tabular-nums">{watchTime.toLocaleString()}</p>
          <span className="text-[10px] text-[#00C48C] font-semibold">↑ Live updating</span>
        </div>

        {/* Revenue */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-md bg-[rgba(245,166,35,0.1)]"><DollarSign className="w-4 h-4 text-[#F5A623]" /></div>
            <span className="text-xs text-[#888888]">Revenue Today</span>
          </div>
          <p className="text-2xl font-bold text-[#E8E8E8] tabular-nums">${revenue.toFixed(2)}</p>
          <span className="text-[10px] text-[#00C48C] font-semibold">↑ Est. AdSense</span>
        </div>
      </div>

      {/* Hourly Views Chart */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#4A9EFF]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Views per Hour (Last 12h)</h3>
          </div>
          <span className="text-[10px] text-[#888888]">Auto-refreshing</span>
        </div>
        <div className="flex items-end gap-2 h-40">
          {hourlyViews.map((views, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${(views / maxViews) * 100}%`,
                  background: `linear-gradient(180deg, rgba(74,158,255,0.8), rgba(74,158,255,0.3))`,
                  minHeight: '4px',
                }}
              />
              <span className="text-[9px] text-[#666]">{i % 2 === 0 ? `${12 + i}:00` : ''}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 h-px bg-[#222222]" />
      </div>
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
