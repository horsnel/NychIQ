'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { fmtV } from '@/lib/utils';
import {
  Palette,
  Eye,
  Users,
  Play,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Circle,
  Upload,
  Loader2,
  Zap,
  FileText,
  Tag,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
  BrainCircuit,
  Layers,
  Activity,
  Scan,
  Wrench,
  ScrollText,
  Scale,
  Shield,
  Target,
  ArrowRight,
  RotateCcw,
  Radar,
  Crosshair,
  Bot,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════ */
type StudioTab = 'overview' | 'forensics' | 'checklist' | 'preupload';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistCategory {
  name: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
}

interface ForensicsTool {
  id: string;
  emoji: string;
  name: string;
  subtitle: string;
  description: string;
  tokens: number;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════════════════ */
const MOCK_CHANNEL = {
  name: 'NychIQ Academy',
  handle: '@nychiqacademy',
  subscribers: 247800,
  totalViews: 18420000,
  videoCount: 342,
  avgViews: 53860,
  engagementRate: 6.8,
  healthScore: 78,
};

const FORENSICS_TOOLS: ForensicsTool[] = [
  {
    id: 'lume',
    emoji: '⚡',
    name: 'Lume',
    subtitle: 'Thumbnail A/B Simulator',
    description: 'AI heatmaps predict which thumbnail gets highest CTR. Compare up to 4 designs and get instant performance projections.',
    tokens: TOKEN_COSTS['lume'] ?? 8,
    icon: <Layers className="w-6 h-6" />,
    color: '#FDBA2D',
    glowColor: 'rgba(253,186,45,0.15)',
  },
  {
    id: 'hooklab',
    emoji: '🧪',
    name: 'HookLab',
    subtitle: 'Retention Predictor',
    description: 'Scans first 30 seconds of your video. Flags dead air, weak audio, and predicts audience drop-off points.',
    tokens: TOKEN_COSTS['hooklab'] ?? 10,
    icon: <Activity className="w-6 h-6" />,
    color: '#EF4444',
    glowColor: 'rgba(239,68,68,0.15)',
  },
  {
    id: 'pulsecheck',
    emoji: '📈',
    name: 'PulseCheck',
    subtitle: 'Algorithm Alignment',
    description: 'Checks if your video aligns with current algorithm trends. Analyzes timing, topic relevance, and discoverability.',
    tokens: TOKEN_COSTS['pulsecheck'] ?? 5,
    icon: <Scan className="w-6 h-6" />,
    color: '#10B981',
    glowColor: 'rgba(16,185,129,0.15)',
  },
  {
    id: 'blueprint-ai',
    emoji: '🏗️',
    name: 'Blueprint AI',
    subtitle: 'Metadata Architect',
    description: 'Generates perfect SEO structure with timestamps, tags, and description optimized for maximum search visibility.',
    tokens: TOKEN_COSTS['blueprint-ai'] ?? 5,
    icon: <BrainCircuit className="w-6 h-6" />,
    color: '#4A9EFF',
    glowColor: 'rgba(74,158,255,0.15)',
  },
  {
    id: 'scriptflow',
    emoji: '📜',
    name: 'ScriptFlow',
    subtitle: 'Dialogue Audit',
    description: 'AI suggests Power Word replacements for your scripts. Boost retention with stronger hooks, transitions, and CTAs.',
    tokens: TOKEN_COSTS['scriptflow'] ?? 8,
    icon: <ScrollText className="w-6 h-6" />,
    color: '#9B72CF',
    glowColor: 'rgba(155,114,207,0.15)',
  },
  {
    id: 'arbitrage',
    emoji: '⚖️',
    name: 'Arbitrage',
    subtitle: 'Revenue Tagging',
    description: 'Suggests high-CPM ad categories and tags. Maximize revenue per 1,000 views with strategic content tagging.',
    tokens: TOKEN_COSTS['arbitrage'] ?? 8,
    icon: <Scale className="w-6 h-6" />,
    color: '#D4A843',
    glowColor: 'rgba(212,168,67,0.15)',
  },
];

const DEFAULT_CHECKLIST: ChecklistCategory[] = [
  {
    name: 'Title',
    icon: <FileText className="w-3.5 h-3.5" />,
    items: [
      { id: 't1', text: 'Title is under 60 characters', checked: false },
      { id: 't2', text: 'Primary keyword in first half of title', checked: false },
      { id: 't3', text: 'Title creates curiosity or urgency', checked: false },
      { id: 't4', text: 'No clickbait — title matches content', checked: false },
      { id: 't5', text: 'Power word used (How, Why, Secret, etc.)', checked: false },
    ],
  },
  {
    name: 'Thumbnail',
    icon: <Palette className="w-3.5 h-3.5" />,
    items: [
      { id: 'th1', text: 'Thumbnail has 3 or fewer text elements', checked: false },
      { id: 'th2', text: 'Text readable at mobile size', checked: false },
      { id: 'th3', text: 'High contrast background', checked: false },
      { id: 'th4', text: 'Human face with emotion (if applicable)', checked: false },
      { id: 'th5', text: 'Thumbnail differs from recent uploads', checked: false },
    ],
  },
  {
    name: 'Description',
    icon: <FileText className="w-3.5 h-3.5" />,
    items: [
      { id: 'd1', text: 'First 2 lines are compelling and keyword-rich', checked: false },
      { id: 'd2', text: 'Description is at least 200 words', checked: false },
      { id: 'd3', text: 'Includes relevant hashtags (#)', checked: false },
      { id: 'd4', text: 'Links to related videos / playlists', checked: false },
      { id: 'd5', text: 'Social media / subscribe CTA included', checked: false },
    ],
  },
  {
    name: 'Tags',
    icon: <Tag className="w-3.5 h-3.5" />,
    items: [
      { id: 'tg1', text: 'Primary keyword as first tag', checked: false },
      { id: 'tg2', text: '10–15 relevant tags used', checked: false },
      { id: 'tg3', text: 'Mix of broad and long-tail keywords', checked: false },
      { id: 'tg4', text: 'Tags match video content (no tag stuffing)', checked: false },
      { id: 'tg5', text: 'Competitor keyword tags included', checked: false },
    ],
  },
  {
    name: 'First 24 Hours',
    icon: <Clock className="w-3.5 h-3.5" />,
    items: [
      { id: 'f1', text: 'Posted at optimal time for audience', checked: false },
      { id: 'f2', text: 'Community post shared on upload', checked: false },
      { id: 'f3', text: 'Pinned comment with engagement question', checked: false },
      { id: 'f4', text: 'Shared on external social platforms', checked: false },
      { id: 'f5', text: 'Replied to early comments within 1 hour', checked: false },
    ],
  },
];

const STORAGE_KEY = 'nychiq_studio_checklist';

const SCANNING_STEPS = [
  { label: 'Connecting to video source', icon: <Radar className="w-4 h-4" /> },
  { label: 'Analyzing thumbnail & title impact', icon: <Eye className="w-4 h-4" /> },
  { label: 'Evaluating keyword & SEO strategy', icon: <Target className="w-4 h-4" /> },
  { label: 'Scoring algorithmic alignment', icon: <BrainCircuit className="w-4 h-4" /> },
  { label: 'Generating AI recommendations', icon: <Sparkles className="w-4 h-4" /> },
];

/* ══════════════════════════════════════════════════════════
   TABS CONFIG
   ══════════════════════════════════════════════════════════ */
const TABS: { id: StudioTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Radar className="w-3.5 h-3.5" /> },
  { id: 'forensics', label: 'Forensics Suite', icon: <Crosshair className="w-3.5 h-3.5" /> },
  { id: 'checklist', label: 'Checklist', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { id: 'preupload', label: 'Pre-Upload', icon: <Upload className="w-3.5 h-3.5" /> },
];

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════ */

/* ── Health Score Gauge ── */
function HealthGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const radius = size === 'lg' ? 62 : size === 'md' ? 48 : 36;
  const stroke = size === 'lg' ? 8 : size === 'md' ? 7 : 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#FDBA2D' : score >= 40 ? '#9B72CF' : '#EF4444';
  const label = score >= 80 ? 'Optimal' : score >= 60 ? 'Healthy' : score >= 40 ? 'Needs Work' : 'At Risk';
  const dim = (radius + stroke) * 2 + 4;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="-rotate-90" style={{ width: dim, height: dim }} viewBox={`0 0 ${dim} ${dim}`}>
          <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="#1A1A1A" strokeWidth={stroke} />
          <circle
            cx={dim / 2} cy={dim / 2} r={radius} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold" style={{ color, fontSize: size === 'lg' ? '28px' : size === 'md' ? '20px' : '16px' }}>{score}</span>
          <span className="text-[10px] text-[#888888]">/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-medium" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

/* ── Score Badge ── */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#FDBA2D' : '#EF4444';
  const bg = score >= 80 ? 'rgba(16,185,129,0.12)' : score >= 50 ? 'rgba(253,186,45,0.12)' : 'rgba(239,68,68,0.12)';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold" style={{ color, backgroundColor: bg }}>
      {score}
    </span>
  );
}

