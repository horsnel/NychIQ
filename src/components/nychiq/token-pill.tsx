'use client';

import React from 'react';
import { Coins } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function TokenPill() {
  const { tokenBalance, setTokenModalOpen } = useNychIQStore();
  const isLow = tokenBalance < 10;

  return (
    <button
      onClick={() => setTokenModalOpen(true)}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer',
        isLow
          ? 'bg-[rgba(224,82,82,0.15)] text-[#E05252] border border-[rgba(224,82,82,0.3)] animate-pulse-live'
          : 'bg-[rgba(245,166,35,0.1)] text-[#F5A623] border border-[rgba(245,166,35,0.2)]'
      )}
    >
      <Coins className="w-3.5 h-3.5" />
      <span>{tokenBalance.toLocaleString()}</span>
    </button>
  );
}
