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
  Scissors,
  Film,
  Download,
  Flame,
  Tag,
  Hash,
  Play,
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

type ScriptFlowTab = 'audit' | 'shorts';

interface ShortClip {
  number: number;
  startTime: string;
  endTime: string;
  hook: string;
  script: string;
  cta: string;
  caption: string;
  hashtags: string[];
  retention: number;
  viralPotential: 'Low' | 'Medium' | 'High';
}

/* ── Score Ring ── */
function ScoreRing({ score, size = 72, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#888888' : score >= 50 ? '#FDBA2D' : '#888888';

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

function getMockShorts(niche: string): ShortClip[] {
  const nicheLabel = niche || 'Content Creation';
  return [
    {
      number: 1,
      startTime: '00:00',
      endTime: '00:47',
      hook: `Stop making this one mistake in your ${nicheLabel} content — it's killing your views.`,
      script: `Here's the thing nobody tells you about ${nicheLabel}... Most creators focus on production quality when they should be focusing on the first 3 seconds. I tested this on 50 videos and the results were shocking. The videos with strong pattern interrupts got 340% more watch time. Let me show you exactly what I changed.`,
      cta: 'Follow for more growth hacks in Part 2',
      caption: `The #1 mistake killing your ${nicheLabel} views 🚨 This changed everything for me`,
      hashtags: [nicheLabel.replace(/\s+/g, ''), 'ContentCreator', 'GrowthHacks', 'ViralTips', 'Shorts'],
      retention: 87,
      viralPotential: 'High',
    },
    {
      number: 2,
      startTime: '00:47',
      endTime: '01:32',
      hook: `I went from 100 to 100K followers using this ${nicheLabel} framework.`,
      script: `Everyone asks me how I grew so fast in ${nicheLabel}. It wasn't luck — it was a simple 3-step framework. Step one: find the gap in your niche. Step two: create 10x better content than what exists. Step three: post at the exact right time. I'll break down each step right now.`,
      cta: 'Save this for later and share with a creator who needs it',
      caption: `How I gained 100K followers with this ${nicheLabel} framework 📈`,
      hashtags: [nicheLabel.replace(/\s+/g, ''), 'CreatorEconomy', '100KFollowers', 'GrowthStrategy'],
      retention: 82,
      viralPotential: 'High',
    },
    {
      number: 3,
      startTime: '02:15',
      endTime: '03:02',
      hook: 'This AI tool writes better scripts than 90% of creators — and it is free.',
      script: `I've been using AI to write my ${nicheLabel} scripts for 6 months now and the results speak for themselves. My average view duration went from 2 minutes to 7 minutes. The secret isn't just using AI — it is how you prompt it. Here's my exact prompt template that you can copy right now.`,
      cta: 'Link in bio for the full prompt list',
      caption: 'Free AI tool that writes viral scripts 🤖🚀',
      hashtags: ['AIWriting', 'ContentCreation', 'CreatorTools', 'AITools', 'ScriptWriting'],
      retention: 91,
      viralPotential: 'High',
    },
    {
      number: 4,
      startTime: '03:02',
      endTime: '03:45',
      hook: `Why 99% of ${nicheLabel} creators fail in their first year.`,
      script: `I analyzed 1,000 ${nicheLabel} channels and found the exact reason most fail. It comes down to three things: inconsistent posting schedule, ignoring analytics, and not engaging with their audience. But there is one thing that separates the successful creators from everyone else — and it is not what you think.`,
      cta: 'Comment "FRAMEWORK" and I will DM you my starter guide',
      caption: `Why most ${nicheLabel} creators fail (and how to not) 💡`,
      hashtags: ['CreatorTips', 'YouTubeGrowth', 'ContentStrategy', 'NewCreator'],
      retention: 74,
      viralPotential: 'Medium',
    },
    {
      number: 5,
      startTime: '04:10',
      endTime: '04:55',
      hook: `The algorithm secretly favors this type of ${nicheLabel} content.`,
      script: `After studying the algorithm for months, I found something wild. YouTube and TikTok both push content that creates what I call "completion loops" — where viewers feel compelled to watch until the end. The trick? Structure your content with micro-cliffhangers every 15 seconds. Let me show a real example from my channel.`,
      cta: 'Part 5 drops tomorrow — turn on notifications',
      caption: `The algorithm loves this type of content 🧠📊`,
      hashtags: ['AlgorithmHacks', 'YouTubeTips', 'ContentStrategy', 'ViralContent'],
      retention: 68,
      viralPotential: 'Medium',
    },
    {
      number: 6,
      startTime: '05:20',
      endTime: '06:01',
      hook: `I asked 10 successful ${nicheLabel} creators their #1 tip — the answers were wild.`,
      script: `I reached out to 10 creators with over 500K subscribers each and asked them one question: "If you had to start over today, what would you do differently?" The answers were surprisingly consistent. Five of them said the same thing: they would have niched down sooner. Here is how to find your perfect niche in under 10 minutes.`,
      cta: 'Which tip hit hardest? Tell me in the comments',
      caption: `10 top creators share their #1 growth tip 🔥`,
      hashtags: ['CreatorAdvice', 'GrowthTips', 'TopCreators', nicheLabel.replace(/\s+/g, ''), 'Mistakes'],
      retention: 79,
      viralPotential: 'Medium',
    },
  ];
}

/* ── Tab config ── */
const TABS: { id: ScriptFlowTab; label: string; icon: React.ReactNode }[] = [
  { id: 'audit', label: 'Dialogue Audit', icon: <ScrollText className="w-3.5 h-3.5" /> },
  { id: 'shorts', label: 'Script → Shorts', icon: <Scissors className="w-3.5 h-3.5" /> },
];

/* ════════════════════════════════════════════════
   SCRIPTFLOW TOOL
   ════════════════════════════════════════════════ */
export function ScriptFlowTool() {
  const [activeTab, setActiveTab] = useState<ScriptFlowTab>('audit');

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(253,186,45,0.1)' }}>
              <ScrollText className="w-5 h-5" style={{ color: '#FDBA2D' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">ScriptFlow</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">AI-powered script analysis, optimization &amp; short-form conversion</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 -mb-1 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[rgba(253,186,45,0.15)] text-[#FDBA2D] border border-[rgba(255,255,255,0.06)] shadow-[0_0_12px_rgba(253,186,45,0.1)]'
                    : 'text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'audit' && <AuditTab />}
      {activeTab === 'shorts' && <ShortsTab />}
    </div>
  );
}

/* ════════════════════════════════════════════════
   DIALOGUE AUDIT TAB
   ════════════════════════════════════════════════ */
function AuditTab() {
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
    <>
      {/* Textarea */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4">
          <p className="text-sm text-[#a0a0a0] mb-4">
            Paste your video transcript and get a complete audit: power word replacements, weak phrase detection, hook scoring, pacing analysis, and CTA strength evaluation.
          </p>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your video transcript here... (minimum 50 characters for analysis)"
            rows={8}
            className="w-full p-4 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none transition-colors resize-none leading-relaxed"
            style={{ caretColor: '#FDBA2D' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(253,186,45,0.5)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-[#666666]">{transcript.length} characters {transcript.length < 50 && transcript.length > 0 ? '(min. 50)' : ''}</span>
            <button
              onClick={handleAudit}
              disabled={loading || transcript.trim().length < 50}
              className="px-5 h-10 rounded-lg text-[#0a0a0a] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ backgroundColor: '#FDBA2D' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Audit Script
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-5 text-center">
          <p className="text-sm text-[#888888] mb-3">{error}</p>
          <button onClick={handleAudit} className="px-4 py-2 rounded-lg bg-[#888888]/10 text-[#888888] text-xs font-medium hover:bg-[#888888]/20 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-5">
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
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-5">
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
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#FDBA2D' }} />
              Script Audit Results
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyAll} className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: '#FDBA2D' }}>
                <Copy className="w-3 h-3" /> Copy All
              </button>
              <button onClick={handleAudit} className="flex items-center gap-1 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] transition-colors">
                <RefreshCw className="w-3 h-3" /> Re-audit
              </button>
            </div>
          </div>

          {/* Overall Score + Summary */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={result.overallScore} size={88} label="/ 100" />
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-[#FFFFFF] mb-1">Overall Script Score</h4>
                <p className="text-sm text-[#a0a0a0] leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Power Words */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5" style={{ color: '#FDBA2D' }} /> Power Word Replacements
            </h4>
            <div className="space-y-2">
              {result.powerWords.map((w, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.1)] transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-[#888888] line-through shrink-0">{w.original}</span>
                    <ArrowRight className="w-3 h-3 text-[#666666] shrink-0" />
                    <span className="text-sm font-medium shrink-0" style={{ color: '#aaa' }}>{w.replacement}</span>
                  </div>
                  <p className="text-[11px] text-[#666666] sm:text-right">{w.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Phrases */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#888888]" /> Weak Phrases
            </h4>
            <div className="space-y-2">
              {result.weakPhrases.map((w, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-sm text-[#888888] line-through">&ldquo;{w.phrase}&rdquo;</span>
                    <ArrowRight className="w-3 h-3 text-[#666666] hidden sm:block" />
                    <span className="text-sm font-medium" style={{ color: '#FDBA2D' }}>&ldquo;{w.alternative}&rdquo;</span>
                  </div>
                  <p className="text-[11px] text-[#666666] mt-1">{w.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hook Analysis */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Target className="w-3.5 h-3.5" style={{ color: '#FDBA2D' }} /> Hook Analysis (First 10 Seconds)
            </h4>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-3">
              <ScoreRing score={result.hookAnalysis.score} size={64} label="hook" />
              <p className="text-sm text-[#FFFFFF] leading-relaxed pt-2">{result.hookAnalysis.verdict}</p>
            </div>
            {result.hookAnalysis.suggestions.length > 0 && (
              <div className="space-y-1.5">
                {result.hookAnalysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(253,186,45,0.15)', color: '#FDBA2D' }}>
                      {i + 1}
                    </span>
                    <span className="text-[#a0a0a0]">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pacing Analysis */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Gauge className="w-3.5 h-3.5" style={{ color: '#FDBA2D' }} /> Pacing Analysis
            </h4>
            <div className="space-y-2">
              {result.pacingAnalysis.map((p, i) => {
                const issueColor = p.issue === 'good' ? '#888888' : p.issue === 'too_fast' ? '#888888' : '#FDBA2D';
                const issueBg = p.issue === 'good' ? 'rgba(16,185,129,0.08)' : p.issue === 'too_fast' ? 'rgba(239,68,68,0.08)' : 'rgba(253,186,45,0.08)';
                const issueLabel = p.issue === 'good' ? 'Good' : p.issue === 'too_fast' ? 'Too Fast' : 'Too Slow';
                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
                    <span className="text-xs font-medium text-[#FFFFFF] shrink-0 min-w-[160px]">{p.section}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold shrink-0" style={{ color: issueColor, backgroundColor: issueBg }}>{issueLabel}</span>
                    <p className="text-[11px] text-[#666666] sm:text-right flex-1">{p.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Evaluation */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Megaphone className="w-3.5 h-3.5" style={{ color: '#FDBA2D' }} /> CTA Strength
            </h4>
            <div className="flex items-center gap-4 mb-3">
              <ScoreRing score={result.ctaEvaluation.score} size={64} label="CTA" />
              <div className="flex-1 grid grid-cols-1 gap-2">
                {result.ctaEvaluation.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-[#888888]">+</span>
                    <span className="text-[#a0a0a0]">{s}</span>
                  </div>
                ))}
                {result.ctaEvaluation.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-[#888888]">-</span>
                    <span className="text-[#a0a0a0]">{w}</span>
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
          <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(253,186,45,0.1)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <ScrollText className="w-8 h-8" style={{ color: '#FDBA2D' }} />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Audit Your Script</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Paste your video transcript above to get a comprehensive dialogue audit with power word suggestions, pacing tips, and hook analysis.
          </p>
        </div>
      )}

      {/* Token Cost Footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#666666]">
          Cost: {TOKEN_COSTS.scriptflow} tokens per analysis
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════
   SCRIPT → SHORTS TAB
   ════════════════════════════════════════════════ */
function ShortsTab() {
  const { spendTokens } = useNychIQStore();
  const [script, setScript] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [shorts, setShorts] = useState<ShortClip[]>([]);
  const [generated, setGenerated] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleConvert = async () => {
    const trimmed = script.trim();
    if (trimmed.length < 500) return;

    setLoading(true);
    setGenerated(false);
    setShorts([]);

    const ok = spendTokens('scriptflow');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a short-form content expert. Take this long-form script and split it into 5-8 viral Shorts clips:

"${trimmed.slice(0, 6000)}"

Topic/Niche: ${niche || 'General'}

Return a JSON array of objects with these keys:
- "number": number (1-based)
- "startTime": string (MM:SS format)
- "endTime": string (MM:SS format)
- "hook": string (first 2 seconds attention grabber, max 15 words)
- "script": string (30-60 second script text)
- "cta": string (call to action, max 10 words)
- "caption": string (suggested caption, max 80 chars)
- "hashtags": array of 4-5 hashtag strings
- "retention": number (0-100, predicted retention percentage)
- "viralPotential": "Low" | "Medium" | "High"

Return ONLY the JSON array, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length >= 3) {
        setShorts(parsed);
      } else {
        setShorts(getMockShorts(niche));
      }
    } catch {
      setShorts(getMockShorts(niche));
    } finally {
      setLoading(false);
      setGenerated(true);
    }
  };

  const handleExportAll = () => {
    if (shorts.length === 0) return;
    const all = [
      '═══ SHORTS EXPORT ═══',
      `Niche: ${niche || 'General'}`,
      `Total Shorts: ${shorts.length}`,
      '',
      ...shorts.flatMap((s) => [
        `─── Short #${s.number} • [${s.startTime}-${s.endTime}] ───`,
        `🔔 Hook: ${s.hook}`,
        '',
        `📝 Script:`,
        s.script,
        '',
        `📢 CTA: ${s.cta}`,
        '',
        `💬 Caption: ${s.caption}`,
        `🏷️ Hashtags: ${s.hashtags.join(' ')}`,
        `📊 Retention: ${s.retention}%`,
        `🔥 Viral Potential: ${s.viralPotential}`,
        '',
      ]),
    ].join('\n');
    copyToClipboard(all).then(() => {
      showToast(`Exported ${shorts.length} shorts!`, 'success');
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  const viralColor = (level: ShortClip['viralPotential']) =>
    level === 'High' ? '#888888' : level === 'Medium' ? '#FDBA2D' : '#888888';
  const viralBg = (level: ShortClip['viralPotential']) =>
    level === 'High' ? 'rgba(16,185,129,0.12)' : level === 'Medium' ? 'rgba(253,186,45,0.12)' : 'rgba(239,68,68,0.12)';

  // Timeline: compute total seconds and cut point positions
  const totalDurationSec = shorts.length > 0
    ? (() => {
        const last = shorts[shorts.length - 1];
        const parts = last.endTime.split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      })()
    : 0;

  const getSeconds = (t: string) => {
    const p = t.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  };

  return (
    <div className="space-y-4">
      {/* Input Area */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Scissors className="w-4 h-4" style={{ color: '#FDBA2D' }} />
          <h3 className="text-sm font-bold text-[#FFFFFF]">Convert Long Script → Viral Shorts</h3>
        </div>
        <p className="text-xs text-[#a0a0a0] mb-4">
          Paste a long-form video script (min 500 characters) and get 5-8 optimized short-form clips with hooks, CTAs, and retention predictions.
        </p>

        {/* Niche / Topic input */}
        <div className="mb-3">
          <label className="text-[11px] font-medium text-[#666666] uppercase tracking-wider mb-1.5 block">Topic / Niche</label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g., Fitness, Tech Reviews, Personal Finance..."
            className="w-full h-10 px-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none transition-colors"
            style={{ caretColor: '#FDBA2D' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(253,186,45,0.5)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
          />
        </div>

        {/* Script textarea */}
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste your long-form video script here... (minimum 500 characters for best results)"
          rows={10}
          className="w-full p-4 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none transition-colors resize-none leading-relaxed"
          style={{ caretColor: '#FDBA2D' }}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(253,186,45,0.5)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-[#666666]">
            {script.length} characters {script.length > 0 && script.length < 500 ? `(min. 500)` : ''}
          </span>
          <button
            onClick={handleConvert}
            disabled={loading || script.trim().length < 500}
            className="px-5 h-10 rounded-lg text-[#0a0a0a] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: '#FDBA2D' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            Convert to Shorts
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FDBA2D' }} />
              <span className="text-sm font-medium text-[#FFFFFF]">Analyzing script &amp; generating shorts...</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
              <div className="h-full rounded-full animate-pulse" style={{ width: '60%', background: 'linear-gradient(90deg, #FDBA2D, #888888)' }} />
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A1A1A]" />
                <div className="h-3 bg-[#1A1A1A] rounded w-1/3" />
              </div>
              <div className="h-3 bg-[#1A1A1A] rounded w-full mb-2" />
              <div className="h-3 bg-[#1A1A1A] rounded w-4/5" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && generated && shorts.length > 0 && (
        <div className="space-y-4">
          {/* Results header + Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4" style={{ color: '#FDBA2D' }} />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">
                {shorts.length} Shorts Generated
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: '#FDBA2D', backgroundColor: 'rgba(253,186,45,0.12)' }}>
                {niche || 'General'}
              </span>
            </div>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-80"
              style={{ color: '#FDBA2D', backgroundColor: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.2)' }}
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {copiedAll ? 'Copied!' : 'Export All'}
            </button>
          </div>

          {/* Timeline Visual */}
          {totalDurationSec > 0 && (
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-[#a0a0a0]" />
                <span className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Script Timeline</span>
                <span className="text-[10px] text-[#666666] ml-auto">{Math.floor(totalDurationSec / 60)}:{String(totalDurationSec % 60).padStart(2, '0')} total</span>
              </div>
              <div className="relative w-full h-10 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] overflow-hidden">
                {/* Colored segments */}
                {shorts.map((s, i) => {
                  const startPct = (getSeconds(s.startTime) / totalDurationSec) * 100;
                  const endPct = (getSeconds(s.endTime) / totalDurationSec) * 100;
                  const width = endPct - startPct;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex items-center justify-center transition-all duration-300"
                      style={{
                        left: `${startPct}%`,
                        width: `${width}%`,
                        backgroundColor: viralBg(s.viralPotential),
                        borderTop: `2px solid ${viralColor(s.viralPotential)}`,
                        borderBottom: `2px solid ${viralColor(s.viralPotential)}`,
                      }}
                    >
                      <span className="text-[9px] font-bold text-[#FFFFFF] opacity-80 whitespace-nowrap">
                        #{s.number}
                      </span>
                    </div>
                  );
                })}
                {/* Cut point markers */}
                {shorts.map((s, i) => {
                  if (i === 0) return null;
                  const pct = (getSeconds(s.startTime) / totalDurationSec) * 100;
                  return (
                    <div
                      key={`cut-${i}`}
                      className="absolute top-0 h-full w-0.5 z-10"
                      style={{
                        left: `${pct}%`,
                        backgroundColor: '#FDBA2D',
                        boxShadow: '0 0 4px rgba(253,186,45,0.5)',
                      }}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid #888888', borderBottom: '1px solid #888888' }} />
                  <span className="text-[10px] text-[#666666]">High Viral</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: 'rgba(253,186,45,0.3)', borderTop: '1px solid #FDBA2D', borderBottom: '1px solid #FDBA2D' }} />
                  <span className="text-[10px] text-[#666666]">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid #888888', borderBottom: '1px solid #888888' }} />
                  <span className="text-[10px] text-[#666666]">Low</span>
                </div>
              </div>
            </div>
          )}

          {/* Short Cards */}
          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
            {shorts.map((s) => (
              <div
                key={s.number}
                className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 hover:border-[#1a1a1a] transition-colors group"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: 'rgba(253,186,45,0.1)', color: '#FDBA2D' }}
                    >
                      {s.number}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#FFFFFF]">Short #{s.number}</span>
                      <span className="text-xs text-[#a0a0a0] ml-2 flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {s.startTime} – {s.endTime}
                      </span>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
                    style={{ color: viralColor(s.viralPotential), backgroundColor: viralBg(s.viralPotential) }}
                  >
                    <Flame className="w-3 h-3" />
                    {s.viralPotential}
                  </span>
                </div>

                {/* Hook */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] mb-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3" style={{ color: '#FDBA2D' }} />
                    <span className="text-[10px] font-bold text-[#FDBA2D] uppercase tracking-wider">Hook (First 2s)</span>
                  </div>
                  <p className="text-sm text-[#FFFFFF] font-medium leading-relaxed">{s.hook}</p>
                </div>

                {/* Script */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] mb-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-3 h-3 text-[#a0a0a0]" />
                    <span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider">Content Script</span>
                  </div>
                  <p className="text-xs text-[#D4D4D4] leading-relaxed">{s.script}</p>
                </div>

                {/* CTA */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] mb-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Megaphone className="w-3 h-3" style={{ color: '#aaa' }} />
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">CTA</span>
                  </div>
                  <p className="text-xs text-[#D4D4D4]">{s.cta}</p>
                </div>

                {/* Caption + Hashtags */}
                <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3 h-3" style={{ color: '#aaa' }} />
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Caption &amp; Hashtags</span>
                  </div>
                  <p className="text-xs text-[#D4D4D4] mb-1.5">{s.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {s.hashtags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium text-[#888888] bg-[rgba(255,255,255,0.06)]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Retention Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <BarChart3 className="w-3.5 h-3.5 text-[#a0a0a0]" />
                    <span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider">Retention</span>
                  </div>
                  <div className="flex-1 h-2.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${s.retention}%`,
                        backgroundColor: s.retention >= 80 ? '#888888' : s.retention >= 60 ? '#FDBA2D' : '#888888',
                        boxShadow: `0 0 8px ${s.retention >= 80 ? 'rgba(16,185,129,0.4)' : s.retention >= 60 ? 'rgba(253,186,45,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold shrink-0"
                    style={{ color: s.retention >= 80 ? '#888888' : s.retention >= 60 ? '#FDBA2D' : '#888888' }}
                  >
                    {s.retention}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Token Cost Footer */}
          <div className="text-center text-[11px] text-[#666666]">
            Cost: {TOKEN_COSTS.scriptflow} tokens per conversion
          </div>
        </div>
      )}

      {/* Initial State */}
      {!loading && !generated && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(253,186,45,0.1)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <Scissors className="w-8 h-8" style={{ color: '#FDBA2D' }} />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Script → Shorts Converter</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Paste a long-form script above and get 5-8 optimized short-form clips with hooks, retention predictions, and viral potential scores.
          </p>
        </div>
      )}
    </div>
  );
}
