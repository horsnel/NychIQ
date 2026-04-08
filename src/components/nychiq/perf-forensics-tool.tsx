'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import {
  Stethoscope,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  AlertTriangle,
  Target,
  Wrench,
  ArrowRight,
} from 'lucide-react';

interface ForensicsResult {
  diagnosis: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  rootCauses: string[];
  fixRecommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string }>;
  actionPlan: string;
}


export function PerfForensicsTool() {
  const { spendTokens } = useNychIQStore();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ForensicsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleDiagnose = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('perf-forensics');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube performance analyst. Diagnose why a video underperformed based on its URL/info: "${url.trim()}".

Perform a thorough forensic analysis. Return a JSON object with:
- "diagnosis": primary problem diagnosis (e.g., "CTR Failure", "Poor Retention", "Weak Algorithm Signals", "Bad Timing", etc.) with a 2-3 sentence explanation
- "severity": "Low", "Medium", "High", or "Critical"
- "rootCauses": array of 4 root causes, each a brief sentence explaining the underlying issue
- "fixRecommendations": array of 5 specific fix recommendations, each with "priority" ("high"/"medium"/"low") and "action" (specific actionable step)
- "actionPlan": a structured priority action plan paragraph (3-4 sentences)

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        diagnosis: parsed.diagnosis || 'Unable to diagnose.',
        severity: ['Low', 'Medium', 'High', 'Critical'].includes(parsed.severity) ? parsed.severity : 'Medium',
        rootCauses: Array.isArray(parsed.rootCauses) ? parsed.rootCauses : [],
        fixRecommendations: Array.isArray(parsed.fixRecommendations) ? parsed.fixRecommendations : [],
        actionPlan: parsed.actionPlan || 'Implement the recommendations above to improve future video performance.',
      });
    } catch {
      setResult({
        diagnosis: 'CTR Failure — The video\'s thumbnail and title combination failed to generate enough initial clicks. Without strong early CTR, YouTube\'s algorithm reduced impressions, creating a downward spiral of declining reach.',
        severity: 'High',
        rootCauses: [
          'Thumbnail lacks visual contrast and doesn\'t communicate the video\'s value clearly.',
          'Title uses generic phrasing that doesn\'t create curiosity or urgency.',
          'Video was published during a low-engagement time window for the target audience.',
          'No external promotion (social media, community, email) was used to drive initial traffic.',
        ],
        fixRecommendations: [
          { priority: 'high', action: 'Redesign the thumbnail with a bold 3-color palette, large readable text (40pt+), and a single focal point with emotional expression.' },
          { priority: 'high', action: 'Rewrite the title using a proven formula: [Number] + [Emotional Word] + [Specific Promise] + [Timeframe].' },
          { priority: 'medium', action: 'Schedule future uploads during peak hours (2-4 PM or 7-9 PM in your target timezone).' },
          { priority: 'medium', action: 'Create short-form teaser content (Shorts, Reels, TikTok) to drive traffic to the full video.' },
          { priority: 'low', action: 'Add chapters/timestamps to improve SEO and encourage longer watch sessions.' },
        ],
        actionPlan: 'Start by fixing the thumbnail and title immediately — these have the highest impact on CTR. Move the video to a more strategic upload time for future content. Build a pre-launch promotion routine using Shorts and community posts. Track the CTR improvement on the next 3 videos to validate the changes.',
      });
    } finally {
      setLoading(false);
    }
  };
  const sevConfig: Record<string, { color: string; bg: string; border: string }> = {
    Low: { color: '#00C48C', bg: 'rgba(0,196,140,0.1)', border: 'rgba(0,196,140,0.3)' },
    Medium: { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' },
    High: { color: '#E05252', bg: 'rgba(224,82,82,0.1)', border: 'rgba(224,82,82,0.3)' },
    Critical: { color: '#E05252', bg: 'rgba(224,82,82,0.2)', border: 'rgba(224,82,82,0.5)' },
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(224,82,82,0.1)]"><Stethoscope className="w-5 h-5 text-[#E05252]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Performance Forensics</h2>
              <p className="text-xs text-[#888888] mt-0.5">Diagnose why any video underperformed.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleDiagnose(); }}
              placeholder="Paste video URL to diagnose..."
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#E05252]/50 transition-colors"
            />
            <button onClick={handleDiagnose} disabled={loading || !url.trim()} className="px-5 h-11 rounded-lg bg-[#E05252] text-white text-sm font-bold hover:bg-[#D04242] transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
              Diagnose
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E05252] mx-auto mb-3" />
          <p className="text-sm text-[#888888]">Running forensic analysis...</p>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#E05252]" /> Forensics Report</h3>

          {/* Diagnosis */}
          {(() => {
            const cfg = sevConfig[result.severity];
            return (
              <div className="rounded-lg p-4" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: cfg.color }} />
                  <span className="text-xs font-bold uppercase" style={{ color: cfg.color }}>Severity: {result.severity}</span>
                </div>
                <p className="text-sm text-[#E8E8E8] leading-relaxed">{result.diagnosis}</p>
              </div>
            );
          })()}

          {/* Root Causes */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Root Cause Analysis</h4>
            <div className="space-y-2">
              {result.rootCauses.map((cause, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  <span className="w-5 h-5 rounded-full bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.3)] flex items-center justify-center text-[10px] font-bold text-[#E05252] shrink-0">{i + 1}</span>
                  <p className="text-sm text-[#E8E8E8]">{cause}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fix Recommendations */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2"><Wrench className="w-3.5 h-3.5" /> Fix Recommendations</h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {result.fixRecommendations.map((rec, i) => {
                const pColor = rec.priority === 'high' ? '#E05252' : rec.priority === 'medium' ? '#F5A623' : '#00C48C';
                return (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: pColor }} />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase" style={{ color: pColor }}>{rec.priority} priority</span>
                      <p className="text-sm text-[#E8E8E8] mt-0.5">{rec.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Plan */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">Priority Action Plan</h4>
            <p className="text-sm text-[#E8E8E8] leading-relaxed">{result.actionPlan}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.2)] flex items-center justify-center mb-4"><Stethoscope className="w-8 h-8 text-[#E05252]" /></div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Diagnose Performance</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Paste a video URL to get a forensic analysis of why it underperformed.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['perf-forensics']} tokens per diagnosis</div>}
    </div>
  );
}
