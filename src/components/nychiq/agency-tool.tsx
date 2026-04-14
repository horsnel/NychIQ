'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { copyToClipboard, fmtV, timeAgo } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  Building2, Lock, Loader2, Users, Eye, TrendingUp, DollarSign, ChevronRight, Download,
  UserPlus, BarChart3, Activity, FileText, Zap, SearchCode, Shield, Calendar, Plus,
  ArrowUpRight, FolderOutput, FileBarChart, Crown, Send, Copy, Check, Radio, Target,
  Command, Link2, Globe, Cpu, Signal, AlertTriangle, CheckCircle2, Clock, CircleDot,
  Radar, Image as ImageIcon, Palette, GitBranch, Flame, SlidersHorizontal, type LucideIcon,
  MonitorPlay, Video, Anchor, Crosshair, GitCompare, RefreshCw, Unlink, Sparkles,
  BrainCircuit, Lightbulb, XCircle, X, Bot, Mic, Wand2, Save, Settings2, Trash2,
  ChevronDown, CheckCircle, ClipboardCheck, Tag,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual & Friendly' },
  { value: 'energetic', label: 'Energetic & Hype' },
  { value: 'calm', label: 'Calm & Educational' },
  { value: 'humorous', label: 'Humorous & Witty' },
  { value: 'inspirational', label: 'Inspirational' },
];

const GOALS = [
  'Grow subscribers', 'Increase watch time', 'Boost engagement',
  'Monetize channel', 'Build brand awareness', 'Drive traffic to website',
  'Establish authority', 'Community building', 'Product sales/affiliates',
  'Launch a course/program',
];

