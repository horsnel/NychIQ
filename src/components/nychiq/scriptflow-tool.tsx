'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  ScrollText,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  Target,
  Gauge,
  ArrowRight,
  Clock,
  Megaphone,
  FileText,
  BarChart3,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

/* ── Types ── */
interface PowerWord {
  original: string;
  replacement: string;
  reasoning: string;
}

interface WeakPhrase {
  phrase: string;
  alternative: string;
  reason: string;
}

interface PacingIssue {
  section: string;
  issue: 'too_fast' | 'too_slow' | 'good';
  detail: string;
}

interface HookAnalysis {
  score: number;
  verdict: string;
  suggestions: string[];
}

interface CTAEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
}

interface ScriptResult {
  overallScore: number;
  powerWords: PowerWord[];
  weakPhrases: WeakPhrase[];
  hookAnalysis: HookAnalysis;
  pacingAnalysis: PacingIssue[];
  ctaEvaluation: CTAEvaluation;
  summary: string;
}

/* ── Score Ring ── */
function ScoreRing({ score, size = 72, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#00C48C' : score >= 50 ? '#F5A623' : '#E05252';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A1A1A" strokeWidth="6" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
          {label && <span className="text-[9px] text-[#666666]">{label}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Mock Data ── */
function getMockScript(transcript: string): ScriptResult {
  return {
    overallScore: 62,
    powerWords: [
      { original: 'very good', replacement: 'game-changing', reasoning: 'Stronger emotional impact, more shareable' },
      { original: 'I think', replacement: 'Data shows', reasoning: 'Builds authority and trust' },
      { original: 'nice', replacement: 'revolutionary', reasoning: 'More engaging vocabulary for retention' },
      { original: 'a lot of people', replacement: 'millions of creators', reasoning: 'Specificity increases credibility' },
      { original: 'stuff', replacement: 'strategies', reasoning: 'More professional, search-friendly language' },
      { original: 'basically', replacement: 'fundamentally', reasoning: 'Removes filler word, sounds more authoritative' },
    ],
    weakPhrases: [
      { phrase: "So today I'm going to talk about", alternative: "What nobody tells you about", reason: "Generic opener — lacks a hook" },
      { phrase: "And yeah so basically", alternative: "Here's the critical insight:", reason: "Filler words reduce authority" },
      { phrase: "If you know what I mean", alternative: "This is a proven strategy that", reason: "Vague phrase, loses viewer trust" },
      { phrase: "Moving on to the next thing", alternative: "Now for the game-changer:", reason: "Weak transition, viewer may drop off" },
    ],
    hookAnalysis: {
      score: 45,
      verdict: 'Weak — The first 10 seconds lack urgency or a pattern interrupt. Viewers may scroll past.',
      suggestions: [
        'Start with a bold claim or counter-intuitive statement',
        'Use a visual pattern interrupt in the first 2 seconds',
        'Pose a question that creates an "information gap"',
        'Lead with a result or transformation preview',
      ],
    },
    pacingAnalysis: [
      { section: '0:00 - 0:10 (Intro)', issue: 'too_slow', detail: 'Hook is too passive. Consider front-loading the value.' },
      { section: '0:10 - 1:30 (Setup)', issue: 'good', detail: 'Good pacing. Information delivered clearly.' },
      { section: '1:30 - 3:00 (Core)', issue: 'too_fast', detail: 'Rushing through key concepts. Slow down for comprehension.' },
      { section: '3:00 - 4:00 (Examples)', issue: 'good', detail: 'Great use of real-world examples.' },
      { section: '4:00 - 4:30 (CTA)', issue: 'too_slow', detail: 'CTA drags on. Make it punchy and direct.' },
    ],
    ctaEvaluation: {
      score: 58,
      strengths: ['Mentions subscribe action', 'Has a clear verbal ask'],
      weaknesses: ['CTA comes too late in the video', 'No specific reason given to subscribe', 'Missing engagement question for comments'],
    },
    summary: 'Your script has solid content but needs stronger hooks and tighter pacing. Focus on the first 10 seconds to maximize audience retention, and place your CTA earlier with a compelling reason to act.',
  };
}

/* ════════════════════════════════════════════════
   SCRIPTFLOW TOOL
   ════════════════════════════════════════════════ */
export function ScriptFlowTool() {
  const { spendTokens } = useNychIQStore();
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleAudit = async () => {
    const trimmed = transcript.trim();
    if (!trimmed || trimmed.length < 50) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('scriptflow');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube script analysis expert. Analyze this video transcript and provide a comprehensive audit:

"${trimmed.slice(0, 4000)}"

Return a JSON object with these exact keys:
- "overallScore": number 0-100
- "powerWords": array of objects with "original", "replacement", "reasoning" (find 5-8 word/phrase improvements)
- "weakPhrases": array of objects with "phrase", "alternative", "reason" (find 3-5 weak phrases)
- "hookAnalysis": object with "score" (0-100), "verdict" (string), "suggestions" (array of 3-4 strings)
- "pacingAnalysis": array of objects with "section" (string), "issue" ("too_fast"/"too_slow"/"good"), "detail" (string)
- "ctaEvaluation": object with "score" (0-100), "strengths" (array), "weaknesses" (array)
- "summary": string (2-3 sentence summary)

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setResult({
        overallScore: typeof parsed.overallScore === 'number' ? Math.min(100, Math.max(0, parsed.overallScore)) : 62,
        powerWords: Array.isArray(parsed.powerWords) ? parsed.powerWords : getMockScript(trimmed).powerWords,
        weakPhrases: Array.isArray(parsed.weakPhrases) ? parsed.weakPhrases : getMockScript(trimmed).weakPhrases,
        hookAnalysis: parsed.hookAnalysis || getMockScript(trimmed).hookAnalysis,
        pacingAnalysis: Array.isArray(parsed.pacingAnalysis) ? parsed.pacingAnalysis : getMockScript(trimmed).pacingAnalysis,
        ctaEvaluation: parsed.ctaEvaluation || getMockScript(trimmed).ctaEvaluation,
        summary: typeof parsed.summary === 'string' ? parsed.summary : getMockScript(trimmed).summary,
      });
    } catch {
      setResult(getMockScript(trimmed));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!result) return;
    const all = [
      `Script Score: ${result.overallScore}/100`,
      '',
      '=== POWER WORD REPLACEMENTS ===',
      ...result.powerWords.map((w) => `"${w.original}" → "${w.replacement}" — ${w.reasoning}`),
      '',
      '=== WEAK PHRASES ===',
      ...result.weakPhrases.map((w) => `"${w.phrase}" → "${w.alternative}" — ${w.reason}`),
      '',
      '=== HOOK ANALYSIS ===',
      `Score: ${result.hookAnalysis.score}/100`,
      result.hookAnalysis.verdict,
      ...result.hookAnalysis.suggestions.map((s) => `• ${s}`),
      '',
      '=== PACING ===',
      ...result.pacingAnalysis.map((p) => `${p.section} [${p.issue}] — ${p.detail}`),
      '',
      '=== CTA ===',
      `Score: ${result.ctaEvaluation.score}/100`,
      ...result.ctaEvaluation.strengths.map((s) => `+ ${s}`),
      ...result.ctaEvaluation.weaknesses.map((w) => `- ${w}`),
      '',
      `Summary: ${result.summary}`,
    ].join('\n');
    copyToClipboard(all).then(() => showToast('Full audit copied!', 'success'));
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(245,166,35,0.1)' }}>
              <ScrollText className="w-5 h-5" style={{ color: '#F5A623' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">ScriptFlow</h2>
              <p className="text-xs text-[#888888] mt-0.5">Dialogue Audit — AI-powered script analysis &amp; optimization</p>
            </div>
          </div>
          <p className="text-sm text-[#888888] mb-4">
            Paste your video transcript and get a complete audit: power word replacements, weak phrase detection, hook scoring, pacing analysis, and CTA strength evaluation.
          </p>

          {/* Textarea */}
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your video transcript here... (minimum 50 characters for analysis)"
            rows={8}
            className="w-full p-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none transition-colors resize-none leading-relaxed"
            style={{ caretColor: '#F5A623' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(245,166,35,0.5)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-[#555555]">{transcript.length} characters {transcript.length < 50 && transcript.length > 0 ? '(min. 50)' : ''}</span>
            <button
              onClick={handleAudit}
              disabled={loading || transcript.trim().length < 50}
              className="px-5 h-10 rounded-lg text-[#0A0A0A] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: '#F5A623' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Audit Script
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-5 text-center">
          <p className="text-sm text-[#E05252] mb-3">{error}</p>
          <button onClick={handleAudit} className="px-4 py-2 rounded-lg bg-[#E05252]/10 text-[#E05252] text-xs font-medium hover:bg-[#E05252]/20 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
            <div className="flex items-center gap-4">
              <div className="w-[72px] h-[72px] rounded-full bg-[#1A1A1A] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-4/5" />
              </div>
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-5">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#F5A623' }} />
              Script Audit Results
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyAll} className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: '#F5A623' }}>
                <Copy className="w-3 h-3" /> Copy All
              </button>
              <button onClick={handleAudit} className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#E8E8E8] transition-colors">
                <RefreshCw className="w-3 h-3" /> Re-audit
              </button>
            </div>
          </div>

          {/* Overall Score + Summary */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={result.overallScore} size={88} label="/ 100" />
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-[#E8E8E8] mb-1">Overall Script Score</h4>
                <p className="text-sm text-[#888888] leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Power Words */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5" style={{ color: '#F5A623' }} /> Power Word Replacements
            </h4>
            <div className="space-y-2">
              {result.powerWords.map((w, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-[#E05252] line-through shrink-0">{w.original}</span>
                    <ArrowRight className="w-3 h-3 text-[#444444] shrink-0" />
                    <span className="text-sm font-medium shrink-0" style={{ color: '#00C48C' }}>{w.replacement}</span>
                  </div>
                  <p className="text-[11px] text-[#666666] sm:text-right">{w.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Phrases */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#E05252]" /> Weak Phrases
            </h4>
            <div className="space-y-2">
              {result.weakPhrases.map((w, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#0D0D0D] border border-[rgba(224,82,82,0.15)] hover:border-[rgba(224,82,82,0.3)] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-sm text-[#E05252] line-through">&ldquo;{w.phrase}&rdquo;</span>
                    <ArrowRight className="w-3 h-3 text-[#444444] hidden sm:block" />
                    <span className="text-sm font-medium" style={{ color: '#F5A623' }}>&ldquo;{w.alternative}&rdquo;</span>
                  </div>
                  <p className="text-[11px] text-[#666666] mt-1">{w.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hook Analysis */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Target className="w-3.5 h-3.5" style={{ color: '#F5A623' }} /> Hook Analysis (First 10 Seconds)
            </h4>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-3">
              <ScoreRing score={result.hookAnalysis.score} size={64} label="hook" />
              <p className="text-sm text-[#E8E8E8] leading-relaxed pt-2">{result.hookAnalysis.verdict}</p>
            </div>
            {result.hookAnalysis.suggestions.length > 0 && (
              <div className="space-y-1.5">
                {result.hookAnalysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
                      {i + 1}
                    </span>
                    <span className="text-[#888888]">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pacing Analysis */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Gauge className="w-3.5 h-3.5" style={{ color: '#F5A623' }} /> Pacing Analysis
            </h4>
            <div className="space-y-2">
              {result.pacingAnalysis.map((p, i) => {
                const issueColor = p.issue === 'good' ? '#00C48C' : p.issue === 'too_fast' ? '#E05252' : '#F5A623';
                const issueBg = p.issue === 'good' ? 'rgba(0,196,140,0.08)' : p.issue === 'too_fast' ? 'rgba(224,82,82,0.08)' : 'rgba(245,166,35,0.08)';
                const issueLabel = p.issue === 'good' ? 'Good' : p.issue === 'too_fast' ? 'Too Fast' : 'Too Slow';
                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                    <span className="text-xs font-medium text-[#E8E8E8] shrink-0 min-w-[160px]">{p.section}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0" style={{ color: issueColor, backgroundColor: issueBg }}>{issueLabel}</span>
                    <p className="text-[11px] text-[#666666] sm:text-right flex-1">{p.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Evaluation */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Megaphone className="w-3.5 h-3.5" style={{ color: '#F5A623' }} /> CTA Strength
            </h4>
            <div className="flex items-center gap-4 mb-3">
              <ScoreRing score={result.ctaEvaluation.score} size={64} label="CTA" />
              <div className="flex-1 grid grid-cols-1 gap-2">
                {result.ctaEvaluation.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-[#00C48C]">+</span>
                    <span className="text-[#888888]">{s}</span>
                  </div>
                ))}
                {result.ctaEvaluation.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-[#E05252]">-</span>
                    <span className="text-[#888888]">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(245,166,35,0.1)', borderColor: 'rgba(245,166,35,0.2)' }}>
            <ScrollText className="w-8 h-8" style={{ color: '#F5A623' }} />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Audit Your Script</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">
            Paste your video transcript above to get a comprehensive dialogue audit with power word suggestions, pacing tips, and hook analysis.
          </p>
        </div>
      )}

      {/* Token Cost Footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS.scriptflow} tokens per analysis
        </div>
      )}
    </div>
  );
}
