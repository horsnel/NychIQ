'use client';

import React, { useMemo } from 'react';
import { useNychIQStore, PLAN_TOKENS, PLAN_ACCESS, TOOL_META, TOKEN_COSTS, type Plan } from '@/lib/store';
import { StatCard } from '@/components/nychiq/stat-card';
import { TokenPill } from '@/components/nychiq/token-pill';
import { cn, timeAgo } from '@/lib/utils';
import {
  Search, Zap, TrendingUp, Eye, Heart, Coins,
  Flame, BarChart3, ArrowRight, Crown, Sparkles,
} from 'lucide-react';

/* ── Welcome Banner ── */
function WelcomeBanner() {
  const { userName, userPlan, tokenBalance, totalTokensSpent, signupTimestamp } = useNychIQStore();
  const planLabel = userPlan.charAt(0).toUpperCase() + userPlan.slice(1);
  const maxTokens = PLAN_TOKENS[userPlan];
  const usagePct = maxTokens > 0 ? Math.round(((maxTokens - tokenBalance) / maxTokens) * 100) : 0;

  // Days since signup
  const daysSinceSignup = Math.floor((Date.now() - signupTimestamp) / (1000 * 60 * 60 * 24));

  return (
    <div
      className="rounded-lg overflow-hidden p-6 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(253,186,45,0.12) 0%, rgba(253,186,45,0.04) 50%, rgba(139,92,246,0.06) 100%)',
        border: '1px solid rgba(253,186,45,0.2)',
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FDBA2D]/5 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-1/2 w-48 h-24 rounded-full bg-[#8B5CF6]/5 translate-y-1/2" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF] mb-1">
            Welcome back, {userName || 'Creator'}!
          </h2>
          <p className="text-sm text-[#A3A3A3]">
            {userPlan === 'trial' ? 'You\'re on a free trial. Upgrade for access to 40+ tools.' :
              `Day ${daysSinceSignup} on NychIQ · ${usagePct}% tokens used this cycle.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
              userPlan === 'trial' && 'bg-[#FDBA2D]/15 text-[#FDBA2D] border border-[#FDBA2D]/30',
              userPlan === 'starter' && 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30',
              userPlan === 'pro' && 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30',
              userPlan === 'elite' && 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30',
              userPlan === 'agency' && 'bg-[#EF4444]/15 text-[#EF4444] border border-[#E05252]/30',
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

/* ── Stats Row — real data from store ── */
function StatsRow() {
  const { tokenBalance, totalTokensSpent, tokensEarned, tokenHistory, userPlan } = useNychIQStore();

  // Compute real stats from token history
  const toolsUsedCount = useMemo(() => {
    const tools = new Set(tokenHistory.filter((t) => t.type === 'spend').map((t) => t.tool));
    return tools.size;
  }, [tokenHistory]);

  const weekSpent = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return tokenHistory
      .filter((t) => t.type === 'spend' && t.time >= weekAgo)
      .reduce((sum, t) => sum + t.tokens, 0);
  }, [tokenHistory]);

  const monthSpent = useMemo(() => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return tokenHistory
      .filter((t) => t.type === 'spend' && t.time >= monthAgo)
      .reduce((sum, t) => sum + t.tokens, 0);
  }, [tokenHistory]);

  const maxTokens = PLAN_TOKENS[userPlan];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      <StatCard
        label="Tools Used"
        value={String(toolsUsedCount)}
        change={`${PLAN_ACCESS[userPlan]?.length ?? 0} available`}
        color="#10B981"
        dark
        icon={<Zap className="w-4 h-4" />}
      />
      <StatCard
        label="Tokens This Week"
        value={String(weekSpent)}
        change={weekSpent > 0 ? 'Active' : 'Start exploring'}
        color="#FDBA2D"
        dark
        icon={<Flame className="w-4 h-4" />}
      />
      <StatCard
        label="Total Spent (All Time)"
        value={totalTokensSpent.toLocaleString()}
        change={`${monthSpent} this month`}
        color="#3B82F6"
        dark
        icon={<BarChart3 className="w-4 h-4" />}
      />
      <StatCard
        label="Tokens Earned"
        value={tokensEarned.toLocaleString()}
        change={maxTokens > 0 ? `${maxTokens - tokenBalance} used` : 'Bonus tokens'}
        color="#8B5CF6"
        dark
        icon={<Heart className="w-4 h-4" />}
      />
      <StatCard
        label="Tokens Left"
        value={userPlan === 'elite' ? '∞' : tokenBalance}
        change={tokenBalance < 10 ? 'Low balance' : userPlan === 'elite' ? 'Unlimited' : undefined}
        changeType={tokenBalance < 10 ? 'down' : 'up'}
        color={tokenBalance < 10 ? '#EF4444' : '#FDBA2D'}
        dark
        icon={<Coins className="w-4 h-4" />}
      />
    </div>
  );
}

/* ── Quick Actions ── */
function QuickActions() {
  const { setActiveTool, userPlan, tokenBalance } = useNychIQStore();

  const actions = [
    {
      label: 'Analyze a Video',
      icon: <Search className="w-5 h-5" />,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.2)',
      tool: 'search',
      available: true,
    },
    {
      label: 'Get Viral Score',
      icon: <Zap className="w-5 h-5" />,
      color: '#FDBA2D',
      bg: 'rgba(253,186,45,0.1)',
      border: 'rgba(253,186,45,0.2)',
      tool: 'viral',
      available: true,
    },
    {
      label: 'Trending Now',
      icon: <TrendingUp className="w-5 h-5" />,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)',
      tool: 'trending',
      available: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action.tool}
          onClick={() => setActiveTool(action.tool)}
          className="group flex items-center gap-3 p-4 rounded-lg border border-[#1F1F1F] bg-[#141414] hover:bg-[#0D0D0D] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 text-left"
          style={{ '--hover-border': action.border } as React.CSSProperties}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = action.border; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#1F1F1F'; }}
        >
          <div className="p-2.5 rounded-lg transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: action.bg, color: action.color }}>
            {action.icon}
          </div>
          <span className="text-sm font-medium text-[#FFFFFF] group-hover:text-[#FDBA2D] transition-colors">{action.label}</span>
          <ArrowRight className="w-4 h-4 text-[#444444] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  );
}

/* ── Activity Feed — real token history ── */
function ActivityFeed() {
  const { tokenHistory, userPlan, tokenBalance } = useNychIQStore();

  // Build activity feed from token history
  const feedItems = useMemo(() => {
    const items: Array<{
      icon: string;
      text: string;
      time: string;
      color: string;
    }> = [];

    // Take last 6 transactions
    const recent = tokenHistory.slice(0, 6);
    for (const txn of recent) {
      const toolLabel = TOOL_META[txn.tool]?.label ?? txn.tool;
      const txnType = txn.type;
      const timeStr = timeAgo(String(txn.time));

      switch (txnType) {
        case 'spend':
          items.push({
            icon: '⚡',
            text: `Used ${txn.tokens} token${txn.tokens !== 1 ? 's' : ''} on ${toolLabel}`,
            time: timeStr,
            color: '#FDBA2D',
          });
          break;
        case 'earn':
          items.push({
            icon: '🎁',
            text: `Earned ${txn.tokens} bonus tokens from ${txn.tool}`,
            time: timeStr,
            color: '#10B981',
          });
          break;
        case 'reset':
          items.push({
            icon: '🔄',
            text: 'Monthly free token reset applied',
            time: timeStr,
            color: '#8B5CF6',
          });
          break;
        case 'bonus':
          items.push({
            icon: '⬆️',
            text: `Plan upgrade: ${txn.tool} — ${txn.tokens} tokens added`,
            time: timeStr,
            color: '#3B82F6',
          });
          break;
        default:
          items.push({
            icon: '📊',
            text: `${txnType}: ${toolLabel} — ${txn.tokens} tokens`,
            time: timeStr,
            color: '#A3A3A3',
          });
      }
    }
    return items;
  }, [tokenHistory]);

  // If no history, show welcome items
  if (feedItems.length === 0) {
    return (
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Activity</h3>
          </div>
        </div>
        <div className="p-8 text-center">
          <Sparkles className="w-8 h-8 text-[#333333] mx-auto mb-2" />
          <p className="text-sm text-[#666666]">Your activity feed will appear here as you use tools.</p>
          <p className="text-xs text-[#555555] mt-1">Start exploring NychIQ tools to see your history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Recent Activity</h3>
          <span className="px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.1)] text-[10px] font-bold text-[#10B981]">
            LIVE
          </span>
        </div>
      </div>
      <div className="divide-y divide-[#1A1A1A] max-h-80 overflow-y-auto">
        {feedItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[#0D0D0D]/50 transition-colors">
            <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#FFFFFF]">{item.text}</p>
              <span className="text-[11px] text-[#666666]">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Growth Chart — based on real weekly spend ── */
function GrowthChart() {
  const { tokenHistory, signupTimestamp } = useNychIQStore();

  // Compute daily spending for last 7 days
  const dailyData = useMemo(() => {
    const days: number[] = [0, 0, 0, 0, 0, 0, 0];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    tokenHistory
      .filter((t) => t.type === 'spend' && t.time >= weekAgo)
      .forEach((t) => {
        const dayIdx = Math.min(6, Math.floor((Date.now() - t.time) / (24 * 60 * 60 * 1000)));
        days[6 - dayIdx] += t.tokens;
      });
    return days;
  }, [tokenHistory, signupTimestamp]);

  const maxVal = Math.max(...dailyData, 1) * 1.2;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay(); // 0=Sun
  // Reorder days so today is last
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
  const orderedDays = dayOrder.map((d) => days[d]);
  const orderedData = dayOrder.map((d, i) => dailyData[i]);

  // Week change
  const firstHalf = orderedData.slice(0, 3).reduce((s, v) => s + v, 0);
  const secondHalf = orderedData.slice(4).reduce((s, v) => s + v, 0);
  const weekChange = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

  const width = 400;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 28, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = orderedData.map((v, i) => ({
    x: padding.left + (i / (orderedData.length - 1)) * chartW,
    y: padding.top + chartH - (v / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const fmtShort = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    if (n === 0) return '0';
    return String(n);
  };

  return (
    <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
      <h3 className="text-sm font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[#3B82F6]" />
        Token Usage This Week
        <span className="ml-auto text-[10px] font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
          {weekChange >= 0 ? '↑' : '↓'} {Math.abs(weekChange)}%
        </span>
      </h3>
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="dashAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDBA2D" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FDBA2D" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = padding.top + chartH * (1 - frac);
            const val = maxVal * frac;
            return (
              <g key={frac}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1A1A1A" strokeWidth="1" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[9px]" fill="#555555">
                  {fmtShort(val)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#dashAreaGrad)" />
          <path d={linePath} fill="none" stroke="#FDBA2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill="#0D0D0D" stroke="#FDBA2D" strokeWidth="2" />
              <text x={p.x} y={height - 6} textAnchor="middle" className="text-[10px]" fill="#A3A3A3">
                {orderedDays[i]}
              </text>
            </g>
          ))}
        </svg>
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
        background: 'linear-gradient(135deg, rgba(253,186,45,0.15) 0%, rgba(139,92,246,0.1) 100%)',
        border: '1px solid rgba(253,186,45,0.25)',
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#FDBA2D]/5 -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#FDBA2D]/10 shrink-0">
            <Crown className="w-5 h-5 text-[#FDBA2D]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FFFFFF] mb-1">Upgrade to Pro</h3>
            <p className="text-sm text-[#A3A3A3]">
              Unlock Rankings, Shorts Intel, Niche Spy and 25+ more tools
            </p>
          </div>
        </div>
        <button
          onClick={() => setUpgradeModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors shrink-0"
        >
          UPGRADE NOW
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export function DashboardTool() {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <WelcomeBanner />
      <StatsRow />
      <QuickActions />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityFeed />
        <div className="space-y-5">
          <UpgradeBanner />
          <GrowthChart />
        </div>
      </div>
    </div>
  );
}
