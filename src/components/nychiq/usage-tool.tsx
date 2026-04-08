'use client';

import React from 'react';
import { useNychIQStore, PLAN_TOKENS, type Plan } from '@/lib/store';
import {
  Coins,
  Crown,
  Sparkles,
  SearchCode,
  TrendingUp,
  BarChart3,
  Zap,
  Bot,
  BrainCircuit,
  DollarSign,
  Users,
  Crosshair,
  Key,
  Anchor,
  Lightbulb,
  Clock,
  FileText,
  ClipboardCheck,
  GitCompare,
  Activity,
  Image as ImageIcon,
  ShieldCheck,
  BellRing,
  Radar,
  Cpu,
  Film,
  History,
  Gift,
  Check,
} from 'lucide-react';

/* ── Plan badge config ── */
const PLAN_STYLES: Record<Plan, { label: string; color: string }> = {
  trial: { label: 'Free Trial', color: '#888888' },
  starter: { label: 'Starter', color: '#4A9EFF' },
  pro: { label: 'Pro', color: '#F5A623' },
  elite: { label: 'Elite', color: '#9B72CF' },
  agency: { label: 'Agency', color: '#00C48C' },
};

/* ── Icon map for tools ── */
const TOOL_ICONS: Record<string, React.ReactNode> = {
  'Trending': <TrendingUp className="w-4 h-4 text-[#E05252]" />,
  'Search': <SearchCode className="w-4 h-4 text-[#4A9EFF]" />,
  'Rankings': <BarChart3 className="w-4 h-4 text-[#9B72CF]" />,
  'Viral Predictor': <Zap className="w-4 h-4 text-[#F5A623]" />,
  'Saku AI': <Bot className="w-4 h-4 text-[#00C48C]" />,
  'Algorithm': <BrainCircuit className="w-4 h-4 text-[#F5A623]" />,
  'CPM Estimator': <DollarSign className="w-4 h-4 text-[#4A9EFF]" />,
  'Track Channels': <Users className="w-4 h-4 text-[#9B72CF]" />,
  'Niche Spy': <Crosshair className="w-4 h-4 text-[#E05252]" />,
  'SEO Optimizer': <SearchCode className="w-4 h-4 text-[#00C48C]" />,
  'Hook Generator': <Anchor className="w-4 h-4 text-[#F5A623]" />,
  'Keyword Explorer': <Key className="w-4 h-4 text-[#4A9EFF]" />,
  'Script Writer': <FileText className="w-4 h-4 text-[#9B72CF]" />,
  'Video Ideas': <Lightbulb className="w-4 h-4 text-[#F5A623]" />,
  'Best Post Time': <Clock className="w-4 h-4 text-[#00C48C]" />,
  'Channel Audit': <ClipboardCheck className="w-4 h-4 text-[#E05252]" />,
  'A/B Tester': <GitCompare className="w-4 h-4 text-[#4A9EFF]" />,
  'VPH Tracker': <Activity className="w-4 h-4 text-[#9B72CF]" />,
  'Thumbnail Lab': <ImageIcon className="w-4 h-4 text-[#F5A623]" />,
  'Safe Check': <ShieldCheck className="w-4 h-4 text-[#00C48C]" />,
  'Trend Alerts': <BellRing className="w-4 h-4 text-[#E05252]" />,
  'Outlier Scout': <Radar className="w-4 h-4 text-[#4A9EFF]" />,
  'Automation': <Cpu className="w-4 h-4 text-[#9B72CF]" />,
  'Shorts': <Film className="w-4 h-4 text-[#F5A623]" />,
  'History Intel': <History className="w-4 h-4 text-[#00C48C]" />,
};

