'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { copyToClipboard, fmtV, timeAgo } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import { askAI } from '@/lib/api';
import {
  Building2,
  Lock,
  Loader2,
  Users,
  Eye,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Download,
  UserPlus,
  BarChart3,
  Activity,
  FileText,
  Zap,
  SearchCode,
  Shield,
  Calendar,
  Plus,
  ArrowUpRight,
  FolderOutput,
  FileBarChart,
  Crown,
  Send,
  Copy,
  Check,
  Radio,
  Target,
  Command,
  Link2,
  Globe,
  Cpu,
  Signal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDot,
  Radar,
  type LucideIcon,
} from 'lucide-react';

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
  status: 'performing' | 'stale' | 'arbitrage';
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
   Mock Data — 5 Clients
   ═══════════════════════════════════════════ */
const MOCK_CHANNELS: ClientChannel[] = [
  {
    id: 'ch-1',
    name: 'TechVision Pro',
    initials: 'TV',
    color: '#4A9EFF',
    subscribers: 485000,
    videoCount: 312,
    healthScore: 92,
    lastAnalyzed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'performing',
    monthlyViews: 5820000,
    monthlyRevenue: 3240,
    cpm: 18.40,
    niche: 'Technology',
  },
  {
    id: 'ch-2',
    name: 'FitLife Academy',
    initials: 'FA',
    color: '#10B981',
    subscribers: 1280000,
    videoCount: 578,
    healthScore: 87,
    lastAnalyzed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'performing',
    monthlyViews: 12400000,
    monthlyRevenue: 8920,
    cpm: 22.10,
    niche: 'Fitness',
  },
  {
    id: 'ch-3',
    name: 'Crypto Daily',
    initials: 'CD',
    color: '#FDBA2D',
    subscribers: 320000,
    videoCount: 189,
    healthScore: 74,
    lastAnalyzed: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    status: 'stale',
    monthlyViews: 1840000,
    monthlyRevenue: 1680,
    cpm: 32.50,
    niche: 'Finance',
  },
  {
    id: 'ch-4',
    name: 'Art Studio NG',
    initials: 'AS',
    color: '#9B72CF',
    subscribers: 890000,
    videoCount: 421,
    healthScore: 81,
    lastAnalyzed: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    status: 'arbitrage',
    monthlyViews: 7600000,
    monthlyRevenue: 4120,
    cpm: 14.80,
    niche: 'Art & Design',
  },
  {
    id: 'ch-5',
    name: 'EduTech Masters',
    initials: 'EM',
    color: '#EF4444',
    subscribers: 620000,
    videoCount: 267,
    healthScore: 68,
    lastAnalyzed: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    status: 'stale',
    monthlyViews: 3200000,
    monthlyRevenue: 2100,
    cpm: 18.40,
    niche: 'Education',
  },
];

const MOCK_SIGNALS: SignalQueueItem[] = [
  { id: 's-1', client: 'TechVision Pro', clientColor: '#4A9EFF', clientInitials: 'TV', type: 'viral', message: 'AI phone review hit 500K views in 18 hours — viral score 94. Consider follow-up content.', time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-2', client: 'FitLife Academy', clientColor: '#10B981', clientInitials: 'FA', type: 'trend', message: '"Zone 2 cardio" search volume up 340% this week. Perfect timing for a deep-dive video.', time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-3', client: 'Crypto Daily', clientColor: '#FDBA2D', clientInitials: 'CD', type: 'gap', message: 'No upload in 4 days. Audience engagement dropping — 12% comment decline vs last week.', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
  { id: 's-4', client: 'Art Studio NG', clientColor: '#9B72CF', clientInitials: 'AS', type: 'arbitrage', message: 'Art supply CPM at $14.80 but affiliate program offers $28 per sale. 4.2x revenue opportunity.', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), priority: 'high' },
  { id: 's-5', client: 'EduTech Masters', clientColor: '#EF4444', clientInitials: 'EM', type: 'threat', message: 'New competitor "LearnCode Pro" gained 50K subs this month in same niche.', time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
  { id: 's-6', client: 'TechVision Pro', clientColor: '#4A9EFF', clientInitials: 'TV', type: 'trend', message: 'Apple Vision Pro 2 leaks trending — 2.1M searches. Perfect for a preview/analysis video.', time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
  { id: 's-7', client: 'FitLife Academy', clientColor: '#10B981', clientInitials: 'FA', type: 'gap', message: 'Meal prep content gap: audience asking for budget-friendly options in comments.', time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), priority: 'low' },
  { id: 's-8', client: 'Art Studio NG', clientColor: '#9B72CF', clientInitials: 'AS', type: 'viral', message: 'Time-lapse portrait video reached 1.2M views. Replicate format with different subjects.', time: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), priority: 'medium' },
];

