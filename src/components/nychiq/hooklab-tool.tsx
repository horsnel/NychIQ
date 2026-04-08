'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Activity,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Timer,
  AlertTriangle,
  Eye,
  Scissors,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Zap,
  SkipForward,
  Sparkles,
} from 'lucide-react';

/* ── Types ── */
interface RetentionBar {
  second: string;
  retention: number;
  label: 'high-skip' | 'moderate' | 'engaged' | 'peak';
}

interface LullZone {
  start: string;
  end: string;
  duration: string;
  severity: 'warning' | 'critical';
}

interface FatigueAlert {
  section: string;
  duration: string;
  issue: string;
}

interface TrimSuggestion {
  timestamp: string;
  type: 'cut' | 'tighten';
  reason: string;
  potentialGain: string;
}

interface RetentionResult {
  overallRetention: number;
  hookScore: number;
  retentionBars: RetentionBar[];
  lullZones: LullZone[];
  fatigueAlerts: FatigueAlert[];
  trimSuggestions: TrimSuggestion[];
  competitorBenchmark: { label: string; value: number }[];
  summary: string;
  hookMismatch: string[];
}

const RETENTION_LABEL_COLORS: Record<string, { color: string; bg: string }> = {
  'high-skip': { color: '#E05252', bg: 'rgba(224,82,82,0.15)' },
  moderate: { color: '#F5A623', bg: 'rgba(245,166,35,0.15)' },
  engaged: { color: '#4A9EFF', bg: 'rgba(74,158,255,0.15)' },
  peak: { color: '#00C48C', bg: 'rgba(0,196,140,0.15)' },
};

/* ── Retention bar component ── */
function RetentionBarRow({ bar }: { bar: RetentionBar }) {
  const config = RETENTION_LABEL_COLORS[bar.label];
  const height = Math.max(8, (bar.retention / 100) * 100);
  return (
    <div className="flex items-end gap-2 flex-1 min-w-0">
      <div className="flex-1 flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold" style={{ color: config.color }}>
          {bar.retention}%
        </span>
        <div
          className="w-full rounded-sm transition-all duration-500 min-h-[8px]"
          style={{ height: `${height}%`, backgroundColor: config.color, minHeight: '8px', maxHeight: '100px' }}
        />
        <span className="text-[9px] text-[#666666]">{bar.second}</span>
      </div>
    </div>
  );
}

