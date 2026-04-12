'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { StatCard } from '@/components/nychiq/stat-card';
import { cn, fmtV, thumbUrl, sanitizeText, scoreClass } from '@/lib/utils';
import {
  Zap,
  Eye,
  Crown,
  Lock,
  RefreshCw,
  AlertCircle,
  Flame,
  TrendingUp,
  Activity,
  Stethoscope,
  Search,
  Loader2,
  Sparkles,
  Brain,
  Target,
  Timer,
  Share2,
  Heart,
  Star,
  ChevronRight,
  ArrowRight,
  Clock,
  BarChart3,
  Image as ImageIcon,
  Play,
  Lightbulb,
} from 'lucide-react';

type Threshold = 'all' | '70' | '80' | '90';

interface ViralItem {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  viralScore: number;
  thumbnail?: string;
  publishedAt?: string;
  growthRate: number;
  engagementRate: number;
}

/* ── Viral Autopsy Types ── */
interface AutopsyResult {
  viralScore: number;
  thumbnailPsychology: string;
  titleFormula: {
    pattern: string;
    elements: string[];
  };
  hookStructure: {
    segment: string;
    description: string;
    effectiveness: 'high' | 'medium' | 'low';
  }[];
  algorithmSignals: {
    timing: string;
    retention: string;
    ctrVelocity: string;
    details: string[];
  };
  shareTriggers: {
    category: string;
    score: number;
    description: string;
  }[];
  viralityDNA: {
    thumbnail: number;
    title: number;
    hook: number;
    timing: number;
    content: number;
    sharing: number;
  };
  recommendations: string[];
}

const MOCK_AUTOPSY: AutopsyResult = {
  viralScore: 87,
  thumbnailPsychology:
    'The thumbnail uses a high-contrast split-face expression that triggers immediate curiosity. The red arrow draws the eye to a specific detail, creating an information gap. The use of bold sans-serif overlay text ("I CAN\'T BELIEVE THIS") leverages the disbelief pattern, which has a 3.2x higher CTR than neutral thumbnails. The warm color palette (orange/red) signals urgency without being aggressive.',
  titleFormula: {
    pattern: 'Curiosity Gap + Power Word + Specificity',
    elements: [
      'Curiosity Gap: "Why Nobody Talks About..." — creates information asymmetry',
      'Power Word: "Secret" — triggers FOMO and exclusivity bias',
      'Specificity: "7-Minute Trick" — concrete, achievable, time-bound',
    ],
  },
  hookStructure: [
    { segment: '0-3s', description: 'Shock statement + bold text overlay: "I discovered something that changed everything"', effectiveness: 'high' },
    { segment: '3-5s', description: 'Social proof drop: "Over 2 million people have no idea about this"', effectiveness: 'high' },
    { segment: '5-7s', description: 'Problem statement: "Here\'s the problem with the way everyone does it..."', effectiveness: 'medium' },
    { segment: '7-10s', description: 'Promise/solution teaser: "In the next 7 minutes, I\'ll show you the exact trick"', effectiveness: 'high' },
  ],
  algorithmSignals: {
    timing: 'Published on Tuesday at 3:15 PM WAT — peak engagement window for the target demographic. First-hour performance was 4.2x above channel average.',
    retention: 'Average view duration: 72% (excellent). Key drop-off point at 8:15 was mitigated by a pattern interrupt. The "loop hook" at the end drives 23% rewatches.',
    ctrVelocity: 'CTR reached 12.8% in the first hour (channel avg: 6.2%). Impression-to-click velocity placed the video in the "accelerated distribution" tier within 90 minutes.',
    details: [
      'Click-through rate: 12.8% (top 5% for niche)',
      'Average view duration: 72% (top 10% for niche)',
      'First-hour impressions: 14,200 (2.3x channel avg)',
      'Session start rate: 18% (strong browse feature signal)',
    ],
  },
  shareTriggers: [
    { category: 'Utility', score: 92, description: 'Viewers share this because it provides actionable value they believe their friends need.' },
    { category: 'Identity', score: 78, description: 'Sharing signals the sharer is "in the know" — social currency effect.' },
    { category: 'Emotion', score: 71, description: 'The surprise/discovery narrative triggers moderate emotional arousal, driving shares.' },
    { category: 'Social Currency', score: 85, description: 'The "secret knowledge" framing makes sharers feel like insiders.' },
  ],
  viralityDNA: {
    thumbnail: 88,
    title: 82,
    hook: 91,
    timing: 79,
    content: 85,
    sharing: 83,
  },
  recommendations: [
    'Replicate the "split-face shock" thumbnail format — it generated 3.2x the CTR of your standard thumbnails',
    'Use the "specific time-bound trick" title formula (e.g., "X-Minute Y That Does Z") for all tutorial content',
    'Front-load your hook with a bold claim in the first 3 seconds — this is where 40% of drop-offs happen',
    'Publish during the 2-4 PM WAT window on Tue/Wed/Thu for maximum algorithm momentum',
    'Add a "loop hook" at the end of videos to drive rewatch rate above 20%',
    'Include shareable moments every 60-90 seconds (infographics, key stats, surprise reveals)',
    'Use the information gap pattern consistently: promise to reveal something specific',
  ],
};

