'use client';

import React from 'react';
import { useNychIQStore } from '@/lib/store';
import { StatCard } from '@/components/nychiq/stat-card';
import { TokenPill } from '@/components/nychiq/token-pill';
import { cn } from '@/lib/utils';
import {
  Search,
  Zap,
  TrendingUp,
  Eye,
  Heart,
  Coins,
  Flame,
  BarChart3,
  ArrowRight,
  Crown,
  Lock,
} from 'lucide-react';

/* ── Welcome Banner ── */
function WelcomeBanner() {
  const { userName, userPlan, tokenBalance } = useNychIQStore();
  const planLabel = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);

  return (
    <div
      className="rounded-lg overflow-hidden p-6 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0.04) 50%, rgba(155,114,207,0.06) 100%)',
        border: '1px solid rgba(245,166,35,0.2)',
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#F5A623]/5 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-1/2 w-48 h-24 rounded-full bg-[#9B72CF]/5 translate-y-1/2" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#E8E8E8] mb-1">
            Welcome back, {userName || 'Creator'}!
          </h2>
          <p className="text-sm text-[#888888]">
            Your channel is performing above average this week. Keep up the momentum!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
              userPlan === 'trial' && 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30',
              userPlan === 'starter' && 'bg-[#4A9EFF]/15 text-[#4A9EFF] border border-[#4A9EFF]/30',
              userPlan === 'pro' && 'bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30',
              userPlan === 'elite' && 'bg-[#9B72CF]/15 text-[#9B72CF] border border-[#9B72CF]/30',
              userPlan === 'agency' && 'bg-[#E05252]/15 text-[#E05252] border border-[#E05252]/30',
            )}
          >
            {planLabel}
          </span>
          <TokenPill />
        </div>
      </div>
    </div>
  );
}

/* ── Stats Row ── */
function StatsRow() {
  const { tokenBalance } = useNychIQStore();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      <StatCard
        label="Videos Tracked"
        value="1,247"
        change="↑ 12%"
        color="#00C48C"
        dark
        icon={<Eye className="w-4 h-4" />}
      />
      <StatCard
        label="Viral Score"
        value="87/99"
        change="↑ 5%"
        color="#F5A623"
        dark
        icon={<Zap className="w-4 h-4" />}
      />
      <StatCard
        label="Views Today"
        value="24.5K"
        change="↑ 8%"
        color="#4A9EFF"
        dark
        icon={<Eye className="w-4 h-4" />}
      />
      <StatCard
        label="Engagement Rate"
        value="6.8%"
        change="↑ 15%"
        color="#9B72CF"
        dark
        icon={<Heart className="w-4 h-4" />}
      />
      <StatCard
        label="Tokens Left"
        value={tokenBalance}
        change={tokenBalance < 10 ? 'Low balance' : undefined}
        changeType={tokenBalance < 10 ? 'down' : 'up'}
        color={tokenBalance < 10 ? '#E05252' : '#F5A623'}
        dark
        icon={<Coins className="w-4 h-4" />}
      />
    </div>
  );
}