const MOCK_REPORTS: Report[] = [
  { id: 'r-1', name: 'Full Channel Audit', client: 'TechVision Pro', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'Audit' },
  { id: 'r-2', name: 'Growth Strategy Q4', client: 'FitLife Academy', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'Strategy' },
  { id: 'r-3', name: 'SEO Optimization Pack', client: 'Art Studio NG', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'SEO' },
  { id: 'r-4', name: 'Performance Audit', client: 'Crypto Daily', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'Audit' },
  { id: 'r-5', name: 'Niche Expansion Report', client: 'EduTech Masters', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'Strategy' },
];

const MOCK_ACTIVITY: TeamActivity[] = [
  { id: 'a-1', user: 'Sarah K.', initials: 'SK', color: '#4A9EFF', action: 'completed audit for', target: 'TechVision Pro', time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'a-2', user: 'Mike R.', initials: 'MR', color: '#10B981', action: 'generated SEO report for', target: 'FitLife Academy', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'a-3', user: 'Sarah K.', initials: 'SK', color: '#4A9EFF', action: 'flagged stale content on', target: 'Crypto Daily', time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'a-4', user: 'Alex T.', initials: 'AT', color: '#9B72CF', action: 'updated strategy for', target: 'EduTech Masters', time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 'a-5', user: 'Mike R.', initials: 'MR', color: '#10B981', action: 'exported data for', target: 'all channels', time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
];

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */
function healthColor(score: number): string {
  if (score >= 85) return '#10B981';
  if (score >= 70) return '#FDBA2D';
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
    case 'Audit':
      return { bg: 'bg-[rgba(239,68,68,0.1)]', text: 'text-[#EF4444]', border: 'border-[rgba(239,68,68,0.2)]', icon: <Shield className="w-3 h-3" /> };
    case 'Strategy':
      return { bg: 'bg-[rgba(74,158,255,0.1)]', text: 'text-[#4A9EFF]', border: 'border-[rgba(74,158,255,0.2)]', icon: <TrendingUp className="w-3 h-3" /> };
    case 'SEO':
      return { bg: 'bg-[rgba(253,186,45,0.1)]', text: 'text-[#FDBA2D]', border: 'border-[rgba(253,186,45,0.2)]', icon: <SearchCode className="w-3 h-3" /> };
  }
}

function signalTypeInfo(type: SignalQueueItem['type']): { icon: LucideIcon; color: string; label: string } {
  switch (type) {
    case 'viral': return { icon: Zap, color: '#FDBA2D', label: 'VIRAL' };
    case 'trend': return { icon: TrendingUp, color: '#10B981', label: 'TREND' };
    case 'gap': return { icon: Target, color: '#4A9EFF', label: 'GAP' };
    case 'threat': return { icon: AlertTriangle, color: '#EF4444', label: 'THREAT' };
    case 'arbitrage': return { icon: DollarSign, color: '#9B72CF', label: 'ARBITRAGE' };
  }
}

