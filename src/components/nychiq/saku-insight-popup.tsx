'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, TrendingUp, Search, Zap, Lightbulb, Clock, DollarSign, BarChart3, Key } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const CATEGORY_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  trending:    { icon: TrendingUp, color: 'text-[#FDBA2D]', bg: 'bg-[rgba(253,186,45,0.1)]' },
  seo:         { icon: Key,        color: 'text-[#8B5CF6]', bg: 'bg-[rgba(139,92,246,0.1)]' },
  viral:       { icon: Zap,        color: 'text-[#EF4444]', bg: 'bg-[rgba(239,68,68,0.1)]' },
  ideas:       { icon: Lightbulb,  color: 'text-[#10B981]', bg: 'bg-[rgba(16,185,129,0.1)]' },
  posttime:    { icon: Clock,      color: 'text-[#3B82F6]', bg: 'bg-[rgba(59,130,246,0.1)]' },
  algorithm:   { icon: BarChart3,  color: 'text-[#FDBA2D]', bg: 'bg-[rgba(253,186,45,0.1)]' },
  performance: { icon: BarChart3,  color: 'text-[#10B981]', bg: 'bg-[rgba(16,185,129,0.1)]' },
  monetization:{ icon: DollarSign,  color: 'text-[#FDBA2D]', bg: 'bg-[rgba(253,186,45,0.1)]' },
};

const SOURCE_LABELS: Record<string, string> = {
  saku: 'Saku AI',
  'channel-assistant': 'Channel Assistant',
  'next-upload': 'Next Upload AI',
};

export function SakuInsightPopup() {
  const {
    sakuInsightPopupOpen,
    sakuInsightPopupData,
    setSakuInsightPopup,
    setActiveTool,
    setSakuOpen,
    canAccess,
    markInsightRead,
  } = useNychIQStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(sakuInsightPopupOpen);
  }, [sakuInsightPopupOpen]);

  const handleClose = (openState: boolean) => {
    setOpen(openState);
    if (!openState) {
      setSakuInsightPopup(false);
      if (sakuInsightPopupData) {
        markInsightRead(sakuInsightPopupData.id);
      }
    }
  };

  const handleTryItNow = () => {
    if (sakuInsightPopupData) {
      markInsightRead(sakuInsightPopupData.id);
      if (sakuInsightPopupData.toolLink && canAccess(sakuInsightPopupData.toolLink)) {
        setActiveTool(sakuInsightPopupData.toolLink);
      }
    }
    handleClose(false);
  };

  const handleAskSaku = () => {
    if (sakuInsightPopupData) {
      markInsightRead(sakuInsightPopupData.id);
    }
    handleClose(false);
    setSakuOpen(true);
  };

  if (!sakuInsightPopupData) return null;

  const catStyle = CATEGORY_STYLES[sakuInsightPopupData.category] || CATEGORY_STYLES.trending;
  const CatIcon = catStyle.icon;
  const sourceLabel = SOURCE_LABELS[sakuInsightPopupData.source] || 'NychIQ AI';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md bg-[#141414] border-[#1F1F1F] p-0 overflow-hidden"
        showCloseButton={true}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#FDBA2D] flex items-center justify-center shrink-0 shadow-lg shadow-[rgba(139,92,246,0.3)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold text-[#FFFFFF]">
                AI Insight
              </DialogTitle>
              <DialogDescription className="text-xs text-[#A3A3A3] mt-0.5">
                From {sourceLabel} · Just now
              </DialogDescription>
            </div>
            {/* Category badge */}
            <div className={cn('px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shrink-0', catStyle.bg, catStyle.color)}>
              <CatIcon className="w-3 h-3" />
              {sakuInsightPopupData.category}
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-4">
          <h4 className="text-sm font-semibold text-[#FFFFFF] mb-2">
            {sakuInsightPopupData.title}
          </h4>
          <div className="rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] p-4">
            <p className="text-[13px] leading-relaxed text-[#CCCCCC]">
              {sakuInsightPopupData.body}
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-0 gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={() => handleClose(false)}
            className="flex-1 border border-[#2A2A2A] text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#1F1F1F] rounded-lg"
          >
            Dismiss
          </Button>
          <Button
            onClick={handleAskSaku}
            className="flex-1 bg-[#8B5CF6] hover:bg-[#8560B5] text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[rgba(139,92,246,0.3)]"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Ask Saku
          </Button>
          <Button
            onClick={handleTryItNow}
            className="flex-1 bg-[#FDBA2D] hover:bg-[#C69320] text-black font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[rgba(253,186,45,0.3)]"
          >
            Take Action
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
