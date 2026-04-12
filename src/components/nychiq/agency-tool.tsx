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
const TONES = ['professional', 'casual', 'energetic', 'calm', 'humorous', 'inspirational'];
const GOALS = ['Grow subscribers', 'Increase watch time', 'Boost engagement', 'Monetize channel', 'Build brand awareness', 'Drive traffic', 'Establish authority', 'Community building', 'Product sales', 'Launch a course'];
const CONTENT_TYPES = ['Tutorials', 'Reviews', 'Vlogs', 'Shorts', 'Live Streams', 'Storytelling', 'Listicles', 'Deep Dives', 'Case Studies', 'Q&A', 'Commentary', 'Challenges', 'Collaborations', 'Reaction Videos'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian', 'Dutch', 'Russian', 'Japanese', 'Korean', 'Chinese (Mandarin)', 'Hindi', 'Arabic', 'Turkish', 'Swahili', 'Yoruba', 'Igbo', 'Hausa'];

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */
interface ClientChannel {
  id: string;
  name: string;
  initials: string;
  color: string;
  subscribers: number;
  videoCount: number;
  healthScore: number;
  lastAnalyzed: string;
  status: 'performing' | 'stale' | 'arbitrage' | 'growth';
  monthlyViews: number;
  monthlyRevenue: number;
  cpm: number;
  niche: string;
}

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
   Mock Data — 5 Clients (fallback)
   ═══════════════════════════════════════════ */
const MOCK_CHANNELS: ClientChannel[] = [
  { id: 'ch-1', name: 'TechVision Pro', initials: 'TV', color: '#3B82F6', subscribers: 485000, videoCount: 312, healthScore: 92, lastAnalyzed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'performing', monthlyViews: 5820000, monthlyRevenue: 3240, cpm: 18.40, niche: 'Technology' },
  { id: 'ch-2', name: 'FitLife Academy', initials: 'FA', color: '#10B981', subscribers: 1280000, videoCount: 578, healthScore: 87, lastAnalyzed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), status: 'performing', monthlyViews: 12400000, monthlyRevenue: 8920, cpm: 22.10, niche: 'Fitness' },
  { id: 'ch-3', name: 'Crypto Daily', initials: 'CD', color: '#FDBA2D', subscribers: 320000, videoCount: 189, healthScore: 74, lastAnalyzed: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), status: 'stale', monthlyViews: 1840000, monthlyRevenue: 1680, cpm: 32.50, niche: 'Finance' },
  { id: 'ch-4', name: 'Art Studio NG', initials: 'AS', color: '#8B5CF6', subscribers: 890000, videoCount: 421, healthScore: 91, lastAnalyzed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'growth', monthlyViews: 7600000, monthlyRevenue: 4120, cpm: 14.80, niche: 'Art & Design' },
  { id: 'ch-5', name: 'EduTech Masters', initials: 'EM', color: '#EF4444', subscribers: 620000, videoCount: 267, healthScore: 68, lastAnalyzed: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), status: 'stale', monthlyViews: 3200000, monthlyRevenue: 2100, cpm: 18.40, niche: 'Education' },
];