function statusRing(status: ClientChannel['status']): { color: string; label: string; pulse: boolean } {
  switch (status) {
    case 'performing': return { color: '#10B981', label: 'Performing Well', pulse: true };
    case 'stale': return { color: '#FDBA2D', label: 'No Uploads (3+ days)', pulse: false };
    case 'arbitrage': return { color: '#9B72CF', label: 'High Arbitrage', pulse: false };
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
    <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs text-[#888888] font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-[#E8E8E8]">{value}</p>
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

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */
export function AgencyDashboardTool() {
  const { spendTokens } = useNychIQStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fleet' | 'signals' | 'war-room' | 'reports'>('fleet');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
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

  const BRIEFING_MESSAGES = [
    'Analyzing Competitor DNA...',
    'Mapping Signal Arbitrage...',
    'Scanning Content Funnels...',
    'Compiling Intelligence Matrix...',
    'Generating Tactical Brief...',
  ];

  // Tactical Briefing animation effect
  useEffect(() => {
    if (!briefingLoading) return;

    const startTime = Date.now();
    const totalDuration = 10000; // 10 seconds

    // Step cycling every 2 seconds
    const stepInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newStep = Math.min(Math.floor(elapsed / 2000), 4);
      setBriefingStep(newStep);
    }, 200);

    // Progress counter every 100ms
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

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [briefingLoading]);

  const handleGenerateBriefing = () => {
    setBriefingComplete(false);
    setBriefingLoading(true);
    setBriefingStep(0);
    setBriefingProgress(0);
  };

  const handleDownloadReport = () => {
    showToast('Report generated successfully', 'success');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const ok = spendTokens('agency-dashboard');
      if (!ok) { setLoading(false); return; }
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agency data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [spendTokens]);

  // Auto-scroll signal queue
  useEffect(() => {
    if (activeTab === 'signals' && signalQueueRef.current) {
      signalQueueRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const totalMonthlyViews = MOCK_CHANNELS.reduce((sum, ch) => sum + ch.monthlyViews, 0);
  const totalMonthlyRevenue = MOCK_CHANNELS.reduce((sum, ch) => sum + ch.monthlyRevenue, 0);
  const avgHealth = Math.round(MOCK_CHANNELS.reduce((sum, ch) => sum + ch.healthScore, 0) / MOCK_CHANNELS.length);

  // Command handler
  const handleCommand = () => {
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;
    if (cmd.startsWith('/compare')) {
      const parts = cmd.split(' ').slice(1);
      const client1 = parts[0] || '';
      const client2 = parts[1] || '';
      const found1 = MOCK_CHANNELS.find((c) => c.name.toLowerCase().includes(client1));
      const found2 = MOCK_CHANNELS.find((c) => c.name.toLowerCase().includes(client2));
      if (found1 && found2) {
        setCommandOutput(`📊 Comparison: ${found1.name} vs ${found2.name}\n\n${found1.name}: ${fmtV(found1.subscribers)} subs, ${fmtV(found1.monthlyViews)} views/mo, Health ${found1.healthScore}\n${found2.name}: ${fmtV(found2.subscribers)} subs, ${fmtV(found2.monthlyViews)} views/mo, Health ${found2.healthScore}\n\nRecommendation: ${found1.healthScore > found2.healthScore ? found1.name : found2.name} has stronger growth trajectory.`);
      } else {
        setCommandOutput(`❌ Client(s) not found. Available: ${MOCK_CHANNELS.map((c) => c.name).join(', ')}`);
      }
    } else if (cmd === '/report-all') {
      setCommandOutput(`📋 Generating bulk reports for all ${MOCK_CHANNELS.length} channels...\n\nReports generated:\n${MOCK_CHANNELS.map((c) => `✅ ${c.name} — Channel Audit`).join('\n')}\n\nAll reports saved to your Agency Hub.`);
    } else {
      setCommandOutput(`❓ Unknown command: "${cmd}"\n\nAvailable commands:\n/compare <ClientA> <ClientB> — Compare two clients\n/report-all — Generate reports for all channels`);
    }
  };

  const handleCopyLink = async (url: string) => {
    const ok = await copyToClipboard(url);
    if (ok) { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
  };

  const handleGenerateWarLink = () => {
    const client = MOCK_CHANNELS.find((c) => c.id === selectedClient);
    if (!client) return;
    const newLink = {
      id: `wl-${Date.now()}`,
      client: client.name,
      label: `${client.name} Intelligence Brief`,
      url: `https://nychiq.app/share/intel-${client.initials.toLowerCase()}-${Date.now().toString(36)}`,
      created: new Date().toISOString(),
    };
    setWarRoomLinks([newLink, ...warRoomLinks]);
  };

  /* ── Tabs config ── */
  const tabs = [
    { id: 'fleet' as const, label: 'Fleet Overview', icon: Users },
    { id: 'signals' as const, label: 'Signal Queue', icon: Signal },
    { id: 'war-room' as const, label: 'War Room', icon: Radio },
    { id: 'reports' as const, label: 'Reports', icon: FileText },
  ];

  /* ── LOADING ── */
  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div className="rounded-lg bg-[#141414] border border-[#222222] p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#1A1A1A]" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#1A1A1A] rounded w-40" />
              <div className="h-3 bg-[#1A1A1A] rounded w-64" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-[#1A1A1A]" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#141414] border border-[#222222] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#1A1A1A] rounded w-2/3" />
                  <div className="h-3 bg-[#1A1A1A] rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-[#1A1A1A] rounded w-full mb-2" />
              <div className="h-3 bg-[#1A1A1A] rounded w-3/4" />
            </div>
          ))}
        </div>
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
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Failed to Load Dashboard</h3>
          <p className="text-sm text-[#888888] mb-4">{error}</p>
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
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
                <Building2 className="w-5 h-5 text-[#9B72CF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#E8E8E8]">Agency Hub</h2>
                  <Crown className="w-3.5 h-3.5 text-[#9B72CF]" />
                </div>
                <p className="text-xs text-[#888888] mt-0.5">Multi-seat command center for managing {MOCK_CHANNELS.length} client channels</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Switcher */}
        <div className="px-4 sm:px-5 py-3 border-b border-[#1A1A1A] overflow-x-auto">
          <div className="flex items-center gap-3">
            {MOCK_CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedClient(selectedClient === ch.id ? null : ch.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-shrink-0"
                style={{
                  background: selectedClient === ch.id ? `${ch.color}15` : '#0D0D0D',
                  border: `1.5px solid ${selectedClient === ch.id ? `${ch.color}50` : '#1A1A1A'}`,
                }}
              >
                <StatusRingDot status={ch.status} />
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: `${ch.color}20`, color: ch.color }}
                >
                  {ch.initials}
                </div>
                <span className="text-[11px] font-medium" style={{ color: selectedClient === ch.id ? ch.color : '#888888' }}>
                  {ch.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Fleet Size" value={String(MOCK_CHANNELS.length)} color="#9B72CF" sub="Active clients" />
        <StatCard icon={Eye} label="Total Views/mo" value={fmtV(totalMonthlyViews)} color="#4A9EFF" sub="Across fleet" />
        <StatCard icon={DollarSign} label="Fleet Revenue" value={`$${totalMonthlyRevenue.toLocaleString()}`} color="#FDBA2D" sub="Monthly total" />
        <StatCard icon={BarChart3} label="Avg Health" value={`${avgHealth}`} color="#10B981" sub={avgHealth >= 85 ? 'Excellent' : 'Good'} />
        <StatCard icon={Signal} label="Active Signals" value={String(MOCK_SIGNALS.filter((s) => s.priority === 'high').length)} color="#EF4444" sub="High priority" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#9B72CF]/10 text-[#9B72CF] border border-[#9B72CF]/20'
                : 'bg-[#141414] border border-[#222222] text-[#888888] hover:text-[#E8E8E8] hover:border-[#333333]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.id === 'signals' && (
              <span className="px-1.5 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[9px] font-bold text-[#EF4444]">
                {MOCK_SIGNALS.filter((s) => s.priority === 'high').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          FLEET OVERVIEW TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* Portfolio ROI Chart (CSS) */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#9B72CF]" /> Portfolio ROI
              </h3>
              <span className="text-[10px] text-[#666666]">Last 6 months</span>
            </div>
            <div className="p-5">
              <div className="flex items-end gap-2 h-28">
                {[42, 58, 71, 65, 82, 96].map((val, i) => {
                  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[9px] text-[#888888] font-medium">${val}K</span>
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${(val / 100) * 100}%`,
                          background: i === 5 ? 'linear-gradient(to top, #9B72CF, #B08ADF)' : `linear-gradient(to top, #9B72CF40, #9B72CF15)`,
                          minHeight: 8,
                        }}
                      />
                      <span className="text-[9px] text-[#555555]">{months[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1A1A1A]">
                <div className="flex items-center gap-1.5 text-[10px] text-[#666666]">
                  <div className="w-2 h-2 rounded-sm" style={{ background: 'linear-gradient(to top, #9B72CF, #B08ADF)' }} />
                  <span>Current: $96K</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#10B981]">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="font-semibold">+17.1% MoM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MOCK_CHANNELS.map((ch) => {
              const statusInfo = statusRing(ch.status);
              return (
                <div key={ch.id} className="rounded-lg bg-[#141414] border border-[#222222] p-4 hover:border-[#333333] transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: `${ch.color}25`, border: `2px solid ${ch.color}50`, color: ch.color }}
                      >
                        {ch.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#E8E8E8]">{ch.name}</p>
                          <StatusRingDot status={ch.status} />
                        </div>
                        <p className="text-[11px] text-[#888888]">{fmtV(ch.subscribers)} subs · {ch.niche}</p>
                      </div>
                    </div>
                    <HealthCircle score={ch.healthScore} size={42} strokeWidth={3} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center">
                      <p className="text-[9px] text-[#666666]">Views/mo</p>
                      <p className="text-xs font-semibold text-[#E8E8E8]">{fmtV(ch.monthlyViews)}</p>
                    </div>
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center">
                      <p className="text-[9px] text-[#666666]">Revenue</p>
                      <p className="text-xs font-semibold text-[#10B981]">${ch.monthlyRevenue.toLocaleString()}</p>
                    </div>
                    <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-2 py-1.5 text-center">
                      <p className="text-[9px] text-[#666666]">CPM</p>
                      <p className="text-xs font-semibold text-[#FDBA2D]">${ch.cpm.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium border" style={{ backgroundColor: `${statusInfo.color}10`, color: statusInfo.color, borderColor: `${statusInfo.color}25` }}>
                      {statusInfo.label}
                    </span>
                    <button className="text-[11px] text-[#9B72CF] hover:text-[#B08ADF] font-medium flex items-center gap-0.5 transition-colors group-hover:underline">
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          SIGNAL QUEUE TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-1.5">
              <Signal className="w-4 h-4 text-[#9B72CF]" /> Intelligence Signals
              <span className="text-[10px] text-[#666666] font-normal ml-1">{MOCK_SIGNALS.length} active</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[9px] font-bold text-[#EF4444]">
                {MOCK_SIGNALS.filter((s) => s.priority === 'high').length} HIGH
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] text-[9px] font-bold text-[#FDBA2D]">
                {MOCK_SIGNALS.filter((s) => s.priority === 'medium').length} MED
              </span>
            </div>
          </div>

          <div ref={signalQueueRef} className="space-y-2 max-h-[500px] overflow-y-auto">
            {MOCK_SIGNALS.map((signal) => {
              const typeInfo = signalTypeInfo(signal.type);
              const TypeIcon = typeInfo.icon;
              return (
                <div key={signal.id} className="rounded-lg bg-[#141414] border border-[#222222] p-4 hover:border-[#333333] transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${typeInfo.color}15`, border: `1px solid ${typeInfo.color}25` }}>
                        <TypeIcon className="w-4 h-4" style={{ color: typeInfo.color }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                          style={{ backgroundColor: `${signal.clientColor}20`, color: signal.clientColor }}
                        >
                          {signal.clientInitials}
                        </div>
                        <span className="text-[11px] font-semibold text-[#E8E8E8]">{signal.client}</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                          style={{
                            backgroundColor: signal.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(253,186,45,0.1)',
                            color: signal.priority === 'high' ? '#EF4444' : '#FDBA2D',
                          }}
                        >
                          {signal.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-[#AAAAAA] leading-relaxed mb-1.5">{signal.message}</p>
                      <span className="text-[10px] text-[#555555] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {timeAgo(signal.time)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          WAR ROOM TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'war-room' && (
        <div className="space-y-4">
          {/* Tactical Briefing Generator */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden relative">
            <div className="px-4 py-3 border-b border-[#1A1A1A]">
              <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5 text-[#FDBA2D]" /> Tactical Briefing
              </h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#888888] mb-4">Generate a comprehensive tactical intelligence briefing for your entire fleet. Includes competitor analysis, signal arbitrage mapping, and content funnel optimization.</p>
              {!briefingLoading && !briefingComplete && (
                <button
                  onClick={handleGenerateBriefing}
                  className="px-5 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #FDBA2D, #E09100)', color: '#1A1A1A' }}
                >
                  <Radar className="w-4 h-4" /> Generate Tactical Briefing
                </button>
              )}
              {briefingLoading && (
                <div className="flex flex-col items-center py-8">
                  {/* Glowing spinning ring */}
                  <div className="relative mb-6">
                    <style>{`
                      @keyframes tactical-spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                      }
                      @keyframes tactical-glow {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 1; }
                      }
                      .tactical-ring {
                        animation: tactical-spin 2s linear infinite;
                      }
                      .tactical-glow {
                        animation: tactical-glow 1.5s ease-in-out infinite;
                      }
                    `}</style>
                    <div className="tactical-ring" style={{ width: 80, height: 80 }}>
                      <svg width="80" height="80" viewBox="0 0 80 80">
                        <defs>
                          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FDBA2D" />
                            <stop offset="100%" stopColor="#E09100" />
                          </linearGradient>
                        </defs>
                        <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ring-gradient)" strokeWidth="3" strokeDasharray="160 54" strokeLinecap="round" className="tactical-glow" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Radar className="w-6 h-6 text-[#FDBA2D] tactical-glow" />
                    </div>
                  </div>

                  {/* Cycling message */}
                  <p className="text-sm font-semibold text-[#FDBA2D] mb-4 text-center" style={{ minHeight: 20 }}>
                    {BRIEFING_MESSAGES[briefingStep]}
                  </p>

                  {/* Progress bar */}
                  <div className="w-64 flex flex-col items-center gap-2">
                    <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${briefingProgress}%`, background: 'linear-gradient(90deg, #FDBA2D, #E09100)' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#FDBA2D]">{briefingProgress}%</span>
                  </div>
                </div>
              )}
              {briefingComplete && (
                <div className="flex flex-col items-center py-8 animate-fade-in-up">
                  <div className="w-14 h-14 rounded-full bg-[rgba(16,185,129,0.1)] border-2 border-[#10B981] flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
                  </div>
                  <h4 className="text-base font-bold text-[#E8E8E8] mb-1">Tactical Brief Generated</h4>
                  <p className="text-xs text-[#888888] mb-4">Your intelligence briefing is ready for review.</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadReport}
                      className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #FDBA2D, #E09100)', color: '#1A1A1A' }}
                    >
                      <Download className="w-4 h-4" /> Download Report
                    </button>
                    <button
                      onClick={() => setBriefingComplete(false)}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#0D0D0D] border border-[#222222] text-[#888888] hover:text-[#E8E8E8] hover:border-[#333333] transition-all flex items-center gap-2"
                    >
                      <Radar className="w-3.5 h-3.5" /> New Briefing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Intelligence Link Generator */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A]">
              <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#9B72CF]" /> Shareable Intelligence Link Generator
              </h3>
            </div>
            <div className="p-5">
              <p className="text-xs text-[#888888] mb-4">Generate shareable intelligence briefs for clients or team members. Links contain real-time fleet data.</p>
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] text-[#666666] font-medium uppercase tracking-wider block mb-1.5">Select Client</label>
                  <select
                    value={selectedClient || ''}
                    onChange={(e) => setSelectedClient(e.target.value || null)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#222222] text-[#E8E8E8] text-sm focus:outline-none focus:border-[#9B72CF]/40 transition-all appearance-none"
                  >
                    <option value="">All Channels</option>
                    {MOCK_CHANNELS.map((ch) => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleGenerateWarLink}
                  className="px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
                  style={{ background: '#9B72CF' }}
                >
                  <Globe className="w-4 h-4" /> Generate Link
                </button>
              </div>
            </div>
          </div>

          {/* Generated Links */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A]">
              <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#10B981]" /> Active Intelligence Links
              </h3>
            </div>
            {warRoomLinks.length === 0 ? (
              <div className="p-8 text-center">
                <Radio className="w-8 h-8 text-[#333333] mx-auto mb-2" />
                <p className="text-xs text-[#888888]">No intelligence links generated yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {warRoomLinks.map((link) => (
                  <div key={link.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#E8E8E8] font-medium truncate">{link.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#888888]">{link.client}</span>
                        <span className="text-[10px] text-[#444444]">·</span>
                        <span className="text-[10px] text-[#666666]">{timeAgo(link.created)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <code className="text-[10px] text-[#666666] max-w-[200px] truncate hidden sm:block">{link.url}</code>
                      <button
                        onClick={() => handleCopyLink(link.url)}
                        className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#666666] hover:text-[#E8E8E8]"
                        title="Copy link"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Acquisition Module */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A]">
              <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#FDBA2D]" /> Client Acquisition — Gap Analysis
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#888888]">AI-powered gap analysis identifies under-served niches and potential client targets based on your agency&apos;s strengths.</p>
              <button className="px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #FDBA2D, #E09100)' }}>
                <Cpu className="w-4 h-4" /> Generate Acquisition Report
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Identified Gaps', value: '12', color: '#FDBA2D' },
                  { label: 'Potential Clients', value: '28', color: '#4A9EFF' },
                  { label: 'Est. Revenue Potential', value: '$84K/mo', color: '#10B981' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-center">
                    <p className="text-[10px] text-[#666666]">{stat.label}</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          REPORTS TAB
          ═══════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Reports */}
            <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#9B72CF]" /> Recent Reports
                </h3>
                <span className="text-[10px] text-[#666666]">{MOCK_REPORTS.length} reports</span>
              </div>
              <div className="divide-y divide-[#1A1A1A]">
                {MOCK_REPORTS.map((r) => {
                  const badge = reportTypeBadge(r.type);
                  return (
                    <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E8E8E8] font-medium truncate">{r.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[#888888]">{r.client}</span>
                          <span className="text-[10px] text-[#444444]">·</span>
                          <span className="text-[10px] text-[#666666]">{timeAgo(r.date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.icon} {r.type}
                        </span>
                        <button className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#666666] hover:text-[#E8E8E8]" title="Download">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Activity */}
            <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#10B981]" /> Team Activity
                </h3>
                <span className="text-[10px] text-[#666666]">Recent</span>
              </div>
              <div className="divide-y divide-[#1A1A1A] max-h-80 overflow-y-auto">
                {MOCK_ACTIVITY.map((a) => (
                  <div key={a.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: `${a.color}20`, border: `1.5px solid ${a.color}40`, color: a.color }}>
                      {a.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#E8E8E8]">
                        <span className="font-medium">{a.user}</span>{' '}
                        <span className="text-[#888888]">{a.action}</span>{' '}
                        <span className="text-[#4A9EFF] font-medium">{a.target}</span>
                      </p>
                      <p className="text-[10px] text-[#666666] mt-0.5">{timeAgo(a.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-[#E8E8E8] mb-3 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#FDBA2D]" /> Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#10B981]/30 hover:bg-[rgba(16,185,129,0.03)] transition-all group text-left">
                <div className="p-2 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
                  <UserPlus className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#E8E8E8] group-hover:text-[#10B981] transition-colors">Add New Client</p>
                  <p className="text-[10px] text-[#666666]">Onboard a new channel</p>
                </div>
                <Plus className="w-4 h-4 text-[#444444] group-hover:text-[#10B981] transition-colors" />
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#4A9EFF]/30 hover:bg-[rgba(74,158,255,0.03)] transition-all group text-left">
                <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)] border border-[rgba(74,158,255,0.2)]">
                  <FileBarChart className="w-4 h-4 text-[#4A9EFF]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#E8E8E8] group-hover:text-[#4A9EFF] transition-colors">Generate Bulk Report</p>
                  <p className="text-[10px] text-[#666666]">All channels at once</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#444444] group-hover:text-[#4A9EFF] transition-colors" />
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#FDBA2D]/30 hover:bg-[rgba(253,186,45,0.03)] transition-all group text-left">
                <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)]">
                  <FolderOutput className="w-4 h-4 text-[#FDBA2D]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#E8E8E8] group-hover:text-[#FDBA2D] transition-colors">Export Fleet Data</p>
                  <p className="text-[10px] text-[#666666]">CSV / PDF export</p>
                </div>
                <Download className="w-4 h-4 text-[#444444] group-hover:text-[#FDBA2D] transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          COMMAND BAR (always visible)
          ═══════════════════════════════════════ */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1A1A1A]">
          <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-[#9B72CF]" /> Command Bar
          </h3>
        </div>
        <div className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B72CF] font-mono text-sm font-bold">/</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                placeholder="compare ClientA ClientB  |  report-all"
                className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#222222] text-[#E8E8E8] text-sm font-mono placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/40 transition-all"
              />
            </div>
            <button
              onClick={handleCommand}
              disabled={!commandInput.trim()}
              className="px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ background: commandInput.trim() ? '#9B72CF' : '#333333' }}
            >
              <Send className="w-4 h-4" /> Run
            </button>
          </div>
          {commandOutput && (
            <div className="mt-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs text-[#AAAAAA] whitespace-pre-wrap font-mono leading-relaxed">{commandOutput}</pre>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {['/compare TechVision EduTech', '/report-all'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => { setCommandInput(cmd); }}
                className="px-2.5 py-1 rounded-full bg-[#0D0D0D] border border-[#1A1A1A] text-[10px] text-[#888888] hover:text-[#9B72CF] hover:border-[#9B72CF]/20 transition-all font-mono"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Token Cost Footer */}
      <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['agency-dashboard']} tokens per dashboard load</div>
    </div>
  );
}
