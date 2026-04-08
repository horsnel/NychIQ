'use client';

import React, { useState, useEffect } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { fmtV, timeAgo, getInitials } from '@/lib/utils';
import {
  Building2,
  Crown,
  Lock,
  Loader2,
  Users,
  Eye,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Download,
  UserPlus,
  FileBarChart,
  FolderOutput,
  Activity,
  FileText,
  SearchCode,
  BarChart3,
  Calendar,
  Plus,
  ArrowUpRight,
  Shield,
  Zap,
} from 'lucide-react';

/* ── Types ── */
interface ClientChannel {
  id: string;
  name: string;
  initials: string;
  color: string;
  subscribers: number;
  videoCount: number;
  healthScore: number;
  lastAnalyzed: string;
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

/* ── Mock Data ── */
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
  },
  {
    id: 'ch-2',
    name: 'CookWithMaya',
    initials: 'CM',
    color: '#F5A623',
    subscribers: 1280000,
    videoCount: 578,
    healthScore: 87,
    lastAnalyzed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ch-3',
    name: 'FitnessForge',
    initials: 'FF',
    color: '#00C48C',
    subscribers: 320000,
    videoCount: 189,
    healthScore: 74,
    lastAnalyzed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ch-4',
    name: 'GameVault HQ',
    initials: 'GV',
    color: '#9B72CF',
    subscribers: 890000,
    videoCount: 421,
    healthScore: 81,
    lastAnalyzed: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_REPORTS: Report[] = [
  { id: 'r-1', name: 'Full Channel Audit', client: 'TechVision Pro', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'Audit' },
  { id: 'r-2', name: 'Growth Strategy Q4', client: 'CookWithMaya', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'Strategy' },
  { id: 'r-3', name: 'SEO Optimization Pack', client: 'GameVault HQ', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'SEO' },
  { id: 'r-4', name: 'Performance Audit', client: 'FitnessForge', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), type: 'Audit' },
];

const MOCK_ACTIVITY: TeamActivity[] = [
  { id: 'a-1', user: 'Sarah K.', initials: 'SK', color: '#4A9EFF', action: 'completed audit for', target: 'TechVision Pro', time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 'a-2', user: 'Mike R.', initials: 'MR', color: '#00C48C', action: 'generated SEO report for', target: 'CookWithMaya', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'a-3', user: 'Sarah K.', initials: 'SK', color: '#4A9EFF', action: 'added new client', target: 'GameVault HQ', time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'a-4', user: 'Alex T.', initials: 'AT', color: '#9B72CF', action: 'updated strategy for', target: 'FitnessForge', time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 'a-5', user: 'Mike R.', initials: 'MR', color: '#00C48C', action: 'exported data for', target: 'all channels', time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
];

/* ── Health score color ── */
function healthColor(score: number): string {
  if (score >= 85) return '#00C48C';
  if (score >= 70) return '#F5A623';
  return '#E05252';
}

function healthLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Work';
}

/* ── Report type badge ── */
function reportTypeBadge(type: Report['type']): { bg: string; text: string; border: string; icon: React.ReactNode } {
  switch (type) {
    case 'Audit':
      return { bg: 'bg-[rgba(224,82,82,0.1)]', text: 'text-[#E05252]', border: 'border-[rgba(224,82,82,0.2)]', icon: <Shield className="w-3 h-3" /> };
    case 'Strategy':
      return { bg: 'bg-[rgba(74,158,255,0.1)]', text: 'text-[#4A9EFF]', border: 'border-[rgba(74,158,255,0.2)]', icon: <TrendingUp className="w-3 h-3" /> };
    case 'SEO':
      return { bg: 'bg-[rgba(245,166,35,0.1)]', text: 'text-[#F5A623]', border: 'border-[rgba(245,166,35,0.2)]', icon: <SearchCode className="w-3 h-3" /> };
  }
}

