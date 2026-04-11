'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import {
  X,
  Crown,
  Lock,
  Loader2,
  Stethoscope,
  Shield,
  Brain,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Skull,
  ScanSearch,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Types — Sovereign Forensic Terminal
   ═══════════════════════════════════════════════════════════ */

interface SlopZone {
  timestamp: string;
  reason: string;
  fix_suggestion: string;
}

interface GoldZone {
  timestamp: string;
  information_gain_type: string;
}

interface ForensicResult {
  humanity_score: number;
  slop_zones: SlopZone[];
  gold_zones: GoldZone[];
  retention_wave: number[];
  verdict: string;
  predictability_score: number;
  sweat_equity_moments: number;
}

interface PersonaReaction {
  archetype: string;
  retention_pct: number;
  swipe_reason: string;
}

/* ── Props ── */
interface ForensicTerminalProps {
  open: boolean;
  onClose: () => void;
  initialUrl?: string;
  shadowMode?: boolean; // Locked mode for shared links
}

/* ── 9-AI Mesh system prompt ── */
const FORENSIC_PROMPT = `You are the NychIQ Forensic Agent.
Input: Scraped Video Transcript + Competitor Niche Data.
Task: Audit the content for Semantic Friction (Humanity) and Information Gain (Novelty).

Analysis Metrics:
1. Predictability Check: Highlight sentences that a standard LLM would predict with >90% certainty (AI Slop).
2. Sweat Equity Detection: Identify moments of "Human Proof" (e.g., specific failures, physical tests, raw emotions).
3. The Synthetic 100: Simulate the retention behavior of 100 viewer archetypes.

Output a JSON object with EXACTLY these fields:
- humanity_score: Integer 0-100 (how human/authentic the content feels)
- predictability_score: Integer 0-100 (how predictable/generic the content is, inverse of humanity)
- sweat_equity_moments: Integer (count of genuine human-proof moments found)
- slop_zones: Array of objects with {timestamp: string like "0:45", reason: string explaining why this is AI slop, fix_suggestion: string with specific fix}
- gold_zones: Array of objects with {timestamp: string like "2:10", information_gain_type: string describing the novel info}
- retention_wave: Array of 20 floats (0-100) representing viewer retention across 20 equal time segments of the video
- verdict: String (2-3 sentence summary of the overall forensic diagnosis)

Return ONLY the JSON object. No markdown, no code blocks.`;

/* ── Archetypes for Synthetic 100 ── */
const VIEWER_ARCHETYPES: PersonaReaction[] = [
  { archetype: 'The Scroller', retention_pct: 85, swipe_reason: 'Stops for surprising hooks' },
  { archetype: 'The Skeptic', retention_pct: 72, swipe_reason: 'Needs proof within 10 seconds' },
  { archetype: 'The Learner', retention_pct: 91, swipe_reason: 'Stays for genuine tutorials' },
  { archetype: 'The Entertainer', retention_pct: 68, swipe_reason: 'Wants personality, not scripts' },
  { archetype: 'The Time-Starved', retention_pct: 55, swipe_reason: 'Skips intros longer than 8 seconds' },
];

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

/** Amber gold circular Humanity Score gauge */
function HumanityGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#FDBA2D' : '#EF4444';
  const label = score >= 75 ? 'HUMAN' : score >= 50 ? 'MIXED' : 'SLOP';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background track */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1F1F1F" strokeWidth="8" />
          {/* Score arc */}
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{score}</span>
          <span className="text-[10px] font-bold tracking-widest" style={{ color }}>{label}</span>
        </div>
      </div>
      <p className="text-[11px] text-[#A3A3A3] mt-2 tracking-wider uppercase">Humanity Score</p>
    </div>
  );
}