/* ── Competitor benchmark row ── */
function BenchmarkRow({ label, value, isUser }: { label: string; value: number; isUser?: boolean }) {
  const color = isUser ? '#E05252' : '#4A9EFF';
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs w-28 shrink-0 ${isUser ? 'font-bold text-[#E8E8E8]' : 'text-[#888888]'}`}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

/* ── Mock fallback data ── */
function getMockResult(transcript: string): RetentionResult {
  return {
    overallRetention: 42,
    hookScore: 55,
    retentionBars: [
      { second: '0-5s', retention: 92, label: 'peak' },
      { second: '5-10s', retention: 78, label: 'engaged' },
      { second: '10-15s', retention: 45, label: 'moderate' },
      { second: '15-20s', retention: 28, label: 'high-skip' },
      { second: '20-25s', retention: 35, label: 'moderate' },
      { second: '25-30s', retention: 52, label: 'engaged' },
    ],
    lullZones: [
      { start: '0:12', end: '0:14', duration: '2.0s', severity: 'critical' },
      { start: '0:22', end: '0:23.5', duration: '1.5s', severity: 'warning' },
    ],
    fatigueAlerts: [
      { section: '0:10 - 0:18', duration: '8s', issue: 'Static talking head with no visual change' },
    ],
    trimSuggestions: [
      { timestamp: '0:12 - 0:14', type: 'cut', reason: 'Silence gap with no spoken content', potentialGain: '+8% retention' },
      { timestamp: '0:00 - 0:03', type: 'tighten', reason: 'Slow intro — get to the hook faster', potentialGain: '+12% retention' },
      { timestamp: '0:15 - 0:20', type: 'cut', reason: 'Repetitive explanation without value add', potentialGain: '+6% retention' },
    ],
    competitorBenchmark: [
      { label: 'Your Video', value: 42 },
      { label: 'Top Performers', value: 68 },
      { label: 'Channel Average', value: 55 },
      { label: 'Niche Average', value: 48 },
    ],
    summary:
      'Your opening hook is decent but loses momentum around 10 seconds. The 12-14 second silence is a critical drop-off point. Consider cutting dead air and front-loading your most compelling content.',
    hookMismatch: [
      'Title promises "quick tips" but intro starts with personal story',
      'Hook tone is calm but thumbnail suggests excitement',
    ],
  };
}

/* ── Main HookLab Tool ── */
export function HookLabTool() {
  const { spendTokens } = useNychIQStore();
  const [transcript, setTranscript] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [result, setResult] = useState<RetentionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const canAnalyze = transcript.trim().length > 20 || videoUrl.trim().length > 0;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('hooklab');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube retention expert. Analyze this ${videoUrl ? 'video' : 'transcript'} for viewer retention patterns.

${videoUrl ? `Video URL: ${videoUrl}` : ''}
Transcript:
${transcript.trim()}

Return a JSON object with:
- "overallRetention": Predicted overall retention percentage (20-80)
- "hookScore": Hook effectiveness score (0-100)
- "retentionBars": Array of 6 objects for 5-second intervals (0-5s, 5-10s, ..., 25-30s), each with:
  - "second": Time label (e.g., "0-5s")
  - "retention": Retention percentage (10-100)
  - "label": One of "high-skip", "moderate", "engaged", "peak"
- "lullZones": Array of 2-3 objects with:
  - "start": Start timestamp (e.g., "0:12")
  - "end": End timestamp
  - "duration": Duration string (e.g., "2.0s")
  - "severity": "warning" or "critical"
- "fatigueAlerts": Array of 1-2 objects with:
  - "section": Time range string
  - "duration": How long the section is
  - "issue": Description of the visual fatigue issue
- "trimSuggestions": Array of 3 objects with:
  - "timestamp": Time range
  - "type": "cut" or "tighten"
  - "reason": Why to trim
  - "potentialGain": Expected retention gain (e.g., "+8% retention")
- "competitorBenchmark": Array of 4 objects with "label" and "value" (percentage)
- "summary": 2-3 sentence analysis
- "hookMismatch": Array of 1-2 hook mismatch descriptions

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setResult({
        overallRetention: parseInt(parsed.overallRetention, 10) || 45,
        hookScore: parseInt(parsed.hookScore, 10) || 50,
        retentionBars: Array.isArray(parsed.retentionBars)
          ? parsed.retentionBars.map((b: any) => ({
              second: b.second || '0-5s',
              retention: Math.min(100, Math.max(10, parseInt(b.retention, 10) || 50)),
              label: ['high-skip', 'moderate', 'engaged', 'peak'].includes(b.label) ? b.label : 'moderate',
            }))
          : [],
        lullZones: Array.isArray(parsed.lullZones)
          ? parsed.lullZones.map((z: any) => ({
              start: z.start || '0:00',
              end: z.end || '0:05',
              duration: z.duration || '1.0s',
              severity: z.severity === 'critical' ? 'critical' : 'warning',
            }))
          : [],
        fatigueAlerts: Array.isArray(parsed.fatigueAlerts)
          ? parsed.fatigueAlerts.map((f: any) => ({
              section: f.section || '0:00-0:05',
              duration: f.duration || '5s',
              issue: f.issue || 'Static visual content',
            }))
          : [],
        trimSuggestions: Array.isArray(parsed.trimSuggestions)
          ? parsed.trimSuggestions.map((t: any) => ({
              timestamp: t.timestamp || '0:00-0:05',
              type: t.type === 'cut' ? 'cut' : 'tighten',
              reason: t.reason || 'Improve pacing',
              potentialGain: t.potentialGain || '+5% retention',
            }))
          : [],
        competitorBenchmark: Array.isArray(parsed.competitorBenchmark)
          ? parsed.competitorBenchmark.map((b: any) => ({
              label: b.label || 'Average',
              value: parseInt(b.value, 10) || 50,
            }))
          : [],
        summary: parsed.summary || 'Retention analysis complete.',
        hookMismatch: Array.isArray(parsed.hookMismatch) ? parsed.hookMismatch : [],
      });
    } catch {
      setResult(getMockResult(transcript));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `HookLab Retention Analysis\nOverall Retention: ${result.overallRetention}%\nHook Score: ${result.hookScore}/100\n\n${result.summary}\n\nTrim Suggestions:\n${result.trimSuggestions.map((t) => `- ${t.timestamp} (${t.type}): ${t.reason} — ${t.potentialGain}`).join('\n')}`;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setTranscript('');
    setVideoUrl('');
    setResult(null);
    setError(null);
    setSearched(false);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(224,82,82,0.1)]">
              <Activity className="w-5 h-5 text-[#E05252]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">HookLab — Retention Predictor</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                AI-powered retention analysis with second-by-second breakdown
              </p>
            </div>
          </div>
          <p className="text-sm text-[#888888] mb-4">
            Paste a video URL or transcript. AI scans the first 30 seconds and predicts retention
            drop-offs with detailed analysis.
          </p>

          {/* URL Input */}
          <div className="relative mb-2">
            <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Video URL (optional — paste transcript below instead)"
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#E05252]/50 focus:ring-1 focus:ring-[#E05252]/20 transition-colors"
            />
          </div>

          {/* Transcript Textarea */}
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste transcript here (at least 20 characters for analysis)..."
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#E05252]/50 focus:ring-1 focus:ring-[#E05252]/20 transition-colors resize-none"
          />

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleAnalyze}
              disabled={loading || !canAnalyze}
              className="px-5 h-11 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              style={{
                backgroundColor: canAnalyze ? '#E05252' : '#333333',
                color: canAnalyze ? '#FFFFFF' : '#888888',
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze Retention
            </button>
            {searched && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 h-11 rounded-lg border border-[#222222] text-xs text-[#888888] hover:bg-[#1A1A1A] hover:text-[#E8E8E8] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#E05252] mx-auto mb-2" />
          <p className="text-sm text-[#E8E8E8]">{error}</p>
          <button
            onClick={handleAnalyze}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            style={{ backgroundColor: '#E05252', color: '#FFFFFF' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-[#E05252] animate-spin" />
              <span className="text-sm text-[#888888]">Scanning retention patterns...</span>
            </div>
            <div className="flex gap-2 mb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1">
                  <div className="h-20 bg-[#1A1A1A] rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-[#E05252]" />
                <span className="text-xs text-[#888888]">Predicted Retention</span>
              </div>
              <div className="text-2xl font-bold text-[#E8E8E8]">{result.overallRetention}%</div>
            </div>
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-[#F5A623]" />
                <span className="text-xs text-[#888888]">Hook Score</span>
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: result.hookScore >= 70 ? '#00C48C' : result.hookScore >= 40 ? '#F5A623' : '#E05252' }}
              >
                {result.hookScore}/100
              </div>
            </div>
          </div>

          {/* Retention Graph */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#E05252]" />
              <h3 className="text-sm font-semibold text-[#E8E8E8]">Retention Curve (First 30 Seconds)</h3>
            </div>
            <div className="flex gap-1 h-[120px] items-end">
              {result.retentionBars.map((bar, i) => (
                <RetentionBarRow key={i} bar={bar} />
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              {Object.entries(RETENTION_LABEL_COLORS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: val.color }} />
                  <span className="text-[10px] text-[#888888]">
                    {key === 'high-skip' ? 'High Skip' : key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lull Zones & Fatigue Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lull Detector */}
            <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                <Timer className="w-4 h-4 text-[#F5A623]" />
                <h3 className="text-sm font-semibold text-[#E8E8E8]">Lull Detector</h3>
              </div>
              <div className="p-4 space-y-2">
                {result.lullZones.length > 0 ? (
                  result.lullZones.map((lull, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ backgroundColor: lull.severity === 'critical' ? 'rgba(224,82,82,0.08)' : 'rgba(245,166,35,0.08)' }}
                    >
                      <AlertTriangle
                        className="w-4 h-4 shrink-0"
                        style={{ color: lull.severity === 'critical' ? '#E05252' : '#F5A623' }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-[#E8E8E8]">
                          {lull.start} — {lull.end}
                        </span>
                        <span className="text-[10px] text-[#888888] ml-2">{lull.duration} gap</span>
                      </div>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: lull.severity === 'critical' ? '#E05252' : '#F5A623',
                          backgroundColor: lull.severity === 'critical' ? 'rgba(224,82,82,0.15)' : 'rgba(245,166,35,0.15)',
                        }}
                      >
                        {lull.severity.toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#00C48C]">No significant lulls detected.</p>
                )}
              </div>
            </div>

            {/* Visual Fatigue */}
            <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A]">
                <Eye className="w-4 h-4 text-[#4A9EFF]" />
                <h3 className="text-sm font-semibold text-[#E8E8E8]">Visual Fatigue Alerts</h3>
              </div>
              <div className="p-4 space-y-2">
                {result.fatigueAlerts.length > 0 ? (
                  result.fatigueAlerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[rgba(74,158,255,0.06)]">
                      <TrendingDown className="w-4 h-4 text-[#4A9EFF] mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-[#E8E8E8]">{alert.section}</span>
                        <span className="text-[10px] text-[#888888] ml-2">({alert.duration})</span>
                        <p className="text-[11px] text-[#888888] mt-0.5">{alert.issue}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#00C48C]">No visual fatigue detected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Hook Mismatch */}
          {result.hookMismatch.length > 0 && (
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <div className="flex items-center gap-2 mb-3">
                <SkipForward className="w-4 h-4 text-[#E05252]" />
                <h3 className="text-sm font-semibold text-[#E8E8E8]">Hook Mismatch Detection</h3>
              </div>
              {result.hookMismatch.map((mismatch, i) => (
                <p key={i} className="text-xs text-[#888888] flex items-start gap-2 mb-1.5">
                  <span className="text-[#E05252] mt-0.5">!</span>
                  {mismatch}
                </p>
              ))}
            </div>
          )}

          {/* Competitor Benchmark */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#4A9EFF]" />
              <h3 className="text-sm font-semibold text-[#E8E8E8]">Competitor Benchmark</h3>
            </div>
            <div className="space-y-2">
              {result.competitorBenchmark.map((bench, i) => (
                <BenchmarkRow key={i} label={bench.label} value={bench.value} isUser={i === 0} />
              ))}
            </div>
          </div>

          {/* Auto-Trim Suggestions */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#00C48C]" />
                <h3 className="text-sm font-semibold text-[#E8E8E8]">Auto-Trim Suggestions</h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#E8E8E8] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#00C48C]" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {result.trimSuggestions.map((trim, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: trim.type === 'cut' ? 'rgba(224,82,82,0.1)' : 'rgba(245,166,35,0.1)',
                    }}
                  >
                    {trim.type === 'cut' ? (
                      <Scissors className="w-3.5 h-3.5 text-[#E05252]" />
                    ) : (
                      <Timer className="w-3.5 h-3.5 text-[#F5A623]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-[#E8E8E8]">{trim.timestamp}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={{
                          color: trim.type === 'cut' ? '#E05252' : '#F5A623',
                          backgroundColor: trim.type === 'cut' ? 'rgba(224,82,82,0.15)' : 'rgba(245,166,35,0.15)',
                        }}
                      >
                        {trim.type}
                      </span>
                      <span className="text-[10px] text-[#00C48C] font-medium ml-auto">{trim.potentialGain}</span>
                    </div>
                    <p className="text-[11px] text-[#888888]">{trim.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
              <h3 className="text-sm font-semibold text-[#E8E8E8]">AI Summary</h3>
            </div>
            <p className="text-sm text-[#888888] leading-relaxed">{result.summary}</p>
          </div>
        </>
      )}

      {/* Initial idle state */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.2)] flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-[#E05252]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Retention Predictor</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">
            Paste a transcript or video URL above to get a second-by-second retention breakdown with AI-powered improvement suggestions.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS.hooklab} tokens per analysis
        </div>
      )}
    </div>
  );
}
