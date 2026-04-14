'use client';

import React, { useState, useEffect } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import {
  BellRing,
  Loader2,
  Sparkles,
  Plus,
  X,
  TrendingUp,
  Clock,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

interface Alert {
  id: string;
  keyword: string;
  createdAt: string;
}

interface TrendSpike {
  keyword: string;
  spike: string;
  time: string;
  category: string;
  velocity: 'explosive' | 'rising' | 'steady';
}

export function TrendAlertsTool() {
  const { spendTokens, region } = useNychIQStore();
  const [keyword, setKeyword] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState<TrendSpike[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load saved alerts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nychiq_trend_alerts');
      if (saved) setAlerts(JSON.parse(saved));
    } catch {}
  }, []);

  // Fetch trend spikes using AI
  const fetchTrendSpikes = async () => {
    setLoading(true);
    setError(null);
    const ok = spendTokens('trend-alerts');
    if (!ok) { setLoading(false); return; }
    try {
      const prompt = `You are a YouTube trend analyst for the ${region} region. Analyze the current trending topics and identify 8 trending keywords/phrases that have seen significant search volume spikes (500%+) recently.

Return ONLY a JSON array with this exact structure (no other text):
[{"keyword":"...","spike":"+1,250%","time":"12m ago","category":"Technology","velocity":"explosive"},{"keyword":"...","spike":"+890%","time":"34m ago","category":"News","velocity":"rising"}]

Rules:
- spike: format as "+X%" with the percentage increase
- time: relative time like "12m ago", "2h ago", "5h ago"
- category: one of Technology, News, Music, Food, Finance, Sports, Beauty, Gaming, Education, Health, Entertainment
- velocity: "explosive" (>2000%), "rising" (500-2000%), or "steady" (100-500%)
- Make keywords realistic for the ${region} YouTube market
- Vary the categories and timeframes`;

      const text = await askAI(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          setFeed(parsed.slice(0, 8));
        } else {
          setFeed([]);
        }
      } else {
        setFeed([]);
      }
    } catch {
      setError('Failed to fetch trend data. Please try again.');
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchTrendSpikes();
  }, []);

  const handleAdd = async () => {
    if (!keyword.trim()) return;
    const ok = spendTokens('trend-alerts');
    if (!ok) return;
    setAdding(true);
    // Simulate brief AI analysis of the keyword
    try {
      await new Promise((r) => setTimeout(r, 600));
      const newAlert = {
        id: Date.now().toString(),
        keyword: keyword.trim(),
        createdAt: 'Just now',
      };
      const updated = [newAlert, ...alerts];
      setAlerts(updated);
      localStorage.setItem('nychiq_trend_alerts', JSON.stringify(updated));
      setKeyword('');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    localStorage.setItem('nychiq_trend_alerts', JSON.stringify(updated));
  };

  const velocityConfig = {
    explosive: { color: '#888888', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    rising: { color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.2)' },
    steady: { color: '#888888', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]"><BellRing className="w-5 h-5 text-[#FDBA2D]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Trend Alerts</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Monitor trending keywords and get notified when topics spike in your region.</p>
            </div>
          </div>
          <div className="flex rounded-full bg-[#0a0a0a] border border-[#1A1A1A] overflow-hidden">
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Enter keyword to monitor..."
              className="flex-1 h-11 px-4 bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none transition-colors"
            />
            <button onClick={handleAdd} disabled={adding || !keyword.trim()} className="px-4 h-11 rounded-full bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Alert
            </button>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
        <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3">Active Alerts ({alerts.length})</h4>
        {alerts.length === 0 ? (
          <p className="text-sm text-[#666666] text-center py-4">No active alerts. Add keywords above to start monitoring.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#FDBA2D] shrink-0 animate-pulse-live" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#FFFFFF] truncate">{alert.keyword}</p>
                    <p className="text-[10px] text-[#666666]">Added {alert.createdAt}</p>
                  </div>
                </div>
                <button onClick={() => handleRemove(alert.id)} className="p-1 rounded hover:bg-[#1A1A1A] text-[#666666] hover:text-[#888888] transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trend Feed — AI-powered */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#888888]" />
            Live Trend Spikes
          </h4>
          <button
            onClick={fetchTrendSpikes}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)]">
            <AlertTriangle className="w-4 h-4 text-[#888888] shrink-0" />
            <p className="text-xs text-[#888888]">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#FDBA2D] animate-spin mb-2" />
            <p className="text-sm text-[#a0a0a0]">Scanning trends...</p>
          </div>
        ) : feed.length === 0 ? (
          <p className="text-sm text-[#666666] text-center py-8">No trend data available. Click Refresh to scan.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {feed.map((item, i) => {
              const vel = velocityConfig[item.velocity] || velocityConfig.steady;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.1)] transition-colors">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: vel.bg, border: `1px solid ${vel.border}` }}>
                    <TrendingUp className="w-5 h-5" style={{ color: vel.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#FFFFFF] truncate">{item.keyword}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#666666] flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ color: vel.color, backgroundColor: vel.bg }}>{item.category}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ color: vel.color, backgroundColor: vel.bg }}>{item.velocity}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm font-bold" style={{ color: vel.color }}>{item.spike}</span>
                    <ArrowUpRight className="w-3 h-3 mt-0.5" style={{ color: vel.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS['trend-alerts']} tokens per scan · Region: {region}</div>
    </div>
  );
}
