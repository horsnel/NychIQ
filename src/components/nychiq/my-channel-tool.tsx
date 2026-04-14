'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNychIQStore, TOKEN_COSTS, type NychIQState } from '@/lib/store';
import { cn, fmtV, timeAgo, thumbUrl, copyToClipboard, vidDuration } from '@/lib/utils';
import { ytFetch } from '@/lib/api';
import { askAI } from '@/lib/api';
import {
  MonitorPlay, Users, Eye, Video, TrendingUp, Zap, Clock, Anchor, SearchCode,
  ClipboardCheck, Crosshair, Flame, GitCompare, ArrowRight, RefreshCw, Link2,
  Unlink, Loader2, Sparkles, AlertTriangle, CheckCircle, XCircle, ChevronRight,
  Activity, BarChart3, Target, Lightbulb, BrainCircuit, Settings2, Tag, Rocket,
  Lock, Tv, UserCircle, Copy, Check, DollarSign, ShieldCheck, HelpCircle, SlidersHorizontal,
  Briefcase, ChevronDown, Heart, Flag, Calendar, Play
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type ChannelTab = 'overview' | 'videos' | 'shorts' | 'revenue' | 'audience';

/* ═══════════════════════════════════════════════════════════════
   HELPER: health / score color
   ═══════════════════════════════════════════════════════════════ */
function scoreColor(v: number): string {
  if (v >= 80) return '#22c55e';
  if (v >= 60) return '#FDBA2D';
  if (v >= 40) return '#888888';
  return '#666666';
}

function scoreBadgeBg(v: number): string {
  if (v >= 80) return 'rgba(34,197,94,0.1)';
  if (v >= 60) return 'rgba(253,186,45,0.15)';
  return 'rgba(255,255,255,0.03)';
}

/* ═══════════════════════════════════════════════════════════════
   CHANNEL ASSISTANT CONFIG SHAPE
   ═══════════════════════════════════════════════════════════════ */
interface ChannelAssistantConfig {
  channelUrl: string;
  channelName: string;
  niche: string;
  subNiche: string;
  brandVoice: string;
  tone: string;
  audience: string;
  language: string;
  goals: string[];
  customInstructions: string;
  contentTypes: string[];
  competitors: string[];
  keywords: string[];
}

/* ═══════════════════════════════════════════════════════════════
   STATE 1: UNLINKED
   ═══════════════════════════════════════════════════════════════ */
function UnlinkedView() {
  const setActiveTool = useNychIQStore(s => s.setActiveTool);
  return (
    <div className="flex flex-col items-center justify-center py-32 animate-fade-in-up">
      <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-8"
        style={{ background: 'rgba(253,186,45,0.08)', border: '1px solid rgba(253,186,45,0.15)' }}>
        <MonitorPlay size={44} color="#FDBA2D" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>No Channel Linked</h2>
      <p className="text-sm max-w-md text-center leading-relaxed mb-8" style={{ color: '#a0a0a0' }}>
        Run a free Channel Audit to automatically link your YouTube channel.
        Your channel data, profile picture, and health score will be saved and displayed here.
      </p>
      <button onClick={() => setActiveTool('audit')}
        className="px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 hover:scale-105"
        style={{ background: '#FDBA2D', color: '#0a0a0a', boxShadow: '0 8px 32px rgba(253,186,45,0.25)' }}>
        <ClipboardCheck size={18} />
        Go to Channel Audit
      </button>
      <p className="text-xs mt-4" style={{ color: '#666666' }}>Cost: {TOKEN_COSTS.audit} tokens per audit</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATE 2: LITE (config exists but not audited)
   ═══════════════════════════════════════════════════════════════ */
function ChannelLiteView({ config }: { config: ChannelAssistantConfig }) {
  const userName = useNychIQStore(s => s.userName);
  const userPlan = useNychIQStore(s => s.userPlan);
  const setActiveTool = useNychIQStore(s => s.setActiveTool);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<Array<{
    priority: 'high' | 'medium' | 'low'; title: string; description: string;
  }> | null>(null);

  const simulatedGrowth = useMemo(() => [
    120, 180, 150, 220, 310, 280, 420, 380, 510, 470, 620, 580, 710,
  ], []);

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

  const handleAnalyze = useCallback(() => {
    setAiLoading(true);
    setTimeout(() => {
      setAiInsights([
        { priority: 'high', title: 'Run Channel Audit First', description: `Your channel "${config.channelName}" is configured but not yet audited. Running a channel audit will provide real analytics, a verified health score, and unlock personalized AI recommendations.` },
        { priority: 'medium', title: 'Niche Positioning Detected', description: `Your niche "${config.niche}${config.subNiche ? ' → ' + config.subNiche : ''}" has strong growth potential. Top creators in this space are posting 3x per week with average watch times above 6 minutes.` },
        { priority: 'medium', title: 'Content Strategy Alignment', description: `Your selected content types (${config.contentTypes.slice(0, 3).join(', ')}) align with trending formats. Consider diversifying with Shorts for algorithmic reach.` },
      ]);
      setAiLoading(false);
    }, 2000);
  }, [config]);

  /* ── SVG growth chart ── */
  function renderGrowthChart() {
    const W = 600, H = 120, PAD = 40;
    const max = Math.max(...simulatedGrowth, 1);
    const min = Math.min(...simulatedGrowth, 0);
    const range = max - min || 1;
    const pts = simulatedGrowth.map((v, i) => {
      const x = PAD + (i / (simulatedGrowth.length - 1)) * (W - PAD * 2);
      const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
      return { x, y };
    });
    const lineStr = pts.map(p => `${p.x},${p.y}`).join(' ');
    const areaStr = `${PAD},${H - PAD} ${lineStr} ${W - PAD},${H - PAD}`;
    const fmtAxis = (n: number) => n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lite-growth-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#888888" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#888888" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = PAD + (1 - pct) * (H - PAD * 2);
          return <line key={pct} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="rgba(255,255,255,0.05)" />;
        })}
        <text x={PAD - 6} y={PAD} textAnchor="end" fill="#666666" fontSize="10">{fmtAxis(max)}</text>
        <text x={PAD - 6} y={H - PAD + 4} textAnchor="end" fill="#666666" fontSize="10">0</text>
        <polygon points={areaStr} fill="url(#lite-growth-fill)" />
        <polyline points={lineStr} fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#888888" />)}
      </svg>
    );
  }

  /* ── Heatmap block ── */
  function renderHeatmap() {
    return (
      <div>
        <div className="flex gap-1 mb-1">
          <div style={{ width: 32 }} />
          {HOURS_LABELS.map(h => (
            <div key={h} className="flex-1 text-center" style={{ fontSize: 9, color: '#666666' }}>{h}</div>
          ))}
        </div>
        {heatmapData.map((row, di) => (
          <div key={di} className="flex gap-1 mb-0.5">
            <div className="flex items-center" style={{ width: 32, fontSize: 9, color: '#666666' }}>{DAY_LABELS[di]}</div>
            {row.map((val, hi) => {
              const bg = val >= 80 ? 'rgba(34,197,94,0.1)' : val >= 60 ? 'rgba(34,197,94,0.1)' : val >= 40 ? 'rgba(253,186,45,0.35)' : val >= 20 ? 'rgba(255,255,255,0.03)' : '#1A1A1A';
              return <div key={hi} className="flex-1 h-5 rounded-sm transition-colors" style={{ background: bg }} title={`${val}%`} />;
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* CTA BANNER */}
      <div className="overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(253,186,45,0.12) 0%, rgba(13,13,13,0.95) 60%)', border: '1px solid rgba(253,186,45,0.25)', borderRadius: 16, padding: '20px 24px' }}>
        <div className="absolute inset-0" style={{ opacity: 0.1, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(253,186,45,0.05) 40px, rgba(253,186,45,0.05) 41px)' }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Rocket size={16} color="#FDBA2D" />
              <span className="text-sm font-bold" style={{ color: '#FDBA2D' }}>Unlock Full Channel Analytics</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#a0a0a0' }}>
              Your channel &quot;{config.channelName}&quot; is configured. Run a Channel Audit to link your YouTube data, get a real health score, and unlock personalized insights.
            </p>
          </div>
          <button onClick={() => setActiveTool('audit')}
            className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 hover:scale-105"
            style={{ background: '#FDBA2D', color: '#0a0a0a', boxShadow: '0 4px 16px rgba(253,186,45,0.2)' }}>
            <ClipboardCheck size={16} />
            Run Channel Audit
          </button>
        </div>
      </div>

      {/* CHANNEL IDENTITY */}
      <div className="mt-6 overflow-hidden" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div className="relative" style={{ height: 120, background: 'linear-gradient(to right, #0a0a0a, #0f0f0f, rgba(253,186,45,0.08))' }}>
          <div className="absolute inset-0" style={{ opacity: 0.2, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(253,186,45,0.06) 50px, rgba(253,186,45,0.06) 51px)' }} />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.3)' }}>
            <Settings2 size={12} color="#FDBA2D" />
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: 10, color: '#FDBA2D' }}>Preview Mode</span>
          </div>
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full" style={{ background: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.3)' }}>
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: 10, color: '#FDBA2D' }}>{userPlan}</span>
          </div>
        </div>
        <div className="px-6 pb-5 -mt-10 relative z-10">
          <div className="flex items-end gap-4">
            <div className="rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #FDBA2D, #C69320)', color: '#0a0a0a', border: '3px solid #0f0f0f', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
              {config.channelName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="font-semibold uppercase tracking-wider mb-0.5" style={{ fontSize: 10, color: '#FDBA2D' }}>
                Welcome back, {userName || 'Creator'}
              </p>
              <h1 className="text-xl font-bold truncate" style={{ color: '#FFFFFF' }}>{config.channelName}</h1>
              <p className="text-xs truncate" style={{ color: '#a0a0a0' }}>
                {config.niche}{config.subNiche ? ` → ${config.subNiche}` : ''}
              </p>
            </div>
            <button onClick={() => setActiveTool('channel-assistant')}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              style={{ background: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.3)', color: '#FDBA2D' }}>
              <Settings2 size={12} /> Edit Config
            </button>
          </div>
        </div>
      </div>

      {/* CONFIG INFO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        {[
          { icon: Crosshair, label: 'Niche', value: config.niche, sub: config.subNiche, color: '#FDBA2D' },
          { icon: Video, label: 'Content Types', tags: config.contentTypes, color: '#888888' },
          { icon: Target, label: 'Goals', goals: config.goals, color: '#888888' },
          { icon: UserCircle, label: 'Audience', value: config.audience || 'General', sub: `${config.brandVoice}${config.tone ? ` · ${config.tone}` : ''}`, color: '#888888' },
        ].map((card, idx) => (
          <div key={idx} className="p-4" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="p-1.5 rounded-lg" style={{ background: `${card.color}18`, color: card.color }}>
                <card.icon size={14} />
              </div>
              <span className="font-semibold uppercase tracking-wider" style={{ fontSize: 10, color: '#a0a0a0' }}>{card.label}</span>
            </div>
            {card.value && <p className="text-sm font-bold truncate" style={{ color: '#FFFFFF' }}>{card.value}</p>}
            {card.sub && <p className="truncate mt-0.5" style={{ fontSize: 11, color: '#a0a0a0' }}>{card.sub}</p>}
            {card.tags && (
              <div className="flex flex-wrap gap-1.5">
                {card.tags.map((t: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-md" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: '#a0a0a0' }}>{t}</span>
                ))}
              </div>
            )}
            {card.goals && (
              <div className="space-y-1">
                {card.goals.slice(0, 3).map((g: string, i: number) => (
                  <p key={i} className="flex items-center gap-1.5" style={{ fontSize: 11, color: '#a0a0a0' }}>
                    <span className="shrink-0 rounded-full" style={{ width: 4, height: 4, background: '#888888' }} />{g}
                  </p>
                ))}
                {card.goals.length > 3 && <p style={{ fontSize: 10, color: '#666666' }}>+{card.goals.length - 3} more</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* GROWTH TREND (locked) */}
      <div className="mt-5 p-5 relative" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={14} color="#FDBA2D" />
          <span className="font-bold uppercase tracking-wider" style={{ fontSize: 12, color: '#a0a0a0' }}>Growth Trend</span>
          <span className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
            style={{ fontSize: 9, color: '#FDBA2D', background: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.2)' }}>
            Simulated
          </span>
        </div>
        {renderGrowthChart()}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(20,20,20,0.3)', backdropFilter: 'blur(1px)', borderRadius: 16 }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(13,13,13,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Lock size={14} color="#FDBA2D" />
            <span className="text-xs" style={{ color: '#a0a0a0' }}>Run audit to see real data</span>
          </div>
        </div>
      </div>

      {/* AI INSIGHTS + HEATMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* AI Insights */}
        <div className="p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BrainCircuit size={14} color="#FDBA2D" />
              <span className="font-bold uppercase tracking-wider" style={{ fontSize: 12, color: '#a0a0a0' }}>AI Insights</span>
            </div>
            {!aiInsights ? (
              <button onClick={handleAnalyze} disabled={aiLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                style={{ background: '#FDBA2D', color: '#0a0a0a' }}>
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Analyze
              </button>
            ) : (
              <button onClick={() => setAiInsights(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', color: '#a0a0a0' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            )}
          </div>
          {aiLoading && <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: '#0a0a0a' }} />)}</div>}
          {!aiLoading && aiInsights && (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {aiInsights.map((ins, i) => {
                const pc = ins.priority === 'high' ? '#888888' : ins.priority === 'medium' ? '#FDBA2D' : '#888888';
                const PI = ins.priority === 'high' ? XCircle : ins.priority === 'medium' ? AlertTriangle : CheckCircle;
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <PI size={14} style={{ color: pc }} />
                      <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>{ins.title}</span>
                      <span className="font-bold uppercase tracking-wider ml-auto" style={{ fontSize: 9, color: pc }}>{ins.priority}</span>
                    </div>
                    <p className="leading-relaxed" style={{ fontSize: 11, color: '#a0a0a0' }}>{ins.description}</p>
                  </div>
                );
              })}
            </div>
          )}
          {!aiLoading && !aiInsights && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(253,186,45,0.08)' }}>
                <Lightbulb size={24} color="#FDBA2D" />
              </div>
              <p className="text-xs text-center max-w-56" style={{ color: '#a0a0a0' }}>Click Analyze to generate personalized AI insights based on your channel configuration.</p>
            </div>
          )}
        </div>

        {/* Heatmap (locked) */}
        <div className="p-5 relative" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} color="#FDBA2D" />
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: 12, color: '#a0a0a0' }}>Best Post Times</span>
            <span className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
              style={{ fontSize: 9, color: '#FDBA2D', background: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.2)' }}>
              Simulated
            </span>
          </div>
          {renderHeatmap()}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(20,20,20,0.3)', backdropFilter: 'blur(1px)', borderRadius: 16 }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(13,13,13,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Lock size={14} color="#FDBA2D" />
              <span className="text-xs" style={{ color: '#a0a0a0' }}>Run audit to personalize</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FULL VIEW — CHANNEL-SPECIFIC SIDEBAR
   ═══════════════════════════════════════════════════════════════ */
function ChannelSidebar({
  activeTab, onTabChange, channelName,
}: {
  activeTab: ChannelTab;
  onTabChange: (t: ChannelTab) => void;
  channelName: string;
}) {
  const navItems: { id: ChannelTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'shorts', label: 'Shorts', icon: Play },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'audience', label: 'Audience', icon: Users },
  ];
  const channelItems: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'settings', label: 'Settings', icon: Settings2 },
    { id: 'branding', label: 'Branding', icon: SlidersHorizontal },
  ];

  return (
    <aside className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{ width: 240, background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

      {/* NAV label */}
      <div className="px-4 pt-4 pb-2">
        <span className="font-bold uppercase tracking-wider" style={{ fontSize: 10, color: '#666666' }}>Navigation</span>
      </div>

      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button key={item.id} onClick={() => onTabChange(item.id)}
            className="flex items-center gap-3 w-full text-left transition-all duration-150 group"
            style={{
              height: 44, paddingLeft: 16, paddingRight: 16,
              color: isActive ? '#FDBA2D' : '#a0a0a0',
              background: isActive ? 'rgba(253,186,45,0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid #FDBA2D' : '3px solid transparent',
            }}>
            <item.icon size={18} style={{ opacity: isActive ? 1 : 0.7 }} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        );
      })}

      {/* CHANNEL label */}
      <div className="px-4 pt-6 pb-2">
        <span className="font-bold uppercase tracking-wider" style={{ fontSize: 10, color: '#666666' }}>Channel</span>
      </div>

      {channelItems.map(item => (
        <button key={item.id}
          className="flex items-center gap-3 w-full text-left transition-all duration-150 group"
          style={{ height: 44, paddingLeft: 16, paddingRight: 16, color: '#a0a0a0' }}>
          <item.icon size={18} style={{ opacity: 0.7 }} />
          <span className="text-sm font-medium">{item.label}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="mt-4 mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Bottom */}
      <div className="mt-auto p-4">
        <button className="flex items-center gap-2 w-full text-left transition-colors"
          style={{ color: '#666666', fontSize: 12 }}>
          <HelpCircle size={16} />
          <span>Help &amp; Support</span>
        </button>
        <div className="mt-3 flex items-center gap-2">
          <div className="rounded-full flex items-center justify-center text-xs font-bold"
            style={{ width: 28, height: 28, background: 'rgba(253,186,45,0.15)', color: '#FDBA2D' }}>
            {channelName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#FFFFFF' }}>{channelName}</p>
            <p className="truncate" style={{ fontSize: 10, color: '#666666' }}>Personal Channel</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE TAB BAR
   ═══════════════════════════════════════════════════════════════ */
function MobileTabBar({ activeTab, onTabChange }: { activeTab: ChannelTab; onTabChange: (t: ChannelTab) => void }) {
  const tabs: { id: ChannelTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'shorts', label: 'Shorts', icon: Play },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'audience', label: 'Audience', icon: Users },
  ];
  return (
    <div className="lg:hidden flex gap-1 p-1 overflow-x-auto" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button key={t.id} onClick={() => onTabChange(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
            style={{
              color: isActive ? '#FDBA2D' : '#a0a0a0',
              background: isActive ? 'rgba(253,186,45,0.1)' : 'transparent',
            }}>
            <t.icon size={14} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG HELPERS — Full View Charts
   ═══════════════════════════════════════════════════════════════ */

/* Smooth bezier curve through points */
function bezierPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* Growth trend chart (full size) */
function GrowthTrendChart({ data, prevData, period }: {
  data: number[]; prevData: number[] | null; period: string;
}) {
  const W = 800, H = 260, PAD_L = 50, PAD_R = 20, PAD_T = 20, PAD_B = 30;
  const all = [...data, ...(prevData || [])];
  const max = Math.max(...all, 1);
  const fmtAxis = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);

  const makePts = (arr: number[]) => arr.map((v, i) => ({
    x: PAD_L + (i / (arr.length - 1)) * (W - PAD_L - PAD_R),
    y: PAD_T + (1 - v / max) * (H - PAD_T - PAD_B),
  }));

  const pts = makePts(data);
  const linePath = bezierPath(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H - PAD_B} L ${pts[0].x} ${H - PAD_B} Z`;
  const prevPts = prevData ? makePts(prevData) : null;
  const prevPath = prevPts ? bezierPath(prevPts) : null;

  const dayLabels = ['Mon', '', 'Tue', '', 'Wed', '', 'Thu', '', 'Fri', '', 'Sat', '', 'Sun'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="gt-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#888888" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#888888" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = PAD_T + (1 - pct) * (H - PAD_T - PAD_B);
        return (
          <g key={pct}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.05)" />
            <text x={PAD_L - 8} y={y + 4} textAnchor="end" fill="#666666" fontSize="10">{fmtAxis(max * pct)}</text>
          </g>
        );
      })}
      {/* X labels */}
      {data.map((_, i) => {
        if (i % Math.ceil(data.length / 7) !== 0 && i !== data.length - 1) return null;
        const x = PAD_L + (i / (data.length - 1)) * (W - PAD_L - PAD_R);
        return <text key={i} x={x} y={H - 8} textAnchor="middle" fill="#666666" fontSize="10">{dayLabels[i] || ''}</text>;
      })}
      {/* Previous period dashed */}
      {prevPath && <path d={prevPath} fill="none" stroke="#666666" strokeWidth="1.5" strokeDasharray="6 4" />}
      {/* Area */}
      <path d={areaPath} fill="url(#gt-fill)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#FDBA2D" strokeWidth="2.5" strokeLinecap="round" />
      {/* Data points */}
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#888888" stroke="#0f0f0f" strokeWidth="2" />)}
    </svg>
  );
}

/* Health ring (small) */
function HealthRingSmall({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = scoreColor(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1A1A" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold" style={{ fontSize: 13, color }}>{score}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW TAB CONTENT (main full-view content)
   ═══════════════════════════════════════════════════════════════ */
function OverviewTab({
  pc, userName, userPlan, region,
}: {
  pc: NychIQState['personalChannel'];
  userName: string;
  userPlan: string;
  region: string;
}) {
  const setActiveTool = useNychIQStore(s => s.setActiveTool);

  const [videos, setVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [activePeriod, setActivePeriod] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* Derived data */
  const totalViews = pc.viewCount || 0;
  const subscribers = pc.subscriberCount || 0;
  const healthScore = pc.healthScore || 0;
  const engagement = pc.auditCategories.length > 0
    ? (pc.auditCategories.find(c => c.name === 'Engagement')?.score || 0)
    : 0;
  const displayEngagement = engagement > 0 ? (engagement / 10).toFixed(1) : '8.4';

  /* Fetch top videos */
  useEffect(() => {
    if (!pc.handle) return;
    let cancelled = false;
    async function fetch() {
      setVideosLoading(true);
      try {
        const res = await ytFetch('search', {
          q: '', channelId: pc.handle, maxResults: 5, type: 'video',
          order: 'viewCount', regionCode: region,
        });
        if (!cancelled) setVideos(res?.items || []);
      } catch { if (!cancelled) setVideos([]); }
      finally { if (!cancelled) setVideosLoading(false); }
    }
    fetch();
    return () => { cancelled = true; };
  }, [pc.handle, region]);

  /* Growth chart data (derived from views + stable pattern) */
  const growthData = useMemo(() => {
    const base = totalViews > 0 ? totalViews * 0.00008 : 200;
    const seed = subscribers > 0 ? subscribers % 100 : 42;
    const pts: number[] = [];
    for (let i = 0; i < 14; i++) {
      pts.push(Math.max(10, base + base * 0.4 * Math.sin(i * 0.7 + seed * 0.1) + base * 0.2 * i / 14));
    }
    return pts;
  }, [totalViews, subscribers]);

  const prevGrowthData = useMemo(() => growthData.map(v => v * 0.7), [growthData]);

  /* Copy handler */
  const handleCopy = useCallback(async (videoId: string, title: string) => {
    const url = `https://youtube.com/watch?v=${videoId}`;
    await copyToClipboard(`${title}\n${url}`);
    setCopiedId(videoId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  /* Video card skeleton */
  function VideoSkeleton() {
    return (
      <div className="shrink-0 animate-pulse" style={{ width: 240, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
        <div style={{ height: 135, background: '#0f0f0f', borderRadius: '12px 12px 0 0' }} />
        <div className="p-3 space-y-2">
          <div className="h-4 rounded" style={{ background: '#0f0f0f', width: '80%' }} />
          <div className="h-3 rounded" style={{ background: '#0f0f0f', width: '60%' }} />
        </div>
      </div>
    );
  }

  /* Upload consistency bars */
  const uploadBars = useMemo(() => [60, 85, 45, 70, 90, 100, 75], []);

  /* Avg view duration */
  const retention = 72;

  /* Content mix data */
  const contentMix = useMemo(() => [
    { name: 'Tutorials', pct: 35, color: '#888888' },
    { name: 'Reviews', pct: 25, color: '#FDBA2D' },
    { name: 'Vlogs', pct: 20, color: '#888888' },
    { name: 'Challenges', pct: 15, color: '#888888' },
    { name: 'Other', pct: 5, color: '#666666' },
  ], []);

  /* Trending in niche (simulated stable) */
  const trendingTopics = useMemo(() => [
    { title: 'How to Grow on YouTube in 2025', views: '1.2M', channel: 'Creator Academy' },
    { title: 'Best Camera for YouTube Beginners', views: '890K', channel: 'Tech Reviews' },
    { title: 'YouTube Algorithm Secrets Revealed', views: '650K', channel: 'Algorithm Insights' },
    { title: '10 Mistakes New YouTubers Make', views: '420K', channel: 'Growth Guide' },
    { title: 'How I Got 100K Subscribers', views: '380K', channel: 'Success Stories' },
  ], []);

  /* Audience demographics */
  const demographics = useMemo(() => ({
    gender: [{ label: 'Male', pct: 65, color: '#888888' }, { label: 'Female', pct: 30, color: '#888888' }, { label: 'Other', pct: 5, color: '#666666' }],
    age: [
      { label: '18-24', pct: 35 },
      { label: '25-34', pct: 40 },
      { label: '35-44', pct: 15 },
      { label: '45+', pct: 10 },
    ],
    countries: [
      { flag: '🇺🇸', name: 'United States', pct: 45 },
      { flag: '🇬🇧', name: 'United Kingdom', pct: 15 },
      { flag: '🇨🇦', name: 'Canada', pct: 12 },
      { flag: '🇦🇺', name: 'Australia', pct: 8 },
      { flag: '🇩🇪', name: 'Germany', pct: 5 },
    ],
    activeHours: [
      [30, 20, 15, 35, 80, 95, 85, 60, 45, 30, 25, 20],
      [25, 15, 10, 30, 75, 90, 80, 55, 40, 25, 20, 15],
      [20, 15, 10, 25, 70, 85, 75, 50, 40, 30, 25, 15],
      [25, 15, 15, 30, 80, 95, 90, 60, 50, 35, 25, 20],
      [30, 20, 20, 40, 90, 98, 95, 70, 55, 40, 30, 25],
      [40, 30, 25, 50, 95, 98, 95, 80, 65, 50, 40, 30],
      [45, 35, 30, 55, 98, 98, 90, 75, 60, 45, 35, 25],
    ],
  }), []);

  /* Niche tags */
  const nicheTags = useMemo(() => {
    const cats = pc.auditCategories.length > 0 ? pc.auditCategories : [];
    return cats.length > 0 ? cats.slice(0, 3).map(c => c.name) : ['Content Creator', 'YouTube', 'Growth'];
  }, [pc.auditCategories]);

  return (
    <div className="space-y-6">

      {/* ── SUB 1: CHANNEL BANNER + IDENTITY ── */}
      <div className="overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        {/* Banner */}
        <div className="relative h-[180px] md:h-[300px]" style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0f0f 40%, rgba(253,186,45,0.08) 100%)',
        }}>
          {/* Pattern overlay */}
          <div className="absolute inset-0" style={{
            opacity: 0.15,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(253,186,45,0.03) 20px, rgba(253,186,45,0.03) 21px)',
          }} />
          {/* LIVE badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.1)' }}>
            <div className="rounded-full animate-pulse" style={{ width: 6, height: 6, background: '#888888' }} />
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: 10, color: '#888888' }}>LIVE</span>
          </div>
          {/* Plan badge */}
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.3)' }}>
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: 10, color: '#FDBA2D' }}>{userPlan}</span>
          </div>
        </div>

        {/* Avatar + Info (overlapping banner) */}
        <div className="relative px-6 pb-6" style={{ marginTop: -40 }}>
          <div className="flex items-end gap-5">
            {pc.avatar ? (
              <img src={pc.avatar} alt={pc.title}
                className="rounded-full object-cover shadow-2xl"
                style={{ width: 80, height: 80, border: '3px solid #FDBA2D' }} />
            ) : (
              <div className="rounded-full flex items-center justify-center text-3xl font-bold shadow-2xl"
                style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #FDBA2D, #C69320)', color: '#0a0a0a', border: '3px solid #FDBA2D' }}>
                {pc.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="font-bold truncate" style={{ fontSize: 24, color: '#FFFFFF' }}>{pc.title}</h1>
              <p className="truncate" style={{ fontSize: 14, color: '#a0a0a0' }}>@{pc.handle}</p>
              <p className="mt-1" style={{ fontSize: 12, color: '#a0a0a0' }}>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{fmtV(subscribers)}</span> subscribers
                <span className="mx-2" style={{ color: '#1a1a1a' }}>·</span>
                <span>{fmtV(pc.videoCount || 0)} videos</span>
              </p>
            </div>
            <button onClick={() => setActiveTool('audit')}
              className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              style={{ background: 'rgba(253,186,45,0.1)', border: '1px solid rgba(253,186,45,0.3)', color: '#FDBA2D' }}>
              <ClipboardCheck size={14} /> Re-audit
            </button>
          </div>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {nicheTags.map((tag, i) => (
              <span key={i} className="px-3 py-1 rounded-full font-medium"
                style={{ fontSize: 12, color: '#FDBA2D', background: 'rgba(253,186,45,0.15)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUB 2: STATS ROW ── */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[
          { label: 'Views', value: fmtV(totalViews), sub: null },
          { label: 'Subs', value: fmtV(subscribers), sub: '+2.4K', subColor: '#888888' },
          { label: 'Engagement', value: `${displayEngagement}%`, sub: null },
          { label: 'Health', value: String(healthScore), sub: null, ring: healthScore },
          { label: 'Viral', value: '94', sub: null },
          { label: 'Revenue', value: '$4.2K', sub: 'est. this month', subColor: '#666666' },
        ].map((stat, idx) => (
          <div key={idx} className="flex-1 shrink-0 p-5 flex flex-col justify-between"
            style={{ minWidth: 140, height: 120, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
            <span className="font-semibold uppercase tracking-wider" style={{ fontSize: 12, color: '#a0a0a0' }}>{stat.label}</span>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold" style={{ fontSize: 32, color: '#FFFFFF', lineHeight: 1, ...(stat.label === 'Revenue' ? { color: '#888888' } : {}) }}>
                  {stat.value}
                </span>
                {stat.sub && (
                  <p className="mt-1" style={{ fontSize: stat.label === 'Revenue' ? 11 : 12, color: stat.subColor || '#888888', fontWeight: 600 }}>
                    {stat.sub}
                  </p>
                )}
              </div>
              {stat.ring !== undefined && <HealthRingSmall score={stat.ring} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── SUB 3: GROWTH TREND CHART ── */}
      <div className="p-6" style={{ height: 300, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold" style={{ fontSize: 16, color: '#FFFFFF' }}>Growth Trend</span>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
            {(['7D', '30D', '90D', '1Y'] as const).map(p => (
              <button key={p} onClick={() => setActivePeriod(p)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  color: activePeriod === p ? '#FDBA2D' : '#666666',
                  background: activePeriod === p ? 'rgba(253,186,45,0.15)' : 'transparent',
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <GrowthTrendChart data={growthData} prevData={prevGrowthData} period={activePeriod} />
      </div>

      {/* ── SUB 4: TOP 5 VIDEOS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold" style={{ fontSize: 16, color: '#FFFFFF' }}>Top Performing Videos</span>
          <button onClick={() => setActiveTool('search')}
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: '#FDBA2D' }}>
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {videosLoading && [0, 1, 2, 3, 4].map(i => <VideoSkeleton key={i} />)}
          {!videosLoading && videos.map((v: any) => {
            const vid = v.id?.videoId || v.id || '';
            const title = v.snippet?.title || 'Untitled';
            const views = v.statistics?.viewCount ? fmtV(parseInt(v.statistics.viewCount, 10)) : '';
            const published = v.snippet?.publishedAt ? timeAgo(v.snippet.publishedAt) : '';
            const isCopied = copiedId === vid;
            const score = 75 + (parseInt(vid.slice(-2), 16) || 0) % 25;

            return (
              <div key={vid} className="shrink-0 relative group"
                style={{ width: 240, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                {/* Thumbnail */}
                <div className="relative" style={{ height: 135, borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
                  <img src={thumbUrl(vid)} alt={title} className="w-full h-full object-cover" loading="lazy" />
                  {/* Score badge */}
                  <div className="absolute top-2 right-2 flex items-center justify-center rounded-full font-bold"
                    style={{ width: 32, height: 32, fontSize: 11, color: '#FFFFFF', background: scoreColor(score) }}>
                    {score}
                  </div>
                </div>
                {/* Title */}
                <div className="p-3 pb-2">
                  <p className="font-medium line-clamp-2" style={{ fontSize: 14, color: '#FFFFFF', lineHeight: '20px' }}>{title}</p>
                  <p className="mt-1" style={{ fontSize: 11, color: '#666666' }}>
                    {views ? `${views} views` : ''}{views && published ? ' · ' : ''}{published}
                  </p>
                </div>
                {/* Bottom badges */}
                <div className="flex items-center gap-2 px-3 pb-3">
                  <span className="px-2 py-0.5 rounded-md font-bold"
                    style={{ fontSize: 11, color: '#FDBA2D', background: 'rgba(253,186,45,0.15)' }}>
                    SEO 92
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold"
                    style={{ fontSize: 11, color: '#888888', background: 'rgba(34,197,94,0.1)' }}>
                    12.1%
                  </span>
                  <button onClick={() => handleCopy(vid, title)}
                    className="ml-auto p-1.5 rounded-md transition-colors"
                    style={{ color: '#FDBA2D' }}>
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
          {!videosLoading && videos.length === 0 && (
            <div className="flex items-center justify-center w-full py-12" style={{ color: '#666666', fontSize: 13 }}>
              No videos found for this channel.
            </div>
          )}
        </div>
      </div>

      {/* ── SUB 5: UPLOAD CONSISTENCY + AVG VIEW DURATION ── */}
      <div className="flex gap-4 flex-col md:flex-row">
        {/* Upload Consistency */}
        <div className="flex-1 p-5" style={{ height: 180, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <span className="font-semibold uppercase tracking-wider" style={{ fontSize: 12, color: '#a0a0a0' }}>Upload Consistency</span>
          <div className="mt-2">
            <span className="font-bold" style={{ fontSize: 28, color: '#FFFFFF', lineHeight: 1 }}>4.2x/week</span>
            <p style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>Last 30 days</p>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-2 mt-4" style={{ height: 60 }}>
            {DAYS.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm transition-all" style={{
                  height: `${uploadBars[i]}%`, minHeight: 4,
                  background: '#888888',
                  borderRadius: '3px 3px 0 0',
                }} />
                <span style={{ fontSize: 9, color: '#666666' }}>{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Avg View Duration */}
        <div className="flex-1 p-5" style={{ height: 180, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <span className="font-semibold uppercase tracking-wider" style={{ fontSize: 12, color: '#a0a0a0' }}>Avg View Duration</span>
          <div className="mt-2">
            <span className="font-bold" style={{ fontSize: 28, color: '#FFFFFF', lineHeight: 1 }}>6:42</span>
            <span className="ml-2 font-semibold" style={{ fontSize: 14, color: retention >= 70 ? '#888888' : retention >= 50 ? '#FDBA2D' : '#888888' }}>
              {retention}% retention
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-6">
            <div className="w-full rounded-full" style={{ height: 8, background: '#0a0a0a' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${retention}%`, background: retention >= 70 ? '#888888' : retention >= 50 ? '#FDBA2D' : '#888888' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 10, color: '#666666' }}>0:00</span>
              <span style={{ fontSize: 10, color: '#666666' }}>9:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUB 6: CONTENT MIX + TRENDING ── */}
      <div className="flex gap-4 flex-col lg:flex-row lg:h-[320px] overflow-x-auto lg:overflow-visible">
        {/* Content Mix */}
        <div className="flex-1 p-5 overflow-hidden" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <span className="font-semibold" style={{ fontSize: 14, color: '#FFFFFF' }}>Content Mix</span>
          {/* Stacked bar */}
          <div className="flex w-full rounded-full overflow-hidden mt-5" style={{ height: 14 }}>
            {contentMix.map((seg, i) => (
              <div key={i} title={`${seg.name}: ${seg.pct}%`}
                style={{ width: `${seg.pct}%`, background: seg.color, minWidth: 2 }} />
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4">
            {contentMix.map((seg, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="rounded-full" style={{ width: 8, height: 8, background: seg.color }} />
                <span style={{ fontSize: 12, color: '#a0a0a0' }}>{seg.name}</span>
                <span className="font-semibold" style={{ fontSize: 12, color: '#FFFFFF' }}>{seg.pct}%</span>
              </div>
            ))}
          </div>

          {/* Quick tools */}
          <div className="grid grid-cols-2 gap-2 mt-5">
            {[
              { icon: Zap, label: 'Viral Predictor', id: 'viral', color: '#888888' },
              { icon: Crosshair, label: 'Niche Radar', id: 'niche', color: '#FDBA2D' },
              { icon: SearchCode, label: 'SEO Optimizer', id: 'seo', color: '#888888' },
              { icon: GitCompare, label: 'Competitor Track', id: 'competitor', color: '#888888' },
            ].map(tool => (
              <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                className="flex items-center gap-2 p-2.5 rounded-lg transition-all group text-left"
                style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="p-1.5 rounded-md" style={{ background: `${tool.color}15`, color: tool.color }}>
                  <tool.icon size={14} />
                </div>
                <span className="text-xs font-medium" style={{ color: '#a0a0a0' }}>{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending in Your Niche */}
        <div className="shrink-0 p-5 overflow-hidden w-full lg:w-[320px]" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} color="#FDBA2D" />
            <span className="font-semibold" style={{ fontSize: 14, color: '#FFFFFF' }}>Trending in Your Niche</span>
          </div>
          <div className="space-y-0">
            {trendingTopics.map((topic, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 transition-colors cursor-pointer group"
                style={{ borderBottom: i < trendingTopics.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderLeft: '2px solid transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderLeftColor = '#FDBA2D')}
                onMouseLeave={e => (e.currentTarget.style.borderLeftColor = 'transparent')}>
                <span className="font-bold shrink-0" style={{ fontSize: 14, color: '#FDBA2D', width: 20 }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium" style={{ fontSize: 13, color: '#FFFFFF' }}>{topic.title}</p>
                  <p className="truncate" style={{ fontSize: 11, color: '#666666' }}>
                    {topic.views} views · by {topic.channel}
                  </p>
                </div>
                <button onClick={() => copyToClipboard(topic.title)}
                  className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#FDBA2D' }}>
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUB 7: AUDIENCE DEMOGRAPHICS ── */}
      <div className="p-6" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16 }}>
        <span className="font-semibold" style={{ fontSize: 16, color: '#FFFFFF' }}>Audience Demographics</span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
          {/* COL 1: Age & Gender */}
          <div>
            <p className="font-semibold mb-3" style={{ fontSize: 12, color: '#a0a0a0' }}>Age &amp; Gender</p>
            {/* Gender bar */}
            <div className="flex w-full rounded-full overflow-hidden mb-4" style={{ height: 10 }}>
              {demographics.gender.map((g, i) => (
                <div key={i} title={`${g.label}: ${g.pct}%`}
                  style={{ width: `${g.pct}%`, background: g.color, minWidth: 2 }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mb-5">
              {demographics.gender.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="rounded-full" style={{ width: 8, height: 8, background: g.color }} />
                  <span style={{ fontSize: 11, color: '#a0a0a0' }}>{g.label} {g.pct}%</span>
                </div>
              ))}
            </div>
            {/* Age bars */}
            {demographics.age.map((a, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <span className="shrink-0" style={{ fontSize: 11, color: '#a0a0a0', width: 36 }}>{a.label}</span>
                <div className="flex-1 rounded-full" style={{ height: 6, background: '#0a0a0a' }}>
                  <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: '#888888' }} />
                </div>
                <span className="font-semibold" style={{ fontSize: 11, color: '#FFFFFF', width: 28, textAlign: 'right' }}>{a.pct}%</span>
              </div>
            ))}
          </div>

          {/* COL 2: Top Countries */}
          <div>
            <p className="font-semibold mb-3" style={{ fontSize: 12, color: '#a0a0a0' }}>Top Countries</p>
            {demographics.countries.map((c, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <span className="text-base shrink-0">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate" style={{ fontSize: 12, color: '#FFFFFF' }}>{c.name}</span>
                    <span className="font-semibold shrink-0 ml-2" style={{ fontSize: 12, color: '#a0a0a0' }}>{c.pct}%</span>
                  </div>
                  <div className="w-full rounded-full mt-1" style={{ height: 4, background: '#0a0a0a' }}>
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: '#FDBA2D' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* COL 3: Active Hours */}
          <div>
            <p className="font-semibold mb-3" style={{ fontSize: 12, color: '#a0a0a0' }}>Active Hours</p>
            {/* Heatmap grid: 7 days x 6 time slots */}
            <div className="flex gap-1 mb-1">
              <div style={{ width: 28 }} />
              {['12a', '4a', '8a', '12p', '4p', '8p'].map(h => (
                <div key={h} className="flex-1 text-center" style={{ fontSize: 9, color: '#666666' }}>{h}</div>
              ))}
            </div>
            {demographics.activeHours.map((row, di) => (
              <div key={di} className="flex gap-1 mb-0.5">
                <div className="flex items-center" style={{ width: 28, fontSize: 9, color: '#666666' }}>{DAY_LABELS[di]}</div>
                {row.map((val, hi) => {
                  const bg = val >= 85 ? '#888888' : val >= 60 ? '#FDBA2D' : '#0f0f0f';
                  return <div key={hi} className="flex-1 rounded-sm transition-colors" style={{ height: 20, background: bg }} title={`${val}%`} />;
                })}
              </div>
            ))}
            <p className="mt-3" style={{ fontSize: 11, color: '#666666', lineHeight: '16px' }}>
              Your audience is most active <span style={{ color: '#888888', fontWeight: 600 }}>Fri-Sun 6-9 PM</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLACEHOLDER TAB VIEWS
   ═══════════════════════════════════════════════════════════════ */
function PlaceholderTab({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(253,186,45,0.08)', border: '1px solid rgba(253,186,45,0.15)' }}>
        <Icon size={28} color="#FDBA2D" />
      </div>
      <h3 className="text-lg font-bold mb-1" style={{ color: '#FFFFFF' }}>{label}</h3>
      <p className="text-sm text-center max-w-sm" style={{ color: '#666666' }}>
        This section is coming soon. Switch to Overview for the full channel analytics dashboard.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function MyChannelTool() {
  const pc = useNychIQStore(s => s.personalChannel);
  const userName = useNychIQStore(s => s.userName);
  const userPlan = useNychIQStore(s => s.userPlan);
  const region = useNychIQStore(s => s.region);
  const setActiveTool = useNychIQStore(s => s.setActiveTool);

  const [activeTab, setActiveTab] = useState<ChannelTab>('overview');

  /* Read Channel Assistant config from localStorage */
  const [channelConfig] = useState<ChannelAssistantConfig | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('nychiq_channel_assistant_config');
      if (raw) {
        const parsed = JSON.parse(raw) as ChannelAssistantConfig;
        if (parsed?.channelName) return parsed;
      }
    } catch { /* ignore */ }
    return null;
  });

  /* ── STATE 1: Unlinked ── */
  if (!pc.linked && !channelConfig) {
    return <UnlinkedView />;
  }

  /* ── STATE 2: Lite (config but not audited) ── */
  if (!pc.linked && channelConfig) {
    return <ChannelLiteView config={channelConfig} />;
  }

  /* ── STATE 3: Full (channel linked) ── */
  const tabIconMap: Record<ChannelTab, React.ElementType> = {
    overview: BarChart3,
    videos: Video,
    shorts: Play,
    revenue: DollarSign,
    audience: Users,
  };

  return (
    <div className="animate-fade-in-up h-full" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 0 }}>
      {/* Sidebar */}
      <ChannelSidebar activeTab={activeTab} onTabChange={setActiveTab} channelName={pc.title} />

      {/* Main Content */}
      <div className="min-h-0 overflow-y-auto" style={{ padding: 24 }}>
        {/* Mobile tab bar */}
        <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab content */}
        <div className="mt-4">
          {activeTab === 'overview' && (
            <OverviewTab pc={pc} userName={userName} userPlan={userPlan} region={region} />
          )}
          {activeTab !== 'overview' && (
            <PlaceholderTab label={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} icon={tabIconMap[activeTab]} />
          )}
        </div>
      </div>
    </div>
  );
}
