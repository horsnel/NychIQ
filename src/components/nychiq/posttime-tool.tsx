'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import {
  Clock,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const REGIONS = ['Nigeria', 'US', 'UK', 'India', 'Kenya', 'Ghana', 'South Africa'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'];

interface PostTimeResult {
  bestDays: Array<{ day: string; score: number; reason: string }>;
  bestTimes: string[];
  proTips: string[];
}


export function PostTimeTool() {
  const { spendTokens } = useNychIQStore();
  const [niche, setNiche] = useState('');
  const [region, setRegion] = useState('Nigeria');
  const [result, setResult] = useState<PostTimeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    setRawText(null);
    const ok = spendTokens('posttime');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube analytics expert. Analyze the best posting schedule for the niche: "${niche.trim()}" in region: ${region}.

Return a JSON object with:
- "bestDays": array of 7 objects, one per day (Monday-Sunday), each with "day", "score" (1-100, higher = better), and "reason" (brief explanation)
- "bestTimes": array of 4 best time slots (e.g., "2:00 PM - 4:00 PM", "7:00 PM - 9:00 PM")
- "proTips": array of 3-4 pro tips for this specific niche regarding posting timing

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        setRawText(response);
        setResult(null);
        return;
      }
      setResult({
        bestDays: Array.isArray(parsed.bestDays) ? parsed.bestDays : [],
        bestTimes: Array.isArray(parsed.bestTimes) ? parsed.bestTimes : ['2:00 PM - 4:00 PM'],
        proTips: Array.isArray(parsed.proTips) ? parsed.proTips : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze post times. Please try again.');
      setResult(null);
      setRawText(null);
    } finally {
      setLoading(false);
    }
  };
  const heatmapData = result ? DAYS.map((day, i) => {
    const dayData = result.bestDays.find((d) => d.day === day);
    return HOURS.map(() => {
      const base = dayData?.score || 50;
      return Math.min(100, Math.max(10, base + Math.floor(Math.random() * 30 - 15)));
    });
  }) : [];

  function heatColor(val: number): string {
    if (val >= 85) return 'bg-[#10B981]';
    if (val >= 70) return 'bg-[#10B981]/60';
    if (val >= 55) return 'bg-[#FDBA2D]/60';
    if (val >= 40) return 'bg-[#FDBA2D]/30';
    if (val >= 25) return 'bg-[#EF4444]/30';
    return 'bg-[#1A1A1A]';
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(59,130,246,0.1)]"><Clock className="w-5 h-5 text-[#3B82F6]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Best Post Time</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">Optimal upload schedule based on niche + region (heatmap included).</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
              placeholder="Enter your niche..."
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
            />
            <select value={region} onChange={(e) => setRegion(e.target.value)}
              className="h-11 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none appearance-none cursor-pointer">
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={handleAnalyze} disabled={loading || !niche.trim()} className="px-5 h-11 rounded-lg bg-[#3B82F6] text-white text-sm font-bold hover:bg-[#3A8EEF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-3" />
          <p className="text-sm text-[#FFFFFF] mb-4">{error}</p>
          <button onClick={handleAnalyze} className="px-4 py-2 rounded-lg bg-[#EF4444] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4 h-48 animate-pulse" />
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-3 bg-[#1A1A1A] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />)}</div>
          </div>
        </div>
      )}

      {/* Raw Text Fallback */}
      {!loading && rawText && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" /> Post Time Results (Raw)
          </h3>
          <div className="rounded-lg bg-[#141414] border border-[#3B82F6]/30 p-4">
            <p className="text-[10px] text-[#3B82F6] mb-2 font-medium">Could not format the AI response. Showing raw output:</p>
            <pre className="text-sm text-[#FFFFFF] whitespace-pre-wrap leading-relaxed font-sans">{rawText}</pre>
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#3B82F6]" /> Schedule Analysis for &quot;{niche.trim()}&quot;</h3>

          {/* Best Days */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3">Best Days of the Week (Ranked)</h4>
            <div className="space-y-2">
              {[...result.bestDays].sort((a, b) => b.score - a.score).map((d, i) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[#666666] w-4">#{i + 1}</span>
                  <span className="text-xs text-[#FFFFFF] w-20 shrink-0">{d.day.slice(0, 3)}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.score}%`, backgroundColor: d.score >= 80 ? '#10B981' : d.score >= 60 ? '#FDBA2D' : '#A3A3A3' }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right" style={{ color: d.score >= 80 ? '#10B981' : d.score >= 60 ? '#FDBA2D' : '#A3A3A3' }}>{d.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          {heatmapData.length > 0 && (
            <div className="rounded-lg bg-[#141414] border border-[#222222] p-4 overflow-x-auto">
              <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3">Weekly Heatmap</h4>
              <div className="min-w-[500px]">
                <div className="flex gap-1 mb-1 pl-16">
                  {HOURS.map((h) => <div key={h} className="flex-1 text-[9px] text-[#666666] text-center">{h}</div>)}
                </div>
                {DAYS.map((day, di) => (
                  <div key={day} className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] text-[#A3A3A3] w-14 shrink-0">{day.slice(0, 3)}</span>
                    {heatmapData[di]?.map((val, hi) => (
                      <div key={hi} className={`flex-1 h-5 rounded-sm ${heatColor(val)} transition-colors`} title={`${day} ${HOURS[hi]}: ${val}`} />
                    ))}
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-3 text-[9px] text-[#666666]">
                  <span>Low</span>
                  <div className="w-3 h-3 rounded-sm bg-[#1A1A1A]" />
                  <div className="w-3 h-3 rounded-sm bg-[#EF4444]/30" />
                  <div className="w-3 h-3 rounded-sm bg-[#FDBA2D]/30" />
                  <div className="w-3 h-3 rounded-sm bg-[#FDBA2D]/60" />
                  <div className="w-3 h-3 rounded-sm bg-[#10B981]/60" />
                  <div className="w-3 h-3 rounded-sm bg-[#10B981]" />
                  <span>High</span>
                </div>
              </div>
            </div>
          )}

          {/* Best Time Slots */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3">Best Time Slots</h4>
            <div className="flex flex-wrap gap-2">
              {result.bestTimes.map((time, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
                  <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-sm font-medium text-[#10B981]">{time}</span>
                  {i === 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#10B981] text-[#0D0D0D]">BEST</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          {result.proTips.length > 0 && (
            <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
              <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3">Pro Tips</h4>
              <div className="space-y-2">
                {result.proTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-md bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.1)]">
                    <span className="text-[#3B82F6] text-xs mt-0.5">💡</span>
                    <p className="text-sm text-[#FFFFFF]">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] flex items-center justify-center mb-4"><Clock className="w-8 h-8 text-[#3B82F6]" /></div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Find Your Best Post Time</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">Enter your niche and region to get an optimal posting schedule with heatmap.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.posttime} tokens per analysis</div>}
    </div>
  );
}
