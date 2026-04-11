'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  BarChart3,
  Lightbulb,
  Crown,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Shirt,
} from 'lucide-react';

interface MerchItem {
  id: string;
  name: string;
  sales: number;
  revenue: string;
  trend: 'up' | 'down';
  change: string;
}

interface RevenueBreakdown {
  source: string;
  amount: string;
  percentage: number;
  color: string;
}

const MOCK_TOP_ITEMS: MerchItem[] = [
  { id: '1', name: 'Channel Logo Tee – Black', sales: 342, revenue: '$8,550', trend: 'up', change: '+18%' },
  { id: '2', name: 'Coder Life Hoodie', sales: 218, revenue: '$10,900', trend: 'up', change: '+24%' },
  { id: '3', name: 'Dev Humor Sticker Pack', sales: 1856, revenue: '$4,640', trend: 'down', change: '-5%' },
  { id: '4', name: 'Premium Mug Collection', sales: 127, revenue: '$3,175', trend: 'up', change: '+12%' },
  { id: '5', name: 'Limited Edition Snapback', sales: 89, revenue: '$5,340', trend: 'up', change: '+31%' },
];

const MOCK_REVENUE: RevenueBreakdown[] = [
  { source: 'Merch Sales', amount: '$32,605', percentage: 42, color: '#F5A623' },
  { source: 'Memberships', amount: '$28,400', percentage: 37, color: '#9B72CF' },
  { source: 'Digital Products', amount: '$10,200', percentage: 13, color: '#4A9EFF' },
  { source: 'Tips & Super Chats', amount: '$6,350', percentage: 8, color: '#00C48C' },
];

const MOCK_TIPS = [
  { title: 'Bundle your bestsellers', description: 'Create bundles of top 3 items with 15% discount to increase AOV by 22%.', impact: 'High' },
  { title: 'Launch seasonal collection', description: 'Holiday-themed merch drops see 3x normal engagement in Q4.', impact: 'Medium' },
  { title: 'Add membership perks', description: 'Exclusive merch discounts for channel members boost retention 40%.', impact: 'High' },
  { title: 'Expand sticker offerings', description: 'Low-cost, high-margin items like stickers have the best ROI.', impact: 'Medium' },
];

const impactColor = (impact: string) => impact === 'High' ? '#E05252' : '#F5A623';

export function MerchOptimizerTool() {
  const [activeTab, setActiveTab] = useState<'items' | 'revenue' | 'tips'>('items');

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
            <ShoppingBag className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#E8E8E8]">Merch Optimizer</h2>
            <p className="text-xs text-[#888888] mt-0.5">Analyze merchandise performance and unlock new revenue streams.</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <p className="text-lg font-bold text-[#F5A623]">$77.6K</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Total Revenue</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <p className="text-lg font-bold text-[#00C48C]">2,632</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Units Sold</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <p className="text-lg font-bold text-[#4A9EFF]">$29.50</p>
            <p className="text-[10px] text-[#666] uppercase tracking-wider">Avg Order Value</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[#111111] border border-[#222222]">
        {[
          { key: 'items' as const, label: 'Top Items', icon: Package },
          { key: 'revenue' as const, label: 'Revenue Split', icon: BarChart3 },
          { key: 'tips' as const, label: 'Optimize', icon: Lightbulb },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key ? 'bg-[#F5A623] text-[#0A0A0A]' : 'text-[#888] hover:text-[#E8E8E8]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top Items */}
      {activeTab === 'items' && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-[#F5A623]" />
            Best Performing Items
          </h4>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {MOCK_TOP_ITEMS.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
                <span className="text-xs font-bold text-[#444] w-5 shrink-0">#{i + 1}</span>
                <div className="w-9 h-9 rounded-lg bg-[rgba(245,166,35,0.1)] flex items-center justify-center shrink-0">
                  <Shirt className="w-4 h-4 text-[#F5A623]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E8E8E8] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#666]">{item.sales.toLocaleString()} units sold</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#E8E8E8]">{item.revenue}</p>
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 justify-end ${item.trend === 'up' ? 'text-[#00C48C]' : 'text-[#E05252]'}`}>
                    {item.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Breakdown */}
      {activeTab === 'revenue' && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-[#00C48C]" />
            Revenue Breakdown
          </h4>
          <div className="space-y-3">
            {MOCK_REVENUE.map((rev, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#E8E8E8]">{rev.source}</span>
                  <span className="text-sm font-bold" style={{ color: rev.color }}>{rev.amount}</span>
                </div>
                <div className="h-2 rounded-full bg-[#0D0D0D] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${rev.percentage}%`, backgroundColor: rev.color }}
                  />
                </div>
                <p className="text-[10px] text-[#666] mt-0.5">{rev.percentage}% of total</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Tips */}
      {activeTab === 'tips' && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-[#F5A623]" />
            Optimization Tips
          </h4>
          <div className="space-y-2">
            {MOCK_TIPS.map((tip, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-[#E8E8E8]">{tip.title}</p>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: impactColor(tip.impact) + '20', color: impactColor(tip.impact) }}
                  >
                    {tip.impact}
                  </span>
                </div>
                <p className="text-xs text-[#AAAAAA] leading-relaxed">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
