'use client';

import React, { useState } from 'react';
import {
  Tv,
  Plus,
  Users,
  Eye,
  BarChart3,
  TrendingUp,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  avatar: string;
  platform: string;
  subscribers: string;
  monthlyViews: string;
  engagement: string;
  connected: boolean;
  lastSync: string;
}

const MOCK_CHANNELS: Channel[] = [
  { id: '1', name: 'Tech Academy', avatar: 'TA', platform: 'YouTube', subscribers: '125K', monthlyViews: '2.4M', engagement: '6.2%', connected: true, lastSync: '2h ago' },
  { id: '2', name: 'Tech Shorts', avatar: 'TS', platform: 'YouTube', subscribers: '45K', monthlyViews: '890K', engagement: '8.1%', connected: true, lastSync: '30m ago' },
  { id: '3', name: '@techacademy', avatar: 'IG', platform: 'Instagram', subscribers: '28K', monthlyViews: '340K', engagement: '9.4%', connected: true, lastSync: '1h ago' },
  { id: '4', name: 'TechAcademy', avatar: 'TK', platform: 'TikTok', subscribers: '62K', monthlyViews: '1.8M', engagement: '11.2%', connected: true, lastSync: '15m ago' },
];

const COMPARISON_METRICS = [
  { label: 'Total Subscribers', youtube: '170K', instagram: '28K', tiktok: '62K' },
  { label: 'Monthly Views', youtube: '3.3M', instagram: '340K', tiktok: '1.8M' },
  { label: 'Engagement Rate', youtube: '6.8%', instagram: '9.4%', tiktok: '11.2%' },
  { label: 'Avg CTR', youtube: '6.1%', instagram: '—', tiktok: '—' },
  { label: 'Revenue (est.)', youtube: '$4,200', instagram: '$800', tiktok: '$1,100' },
];

const platformColors: Record<string, string> = {
  YouTube: '#E05252',
  Instagram: '#9B72CF',
  TikTok: '#4A9EFF',
};

export function MultiChannelTool() {
  const [channels] = useState<Channel[]>(MOCK_CHANNELS);
  const [showAddChannel, setShowAddChannel] = useState(false);

  const totalSubs = '260K';
  const totalViews = '5.4M';
  const avgEngagement = '8.5%';

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
            <Tv className="w-5 h-5 text-[#4A9EFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#E8E8E8]">Multi-Channel Hub</h2>
            <p className="text-xs text-[#888888] mt-0.5">Manage and compare all your channels across platforms.</p>
          </div>
          <button
            onClick={() => setShowAddChannel(!showAddChannel)}
            className="px-3 h-8 rounded-lg bg-[#4A9EFF] text-white text-xs font-bold hover:bg-[#3A8EEF] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Channel
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <p className="text-lg font-bold text-[#4A9EFF]">{totalSubs}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Total Subscribers</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <p className="text-lg font-bold text-[#00C48C]">{totalViews}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Total Views/mo</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <p className="text-lg font-bold text-[#F5A623]">{avgEngagement}</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Avg Engagement</p>
          </div>
        </div>
      </div>

      {/* Add Channel Inline */}
      {showAddChannel && (
        <div className="rounded-lg bg-[#111111] border border-[#4A9EFF]/30 p-4">
          <h4 className="text-xs font-bold text-[#4A9EFF] uppercase tracking-wider mb-3">Connect New Channel</h4>
          <div className="flex gap-2">
            {['YouTube', 'Instagram', 'TikTok'].map((p) => (
              <button key={p} className="flex-1 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#333] transition-colors flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: platformColors[p] }}>
                  {p[0]}
                </div>
                <span className="text-xs text-[#E8E8E8]">{p}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Connected Channels */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C]" />
          Connected Channels ({channels.length})
        </h4>
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: platformColors[ch.platform] }}
              >
                {ch.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#E8E8E8]">{ch.name}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: platformColors[ch.platform] + '20', color: platformColors[ch.platform] }}>{ch.platform}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-[#666] flex items-center gap-1"><Users className="w-3 h-3" /> {ch.subscribers}</span>
                  <span className="text-[10px] text-[#666] flex items-center gap-1"><Eye className="w-3 h-3" /> {ch.monthlyViews}</span>
                  <span className="text-[10px] text-[#666] flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {ch.engagement}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[#555]">{ch.lastSync}</span>
                <button className="p-1 rounded hover:bg-[#1A1A1A] text-[#555] hover:text-[#E8E8E8] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded hover:bg-[#1A1A1A] text-[#555] hover:text-[#E8E8E8] transition-colors">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-[#F5A623]" />
          Channel Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-[10px] font-bold text-[#666] uppercase pb-2">Metric</th>
                <th className="text-[10px] font-bold text-[#E05252] uppercase pb-2 px-2">YouTube</th>
                <th className="text-[10px] font-bold text-[#9B72CF] uppercase pb-2 px-2">Instagram</th>
                <th className="text-[10px] font-bold text-[#4A9EFF] uppercase pb-2 px-2">TikTok</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_METRICS.map((row, i) => (
                <tr key={i} className="border-b border-[#1A1A1A] last:border-0">
                  <td className="py-2 text-xs text-[#AAAAAA]">{row.label}</td>
                  <td className="py-2 px-2 text-xs font-medium text-[#E8E8E8]">{row.youtube}</td>
                  <td className="py-2 px-2 text-xs font-medium text-[#E8E8E8]">{row.instagram}</td>
                  <td className="py-2 px-2 text-xs font-medium text-[#E8E8E8]">{row.tiktok}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