const DNA_AXES = [
  { key: 'thumbnail' as const, label: 'Thumbnail', color: '#3B82F6' },
  { key: 'title' as const, label: 'Title', color: '#FDBA2D' },
  { key: 'hook' as const, label: 'Hook', color: '#10B981' },
  { key: 'timing' as const, label: 'Timing', color: '#8B5CF6' },
  { key: 'content' as const, label: 'Content', color: '#EC4899' },
  { key: 'sharing' as const, label: 'Sharing', color: '#06B6D4' },
];

const THRESHOLDS: { key: Threshold; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '70', label: 'Score 70+' },
  { key: '80', label: 'Score 80+' },
  { key: '90', label: 'Score 90+' },
];

/* ── Score circle indicator ── */
function ScoreCircle({ score }: { score: number }) {
  let color = '#A3A3A3';
  let bg = 'rgba(136,136,136,0.1)';
  if (score >= 90) { color = '#10B981'; bg = 'rgba(16,185,129,0.1)'; }
  else if (score >= 80) { color = '#FDBA2D'; bg = 'rgba(253,186,45,0.1)'; }
  else if (score >= 70) { color = '#3B82F6'; bg = 'rgba(59,130,246,0.1)'; }
  else if (score >= 50) { color = '#8B5CF6'; bg = 'rgba(139,92,246,0.1)'; }

  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0"
      style={{ color, backgroundColor: bg, borderColor: `${color}40` }}
    >
      {score}
    </div>
  );
}

/* ── Tab component ── */
function ToolTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
        active
          ? 'text-[#10B981] border-[#10B981] bg-[#141414]'
          : 'text-[#A3A3A3] border-transparent hover:text-[#FFFFFF] hover:bg-[#141414]/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ── Animated circular gauge ── */
function ViralGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedDash, setAnimatedDash] = useState(circumference);

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(score * eased));
      setAnimatedDash(circumference - (score / 100) * circumference * eased);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [score, circumference]);

  let strokeColor = '#EF4444';
  if (score >= 80) strokeColor = '#10B981';
  else if (score >= 60) strokeColor = '#FDBA2D';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1F1F1F" strokeWidth="8" />
          {/* Score arc */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedDash}
            style={{ transition: 'none' }}
          />
          {/* Glow effect */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedDash}
            opacity="0.3"
            filter="blur(4px)"
            style={{ transition: 'none' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: strokeColor }}>{animatedScore}</span>
          <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider">Viral Score</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-[#A3A3A3]">
        {score >= 80 ? '🔥 Viral Potential' : score >= 60 ? '📈 Strong Potential' : '📊 Moderate Potential'}
      </span>
    </div>
  );
}

