'use client';

import React from 'react';
import { Coins } from 'lucide-react';
import { useNychIQStore, PLAN_TOKENS } from '@/lib/store';
import { cn } from '@/lib/utils';
import { playClick } from '@/lib/sounds';

export function TokenPill() {
  const { tokenBalance, setTokenModalOpen, userPlan } = useNychIQStore();
  const maxTokens = PLAN_TOKENS[userPlan];
  const isUnlimited = userPlan === 'elite';
  const pct = maxTokens > 0 && !isUnlimited ? Math.round((tokenBalance / maxTokens) * 100) : 100;

  const getStyling = () => {
    if (tokenBalance <= 0) return 'bg-[rgba(224,82,82,0.2)] text-[#E05252] border border-[rgba(224,82,82,0.4)] animate-pulse-live';
    if (pct <= 20) return 'bg-[rgba(224,82,82,0.15)] text-[#E05252] border border-[rgba(224,82,82,0.3)]';
    if (pct <= 40) return 'bg-[rgba(245,166,35,0.1)] text-[#F5A623] border border-[rgba(245,166,35,0.2)]';
    return 'bg-[rgba(245,166,35,0.1)] text-[#F5A623] border border-[rgba(245,166,35,0.2)]';
  };

  return (
    <button
      onClick={() => { playClick(); setTokenModalOpen(true); }}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer',
        getStyling()
      )}
    >
      <Coins className="w-3.5 h-3.5" />
      <span>{isUnlimited ? '∞' : tokenBalance.toLocaleString()}</span>
    </button>
  );
}
