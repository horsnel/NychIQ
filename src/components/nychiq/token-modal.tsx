'use client';

import React from 'react';
import { Coins, X, Zap, Gift, AlertTriangle, Clock, CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNychIQStore, PLAN_TOKENS, PLAN_PRICES } from '@/lib/store';
import { playTokenWarning, playTokenExhausted } from '@/lib/sounds';

/* ── 20% Warning Modal (skippable) ── */
function TokenWarningContent({ onUpgrade, onSkip }: { onUpgrade: () => void; onSkip: () => void }) {
  const { tokenBalance, userPlan } = useNychIQStore();
  const maxTokens = PLAN_TOKENS[userPlan];
  const threshold = Math.floor(maxTokens * 0.2);
  const pct = maxTokens > 0 ? Math.round((tokenBalance / maxTokens) * 100) : 0;

  React.useEffect(() => {
    playTokenWarning();
  }, []);

  return (
    <div className="space-y-4 mt-2">
      {/* Warning indicator */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(253,186,45,0.08)] border border-[rgba(255,255,255,0.06)]">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#FDBA2D"
              strokeWidth="3"
              strokeDasharray={`${pct}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-xs font-bold text-[#FDBA2D]">{pct}%</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#FDBA2D]">Running Low</p>
          <p className="text-xs text-[#a0a0a0]">
            {tokenBalance} of {maxTokens.toLocaleString()} tokens remaining
          </p>
        </div>
      </div>

      <p className="text-sm text-[#a0a0a0]">
        You&apos;re below 20% of your monthly token allocation. Upgrade your plan for more tokens, or wait
        until the <strong className="text-[#FFFFFF]">31st</strong> of this month for a free reset.
      </p>

      {/* Quick earn options */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#666666] uppercase tracking-wide">Options</h4>
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)]">
          <Gift className="w-4 h-4 text-[#888888]" />
          <div>
            <p className="text-xs font-medium text-[#FFFFFF]">Refer a Friend</p>
            <p className="text-[11px] text-[#a0a0a0]">Earn 20 tokens per referral</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)]">
          <CalendarDays className="w-4 h-4 text-[#888888]" />
          <div>
            <p className="text-xs font-medium text-[#FFFFFF]">Monthly Reset</p>
            <p className="text-[11px] text-[#a0a0a0]">Free tokens reset on the 31st of every month</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)]">
          <Zap className="w-4 h-4 text-[#FDBA2D]" />
          <div>
            <p className="text-xs font-medium text-[#FFFFFF]">Upgrade Plan</p>
            <p className="text-[11px] text-[#a0a0a0]">Get up to unlimited tokens with Elite plan</p>
          </div>
        </div>
      </div>

      {/* Action buttons — SKIP available */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          className="flex-1 border-[#333] text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A]"
          onClick={onSkip}
        >
          Skip for Now
        </Button>
        <Button
          className="flex-1 bg-[#FDBA2D] text-black hover:bg-[#C69320] font-semibold"
          onClick={onUpgrade}
        >
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
}

/* ── Token Exhausted Modal (NON-SKIPPABLE) ── */
function TokenExhaustedContent({ onUpgrade }: { onUpgrade: () => void }) {
  const { userPlan } = useNychIQStore();
  const planPrice = PLAN_PRICES[userPlan].monthly;

  React.useEffect(() => {
    playTokenExhausted();
  }, []);

  return (
    <div className="space-y-4 mt-2">
      {/* Exhausted indicator */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)]">
        <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center animate-pulse-live">
          <AlertTriangle className="w-6 h-6 text-[#888888]" />
        </div>
        <div>
          <p className="text-base font-bold text-[#888888]">Tokens Exhausted</p>
          <p className="text-xs text-[#a0a0a0]">You have no tokens remaining</p>
        </div>
      </div>

      <p className="text-sm text-[#a0a0a0] leading-relaxed">
        Your token balance has reached <strong className="text-[#888888]">zero</strong>. You cannot use any
        paid features until you upgrade your plan or wait for the{' '}
        <strong className="text-[#FFFFFF]">free monthly reset on the 31st</strong>.
      </p>

      {/* Countdown to reset */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)]">
        <Clock className="w-5 h-5 text-[#888888]" />
        <div>
          <p className="text-xs font-medium text-[#FFFFFF]">Next Free Reset</p>
          <p className="text-[11px] text-[#a0a0a0]">
            <ResetCountdown />
          </p>
        </div>
      </div>

      {/* Current plan info */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)]">
        <Coins className="w-4 h-4 text-[#FDBA2D]" />
        <div className="flex-1">
          <p className="text-xs font-medium text-[#FFFFFF]">Current Plan: {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}</p>
          <p className="text-[11px] text-[#a0a0a0]">Monthly: ₦{planPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Upgrade options */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#666666] uppercase tracking-wide">Upgrade Now</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onUpgrade}
            className="p-3 rounded-lg bg-[rgba(253,186,45,0.08)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(253,186,45,0.15)] transition-colors text-left"
          >
            <p className="text-sm font-bold text-[#FDBA2D]">Elite</p>
            <p className="text-[11px] text-[#a0a0a0]">Unlimited tokens</p>
            <p className="text-[10px] text-[#666666] mt-1">₦70,000/mo</p>
          </button>
          <button
            onClick={onUpgrade}
            className="p-3 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)] transition-colors text-left"
          >
            <p className="text-sm font-bold text-[#888888]">Agency</p>
            <p className="text-[11px] text-[#a0a0a0]">50,000 tokens/mo</p>
            <p className="text-[10px] text-[#666666] mt-1">₦150,000/mo</p>
          </button>
        </div>
      </div>

      {/* UPGRADE button — ONLY action available, no skip */}
      <Button
        className="w-full bg-[#FDBA2D] text-black hover:bg-[#C69320] font-bold py-3 text-sm"
        onClick={onUpgrade}
      >
        Upgrade Plan to Continue
      </Button>

      <p className="text-center text-[11px] text-[#666666]">
        Free tokens will reset on the 31st of this month.
        <br />
        Upgrade to continue using NychIQ features now.
      </p>
    </div>
  );
}

/* ── Countdown to next 31st ── */
function ResetCountdown() {
  const [countdown, setCountdown] = React.useState('');

  React.useEffect(() => {
    function calc() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      // Find the next 31st
      let target = new Date(year, month, 31);
      // If the 31st of this month has passed, go to next month's 31st
      // Handle months that don't have 31 days (Feb, Apr, Jun, Sep, Nov)
      while (target.getDate() < 31 || target <= now) {
        // Move to next month
        target = new Date(target.getFullYear(), target.getMonth() + 1, 31);
      }

      const diff = target.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setCountdown(`${days} day${days > 1 ? 's' : ''} ${hours}h remaining`);
      } else if (hours > 0) {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${hours}h ${mins}m remaining — Reset happens today!`);
      } else {
        setCountdown('Reset happens today!');
      }
    }
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-[#888888] font-medium">{countdown || 'Calculating...'}</span>;
}

