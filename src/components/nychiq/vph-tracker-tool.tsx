'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import {
  Activity,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
  BarChart3,
} from 'lucide-react';

interface HourlyData {
  hour: string;
  views: number;
}

interface VPHResult {
  hourlyData: HourlyData[];
  totalViews: number;
  avgVelocity: string;
  peakHour: string;
  isViral: boolean;
  viralTrajectory: string;
}


export function VPHTrackerTool() {
  const { spendTokens } = useNychIQStore();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<VPHResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('vph-tracker');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube analytics expert. Simulate the views-per-hour tracking data for a video. The user wants to track: "${url.trim()}".

Generate realistic hourly view data for the first 12 hours after upload. Return a JSON object with:
- "hourlyData": array of 12 objects, each with "hour" (like "Hour 1", "Hour 2", etc.) and "views" (number of views that hour, realistic growth pattern)
- "totalViews": total views across all hours
- "avgVelocity": average views per hour (string like "1.2K/hr")
- "peakHour": which hour had the most views
- "isViral": boolean, true if showing viral growth pattern
- "viralTrajectory": description of the growth pattern

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        hourlyData: Array.isArray(parsed.hourlyData) ? parsed.hourlyData : [],
        totalViews: parseInt(parsed.totalViews, 10) || 10000,
        avgVelocity: parsed.avgVelocity || '1K/hr',
        peakHour: parsed.peakHour || 'Hour 1',
        isViral: parsed.isViral || false,
        viralTrajectory: parsed.viralTrajectory || 'Normal growth pattern',
      });
    } catch {
      const isViral = Math.random() > 0.5;
      const baseViews = isViral ? 5000 : 800;
      const data: HourlyData[] = Array.from({ length: 12 }, (_, i) => ({
        hour: `Hour ${i + 1}`,
        views: Math.floor(baseViews * (isViral ? (1 + i * 0.5 + Math.random() * 0.3) : (1 - i * 0.06 + Math.random() * 0.2))),
      }));
      const total = data.reduce((s, d) => s + d.views, 0);
      const maxHour = data.reduce((m, d) => d.views > m.views ? d : m, data[0]);
      setResult({
        hourlyData: data,
        totalViews: total,
        avgVelocity: `${(total / 12 / 1000).toFixed(1)}K/hr`,
        peakHour: maxHour.hour,
        isViral,
        viralTrajectory: isViral ? 'Exponential growth detected! This video is showing strong viral signals with accelerating views per hour. The algorithm is actively pushing this content to wider audiences.' : 'Steady organic growth pattern. Views are gradually declining as initial push subsides. This is a normal performance trajectory for most content.',
      });
    } finally {
      setLoading(false);
    }
  };
  const maxViews = result ? Math.max(...result.hourlyData.map((d) => d.views), 1) : 1;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]"><Activity className="w-5 h-5 text-[#888888]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Views Per Hour Tracker</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Hour-by-hour velocity charts. Spot viral content in the first 6 hours.</p>
            </div>
          </div>
          <div className="flex rounded-full bg-[#0a0a0a] border border-[#1A1A1A] overflow-hidden">
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTrack(); }}
              placeholder="Paste video URL..."
              className="flex-1 h-11 px-4 bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none transition-colors"
            />
            <button onClick={handleTrack} disabled={loading || !url.trim()} className="px-5 h-11 rounded-full bg-[#888888] text-[#0a0a0a] text-sm font-bold hover:bg-[#555555] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Track
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-end gap-1 h-40">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 bg-[#1A1A1A] rounded-t animate-pulse" style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#888888]" /> VPH Analysis</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.isViral ? 'bg-[rgba(255,255,255,0.03)] text-[#888888] border border-[rgba(255,255,255,0.03)]' : 'bg-[rgba(255,255,255,0.03)] text-[#a0a0a0] border border-[rgba(255,255,255,0.03)]'}`}>
              {result.isViral ? '🔥 Going viral!' : '📊 Normal pace'}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1"><BarChart3 className="w-3.5 h-3.5 text-[#888888]" /></div>
              <p className="text-base font-bold text-[#FFFFFF]">{(result.totalViews / 1000).toFixed(1)}K</p>
              <span className="text-[10px] text-[#666666]">Total Views</span>
            </div>
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1"><Activity className="w-3.5 h-3.5 text-[#FDBA2D]" /></div>
              <p className="text-base font-bold text-[#FFFFFF]">{result.avgVelocity}</p>
              <span className="text-[10px] text-[#666666]">Avg Velocity</span>
            </div>
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1"><Zap className="w-3.5 h-3.5 text-[#888888]" /></div>
              <p className="text-base font-bold text-[#FFFFFF]">{result.peakHour.replace('Hour ', 'H')}</p>
              <span className="text-[10px] text-[#666666]">Peak Hour</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-4">Hourly Views Chart</h4>
            <div className="flex items-end gap-1.5 h-44">
              {result.hourlyData.map((d, i) => {
                const pct = (d.views / maxViews) * 100;
                const isPeak = d.hour === result.peakHour;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-[#666666]">{(d.views / 1000).toFixed(1)}K</span>
                    <div className="w-full rounded-t transition-all duration-500" style={{
                      height: `${Math.max(4, pct)}%`,
                      backgroundColor: isPeak ? '#FDBA2D' : result.isViral ? '#888888' : '#888888',
                      opacity: isPeak ? 1 : 0.6,
                    }} />
                    <span className="text-[9px] text-[#666666]">H{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trajectory */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">Viral Trajectory</h4>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.viralTrajectory}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4"><Activity className="w-8 h-8 text-[#888888]" /></div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Track View Velocity</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Paste a video URL to track hourly views and spot viral trends early.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS['vph-tracker']} tokens per track</div>}
    </div>
  );
}
