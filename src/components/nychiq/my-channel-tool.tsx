'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { fmtV } from '@/lib/utils';
import {
  MonitorPlay,
  Users,
  Eye,
  Video,
  TrendingUp,
  Zap,
  Clock,
  Anchor,
  SearchCode,
  ClipboardCheck,
  Crosshair,
  Flame,
  GitCompare,
  ArrowRight,
  RefreshCw,
  Link2,
  Unlink,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Activity,
  BarChart3,
  Target,
  Lightbulb,
  BrainCircuit,
} from 'lucide-react';

/* ── Constants ── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];

/* ── Health color helper ── */
function healthColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#FDBA2D';
  if (score >= 40) return '#3B82F6';
  return '#EF4444';
}

/* ── Health Gauge (compact) ── */
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

/* ── Growth Chart (SVG sparkline) ── */
function GrowthChart({ data, color = '#FDBA2D' }: { data: number[]; color?: string }) {
  const w = 280;
  const h = 80;
  const pad = 4;
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

/* ── Heatmap (Post Time style) ── */
function HeatmapBlock({ value }: { value: number }) {
  const bg = value >= 80 ? 'bg-[#10B981]/70' : value >= 60 ? 'bg-[#10B981]/40' : value >= 40 ? 'bg-[#FDBA2D]/40' : value >= 20 ? 'bg-[#3B82F6]/30' : 'bg-[#1A1A1A]';
  return <div className={`h-5 rounded-sm ${bg} transition-colors`} title={`${value}%`} />;
}

/* ── Quick-launch tool card ── */
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
        <ArrowRight className="w-3.5 h-3.5 text-[#444444] group-hover:text-[#FDBA2D] transition-colors opacity-0 group-hover:opacity-100" />
      </div>
    </button>
  );
}

/* ── Activity feed item ── */
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
      <ChevronRight className="w-3.5 h-3.5 text-[#333333] group-hover:text-[#A3A3A3] transition-colors shrink-0" />
    </div>
  );
}

/* ── Unlinked state ── */
function UnlinkedView() {
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
      <div className="w-20 h-20 rounded-2xl bg-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.15)] flex items-center justify-center mb-6">
        <MonitorPlay className="w-10 h-10 text-[#FDBA2D]" />
      </div>
      <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">No Channel Linked</h2>
      <p className="text-sm text-[#A3A3A3] max-w-md text-center leading-relaxed mb-6">
        Run a free Channel Audit to automatically link your YouTube channel. Your channel data, profile picture, and health score will be saved and displayed here.
      </p>
      <button onClick={() => setActiveTool('audit')}
        className="px-6 py-3 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors flex items-center gap-2 shadow-lg shadow-[rgba(253,186,45,0.2)]">
        <ClipboardCheck className="w-4 h-4" />
        Go to Channel Audit
      </button>
      <p className="text-[11px] text-[#444444] mt-4">Cost: {TOKEN_COSTS.audit} tokens per audit</p>
    </div>
  );
}