/* ── Main TokenModal ── */
export function TokenModal() {
  const { tokenModalOpen, setTokenModalOpen, tokenBalance, userPlan, setUpgradeModalOpen } = useNychIQStore();

  const handleUpgrade = () => {
    setTokenModalOpen(false);
    setUpgradeModalOpen(true);
  };

  const handleSkip = () => {
    setTokenModalOpen(false);
  };

  // Check if this is a 20% warning or zero-balance
  const maxTokens = PLAN_TOKENS[userPlan];
  const isExhausted = tokenBalance <= 0;

  return (
    <Dialog
      open={tokenModalOpen}
      onOpenChange={(open) => {
        if (!open) handleSkip();
      }}
    >
      <DialogContent className="sm:max-w-md bg-[#0f0f0f] border-[rgba(255,255,255,0.06)] text-[#FFFFFF] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-[#FDBA2D]" />
            {isExhausted ? 'No Tokens Remaining' : 'Tokens Running Low'}
          </DialogTitle>
        </DialogHeader>
        {isExhausted ? (
          <TokenExhaustedContent onUpgrade={handleUpgrade} />
        ) : (
          <TokenWarningContent onUpgrade={handleUpgrade} onSkip={handleSkip} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Exhausted Overlay — NON-SKIPPABLE full-screen overlay ── */
export function TokenExhaustedOverlay() {
  const { tokenExhaustedPopupOpen, setTokenExhaustedPopupOpen, tokenBalance, setUpgradeModalOpen } = useNychIQStore();

  // Only show if tokens are truly exhausted
  if (!tokenExhaustedPopupOpen || tokenBalance > 0) return null;

  const handleUpgrade = () => {
    setTokenExhaustedPopupOpen(false);
    setUpgradeModalOpen(true);
  };

  // Prevent any interaction behind this overlay
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop — no click handler so it can't be dismissed */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Content card */}
      <div className="relative w-full max-w-md bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 animate-fade-in-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center animate-pulse-live">
            <AlertTriangle className="w-5 h-5 text-[#888888]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#888888]">Tokens Exhausted</h3>
            <p className="text-xs text-[#a0a0a0]">All tokens have been used</p>
          </div>
        </div>

        <TokenExhaustedContent onUpgrade={handleUpgrade} />
      </div>
    </div>
  );
}
