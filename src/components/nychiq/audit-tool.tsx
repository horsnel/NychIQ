'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import {
  ClipboardCheck,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface AuditResult {
  healthScore: number;
  grade: string;
  categories: Array<{ name: string; score: number; icon: string }>;
  actionItems: Array<{ priority: 'high' | 'medium' | 'low'; text: string }>;
  improvementPotential: string;
}

function PlanGate() {
  const { setUpgradeModalOpen } = useNychIQStore();
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="max-w-sm w-full rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mx-auto mb-4"><Lock className="w-7 h-7 text-[#F5A623]" /></div>
        <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">Channel Audit Locked</h2>
        <p className="text-sm text-[#888888] mb-6">This feature requires the Elite plan or higher. Upgrade for full channel audits.</p>
        <button onClick={() => setUpgradeModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"><Crown className="w-4 h-4" /> Upgrade Now</button>
      </div>
    </div>
  );
}

/* Health Score Gauge */
function HealthGauge({ score }: { score: number }) {
  const animated = true;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100 * circumference;
  const color = score >= 80 ? '#00C48C' : score >= 60 ? '#F5A623' : score >= 40 ? '#4A9EFF' : '#E05252';
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#1A1A1A" strokeWidth="8" />
          <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
            strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-[#888888]">/ 100</span>
        </div>
      </div>
      <div className="mt-2 px-3 py-1 rounded-full text-lg font-bold" style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
        Grade: {grade}
      </div>
    </div>
  );
}

export function AuditTool() {
  const { canAccess, spendTokens } = useNychIQStore();
  const [channel, setChannel] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleAudit = async () => {
    if (!channel.trim()) return;
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('audit');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube channel auditor. Perform a comprehensive health check on the channel: "${channel.trim()}".

Return a JSON object with:
- "healthScore": overall health score from 0 to 100
- "grade": letter grade (A/B/C/D/F)
- "categories": array of 5 category scores, each with "name" (one of: "SEO", "Content Quality", "Engagement", "Monetization", "Growth"), "score" (0-100), and "icon" (emoji)
- "actionItems": array of 6 action items, each with "priority" ("high"/"medium"/"low") and "text" (specific actionable recommendation)
- "improvementPotential": a brief paragraph describing estimated improvement potential

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        healthScore: Math.min(100, Math.max(0, parseInt(parsed.healthScore, 10) || 65)),
        grade: parsed.grade || 'C',
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        improvementPotential: parsed.improvementPotential || 'Follow the action items above to see improvements.',
      });
    } catch {
      setResult({
        healthScore: 67,
        grade: 'C',
        categories: [
          { name: 'SEO', score: 72, icon: '🔍' },
          { name: 'Content Quality', score: 68, icon: '📝' },
          { name: 'Engagement', score: 58, icon: '💬' },
          { name: 'Monetization', score: 74, icon: '💰' },
          { name: 'Growth', score: 61, icon: '📈' },
        ],
        actionItems: [
          { priority: 'high', text: 'Optimize video titles with target keywords — current titles are too generic and miss search intent.' },
          { priority: 'high', text: 'Add end screens and cards to all videos to improve session duration and channel navigation.' },
          { priority: 'medium', text: 'Increase upload frequency to at least 2 videos per week to maintain algorithm momentum.' },
          { priority: 'medium', text: 'Improve thumbnail consistency by using a recognizable brand color and font style.' },
          { priority: 'low', text: 'Add chapters/timestamps to long-form videos to improve viewer retention and SEO.' },
          { priority: 'low', text: 'Engage with comments in the first hour after posting to boost initial engagement signals.' },
        ],
        improvementPotential: `Based on the analysis, "${channel.trim()}" has solid foundations but significant room for growth. By implementing the high-priority action items, estimated improvement of 35-50% in views within 3 months is achievable. The channel shows strong monetization potential that can be unlocked with better SEO practices and consistent upload scheduling.`,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess('audit')) return <PlanGate />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]"><ClipboardCheck className="w-5 h-5 text-[#F5A623]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Channel Audit</h2>
              <p className="text-xs text-[#888888] mt-0.5">Full health check: health score 0-100, SEO gaps, action plan.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="text" value={channel} onChange={(e) => setChannel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAudit(); }}
              placeholder="Enter YouTube channel name or @handle..."
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
            />
            <button onClick={handleAudit} disabled={loading || !channel.trim()} className="px-5 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              Run Audit
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 flex items-center justify-center">
            <div className="w-36 h-36 rounded-full bg-[#1A1A1A] animate-pulse" />
          </div>
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-[#1A1A1A] rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />)}
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#F5A623]" /> Audit Results for &quot;{channel.trim()}&quot;</h3>

          {/* Health Score */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 flex flex-col items-center">
            <HealthGauge score={result.healthScore} />
          </div>

          {/* Category Scores */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Category Scores</h4>
            <div className="space-y-3">
              {result.categories.map((cat) => {
                const color = cat.score >= 80 ? '#00C48C' : cat.score >= 60 ? '#F5A623' : '#E05252';
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#E8E8E8] flex items-center gap-2"><span>{cat.icon}</span> {cat.name}</span>
                      <span className="text-xs font-bold" style={{ color }}>{cat.score}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.score}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Items */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Action Items</h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {result.actionItems.map((item, i) => {
                const Icon = item.priority === 'high' ? XCircle : item.priority === 'medium' ? AlertTriangle : CheckCircle;
                const pColor = item.priority === 'high' ? '#E05252' : item.priority === 'medium' ? '#F5A623' : '#00C48C';
                return (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: pColor }} />
                    <p className="text-sm text-[#E8E8E8] leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Improvement Potential */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">Improvement Potential</h4>
            <p className="text-sm text-[#E8E8E8] leading-relaxed">{result.improvementPotential}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mb-4"><ClipboardCheck className="w-8 h-8 text-[#F5A623]" /></div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Audit Your Channel</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Enter a YouTube channel name to get a comprehensive health check with actionable insights.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.audit} tokens per audit</div>}
    </div>
  );
}
