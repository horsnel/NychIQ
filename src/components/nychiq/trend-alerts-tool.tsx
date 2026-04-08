'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import {
  BellRing,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  Plus,
  X,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react';

interface Alert {
  id: string;
  keyword: string;
  createdAt: string;
}

interface TrendFeedItem {
  keyword: string;
  spike: string;
  time: string;
  category: string;
}

function PlanGate() {
  const { setUpgradeModalOpen } = useNychIQStore();
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="max-w-sm w-full rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mx-auto mb-4"><Lock className="w-7 h-7 text-[#F5A623]" /></div>
        <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">Trend Alerts Locked</h2>
        <p className="text-sm text-[#888888] mb-6">This feature requires an upgrade to access.</p>
        <button onClick={() => setUpgradeModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"><Crown className="w-4 h-4" /> Upgrade Now</button>
      </div>
    </div>
  );
}

const MOCK_FEED: TrendFeedItem[] = [
  { keyword: 'AI Video Generator 2025', spike: '+1,250%', time: '12m ago', category: 'Technology' },
  { keyword: 'Nigeria Election Update', spike: '+890%', time: '34m ago', category: 'News' },
  { keyword: 'Budget Phone Review', spike: '+670%', time: '1h ago', category: 'Technology' },
  { keyword: 'Afrobeats New Release', spike: '+580%', time: '2h ago', category: 'Music' },
  { keyword: 'Jollof Rice Recipe', spike: '+520%', time: '3h ago', category: 'Food' },
  { keyword: 'Crypto Market Crash', spike: '+450%', time: '4h ago', category: 'Finance' },
  { keyword: 'Premier League Highlights', spike: '+380%', time: '5h ago', category: 'Sports' },
  { keyword: 'Natural Hair Routine', spike: '+310%', time: '6h ago', category: 'Beauty' },
];

export function TrendAlertsTool() {
  const { canAccess } = useNychIQStore();
  const [keyword, setKeyword] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', keyword: 'AI Tools', createdAt: '2h ago' },
    { id: '2', keyword: 'Tech Reviews', createdAt: '1d ago' },
  ]);
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!keyword.trim()) return;
    setAdding(true);
    setTimeout(() => {
      setAlerts((prev) => [...prev, {
        id: Date.now().toString(),
        keyword: keyword.trim(),
        createdAt: 'Just now',
      }]);
      setKeyword('');
      setAdding(false);
    }, 500);
  };

  const handleRemove = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (!canAccess('trend-alerts')) return <PlanGate />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]"><BellRing className="w-5 h-5 text-[#F5A623]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Trend Alerts</h2>
              <p className="text-xs text-[#888888] mt-0.5">Set keyword triggers, get notifications when topics spike 500%+.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Enter keyword to monitor..."
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
            />
            <button onClick={handleAdd} disabled={adding || !keyword.trim()} className="px-4 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Alert
            </button>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Active Alerts ({alerts.length})</h4>
        {alerts.length === 0 ? (
          <p className="text-sm text-[#666666] text-center py-4">No active alerts. Add keywords above to start monitoring.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#F5A623] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#E8E8E8] truncate">{alert.keyword}</p>
                    <p className="text-[10px] text-[#666666]">Added {alert.createdAt}</p>
                  </div>
                </div>
                <button onClick={() => handleRemove(alert.id)} className="p-1 rounded hover:bg-[#1A1A1A] text-[#666666] hover:text-[#E05252] transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trend Feed */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#E05252]" />
            Recent Trend Spikes
          </h4>
          <span className="text-[10px] text-[#666666]">Simulated data</span>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {MOCK_FEED.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.2)] flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[#E05252]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#E8E8E8] truncate">{item.keyword}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#666666] flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-[#9B72CF] bg-[rgba(155,114,207,0.1)]">{item.category}</span>
                </div>
              </div>
              <span className="text-sm font-bold text-[#E05252] shrink-0">{item.spike}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['trend-alerts']} tokens per alert</div>
    </div>
  );
}
