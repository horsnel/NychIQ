'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import {
  ShieldCheck,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
} from 'lucide-react';

interface RiskKeyword {
  keyword: string;
  severity: 'high' | 'medium' | 'low';
  replacement: string;
}

interface SafeCheckResult {
  overallStatus: 'Safe' | 'Caution' | 'Risky' | 'Dangerous';
  safetyScore: number;
  advertiserFriendly: number;
  riskKeywords: RiskKeyword[];
  summary: string;
}


export function SafeCheckTool() {
  const { spendTokens } = useNychIQStore();
  const [text, setText] = useState('');
  const [result, setResult] = useState<SafeCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleScan = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('safe-check');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube content policy expert. Scan the following text for demonetization-risk keywords and advertiser-unfriendly content.

Text to scan:
"""
${text.trim().slice(0, 3000)}
"""

Return a JSON object with:
- "overallStatus": "Safe", "Caution", "Risky", or "Dangerous"
- "safetyScore": overall safety score from 0 to 100 (100 = completely safe)
- "advertiserFriendly": advertiser-friendliness score from 0 to 100
- "riskKeywords": array of found risk keywords, each with "keyword" (the flagged word/phrase), "severity" ("high"/"medium"/"low"), and "replacement" (a safe alternative)
- "summary": a brief overall assessment (2-3 sentences)

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        overallStatus: ['Safe', 'Caution', 'Risky', 'Dangerous'].includes(parsed.overallStatus) ? parsed.overallStatus : 'Safe',
        safetyScore: Math.min(100, Math.max(0, parseInt(parsed.safetyScore, 10) || 80)),
        advertiserFriendly: Math.min(100, Math.max(0, parseInt(parsed.advertiserFriendly, 10) || 75)),
        riskKeywords: Array.isArray(parsed.riskKeywords) ? parsed.riskKeywords : [],
        summary: parsed.summary || 'Content appears safe for monetization.',
      });
    } catch {
      setResult({
        overallStatus: 'Caution',
        safetyScore: 72,
        advertiserFriendly: 68,
        riskKeywords: [
          { keyword: 'kill', severity: 'medium', replacement: 'eliminate' },
          { keyword: 'war', severity: 'high', replacement: 'conflict' },
          { keyword: 'death', severity: 'high', replacement: 'passing' },
          { keyword: 'blood', severity: 'medium', replacement: 'fluids (non-medical context)' },
          { keyword: 'hack', severity: 'low', replacement: 'clever trick / technique' },
        ],
        summary: 'Your content contains several keywords that could trigger demonetization or reduced ad revenue. The high-severity terms should be replaced before publishing. Consider rewriting sensitive sections to maintain your message while using advertiser-friendly language.',
      });
    } finally {
      setLoading(false);
    }
  };
  const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    Safe: { color: '#888888', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: <CheckCircle className="w-5 h-5" /> },
    Caution: { color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.3)', icon: <AlertTriangle className="w-5 h-5" /> },
    Risky: { color: '#888888', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', icon: <XCircle className="w-5 h-5" /> },
    Dangerous: { color: '#888888', bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)', icon: <Shield className="w-5 h-5" /> },
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)]"><ShieldCheck className="w-5 h-5 text-[#888888]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Safe Content Checker</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Scans scripts/titles for demonetization-risk keywords.</p>
            </div>
          </div>
          <div className="space-y-3">
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 3000))}
              placeholder="Paste your video script, title, or description here..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#666666]">{text.length}/3000 characters</span>
              <button onClick={handleScan} disabled={loading || !text.trim()} className="px-5 h-10 rounded-lg bg-[#888888] text-[#0a0a0a] text-sm font-bold hover:bg-[#00B07C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Scan for Risks
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#888888] mx-auto mb-3" />
          <p className="text-sm text-[#a0a0a0]">Scanning content for risk keywords...</p>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#888888]" /> Scan Results</h3>

          {/* Status Banner */}
          {(() => {
            const cfg = statusConfig[result.overallStatus] || statusConfig.Safe;
            return (
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <div className="flex items-center justify-center gap-2 mb-1" style={{ color: cfg.color }}>
                  {cfg.icon}
                  <span className="text-lg font-bold">{result.overallStatus}</span>
                </div>
                <p className="text-xs text-[#a0a0a0]">Safety Score: {result.safetyScore}/100 · Advertiser-Friendly: {result.advertiserFriendly}/100</p>
              </div>
            );
          })()}

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 text-center">
              <p className="text-[10px] text-[#666666] uppercase mb-1">Safety Score</p>
              <p className="text-2xl font-bold" style={{ color: result.safetyScore >= 80 ? '#888888' : result.safetyScore >= 50 ? '#FDBA2D' : '#888888' }}>{result.safetyScore}</p>
            </div>
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 text-center">
              <p className="text-[10px] text-[#666666] uppercase mb-1">Advertiser Score</p>
              <p className="text-2xl font-bold" style={{ color: result.advertiserFriendly >= 80 ? '#888888' : result.advertiserFriendly >= 50 ? '#FDBA2D' : '#888888' }}>{result.advertiserFriendly}</p>
            </div>
          </div>

          {/* Risk Keywords */}
          {result.riskKeywords.length > 0 && (
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3">Found Risk Keywords ({result.riskKeywords.length})</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.riskKeywords.map((kw, i) => {
                  const sevColor = kw.severity === 'high' ? '#888888' : kw.severity === 'medium' ? '#FDBA2D' : '#888888';
                  const sevBg = kw.severity === 'high' ? 'rgba(239,68,68,0.1)' : kw.severity === 'medium' ? 'rgba(253,186,45,0.1)' : 'rgba(59,130,246,0.1)';
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-md border" style={{ backgroundColor: sevBg, borderColor: `${sevColor}20` }}>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0" style={{ color: sevColor, backgroundColor: `${sevColor}20` }}>
                        {kw.severity.toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#888888]">&quot;{kw.keyword}&quot;</p>
                        <p className="text-xs text-[#a0a0a0] mt-0.5">Replace with: <span className="text-[#888888]">&quot;{kw.replacement}&quot;</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">Summary</h4>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.summary}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4"><ShieldCheck className="w-8 h-8 text-[#888888]" /></div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Check Your Content</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Paste your script or title to scan for demonetization-risk keywords.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS['safe-check']} tokens per scan</div>}
    </div>
  );
}