const CONTENT_TYPES = [
  'Tutorials', 'Reviews', 'Vlogs', 'Shorts', 'Live Streams',
  'Storytelling', 'Listicles', 'Deep Dives', 'Case Studies',
  'Q&A', 'Commentary', 'Challenges', 'Collaborations', 'Reaction Videos',
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian',
  'Dutch', 'Russian', 'Japanese', 'Korean', 'Chinese (Mandarin)',
  'Hindi', 'Arabic', 'Turkish', 'Swahili', 'Yoruba', 'Igbo', 'Hausa',
];

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */
interface SignalQueueItem {
  id: string;
  client: string;
  clientColor: string;
  clientInitials: string;
  type: 'trend' | 'viral' | 'gap' | 'threat' | 'arbitrage';
  message: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

interface Report {
  id: string;
  name: string;
  client: string;
  date: string;
  type: 'Audit' | 'Strategy' | 'SEO';
}

interface TeamActivity {
  id: string;
  user: string;
  initials: string;
  color: string;
  action: string;
  target: string;
  time: string;
}

/* ═══════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════ */
const MOCK_CHANNELS_FOR_FALLBACK = [
  { id: 'ch-1', name: 'TechVision Pro', handle: '@techvisionpro', initials: 'TV', color: '#3B82F6', subscribers: 485000, videoCount: 312, healthScore: 92, status: 'performing' as const, monthlyViews: 5820000, monthlyRevenue: 3240, cpm: 18.40, niche: 'Technology', avatar: '' },
  { id: 'ch-2', name: 'FitLife Academy', handle: '@fitlifeacademy', initials: 'FA', color: '#10B981', subscribers: 1280000, videoCount: 578, healthScore: 87, status: 'performing' as const, monthlyViews: 12400000, monthlyRevenue: 8920, cpm: 22.10, niche: 'Fitness', avatar: '' },
  { id: 'ch-3', name: 'Crypto Daily', handle: '@cryptodaily', initials: 'CD', color: '#FDBA2D', subscribers: 320000, videoCount: 189, healthScore: 74, status: 'stale' as const, monthlyViews: 1840000, monthlyRevenue: 1680, cpm: 32.50, niche: 'Finance', avatar: '' },
  { id: 'ch-4', name: 'Art Studio NG', handle: '@artstudiong', initials: 'AS', color: '#8B5CF6', subscribers: 890000, videoCount: 421, healthScore: 91, status: 'growth' as const, monthlyViews: 7600000, monthlyRevenue: 4120, cpm: 14.80, niche: 'Art & Design', avatar: '' },
  { id: 'ch-5', name: 'EduTech Masters', handle: '@edutechmasters', initials: 'EM', color: '#EF4444', subscribers: 620000, videoCount: 267, healthScore: 68, status: 'stale' as const, monthlyViews: 3200000, monthlyRevenue: 2100, cpm: 18.40, niche: 'Education', avatar: '' },
];

const MOCK_SIGNALS: SignalQueueItem[] = [
  { id: 's-1', client: 'TechVision Pro', clientColor: '#3B82F6', clientInitials: 'TV', type: 'viral', message: 'AI phone review hit 500K views in 18 hours — viral score 94.', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-2', client: 'FitLife Academy', clientColor: '#10B981', clientInitials: 'FA', type: 'trend', message: '"Zone 2 cardio" search volume up 340% this week.', time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-3', client: 'Crypto Daily', clientColor: '#FDBA2D', clientInitials: 'CD', type: 'gap', message: 'No upload in 4 days. Audience engagement dropping 12%.', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
  { id: 's-4', client: 'Art Studio NG', clientColor: '#8B5CF6', clientInitials: 'AS', type: 'arbitrage', message: 'Art supply CPM at $14.80 but affiliate offers $28/sale. 4.2x opportunity.', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-5', client: 'EduTech Masters', clientColor: '#EF4444', clientInitials: 'EM', type: 'threat', message: 'New competitor "LearnCode Pro" gained 50K subs this month.', time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
];

const MOCK_REPORTS: Report[] = [
  { id: 'r-1', name: 'Full Channel Audit', client: 'TechVision Pro', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'Audit' },
  { id: 'r-2', name: 'Growth Strategy Q4', client: 'FitLife Academy', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'Strategy' },
  { id: 'r-3', name: 'SEO Optimization Pack', client: 'Art Studio NG', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'SEO' },
];

const MOCK_ACTIVITY: TeamActivity[] = [
  { id: 'a-1', user: 'Sarah K.', initials: 'SK', color: '#3B82F6', action: 'completed audit for', target: 'TechVision Pro', time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'a-2', user: 'Mike R.', initials: 'MR', color: '#10B981', action: 'generated SEO report for', target: 'FitLife Academy', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'a-3', user: 'Alex T.', initials: 'AT', color: '#8B5CF6', action: 'updated strategy for', target: 'EduTech Masters', time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
];

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */
function hc(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#FDBA2D';
  if (score >= 40) return '#3B82F6';
  return '#EF4444';
}
function healthLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Work';
}
function reportBadge(type: Report['type']) {
  switch (type) {
    case 'Audit': return { bg: 'bg-[rgba(239,68,68,0.1)]', text: 'text-[#EF4444]', border: 'border-[rgba(239,68,68,0.2)]', icon: <Shield className="w-3 h-3" /> };
    case 'Strategy': return { bg: 'bg-[rgba(59,130,246,0.1)]', text: 'text-[#3B82F6]', border: 'border-[rgba(59,130,246,0.2)]', icon: <TrendingUp className="w-3 h-3" /> };
    case 'SEO': return { bg: 'bg-[rgba(253,186,45,0.1)]', text: 'text-[#FDBA2D]', border: 'border-[rgba(253,186,45,0.2)]', icon: <SearchCode className="w-3 h-3" /> };
  }
}
function signalTypeInfo(type: SignalQueueItem['type']): { icon: LucideIcon; color: string; label: string } {
  switch (type) {
    case 'viral': return { icon: Zap, color: '#FDBA2D', label: 'VIRAL' };
    case 'trend': return { icon: TrendingUp, color: '#10B981', label: 'TREND' };
    case 'gap': return { icon: Target, color: '#3B82F6', label: 'GAP' };
    case 'threat': return { icon: AlertTriangle, color: '#EF4444', label: 'THREAT' };
    case 'arbitrage': return { icon: DollarSign, color: '#8B5CF6', label: 'ARBITRAGE' };
  }
}
function statusRing(status: string): { color: string; label: string; pulse: boolean } {
  switch (status) {
    case 'performing': return { color: '#10B981', label: 'Performing Well', pulse: true };
    case 'stale': return { color: '#FDBA2D', label: 'No Uploads (3+ days)', pulse: false };
    case 'arbitrage': return { color: '#8B5CF6', label: 'High Arbitrage', pulse: false };
    case 'growth': return { color: '#3B82F6', label: 'Rapid Growth', pulse: true };
    default: return { color: '#666666', label: 'Unknown', pulse: false };
  }
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */
function HealthCircle({ score, size = 48, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = hc(score);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A1A1A" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function HealthRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = hc(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1A1A" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-[#A3A3A3]">/ 100</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: LucideIcon; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs text-[#A3A3A3] font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-[#FFFFFF]">{value}</p>
      {sub && <p className="text-[10px] text-[#666666] mt-1">{sub}</p>}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, change, positive, color }: {
  icon: React.ElementType; label: string; value: string; change: string; positive: boolean; color: string;
}) {
  return (
    <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15`, color }}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className={`text-[10px] font-semibold ${positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {positive ? '+' : ''}{change}
        </span>
      </div>
      <div>
        <p className="text-base font-bold text-[#FFFFFF]">{value}</p>
        <p className="text-[10px] text-[#A3A3A3]">{label}</p>
      </div>
    </div>
  );
}

function StatusRingDot({ status }: { status: string }) {
  const info = statusRing(status);
  return (
    <div className="relative flex-shrink-0" style={{ width: 12, height: 12 }}>
      <div className="absolute inset-0 rounded-full" style={{ backgroundColor: info.color, opacity: 0.3 }} />
      <div className="absolute inset-[2px] rounded-full" style={{ backgroundColor: info.color }} />
      {info.pulse && (
        <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: info.color, opacity: 0.4, animationDuration: '2s' }} />
      )}
    </div>
  );
}

function GrowthChart({ data, color = '#FDBA2D' }: { data: number[]; color?: string }) {
  const w = 280, h = 80, pad = 4;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const areaPts = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`gc-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#gc-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeatmapBlock({ value }: { value: number }) {
  const bg = value >= 80 ? 'bg-[#10B981]/70' : value >= 60 ? 'bg-[#10B981]/40' : value >= 40 ? 'bg-[#FDBA2D]/40' : value >= 20 ? 'bg-[#3B82F6]/30' : 'bg-[#1A1A1A]';
  return <div className={`h-5 rounded-sm ${bg} transition-colors`} title={`${value}%`} />;
}

function ToolCard({ icon: Icon, label, desc, cost, toolId, color }: {
  icon: React.ElementType; label: string; desc: string; cost: number; toolId: string; color: string;
}) {
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  return (
    <button onClick={() => setActiveTool(toolId)}
      className="group flex items-center gap-3 p-3.5 rounded-lg border border-[#1F1F1F] bg-[#141414] hover:bg-[#0D0D0D] hover:border-[#2A2A2A] transition-all duration-200 hover:-translate-y-0.5 text-left w-full">
      <div className="p-2 rounded-lg shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15`, color }}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-[#FFFFFF] group-hover:text-[#FDBA2D] transition-colors block truncate">{label}</span>
        <span className="text-[11px] text-[#A3A3A3] line-clamp-1 block">{desc}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {cost > 0 && <span className="text-[10px] text-[#444444] font-mono">{cost}t</span>}
        <ChevronRight className="w-3.5 h-3.5 text-[#444444] group-hover:text-[#FDBA2D] transition-colors opacity-0 group-hover:opacity-100" />
      </div>
    </button>
  );
}

function ActivityItem({ icon: Icon, title, time, status, color }: {
  icon: React.ElementType; title: string; time: string; status: 'done' | 'new' | 'pending'; color: string;
}) {
  const statusDot = status === 'done' ? 'bg-[#10B981]' : status === 'new' ? 'bg-[#FDBA2D]' : 'bg-[#444444]';
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#0D0D0D] transition-colors group cursor-pointer">
      <div className="relative">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15`, color }}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#141414] ${statusDot}`} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-[#FFFFFF] group-hover:text-[#FDBA2D] transition-colors block truncate">{title}</span>
        <span className="text-[10px] text-[#555555] block">{time}</span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-[#2A2A2A] group-hover:text-[#A3A3A3] transition-colors shrink-0" />
    </div>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder }: {
  tags: string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void; placeholder: string;
}) {
  const [input, setInput] = useState('');
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const val = input.trim();
      if (!tags.includes(val)) { onAdd(val); setInput(''); }
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown} placeholder={placeholder}
          className="flex-1 h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors" />
        <button type="button" onClick={() => { if (input.trim() && !tags.includes(input.trim())) { onAdd(input.trim()); setInput(''); } }}
          disabled={!input.trim()}
          className="px-3 h-10 rounded-md bg-[#FDBA2D] text-[#0D0D0D] hover:bg-[#C69320] transition-colors disabled:opacity-40 shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs text-[#FFFFFF]">
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="text-[#666666] hover:text-[#EF4444] transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Channel Detail View (7-sections from My Channel)
   ═══════════════════════════════════════════ */
function ChannelDetailView({ channel, onBack }: {
  channel: NonNullable<ReturnType<typeof useNychIQStore.getState>['agencyChannels'][number]>;
  onBack: () => void;
}) {
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  const removeAgencyChannel = useNychIQStore((s) => s.removeAgencyChannel);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<Array<{ priority: 'high' | 'medium' | 'low'; title: string; description: string }> | null>(null);
  const [activeMetric, setActiveMetric] = useState<'views' | 'engagement' | 'watchtime' | 'subs'>('views');

  const growthData = useMemo(() => ({
    views: [120, 180, 150, 220, 310, 280, 420, 380, 510, 470, 620, 580, 710],
    engagement: [3.2, 3.5, 3.1, 4.0, 4.5, 4.2, 5.1, 4.8, 5.5, 5.2, 6.0, 5.8, 6.3],
    watchtime: [4.1, 4.3, 3.8, 4.5, 5.0, 4.7, 5.3, 5.1, 5.8, 5.5, 6.2, 5.9, 6.5],
    subs: [40, 55, 48, 72, 95, 88, 120, 110, 145, 135, 170, 160, 195],
  }), []);

  const heatmapData = useMemo(() => {
    const data: number[][] = [];
    for (let d = 0; d < 7; d++) {
      const row: number[] = [];
      for (let h = 0; h < 8; h++) {
        const base = ((d >= 1 && d <= 5) && (h >= 3 && h <= 6)) ? 70 : 30;
        row.push(Math.min(100, base + Math.floor(Math.sin(d * h) * 25)));
      }
      data.push(row);
    }
    return data;
  }, []);

  const auditCategories = channel.auditCategories.length > 0 ? channel.auditCategories : [
    { name: 'SEO', score: 72, icon: '🔍' },
    { name: 'Content Quality', score: 68, icon: '📝' },
    { name: 'Engagement', score: 58, icon: '💬' },
    { name: 'Monetization', score: 74, icon: '💰' },
    { name: 'Growth', score: 61, icon: '📈' },
  ];

  const activityFeed = useMemo(() => [
    { icon: ClipboardCheck, title: `Channel Audit — Score: ${channel.healthScore}/100`, time: channel.auditDate > 0 ? new Date(channel.auditDate).toLocaleDateString() : 'Pending', status: 'done' as const, color: '#FDBA2D' },
    { icon: Zap, title: 'Viral Score Analysis — Latest Upload', time: '2 hours ago', status: 'done' as const, color: '#10B981' },
    { icon: SearchCode, title: 'SEO Description Check — 3 videos optimized', time: '5 hours ago', status: 'done' as const, color: '#3B82F6' },
    { icon: Clock, title: 'New Post Time Recommendation Available', time: '1 day ago', status: 'new' as const, color: '#FDBA2D' },
    { icon: Target, title: 'HookLab Analysis — 5 scripts scored', time: '2 days ago', status: 'done' as const, color: '#8B5CF6' },
    { icon: BarChart3, title: 'Monthly Performance Report — Ready', time: '3 days ago', status: 'done' as const, color: '#10B981' },
  ], [channel.healthScore, channel.auditDate]);

  const metricOptions = [
    { key: 'views' as const, label: 'Views', color: '#FDBA2D', data: growthData.views },
    { key: 'engagement' as const, label: 'Engagement %', color: '#10B981', data: growthData.engagement },
    { key: 'watchtime' as const, label: 'Watch Time', color: '#3B82F6', data: growthData.watchtime },
    { key: 'subs' as const, label: 'New Subs/wk', color: '#8B5CF6', data: growthData.subs },
  ];
  const currentMetric = metricOptions.find((m) => m.key === activeMetric)!;

  const quickTools = [
    { icon: Zap, label: 'Viral Predictor', desc: 'Forecast next video potential', cost: TOKEN_COSTS.viral, toolId: 'viral', color: '#10B981' },
    { icon: Crosshair, label: 'Niche Radar', desc: 'Trends for your niche', cost: TOKEN_COSTS.niche, toolId: 'niche', color: '#FDBA2D' },
    { icon: Clock, label: 'Best Post Time', desc: 'Personalized upload windows', cost: TOKEN_COSTS.posttime, toolId: 'posttime', color: '#3B82F6' },
    { icon: Anchor, label: 'My HookLab', desc: 'Generate video intros', cost: TOKEN_COSTS.hooklab, toolId: 'hooklab', color: '#EF4444' },
    { icon: SearchCode, label: 'SEO Optimizer', desc: 'Refine video descriptions', cost: TOKEN_COSTS.seo, toolId: 'seo', color: '#8B5CF6' },
    { icon: GitCompare, label: 'Competitor Track', desc: 'Side-by-side comparison', cost: TOKEN_COSTS.competitor, toolId: 'competitor', color: '#10B981' },
  ];

  const handleGenerateInsights = useCallback(() => {
    setAiLoading(true);
    setTimeout(() => {
      setAiInsights([
        { priority: 'high', title: 'Title Optimization Gap', description: 'Your last 5 videos average 42 characters per title. Top-performing channels in your niche use 55-65 characters. Adding power words can boost CTR by 18-25%.' },
        { priority: 'high', title: 'Retention Drop at 2:15', description: 'Analytics show a consistent viewer drop-off around the 2-minute mark. Consider adding a pattern interrupt or visual transition at this timestamp.' },
        { priority: 'medium', title: 'Upload Frequency Opportunity', description: 'Channels posting 3x per week in your niche see 40% more algorithmic impressions. Your current cadence leaves reach on the table.' },
        { priority: 'medium', title: 'Description Keywords Missing', description: 'Only 3 of your last 10 videos include timestamps. Adding 3-5 targeted keywords can improve search discovery by up to 30%.' },
        { priority: 'low', title: 'End Screen Under-utilized', description: 'Your end screens only link to 1-2 videos. Maximizing end screen real estate could increase session duration by an estimated 12%.' },
      ]);
      setAiLoading(false);
    }, 2000);
  }, []);

  const si = statusRing(channel.status);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* 1. CHANNEL HEADER */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="h-24 sm:h-28 bg-gradient-to-r from-[#0D0D0D] via-[#141414] to-[rgba(253,186,45,0.08)] relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(253,186,45,0.06) 50px, rgba(253,186,45,0.06) 51px)' }} />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ backgroundColor: `${si.color}10`, borderColor: `${si.color}30` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: si.color }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: si.color }}>{channel.status}</span>
          </div>
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)]">
            <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">{channel.niche}</span>
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-5 -mt-10 relative z-10">
          <div className="flex items-end gap-4">
            {channel.avatar ? (
              <img src={channel.avatar} alt={channel.title} className="w-20 h-20 rounded-2xl object-cover border-4 border-[#141414] shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FDBA2D] to-[#C69320] flex items-center justify-center text-2xl font-bold text-[#0D0D0D] border-4 border-[#141414] shadow-lg">
                {channel.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-lg sm:text-xl font-bold text-[#FFFFFF] truncate">{channel.title}</h1>
              <p className="text-xs text-[#A3A3A3] truncate">{channel.handle || `@${channel.title.toLowerCase().replace(/\s/g, '')}`}</p>
            </div>
            <div className="flex gap-2 pb-1">
              <button onClick={onBack}
                className="px-3 py-1.5 rounded-md bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] text-[#8B5CF6] text-xs font-bold hover:bg-[rgba(139,92,246,0.2)] transition-colors flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 rotate-180" /> Back
              </button>
              <button onClick={() => setActiveTool('audit')}
                className="px-3 py-1.5 rounded-md bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.3)] text-[#FDBA2D] text-xs font-bold hover:bg-[rgba(253,186,45,0.2)] transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Re-audit
              </button>
              <button onClick={() => { removeAgencyChannel(channel.id); onBack(); }}
                className="px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-xs font-medium hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors flex items-center gap-1.5">
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="col-span-2 lg:col-span-1 rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 flex flex-col items-center justify-center">
          <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-semibold mb-2">Health Score</span>
          <HealthRing score={channel.healthScore} size={80} />
        </div>
        <KPICard icon={Eye} label="Total Views" value={fmtV(channel.viewCount)} change="+12.4%" positive color="#FDBA2D" />
        <KPICard icon={Users} label="Subscribers" value={fmtV(channel.subscriberCount)} change="+8.2%" positive color="#10B981" />
        <KPICard icon={Video} label="Total Videos" value={fmtV(channel.videoCount)} change="+3" positive color="#3B82F6" />
        <KPICard icon={DollarSign} label="Revenue/mo" value={channel.monthlyRevenue > 0 ? `$${channel.monthlyRevenue.toLocaleString()}` : 'N/A'} change={channel.monthlyRevenue > 2000 ? 'Strong' : 'Growing'} positive={channel.monthlyRevenue > 2000} color="#8B5CF6" />
      </div>

      {/* 3. GROWTH TRENDS */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#FDBA2D]" /> Growth Trends
          </h3>
          <div className="flex gap-1 p-0.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
            {metricOptions.map((m) => (
              <button key={m.key} onClick={() => setActiveMetric(m.key)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${activeMetric === m.key ? 'text-[#FFFFFF] shadow-sm' : 'text-[#555555] hover:text-[#A3A3A3]'}`}
                style={activeMetric === m.key ? { backgroundColor: `${m.color}20`, color: m.color } : undefined}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <GrowthChart data={currentMetric.data} color={currentMetric.color} />
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[10px] text-[#444444]">4 weeks ago</span>
          <span className="text-[10px] text-[#444444]">This week</span>
        </div>
      </div>

      {/* TWO-COLUMN: AI Insights + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 4. AI PERFORMANCE ANALYSIS */}
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-[#FDBA2D]" /> AI Insights
            </h3>
            {!aiInsights ? (
              <button onClick={handleGenerateInsights} disabled={aiLoading}
                className="px-3 py-1.5 rounded-md bg-[#FDBA2D] text-[#0D0D0D] text-[11px] font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Analyze
              </button>
            ) : (
              <button onClick={() => setAiInsights(null)}
                className="px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-[11px] font-medium hover:text-[#FFFFFF] transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            )}
          </div>
          {aiLoading && <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-md bg-[#0D0D0D] animate-pulse" />)}</div>}
          {!aiLoading && aiInsights && (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {aiInsights.map((insight, i) => {
                const pColor = insight.priority === 'high' ? '#EF4444' : insight.priority === 'medium' ? '#FDBA2D' : '#10B981';
                const PIcon = insight.priority === 'high' ? XCircle : insight.priority === 'medium' ? AlertTriangle : CheckCircle;
                return (
                  <div key={i} className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <PIcon className="w-3.5 h-3.5 shrink-0" style={{ color: pColor }} />
                      <span className="text-xs font-bold text-[#FFFFFF]">{insight.title}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider ml-auto" style={{ color: pColor }}>{insight.priority}</span>
                    </div>
                    <p className="text-[11px] text-[#A3A3A3] leading-relaxed">{insight.description}</p>
                  </div>
                );
              })}
            </div>
          )}
          {!aiLoading && !aiInsights && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-xl bg-[rgba(253,186,45,0.08)] flex items-center justify-center mb-3">
                <Lightbulb className="w-6 h-6 text-[#FDBA2D]" />
              </div>
              <p className="text-xs text-[#A3A3A3] text-center max-w-[220px]">Click Analyze to generate AI insights for {channel.title}.</p>
            </div>
          )}
        </div>

        {/* Categories + Heatmap */}
        <div className="space-y-5">
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-3.5 h-3.5 text-[#FDBA2D]" /> Audit Categories
            </h3>
            <div className="space-y-3">
              {auditCategories.map((cat) => {
                const color = hc(cat.score);
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#FFFFFF] flex items-center gap-2"><span>{cat.icon}</span> {cat.name}</span>
                      <span className="text-xs font-bold" style={{ color }}>{cat.score}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.score}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {channel.auditDate > 0 && <p className="text-[10px] text-[#444444] mt-3">Last audit: {new Date(channel.auditDate).toLocaleDateString()}</p>}
          </div>

          {/* 5. HEATMAP */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#FDBA2D]" /> Best Post Times
            </h3>
            <div className="flex gap-1 mb-1">
              <div className="w-8" />
              {HOURS.map((h) => <div key={h} className="flex-1 text-center text-[9px] text-[#444444]">{h}</div>)}
            </div>
            {heatmapData.map((row, di) => (
              <div key={di} className="flex gap-1 mb-0.5">
                <div className="w-8 text-[9px] text-[#444444] flex items-center">{DAYS[di]}</div>
                {row.map((val, hi) => <div key={hi} className="flex-1"><HeatmapBlock value={val} /></div>)}
              </div>
            ))}
            <div className="flex items-center gap-3 mt-3 justify-end">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-[#1A1A1A]" /><span className="text-[9px] text-[#444444]">Low</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]/30" /><span className="text-[9px] text-[#444444]">Fair</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-[#FDBA2D]/40" /><span className="text-[9px] text-[#444444]">Good</span></div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-[#10B981]/70" /><span className="text-[9px] text-[#444444]">Best</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. COMMAND CENTER */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
        <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4">
          <Target className="w-3.5 h-3.5 text-[#FDBA2D]" /> Command Center
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {quickTools.map((tool) => <ToolCard key={tool.toolId} {...tool} />)}
        </div>
      </div>

      {/* 7. ACTIVITY FEED */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
        <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-[#FDBA2D]" /> Recent Activity
        </h3>
        <div className="divide-y divide-[#1A1A1A]">
          {activityFeed.map((item, i) => <ActivityItem key={i} {...item} />)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Bulk Customize Tab
   ═══════════════════════════════════════════ */
function BulkCustomizeTab() {
  const agencyChannels = useNychIQStore((s) => s.agencyChannels);
  const bulkUpdateAssistantConfig = useNychIQStore((s) => s.bulkUpdateAssistantConfig);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [brandVoice, setBrandVoice] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('');
  const [language, setLanguage] = useState('English');
  const [goals, setGoals] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [saved, setSaved] = useState(false);

  const toggleChannel = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(agencyChannels.map((c) => c.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const toggleGoal = (g: string) => setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleContentType = (ct: string) => setContentTypes((prev) => prev.includes(ct) ? prev.filter((x) => x !== ct) : [...prev, ct]);

  const handleApply = () => {
    if (selectedIds.size === 0) { showToast('Select at least one channel', 'warning'); return; }
    bulkUpdateAssistantConfig(Array.from(selectedIds), {
      brandVoice, tone, audience, language, goals, contentTypes, keywords, customInstructions,
    });
    setSaved(true);
    showToast(`Applied to ${selectedIds.size} channel(s)`, 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  if (agencyChannels.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 animate-fade-in-up">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.15)] flex items-center justify-center mb-6">
          <SlidersHorizontal className="w-10 h-10 text-[#8B5CF6]" />
        </div>
        <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">No Channels to Customize</h2>
        <p className="text-sm text-[#A3A3A3] max-w-md text-center mb-6">Add client channels via Channel Audit first, then bulk customize their AI assistant configurations here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Channel selector */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#8B5CF6]" /> Select Channels
            <span className="px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[10px] font-bold text-[#8B5CF6]">{selectedIds.size}/{agencyChannels.length}</span>
          </h3>
          <div className="flex gap-2">
            <button onClick={selectAll} className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-[#0D0D0D] border border-[#1A1A1A] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors">Select All</button>
            <button onClick={deselectAll} className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-[#0D0D0D] border border-[#1A1A1A] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors">Deselect All</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {agencyChannels.map((ch) => (
            <button key={ch.id} onClick={() => toggleChannel(ch.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left ${selectedIds.has(ch.id) ? 'bg-[rgba(139,92,246,0.08)] border-[rgba(139,92,246,0.3)]' : 'bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#2A2A2A]'}`}>
              {selectedIds.has(ch.id) ? <CheckCircle className="w-4 h-4 text-[#8B5CF6] shrink-0" /> : <CircleDot className="w-4 h-4 text-[#444444] shrink-0" />}
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: ch.avatar ? 'transparent' : '#FDBA2D20', color: '#FDBA2D' }}>
                {ch.avatar ? <img src={ch.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : ch.title.charAt(0)}
              </div>
              <span className={`text-[11px] font-medium truncate ${selectedIds.has(ch.id) ? 'text-[#FFFFFF]' : 'text-[#A3A3A3]'}`}>{ch.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Brand Voice */}
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
          <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4">
            <Mic className="w-3.5 h-3.5 text-[#FDBA2D]" /> Voice & Tone
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#A3A3A3] mb-1.5 block">Brand Voice</label>
              <input type="text" value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="e.g. Witty, data-driven, approachable"
                className="w-full h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#A3A3A3] mb-1.5 block">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors appearance-none cursor-pointer">
                {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#A3A3A3] mb-1.5 block">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors appearance-none cursor-pointer">
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#A3A3A3] mb-1.5 block">Target Audience</label>
              <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. 18-35 tech enthusiasts"
                className="w-full h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors" />
            </div>
          </div>
        </div>

        {/* Goals & Content */}
        <div className="space-y-5">
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4">
              <Target className="w-3.5 h-3.5 text-[#FDBA2D]" /> Goals
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {GOALS.map((g) => (
                <button key={g} onClick={() => toggleGoal(g)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${goals.includes(g) ? 'bg-[rgba(253,186,45,0.15)] text-[#FDBA2D] border border-[rgba(253,186,45,0.3)]' : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#A3A3A3] hover:text-[#FFFFFF]'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4">
              <Tag className="w-3.5 h-3.5 text-[#FDBA2D]" /> Content Types
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_TYPES.map((ct) => (
                <button key={ct} onClick={() => toggleContentType(ct)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${contentTypes.includes(ct) ? 'bg-[rgba(139,92,246,0.15)] text-[#8B5CF6] border border-[rgba(139,92,246,0.3)]' : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#A3A3A3] hover:text-[#FFFFFF]'}`}>
                  {ct}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keywords & Instructions */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
        <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4">
          <Wand2 className="w-3.5 h-3.5 text-[#FDBA2D]" /> Keywords & Custom Instructions
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#A3A3A3] mb-1.5 block">Target Keywords</label>
            <TagInput tags={keywords} onAdd={(k) => setKeywords((prev) => [...prev, k])} onRemove={(k) => setKeywords((prev) => prev.filter((x) => x !== k))} placeholder="Add keyword..." />
          </div>
          <div>
            <label className="text-xs font-medium text-[#A3A3A3] mb-1.5 block">Custom Instructions</label>
            <textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} rows={4} placeholder="Additional instructions for the AI assistant specific to these channels..."
              className="w-full px-4 py-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors resize-none" />
          </div>
        </div>
      </div>

      {/* Apply button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#555555]">{selectedIds.size} channel(s) selected</p>
        <button onClick={handleApply}
          className={`px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${saved ? 'bg-[#10B981] text-[#0D0D0D]' : 'bg-[#8B5CF6] text-[#FFFFFF] hover:bg-[#7C3AED]'} disabled:opacity-40`}
          disabled={selectedIds.size === 0}>
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? `Applied to ${selectedIds.size} Channels!` : `Apply to ${selectedIds.size} Channel(s)`}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   AI Agents Tab
   ═══════════════════════════════════════════ */
function AIAgentsTab({ onSwitchToCustomize, onViewChannel }: { onSwitchToCustomize: (ids: string[]) => void; onViewChannel: (id: string) => void }) {
  const agencyChannels = useNychIQStore((s) => s.agencyChannels);
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);

  const configured = agencyChannels.filter((c) => c.assistantConfig.brandVoice || c.assistantConfig.goals.length > 0 || c.assistantConfig.keywords.length > 0).length;

  const handleConfigureAll = () => {
    onSwitchToCustomize(agencyChannels.map((c) => c.id));
  };

  if (agencyChannels.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 animate-fade-in-up">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] flex items-center justify-center mb-6">
          <Bot className="w-10 h-10 text-[#10B981]" />
        </div>
        <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">No AI Agents Configured</h2>
        <p className="text-sm text-[#A3A3A3] max-w-md text-center mb-6">Add client channels first. Each channel gets its own AI agent that you can configure with brand voice, tone, and goals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Users} label="Total Channels" value={String(agencyChannels.length)} color="#8B5CF6" sub="In agency" />
        <StatCard icon={Bot} label="Configured Agents" value={String(configured)} color="#10B981" sub="Ready to work" />
        <StatCard icon={AlertTriangle} label="Unconfigured" value={String(agencyChannels.length - configured)} color="#FDBA2D" sub="Need setup" />
      </div>

      {/* Bulk actions */}
      <div className="flex gap-2">
        <button onClick={handleConfigureAll}
          className="px-4 py-2 rounded-lg bg-[#8B5CF6] text-[#FFFFFF] text-xs font-bold hover:bg-[#7C3AED] transition-colors flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Configure All
        </button>
        <button onClick={() => setActiveTool('audit')}
          className="px-4 py-2 rounded-lg bg-[#141414] border border-[#1F1F1F] text-[#A3A3A3] text-xs font-medium hover:text-[#FFFFFF] hover:border-[#2A2A2A] transition-colors flex items-center gap-2">
          <ClipboardCheck className="w-3.5 h-3.5" /> Run Bulk Audit
        </button>
      </div>

      {/* Channel agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agencyChannels.map((ch) => {
          const isConfigured = ch.assistantConfig.brandVoice || ch.assistantConfig.goals.length > 0 || ch.assistantConfig.keywords.length > 0;
          return (
            <div key={ch.id} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                {ch.avatar ? (
                  <img src={ch.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#1F1F1F]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FDBA2D] to-[#C69320] flex items-center justify-center text-sm font-bold text-[#0D0D0D]">
                    {ch.title.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#FFFFFF] truncate">{ch.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isConfigured ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
                        <CheckCircle2 className="w-3 h-3" /> Configured
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#FDBA2D]">
                        <AlertTriangle className="w-3 h-3" /> Not Configured
                      </span>
                    )}
                  </div>
                </div>
                <HealthCircle score={ch.healthScore} size={36} strokeWidth={3} />
              </div>

              {/* Config summary */}
              <div className="space-y-1.5 mb-3 text-[11px] text-[#A3A3A3]">
                <div className="flex items-center justify-between">
                  <span>Tone</span>
                  <span className="text-[#FFFFFF] font-medium capitalize">{ch.assistantConfig.tone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Goals</span>
                  <span className="text-[#FFFFFF] font-medium">{ch.assistantConfig.goals.length} set</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Keywords</span>
                  <span className="text-[#FFFFFF] font-medium">{ch.assistantConfig.keywords.length} added</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-1.5">
                <button onClick={() => onSwitchToCustomize([ch.id])}
                  className="flex-1 px-2.5 py-1.5 rounded-md bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] text-[#8B5CF6] text-[10px] font-bold hover:bg-[rgba(139,92,246,0.2)] transition-colors text-center">
                  <Settings2 className="w-3 h-3 inline mr-1" />Configure
                </button>
                <button onClick={() => setActiveTool('audit')}
                  className="flex-1 px-2.5 py-1.5 rounded-md bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] text-[#FDBA2D] text-[10px] font-bold hover:bg-[rgba(253,186,45,0.2)] transition-colors text-center">
                  <ClipboardCheck className="w-3 h-3 inline mr-1" />Audit
                </button>
                <button onClick={() => onViewChannel(ch.id)}
                  className="flex-1 px-2.5 py-1.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-[#A3A3A3] text-[10px] font-bold hover:text-[#FFFFFF] transition-colors text-center">
                  <Eye className="w-3 h-3 inline mr-1" />View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */
export function AgencyDashboardTool() {
  const { spendTokens } = useNychIQStore();
  const agencyChannels = useNychIQStore((s) => s.agencyChannels);
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  const setActiveAgencyChannel = useNychIQStore((s) => s.setActiveAgencyChannel);
  const removeAgencyChannel = useNychIQStore((s) => s.removeAgencyChannel);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('fleet');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // War Room state
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingComplete, setBriefingComplete] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);
  const [briefingProgress, setBriefingProgress] = useState(0);
  const [wlBrandName, setWlBrandName] = useState('');
  const [wlAccentColor, setWlAccentColor] = useState('#8B5CF6');
  const [whatIfPercent, setWhatIfPercent] = useState(20);
  const [copiedLink, setCopiedLink] = useState(false);
  const signalQueueRef = useRef<HTMLDivElement>(null);

  const displayChannels = agencyChannels.length > 0 ? agencyChannels : MOCK_CHANNELS_FOR_FALLBACK;
  const channelCount = displayChannels.length;
  const totalViews = displayChannels.reduce((s: number, c: any) => s + (c.monthlyViews || c.viewCount || 0), 0);
  const totalRevenue = displayChannels.reduce((s: number, c: any) => s + (c.monthlyRevenue || 0), 0);
  const avgHealth = channelCount > 0 ? Math.round(displayChannels.reduce((s: number, c: any) => s + (c.healthScore || 0), 0) / channelCount) : 0;

  // Tactical briefing animation
  useEffect(() => {
    if (!briefingLoading) return;
    const startTime = Date.now();
    const totalDuration = 10000;
    const stepInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setBriefingStep(Math.min(Math.floor(elapsed / 2000), 4));
    }, 200);
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
      setBriefingProgress(progress);
      if (elapsed >= totalDuration) {
        clearInterval(progressInterval);
        clearInterval(stepInterval);
        setBriefingStep(4);
        setBriefingProgress(100);
        setBriefingLoading(false);
        setBriefingComplete(true);
      }
    }, 100);
    return () => { clearInterval(stepInterval); clearInterval(progressInterval); };
  }, [briefingLoading]);

  // Token spending on load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const ok = spendTokens('agency-dashboard');
      if (!ok) { setLoading(false); return; }
      try { await new Promise((resolve) => setTimeout(resolve, 800)); }
      catch (err) { setError(err instanceof Error ? err.message : 'Failed to load agency data.'); }
      finally { setLoading(false); }
    };
    loadData();
  }, [spendTokens]);

  const handleSwitchToCustomize = useCallback((ids: string[]) => {
    setSelectedChannelId(null);
    setActiveTab('customize');
  }, []);

  const handleViewChannel = useCallback((id: string) => {
    setSelectedChannelId(id);
    setActiveAgencyChannel(id);
    setActiveTab('channels');
  }, [setActiveAgencyChannel]);

  const handleCopyLink = async (url: string) => {
    const ok = await copyToClipboard(url);
    if (ok) { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
  };

  /* Tabs config */
  const tabs = [
    { id: 'fleet', label: 'Fleet Overview', icon: Users },
    { id: 'channels', label: 'Channels', icon: MonitorPlay },
    { id: 'customize', label: 'Bulk Customize', icon: SlidersHorizontal },
    { id: 'signals', label: 'Signal Queue', icon: Signal },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'war-room', label: 'War Room', icon: Radio },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  /* ── LOADING ── */
  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#1A1A1A]" />
            <div className="space-y-2 flex-1"><div className="h-4 bg-[#1A1A1A] rounded w-40" /><div className="h-3 bg-[#1A1A1A] rounded w-64" /></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-[#1A1A1A]" />)}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-[#1A1A1A]" /><div className="space-y-2 flex-1"><div className="h-4 bg-[#1A1A1A] rounded w-2/3" /></div></div>
          </div>
        ))}</div>
      </div>
    );
  }

  /* ── ERROR ── */
  if (error) {
    return (
      <div className="animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-[#EF4444]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Failed to Load Dashboard</h3>
          <p className="text-sm text-[#A3A3A3] mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-lg bg-[#EF4444] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── MAIN RENDER ── */
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(139,92,246,0.1)]"><Building2 className="w-5 h-5 text-[#8B5CF6]" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#FFFFFF]">Agency Hub</h2>
                  <Crown className="w-3.5 h-3.5 text-[#8B5CF6]" />
                </div>
                <p className="text-xs text-[#A3A3A3] mt-0.5">Multi-seat command center for managing {channelCount} client channels</p>
              </div>
            </div>
            <button onClick={() => setActiveTool('audit')}
              className="px-3.5 py-2 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-xs font-bold hover:bg-[#C69320] transition-colors flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Channel
            </button>
          </div>
        </div>

        {/* Channel Switcher */}
        <div className="px-4 sm:px-5 py-3 border-b border-[#1A1A1A] overflow-x-auto">
          <div className="flex items-center gap-2">
            {displayChannels.map((ch) => {
              const chId = 'id' in ch ? ch.id : String(ch.id);
              const chName = 'title' in ch ? ch.title : ch.name;
              const chColor = 'color' in ch ? ch.color : '#8B5CF6';
              const chInitials = 'initials' in ch ? ch.initials : chName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
              const chStatus = 'status' in ch ? ch.status : 'performing';
              const isActive = selectedChannelId === chId;
              return (
                <button key={chId} onClick={() => { if (isActive) { setSelectedChannelId(null); } else { setSelectedChannelId(chId); setActiveAgencyChannel(chId); setActiveTab('channels'); } }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-shrink-0"
                  style={{ background: isActive ? `${chColor}15` : '#0D0D0D', border: `1.5px solid ${isActive ? `${chColor}50` : '#1A1A1A'}` }}>
                  <StatusRingDot status={chStatus} />
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: `${chColor}20`, color: chColor }}>{chInitials}</div>
                  <span className="text-[11px] font-medium" style={{ color: isActive ? chColor : '#A3A3A3' }}>{chName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Fleet Size" value={String(channelCount)} color="#8B5CF6" sub="Active clients" />
        <StatCard icon={Eye} label="Total Views/mo" value={fmtV(totalViews)} color="#3B82F6" sub="Across fleet" />
        <StatCard icon={DollarSign} label="Fleet Revenue" value={`$${totalRevenue.toLocaleString()}`} color="#FDBA2D" sub="Monthly total" />
        <StatCard icon={BarChart3} label="Avg Health" value={`${avgHealth}`} color="#10B981" sub={avgHealth >= 85 ? 'Excellent' : 'Good'} />
        <StatCard icon={Signal} label="Active Signals" value={String(MOCK_SIGNALS.filter((s) => s.priority === 'high').length)} color="#EF4444" sub="High priority" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'channels') setSelectedChannelId(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20' : 'bg-[#141414] border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#FFFFFF] hover:border-[#2A2A2A]'}`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'signals' && <span className="px-1.5 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[9px] font-bold text-[#EF4444]">{MOCK_SIGNALS.filter((s) => s.priority === 'high').length}</span>}
          </button>
        ))}
      </div>

      {/* ═══════ FLEET OVERVIEW TAB ═══════ */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* ROI Chart */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-[#8B5CF6]" /> Portfolio ROI</h3>
              <span className="text-[10px] text-[#666666]">Last 6 months</span>
            </div>
            <div className="p-5">
              {(() => {
                const data = [42, 58, 71, 65, 82, 96]; const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
                const w = 520, h = 140, px = 36, py = 10, pb = 24;
                const chartW = w - px - 10; const chartH = h - py - pb;
                const minVal = 30, maxVal = 100;
                const getX = (i: number) => px + (i / (data.length - 1)) * chartW;
                const getY = (v: number) => py + (1 - (v - minVal) / (maxVal - minVal)) * chartH;
                const pts = data.map((v, i) => ({ x: getX(i), y: getY(v) }));
                let linePath = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 1; i < pts.length; i++) { const prev = pts[i - 1]; const cur = pts[i]; const cpx = (prev.x + cur.x) / 2; linePath += ` C ${cpx} ${prev.y}, ${cpx} ${cur.y}, ${cur.x} ${cur.y}`; }
                const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${h - pb} L ${pts[0].x} ${h - pb} Z`;
                return (
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 160 }}>
                    <defs><linearGradient id="roi-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FDBA2D" stopOpacity="0.4" /><stop offset="100%" stopColor="#FDBA2D" stopOpacity="0" /></linearGradient></defs>
                    {data.map((v) => <line key={v} x1={px} y1={getY(v)} x2={w - 10} y2={getY(v)} stroke="#1F1F1F" strokeWidth="1" />)}
                    <path d={areaPath} fill="url(#roi-area-gradient)" />
                    <path d={linePath} fill="none" stroke="#FDBA2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#FDBA2D" style={{ filter: 'drop-shadow(0 0 4px rgba(253,186,45,0.6))' }} />)}
                    {months.map((m, i) => <text key={m} x={getX(i)} y={h - 4} textAnchor="middle" fill="#555555" fontSize="9" fontFamily="sans-serif">{m}</text>)}
                  </svg>
                );
              })()}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1A1A1A]">
                <div className="flex items-center gap-1.5 text-[10px] text-[#666666]"><div className="w-2 h-2 rounded-full bg-[#FDBA2D]" /><span>Current: $96K</span></div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#10B981]"><ArrowUpRight className="w-3 h-3" /><span className="font-semibold">+17.1% MoM</span></div>
              </div>
            </div>
          </div>

          {/* Client Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayChannels.map((ch) => {
              const chId = 'id' in ch ? ch.id : String(ch.id);
              const chName = 'title' in ch ? ch.title : ch.name;
              const chSubs = ch.subscribers;
              const chColor = 'color' in ch ? ch.color : '#8B5CF6';
              const chInitials = 'initials' in ch ? ch.initials : chName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
              const chMonthlyViews = 'monthlyViews' in ch ? ch.monthlyViews : ch.viewCount;
              const chMonthlyRevenue = 'monthlyRevenue' in ch ? ch.monthlyRevenue : 0;
              const chCpm = 'cpm' in ch ? ch.cpm : 0;
              const chNiche = 'niche' in ch ? ch.niche : '';
              const chStatus = 'status' in ch ? ch.status : 'performing';
              const si = statusRing(chStatus);
              return (
                <div key={chId} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${chColor}25`, border: `2px solid ${chColor}50`, color: chColor }}>{chInitials}</div>
                      <div>
                        <div className="flex items-center gap-2"><p className="text-sm font-semibold text-[#FFFFFF]">{chName}</p><StatusRingDot status={chStatus} /></div>
                        <p className="text-[11px] text-[#A3A3A3]">{fmtV(chSubs)} subs{chNiche ? ` · ${chNiche}` : ''}</p>
                      </div>
                    </div>
                    <HealthCircle score={ch.healthScore} size={42} strokeWidth={3} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">Views/mo</p><p className="text-xs font-semibold text-[#FFFFFF]">{fmtV(chMonthlyViews)}</p></div>
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">Revenue</p><p className="text-xs font-semibold text-[#10B981]">${chMonthlyRevenue.toLocaleString()}</p></div>
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">CPM</p><p className="text-xs font-semibold text-[#FDBA2D]">${chCpm > 0 ? chCpm.toFixed(2) : 'N/A'}</p></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border" style={{ backgroundColor: `${si.color}10`, color: si.color, borderColor: `${si.color}25` }}>{si.label}</span>
                    <button onClick={() => { setSelectedChannelId(chId); setActiveAgencyChannel(chId); setActiveTab('channels'); }}
                      className="text-[11px] text-[#8B5CF6] hover:text-[#B08ADF] font-medium flex items-center gap-0.5 transition-colors group-hover:underline">
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ CHANNELS TAB ═══════ */}
      {activeTab === 'channels' && (
        selectedChannelId && agencyChannels.length > 0 ? (
          <ChannelDetailView
            channel={agencyChannels.find((c) => c.id === selectedChannelId)!}
            onBack={() => setSelectedChannelId(null)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-1.5"><MonitorPlay className="w-4 h-4 text-[#8B5CF6]" /> Managed Channels <span className="text-[10px] text-[#666666] font-normal ml-1">{channelCount} total</span></h3>
              <button onClick={() => setActiveTool('audit')} className="px-3.5 py-2 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-xs font-bold hover:bg-[#C69320] transition-colors flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add from Audit
              </button>
            </div>

            {agencyChannels.length === 0 ? (
              <div className="flex flex-col items-center py-16 animate-fade-in-up">
                <div className="w-20 h-20 rounded-2xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.15)] flex items-center justify-center mb-6">
                  <MonitorPlay className="w-10 h-10 text-[#8B5CF6]" />
                </div>
                <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">No Channels Added Yet</h2>
                <p className="text-sm text-[#A3A3A3] max-w-md text-center leading-relaxed mb-6">Run a Channel Audit to add client channels. Each channel gets a full analytics dashboard with AI insights, growth tracking, and personalized recommendations.</p>
                <button onClick={() => setActiveTool('audit')} className="px-6 py-3 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors flex items-center gap-2 shadow-lg shadow-[rgba(253,186,45,0.2)]">
                  <ClipboardCheck className="w-4 h-4" /> Go to Channel Audit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {agencyChannels.map((ch) => {
                  const si = statusRing(ch.status);
                  return (
                    <div key={ch.id} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {ch.avatar ? (
                            <img src={ch.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#1F1F1F]" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FDBA2D] to-[#C69320] flex items-center justify-center text-sm font-bold text-[#0D0D0D]">{ch.title.charAt(0)}</div>
                          )}
                          <div>
                            <div className="flex items-center gap-2"><p className="text-sm font-semibold text-[#FFFFFF]">{ch.title}</p><StatusRingDot status={ch.status} /></div>
                            <p className="text-[11px] text-[#A3A3A3]">{fmtV(ch.subscriberCount)} subs · {ch.niche}</p>
                          </div>
                        </div>
                        <HealthCircle score={ch.healthScore} size={42} strokeWidth={3} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                        <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">Views/mo</p><p className="text-xs font-semibold text-[#FFFFFF]">{fmtV(ch.monthlyViews)}</p></div>
                        <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">Revenue</p><p className="text-xs font-semibold text-[#10B981]">${ch.monthlyRevenue.toLocaleString()}</p></div>
                        <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">CPM</p><p className="text-xs font-semibold text-[#FDBA2D]">${ch.cpm.toFixed(2)}</p></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border" style={{ backgroundColor: `${si.color}10`, color: si.color, borderColor: `${si.color}25` }}>{si.label}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedChannelId(ch.id); setActiveAgencyChannel(ch.id); }}
                            className="text-[11px] text-[#8B5CF6] hover:text-[#B08ADF] font-medium flex items-center gap-0.5 transition-colors group-hover:underline">
                            Details <ChevronRight className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeAgencyChannel(ch.id)}
                            className="p-1 rounded text-[#444444] hover:text-[#EF4444] transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* ═══════ BULK CUSTOMIZE TAB ═══════ */}
      {activeTab === 'customize' && <BulkCustomizeTab />}

      {/* ═══════ SIGNAL QUEUE TAB ═══════ */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-1.5"><Signal className="w-4 h-4 text-[#8B5CF6]" /> Intelligence Signals <span className="text-[10px] text-[#666666] font-normal ml-1">{MOCK_SIGNALS.length} active</span></h3>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[9px] font-bold text-[#EF4444]">{MOCK_SIGNALS.filter((s) => s.priority === 'high').length} HIGH</span>
              <span className="px-2 py-0.5 rounded-full bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] text-[9px] font-bold text-[#FDBA2D]">{MOCK_SIGNALS.filter((s) => s.priority === 'medium').length} MED</span>
            </div>
          </div>
          <div ref={signalQueueRef} className="space-y-2 max-h-[500px] overflow-y-auto">
            {MOCK_SIGNALS.map((signal) => {
              const typeInfo = signalTypeInfo(signal.type);
              const TypeIcon = typeInfo.icon;
              return (
                <div key={signal.id} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5"><div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${typeInfo.color}15`, border: `1px solid ${typeInfo.color}25` }}><TypeIcon className="w-4 h-4" style={{ color: typeInfo.color }} /></div></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0" style={{ backgroundColor: `${signal.clientColor}20`, color: signal.clientColor }}>{signal.clientInitials}</div>
                        <span className="text-[11px] font-semibold text-[#FFFFFF]">{signal.client}</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>{typeInfo.label}</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: signal.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(253,186,45,0.1)', color: signal.priority === 'high' ? '#EF4444' : '#FDBA2D' }}>{signal.priority.toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-[#AAAAAA] leading-relaxed mb-1.5">{signal.message}</p>
                      <span className="text-[10px] text-[#555555] flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {timeAgo(signal.time)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ AI AGENTS TAB ═══════ */}
      {activeTab === 'agents' && <AIAgentsTab onSwitchToCustomize={handleSwitchToCustomize} onViewChannel={handleViewChannel} />}

      {/* ═══════ WAR ROOM TAB ═══════ */}
      {activeTab === 'war-room' && (
        <div className="space-y-4">
          {/* Tactical Briefing */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A]">
              <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><Radar className="w-3.5 h-3.5 text-[#FDBA2D]" /> Tactical Briefing</h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#A3A3A3] mb-4">Generate a comprehensive tactical intelligence briefing for your entire fleet. Includes competitor analysis, signal arbitrage mapping, and content funnel optimization.</p>
              {!briefingLoading && !briefingComplete && (
                <button onClick={() => { setBriefingComplete(false); setBriefingLoading(true); setBriefingStep(0); setBriefingProgress(0); }}
                  className="px-5 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #FDBA2D, #E09100)', color: '#1A1A1A' }}>
                  <Radar className="w-4 h-4" /> Generate Tactical Briefing
                </button>
              )}
              {briefingLoading && (
                <div className="flex flex-col items-center py-8">
                  <div className="relative mb-6" style={{ width: 80, height: 80 }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" className="animate-spin" style={{ animationDuration: '2s' }}>
                      <circle cx="40" cy="40" r="35" fill="none" stroke="#1A1A1A" strokeWidth="4" />
                      <circle cx="40" cy="40" r="35" fill="none" stroke="#FDBA2D" strokeWidth="4" strokeDasharray={`${briefingProgress * 2.2} 220`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold text-[#FDBA2D]">{briefingProgress}%</span></div>
                  </div>
                  <p className="text-xs text-[#A3A3A3]">{['Analyzing Competitor DNA...', 'Mapping Signal Arbitrage...', 'Scanning Content Funnels...', 'Compiling Intelligence Matrix...', 'Generating Tactical Brief...'][briefingStep]}</p>
                </div>
              )}
              {briefingComplete && !briefingLoading && (
                <div className="p-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /><span className="text-sm font-bold text-[#FFFFFF]">Tactical Briefing Complete</span></div>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">Fleet-wide analysis complete. Key findings: 3 channels showing viral trajectory, 2 channels need content refresh, 1 high-arbitrage opportunity identified in Art & Design niche. Total portfolio health: {avgHealth}/100.</p>
                  <button onClick={() => { setBriefingComplete(false); }} className="mt-3 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-[11px] font-medium hover:text-[#FFFFFF] transition-colors">
                    <RefreshCw className="w-3 h-3 inline mr-1" /> Regenerate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* What-If Projection */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5 mb-4"><TrendingUp className="w-3.5 h-3.5 text-[#FDBA2D]" /> What-If Projection</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#A3A3A3]">Increase upload frequency by</span>
                <span className="text-sm font-bold text-[#FDBA2D]">{whatIfPercent}%</span>
              </div>
              <input type="range" min={0} max={100} value={whatIfPercent} onChange={(e) => setWhatIfPercent(Number(e.target.value))} className="w-full accent-[#FDBA2D]" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-center">
                  <p className="text-[9px] text-[#666666]">Projected Views</p>
                  <p className="text-sm font-bold text-[#3B82F6]">+{Math.round(whatIfPercent * 2.4)}K</p>
                </div>
                <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-center">
                  <p className="text-[9px] text-[#666666]">Projected Revenue</p>
                  <p className="text-sm font-bold text-[#10B981]">+${Math.round(whatIfPercent * 18)}</p>
                </div>
                <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-center">
                  <p className="text-[9px] text-[#666666]">Health Impact</p>
                  <p className="text-sm font-bold text-[#FDBA2D]">+{Math.round(whatIfPercent * 0.12)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* White-Label */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5 mb-4"><Palette className="w-3.5 h-3.5 text-[#8B5CF6]" /> White-Label Branding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#A3A3A3] mb-1.5 block">Brand Name</label>
                <input type="text" value={wlBrandName} onChange={(e) => setWlBrandName(e.target.value)} placeholder="Your agency name" className="w-full h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#A3A3A3] mb-1.5 block">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={wlAccentColor} onChange={(e) => setWlAccentColor(e.target.value)} className="w-10 h-10 rounded-md border border-[#1A1A1A] cursor-pointer" />
                  <span className="text-xs text-[#666666] font-mono">{wlAccentColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ REPORTS TAB ═══════ */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Recent Reports */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5 mb-4"><FileText className="w-3.5 h-3.5 text-[#8B5CF6]" /> Recent Reports</h3>
            <div className="space-y-2">
              {MOCK_REPORTS.map((report) => {
                const badge = reportBadge(report.type);
                return (
                  <div key={report.id} className="flex items-center gap-3 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <div className={`p-2 rounded-md ${badge.bg}`}><span className={badge.text}>{badge.icon}</span></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-[#FFFFFF]">{report.name}</p><p className="text-[10px] text-[#666666]">{report.client} · {new Date(report.date).toLocaleDateString()}</p></div>
                    <button onClick={() => showToast('Report downloaded', 'success')} className="p-1.5 rounded-md text-[#444444] hover:text-[#FDBA2D] transition-colors"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Activity */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5 mb-4"><Activity className="w-3.5 h-3.5 text-[#FDBA2D]" /> Team Activity</h3>
            <div className="space-y-2">
              {MOCK_ACTIVITY.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-[#0D0D0D] transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: `${activity.color}20`, color: activity.color }}>{activity.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#FFFFFF]"><span className="font-semibold">{activity.user}</span> {activity.action} <span className="text-[#8B5CF6]">{activity.target}</span></p>
                  </div>
                  <span className="text-[10px] text-[#555555] flex-shrink-0">{timeAgo(activity.time)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <button onClick={() => showToast('Client added', 'success')} className="p-4 rounded-lg bg-[#141414] border border-[#1F1F1F] hover:border-[#2A2A2A] transition-colors flex flex-col items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#10B981]" /><span className="text-[11px] font-medium text-[#A3A3A3]">Add Client</span>
            </button>
            <button onClick={() => showToast('Bulk report generated', 'success')} className="p-4 rounded-lg bg-[#141414] border border-[#1F1F1F] hover:border-[#2A2A2A] transition-colors flex flex-col items-center gap-2">
              <FolderOutput className="w-5 h-5 text-[#FDBA2D]" /><span className="text-[11px] font-medium text-[#A3A3A3]">Bulk Report</span>
            </button>
            <button onClick={() => showToast('Data exported', 'success')} className="p-4 rounded-lg bg-[#141414] border border-[#1F1F1F] hover:border-[#2A2A2A] transition-colors flex flex-col items-center gap-2">
              <Download className="w-5 h-5 text-[#3B82F6]" /><span className="text-[11px] font-medium text-[#A3A3A3]">Export Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