/* ── Scanning Line Animation ── */
function ScanLine() {
  return (
    <div className="relative w-full overflow-hidden h-1 rounded-full bg-[#1A1A1A]">
      <div
        className="absolute inset-y-0 w-1/3 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #9B72CF, transparent)',
          animation: 'scanLine 2s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes scanLine {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

/* ── Tactical Corner Bracket ── */
function TacticalCorners({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Top-left */}
      <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[#9B72CF] opacity-40 rounded-tl-sm pointer-events-none" />
      {/* Top-right */}
      <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[#9B72CF] opacity-40 rounded-tr-sm pointer-events-none" />
      {/* Bottom-left */}
      <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[#9B72CF] opacity-40 rounded-bl-sm pointer-events-none" />
      {/* Bottom-right */}
      <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[#9B72CF] opacity-40 rounded-br-sm pointer-events-none" />
      {children}
    </div>
  );
}

/* ── Glow Pulse Dot ── */
function GlowDot({ color = '#9B72CF' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   CHECKLIST HELPERS
   ══════════════════════════════════════════════════════════ */
function loadChecklist(): ChecklistCategory[] {
  if (typeof window === 'undefined') return DEFAULT_CHECKLIST;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_CHECKLIST;
}

function persistChecklist(cats: ChecklistCategory[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cats)); } catch { /* ignore */ }
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export function StudioTool() {
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');
  const { setActiveTool } = useNychIQStore();

  const handleLaunchTool = useCallback((toolId: string) => {
    setActiveTool(toolId);
  }, [setActiveTool]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* ── Header Card ── */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] px-4 sm:px-5 py-4 relative overflow-hidden">
        {/* Background subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#9B72CF 1px, transparent 1px), linear-gradient(90deg, #9B72CF 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg border border-[rgba(155,114,207,0.25)]" style={{ background: 'radial-gradient(circle, rgba(155,114,207,0.2) 0%, transparent 70%)' }}>
              <Palette className="w-5 h-5 text-[#9B72CF]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#E8E8E8] tracking-tight">Pre-Flight Check</h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-[#9B72CF] bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)]">STUDIO</span>
              </div>
              <p className="text-[11px] text-[#888888] mt-0.5">Run forensics on your content before publishing. 6 AI-powered tools for maximum impact.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <GlowDot color="#10B981" />
              <span className="text-[10px] font-medium text-[#10B981]">FREE · 0 TOKENS</span>
            </div>
          </div>

          <ScanLine />

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 mt-4 -mb-1 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[rgba(155,114,207,0.15)] text-[#9B72CF] border border-[rgba(155,114,207,0.3)] shadow-[0_0_12px_rgba(155,114,207,0.1)]'
                    : 'text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'overview' && <OverviewTab onLaunch={handleLaunchTool} />}
      {activeTab === 'forensics' && <ForensicsTab onLaunch={handleLaunchTool} />}
      {activeTab === 'checklist' && <ChecklistTab />}
      {activeTab === 'preupload' && <PreUploadTab />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OVERVIEW TAB
   ══════════════════════════════════════════════════════════ */
function OverviewTab({ onLaunch }: { onLaunch: (id: string) => void }) {
  const ch = MOCK_CHANNEL;
  const stats = [
    { label: 'Subscribers', value: fmtV(ch.subscribers), icon: <Users className="w-4 h-4" />, color: '#9B72CF' },
    { label: 'Total Views', value: fmtV(ch.totalViews), icon: <Eye className="w-4 h-4" />, color: '#4A9EFF' },
    { label: 'Videos', value: ch.videoCount.toLocaleString(), icon: <Play className="w-4 h-4" />, color: '#FDBA2D' },
    { label: 'Avg Views', value: fmtV(ch.avgViews), icon: <BarChart3 className="w-4 h-4" />, color: '#10B981' },
    { label: 'Engagement', value: `${ch.engagementRate}%`, icon: <TrendingUp className="w-4 h-4" />, color: '#EF4444' },
  ];

  return (
    <div className="space-y-4">
      {/* Channel Health Card */}
      <TacticalCorners className="rounded-lg bg-[#141414] border border-[#222222] p-5">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9B72CF] to-[#FDBA2D] flex items-center justify-center">
              <span className="text-2xl font-bold text-white">NA</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#10B981] border-2 border-[#141414] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">✓</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-[#E8E8E8] tracking-tight">{ch.name}</h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold text-[#9B72CF] bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)]">VERIFIED</span>
            </div>
            <p className="text-sm text-[#9B72CF] font-medium mb-2">{ch.handle}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#888888]">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {fmtV(ch.subscribers)} subs</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {fmtV(ch.totalViews)} views</span>
              <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {ch.videoCount} videos</span>
            </div>
          </div>

          {/* Health Score */}
          <div className="flex-shrink-0">
            <HealthGauge score={ch.healthScore} size="lg" />
          </div>
        </div>
      </TacticalCorners>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-[#141414] border border-[#222222] p-4 flex flex-col gap-2 hover:border-[#333333] transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{stat.label}</span>
              <div style={{ color: stat.color }} className="opacity-60 group-hover:opacity-100 transition-opacity">
                {stat.icon}
              </div>
            </div>
            <span className="text-xl font-bold text-[#E8E8E8] tracking-tight">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions — 6 Sub-Tool Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Crosshair className="w-4 h-4 text-[#9B72CF]" />
          <h3 className="text-sm font-bold text-[#E8E8E8]">Quick Actions</h3>
          <span className="text-[10px] text-[#888888] ml-1">Launch a forensics tool</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FORENSICS_TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onLaunch(tool.id)}
              className="rounded-lg bg-[#141414] border border-[#222222] p-4 text-left hover:border-[#333333] transition-all duration-200 group hover:shadow-[0_0_20px_rgba(155,114,207,0.06)]"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: tool.glowColor, color: tool.color }}
                >
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#E8E8E8] group-hover:text-white transition-colors">
                      {tool.emoji} {tool.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#888888] mt-0.5">{tool.subtitle}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#444444] group-hover:text-[#9B72CF] transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORENSICS SUITE TAB
   ══════════════════════════════════════════════════════════ */
function ForensicsTab({ onLaunch }: { onLaunch: (id: string) => void }) {
  return (
    <div className="space-y-4">
      {/* Suite Header */}
      <TacticalCorners className="rounded-lg bg-[#141414] border border-[#222222] p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(155,114,207,0.25) 0%, transparent 70%)' }}>
            <Shield className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#E8E8E8]">Pre-Upload Forensics Suite</h3>
            <p className="text-[11px] text-[#888888] mt-0.5">6 AI-powered tools to analyze, optimize, and validate your content before publishing.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(155,114,207,0.08)] border border-[rgba(155,114,207,0.15)]">
            <GlowDot color="#9B72CF" />
            <span className="text-[10px] font-medium text-[#9B72CF]">6 TOOLS ACTIVE</span>
          </div>
        </div>
        <div className="mt-3">
          <ScanLine />
        </div>
      </TacticalCorners>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FORENSICS_TOOLS.map((tool, idx) => (
          <div
            key={tool.id}
            className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden hover:border-[#333333] transition-all duration-300 group hover:shadow-[0_0_30px_rgba(155,114,207,0.05)] animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'backwards' }}
          >
            {/* Top accent line */}
            <div className="h-0.5 w-full" style={{ backgroundColor: tool.color, opacity: 0.6 }} />

            <div className="p-5">
              {/* Icon + Token Badge */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                  style={{
                    backgroundColor: tool.glowColor,
                    color: tool.color,
                    boxShadow: `0 0 20px ${tool.glowColor}`,
                  }}
                >
                  {tool.icon}
                </div>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    color: tool.color,
                    backgroundColor: tool.glowColor,
                  }}
                >
                  <Zap className="w-2.5 h-2.5" />
                  {tool.tokens} tokens
                </span>
              </div>

              {/* Name + Subtitle */}
              <h4 className="text-sm font-bold text-[#E8E8E8] group-hover:text-white transition-colors">
                {tool.emoji} {tool.name}
              </h4>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: tool.color }}>
                {tool.subtitle}
              </p>

              {/* Description */}
              <p className="text-xs text-[#888888] leading-relaxed mt-2 line-clamp-3">
                {tool.description}
              </p>

              {/* Launch Button */}
              <button
                onClick={() => onLaunch(tool.id)}
                className="mt-4 w-full py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 hover:gap-2.5"
                style={{
                  backgroundColor: `${tool.color}15`,
                  color: tool.color,
                  border: `1px solid ${tool.color}30`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${tool.color}25`;
                  e.currentTarget.style.boxShadow = `0 0 16px ${tool.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${tool.color}15`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Launch <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHECKLIST TAB
   ══════════════════════════════════════════════════════════ */
function ChecklistTab() {
  const [categories, setCategories] = useState<ChecklistCategory[]>(loadChecklist);

  const toggleItem = useCallback((catIdx: number, itemId: string) => {
    setCategories((prev) => {
      const next = prev.map((cat, ci) =>
        ci === catIdx
          ? { ...cat, items: cat.items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)) }
          : cat
      );
      persistChecklist(next);
      return next;
    });
  }, []);

  const resetChecklist = useCallback(() => {
    const reset = DEFAULT_CHECKLIST.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({ ...item, checked: false })),
    }));
    setCategories(reset);
    persistChecklist(reset);
  }, []);

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedItems = categories.reduce((acc, cat) => acc + cat.items.filter((i) => i.checked).length, 0);
  const progressPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const progressColor = progressPct >= 80 ? '#10B981' : progressPct >= 40 ? '#FDBA2D' : '#EF4444';

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <TacticalCorners className="rounded-lg bg-[#141414] border border-[#222222] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(155,114,207,0.2) 0%, transparent 70%)' }}>
              <CheckCircle2 className="w-4 h-4 text-[#9B72CF]" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#E8E8E8]">Pre-Publish Checklist</span>
              <p className="text-[10px] text-[#888888] mt-0.5">Verify your content is launch-ready</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#888888]">
              <span className="font-bold" style={{ color: progressColor }}>{checkedItems}</span>/{totalItems}
            </span>
            <button
              onClick={resetChecklist}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] border border-transparent hover:border-[#222222] transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Progress bar with glow */}
        <div className="relative w-full h-2.5 rounded-full bg-[#1A1A1A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progressPct}%`,
              backgroundColor: progressColor,
              boxShadow: `0 0 10px ${progressColor}40`,
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-[#666666]">{progressPct}% complete</p>
          {progressPct === 100 && (
            <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> ALL CLEAR — READY TO LAUNCH
            </span>
          )}
        </div>
      </TacticalCorners>

      {/* Category Cards */}
      {categories.map((cat, catIdx) => {
        const catChecked = cat.items.filter((i) => i.checked).length;
        const catTotal = cat.items.length;
        const catPct = catTotal > 0 ? Math.round((catChecked / catTotal) * 100) : 0;
        return (
          <div key={cat.name} className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#9B72CF]">{cat.icon}</span>
              <h4 className="text-xs font-bold text-[#E8E8E8] uppercase tracking-wider">{cat.name}</h4>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] text-[#666666]">{catChecked}/{catTotal}</span>
                <span className="text-[10px] font-bold" style={{ color: catPct === 100 ? '#10B981' : '#888888' }}>
                  {catPct}%
                </span>
              </div>
            </div>
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(catIdx, item.id)}
                  className="flex items-start gap-2.5 w-full text-left px-2 py-2 rounded-md hover:bg-[#0D0D0D] transition-colors group"
                >
                  {item.checked ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#444444] group-hover:text-[#9B72CF] flex-shrink-0 mt-0.5 transition-colors" />
                  )}
                  <span className={`text-sm transition-all duration-200 ${
                    item.checked ? 'text-[#666666] line-through' : 'text-[#E8E8E8]'
                  }`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRE-UPLOAD TAB
   ══════════════════════════════════════════════════════════ */
interface AnalysisResult {
  algoScore: number;
  estimatedViews: string;
  strategy: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

function PreUploadTab() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setScanStep(0);

    /* Step-by-step scanning animation */
    for (let i = 0; i < SCANNING_STEPS.length; i++) {
      setScanStep(i);
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
    }

    /* Generate mock results */
    const algoScore = Math.floor(Math.random() * 35) + 60;
    const estLow = Math.floor(Math.random() * 800 + 200);
    const estHigh = Math.floor(Math.random() * 2000 + 1000);
    const riskLevel: AnalysisResult['riskLevel'] = algoScore >= 80 ? 'low' : algoScore >= 65 ? 'medium' : 'high';

    setResult({
      algoScore,
      estimatedViews: `${estLow}K – ${estHigh}K`,
      strategy:
        'Your video shows strong potential in the educational content category. The algorithm favors this format during weekday afternoons in your target region.',
      recommendations: [
        'Optimize the first 8 seconds — front-load the hook and use visual pattern interrupts',
        'Add 3–5 chapter timestamps in the description for better search indexing',
        'Use 8–12 long-tail keyword tags aligned with trending search queries',
        'Schedule the premiere for Tuesday–Thursday 2–4 PM EST for peak engagement',
        'Create a Community Poll teaser 24 hours before publishing',
      ],
      riskLevel,
    });

    setLoading(false);
  }, [url]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && url.trim()) {
      handleAnalyze();
    }
  }, [loading, url, handleAnalyze]);

  const riskConfig = {
    low: { color: '#10B981', label: 'LOW RISK', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    medium: { color: '#FDBA2D', label: 'MEDIUM RISK', bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.25)' },
    high: { color: '#EF4444', label: 'HIGH RISK', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  };

  return (
    <div className="space-y-4">
      {/* Ninja AI Input Bar with Conic Gradient Border */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(155,114,207,0.2) 0%, transparent 70%)' }}>
            <Bot className="w-4 h-4 text-[#9B72CF]" />
          </div>
          <span className="text-sm font-bold text-[#E8E8E8]">Ninja AI Analyzer</span>
          <span className="text-[10px] text-[#888888]">Paste a YouTube URL or video title</span>
        </div>

        <div className="relative group">
          {/* Conic gradient rotating border on hover */}
          <div className="absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'conic-gradient(from var(--angle, 0deg), #9B72CF, #4A9EFF, #10B981, #FDBA2D, #EF4444, #9B72CF)',
              animation: 'rotateBorder 3s linear infinite',
            }}
          />
          <style>{`
            @keyframes rotateBorder {
              from { --angle: 0deg; }
              to { --angle: 360deg; }
            }
            @property --angle {
              syntax: '<angle>';
              initial-value: 0deg;
              inherits: false;
            }
          `}</style>

          <div className="relative flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://youtube.com/watch?v=... or paste a video title"
              className="flex-1 h-12 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/40 transition-all duration-300"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="px-5 h-12 rounded-lg bg-[#9B72CF] text-white text-sm font-bold hover:bg-[#8A62BE] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-[0_0_20px_rgba(155,114,207,0.2)] hover:shadow-[0_0_30px_rgba(155,114,207,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Scanning</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scanning Animation */}
      {loading && (
        <TacticalCorners className="rounded-lg bg-[#141414] border border-[#222222] p-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="relative">
              <Radar className="w-5 h-5 text-[#9B72CF] animate-pulse" />
            </div>
            <span className="text-sm font-bold text-[#E8E8E8]">Running Pre-Flight Scan...</span>
            <span className="ml-auto text-[10px] text-[#888888] font-mono">
              {scanStep + 1}/{SCANNING_STEPS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden mb-5">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((scanStep + 1) / SCANNING_STEPS.length) * 100}%`,
                background: 'linear-gradient(90deg, #9B72CF, #4A9EFF)',
                boxShadow: '0 0 10px rgba(155,114,207,0.4)',
              }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {SCANNING_STEPS.map((step, i) => {
              const isComplete = i < scanStep;
              const isActive = i === scanStep;
              const isPending = i > scanStep;

              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: isComplete ? 'rgba(16,185,129,0.15)' : isActive ? 'rgba(155,114,207,0.2)' : '#1A1A1A',
                      border: `1px solid ${
                        isComplete ? 'rgba(16,185,129,0.3)' : isActive ? 'rgba(155,114,207,0.4)' : '#222222'
                      }`,
                    }}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : isActive ? (
                      <span style={{ color: '#9B72CF' }}>{step.icon}</span>
                    ) : (
                      <span className="text-[10px] text-[#444444] font-mono">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs transition-all duration-300 ${
                    isComplete ? 'text-[#888888]' : isActive ? 'text-[#E8E8E8] font-medium' : 'text-[#444444]'
                  }`}>
                    {step.label}
                  </span>
                  {isActive && (
                    <Loader2 className="w-3 h-3 text-[#9B72CF] animate-spin ml-auto" />
                  )}
                  {isComplete && (
                    <span className="text-[9px] text-[#10B981] font-bold ml-auto">DONE</span>
                  )}
                </div>
              );
            })}
          </div>
        </TacticalCorners>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Result Header */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9B72CF]" />
            <h3 className="text-sm font-bold text-[#E8E8E8]">Analysis Complete</h3>
            <span
              className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                color: riskConfig[result.riskLevel].color,
                backgroundColor: riskConfig[result.riskLevel].bg,
                border: `1px solid ${riskConfig[result.riskLevel].border}`,
              }}
            >
              {riskConfig[result.riskLevel].label}
            </span>
          </div>

          {/* Score + Views */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Algorithm Score Gauge */}
            <TacticalCorners className="rounded-lg bg-[#141414] border border-[#222222] p-5 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-3">Algorithm Score</span>
              <HealthGauge score={result.algoScore} size="lg" />
              <p className="text-[10px] text-[#666666] mt-2">Based on SEO, timing, and niche alignment</p>
            </TacticalCorners>

            {/* Estimated Views */}
            <TacticalCorners className="rounded-lg bg-[#141414] border border-[#222222] p-5 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-3">Estimated Views (30d)</span>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-[#10B981]" />
                <span className="text-2xl font-bold text-[#E8E8E8] tracking-tight">{result.estimatedViews}</span>
              </div>
              <p className="text-[11px] text-[#888888] leading-relaxed mt-2">
                {result.strategy}
              </p>
            </TacticalCorners>
          </div>

          {/* AI Strategy Recommendations */}
          <TacticalCorners className="rounded-lg bg-[#141414] border border-[#222222] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(155,114,207,0.2) 0%, transparent 70%)' }}>
                <BrainCircuit className="w-4 h-4 text-[#9B72CF]" />
              </div>
              <span className="text-xs font-bold text-[#888888] uppercase tracking-wider">AI Strategy Recommendations</span>
            </div>
            <div className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: 'rgba(155,114,207,0.1)',
                      color: '#9B72CF',
                      border: '1px solid rgba(155,114,207,0.2)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm text-[#E8E8E8] leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </TacticalCorners>
        </div>
      )}

      {/* Empty State (no result, not loading) */}
      {!result && !loading && (
        <TacticalCorners className="rounded-lg bg-[#141414] border border-[#222222] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(155,114,207,0.15) 0%, transparent 70%)' }}>
            <Radar className="w-8 h-8 text-[#9B72CF] opacity-50" />
          </div>
          <h3 className="text-sm font-bold text-[#E8E8E8] mb-1">Ready for Pre-Flight Analysis</h3>
          <p className="text-xs text-[#888888] max-w-sm mx-auto leading-relaxed">
            Paste a YouTube video URL above and hit Analyze. Ninja AI will scan your content, score it against the algorithm, and provide actionable recommendations.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-[#666666]">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#9B72CF]" /> 5-step deep scan</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[#9B72CF]" /> Algorithm scoring</span>
            <span className="flex items-center gap-1"><Bot className="w-3 h-3 text-[#9B72CF]" /> AI strategy</span>
          </div>
        </TacticalCorners>
      )}
    </div>
  );
}