const MOCK_SIGNALS: SignalQueueItem[] = [
  { id: 's-1', client: 'TechVision Pro', clientColor: '#3B82F6', clientInitials: 'TV', type: 'viral', message: 'AI phone review hit 500K views in 18 hours — viral score 94. Consider follow-up content.', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-2', client: 'FitLife Academy', clientColor: '#10B981', clientInitials: 'FA', type: 'trend', message: '"Zone 2 cardio" search volume up 340% this week. Perfect timing for a deep-dive video.', time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-3', client: 'Crypto Daily', clientColor: '#FDBA2D', clientInitials: 'CD', type: 'gap', message: 'No upload in 4 days. Audience engagement dropping — 12% comment decline vs last week.', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
  { id: 's-4', client: 'Art Studio NG', clientColor: '#8B5CF6', clientInitials: 'AS', type: 'arbitrage', message: 'Art supply CPM at $14.80 but affiliate program offers $28 per sale. 4.2x revenue opportunity.', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-5', client: 'EduTech Masters', clientColor: '#EF4444', clientInitials: 'EM', type: 'threat', message: 'New competitor "LearnCode Pro" gained 50K subs this month in same niche.', time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
  { id: 's-6', client: 'TechVision Pro', clientColor: '#3B82F6', clientInitials: 'TV', type: 'trend', message: 'Apple Vision Pro 2 leaks trending — 2.1M searches. Perfect for a preview/analysis video.', time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
  { id: 's-7', client: 'FitLife Academy', clientColor: '#10B981', clientInitials: 'FA', type: 'gap', message: 'Meal prep content gap: audience asking for budget-friendly options in comments.', time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), priority: 'low' },
  { id: 's-8', client: 'Art Studio NG', clientColor: '#8B5CF6', clientInitials: 'AS', type: 'viral', message: 'Time-lapse portrait video reached 1.2M views. Replicate format with different subjects.', time: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
];

const MOCK_REPORTS: Report[] = [
  { id: 'r-1', name: 'Full Channel Audit', client: 'TechVision Pro', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'Audit' },
  { id: 'r-2', name: 'Growth Strategy Q4', client: 'FitLife Academy', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'Strategy' },
  { id: 'r-3', name: 'SEO Optimization Pack', client: 'Art Studio NG', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'SEO' },
  { id: 'r-4', name: 'Performance Audit', client: 'Crypto Daily', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'Audit' },
  { id: 'r-5', name: 'Niche Expansion Report', client: 'EduTech Masters', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'Strategy' },
];

const MOCK_ACTIVITY: TeamActivity[] = [
  { id: 'a-1', user: 'Sarah K.', initials: 'SK', color: '#3B82F6', action: 'completed audit for', target: 'TechVision Pro', time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'a-2', user: 'Mike R.', initials: 'MR', color: '#10B981', action: 'generated SEO report for', target: 'FitLife Academy', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'a-3', user: 'Sarah K.', initials: 'SK', color: '#3B82F6', action: 'flagged stale content on', target: 'Crypto Daily', time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'a-4', user: 'Alex T.', initials: 'AT', color: '#8B5CF6', action: 'updated strategy for', target: 'EduTech Masters', time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 'a-5', user: 'Mike R.', initials: 'MR', color: '#10B981', action: 'exported data for', target: 'all channels', time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
];

/* ═══════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════ */
function healthColor(score: number): string {
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

function reportTypeBadge(type: Report['type']): { bg: string; text: string; border: string; icon: React.ReactNode } {
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

function statusRing(status: ClientChannel['status']): { color: string; label: string; pulse: boolean } {
  switch (status) {
    case 'performing': return { color: '#10B981', label: 'Performing Well', pulse: true };
    case 'stale': return { color: '#FDBA2D', label: 'No Uploads (3+ days)', pulse: false };
    case 'arbitrage': return { color: '#8B5CF6', label: 'High Arbitrage', pulse: false };
    case 'growth': return { color: '#3B82F6', label: 'Rapid Growth', pulse: true };
  }
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */
function HealthCircle({ score, size = 48, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = healthColor(score);
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

function StatusRingDot({ status }: { status: ClientChannel['status'] }) {
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

/* HealthRing — larger ring for detail view */
function HealthRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = healthColor(score);
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

/* GrowthChart — SVG sparkline */
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

/* HeatmapBlock — heatmap cell */
function HeatmapBlock({ value }: { value: number }) {
  const bg = value >= 80 ? 'bg-[#10B981]/70' : value >= 60 ? 'bg-[#10B981]/40' : value >= 40 ? 'bg-[#FDBA2D]/40' : value >= 20 ? 'bg-[#3B82F6]/30' : 'bg-[#1A1A1A]';
  return <div className={`h-5 rounded-sm ${bg} transition-colors`} title={`${value}%`} />;
}

/* ToolCard — quick-launch button card */
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

/* KPICard — metric card with icon/value/change */
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

/* ActivityItem — activity feed row */
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

/* TagInput — inline tag input */
function TagInput({ tags, onAdd, onRemove, placeholder }: { tags: string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] min-h-[40px]">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">
          {tag}
          <button onClick={() => onRemove(tag)} className="hover:text-[#EF4444] transition-colors"><X className="w-2.5 h-2.5" /></button>
        </span>
      ))}
      <div className="flex items-center gap-1 flex-1 min-w-[100px]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs text-[#FFFFFF] outline-none placeholder:text-[#555555] min-w-[60px]"
        />
        {input.trim() && (
          <button onClick={handleAdd} className="p-0.5 rounded hover:bg-[#1A1A1A] transition-colors">
            <Plus className="w-3 h-3 text-[#8B5CF6]" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */
export function AgencyDashboardTool() {
  const agencyChannels = useNychIQStore((s) => s.agencyChannels);
  const activeAgencyChannelId = useNychIQStore((s) => s.activeAgencyChannelId);
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  const setActiveAgencyChannel = useNychIQStore((s) => s.setActiveAgencyChannel);
  const removeAgencyChannel = useNychIQStore((s) => s.removeAgencyChannel);
  const bulkUpdateAssistantConfig = useNychIQStore((s) => s.bulkUpdateAssistantConfig);
  const userPlan = useNychIQStore((s) => s.userPlan);
  const { spendTokens } = useNychIQStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('fleet');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [commandOutput, setCommandOutput] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [warRoomLinks, setWarRoomLinks] = useState<{ id: string; client: string; label: string; url: string; created: string }[]>([
    { id: 'wl-1', client: 'TechVision Pro', label: 'Q4 Strategy Brief', url: 'https://nychiq.app/share/fleet-q4-tv', created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'wl-2', client: 'FitLife Academy', label: 'Monthly Performance Report', url: 'https://nychiq.app/share/perf-fa-oct', created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  ]);
  const signalQueueRef = useRef<HTMLDivElement>(null);

  // Tactical Briefing state
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingComplete, setBriefingComplete] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);
  const [briefingProgress, setBriefingProgress] = useState(0);

  // White-Label state
  const [wlAccentColor] = useState('#8B5CF6');
  const [whatIfPercent, setWhatIfPercent] = useState(20);

  // Bulk Customize state
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
  const [bulkForm, setBulkForm] = useState({
    brandVoice: '', tone: 'professional', audience: '', language: 'English',
    goals: [] as string[], contentTypes: [] as string[], keywords: [] as string[], customInstructions: '',
  });
  const [bulkApplying, setBulkApplying] = useState(false);

  // AI Insights for detail view
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<Array<{ priority: 'high' | 'medium' | 'low'; title: string; description: string }> | null>(null);
  const [activeMetric, setActiveMetric] = useState<'views' | 'engagement' | 'watchtime' | 'subs'>('views');

  const BRIEFING_MESSAGES = ['Analyzing Competitor DNA...', 'Mapping Signal Arbitrage...', 'Scanning Content Funnels...', 'Compiling Intelligence Matrix...', 'Generating Tactical Brief...'];

  /* ── Derived data ── */
  const displayChannels = agencyChannels.length > 0 ? agencyChannels : MOCK_CHANNELS;
  const channelCount = agencyChannels.length > 0 ? agencyChannels.length : MOCK_CHANNELS.length;

  const totalMonthlyViews = displayChannels.reduce((sum, ch) => sum + ('monthlyViews' in ch ? ch.monthlyViews : (ch as ClientChannel).monthlyViews), 0);
  const totalMonthlyRevenue = displayChannels.reduce((sum, ch) => sum + ('monthlyRevenue' in ch ? ch.monthlyRevenue : (ch as ClientChannel).monthlyRevenue), 0);
  const avgHealth = Math.round(displayChannels.reduce((sum, ch) => sum + ch.healthScore, 0) / displayChannels.length);

  const selectedChannel = selectedChannelId ? agencyChannels.find((c) => c.id === selectedChannelId) ?? null : null;

  /* ── Stable mock data for detail view ── */
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

  const metricOptions = [
    { key: 'views' as const, label: 'Views', color: '#FDBA2D', data: growthData.views },
    { key: 'engagement' as const, label: 'Engagement %', color: '#10B981', data: growthData.engagement },
    { key: 'watchtime' as const, label: 'Watch Time (min)', color: '#3B82F6', data: growthData.watchtime },
    { key: 'subs' as const, label: 'New Subs/week', color: '#8B5CF6', data: growthData.subs },
  ];

  const quickTools = [
    { icon: Zap, label: 'Viral Predictor', desc: 'Forecast next video potential', cost: TOKEN_COSTS.viral, toolId: 'viral', color: '#10B981' },
    { icon: Crosshair, label: 'Niche Radar', desc: 'Trends for your niche', cost: TOKEN_COSTS.niche, toolId: 'niche', color: '#FDBA2D' },
    { icon: Clock, label: 'Best Post Time', desc: 'Personalized upload windows', cost: TOKEN_COSTS.posttime, toolId: 'posttime', color: '#3B82F6' },
    { icon: Anchor, label: 'My HookLab', desc: 'Generate video intros', cost: TOKEN_COSTS.hooklab, toolId: 'hooklab', color: '#EF4444' },
    { icon: SearchCode, label: 'SEO Optimizer', desc: 'Refine video descriptions', cost: TOKEN_COSTS.seo, toolId: 'seo', color: '#8B5CF6' },
    { icon: GitCompare, label: 'Competitor Track', desc: 'Side-by-side comparison', cost: TOKEN_COSTS.competitor, toolId: 'competitor', color: '#10B981' },
  ];

  /* ── Effects ── */
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

  useEffect(() => {
    if (activeTab === 'signals' && signalQueueRef.current) signalQueueRef.current.scrollTop = 0;
  }, [activeTab]);

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

  /* ── Handlers ── */
  const handleGenerateBriefing = () => { setBriefingComplete(false); setBriefingLoading(true); setBriefingStep(0); setBriefingProgress(0); };
  const handleDownloadReport = () => showToast('Report generated successfully', 'success');
  const handleCopyLink = async (url: string) => { const ok = await copyToClipboard(url); if (ok) { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); } };

  const handleGenerateWarLink = () => {
    const client = displayChannels.find((c) => c.id === activeAgencyChannelId);
    if (!client) return;
    const initials = client.title ? client.title.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'CH';
    setWarRoomLinks([{ id: `wl-${Date.now()}`, client: client.title, label: `${client.title} Intelligence Brief`, url: `https://nychiq.app/share/intel-${initials.toLowerCase()}-${Date.now().toString(36)}`, created: new Date().toISOString() }, ...warRoomLinks]);
  };

  const handleGenerateInsights = useCallback(() => {
    setAiLoading(true);
    setTimeout(() => {
      setAiInsights([
        { priority: 'high', title: 'Title Optimization Gap', description: 'Your last 5 videos average 42 characters per title. Top-performing channels in your niche use 55-65 characters. Adding power words and specificity can boost CTR by an estimated 18-25%.' },
        { priority: 'high', title: 'Retention Drop at 2:15', description: 'Analytics show a consistent viewer drop-off around the 2-minute mark across your recent uploads. Consider adding a pattern interrupt, visual transition, or tease at this timestamp to maintain retention above 50%.' },
        { priority: 'medium', title: 'Upload Frequency Opportunity', description: 'Channels posting 3x per week in your niche see 40% more algorithmic impressions. Your current cadence of 1-2x per week leaves significant reach on the table.' },
        { priority: 'medium', title: 'Description Keywords Missing', description: 'Only 3 of your last 10 videos include timestamps, and none use niche-specific long-tail keywords in descriptions. Adding 3-5 targeted keywords can improve search discovery by up to 30%.' },
        { priority: 'low', title: 'End Screen Under-utilized', description: 'Your end screens only link to 1-2 videos. Maximizing end screen real estate with playlists and subscribe prompts could increase session duration by an estimated 12%.' },
      ]);
      setAiLoading(false);
    }, 2000);
  }, []);

  const handleCommand = () => {
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;
    if (cmd.startsWith('/compare')) {
      const parts = cmd.split(' ').slice(1);
      const found1 = displayChannels.find((c) => c.title.toLowerCase().includes(parts[0] || ''));
      const found2 = displayChannels.find((c) => c.title.toLowerCase().includes(parts[1] || ''));
      if (found1 && found2) {
        setCommandOutput(`📊 Comparison: ${found1.title} vs ${found2.title}\n\n${found1.title}: ${fmtV(found1.subscriberCount)} subs, ${fmtV(found1.monthlyViews)} views/mo, Health ${found1.healthScore}\n${found2.title}: ${fmtV(found2.subscriberCount)} subs, ${fmtV(found2.monthlyViews)} views/mo, Health ${found2.healthScore}\n\nRecommendation: ${found1.healthScore > found2.healthScore ? found1.title : found2.title} has stronger growth trajectory.`);
      } else {
        setCommandOutput(`❌ Client(s) not found. Available: ${displayChannels.map((c) => c.title).join(', ')}`);
      }
    } else if (cmd === '/report-all') {
      setCommandOutput(`📋 Generating bulk reports for all ${displayChannels.length} channels...\n\nReports generated:\n${displayChannels.map((c) => `✅ ${c.title} — Channel Audit`).join('\n')}\n\nAll reports saved to your Agency Hub.`);
    } else {
      setCommandOutput(`❓ Unknown command: "${cmd}"\n\nAvailable commands:\n/compare <ClientA> <ClientB> — Compare two clients\n/report-all — Generate reports for all channels`);
    }
  };

  const handleBulkApply = () => {
    if (selectedBulkIds.size === 0) return;
    setBulkApplying(true);
    setTimeout(() => {
      bulkUpdateAssistantConfig(Array.from(selectedBulkIds), {
        brandVoice: bulkForm.brandVoice,
        tone: bulkForm.tone,
        audience: bulkForm.audience,
        language: bulkForm.language,
        goals: bulkForm.goals,
        contentTypes: bulkForm.contentTypes,
        keywords: bulkForm.keywords,
        customInstructions: bulkForm.customInstructions,
      });
      showToast(`Applied config to ${selectedBulkIds.size} channels`, 'success');
      setBulkApplying(false);
      setSelectedBulkIds(new Set());
    }, 1000);
  };

  const handleSelectAllChannels = () => {
    if (selectedBulkIds.size === agencyChannels.length) {
      setSelectedBulkIds(new Set());
    } else {
      setSelectedBulkIds(new Set(agencyChannels.map((c) => c.id)));
    }
  };

  const handleViewChannel = (id: string) => {
    setSelectedChannelId(id);
    setActiveTab('channels');
    setActiveAgencyChannel(id);
  };

  /* ── Tabs config ── */
  const tabs = [
    { id: 'fleet', label: 'Fleet Overview', icon: Users },
    { id: 'channels', label: 'Channels', icon: MonitorPlay },
    { id: 'customize', label: 'Bulk Customize', icon: SlidersHorizontal },
    { id: 'signals', label: 'Signal Queue', icon: Signal },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'war-room', label: 'War Room', icon: Radio },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  /* ══════════ LOADING ══════════ */}
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
      </div>
    );
  }

  /* ══════════ ERROR ══════════ */
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

  /* ══════════ MAIN RENDER ══════════ */
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(139,92,246,0.1)]"><Crown className="w-5 h-5 text-[#8B5CF6]" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#FFFFFF]">Agency Hub</h2>
                  <Crown className="w-3.5 h-3.5 text-[#8B5CF6]" />
                </div>
                <p className="text-xs text-[#A3A3A3] mt-0.5">Managing {channelCount} client channels</p>
              </div>
            </div>
          </div>
        </div>
        {/* Client Switcher */}
        <div className="px-4 sm:px-5 py-3 border-b border-[#1A1A1A] overflow-x-auto">
          <div className="flex items-center gap-3">
            {displayChannels.map((ch) => {
              const color = MOCK_CHANNELS.find((m) => m.id === ch.id)?.color ?? '#8B5CF6';
              const status = MOCK_CHANNELS.find((m) => m.id === ch.id)?.status ?? (ch as ClientChannel).status;
              const initials = MOCK_CHANNELS.find((m) => m.id === ch.id)?.initials ?? ch.title.slice(0, 2).toUpperCase();
              const name = ch.title || (ch as ClientChannel).name;
              const isActive = activeAgencyChannelId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => { setActiveAgencyChannel(isActive ? null : ch.id); if (!isActive) handleViewChannel(ch.id); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-shrink-0"
                  style={{ background: isActive ? `${color}15` : '#0D0D0D', border: `1.5px solid ${isActive ? `${color}50` : '#1A1A1A'}` }}
                >
                  <StatusRingDot status={status} />
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: `${color}20`, color }}>{initials}</div>
                  <span className="text-[11px] font-medium" style={{ color: isActive ? color : '#A3A3A3' }}>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Fleet Size" value={String(channelCount)} color="#8B5CF6" sub="Active clients" />
        <StatCard icon={Eye} label="Total Views/mo" value={fmtV(totalMonthlyViews)} color="#3B82F6" sub="Across fleet" />
        <StatCard icon={DollarSign} label="Fleet Revenue" value={`$${totalMonthlyRevenue.toLocaleString()}`} color="#FDBA2D" sub="Monthly total" />
        <StatCard icon={BarChart3} label="Avg Health" value={`${avgHealth}`} color="#10B981" sub={healthLabel(avgHealth)} />
        <StatCard icon={Signal} label="Active Signals" value={String(MOCK_SIGNALS.filter((s) => s.priority === 'high').length)} color="#EF4444" sub="High priority" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id !== 'channels') setSelectedChannelId(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20' : 'bg-[#141414] border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#FFFFFF] hover:border-[#2A2A2A]'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'signals' && <span className="px-1.5 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[9px] font-bold text-[#EF4444]">{MOCK_SIGNALS.filter((s) => s.priority === 'high').length}</span>}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB: FLEET OVERVIEW
          ═══════════════════════════════════════════ */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* Portfolio ROI Chart */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-[#8B5CF6]" /> Portfolio ROI</h3>
              <span className="text-[10px] text-[#666666]">Last 6 months</span>
            </div>
            <div className="p-5">
              {(() => {
                const data = [42, 58, 71, 65, 82, 96]; const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
                const w = 520, h = 140, px = 36, py = 10, pb = 24;
                const chartW = w - px - 10, chartH = h - py - pb, minVal = 30, maxVal = 100;
                const getX = (i: number) => px + (i / (data.length - 1)) * chartW;
                const getY = (v: number) => py + (1 - (v - minVal) / (maxVal - minVal)) * chartH;
                const pts = data.map((v, i) => ({ x: getX(i), y: getY(v) }));
                let linePath = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 1; i < pts.length; i++) { const prev = pts[i - 1]; const cur = pts[i]; const cpx = (prev.x + cur.x) / 2; linePath += ` C ${cpx} ${prev.y}, ${cpx} ${cur.y}, ${cur.x} ${cur.y}`; }
                const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${h - pb} L ${pts[0].x} ${h - pb} Z`;
                const yTicks = [42, 58, 71, 82, 96];
                return (
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 160 }}>
                    <defs><linearGradient id="roi-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FDBA2D" stopOpacity="0.4" /><stop offset="100%" stopColor="#FDBA2D" stopOpacity="0" /></linearGradient></defs>
                    {yTicks.map((v) => <line key={v} x1={px} y1={getY(v)} x2={w - 10} y2={getY(v)} stroke="#1F1F1F" strokeWidth="1" />)}
                    <path d={areaPath} fill="url(#roi-area-gradient)" />
                    <path d={linePath} fill="none" stroke="#FDBA2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#FDBA2D" style={{ filter: 'drop-shadow(0 0 4px rgba(253,186,45,0.6))' }} />)}
                    {months.map((m, i) => <text key={m} x={getX(i)} y={h - 4} textAnchor="middle" fill="#555555" fontSize="9" fontFamily="sans-serif">{m}</text>)}
                    {yTicks.map((v) => <text key={`y-${v}`} x={px - 6} y={getY(v) + 3} textAnchor="end" fill="#A3A3A3" fontSize="9" fontFamily="sans-serif">{v}K</text>)}
                  </svg>
                );
              })()}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1A1A1A]">
                <div className="flex items-center gap-1.5 text-[10px] text-[#666666]"><div className="w-2 h-2 rounded-full bg-[#FDBA2D]" /><span>Current: $96K</span></div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#10B981]"><ArrowUpRight className="w-3 h-3" /><span className="font-semibold">+17.1% MoM</span></div>
              </div>
            </div>
          </div>
          {/* Client Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayChannels.map((ch) => {
              const mc = MOCK_CHANNELS.find((m) => m.id === ch.id);
              const color = mc?.color ?? '#8B5CF6';
              const status = mc?.status ?? ch.status;
              const initials = mc?.initials ?? ch.title.slice(0, 2).toUpperCase();
              const statusInfo = statusRing(status);
              const name = ch.title || (ch as ClientChannel).name;
              return (
                <div key={ch.id} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors group cursor-pointer" onClick={() => handleViewChannel(ch.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: `${color}25`, border: `2px solid ${color}50`, color }}>{ch.avatar ? <img src={ch.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : initials}</div>
                      <div>
                        <div className="flex items-center gap-2"><p className="text-sm font-semibold text-[#FFFFFF]">{name}</p><StatusRingDot status={status} /></div>
                        <p className="text-[11px] text-[#A3A3A3]">{fmtV(ch.subscriberCount)} subs · {ch.niche}</p>
                      </div>
                    </div>
                    <HealthCircle score={ch.healthScore} size={42} strokeWidth={3} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">Views/mo</p><p className="text-xs font-semibold text-[#FFFFFF]">{fmtV(ch.monthlyViews)}</p></div>
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">Revenue</p><p className="text-xs font-semibold text-[#10B981]">${ch.monthlyRevenue.toLocaleString()}</p></div>
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">CPM</p><p className="text-xs font-semibold text-[#FDBA2D]">${ch.cpm.toFixed(2)}</p></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border" style={{ backgroundColor: `${statusInfo.color}10`, color: statusInfo.color, borderColor: `${statusInfo.color}25` }}>{statusInfo.label}</span>
                    <span className="text-[11px] text-[#8B5CF6] hover:text-[#B08ADF] font-medium flex items-center gap-0.5 transition-colors group-hover:underline">Details <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB: CHANNELS
          ═══════════════════════════════════════════ */}
      {activeTab === 'channels' && (
        <div>
          {!selectedChannel ? (
            /* ── Channel List View ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-1.5"><MonitorPlay className="w-4 h-4 text-[#8B5CF6]" /> Client Channels <span className="text-[10px] text-[#666666] font-normal ml-1">{channelCount} channels</span></h3>
                <button onClick={() => setActiveTool('audit')} className="px-3 py-1.5 rounded-md bg-[#FDBA2D] text-[#0D0D0D] text-xs font-bold hover:bg-[#C69320] transition-colors flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Channel
                </button>
              </div>
              {channelCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.15)] flex items-center justify-center mb-4"><MonitorPlay className="w-8 h-8 text-[#FDBA2D]" /></div>
                  <h2 className="text-lg font-bold text-[#FFFFFF] mb-2">No Channels Yet</h2>
                  <p className="text-sm text-[#A3A3A3] max-w-md text-center leading-relaxed mb-6">Run a Channel Audit to add your first client channel. The audit will automatically link and analyze the channel.</p>
                  <button onClick={() => setActiveTool('audit')} className="px-6 py-3 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors flex items-center gap-2 shadow-lg shadow-[rgba(253,186,45,0.2)]"><ClipboardCheck className="w-4 h-4" /> Go to Channel Audit</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayChannels.map((ch) => {
                    const mc = MOCK_CHANNELS.find((m) => m.id === ch.id);
                    const color = mc?.color ?? '#8B5CF6';
                    const status = mc?.status ?? ch.status;
                    const initials = mc?.initials ?? ch.title.slice(0, 2).toUpperCase();
                    const statusInfo = statusRing(status);
                    const name = ch.title || (ch as ClientChannel).name;
                    return (
                      <div key={ch.id} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: `${color}25`, border: `2px solid ${color}50`, color }}>
                              {ch.avatar ? <img src={ch.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2"><p className="text-sm font-semibold text-[#FFFFFF]">{name}</p><StatusRingDot status={status} /></div>
                              <p className="text-[11px] text-[#A3A3A3]">@{ch.handle} · {ch.niche}</p>
                            </div>
                          </div>
                          <HealthCircle score={ch.healthScore} size={44} strokeWidth={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">Subscribers</p><p className="text-xs font-semibold text-[#FFFFFF]">{fmtV(ch.subscriberCount)}</p></div>
                          <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center"><p className="text-[9px] text-[#666666]">Monthly Views</p><p className="text-xs font-semibold text-[#FFFFFF]">{fmtV(ch.monthlyViews)}</p></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border" style={{ backgroundColor: `${statusInfo.color}10`, color: statusInfo.color, borderColor: `${statusInfo.color}25` }}>{statusInfo.label}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setSelectedChannelId(ch.id); setActiveAgencyChannel(ch.id); }} className="text-[11px] text-[#8B5CF6] hover:text-[#B08ADF] font-medium flex items-center gap-0.5 transition-colors">View <ChevronRight className="w-3 h-3" /></button>
                            {agencyChannels.some((ac) => ac.id === ch.id) && (
                              <button onClick={(e) => { e.stopPropagation(); removeAgencyChannel(ch.id); showToast('Channel removed', 'success'); }} className="p-1 rounded hover:bg-[rgba(239,68,68,0.1)] transition-colors text-[#555555] hover:text-[#EF4444]"><Trash2 className="w-3 h-3" /></button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedChannel ? (
            /* ── Channel Detail View (7 sections) ── */
            <div className="space-y-5">
              {/* 1. Channel Header */}
              <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
                <div className="h-24 sm:h-28 bg-gradient-to-r from-[#0D0D0D] via-[#141414] to-[rgba(139,92,246,0.08)] relative">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(139,92,246,0.06) 50px, rgba(139,92,246,0.06) 51px)' }} />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)]"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /><span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">LIVE</span></div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.3)]"><span className="text-[10px] font-bold text-[#FDBA2D] uppercase tracking-wider">{userPlan}</span></div>
                </div>
                <div className="px-4 sm:px-6 pb-5 -mt-10 relative z-10">
                  <div className="flex items-end gap-4">
                    {selectedChannel.avatar ? (
                      <img src={selectedChannel.avatar} alt={selectedChannel.title} className="w-20 h-20 rounded-2xl object-cover border-4 border-[#141414] shadow-lg" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-2xl font-bold text-[#FFFFFF] border-4 border-[#141414] shadow-lg">{selectedChannel.title.charAt(0).toUpperCase()}</div>
                    )}
                    <div className="flex-1 min-w-0 pb-1">
                      <h1 className="text-lg sm:text-xl font-bold text-[#FFFFFF] truncate">{selectedChannel.title}</h1>
                      <p className="text-xs text-[#A3A3A3] truncate">@{selectedChannel.handle} · {selectedChannel.niche}</p>
                    </div>
                    <div className="flex gap-2 pb-1">
                      <button onClick={() => setSelectedChannelId(null)} className="px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-xs font-medium hover:text-[#FFFFFF] hover:border-[#2A2A2A] transition-colors flex items-center gap-1.5"><ChevronRight className="w-3 h-3 rotate-180" /> Back</button>
                      {agencyChannels.some((ac) => ac.id === selectedChannel.id) && (
                        <button onClick={() => { removeAgencyChannel(selectedChannel.id); setSelectedChannelId(null); setActiveAgencyChannel(null); showToast('Channel removed', 'success'); }} className="px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-xs font-medium hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Remove</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. KPI Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="col-span-2 lg:col-span-1 rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-semibold mb-2">Health Score</span>
                  <HealthRing score={selectedChannel.healthScore} size={80} />
                </div>
                <KPICard icon={Eye} label="Total Views" value={fmtV(selectedChannel.viewCount)} change="+12.4%" positive color="#FDBA2D" />
                <KPICard icon={Users} label="Subscribers" value={fmtV(selectedChannel.subscriberCount)} change="+8.2%" positive color="#10B981" />
                <KPICard icon={Video} label="Total Videos" value={fmtV(selectedChannel.videoCount)} change="+3" positive color="#3B82F6" />
                <KPICard icon={DollarSign} label="Monthly Revenue" value={`$${selectedChannel.monthlyRevenue.toLocaleString()}`} change="+15%" positive color="#8B5CF6" />
              </div>

              {/* 3. Growth Trends */}
              <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-[#FDBA2D]" /> Growth Trends</h3>
                  <div className="flex gap-1 p-0.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    {metricOptions.map((m) => (
                      <button key={m.key} onClick={() => setActiveMetric(m.key)} className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${activeMetric === m.key ? 'text-[#FFFFFF] shadow-sm' : 'text-[#555555] hover:text-[#A3A3A3]'}`} style={activeMetric === m.key ? { backgroundColor: `${m.color}20`, color: m.color } : undefined}>{m.label}</button>
                    ))}
                  </div>
                </div>
                <GrowthChart data={metricOptions.find((m) => m.key === activeMetric)!.data} color={metricOptions.find((m) => m.key === activeMetric)!.color} />
                <div className="flex justify-between mt-2 px-1"><span className="text-[10px] text-[#444444]">4 weeks ago</span><span className="text-[10px] text-[#444444]">This week</span></div>
              </div>

              {/* 4. AI Performance Analysis + 5. Audit Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2"><BrainCircuit className="w-3.5 h-3.5 text-[#FDBA2D]" /> AI Insights</h3>
                    {!aiInsights && <button onClick={handleGenerateInsights} disabled={aiLoading} className="px-3 py-1.5 rounded-md bg-[#FDBA2D] text-[#0D0D0D] text-[11px] font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 flex items-center gap-1.5">{aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Analyze</button>}
                    {aiInsights && <button onClick={() => setAiInsights(null)} className="px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-[11px] font-medium hover:text-[#FFFFFF] transition-colors flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Refresh</button>}
                  </div>
                  {aiLoading && <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-md bg-[#0D0D0D] animate-pulse" />)}</div>}
                  {!aiLoading && aiInsights && (
                    <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                      {aiInsights.map((insight, i) => {
                        const pColor = insight.priority === 'high' ? '#EF4444' : insight.priority === 'medium' ? '#FDBA2D' : '#10B981';
                        const PIcon = insight.priority === 'high' ? XCircle : insight.priority === 'medium' ? AlertTriangle : CheckCircle;
                        return (
                          <div key={i} className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                            <div className="flex items-center gap-2 mb-1.5"><PIcon className="w-3.5 h-3.5 shrink-0" style={{ color: pColor }} /><span className="text-xs font-bold text-[#FFFFFF]">{insight.title}</span><span className="text-[9px] font-bold uppercase tracking-wider ml-auto" style={{ color: pColor }}>{insight.priority}</span></div>
                            <p className="text-[11px] text-[#A3A3A3] leading-relaxed">{insight.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!aiLoading && !aiInsights && (
                    <div className="flex flex-col items-center py-8">
                      <div className="w-12 h-12 rounded-xl bg-[rgba(253,186,45,0.08)] flex items-center justify-center mb-3"><Lightbulb className="w-6 h-6 text-[#FDBA2D]" /></div>
                      <p className="text-xs text-[#A3A3A3] text-center max-w-[220px]">Click Analyze to generate personalized AI insights based on channel data.</p>
                    </div>
                  )}
                </div>
                <div className="space-y-5">
                  {/* Audit Categories */}
                  <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
                    <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4"><ClipboardCheck className="w-3.5 h-3.5 text-[#FDBA2D]" /> Audit Categories</h3>
                    <div className="space-y-3">
                      {(selectedChannel.auditCategories.length > 0 ? selectedChannel.auditCategories : [
                        { name: 'SEO', score: 72, icon: '🔍' }, { name: 'Content Quality', score: 68, icon: '📝' }, { name: 'Engagement', score: 58, icon: '💬' }, { name: 'Monetization', score: 74, icon: '💰' }, { name: 'Growth', score: 61, icon: '📈' },
                      ]).map((cat) => {
                        const color = healthColor(cat.score);
                        return (
                          <div key={cat.name}>
                            <div className="flex items-center justify-between mb-1"><span className="text-xs text-[#FFFFFF] flex items-center gap-2"><span>{cat.icon}</span> {cat.name}</span><span className="text-xs font-bold" style={{ color }}>{cat.score}/100</span></div>
                            <div className="h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.score}%`, backgroundColor: color }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Post Time Heatmap */}
                  <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
                    <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-3"><Clock className="w-3.5 h-3.5 text-[#FDBA2D]" /> Best Post Times</h3>
                    <div className="flex gap-1 mb-1"><div className="w-8" />{HOURS.map((h) => <div key={h} className="flex-1 text-center text-[9px] text-[#444444]">{h}</div>)}</div>
                    {heatmapData.map((row, di) => (
                      <div key={di} className="flex gap-1 mb-0.5"><div className="w-8 text-[9px] text-[#444444] flex items-center">{DAYS[di]}</div>{row.map((val, hi) => <div key={hi} className="flex-1"><HeatmapBlock value={val} /></div>)}</div>
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

              {/* 6. Command Center */}
              <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
                <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4"><Target className="w-3.5 h-3.5 text-[#FDBA2D]" /> Command Center</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">{quickTools.map((tool) => <ToolCard key={tool.toolId} {...tool} />)}</div>
              </div>

              {/* 7. Activity Feed */}
              <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
                <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-3"><Activity className="w-3.5 h-3.5 text-[#FDBA2D]" /> Recent Activity</h3>
                <div className="divide-y divide-[#1A1A1A]">
                  {[
                    { icon: ClipboardCheck, title: `Channel Audit — Score: ${selectedChannel.healthScore}/100`, time: selectedChannel.auditDate ? new Date(selectedChannel.auditDate).toLocaleDateString() : 'Pending', status: 'done' as const, color: '#FDBA2D' },
                    { icon: Zap, title: 'Viral Score Analysis — "Latest Upload"', time: '2 hours ago', status: 'done' as const, color: '#10B981' },
                    { icon: SearchCode, title: 'SEO Description Check — 3 videos optimized', time: '5 hours ago', status: 'done' as const, color: '#3B82F6' },
                    { icon: Clock, title: 'New Post Time Recommendation Available', time: '1 day ago', status: 'new' as const, color: '#FDBA2D' },
                    { icon: Target, title: 'HookLab Analysis — 5 scripts scored', time: '2 days ago', status: 'done' as const, color: '#8B5CF6' },
                    { icon: BarChart3, title: 'Monthly Performance Report — Ready', time: '3 days ago', status: 'done' as const, color: '#10B981' },
                  ].map((item, i) => <ActivityItem key={i} {...item} />)}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB: BULK CUSTOMIZE
          ═══════════════════════════════════════════ */}
      {activeTab === 'customize' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-1.5"><SlidersHorizontal className="w-4 h-4 text-[#8B5CF6]" /> Bulk Assistant Customization <span className="text-[10px] text-[#666666] font-normal ml-1">{selectedBulkIds.size} selected</span></h3>
          </div>

          {/* Channel Selector */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">Select Channels</span>
              <div className="flex gap-2">
                <button onClick={handleSelectAllChannels} className="text-[10px] text-[#8B5CF6] hover:text-[#B08ADF] font-medium transition-colors">{selectedBulkIds.size === agencyChannels.length ? 'Deselect All' : 'Select All'}</button>
              </div>
            </div>
            {agencyChannels.length === 0 ? (
              <p className="text-xs text-[#555555] text-center py-4">No channels in your agency yet. Run a Channel Audit to add channels.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                {agencyChannels.map((ch) => {
                  const isSelected = selectedBulkIds.has(ch.id);
                  return (
                    <button key={ch.id} onClick={() => setSelectedBulkIds((prev) => { const next = new Set(prev); isSelected ? next.delete(ch.id) : next.add(ch.id); return next; })} className="flex items-center gap-2 px-3 py-2 rounded-md border transition-colors" style={{ backgroundColor: isSelected ? 'rgba(139,92,246,0.08)' : '#0D0D0D', borderColor: isSelected ? 'rgba(139,92,246,0.3)' : '#1A1A1A' }}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-[#8B5CF6]' : 'bg-[#1A1A1A] border border-[#2A2A2A]'}`}>{isSelected && <Check className="w-3 h-3 text-white" />}</div>
                      <span className="text-xs font-medium truncate" style={{ color: isSelected ? '#8B5CF6' : '#A3A3A3' }}>{ch.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Configuration Form */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Brand Voice</label>
                <input value={bulkForm.brandVoice} onChange={(e) => setBulkForm((p) => ({ ...p, brandVoice: e.target.value }))} placeholder="e.g. Authoritative yet approachable" className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] text-[#FFFFFF] text-xs focus:outline-none focus:border-[#8B5CF6]/40 transition-all placeholder:text-[#555555]" />
              </div>
              <div>
                <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Tone</label>
                <select value={bulkForm.tone} onChange={(e) => setBulkForm((p) => ({ ...p, tone: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] text-[#FFFFFF] text-xs focus:outline-none focus:border-[#8B5CF6]/40 transition-all appearance-none">
                  {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Audience</label>
                <input value={bulkForm.audience} onChange={(e) => setBulkForm((p) => ({ ...p, audience: e.target.value }))} placeholder="e.g. Tech-savvy professionals 25-45" className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] text-[#FFFFFF] text-xs focus:outline-none focus:border-[#8B5CF6]/40 transition-all placeholder:text-[#555555]" />
              </div>
              <div>
                <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Language</label>
                <select value={bulkForm.language} onChange={(e) => setBulkForm((p) => ({ ...p, language: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] text-[#FFFFFF] text-xs focus:outline-none focus:border-[#8B5CF6]/40 transition-all appearance-none">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Goals</label>
              <TagInput tags={bulkForm.goals} onAdd={(tag) => setBulkForm((p) => ({ ...p, goals: [...p.goals, tag] }))} onRemove={(tag) => setBulkForm((p) => ({ ...p, goals: p.goals.filter((g) => g !== tag) }))} placeholder="Add a goal or pick from presets..." />
              <div className="flex flex-wrap gap-1 mt-2">{GOALS.filter((g) => !bulkForm.goals.includes(g)).map((g) => <button key={g} onClick={() => setBulkForm((p) => ({ ...p, goals: [...p.goals, g] }))} className="px-2 py-0.5 rounded-full text-[9px] text-[#555555] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#A3A3A3] transition-colors">{g}</button>)}</div>
            </div>
            <div>
              <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Content Types</label>
              <TagInput tags={bulkForm.contentTypes} onAdd={(tag) => setBulkForm((p) => ({ ...p, contentTypes: [...p.contentTypes, tag] }))} onRemove={(tag) => setBulkForm((p) => ({ ...p, contentTypes: p.contentTypes.filter((c) => c !== tag) }))} placeholder="Add content type..." />
              <div className="flex flex-wrap gap-1 mt-2">{CONTENT_TYPES.filter((c) => !bulkForm.contentTypes.includes(c)).map((c) => <button key={c} onClick={() => setBulkForm((p) => ({ ...p, contentTypes: [...p.contentTypes, c] }))} className="px-2 py-0.5 rounded-full text-[9px] text-[#555555] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#A3A3A3] transition-colors">{c}</button>)}</div>
            </div>
            <div>
              <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Keywords</label>
              <TagInput tags={bulkForm.keywords} onAdd={(tag) => setBulkForm((p) => ({ ...p, keywords: [...p.keywords, tag] }))} onRemove={(tag) => setBulkForm((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== tag) }))} placeholder="Add keyword..." />
            </div>
            <div>
              <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Custom Instructions</label>
              <textarea value={bulkForm.customInstructions} onChange={(e) => setBulkForm((p) => ({ ...p, customInstructions: e.target.value }))} placeholder="Any additional instructions for the AI assistant..." rows={3} className="w-full px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] text-[#FFFFFF] text-xs focus:outline-none focus:border-[#8B5CF6]/40 transition-all resize-none placeholder:text-[#555555]" />
            </div>
            <button onClick={handleBulkApply} disabled={selectedBulkIds.size === 0 || bulkApplying} className="w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-40" style={{ background: selectedBulkIds.size > 0 ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : '#2A2A2A', color: '#FFFFFF' }}>
              {bulkApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {bulkApplying ? 'Applying...' : `Apply to ${selectedBulkIds.size} Channel${selectedBulkIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB: SIGNAL QUEUE
          ═══════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════
          TAB: AI AGENTS
          ═══════════════════════════════════════════ */}
      {activeTab === 'agents' && (
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-1.5"><Bot className="w-4 h-4 text-[#8B5CF6]" /> AI Agent Management</h3>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 text-center">
              <p className="text-2xl font-bold text-[#FFFFFF]">{channelCount}</p>
              <p className="text-[10px] text-[#A3A3A3] mt-1">Total Channels</p>
            </div>
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 text-center">
              <p className="text-2xl font-bold text-[#10B981]">{agencyChannels.filter((c) => c.assistantConfig.goals.length > 0 || c.assistantConfig.brandVoice || c.assistantConfig.customInstructions).length}</p>
              <p className="text-[10px] text-[#A3A3A3] mt-1">Configured</p>
            </div>
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 text-center">
              <p className="text-2xl font-bold text-[#FDBA2D]">{agencyChannels.filter((c) => c.status === 'performing' || c.status === 'growth').length}</p>
              <p className="text-[10px] text-[#A3A3A3] mt-1">Active</p>
            </div>
          </div>

          {/* Channel Agent Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayChannels.map((ch) => {
              const isConfigured = ch.assistantConfig && (ch.assistantConfig.goals.length > 0 || ch.assistantConfig.brandVoice || ch.assistantConfig.customInstructions);
              const name = ch.title || (ch as ClientChannel).name;
              return (
                <div key={ch.id} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    {ch.avatar ? <img src={ch.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#1F1F1F]" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-sm font-bold text-white">{name.slice(0, 2).toUpperCase()}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#FFFFFF] truncate">{name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-[#10B981]' : 'bg-[#FDBA2D]'}`} />
                        <span className={`text-[10px] font-medium ${isConfigured ? 'text-[#10B981]' : 'text-[#FDBA2D]'}`}>{isConfigured ? 'Configured' : 'Not Configured'}</span>
                      </div>
                    </div>
                  </div>
                  {isConfigured && ch.assistantConfig && (
                    <div className="space-y-1.5 mb-3 px-3 py-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                      <div className="flex justify-between"><span className="text-[10px] text-[#555555]">Tone</span><span className="text-[10px] text-[#A3A3A3] font-medium">{ch.assistantConfig.tone || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-[10px] text-[#555555]">Goals</span><span className="text-[10px] text-[#A3A3A3] font-medium">{ch.assistantConfig.goals.length || 0}</span></div>
                      <div className="flex justify-between"><span className="text-[10px] text-[#555555]">Keywords</span><span className="text-[10px] text-[#A3A3A3] font-medium">{ch.assistantConfig.keywords.length || 0}</span></div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => { if (agencyChannels.some((ac) => ac.id === ch.id)) { setSelectedBulkIds(new Set([ch.id])); setActiveTab('customize'); } }} className="flex-1 px-2 py-1.5 rounded-md bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] text-[#8B5CF6] text-[10px] font-bold hover:bg-[rgba(139,92,246,0.2)] transition-colors flex items-center justify-center gap-1"><Settings2 className="w-3 h-3" /> Configure</button>
                    <button onClick={() => setActiveTool('audit')} className="flex-1 px-2 py-1.5 rounded-md bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] text-[#FDBA2D] text-[10px] font-bold hover:bg-[rgba(253,186,45,0.2)] transition-colors flex items-center justify-center gap-1"><ClipboardCheck className="w-3 h-3" /> Audit</button>
                    <button onClick={() => handleViewChannel(ch.id)} className="flex-1 px-2 py-1.5 rounded-md bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[#3B82F6] text-[10px] font-bold hover:bg-[rgba(59,130,246,0.2)] transition-colors flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> View</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-3">
            <button onClick={() => { setSelectedBulkIds(new Set(agencyChannels.map((c) => c.id))); setActiveTab('customize'); }} className="flex-1 px-4 py-2.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-bold hover:bg-[#7C3AED] transition-colors flex items-center justify-center gap-2"><Settings2 className="w-4 h-4" /> Configure All</button>
            <button onClick={() => setActiveTool('audit')} className="flex-1 px-4 py-2.5 rounded-lg bg-[#141414] border border-[#1F1F1F] text-[#A3A3A3] text-xs font-bold hover:text-[#FFFFFF] hover:border-[#2A2A2A] transition-colors flex items-center justify-center gap-2"><ClipboardCheck className="w-4 h-4" /> Run Bulk Audit</button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB: WAR ROOM
          ═══════════════════════════════════════════ */}
      {activeTab === 'war-room' && (
        <div className="space-y-4">
          {/* Tactical Briefing */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A]"><h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><Radar className="w-3.5 h-3.5 text-[#FDBA2D]" /> Tactical Briefing</h3></div>
            <div className="p-5">
              <p className="text-xs text-[#A3A3A3] mb-4">Generate a comprehensive tactical intelligence briefing for your entire fleet.</p>
              {!briefingLoading && !briefingComplete && (
                <button onClick={handleGenerateBriefing} className="px-5 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 hover:opacity-90" style={{ background: 'linear-gradient(135deg, #FDBA2D, #E09100)', color: '#1A1A1A' }}><Radar className="w-4 h-4" /> Generate Tactical Briefing</button>
              )}
              {briefingLoading && (
                <div className="flex flex-col items-center py-8">
                  <div className="relative mb-6"><style>{`@keyframes tactical-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes tactical-glow{0%,100%{opacity:0.4}50%{opacity:1}}.tactical-ring{animation:tactical-spin 2s linear infinite}.tactical-glow{animation:tactical-glow 1.5s ease-in-out infinite}`}</style>
                    <div className="tactical-ring" style={{ width: 80, height: 80 }}><svg width="80" height="80" viewBox="0 0 80 80"><defs><linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FDBA2D" /><stop offset="100%" stopColor="#E09100" /></linearGradient></defs><circle cx="40" cy="40" r="34" fill="none" stroke="url(#ring-gradient)" strokeWidth="3" strokeDasharray="160 54" strokeLinecap="round" className="tactical-glow" /></svg></div>
                    <div className="absolute inset-0 flex items-center justify-center"><Radar className="w-6 h-6 text-[#FDBA2D] tactical-glow" /></div>
                  </div>
                  <p className="text-sm font-semibold text-[#FDBA2D] mb-4 text-center">{BRIEFING_MESSAGES[briefingStep]}</p>
                  <div className="w-64"><div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden"><div className="h-full rounded-full transition-all duration-100 ease-linear" style={{ width: `${briefingProgress}%`, background: 'linear-gradient(90deg, #FDBA2D, #E09100)' }} /></div><span className="text-xs font-bold text-[#FDBA2D] block text-center mt-2">{briefingProgress}%</span></div>
                </div>
              )}
              {briefingComplete && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-14 h-14 rounded-full bg-[rgba(16,185,129,0.1)] border-2 border-[#10B981] flex items-center justify-center mb-4"><CheckCircle2 className="w-7 h-7 text-[#10B981]" /></div>
                  <h4 className="text-base font-bold text-[#FFFFFF] mb-1">Tactical Brief Generated</h4>
                  <p className="text-xs text-[#A3A3A3] mb-4">Your intelligence briefing is ready for review.</p>
                  <div className="flex items-center gap-3">
                    <button onClick={handleDownloadReport} className="px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #FDBA2D, #E09100)', color: '#1A1A1A' }}><Download className="w-4 h-4" /> Download Report</button>
                    <button onClick={() => setBriefingComplete(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0D0D0D] border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#FFFFFF] hover:border-[#2A2A2A] transition-all flex items-center gap-2"><Radar className="w-3.5 h-3.5" /> New Briefing</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Intelligence Link Generator */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A]"><h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-[#8B5CF6]" /> Shareable Intelligence Links</h3></div>
            <div className="p-5">
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Select Channel</label>
                  <select value={activeAgencyChannelId || ''} onChange={(e) => setActiveAgencyChannel(e.target.value || null)} className="w-full px-3 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] text-[#FFFFFF] text-sm focus:outline-none focus:border-[#8B5CF6]/40 transition-all appearance-none">
                    <option value="">All Channels</option>
                    {displayChannels.map((ch) => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
                  </select>
                </div>
                <button onClick={handleGenerateWarLink} className="px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2" style={{ background: '#8B5CF6' }}><Globe className="w-4 h-4" /> Generate Link</button>
              </div>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {warRoomLinks.map((link) => (
                <div key={link.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <div className="flex-1 min-w-0"><p className="text-sm text-[#FFFFFF] font-medium truncate">{link.label}</p><div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-[#A3A3A3]">{link.client}</span><span className="text-[10px] text-[#444444]">·</span><span className="text-[10px] text-[#666666]">{timeAgo(link.created)}</span></div></div>
                  <div className="flex items-center gap-2 flex-shrink-0"><code className="text-[10px] text-[#666666] max-w-[200px] truncate hidden sm:block">{link.url}</code><button onClick={() => handleCopyLink(link.url)} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#666666] hover:text-[#FFFFFF]" title="Copy link">{copiedLink ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}</button></div>
                </div>
              ))}
            </div>
          </div>

          {/* Gap Analysis + Resource Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A1A]"><h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-[#FDBA2D]" /> Gap Analysis</h3></div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-[#A3A3A3]">AI-powered gap analysis identifies under-served niches and potential client targets.</p>
                <button className="px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #FDBA2D, #E09100)' }}><Cpu className="w-4 h-4" /> Generate Report</button>
                <div className="grid grid-cols-3 gap-3">{[{ label: 'Identified Gaps', value: '12', color: '#FDBA2D' }, { label: 'Potential Clients', value: '28', color: '#3B82F6' }, { label: 'Revenue Potential', value: '$84K/mo', color: '#10B981' }].map((stat) => (<div key={stat.label} className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-center"><p className="text-[10px] text-[#666666]">{stat.label}</p><p className="text-lg font-bold mt-0.5" style={{ color: stat.color }}>{stat.value}</p></div>))}</div>
              </div>
            </div>
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A1A]"><h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-[#FDBA2D]" /> Resource Allocation</h3></div>
              <div className="p-5">
                <div className="flex gap-1.5 h-20 mb-3">{[{ name: 'TV', scans: 34, color: '#10B981' }, { name: 'FA', scans: 28, color: '#10B981' }, { name: 'AS', scans: 22, color: '#FDBA2D' }, { name: 'CD', scans: 10, color: '#FDBA2D' }, { name: 'EM', scans: 6, color: '#A3A3A3' }].map((d) => (<div key={d.name} className="rounded-md flex items-center justify-center transition-all hover:opacity-80 cursor-default" style={{ flex: d.scans, backgroundColor: `${d.color}18`, border: `1px solid ${d.color}35`, minWidth: 40 }}><span className="text-[10px] font-bold" style={{ color: d.color }}>{d.name}</span></div>))}</div>
                <div className="space-y-3">{[{ name: 'Sarah K.', allocation: 92, color: '#3B82F6' }, { name: 'Mike R.', allocation: 78, color: '#10B981' }, { name: 'Alex T.', allocation: 65, color: '#8B5CF6' }].map((m) => (<div key={m.name} className="flex items-center gap-3"><div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ backgroundColor: `${m.color}20`, border: `1.5px solid ${m.color}40`, color: m.color }}>{m.name.split(' ').map((n: string) => n[0]).join('')}</div><div className="flex-1 min-w-0"><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-[#FFFFFF]">{m.name}</span><span className="text-[10px] font-bold" style={{ color: m.color }}>{m.allocation}%</span></div><div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${m.allocation}%`, backgroundColor: m.color }} /></div></div></div>))}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB: REPORTS
          ═══════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Reports */}
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between"><h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#8B5CF6]" /> Recent Reports</h3><span className="text-[10px] text-[#666666]">{MOCK_REPORTS.length} reports</span></div>
              <div className="divide-y divide-[#1A1A1A]">
                {MOCK_REPORTS.map((r) => {
                  const badge = reportTypeBadge(r.type);
                  return (
                    <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <div className="flex-1 min-w-0"><p className="text-sm text-[#FFFFFF] font-medium truncate">{r.name}</p><div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-[#A3A3A3]">{r.client}</span><span className="text-[10px] text-[#444444]">·</span><span className="text-[10px] text-[#666666]">{timeAgo(r.date)}</span></div></div>
                      <div className="flex items-center gap-2 flex-shrink-0"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${badge.bg} ${badge.text} ${badge.border}`}>{badge.icon} {r.type}</span><button className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#666666] hover:text-[#FFFFFF]" title="Download"><Download className="w-3.5 h-3.5" /></button></div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Team Activity */}
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between"><h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-[#10B981]" /> Team Activity</h3><span className="text-[10px] text-[#666666]">Recent</span></div>
              <div className="divide-y divide-[#1A1A1A] max-h-80 overflow-y-auto">
                {MOCK_ACTIVITY.map((a) => (
                  <div key={a.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: `${a.color}20`, border: `1.5px solid ${a.color}40`, color: a.color }}>{a.initials}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm text-[#FFFFFF]"><span className="font-medium">{a.user}</span> <span className="text-[#A3A3A3]">{a.action}</span> <span className="text-[#3B82F6] font-medium">{a.target}</span></p><p className="text-[10px] text-[#666666] mt-0.5">{timeAgo(a.time)}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => setActiveTool('audit')} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#141414] border border-[#1F1F1F] hover:border-[#10B981]/30 hover:bg-[rgba(16,185,129,0.03)] transition-all group text-left"><div className="p-2 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]"><UserPlus className="w-4 h-4 text-[#10B981]" /></div><div className="flex-1"><p className="text-sm font-medium text-[#FFFFFF] group-hover:text-[#10B981] transition-colors">Add New Client</p><p className="text-[10px] text-[#666666]">Onboard a new channel</p></div></button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#141414] border border-[#1F1F1F] hover:border-[#3B82F6]/30 hover:bg-[rgba(59,130,246,0.03)] transition-all group text-left"><div className="p-2 rounded-lg bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)]"><FileBarChart className="w-4 h-4 text-[#3B82F6]" /></div><div className="flex-1"><p className="text-sm font-medium text-[#FFFFFF] group-hover:text-[#3B82F6] transition-colors">Generate Bulk Report</p><p className="text-[10px] text-[#666666]">All channels at once</p></div></button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#141414] border border-[#1F1F1F] hover:border-[#FDBA2D]/30 hover:bg-[rgba(253,186,45,0.03)] transition-all group text-left"><div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)]"><FolderOutput className="w-4 h-4 text-[#FDBA2D]" /></div><div className="flex-1"><p className="text-sm font-medium text-[#FFFFFF] group-hover:text-[#FDBA2D] transition-colors">Export Fleet Data</p><p className="text-[10px] text-[#666666]">CSV / PDF export</p></div></button>
          </div>
          {/* What-If Projection */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2"><SlidersHorizontal className="w-3.5 h-3.5 text-[#8B5CF6]" /><h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">What-If Projection</h3></div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4"><span className="text-xs text-[#A3A3A3]">If views increase by</span><input type="range" min={5} max={100} value={whatIfPercent} onChange={(e) => setWhatIfPercent(Number(e.target.value))} className="flex-1 accent-[#8B5CF6]" /><span className="text-sm font-bold text-[#FDBA2D] w-12 text-right">{whatIfPercent}%</span></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-center"><p className="text-[10px] text-[#666666]">Projected Views</p><p className="text-lg font-bold text-[#FFFFFF] mt-1">{fmtV(totalMonthlyViews * (1 + whatIfPercent / 100))}</p></div>
                <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-center"><p className="text-[10px] text-[#666666]">Projected Revenue</p><p className="text-lg font-bold text-[#10B981] mt-1">${Math.round(totalMonthlyRevenue * (1 + whatIfPercent / 100)).toLocaleString()}</p></div>
                <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-center"><p className="text-[10px] text-[#666666]">CPM Estimate</p><p className="text-lg font-bold text-[#FDBA2D] mt-1">${(totalMonthlyRevenue / totalMonthlyViews * 1000 * (1 + whatIfPercent / 200)).toFixed(2)}</p></div>
              </div>
            </div>
          </div>
          {/* Command Bar */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <div className="flex gap-2">
              <div className="relative flex-1"><Command className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" /><input value={commandInput} onChange={(e) => setCommandInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCommand()} placeholder="/compare <ClientA> <ClientB> or /report-all" className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] text-[#FFFFFF] text-xs focus:outline-none focus:border-[#8B5CF6]/40 transition-all placeholder:text-[#555555]" /></div>
              <button onClick={handleCommand} disabled={!commandInput.trim()} className="px-4 py-2.5 rounded-lg text-white text-xs font-medium transition-all flex items-center gap-2" style={{ background: commandInput.trim() ? '#8B5CF6' : '#2A2A2A' }}><Send className="w-3.5 h-3.5" /> Run</button>
            </div>
            {commandOutput && <div className="mt-3 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs text-[#A3A3A3] whitespace-pre-wrap leading-relaxed">{commandOutput}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
