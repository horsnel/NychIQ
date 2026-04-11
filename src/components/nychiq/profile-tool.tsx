'use client';

import React from 'react';
import { useNychIQStore, PLAN_TOKENS, type Plan } from '@/lib/store';
import { getInitials } from '@/lib/utils';
import {
  User,
  Crown,
  Coins,
  Activity,
  Globe,
  LogOut,
  ChevronRight,
  Sparkles,
  Shield,
  FileText,
  Cookie,
  Zap,
} from 'lucide-react';

/* ── Plan badge config ── */
const PLAN_STYLES: Record<Plan, { bg: string; text: string; border: string; label: string }> = {
  trial: { bg: 'bg-[rgba(136,136,136,0.15)]', text: 'text-[#A3A3A3]', border: 'border-[rgba(136,136,136,0.3)]', label: 'Free Trial' },
  starter: { bg: 'bg-[rgba(59,130,246,0.15)]', text: 'text-[#3B82F6]', border: 'border-[rgba(59,130,246,0.3)]', label: 'Starter' },
  pro: { bg: 'bg-[rgba(253,186,45,0.15)]', text: 'text-[#FDBA2D]', border: 'border-[rgba(253,186,45,0.3)]', label: 'Pro' },
  elite: { bg: 'bg-[rgba(139,92,246,0.15)]', text: 'text-[#8B5CF6]', border: 'border-[rgba(139,92,246,0.3)]', label: 'Elite' },
  agency: { bg: 'bg-[rgba(16,185,129,0.15)]', text: 'text-[#10B981]', border: 'border-[rgba(16,185,129,0.3)]', label: 'Agency' },
};

/* ── Stat mini card ── */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-xs text-[#666666]">{label}</p>
      <p className="text-sm font-bold text-[#FFFFFF] mt-0.5">{value}</p>
    </div>
  );
}

export function ProfileTool() {
  const {
    userName,
    userEmail,
    userPlan,
    tokenBalance,
    tokensEarned,
    region,
    signupTimestamp,
    setActiveTool,
    setUpgradeModalOpen,
    logout,
    setPage,
  } = useNychIQStore();

  const planStyle = PLAN_STYLES[userPlan];
  const totalTokens = PLAN_TOKENS[userPlan];
  const tokensUsed = totalTokens - tokenBalance;
  const usagePercent = totalTokens > 0 ? Math.min(100, Math.round((tokensUsed / totalTokens) * 100)) : 0;

  /* Account age */
  const daysSinceSignup = Math.max(0, Math.floor((Date.now() - signupTimestamp) / (1000 * 60 * 60 * 24)));

  const handleEditProfile = () => setActiveTool('settings');
  const handleUpgrade = () => setUpgradeModalOpen(true);
  const handleSignOut = () => logout();
  const handleLegal = (page: 'privacy' | 'terms' | 'refund' | 'cookies') => setPage(page);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
              <User className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Profile</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">View your account info, plan details, and token usage.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-[#FDBA2D] flex items-center justify-center text-[#0D0D0D] text-2xl font-bold shrink-0">
            {getInitials(userName)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-[#FFFFFF]">{userName || 'Your Name'}</h3>
            <p className="text-sm text-[#A3A3A3] mt-0.5">{userEmail || 'your@email.com'}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${planStyle.bg} ${planStyle.text} ${planStyle.border}`}>
                <Crown className="w-3 h-3" />
                {planStyle.label}
              </span>
              <span className="text-[10px] text-[#666666]">Member for {daysSinceSignup}d</span>
            </div>
          </div>
          <button
            onClick={handleEditProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] border border-[#222222] text-sm text-[#FFFFFF] hover:border-[#FDBA2D]/50 transition-colors shrink-0"
          >
            Edit Profile
            <ChevronRight className="w-4 h-4 text-[#666666]" />
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="w-3.5 h-3.5 text-[#10B981]" />}
          label="Status"
          value="Active"
          color="bg-[rgba(16,185,129,0.1)]"
        />
        <StatCard
          icon={<Crown className="w-3.5 h-3.5 text-[#FDBA2D]" />}
          label="Plan"
          value={planStyle.label}
          color="bg-[rgba(253,186,45,0.1)]"
        />
        <StatCard
          icon={<Coins className="w-3.5 h-3.5 text-[#3B82F6]" />}
          label="Tokens Earned"
          value={tokensEarned.toLocaleString()}
          color="bg-[rgba(59,130,246,0.1)]"
        />
        <StatCard
          icon={<Zap className="w-3.5 h-3.5 text-[#8B5CF6]" />}
          label="Balance"
          value={tokenBalance.toLocaleString()}
          color="bg-[rgba(139,92,246,0.1)]"
        />
      </div>

      {/* ── Token Progress ── */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#FDBA2D]" />
            <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">Token Usage</h4>
          </div>
          <span className="text-xs text-[#A3A3A3]">
            {tokensUsed} / {totalTokens.toLocaleString()} used
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-3 rounded-full bg-[#0D0D0D] border border-[#1A1A1A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${usagePercent}%`,
              background: usagePercent > 80 ? '#EF4444' : usagePercent > 50 ? '#FDBA2D' : '#10B981',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[#666666]">
            {tokenBalance.toLocaleString()} tokens remaining
          </span>
          <span className={`text-xs font-bold ${usagePercent > 80 ? 'text-[#EF4444]' : usagePercent > 50 ? 'text-[#FDBA2D]' : 'text-[#10B981]'}`}>
            {usagePercent}%
          </span>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleUpgrade}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          UPGRADE PLAN
        </button>
        <button
          onClick={handleSignOut}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-transparent border border-[#222222] text-[#A3A3A3] text-sm font-medium hover:text-[#FFFFFF] hover:border-[#444444] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          SIGN OUT
        </button>
      </div>

      {/* ── Preferences / Links ── */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
            <Globe className="w-4 h-4 text-[#FDBA2D]" />
          </div>
          <h3 className="text-sm font-bold text-[#FFFFFF]">Preferences</h3>
        </div>

        {/* Region */}
        <div className="flex items-center justify-between py-3 border-b border-[#1A1A1A]">
          <span className="text-sm text-[#A3A3A3]">Region</span>
          <span className="text-sm text-[#FFFFFF] font-medium">{region}</span>
        </div>

        {/* Legal links */}
        {[
          { label: 'Privacy Policy', icon: Shield, page: 'privacy' as const },
          { label: 'Terms of Service', icon: FileText, page: 'terms' as const },
          { label: 'Refund Policy', icon: Coins, page: 'refund' as const },
          { label: 'Cookie Policy', icon: Cookie, page: 'cookies' as const },
        ].map((item) => (
          <button
            key={item.page}
            onClick={() => handleLegal(item.page)}
            className="w-full flex items-center justify-between py-3 border-b border-[#1A1A1A] last:border-b-0 hover:bg-[#0D0D0D] transition-colors rounded px-1 -mx-1 group"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-[#666666] group-hover:text-[#A3A3A3] transition-colors" />
              <span className="text-sm text-[#A3A3A3] group-hover:text-[#FFFFFF] transition-colors">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#444444] group-hover:text-[#666666] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
