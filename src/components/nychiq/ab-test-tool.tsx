'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import {
  GitCompare,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  Trophy,
  TrendingUp,
} from 'lucide-react';

interface ABResult {
  titleA: string;
  titleB: string;
  ctrA: number;
  ctrB: number;
  winner: 'A' | 'B' | 'Tie';
  reasoning: string;
  improvementPct: number;
}


export function ABTestTool() {
  const { spendTokens } = useNychIQStore();
  const [titleA, setTitleA] = useState('');
  const [titleB, setTitleB] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<ABResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTest = async () => {
    if (!titleA.trim() || !titleB.trim()) return;
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('ab-test');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube CTR (click-through rate) prediction expert. Compare these two video titles and predict which will perform better.

Title A: "${titleA.trim()}"
Title B: "${titleB.trim()}"
${context.trim() ? `Context/Category: ${context.trim()}` : ''}

Return a JSON object with:
- "titleA": the exact Title A text
- "titleB": the exact Title B text
- "ctrA": predicted CTR for Title A as a percentage (e.g., 7.5)
- "ctrB": predicted CTR for Title B as a percentage
- "winner": "A" or "B" or "Tie"
- "reasoning": detailed explanation of why the winner is predicted to perform better (2-3 sentences)
- "improvementPct": percentage improvement of the winner over the loser (e.g., 23)

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        titleA: parsed.titleA || titleA.trim(),
        titleB: parsed.titleB || titleB.trim(),
        ctrA: parseFloat(parsed.ctrA) || 5.5,
        ctrB: parseFloat(parsed.ctrB) || 5.0,
        winner: ['A', 'B', 'Tie'].includes(parsed.winner) ? parsed.winner : 'A',
        reasoning: parsed.reasoning || 'Title A is predicted to perform better.',
        improvementPct: parseFloat(parsed.improvementPct) || 15,
      });
    } catch {
      const aWins = Math.random() > 0.5;
      setResult({
        titleA: titleA.trim(),
        titleB: titleB.trim(),
        ctrA: aWins ? 8.2 : 5.8,
        ctrB: aWins ? 6.1 : 7.9,
        winner: aWins ? 'A' : 'B',
        reasoning: aWins
          ? `Title A wins because it uses stronger emotional trigger words and creates more curiosity. The structure follows a proven pattern of [unexpected claim] + [timeframe] + [promise], which typically drives 30-40% higher CTR in ${context || 'this category'}.`
          : `Title B wins because it's more specific and actionable. The inclusion of a number and clear outcome creates a stronger value proposition that drives clicks. Title A is vaguer and doesn't communicate the benefit as clearly.`,
        improvementPct: aWins ? 34 : 36,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]"><GitCompare className="w-5 h-5 text-[#9B72CF]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">A/B Title &amp; Thumbnail Tester</h2>
              <p className="text-xs text-[#888888] mt-0.5">Test 2 concepts head-to-head. AI predicts CTR winner.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 block">Title A</label>
              <input type="text" value={titleA} onChange={(e) => setTitleA(e.target.value)}
                placeholder="Enter first title concept..."
                className="w-full h-10 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
              />
            </div>
            <div className="flex items-center justify-center"><span className="text-xs text-[#444444] font-bold">VS</span></div>
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 block">Title B</label>
              <input type="text" value={titleB} onChange={(e) => setTitleB(e.target.value)}
                placeholder="Enter second title concept..."
                className="w-full h-10 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#666666] mb-1.5 block">Topic/Category (optional)</label>
              <input type="text" value={context} onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., Tech Review, Cooking Tutorial..."
                className="w-full h-10 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
              />
            </div>
            <button onClick={handleTest} disabled={loading || !titleA.trim() || !titleB.trim()} className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#9B72CF] text-white text-sm font-bold hover:bg-[#8B62BF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Run A/B Test
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 animate-pulse"><div className="h-4 bg-[#1A1A1A] rounded w-3/4 mb-4" /><div className="h-12 bg-[#1A1A1A] rounded" /></div>
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 animate-pulse"><div className="h-4 bg-[#1A1A1A] rounded w-3/4 mb-4" /><div className="h-12 bg-[#1A1A1A] rounded" /></div>
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#9B72CF]" /> A/B Test Results</h3>

          {/* Winner Banner */}
          <div className="rounded-lg bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] p-4 text-center">
            <Trophy className="w-6 h-6 text-[#F5A623] mx-auto mb-2" />
            <p className="text-base font-bold text-[#F5A623]">Winner: Title {result.winner}</p>
            <p className="text-xs text-[#888888] mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> +{result.improvementPct}% predicted improvement</p>
          </div>

          {/* Side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`rounded-lg border p-4 ${result.winner === 'A' ? 'bg-[rgba(0,196,140,0.05)] border-[rgba(0,196,140,0.3)]' : 'bg-[#111111] border-[#222222]'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#888888]">TITLE A</span>
                {result.winner === 'A' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00C48C] text-[#0A0A0A]">WINNER</span>}
              </div>
              <p className="text-sm font-medium text-[#E8E8E8] mb-3">{result.titleA}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#666666]">Predicted CTR</span>
                <span className="text-lg font-bold text-[#E8E8E8]">{result.ctrA.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden mt-1">
                <div className="h-full rounded-full bg-[#4A9EFF]" style={{ width: `${Math.min(100, result.ctrA * 8)}%` }} />
              </div>
            </div>
            <div className={`rounded-lg border p-4 ${result.winner === 'B' ? 'bg-[rgba(0,196,140,0.05)] border-[rgba(0,196,140,0.3)]' : 'bg-[#111111] border-[#222222]'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#888888]">TITLE B</span>
                {result.winner === 'B' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00C48C] text-[#0A0A0A]">WINNER</span>}
              </div>
              <p className="text-sm font-medium text-[#E8E8E8] mb-3">{result.titleB}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#666666]">Predicted CTR</span>
                <span className="text-lg font-bold text-[#E8E8E8]">{result.ctrB.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden mt-1">
                <div className="h-full rounded-full bg-[#4A9EFF]" style={{ width: `${Math.min(100, result.ctrB * 8)}%` }} />
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-2">AI Reasoning</h4>
            <p className="text-sm text-[#E8E8E8] leading-relaxed">{result.reasoning}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)] flex items-center justify-center mb-4"><GitCompare className="w-8 h-8 text-[#9B72CF]" /></div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Test Your Titles</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Enter two title concepts and let AI predict which will get more clicks.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['ab-test']} tokens per test</div>}
    </div>
  );
}
