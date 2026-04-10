'use client';

import React from 'react';
import { cn, fmtV, fmtPct } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
  className?: string;
  dark?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  changeType,
  icon,
  color = '#FDBA2D',
  className,
  dark = false,
}: StatCardProps) {
  const isUp = changeType === 'up' || (changeType === undefined && change?.startsWith('+'));
  const isDown = changeType === 'down' || (changeType === undefined && change?.startsWith('-'));

  return (
    <div
      className={cn(
        'rounded-lg p-4 transition-all duration-200',
        dark
          ? 'bg-[#0D0D0D] border border-[#1A1A1A]'
          : 'bg-[#141414] border border-[#222222]',
        'hover:border-[#2A2A2A] hover:shadow-lg hover:shadow-black/20',
        className
      )}
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium text-[#888888] uppercase tracking-wider">{label}</p>
        {icon && (
          <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}15` }}>
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-bold text-[#E8E8E8]">
          {typeof value === 'number' ? fmtV(value) : value}
        </span>
        {change && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-semibold mb-0.5',
              isUp && 'text-[#10B981]',
              isDown && 'text-[#EF4444]',
              !isUp && !isDown && 'text-[#888888]'
            )}
          >
            {isUp && <TrendingUp className="w-3 h-3" />}
            {isDown && <TrendingDown className="w-3 h-3" />}
            {!isUp && !isDown && <Minus className="w-3 h-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
