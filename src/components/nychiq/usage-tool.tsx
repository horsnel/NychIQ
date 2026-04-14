'use client';

import React, { useMemo } from 'react';
import { useNychIQStore, PLAN_TOKENS, TOKEN_COSTS, TOOL_META, type Plan, type TokenTransaction } from '@/lib/store';
import {
  Coins,
  Crown,
  Sparkles,
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
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Star,
  CalendarDays,
} from 'lucide-react';

/* ── Plan badge config ── */
const PLAN_STYLES: Record<Plan, { label: string; color: string }> = {
  trial: { label: 'Free Trial', color: '#a0a0a0' },
  starter: { label: 'Starter', color: '#888888' },
  pro: { label: 'Pro', color: '#F6A828' },
  elite: { label: 'Elite', color: '#888888' },
  agency: { label: 'Agency', color: '#888888' },
};

/* ── Icon map for tools ── */
const TOOL_ICONS: Record<string, React.ReactNode> = {
  'Trending': <TrendingUp className="w-4 h-4 text-[#888888]" />,
  'Search': <Zap className="w-4 h-4 text-[#888888]" />,
  'Rankings': <BarChart3 className="w-4 h-4 text-[#888888]" />,
  'Viral Predictor': <Zap className="w-4 h-4 text-[#F6A828]" />,
  'Saku AI': <Bot className="w-4 h-4 text-[#888888]" />,
  'Algorithm': <BrainCircuit className="w-4 h-4 text-[#F6A828]" />,
  'CPM Estimator': <DollarSign className="w-4 h-4 text-[#888888]" />,
  'Track Channels': <Users className="w-4 h-4 text-[#888888]" />,
  'Niche Spy': <Crosshair className="w-4 h-4 text-[#888888]" />,
  'SEO Optimizer': <Zap className="w-4 h-4 text-[#888888]" />,
  'Hook Generator': <Anchor className="w-4 h-4 text-[#F6A828]" />,
  'Keyword Explorer': <Key className="w-4 h-4 text-[#888888]" />,
  'Script Writer': <FileText className="w-4 h-4 text-[#888888]" />,
  'Video Ideas': <Lightbulb className="w-4 h-4 text-[#F6A828]" />,
  'Best Post Time': <Clock className="w-4 h-4 text-[#888888]" />,
  'Channel Audit': <ClipboardCheck className="w-4 h-4 text-[#888888]" />,
  'A/B Tester': <GitCompare className="w-4 h-4 text-[#888888]" />,
  'VPH Tracker': <Activity className="w-4 h-4 text-[#888888]" />,
  'Thumbnail Lab': <ImageIcon className="w-4 h-4 text-[#F6A828]" />,
  'Safe Check': <ShieldCheck className="w-4 h-4 text-[#888888]" />,
  'Trend Alerts': <BellRing className="w-4 h-4 text-[#888888]" />,
  'Outlier Scout': <Radar className="w-4 h-4 text-[#888888]" />,
  'Automation': <Cpu className="w-4 h-4 text-[#888888]" />,
  'Shorts': <Film className="w-4 h-4 text-[#F6A828]" />,
  'History Intel': <History className="w-4 h-4 text-[#888888]" />,
  'Monthly Reset': <RotateCcw className="w-4 h-4 text-[#888888]" />,
};

/* ── Transaction type icon ── */
function TxnTypeIcon({ type }: { type: TokenTransaction['type'] }) {
  switch (type) {
    case 'spend': return <ArrowDownRight className="w-3.5 h-3.5 text-[#888888]" />;
    case 'earn': return <ArrowUpRight className="w-3.5 h-3.5 text-[#888888]" />;
    case 'reset': return <RotateCcw className="w-3.5 h-3.5 text-[#888888]" />;
    case 'bonus': return <Star className="w-3.5 h-3.5 text-[#F6A828]" />;
    default: return <Coins className="w-3.5 h-3.5 text-[#F6A828]" />;
  }
}