/* ── Mini Health Circle SVG ── */
function HealthCircle({ score, size = 48, strokeWidth = 4 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = healthColor(score);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A1A1A" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}


/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
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

/* ── Main Component ── */
export function AgencyDashboardTool() {
  const { spendTokens } = useNychIQStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const ok = spendTokens('agency-dashboard');
      if (!ok) { setLoading(false); return; }

      // Simulate data loading
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
  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        {/* Loading skeleton - stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-md bg-[#1A1A1A] animate-pulse" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-20" />
              </div>
              <div className="h-6 bg-[#1A1A1A] rounded animate-pulse w-24 mb-1" />
              <div className="h-2.5 bg-[#1A1A1A] rounded animate-pulse w-16" />
            </div>
          ))}
        </div>
        {/* Loading skeleton - channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
        {/* Loading skeleton - reports & activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3 mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-[#1A1A1A] last:border-0">
                <div className="w-8 h-8 rounded-md bg-[#1A1A1A] animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3 mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-[#1A1A1A] last:border-0">
                <div className="w-7 h-7 rounded-full bg-[#1A1A1A] animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
                  <div className="h-2.5 bg-[#1A1A1A] rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(224,82,82,0.1)] border border-[rgba(224,82,82,0.2)] flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-[#E05252]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Failed to Load Dashboard</h3>
          <p className="text-sm text-[#888888] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-lg bg-[#E05252] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2"
          >
            <Loader2 className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Computed stats
  const totalViews = MOCK_CHANNELS.reduce((sum, ch) => sum + ch.subscribers * 12, 0); // Rough estimate
  const avgHealth = Math.round(MOCK_CHANNELS.reduce((sum, ch) => sum + ch.healthScore, 0) / MOCK_CHANNELS.length);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
              <Building2 className="w-5 h-5 text-[#9B72CF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Agency Dashboard</h2>
              <p className="text-xs text-[#888888] mt-0.5">Manage multiple channels, track clients, and generate reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Total Channels"
          value={String(MOCK_CHANNELS.length)}
          color="#9B72CF"
          sub="Active client channels"
        />
        <StatCard
          icon={Eye}
          label="Total Views"
          value={fmtV(totalViews)}
          color="#4A9EFF"
          sub="Across all channels"
        />
        <StatCard
          icon={BarChart3}
          label="Avg Viral Score"
          value={`${avgHealth}`}
          color="#00C48C"
          sub={avgHealth >= 85 ? 'Excellent' : avgHealth >= 70 ? 'Good' : 'Needs attention'}
        />
        <StatCard
          icon={DollarSign}
          label="Revenue This Month"
          value="$4,280"
          color="#F5A623"
          sub="+12.5% from last month"
        />
      </div>

      {/* Client Channels Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#9B72CF]" /> Client Channels
          </h3>
          <span className="text-[10px] text-[#666666]">{MOCK_CHANNELS.length} channels</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_CHANNELS.map((ch) => (
            <div key={ch.id} className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#333333] transition-colors group">
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: ch.color + '25', border: `2px solid ${ch.color}50`, color: ch.color }}
                  >
                    {ch.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#E8E8E8]">{ch.name}</p>
                    <p className="text-[11px] text-[#888888]">{fmtV(ch.subscribers)} subscribers</p>
                  </div>
                </div>
                <HealthCircle score={ch.healthScore} />
              </div>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2">
                  <p className="text-[10px] text-[#666666]">Videos</p>
                  <p className="text-sm font-semibold text-[#E8E8E8]">{ch.videoCount}</p>
                </div>
                <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2">
                  <p className="text-[10px] text-[#666666]">Health</p>
                  <p className="text-sm font-semibold" style={{ color: healthColor(ch.healthScore) }}>{healthLabel(ch.healthScore)}</p>
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#666666] flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" /> {timeAgo(ch.lastAnalyzed)}
                </span>
                <button className="text-[11px] text-[#9B72CF] hover:text-[#B08ADF] font-medium flex items-center gap-0.5 transition-colors group-hover:underline">
                  View Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-[#E8E8E8] mb-3 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-[#F5A623]" /> Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#00C48C]/30 hover:bg-[rgba(0,196,140,0.03)] transition-all group text-left">
            <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)]">
              <UserPlus className="w-4 h-4 text-[#00C48C]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#E8E8E8] group-hover:text-[#00C48C] transition-colors">Add New Client</p>
              <p className="text-[10px] text-[#666666]">Onboard a new channel</p>
            </div>
            <Plus className="w-4 h-4 text-[#444444] group-hover:text-[#00C48C] transition-colors" />
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#4A9EFF]/30 hover:bg-[rgba(74,158,255,0.03)] transition-all group text-left">
            <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)] border border-[rgba(74,158,255,0.2)]">
              <FileBarChart className="w-4 h-4 text-[#4A9EFF]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#E8E8E8] group-hover:text-[#4A9EFF] transition-colors">Generate Bulk Report</p>
              <p className="text-[10px] text-[#666666]">All channels at once</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#444444] group-hover:text-[#4A9EFF] transition-colors" />
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#F5A623]/30 hover:bg-[rgba(245,166,35,0.03)] transition-all group text-left">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)]">
              <FolderOutput className="w-4 h-4 text-[#F5A623]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#E8E8E8] group-hover:text-[#F5A623] transition-colors">Export All Data</p>
              <p className="text-[10px] text-[#666666]">CSV / PDF export</p>
            </div>
            <Download className="w-4 h-4 text-[#444444] group-hover:text-[#F5A623] transition-colors" />
          </button>
        </div>
      </div>

      {/* Recent Reports + Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Reports */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
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
                      <span className="text-[10px] text-[#444444]">•</span>
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
        <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00C48C]" /> Team Activity
            </h3>
            <span className="text-[10px] text-[#666666]">Recent</span>
          </div>
          <div className="divide-y divide-[#1A1A1A] max-h-80 overflow-y-auto">
            {MOCK_ACTIVITY.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: a.color + '20', border: `1.5px solid ${a.color}40`, color: a.color }}
                >
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

      {/* Token Cost */}
      <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.agency} tokens per dashboard load</div>
    </div>
  );
}