/* ── Mock usage breakdown data (15 tools) ── */
const MOCK_USAGE_DATA = [
  { tool: 'Trending', uses: 24, tokens: 72, avgCost: 3.0 },
  { tool: 'Viral Predictor', uses: 18, tokens: 18, avgCost: 1.0 },
  { tool: 'SEO Optimizer', uses: 12, tokens: 60, avgCost: 5.0 },
  { tool: 'Saku AI', uses: 35, tokens: 35, avgCost: 1.0 },
  { tool: 'Best Post Time', uses: 8, tokens: 40, avgCost: 5.0 },
  { tool: 'Trend Alerts', uses: 15, tokens: 45, avgCost: 3.0 },
  { tool: 'Hook Generator', uses: 6, tokens: 48, avgCost: 8.0 },
  { tool: 'Video Ideas', uses: 5, tokens: 30, avgCost: 6.0 },
  { tool: 'A/B Tester', uses: 4, tokens: 32, avgCost: 8.0 },
  { tool: 'Rankings', uses: 10, tokens: 20, avgCost: 2.0 },
  { tool: 'Algorithm', uses: 7, tokens: 21, avgCost: 3.0 },
  { tool: 'Niche Spy', uses: 5, tokens: 40, avgCost: 8.0 },
  { tool: 'Keyword Explorer', uses: 9, tokens: 18, avgCost: 2.0 },
  { tool: 'Channel Audit', uses: 3, tokens: 60, avgCost: 20.0 },
  { tool: 'Shorts', uses: 8, tokens: 40, avgCost: 5.0 },
];

/* ── Category breakdown ── */
const CATEGORY_DATA = [
  { label: 'Intelligence', tokens: 189, total: 539, color: '#F5A623' },
  { label: 'AI Tools', tokens: 283, total: 539, color: '#4A9EFF' },
  { label: 'Social Intel', tokens: 67, total: 539, color: '#9B72CF' },
];

/* ── Mock token history ── */
const MOCK_HISTORY = [
  { tool: 'Trend Alerts', icon: <BellRing className="w-4 h-4 text-[#E05252]" />, tokens: 3, time: '5 min ago' },
  { tool: 'SEO Optimizer', icon: <SearchCode className="w-4 h-4 text-[#00C48C]" />, tokens: 5, time: '1h ago' },
  { tool: 'Viral Predictor', icon: <Zap className="w-4 h-4 text-[#F5A623]" />, tokens: 1, time: '2h ago' },
  { tool: 'Best Post Time', icon: <Clock className="w-4 h-4 text-[#00C48C]" />, tokens: 5, time: '4h ago' },
  { tool: 'Hook Generator', icon: <Anchor className="w-4 h-4 text-[#F5A623]" />, tokens: 8, time: '6h ago' },
  { tool: 'Saku AI', icon: <Bot className="w-4 h-4 text-[#00C48C]" />, tokens: 1, time: '8h ago' },
  { tool: 'Channel Audit', icon: <ClipboardCheck className="w-4 h-4 text-[#E05252]" />, tokens: 20, time: '1d ago' },
  { tool: 'Keyword Explorer', icon: <Key className="w-4 h-4 text-[#4A9EFF]" />, tokens: 2, time: '1d ago' },
];

/* ── Top-up plans ── */
const TOPUP_PLANS = [
  { price: '₦5,000', tokens: 500, bonus: 0, popular: false },
  { price: '₦20,000', tokens: 2200, bonus: 200, popular: true },
  { price: '₦50,000', tokens: 6000, bonus: 1000, popular: false },
];