/* ── Radar chart (SVG polygon) ── */
function RadarChart({ dna }: { dna: AutopsyResult['viralityDNA'] }) {
  const size = 220;
  const center = size / 2;
  const maxRadius = 85;
  const levels = 5;

  const angles = DNA_AXES.map((_, i) => ((2 * Math.PI) / DNA_AXES.length) * i - Math.PI / 2);
  const points = DNA_AXES.map((axis, i) => {
    const value = dna[axis.key] / 100;
    const x = center + maxRadius * value * Math.cos(angles[i]);
    const y = center + maxRadius * value * Math.sin(angles[i]);
    return { x, y, axis };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const gridLines = Array.from({ length: levels }, (_, level) => {
    const r = (maxRadius / levels) * (level + 1);
    return angles.map((angle) => `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`).join(' ');
  });

  const axisLines = angles.map((angle) => {
    return `${center},${center} ${center + maxRadius * Math.cos(angle)},${center + maxRadius * Math.sin(angle)}`;
  });

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Grid polygons */}
        {gridLines.map((points, i) => (
          <polygon key={i} points={points} fill="none" stroke="#1F1F1F" strokeWidth="1" />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line key={i} x1={line.split(' ')[0].split(',')[0]} y1={line.split(' ')[0].split(',')[1]}
            x2={line.split(' ')[1].split(',')[0]} y2={line.split(' ')[1].split(',')[1]}
            stroke="#1F1F1F" strokeWidth="1" />
        ))}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(16,185,129,0.15)"
          stroke="#10B981"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={p.axis.color} stroke="#0D0D0D" strokeWidth="2" />
          </g>
        ))}

        {/* Labels */}
        {DNA_AXES.map((axis, i) => {
          const labelR = maxRadius + 20;
          const x = center + labelR * Math.cos(angles[i]);
          const y = center + labelR * Math.sin(angles[i]);
          const anchor = x > center ? 'start' : x < center ? 'end' : 'middle';
          return (
            <g key={axis.key}>
              <text x={x} y={y - 6} textAnchor={anchor} fill="#A3A3A3" fontSize="9" fontWeight="500">
                {axis.label}
              </text>
              <text x={x} y={y + 7} textAnchor={anchor} fill={axis.color} fontSize="10" fontWeight="700">
                {dna[axis.key]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Viral Autopsy Tab Content ── */
function AutopsyTab() {
  const { spendTokens } = useNychIQStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [result, setResult] = useState<AutopsyResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    const ok = spendTokens('viral');
    if (!ok) { setLoading(false); return; }

    // Simulate analysis delay
    await new Promise((r) => setTimeout(r, 1500));
    setResult(MOCK_AUTOPSY);
    setAnalyzed(true);
    setLoading(false);
  };

  const hookColors = { high: '#10B981', medium: '#FDBA2D', low: '#EF4444' };

  return (
    <div className="space-y-5">
      {/* Input bar */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(16,185,129,0.1)]">
              <Stethoscope className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Viral Autopsy</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">Deep-dive analysis of what makes any YouTube video go viral.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
              placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#10B981]/50 transition-colors"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="px-5 h-9 rounded-lg bg-[#10B981] text-[#0D0D0D] text-sm font-bold hover:bg-[#0A9A74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Analyze
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 rounded-full border-4 border-[#1F1F1F] border-t-[#10B981] animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#FFFFFF]">Analyzing video...</p>
              <p className="text-xs text-[#A3A3A3] mt-1">Breaking down virality factors, hook structure, and algorithm signals</p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis results */}
      {!loading && analyzed && result && (
        <div className="space-y-5">
          {/* Section 1: Viral Score + Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Viral Score gauge */}
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-6">
              <h3 className="text-sm font-semibold text-[#FFFFFF] mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FDBA2D]" />
                Viral Score
              </h3>
              <div className="flex justify-center">
                <ViralGauge score={result.viralScore} />
              </div>
            </div>

            {/* Virality DNA Radar Chart */}
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-6">
              <h3 className="text-sm font-semibold text-[#FFFFFF] mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#10B981]" />
                Virality DNA
              </h3>
              <RadarChart dna={result.viralityDNA} />
            </div>
          </div>

          {/* Section 2: Thumbnail Psychology */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#3B82F6]" />
              Thumbnail Psychology
            </h3>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">{result.thumbnailPsychology}</p>
          </div>

          {/* Section 3: Title Formula */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FDBA2D]" />
              Title Formula
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {result.titleFormula.pattern.split(' + ').map((part, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#FDBA2D]/10 text-[#FDBA2D] border border-[#FDBA2D]/20">
                    {part}
                  </span>
                  {i < result.titleFormula.pattern.split(' + ').length - 1 && (
                    <ChevronRight className="w-3 h-3 text-[#555555]" />
                  )}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {result.titleFormula.elements.map((element, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-[#10B981] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#A3A3A3]">{element}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Hook Structure */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-[#10B981]" />
              Hook Structure (First 10 Seconds)
            </h3>
            <div className="space-y-2">
              {result.hookStructure.map((segment, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{
                        color: hookColors[segment.effectiveness],
                        backgroundColor: `${hookColors[segment.effectiveness]}15`,
                        border: `1px solid ${hookColors[segment.effectiveness]}30`,
                      }}
                    >
                      {segment.segment}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#FFFFFF]">{segment.description}</p>
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase shrink-0 mt-1"
                    style={{ color: hookColors[segment.effectiveness] }}
                  >
                    {segment.effectiveness}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Algorithm Signals */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8B5CF6]" />
              Algorithm Signals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FDBA2D]" />
                  <span className="text-[10px] uppercase tracking-wider font-medium text-[#A3A3A3]">Timing</span>
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{result.algorithmSignals.timing}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[10px] uppercase tracking-wider font-medium text-[#A3A3A3]">Retention</span>
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{result.algorithmSignals.retention}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-[10px] uppercase tracking-wider font-medium text-[#A3A3A3]">CTR Velocity</span>
                </div>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">{result.algorithmSignals.ctrVelocity}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {result.algorithmSignals.details.map((detail, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-[#FDBA2D] shrink-0" />
                  <span className="text-xs text-[#A3A3A3]">{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Share Triggers */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#EC4899]" />
              Share Triggers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.shareTriggers.map((trigger, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#FFFFFF]">{trigger.category}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        color: trigger.score >= 85 ? '#10B981' : trigger.score >= 70 ? '#FDBA2D' : '#EF4444',
                        backgroundColor: trigger.score >= 85 ? 'rgba(16,185,129,0.1)' : trigger.score >= 70 ? 'rgba(253,186,45,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${trigger.score >= 85 ? 'rgba(16,185,129,0.25)' : trigger.score >= 70 ? 'rgba(253,186,45,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      }}
                    >
                      {trigger.score}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A3A3A3] leading-relaxed">{trigger.description}</p>
                  {/* Mini bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${trigger.score}%`,
                        backgroundColor: trigger.score >= 85 ? '#10B981' : trigger.score >= 70 ? '#FDBA2D' : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Apply These Lessons */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#FDBA2D]" />
              Apply These Lessons
            </h3>
            <div className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#FDBA2D]/20 transition-colors">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FDBA2D]/10 text-[#FDBA2D] text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-[#A3A3A3] leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-[11px] text-[#444444]">
            Cost: {TOKEN_COSTS.viral} token per analysis
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !analyzed && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-[#10B981]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Viral Autopsy</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">Paste any YouTube URL to get a deep-dive analysis of what makes it viral.</p>
        </div>
      )}
    </div>
  );
}


/* ── Main Viral Tool ── */
export function ViralTool() {
  const { spendTokens, region } = useNychIQStore();
  const [activeTab, setActiveTab] = useState<'predictor' | 'autopsy'>('predictor');
  const [threshold, setThreshold] = useState<Threshold>('all');
  const [items, setItems] = useState<ViralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSpent, setHasSpent] = useState(false);

  const fetchViral = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!hasSpent) {
      const ok = spendTokens('viral');
      if (!ok) {
        setLoading(false);
        return;
      }
      setHasSpent(true);
    }

    try {
      const res = await fetch(
        `/api/youtube/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${region}&maxResults=24`
      );
      if (!res.ok) throw new Error(`Failed to fetch viral data (${res.status})`);
      const data = await res.json();

      const mapped: ViralItem[] = (data.items || []).map((item: { id: string; snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails: { high: { url: string }; medium: { url: string } } }; statistics: { viewCount: string } }) => ({
        videoId: item.id,
        title: item.snippet?.title || 'Untitled',
        channelTitle: item.snippet?.channelTitle || 'Unknown',
        viewCount: parseInt(item.statistics?.viewCount || '0', 10),
        viralScore: Math.floor(Math.random() * 85) + 15,
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
        publishedAt: item.snippet?.publishedAt,
        growthRate: (Math.random() * 20 + 1).toFixed(1),
        engagementRate: (Math.random() * 12 + 1).toFixed(1),
      }));

      setItems(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [spendTokens, hasSpent, region]);

  useEffect(() => {
    fetchViral();
  }, [fetchViral]);

  // Filter by threshold
  const filtered = items.filter((item) => {
    if (threshold === 'all') return true;
    const min = parseInt(threshold, 10);
    return item.viralScore >= min;
  });

  // Sort by viral score descending
  const sorted = [...filtered].sort((a, b) => b.viralScore - a.viralScore);
  // Stats
  const avgScore = items.length > 0
    ? Math.round(items.reduce((s, v) => s + v.viralScore, 0) / items.length)
    : 0;
  const hotCount = items.filter((v) => v.viralScore >= 80).length;
  const onFireCount = items.filter((v) => v.viralScore >= 90).length;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Tab bar */}
      <div className="flex border-b border-[#1A1A1A]">
        <ToolTab active={activeTab === 'predictor'} onClick={() => setActiveTab('predictor')} icon={Zap} label="Viral Predictor" />
        <ToolTab active={activeTab === 'autopsy'} onClick={() => setActiveTab('autopsy')} icon={Stethoscope} label="Viral Autopsy" />
      </div>

      {/* Tab 1: Viral Predictor (original content) */}
      {activeTab === 'predictor' && (
        <>
          {/* Header Card */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[rgba(16,185,129,0.1)]">
                    <Zap className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                      Viral Predictor
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[10px] font-bold text-[#10B981]">
                        <span className="live-dot" />
                        LIVE
                      </span>
                    </h2>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">
                      AI-powered viral potential analysis
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setHasSpent(false); fetchViral(); }}
                  disabled={loading}
                  className="p-2 rounded-lg border border-[#1F1F1F] hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-4 h-4 text-[#A3A3A3]', loading && 'animate-spin')} />
                </button>
              </div>

              {/* Threshold Chips */}
              <div className="flex flex-wrap gap-1.5">
                {THRESHOLDS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setThreshold(t.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                      threshold === t.key
                        ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                        : 'bg-[#0D0D0D] text-[#A3A3A3] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#FFFFFF]'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Avg Score"
              value={avgScore}
              color="#3B82F6"
              dark
              icon={<Activity className="w-4 h-4" />}
            />
            <StatCard
              label="Hot (80+)"
              value={hotCount}
              change="↑ 3"
              color="#FDBA2D"
              dark
              icon={<Flame className="w-4 h-4" />}
            />
            <StatCard
              label="On Fire (90+)"
              value={onFireCount}
              color="#10B981"
              dark
              icon={<Zap className="w-4 h-4" />}
            />
            <StatCard
              label="Total Tracked"
              value={items.length}
              color="#8B5CF6"
              dark
              icon={<Eye className="w-4 h-4" />}
            />
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
              <p className="text-sm text-[#FFFFFF]">{error}</p>
              <button
                onClick={fetchViral}
                className="mt-3 px-4 py-2 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
              <div className="divide-y divide-[#1A1A1A]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-full bg-[#1A1A1A] animate-pulse shrink-0" />
                    <div className="w-16 h-10 rounded bg-[#1A1A1A] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Breakdown List */}
          {!loading && !error && (
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F]">
                <h3 className="text-sm font-semibold text-[#FFFFFF]">
                  Score Breakdown
                  {threshold !== 'all' && (
                    <span className="text-xs text-[#A3A3A3] ml-2">({threshold}+)</span>
                  )}
                </h3>
                <span className="text-xs text-[#666666]">{sorted.length} videos</span>
              </div>
              <div className="divide-y divide-[#1A1A1A] max-h-[600px] overflow-y-auto">
                {sorted.length === 0 ? (
                  <div className="py-12 text-center">
                    <Zap className="w-8 h-8 text-[#444444] mx-auto mb-2" />
                    <p className="text-sm text-[#A3A3A3]">No videos match this threshold</p>
                  </div>
                ) : (
                  sorted.map((item) => (
                    <div
                      key={item.videoId}
                      className="flex items-center gap-4 p-4 hover:bg-[#0D0D0D]/50 transition-colors cursor-pointer"
                      onClick={() => window.open(`https://youtube.com/watch?v=${item.videoId}`, '_blank', 'noopener')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') window.open(`https://youtube.com/watch?v=${item.videoId}`, '_blank', 'noopener');
                      }}
                    >
                      {/* Score Circle */}
                      <ScoreCircle score={item.viralScore} />

                      {/* Thumbnail */}
                      <div className="relative w-16 h-10 rounded-md overflow-hidden bg-[#1A1A1A] shrink-0">
                        <img
                          src={item.thumbnail || thumbUrl(item.videoId)}
                          alt={sanitizeText(item.title, 40)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[#FFFFFF] truncate hover:text-[#FDBA2D] transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-[#A3A3A3]">{item.channelTitle}</span>
                          <span className="text-[11px] text-[#666666]">·</span>
                          <span className="text-[11px] text-[#666666]">{fmtV(item.viewCount)} views</span>
                        </div>
                      </div>

                      {/* Growth & Engagement */}
                      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-medium text-[#10B981]">↑ {item.growthRate}%</span>
                        <span className="text-[11px] text-[#A3A3A3]">{item.engagementRate}% engage</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Token cost footer */}
          <div className="text-center text-[11px] text-[#444444]">
            Cost: {TOKEN_COSTS.viral} token per load · Region: {region} · Threshold: {threshold}
          </div>
        </>
      )}

      {/* Tab 2: Viral Autopsy */}
      {activeTab === 'autopsy' && <AutopsyTab />}
    </div>
  );
}
