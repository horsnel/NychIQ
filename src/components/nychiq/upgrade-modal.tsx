'use client';

import React from 'react';
import { X, Check, Zap, Crown, Rocket, Shield, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNychIQStore, PLAN_PRICES, PLAN_TOKENS, type Plan } from '@/lib/store';
import { cn } from '@/lib/utils';

const PLANS: Array<{ id: Plan; name: string; icon: React.ElementType; color: string; features: string[] }> = [
  {
    id: 'starter', name: 'Starter', icon: Zap, color: '#3B82F6',
    features: ['500 tokens/mo', 'Viral Predictor', 'Rankings', 'Shorts', 'Studio', 'Priority support'],
  },
  {
    id: 'pro', name: 'Pro', icon: Rocket, color: '#FDBA2D',
    features: ['3,500 tokens/mo', 'Everything in Starter', 'Niche Spy', 'Algorithm', 'SEO Optimizer', 'Hook Generator', 'AI Script Writer', 'Automation', 'Outlier Scout'],
  },
  {
    id: 'elite', name: 'Elite', icon: Shield, color: '#8B5CF6',
    features: ['Unlimited tokens', 'Everything in Pro', 'CPM Estimator', 'Channel Audit', 'Perf Forensics', 'History Intel', 'Safe Check', 'Social Intelligence'],
  },
  {
    id: 'agency', name: 'Agency', icon: Building2, color: '#10B981',
    features: ['20,000+ tokens/mo', 'Everything in Elite', 'Strategy Copier', 'GoffViral', 'Agency Dashboard', 'Dedicated support', 'API access'],
  },
];

export function UpgradeModal() {
  const { upgradeModalOpen, setUpgradeModalOpen, userPlan } = useNychIQStore();

  return (
    <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
      <DialogContent className="sm:max-w-2xl bg-[#141414] border-[#1F1F1F] text-[#FFFFFF] p-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-gradient-amber">Upgrade Your Plan</DialogTitle>
          <p className="text-sm text-[#A3A3A3] mt-1">Unlock powerful features and get more tokens.</p>
        </DialogHeader>
        <div className="p-6 grid gap-4 sm:grid-cols-2">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = userPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  'rounded-xl border p-4 transition-all cursor-pointer',
                  isCurrent
                    ? 'border-[#FDBA2D] bg-[rgba(253,186,45,0.05)]'
                    : 'border-[#1F1F1F] bg-[#0D0D0D] hover:border-[#2A2A2A]'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  <span className="font-semibold" style={{ color: plan.color }}>{plan.name}</span>
                  {isCurrent && (
                    <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgba(253,186,45,0.15)] text-[#FDBA2D]">
                      CURRENT
                    </span>
                  )}
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-[#FFFFFF]">₦{PLAN_PRICES[plan.id].monthly.toLocaleString()}</span>
                  <span className="text-xs text-[#A3A3A3]">/mo</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                      <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-4 text-xs font-medium"
                  disabled={isCurrent}
                  style={{
                    backgroundColor: isCurrent ? '#1A1A1A' : plan.color,
                    color: isCurrent ? '#A3A3A3' : '#0D0D0D',
                  }}
                >
                  {isCurrent ? 'Current Plan' : 'Upgrade'}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