/* ── Relative time for transactions ── */
function txnTimeAgo(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/* ── Top-up plans ── */
const TOPUP_PLANS = [
  { price: '₦5,000', tokens: 500, bonus: 0, popular: false },
  { price: '₦20,000', tokens: 2200, bonus: 200, popular: true },
  { price: '₦50,000', tokens: 6000, bonus: 1000, popular: false },
];

export function UsageTool() {
  const { tokenBalance, tokensEarned, totalTokensSpent, userPlan, tokenHistory, lastResetDate, setTokenModalOpen } = useNychIQStore();

  const planStyle = PLAN_STYLES[userPlan];
  const totalTokens = PLAN_TOKENS[userPlan];
  const isUnlimited = userPlan === 'elite';

  // Compute usage breakdown from real history
  const usageBreakdown = useMemo(() => {
    const spends = tokenHistory.filter((t) => t.type === 'spend');
    const toolMap: Record<string, { uses: number; tokens: number }> = {};

    for (const txn of spends) {
      if (!toolMap[txn.tool]) toolMap[txn.tool] = { uses: 0, tokens: 0 };
      toolMap[txn.tool].uses++;
      toolMap[txn.tool].tokens += txn.tokens;
    }

    return Object.entries(toolMap)
      .map(([tool, data]) => ({
        tool,
        label: TOOL_META[tool]?.label ?? tool,
        uses: data.uses,
        tokens: data.tokens,
        avgCost: data.uses > 0 ? data.tokens / data.uses : 0,
      }))
      .sort((a, b) => b.tokens - a.tokens);
  }, [tokenHistory]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const spends = tokenHistory.filter((t) => t.type === 'spend');
    const catMap: Record<string, number> = {};
    let total = 0;

    for (const txn of spends) {
      const meta = TOOL_META[txn.tool];
      const cat = meta?.category ?? 'other';
      catMap[cat] = (catMap[cat] || 0) + txn.tokens;
      total += txn.tokens;
    }

    const colors: Record<string, string> = {
      main: '#F6A828',
      studio: '#888888',
      intelligence: '#888888',
      competitor: '#888888',
      'ai-tools': '#888888',
      social: '#888888',
      'ai-assistants': '#F6A828',
      agency: '#888888',
    };

    const labels: Record<string, string> = {
      main: 'Main',
      studio: 'Studio',
      intelligence: 'Intelligence',
      competitor: 'Competitor',
      'ai-tools': 'AI Tools',
      social: 'Social Intel',
      'ai-assistants': 'AI Assistants',
      agency: 'Agency',
    };

    return Object.entries(catMap)
      .filter(([, v]) => v > 0)
      .map(([cat, tokens]) => ({
        label: labels[cat] || cat,
        tokens,
        total,
        color: colors[cat] || '#a0a0a0',
      }))
      .sort((a, b) => b.tokens - a.tokens);
  }, [tokenHistory]);

  // Usage bar percentage
  const usagePct = isUnlimited ? 0 : totalTokens > 0 ? Math.round(((totalTokens - tokenBalance) / totalTokens) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ── Header Card ── */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(246,168,40,0.1)]">
              <Coins className="w-5 h-5 text-[#F6A828]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[#FFFFFF]">Token Usage</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Track how you spend tokens across all tools.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#F6A828]">
                {isUnlimited ? '∞' : tokenBalance.toLocaleString()}
              </p>
              <p className="text-[10px] text-[#666666]">remaining</p>
            </div>
          </div>
          {/* Progress bar */}
          {!isUnlimited && (
            <div className="mt-3">
              <div className="w-full h-2.5 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${usagePct}%`,
                    backgroundColor: usagePct > 80 ? '#888888' : usagePct > 50 ? '#F6A828' : '#888888',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-[#666666]">{usagePct}% used this month</span>
                <span className="text-[10px] text-[#666666] flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Resets on 31st
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Stats (3 columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Used */}
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[rgba(246,168,40,0.1)] flex items-center justify-center">
              <Coins className="w-4 h-4 text-[#F6A828]" />
            </div>
          </div>
          <p className="text-xs text-[#666666]">Total Tokens Spent</p>
          <p className="text-xl font-bold text-[#FFFFFF] mt-0.5">{totalTokensSpent.toLocaleString()}</p>
        </div>

        {/* Remaining */}
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#888888]" />
            </div>
          </div>
          <p className="text-xs text-[#666666]">Remaining Balance</p>
          <p className="text-xl font-bold text-[#888888] mt-0.5">
            {isUnlimited ? 'Unlimited' : tokenBalance.toLocaleString()}
          </p>
        </div>

        {/* Current Plan */}
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
              <Crown className="w-4 h-4 text-[#888888]" />
            </div>
          </div>
          <p className="text-xs text-[#666666]">Current Plan</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: planStyle.color }}>{planStyle.label}</p>
        </div>
      </div>

      {/* ── Usage Breakdown Table ── */}
      {usageBreakdown.length > 0 && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
          <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3">Usage Breakdown</h4>
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
                {usageBreakdown.map((row) => (
                  <tr
                    key={row.tool}
                    className="border-b border-[#1A1A1A]/50 last:border-b-0 hover:bg-[#0a0a0a] transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#0a0a0a] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                          {TOOL_ICONS[row.label] || <Coins className="w-3.5 h-3.5 text-[#666666]" />}
                        </div>
                        <span className="text-sm text-[#FFFFFF]">{row.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-sm text-[#a0a0a0]">{row.uses}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="text-sm font-medium text-[#F6A828]">{row.tokens}</span>
                    </td>
                    <td className="py-2.5 pl-4 text-right">
                      <span className="text-sm text-[#a0a0a0]">{row.avgCost.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
            <span className="text-xs text-[#666666]">Showing {usageBreakdown.length} tools</span>
            <span className="text-xs text-[#666666]">
              Total: <span className="text-[#F6A828] font-bold">
                {usageBreakdown.reduce((s, r) => s + r.tokens, 0).toLocaleString()}
              </span> tokens
            </span>
          </div>
        </div>
      )}

      {/* ── Usage by Category ── */}
      {categoryBreakdown.length > 0 && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
          <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-4">Usage by Category</h4>
          <div className="space-y-4">
            {categoryBreakdown.map((cat) => {
              const pct = cat.total > 0 ? Math.round((cat.tokens / cat.total) * 100) : 0;
              return (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#FFFFFF]">{cat.label}</span>
                    <span className="text-xs text-[#a0a0a0]">
                      <span className="font-medium" style={{ color: cat.color }}>{cat.tokens}</span> tokens ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] overflow-hidden">
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
      )}

      {/* ── Token History (from real data) ── */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Recent Transactions</h4>
          <span className="text-[10px] text-[#666666]">Last {Math.min(tokenHistory.length, 50)} of {tokenHistory.length}</span>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tokenHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#666666]">
              <Coins className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Token usage will appear here as you use tools.</p>
            </div>
          ) : (
            tokenHistory.slice(0, 50).map((txn) => {
              const label = TOOL_META[txn.tool]?.label ?? txn.tool;
              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.03)] transition-colors"
                >
                  <div className="w-9 h-9 rounded-md bg-[#0f0f0f] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                    {TOOL_ICONS[label] || <TxnTypeIcon type={txn.type} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#FFFFFF] truncate">{label}</p>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                        txn.type === 'spend' ? 'bg-[rgba(255,255,255,0.03)] text-[#888888]' :
                        txn.type === 'earn' ? 'bg-[rgba(255,255,255,0.03)] text-[#888888]' :
                        txn.type === 'reset' ? 'bg-[rgba(255,255,255,0.03)] text-[#888888]' :
                        'bg-[rgba(246,168,40,0.1)] text-[#F6A828]'
                      }`}>
                        {txn.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#666666]">{txnTimeAgo(txn.time)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {txn.type === 'spend' ? (
                      <span className="text-sm font-bold text-[#888888]">-{txn.tokens}</span>
                    ) : (
                      <span className="text-sm font-bold text-[#888888]">+{txn.tokens}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Token Cost Reference ── */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
            <Sparkles className="w-4 h-4 text-[#888888]" />
          </div>
          <h4 className="text-sm font-bold text-[#FFFFFF]">Token Cost Reference</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { cost: 1, tools: ['Viral Predictor', 'Saku AI'] },
            { cost: '2-3', tools: ['Rankings', 'CPM', 'Trending', 'Algorithm'] },
            { cost: '5-6', tools: ['Shorts', 'SEO', 'Best Post Time', 'Ideas'] },
            { cost: '8-12', tools: ['Hook Gen', 'Script Writer', 'Niche Spy', 'Audit'] },
            { cost: '15-20', tools: ['Strategy', 'Perf Forensics', 'Agency Hub'] },
          ].map((tier) => (
            <div key={tier.cost} className="p-2.5 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
              <p className="text-xs font-bold text-[#F6A828]">{tier.cost} tokens</p>
              <ul className="mt-1 space-y-0.5">
                {tier.tools.map((t) => (
                  <li key={t} className="text-[10px] text-[#666666]">{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Buy More Tokens ── */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(246,168,40,0.1)]">
            <Gift className="w-4 h-4 text-[#F6A828]" />
          </div>
          <h4 className="text-sm font-bold text-[#FFFFFF]">Buy More Tokens</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TOPUP_PLANS.map((plan) => (
            <div
              key={plan.price}
              className={`relative rounded-lg p-4 text-center transition-all cursor-pointer hover:border-[#F6A828]/50 ${
                plan.popular
                  ? 'bg-[#0a0a0a] border-2 border-[#F6A828]/50'
                  : 'bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[#1a1a1a]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#F6A828] text-[10px] font-bold text-[#0a0a0a] uppercase tracking-wider">
                  Popular
                </div>
              )}
              <p className="text-lg font-bold text-[#FFFFFF]">{plan.price}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Coins className="w-3.5 h-3.5 text-[#F6A828]" />
                <span className="text-base font-bold text-[#F6A828]">{plan.tokens.toLocaleString()}</span>
                <span className="text-xs text-[#a0a0a0]">tokens</span>
              </div>
              {plan.bonus > 0 && (
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)]">
                  <Check className="w-3 h-3 text-[#888888]" />
                  <span className="text-[10px] font-bold text-[#888888]">+{plan.bonus} bonus</span>
                </div>
              )}
              <button
                onClick={() => setTokenModalOpen(true)}
                className={`w-full mt-3 py-2 rounded-md text-xs font-bold transition-colors ${
                  plan.popular
                    ? 'bg-[#F6A828] text-[#0a0a0a] hover:bg-[#FFB340]'
                    : 'bg-[#1A1A1A] text-[#FFFFFF] border border-[rgba(255,255,255,0.03)] hover:border-[#F6A828]/50'
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