export function UsageTool() {
  const { tokenBalance, tokensEarned, userPlan, setTokenModalOpen } = useNychIQStore();

  const planStyle = PLAN_STYLES[userPlan];
  const totalTokens = PLAN_TOKENS[userPlan];
  const totalUsed = totalTokens - tokenBalance;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ── Header Card ── */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
              <Coins className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Token Usage</h2>
              <p className="text-xs text-[#888888] mt-0.5">Track how you spend tokens across all tools.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Stats (3 columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Used */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[rgba(245,166,35,0.1)] flex items-center justify-center">
              <Coins className="w-4 h-4 text-[#F5A623]" />
            </div>
          </div>
          <p className="text-xs text-[#666666]">Total Tokens Used</p>
          <p className="text-xl font-bold text-[#E8E8E8] mt-0.5">{totalUsed.toLocaleString()}</p>
        </div>

        {/* Remaining */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[rgba(0,196,140,0.1)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#00C48C]" />
            </div>
          </div>
          <p className="text-xs text-[#666666]">Remaining Balance</p>
          <p className="text-xl font-bold text-[#00C48C] mt-0.5">{tokenBalance.toLocaleString()}</p>
        </div>

        {/* Current Plan */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[rgba(155,114,207,0.1)] flex items-center justify-center">
              <Crown className="w-4 h-4 text-[#9B72CF]" />
            </div>
          </div>
          <p className="text-xs text-[#666666]">Current Plan</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: planStyle.color }}>{planStyle.label}</p>
        </div>
      </div>

      {/* ── Usage Breakdown Table ── */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Usage Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left text-[10px] font-bold text-[#666666] uppercase tracking-wider pb-2 pr-4">Tool</th>
                <th className="text-right text-[10px] font-bold text-[#666666] uppercase tracking-wider pb-2 px-4">Uses</th>
                <th className="text-right text-[10px] font-bold text-[#666666] uppercase tracking-wider pb-2 px-4">Tokens</th>
                <th className="text-right text-[10px] font-bold text-[#666666] uppercase tracking-wider pb-2 pl-4">Avg Cost</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USAGE_DATA.map((row, i) => (
                <tr
                  key={row.tool}
                  className={`border-b border-[#1A1A1A]/50 last:border-b-0 hover:bg-[#0D0D0D] transition-colors ${i % 2 === 0 ? '' : ''}`}
                >
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                        {TOOL_ICONS[row.tool] || <Coins className="w-3.5 h-3.5 text-[#666666]" />}
                      </div>
                      <span className="text-sm text-[#E8E8E8]">{row.tool}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="text-sm text-[#888888]">{row.uses}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="text-sm font-medium text-[#F5A623]">{row.tokens}</span>
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <span className="text-sm text-[#888888]">{row.avgCost.toFixed(1)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
          <span className="text-xs text-[#666666]">Showing {MOCK_USAGE_DATA.length} tools</span>
          <span className="text-xs text-[#666666]">
            Total: <span className="text-[#F5A623] font-bold">{MOCK_USAGE_DATA.reduce((s, r) => s + r.tokens, 0).toLocaleString()}</span> tokens
          </span>
        </div>
      </div>

      {/* ── Usage by Category ── */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-4">Usage by Category</h4>
        <div className="space-y-4">
          {CATEGORY_DATA.map((cat) => {
            const pct = cat.total > 0 ? Math.round((cat.tokens / cat.total) * 100) : 0;
            return (
              <div key={cat.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#E8E8E8]">{cat.label}</span>
                  <span className="text-xs text-[#888888]">
                    <span className="font-medium" style={{ color: cat.color }}>{cat.tokens}</span> tokens ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#0D0D0D] border border-[#1A1A1A] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Token History ── */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Recent Transactions</h4>
          <span className="text-[10px] text-[#666666]">Last 7 days</span>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {MOCK_HISTORY.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-[#111111] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#E8E8E8] truncate">{item.tool}</p>
                <p className="text-[10px] text-[#666666]">{item.time}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Coins className="w-3 h-3 text-[#F5A623]" />
                <span className="text-sm font-bold text-[#E05252]">-{item.tokens}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Buy More Tokens ── */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
            <Gift className="w-4 h-4 text-[#F5A623]" />
          </div>
          <h4 className="text-sm font-bold text-[#E8E8E8]">Buy More Tokens</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TOPUP_PLANS.map((plan) => (
            <div
              key={plan.price}
              className={`relative rounded-lg p-4 text-center transition-all cursor-pointer hover:border-[#F5A623]/50 ${
                plan.popular
                  ? 'bg-[#0D0D0D] border-2 border-[#F5A623]/50'
                  : 'bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#333333]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#F5A623] text-[10px] font-bold text-[#0A0A0A] uppercase tracking-wider">
                  Popular
                </div>
              )}
              <p className="text-lg font-bold text-[#E8E8E8]">{plan.price}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Coins className="w-3.5 h-3.5 text-[#F5A623]" />
                <span className="text-base font-bold text-[#F5A623]">{plan.tokens.toLocaleString()}</span>
                <span className="text-xs text-[#888888]">tokens</span>
              </div>
              {plan.bonus > 0 && (
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)]">
                  <Check className="w-3 h-3 text-[#00C48C]" />
                  <span className="text-[10px] font-bold text-[#00C48C]">+{plan.bonus} bonus</span>
                </div>
              )}
              <button
                onClick={() => setTokenModalOpen(true)}
                className={`w-full mt-3 py-2 rounded-md text-xs font-bold transition-colors ${
                  plan.popular
                    ? 'bg-[#F5A623] text-[#0A0A0A] hover:bg-[#E6960F]'
                    : 'bg-[#1A1A1A] text-[#E8E8E8] border border-[#222222] hover:border-[#F5A623]/50'
                }`}
              >
                Get Tokens
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