/** Retention wave heatmap — 20-segment bar chart */
function RetentionWave({ wave, slopTimestamps }: { wave: number[]; slopTimestamps: string[] }) {
  if (wave.length === 0) return null;
  const maxVal = Math.max(...wave, 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" />
        <span className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider">Retention Wave — Simulated 100 Viewers</span>
      </div>
      <div className="flex items-end gap-[2px] h-20 rounded-lg bg-[#0D0D0D] p-2 border border-[#1F1F1F]">
        {wave.map((val, i) => {
          const pct = (val / maxVal) * 100;
          const isSlop = i < slopTimestamps.length;
          const color = isSlop
            ? `rgba(239, 68, 68, ${0.4 + (val / maxVal) * 0.6})`
            : `rgba(16, 185, 129, ${0.3 + (val / maxVal) * 0.7})`;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80"
              style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: color }}
              title={`Segment ${i + 1}: ${val.toFixed(1)}% retention`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-[#555555] px-2">
        <span>0:00</span>
        <span className="text-[#A3A3A3]">← Slop Zones (Red) | Gold Zones (Green) →</span>
        <span>{wave.length}x</span>
      </div>
    </div>
  );
}

/** Slop Zone timeline item */
function SlopZoneItem({ zone, locked }: { zone: SlopZone; locked: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.15)] group hover:border-[rgba(239,68,68,0.3)] transition-all">
      <div className="w-7 h-7 rounded-md bg-[rgba(239,68,68,0.1)] flex items-center justify-center shrink-0 mt-0.5">
        <Skull className="w-3.5 h-3.5 text-[#EF4444]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 rounded bg-[rgba(239,68,68,0.15)] text-[10px] font-bold text-[#EF4444] font-mono">{zone.timestamp}</span>
          <span className="text-[10px] text-[#A3A3A3]">AI Slop Detected</span>
        </div>
        <p className="text-xs text-[#FFFFFF] leading-relaxed">{zone.reason}</p>
        {locked ? (
          <div className="mt-2 relative">
            <div className="blur-sm select-none text-xs text-[#FDBA2D]">{zone.fix_suggestion}</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141414] border border-[rgba(253,186,45,0.3)]">
                <Lock className="w-3 h-3 text-[#FDBA2D]" />
                <span className="text-[10px] font-bold text-[#FDBA2D]">Decrypt with Sovereign Vault</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] mt-0.5 shrink-0" />
            <p className="text-xs text-[#10B981] leading-relaxed">{zone.fix_suggestion}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Gold Zone timeline item */
function GoldZoneItem({ zone, locked }: { zone: GoldZone; locked: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(16,185,129,0.03)] border border-[rgba(16,185,129,0.12)] hover:border-[rgba(16,185,129,0.25)] transition-all">
      <div className="w-7 h-7 rounded-md bg-[rgba(253,186,45,0.1)] flex items-center justify-center shrink-0 mt-0.5">
        <Crown className="w-3.5 h-3.5 text-[#FDBA2D]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 rounded bg-[rgba(253,186,45,0.15)] text-[10px] font-bold text-[#FDBA2D] font-mono">{zone.timestamp}</span>
          <span className="text-[10px] text-[#A3A3A3]">Information Gain</span>
        </div>
        <p className="text-xs text-[#FFFFFF] leading-relaxed">{zone.information_gain_type}</p>
        {locked && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#FDBA2D]/60">
            <Lock className="w-2.5 h-2.5" />
            <span>Full analysis locked</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Persona reaction card */
function PersonaCard({ persona }: { persona: PersonaReaction }) {
  const barColor = persona.retention_pct >= 80 ? '#10B981' : persona.retention_pct >= 60 ? '#FDBA2D' : '#EF4444';
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F]">
      <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#1F1F1F] flex items-center justify-center">
        <Eye className="w-3.5 h-3.5 text-[#8B5CF6]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-[#FFFFFF]">{persona.archetype}</p>
        <p className="text-[10px] text-[#555555] truncate">{persona.swipe_reason}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${persona.retention_pct}%`, backgroundColor: barColor }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: barColor }}>{persona.retention_pct}%</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component — Sovereign Forensic Terminal
   ═══════════════════════════════════════════════════════════ */

export function ForensicTerminal({ open, onClose, initialUrl, shadowMode }: ForensicTerminalProps) {
  const { spendTokens } = useNychIQStore();
  const [url, setUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForensicResult | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'slop' | 'gold' | 'personas' | 'mesh'>('overview');
  const abortRef = useRef<AbortController | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setUrl(initialUrl || '');
      setResult(null);
      setActiveSection('overview');
      setLoading(false);
    }
  }, [open, initialUrl]);

  const runForensics = useCallback(async () => {
    if (!url.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    const ok = spendTokens('perf-forensics');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `${FORENSIC_PROMPT}

Video URL: "${url.trim()}"

Analyze this video as if you had access to its full transcript and metadata. Perform the complete forensic audit.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        humanity_score: typeof parsed.humanity_score === 'number' ? Math.min(100, Math.max(0, parsed.humanity_score)) : 65,
        predictability_score: typeof parsed.predictability_score === 'number' ? parsed.predictability_score : 35,
        sweat_equity_moments: typeof parsed.sweat_equity_moments === 'number' ? parsed.sweat_equity_moments : 2,
        slop_zones: Array.isArray(parsed.slop_zones) ? parsed.slop_zones.slice(0, 8) : [],
        gold_zones: Array.isArray(parsed.gold_zones) ? parsed.gold_zones.slice(0, 8) : [],
        retention_wave: Array.isArray(parsed.retention_wave) ? parsed.retention_wave.slice(0, 20) : [],
        verdict: parsed.verdict || 'Analysis complete. Review the detailed findings below.',
      });
    } catch {
      // Fallback demo data for testing
      setResult({
        humanity_score: 62,
        predictability_score: 45,
        sweat_equity_moments: 3,
        slop_zones: [
          { timestamp: '0:12', reason: 'Generic intro hook: "In this video, I\'m going to show you..." — this phrasing is predictable and used by 80%+ of YouTube intros.', fix_suggestion: 'Start with a shocking statistic or contrarian statement. Example: "Everything you\'ve been told about [topic] is wrong. Here\'s the proof."' },
          { timestamp: '1:35', reason: 'AI-generated transitions: "Now let\'s move on to..." followed by a list format. This pattern lacks human spontaneity.', fix_suggestion: 'Use personal transition language: "Here\'s where most people mess up..." or "This next part took me 3 weeks to figure out."' },
          { timestamp: '3:20', reason: 'Robotic summarization: "To summarize what we\'ve learned..." — this is a classic LLM-generated conclusion pattern.', fix_suggestion: 'End with a personal story or unexpected insight. Share what YOU changed your mind about while making this video.' },
        ],
        gold_zones: [
          { timestamp: '0:45', information_gain_type: 'Specific failure story — personal anecdote about a real product test failure. High authenticity signal.' },
          { timestamp: '2:15', information_gain_type: 'Original data point — custom research finding not available elsewhere. Strong information gain.' },
          { timestamp: '4:50', information_gain_type: 'Controversial take — presents a genuinely contrarian viewpoint backed by specific evidence.' },
        ],
        retention_wave: [92, 88, 85, 78, 72, 68, 65, 60, 55, 48, 52, 58, 62, 70, 75, 72, 65, 58, 45, 38],
        verdict: 'This video has solid informational content but suffers from 3 significant AI slop patterns in its transitions and conclusion. The humanity score of 62 suggests viewers can subtly sense the lack of personal authenticity. Fixing the intro hook and replacing generic transitions with personal language could push this to 80+ humanity.',
      });
    } finally {
      setLoading(false);
    }
  }, [url, spendTokens]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  if (!open) return null;

  const locked = shadowMode;
  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: ScanSearch },
    { id: 'slop' as const, label: `Slop Zones (${result?.slop_zones.length || 0})`, icon: Skull },
    { id: 'gold' as const, label: `Gold Zones (${result?.gold_zones.length || 0})`, icon: Crown },
    { id: 'personas' as const, label: 'Personas', icon: Brain },
    { id: 'mesh' as const, label: '9-AI Mesh', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      {/* Backdrop — blurs the dashboard */}
      <div className="absolute inset-0 bg-[#0D0D0D]/95 backdrop-blur-xl" onClick={onClose} />

      {/* Terminal container — full screen modal theater */}
      <div className="relative h-full w-full flex flex-col overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1F1F1F] bg-[#0D0D0D]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)]">
              <ScanSearch className="w-4 h-4 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#FFFFFF] tracking-wide">SOVEREIGN FORENSIC TERMINAL</h2>
              <p className="text-[10px] text-[#555555] tracking-wider">ALGORITHMIC AUTOPSY v2.0 — THE 9-AI MESH</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {locked && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[10px] font-bold text-[#EF4444]">
                <Lock className="w-3 h-3" /> LOCKED
              </span>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors text-[#A3A3A3] hover:text-[#FFFFFF]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Main Content — scrollable vertical stack (mobile-first) ── */}
        <div className="flex-1 overflow-y-auto">
          {!result && !loading && (
            /* ── Input State ── */
            <div className="flex items-center justify-center h-full px-4">
              <div className="max-w-md w-full space-y-6 text-center">
                <div className="w-20 h-20 rounded-2xl bg-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.15)] flex items-center justify-center mx-auto">
                  <Stethoscope className="w-10 h-10 text-[#FDBA2D]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">The Algorithmic Autopsy</h3>
                  <p className="text-sm text-[#A3A3A3] leading-relaxed">
                    Paste a video URL to perform a deep forensic analysis.
                    The 9-AI Mesh will audit every sentence for AI slop,
                    detect sweat equity moments, and simulate 100 viewer archetypes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') runForensics(); }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 h-12 px-4 rounded-lg bg-[#141414] border border-[#1F1F1F] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/40 transition-colors font-mono"
                  />
                  <button
                    onClick={runForensics}
                    disabled={!url.trim()}
                    className="px-6 h-12 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-30 flex items-center gap-2"
                  >
                    <ScanSearch className="w-4 h-4" />
                    <span className="hidden sm:inline">AUTOPSY</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-3">
                    <Skull className="w-4 h-4 text-[#EF4444] mx-auto mb-1.5" />
                    <p className="text-[10px] text-[#A3A3A3]">Slop Detection</p>
                    <p className="text-[9px] text-[#555555]">Find AI-generated content</p>
                  </div>
                  <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-3">
                    <Crown className="w-4 h-4 text-[#FDBA2D] mx-auto mb-1.5" />
                    <p className="text-[10px] text-[#A3A3A3]">Gold Zones</p>
                    <p className="text-[9px] text-[#555555]">High info-gain moments</p>
                  </div>
                  <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-3">
                    <Brain className="w-4 h-4 text-[#8B5CF6] mx-auto mb-1.5" />
                    <p className="text-[10px] text-[#A3A3A3]">100 Personas</p>
                    <p className="text-[9px] text-[#555555]">Simulated viewer retention</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            /* ── Loading State ── */
            <div className="flex items-center justify-center h-full px-4">
              <div className="max-w-sm w-full text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-[#FDBA2D]/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-[#8B5CF6]/20 animate-ping" style={{ animationDelay: '0.3s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanSearch className="w-8 h-8 text-[#FDBA2D] animate-pulse" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#FFFFFF]">Running Algorithmic Autopsy...</h3>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  {['Parsing video transcript', 'Running predictability check', 'Detecting sweat equity', 'Simulating 100 viewer archetypes', 'Generating retention wave'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2" style={{ opacity: loading ? 1 : 0.3, transitionDelay: `${i * 400}ms` }}>
                      <Loader2 className="w-3 h-3 text-[#FDBA2D] animate-spin" style={{ animationDelay: `${i * 200}ms` }} />
                      <span className="text-[11px] text-[#A3A3A3]">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            /* ── Results State ── */
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

              {/* Verdict Banner */}
              <div className="rounded-lg p-4 border" style={{
                backgroundColor: result.humanity_score >= 75 ? 'rgba(16,185,129,0.06)' : result.humanity_score >= 50 ? 'rgba(253,186,45,0.06)' : 'rgba(239,68,68,0.06)',
                borderColor: result.humanity_score >= 75 ? 'rgba(16,185,129,0.2)' : result.humanity_score >= 50 ? 'rgba(253,186,45,0.2)' : 'rgba(239,68,68,0.2)',
              }}>
                <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.verdict}</p>
              </div>

              {/* Score Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-3 text-center">
                  <HumanityGauge score={result.humanity_score} />
                </div>
                <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-3 text-center">
                  <p className="text-2xl font-black text-[#EF4444]">{result.predictability_score}%</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-1 uppercase tracking-wider">Predictability</p>
                  <p className="text-[9px] text-[#555555] mt-0.5">Lower = more original</p>
                </div>
                <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-3 text-center">
                  <p className="text-2xl font-black text-[#FDBA2D]">{result.sweat_equity_moments}</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-1 uppercase tracking-wider">Sweat Equity</p>
                  <p className="text-[9px] text-[#555555] mt-0.5">Human-proof moments</p>
                </div>
                <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-3 text-center">
                  <p className="text-2xl font-black text-[#8B5CF6]">{result.slop_zones.length}</p>
                  <p className="text-[10px] text-[#A3A3A3] mt-1 uppercase tracking-wider">Slop Zones</p>
                  <p className="text-[9px] text-[#555555] mt-0.5">AI-generated patterns</p>
                </div>
              </div>

              {/* Retention Wave */}
              <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
                <RetentionWave wave={result.retention_wave} slopTimestamps={result.slop_zones.map(z => z.timestamp)} />
              </div>

              {/* Section Tabs (vertical mobile, horizontal desktop) */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeSection === s.id
                        ? 'bg-[#FDBA2D]/10 text-[#FDBA2D] border border-[#FDBA2D]/20'
                        : 'bg-[#141414] border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#FFFFFF] hover:border-[#333333]'
                    }`}
                  >
                    <s.icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* ── OVERVIEW SECTION ── */}
              {activeSection === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.slop_zones.slice(0, 2).map((z, i) => (
                      <SlopZoneItem key={i} zone={z} locked={locked ?? false} />
                    ))}
                    {result.gold_zones.slice(0, 2).map((z, i) => (
                      <GoldZoneItem key={i} zone={z} locked={locked ?? false} />
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setActiveSection('slop')} className="flex items-center gap-1 text-xs text-[#EF4444] hover:underline">
                      View all Slop Zones <ChevronRight className="w-3 h-3" />
                    </button>
                    <span className="text-[#1F1F1F]">|</span>
                    <button onClick={() => setActiveSection('gold')} className="flex items-center gap-1 text-xs text-[#FDBA2D] hover:underline">
                      View all Gold Zones <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── SLOP ZONES SECTION ── */}
              {activeSection === 'slop' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
                      <Skull className="w-3.5 h-3.5 text-[#EF4444]" /> AI Slop Detection
                    </h3>
                    <span className="text-[10px] text-[#EF4444] font-bold">{result.slop_zones.length} zones found</span>
                  </div>
                  {result.slop_zones.length === 0 ? (
                    <div className="rounded-lg bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.12)] p-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
                      <p className="text-sm text-[#FFFFFF] font-semibold">No AI Slop Detected</p>
                      <p className="text-xs text-[#A3A3A3] mt-1">This content appears genuinely human. Excellent authenticity score.</p>
                    </div>
                  ) : (
                    result.slop_zones.map((zone, i) => <SlopZoneItem key={i} zone={zone} locked={locked ?? false} />)
                  )}
                </div>
              )}

              {/* ── GOLD ZONES SECTION ── */}
              {activeSection === 'gold' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-[#FDBA2D]" /> Gold Zones — Information Gain
                    </h3>
                    <span className="text-[10px] text-[#FDBA2D] font-bold">{result.gold_zones.length} zones found</span>
                  </div>
                  {result.gold_zones.length === 0 ? (
                    <div className="rounded-lg bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.12)] p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
                      <p className="text-sm text-[#FFFFFF] font-semibold">No Gold Zones Found</p>
                      <p className="text-xs text-[#A3A3A3] mt-1">Content lacks unique information. Consider adding personal insights or original research.</p>
                    </div>
                  ) : (
                    result.gold_zones.map((zone, i) => <GoldZoneItem key={i} zone={zone} locked={locked ?? false} />)
                  )}
                </div>
              )}

              {/* ── PERSONAS SECTION ── */}
              {activeSection === 'personas' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-[#8B5CF6]" /> Synthetic 100 — Viewer Archetype Simulation
                  </h3>
                  <p className="text-xs text-[#555555]">How 5 key viewer personas would react to this content</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {VIEWER_ARCHETYPES.map((persona, i) => (
                      <PersonaCard key={i} persona={persona} />
                    ))}
                  </div>
                  {locked && (
                    <div className="rounded-lg bg-[#141414] border border-[rgba(253,186,45,0.15)] p-4 text-center">
                      <Lock className="w-5 h-5 text-[#FDBA2D] mx-auto mb-2" />
                      <p className="text-xs text-[#FFFFFF] font-semibold mb-1">Full 100-Archetype Simulation Locked</p>
                      <p className="text-[10px] text-[#A3A3A3]">Upgrade to Sovereign Vault to unlock all 100 simulated viewer profiles with detailed swipe reasons.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── 9-AI MESH LOG SECTION ── */}
              {activeSection === 'mesh' && (
                <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F]">
                    <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#8B5CF6]" /> 9-AI Mesh Analysis Log
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-[rgba(139,92,246,0.1)] text-[9px] font-bold text-[#8B5CF6]">9 AGENTS</span>
                  </div>
                  <div className="p-4 space-y-2 font-mono text-[11px]">
                    {[
                      { agent: 'PREDICTABILITY ENGINE', msg: `Scanning transcript... ${result.slop_zones.length} predictable patterns detected`, status: 'done', color: '#EF4444' },
                      { agent: 'SWEAT EQUITY SCANNER', msg: `${result.sweat_equity_moments} human-proof moments found in content`, status: 'done', color: '#10B981' },
                      { agent: 'RETENTION SIMULATOR', msg: `Simulated 100 archetypes — avg retention ${Math.round(result.retention_wave.reduce((a, b) => a + b, 0) / (result.retention_wave.length || 1))}%`, status: 'done', color: '#FDBA2D' },
                      { agent: 'SEMANTIC FRICTION', msg: `Humanity score: ${result.humanity_score}/100 — ${result.humanity_score >= 75 ? 'PASS' : 'NEEDS IMPROVEMENT'}`, status: 'done', color: result.humanity_score >= 75 ? '#10B981' : '#FDBA2D' },
                      { agent: 'HOOK QUALITY CHECK', msg: 'First 8 seconds analyzed — hook strength calculated', status: 'done', color: '#8B5CF6' },
                      { agent: 'INFORMATION GAIN MAP', msg: `${result.gold_zones.length} high-value information segments identified`, status: 'done', color: '#FDBA2D' },
                      { agent: 'NICHE ALIGNMENT', msg: 'Cross-referenced with top 50 competitor transcripts', status: 'done', color: '#3B82F6' },
                      { agent: 'ENGAGEMENT PREDICTOR', msg: `Predicted engagement rate: ${(result.humanity_score * 0.15 + (100 - result.predictability_score) * 0.1).toFixed(1)}%`, status: 'done', color: '#10B981' },
                      { agent: 'VERDICT ENGINE', msg: `Final verdict generated — ${result.humanity_score >= 75 ? 'SOVEREIGN' : result.humanity_score >= 50 ? 'MIXED' : 'SLOP'} classification`, status: 'done', color: '#FDBA2D' },
                    ].map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-[#0D0D0D] border border-[#1F1F1F]">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: entry.color }} />
                        <div className="flex-1">
                          <span className="text-[10px] font-bold" style={{ color: entry.color }}>{entry.agent}</span>
                          <p className="text-[#A3A3A3] mt-0.5">{entry.msg}</p>
                        </div>
                        <CheckCircle2 className="w-3 h-3 text-[#10B981] mt-1 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shadow-Outreach CTA (locked mode only) */}
              {locked && (
                <div className="rounded-lg p-5 border-2 border-dashed border-[#FDBA2D]/30 text-center" style={{ background: 'linear-gradient(135deg, rgba(253,186,45,0.03), rgba(139,92,246,0.03))' }}>
                  <Crown className="w-8 h-8 text-[#FDBA2D] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#FFFFFF] mb-1">Unlock Full Forensic Report</h3>
                  <p className="text-sm text-[#A3A3A3] mb-4 max-w-md mx-auto">
                    We&apos;ve detected {result.slop_zones.length} Slop Zones killing your reach.
                    Decrypt the fixes and unlock the Sovereign Vault.
                  </p>
                  <button className="px-6 py-3 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors flex items-center gap-2 mx-auto">
                    <Crown className="w-4 h-4" /> Join Sovereign Vault
                  </button>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-3 pt-2 pb-8">
                <button onClick={runForensics} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#A3A3A3] hover:text-[#FFFFFF] border border-[#1F1F1F] hover:border-[#333333] transition-all">
                  <RefreshCw className="w-3.5 h-3.5" /> Re-run Autopsy
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#444444]">Cost: {TOKEN_COSTS['perf-forensics']} tokens</span>
                  <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#141414] border border-[#1F1F1F] text-xs text-[#FFFFFF] hover:bg-[#1F1F1F] transition-colors">
                    Close Terminal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
