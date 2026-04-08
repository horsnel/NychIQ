'use client';

import React from 'react';
import { Lock, Zap, Crown, Shield, Building2 } from 'lucide-react';
import { useNychIQStore, PLAN_ACCESS, PLAN_PRICES, type Plan } from '@/lib/store';
import { Button } from '@/components/ui/button';

interface PlanGateProps {
  toolId: string;
  toolLabel: string;
}

const PLAN_HIERARCHY: Plan[] = ['starter', 'pro', 'elite', 'agency'];
const PLAN_CONFIG: Record<string, { icon: React.ElementType; color: string; name: string }> = {
  starter: { icon: Zap, color: '#4A9EFF', name: 'Starter' },
  pro: { icon: Crown, color: '#F5A623', name: 'Pro' },
  elite: { icon: Shield, color: '#9B72CF', name: 'Elite' },
  agency: { icon: Building2, color: '#00C48C', name: 'Agency' },
};

export function PlanGate({ toolId, toolLabel }: PlanGateProps) {
  const { setUpgradeModalOpen, userPlan } = useNychIQStore();

  // Find the minimum plan that grants access to this tool
  let requiredPlan: Plan | null = null;
  for (const plan of PLAN_HIERARCHY) {
    if (PLAN_ACCESS[plan]?.includes(toolId)) {
      requiredPlan = plan;
      break;
    }
  }

  if (!requiredPlan) return null;

  const config = PLAN_CONFIG[requiredPlan];
  const Icon = config.icon;
  const price = PLAN_PRICES[requiredPlan].monthly;

  // Count how many additional tools they'd unlock
  const currentTools = new Set(PLAN_ACCESS[userPlan] ?? []);
  const requiredTools = new Set(PLAN_ACCESS[requiredPlan] ?? []);
  let unlockCount = 0;
  for (const t of requiredTools) {
    if (!currentTools.has(t)) unlockCount++;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="max-w-sm w-full text-center px-4">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: `${config.color}12`, border: `1px solid ${config.color}25` }}
        >
          <Icon className="w-7 h-7" style={{ color: config.color }} />
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ background: `${config.color}15`, color: config.color }}
        >
          <Lock className="w-3 h-3" />
          {config.name} Required
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">{toolLabel}</h2>

        {/* Description */}
        <p className="text-sm text-[#888888] mb-2">
          Upgrade to{' '}
          <span style={{ color: config.color }} className="font-semibold">
            {config.name}
          </span>{' '}
          (₦{price.toLocaleString()}/mo) to unlock this tool.
        </p>

        {/* Extra tools count */}
        {unlockCount > 1 && (
          <p className="text-xs text-[#666666] mb-6">
            Plus {unlockCount - 1} more tools and features
          </p>
        )}

        {!unlockCount || unlockCount <= 1 ? <div className="mb-6" /> : null}

        {/* CTA */}
        <Button
          className="w-full font-semibold text-sm h-10"
          style={{ backgroundColor: config.color, color: '#0A0A0A' }}
          onClick={() => setUpgradeModalOpen(true)}
        >
          Upgrade to {config.name}
        </Button>

        {/* Subtle note */}
        <p className="text-[11px] text-[#444444] mt-4">
          7-day money-back guarantee · Cancel anytime
        </p>
      </div>
    </div>
  );
}
