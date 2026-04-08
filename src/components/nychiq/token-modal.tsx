'use client';

import React from 'react';
import { Coins, X, Zap, Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNychIQStore } from '@/lib/store';

export function TokenModal() {
  const { tokenModalOpen, setTokenModalOpen, tokenBalance, userPlan } = useNychIQStore();

  return (
    <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
      <DialogContent className="sm:max-w-md bg-[#111] border-[#222] text-[#E8E8E8] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-[#F5A623]" />
            Tokens Running Low
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-[#222]">
            <span className="text-sm text-[#888888]">Current Balance</span>
            <span className="text-lg font-bold text-[#F5A623]">{tokenBalance}</span>
          </div>
          <p className="text-sm text-[#888888]">
            You need more tokens to use this feature. Get tokens by upgrading your plan or completing tasks.
          </p>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Quick Ways to Earn</h4>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E]">
              <Gift className="w-4 h-4 text-[#00C48C]" />
              <div>
                <p className="text-xs font-medium text-[#E8E8E8]">Refer a Friend</p>
                <p className="text-[11px] text-[#888888]">Earn 20 tokens per referral</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E]">
              <Zap className="w-4 h-4 text-[#F5A623]" />
              <div>
                <p className="text-xs font-medium text-[#E8E8E8]">Upgrade Plan</p>
                <p className="text-[11px] text-[#888888]">Get up to unlimited tokens with Elite or 20,000+ with Agency</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-[#222] text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A]"
              onClick={() => setTokenModalOpen(false)}
            >
              Later
            </Button>
            <Button
              className="flex-1 bg-[#F5A623] text-black hover:bg-[#E6960F]"
              onClick={() => {
                setTokenModalOpen(false);
                useNychIQStore.getState().setUpgradeModalOpen(true);
              }}
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
