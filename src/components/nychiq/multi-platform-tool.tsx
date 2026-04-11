'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import { Monitor, Smartphone, Film, Share2, BarChart3, TrendingUp, Users, Eye, Heart } from 'lucide-react';

const PLATFORMS = [
  {
    id: 'youtube',
    label: 'YouTube',
    icon: <Monitor className="w-4 h-4" />,
    color: '#E05252',
    stats: { views: '2.4M', followers: '248K', engagement: '4.8%', revenue: '$3,420', videos: 156 },
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: <Smartphone className="w-4 h-4" />,
    color: '#4A9EFF',
    stats: { views: '1.8M', followers: '89K', engagement: '7.2%', revenue: '$890', videos: 320 },
  },
  {
    id: 'reels',
    label: 'Instagram Reels',
    icon: <Film className="w-4 h-4" />,
    color: '#E0529A',
    stats: { views: '920K', followers: '45K', engagement: '6.1%', revenue: '$340', videos: 210 },
  },
  {
    id: 'shorts',
    label: 'YouTube Shorts',
    icon: <Film className="w-4 h-4" />,
    color: '#E05252',
    stats: { views: '3.1M', followers: '—', engagement: '5.4%', revenue: '$1,120', videos: 89 },
  },
];

const COMPARISON_METRICS = [
  { label: 'Total Views', youtube: '2.4M', tiktok: '1.8M', reels: '920K', shorts: '3.1M', best: 'shorts' },
  { label: 'Engagement Rate', youtube: '4.8%', tiktok: '7.2%', reels: '6.1%', shorts: '5.4%', best: 'tiktok' },
  { label: 'Growth Rate', youtube: '+3.2%', tiktok: '+8.5%', reels: '+5.1%', shorts: '+12.3%', best: 'shorts' },
  { label: 'Avg. Views/Post', youtube: '15.4K', tiktok: '5.6K', reels: '4.4K', shorts: '34.8K', best: 'shorts' },
];

export function MultiPlatformTool() {
  const [activePlatform, setActivePlatform] = useState('youtube');
  const platform = PLATFORMS.find((p) => p.id === activePlatform)!;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
            <Share2 className="w-5 h-5 text-[#4A9EFF]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Multi-Platform Analytics</h2>
            <p className="text-xs text-[#888888] mt-0.5">Track YouTube, TikTok, Instagram Reels & Shorts in one unified dashboard.</p>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activePlatform === p.id
                  ? 'text-black shadow-lg'
                  : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#888888] hover:text-[#E8E8E8]'
              }`}
              style={activePlatform === p.id ? { backgroundColor: p.color, boxShadow: `0 0 20px ${p.color}40` } : {}}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(platform.stats).map(([key, value]) => {
          const labels: Record<string, string> = { views: 'Views', followers: 'Followers', engagement: 'Engagement', revenue: 'Revenue', videos: 'Videos' };
          const icons: Record<string, React.ReactNode> = {
            views: <Eye className="w-4 h-4" />, followers: <Users className="w-4 h-4" />,
            engagement: <Heart className="w-4 h-4" />, revenue: <TrendingUp className="w-4 h-4" />,
            videos: <Film className="w-4 h-4" />,
          };
          return (
            <div key={key} className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#333] transition-all">
              <div className="flex items-center gap-2 mb-2" style={{ color: platform.color }}>{icons[key]}</div>
              <p className="text-lg font-bold text-[#E8E8E8]">{value}</p>
              <p className="text-xs text-[#888888]">{labels[key]}</p>
            </div>
          );
        })}
      </div>

      {/* Cross-Platform Comparison */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#4A9EFF]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Cross-Platform Comparison</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left px-4 py-3 text-[#888888] font-semibold">Metric</th>
                {PLATFORMS.map((p) => (
                  <th key={p.id} className="text-right px-3 py-3 font-semibold" style={{ color: p.color }}>{p.label.split(' ')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_METRICS.map((row, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]/50 hover:bg-[#0D0D0D]/50 transition-colors">
                  <td className="px-4 py-3 text-[#E8E8E8] font-medium">{row.label}</td>
                  {['youtube', 'tiktok', 'reels', 'shorts'].map((pid) => (
                    <td key={pid} className={`text-right px-3 py-3 font-bold ${row.best === pid ? 'text-[#00C48C]' : 'text-[#888888]'}`}>
                      {row[pid as keyof typeof row]}
                      {row.best === pid && <span className="ml-1 text-[9px]">★</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