/* ── Main component ── */
export function MyChannelTool() {
  const pc = useNychIQStore((s) => s.personalChannel);
  const userName = useNychIQStore((s) => s.userName);
  const userPlan = useNychIQStore((s) => s.userPlan);
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  const clearPersonalChannel = useNychIQStore((s) => s.clearPersonalChannel);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
  }> | null>(null);
  const [activeMetric, setActiveMetric] = useState<'views' | 'engagement' | 'watchtime' | 'subs'>('views');

  /* Stabilize mock data with useMemo */
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

  const auditCategories = pc.auditCategories.length > 0 ? pc.auditCategories : [
    { name: 'SEO', score: 72, icon: '🔍' },
    { name: 'Content Quality', score: 68, icon: '📝' },
    { name: 'Engagement', score: 58, icon: '💬' },
    { name: 'Monetization', score: 74, icon: '💰' },
    { name: 'Growth', score: 61, icon: '📈' },
  ];

  const activityFeed = useMemo(() => [
    { icon: ClipboardCheck, title: `Channel Audit — Score: ${pc.healthScore || 0}/100`, time: pc.auditDate ? new Date(pc.auditDate).toLocaleDateString() : 'Pending', status: 'done' as const, color: '#FDBA2D' },
    { icon: Zap, title: 'Viral Score Analysis — "Latest Upload"', time: '2 hours ago', status: 'done' as const, color: '#10B981' },
    { icon: SearchCode, title: 'SEO Description Check — 3 videos optimized', time: '5 hours ago', status: 'done' as const, color: '#3B82F6' },
    { icon: Clock, title: 'New Post Time Recommendation Available', time: '1 day ago', status: 'new' as const, color: '#FDBA2D' },
    { icon: Target, title: 'HookLab Analysis — 5 scripts scored', time: '2 days ago', status: 'done' as const, color: '#8B5CF6' },
    { icon: BarChart3, title: 'Monthly Performance Report — Ready', time: '3 days ago', status: 'done' as const, color: '#10B981' },
  ], [pc.healthScore, pc.auditDate]);

  const metricOptions = [
    { key: 'views' as const, label: 'Views', color: '#FDBA2D', data: growthData.views },
    { key: 'engagement' as const, label: 'Engagement %', color: '#10B981', data: growthData.engagement },
    { key: 'watchtime' as const, label: 'Watch Time (min)', color: '#3B82F6', data: growthData.watchtime },
    { key: 'subs' as const, label: 'New Subs/week', color: '#8B5CF6', data: growthData.subs },
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

  /* Generate AI insights */
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

  /* If no channel linked yet */
  if (!pc.linked) return <UnlinkedView />;

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ═══════ 1. CHANNEL HEADER ═══════ */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        {/* Banner gradient */}
        <div className="h-24 sm:h-28 bg-gradient-to-r from-[#0D0D0D] via-[#141414] to-[rgba(253,186,45,0.08)] relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(253,186,45,0.06) 50px, rgba(253,186,45,0.06) 51px)' }} />
          {/* Live indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">LIVE</span>
          </div>
          {/* Plan badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.3)]">
            <span className="text-[10px] font-bold text-[#FDBA2D] uppercase tracking-wider">{userPlan}</span>
          </div>
        </div>
        {/* Profile row */}
        <div className="px-4 sm:px-6 pb-5 -mt-10 relative z-10">
          <div className="flex items-end gap-4">
            {pc.avatar ? (
              <img src={pc.avatar} alt={pc.title} className="w-20 h-20 rounded-2xl object-cover border-4 border-[#141414] shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FDBA2D] to-[#C69320] flex items-center justify-center text-2xl font-bold text-[#0D0D0D] border-4 border-[#141414] shadow-lg">
                {pc.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-[10px] text-[#FDBA2D] font-semibold uppercase tracking-wider mb-0.5">Welcome back, {userName || 'Creator'}</p>
              <h1 className="text-lg sm:text-xl font-bold text-[#FFFFFF] truncate">{pc.title}</h1>
              <p className="text-xs text-[#A3A3A3] truncate">@{pc.handle}</p>
            </div>
            <div className="flex gap-2 pb-1">
              <button onClick={() => setActiveTool('audit')}
                className="px-3 py-1.5 rounded-md bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.3)] text-[#FDBA2D] text-xs font-bold hover:bg-[rgba(253,186,45,0.2)] transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Re-audit
              </button>
              <button onClick={clearPersonalChannel}
                className="px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-xs font-medium hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors flex items-center gap-1.5">
                <Unlink className="w-3 h-3" /> Unlink
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 2. KPI OVERVIEW ═══════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Health Score — spans 2 cols on large */}
        <div className="col-span-2 lg:col-span-1 rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 flex flex-col items-center justify-center">
          <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-semibold mb-2">Health Score</span>
          <HealthRing score={pc.healthScore} size={80} />
        </div>
        {/* Metric cards */}
        <KPICard icon={Eye} label="Total Views" value={fmtV(pc.viewCount)} change="+12.4%" positive color="#FDBA2D" />
        <KPICard icon={Users} label="Subscribers" value={fmtV(pc.subscriberCount)} change="+8.2%" positive color="#10B981" />
        <KPICard icon={Video} label="Total Videos" value={fmtV(pc.videoCount)} change="+3" positive color="#3B82F6" />
        <KPICard icon={Zap} label="Avg Viral Score" value={pc.healthScore > 0 ? `${Math.round(pc.healthScore * 0.85)}/100` : 'N/A'} change={pc.healthScore > 60 ? 'Strong' : 'Growing'} positive={pc.healthScore > 60} color="#8B5CF6" />
      </div>

      {/* ═══════ 3. GROWTH TREND ═══════ */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#FDBA2D]" /> Growth Trends
          </h3>
          <div className="flex gap-1 p-0.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
            {metricOptions.map((m) => (
              <button key={m.key} onClick={() => setActiveMetric(m.key)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  activeMetric === m.key ? 'text-[#FFFFFF] shadow-sm' : 'text-[#555555] hover:text-[#A3A3A3]'
                }`}
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

      {/* ═══════ TWO-COLUMN: AI Insights + Categories ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ═══════ 4. AI-DRIVEN PERFORMANCE ANALYSIS ═══════ */}
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-[#FDBA2D]" /> AI Insights
            </h3>
            {!aiInsights && (
              <button onClick={handleGenerateInsights} disabled={aiLoading}
                className="px-3 py-1.5 rounded-md bg-[#FDBA2D] text-[#0D0D0D] text-[11px] font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Analyze
              </button>
            )}
            {aiInsights && (
              <button onClick={() => { setAiInsights(null); }}
                className="px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-[11px] font-medium hover:text-[#FFFFFF] transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            )}
          </div>

          {aiLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-md bg-[#0D0D0D] animate-pulse" />
              ))}
            </div>
          )}

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
                      <span className="text-[9px] font-bold uppercase tracking-wider ml-auto" style={{ color: pColor }}>
                        {insight.priority}
                      </span>
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
              <p className="text-xs text-[#A3A3A3] text-center max-w-[220px]">Click Analyze to generate personalized AI insights based on your channel data.</p>
            </div>
          )}
        </div>

        {/* Category Scores + Post Time Heatmap */}
        <div className="space-y-5">
          {/* Audit Categories */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-3.5 h-3.5 text-[#FDBA2D]" /> Audit Categories
            </h3>
            <div className="space-y-3">
              {auditCategories.map((cat) => {
                const color = healthColor(cat.score);
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
            {pc.auditDate > 0 && (
              <p className="text-[10px] text-[#444444] mt-3">
                Last audit: {new Date(pc.auditDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* ═══════ 5. Personalized Post Time Heatmap ═══════ */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
            <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#FDBA2D]" /> Best Post Times (Personalized)
            </h3>
            <div className="flex gap-1 mb-1">
              <div className="w-8" />
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-[#444444]">{h}</div>
              ))}
            </div>
            {heatmapData.map((row, di) => (
              <div key={di} className="flex gap-1 mb-0.5">
                <div className="w-8 text-[9px] text-[#444444] flex items-center">{DAYS[di]}</div>
                {row.map((val, hi) => (
                  <div key={hi} className="flex-1"><HeatmapBlock value={val} /></div>
                ))}
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

      {/* ═══════ 6. COMMAND CENTER / QUICK ACCESS ═══════ */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
        <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-4">
          <Target className="w-3.5 h-3.5 text-[#FDBA2D]" /> Command Center
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {quickTools.map((tool) => (
            <ToolCard key={tool.toolId} {...tool} />
          ))}
        </div>
      </div>

      {/* ═══════ 7. ACTIVITY FEED ═══════ */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5">
        <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-[#FDBA2D]" /> Recent Activity
        </h3>
        <div className="divide-y divide-[#1A1A1A]">
          {activityFeed.map((item, i) => (
            <ActivityItem key={i} {...item} />
          ))}
        </div>
      </div>

    </div>
  );
}

/* ── KPI Card ── */
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