/* ── Quick Actions ── */
function QuickActions() {
  const { setActiveTool } = useNychIQStore();

  const actions = [
    {
      label: 'Analyze a Video',
      icon: <Search className="w-5 h-5" />,
      color: '#4A9EFF',
      bg: 'rgba(74,158,255,0.1)',
      border: 'rgba(74,158,255,0.2)',
      tool: 'search',
    },
    {
      label: 'Get Viral Score',
      icon: <Zap className="w-5 h-5" />,
      color: '#F5A623',
      bg: 'rgba(245,166,35,0.1)',
      border: 'rgba(245,166,35,0.2)',
      tool: 'viral',
    },
    {
      label: 'Trending Now',
      icon: <TrendingUp className="w-5 h-5" />,
      color: '#00C48C',
      bg: 'rgba(0,196,140,0.1)',
      border: 'rgba(0,196,140,0.2)',
      tool: 'trending',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action.tool}
          onClick={() => setActiveTool(action.tool)}
          className="group flex items-center gap-3 p-4 rounded-lg border border-[#222222] bg-[#111111] hover:bg-[#0D0D0D] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 text-left"
          style={{
            '--hover-border': action.border,
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = action.border;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#222222';
          }}
        >
          <div
            className="p-2.5 rounded-lg transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: action.bg, color: action.color }}
          >
            {action.icon}
          </div>
          <span className="text-sm font-medium text-[#E8E8E8] group-hover:text-[#F5A623] transition-colors">
            {action.label}
          </span>
          <ArrowRight className="w-4 h-4 text-[#444444] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  );
}

/* ── Activity Feed ── */
const ACTIVITY_ITEMS = [
  { icon: '🔥', text: "'AI Nigeria 2026' trending +5,000%", time: '2m ago', color: '#00C48C' },
  { icon: '📈', text: 'Your engagement rate up 15% this week', time: '1h ago', color: '#4A9EFF' },
  { icon: '⚡', text: 'New viral score: 94/99', time: '3h ago', color: '#F5A623' },
  { icon: '🤖', text: 'Saku AI: Monetization tip ready', time: '5h ago', color: '#9B72CF' },
  { icon: '🎯', text: 'Top video: "React in 2025" reached 50K views', time: '8h ago', color: '#00C48C' },
  { icon: '📊', text: 'Weekly report generated successfully', time: '1d ago', color: '#888888' },
];

function ActivityFeed() {
  return (
    <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Live Activity</h3>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00C48C]/10 text-[10px] font-bold text-[#00C48C]">
            <span className="live-dot" />
            LIVE
          </span>
        </div>
      </div>
      <div className="divide-y divide-[#1A1A1A] max-h-80 overflow-y-auto">
        {ACTIVITY_ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3 hover:bg-[#0D0D0D]/50 transition-colors"
          >
            <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#E8E8E8]">{item.text}</p>
              <span className="text-[11px] text-[#666666]">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Upgrade Banner ── */
function UpgradeBanner() {
  const { userPlan, setUpgradeModalOpen } = useNychIQStore();

  if (userPlan !== 'trial') return null;

  return (
    <div
      className="rounded-lg overflow-hidden p-5 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(155,114,207,0.1) 100%)',
        border: '1px solid rgba(245,166,35,0.25)',
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#F5A623]/5 -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#F5A623]/10 shrink-0">
            <Crown className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#E8E8E8] mb-1">Upgrade to Pro</h3>
            <p className="text-sm text-[#888888]">
              Unlock Rankings, Shorts Intel, Niche Spy and 25+ more tools
            </p>
          </div>
        </div>
        <button
          onClick={() => setUpgradeModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors shrink-0"
        >
          UPGRADE NOW
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


/* ── Main Dashboard Tool ── */
export function DashboardTool() {
    return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Stats Row */}
      <StatsRow />

      {/* Quick Actions */}
      <QuickActions />

      {/* Bottom section: Activity Feed + Upgrade Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityFeed />
        <div className="space-y-5">
          <UpgradeBanner />
          {/* Recent Performance Card */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h3 className="text-sm font-semibold text-[#E8E8E8] mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#4A9EFF]" />
              Weekly Overview
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-[#0D0D0D]">
                <p className="text-lg font-bold text-[#E8E8E8]">127K</p>
                <p className="text-[11px] text-[#888888] mt-0.5">Total Views</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#0D0D0D]">
                <p className="text-lg font-bold text-[#E8E8E8]">3.2K</p>
                <p className="text-[11px] text-[#888888] mt-0.5">New Subs</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#0D0D0D]">
                <p className="text-lg font-bold text-[#E8E8E8]">$842</p>
                <p className="text-[11px] text-[#888888] mt-0.5">Est. Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
