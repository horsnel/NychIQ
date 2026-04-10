'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';

/* ── Daily insights keyed by day index (0=Sunday … 6=Saturday) ── */
const DAILY_INSIGHTS: Record<number, { text: string; tool: string }> = {
  1: { // Monday
    text: '🔥 Trending Alert: \'Tech Reviews\' niche saw a 34% spike in viral videos this week. Consider creating content around AI tools and gadgets.',
    tool: 'trending',
  },
  2: { // Tuesday
    text: '📊 Performance Tip: Videos posted between 2-4 PM WAT get 23% more engagement. Schedule your next upload accordingly.',
    tool: 'posttime',
  },
  3: { // Wednesday
    text: '💡 Content Idea: \'How I Made $5K from YouTube in Nigeria\' — this format is trending with 89% positive sentiment.',
    tool: 'ideas',
  },
  4: { // Thursday
    text: '📈 Algorithm Update: YouTube\'s Shorts algorithm is favoring educational content. Consider splitting your long-form videos into Shorts.',
    tool: 'algorithm',
  },
  5: { // Friday
    text: '🎯 SEO Opportunity: \'Side hustle in Nigeria 2026\' has low competition but rising search volume. Create a video now!',
    tool: 'seo',
  },
  6: { // Saturday
    text: '⚡ Viral Pattern: Videos with \'SHOCKING\' or \'You Won\'t Believe\' in titles are getting 2.3x more clicks in the Nigerian market.',
    tool: 'viral',
  },
  0: { // Sunday
    text: '🤖 AI Insight: Channels using AI-generated thumbnails see 18% higher CTR. Try our Thumbnail Lab tool!',
    tool: 'thumbnail-lab',
  },
};

const STORAGE_KEY = 'nychiq_saku_popup_date';

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function SakuDailyPopup() {
  const [open, setOpen] = useState(false);
  const isLoggedIn = useNychIQStore((s) => s.isLoggedIn);
  const currentPage = useNychIQStore((s) => s.currentPage);
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  const canAccess = useNychIQStore((s) => s.canAccess);

  const handleTryItNow = useCallback(() => {
    const dayIndex = new Date().getDay();
    const insight = DAILY_INSIGHTS[dayIndex];
    if (insight && canAccess(insight.tool)) {
      setActiveTool(insight.tool);
    }
    setOpen(false);
  }, [setActiveTool, canAccess]);

  useEffect(() => {
    // Only show if user is logged in and on the 'app' page
    if (!isLoggedIn || currentPage !== 'app') return;

    // Check if already shown today
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const today = getTodayDateString();
    if (lastShown === today) return;

    // Show after 3 seconds
    const timer = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, today);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoggedIn, currentPage]);

  const dayIndex = new Date().getDay();
  const insight = DAILY_INSIGHTS[dayIndex];
  if (!insight) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-md bg-[#141414] border-[#222222] p-0 overflow-hidden"
        showCloseButton={true}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            {/* Saku AI avatar — purple gradient circle with sparkles */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9B72CF] to-[#6B3FA0] flex items-center justify-center shrink-0 shadow-lg shadow-[rgba(155,114,207,0.3)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#E8E8E8]">
                Daily Insight
              </DialogTitle>
              <DialogDescription className="text-xs text-[#888888] mt-0.5">
                Your personalized AI-powered tip for today
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="px-6 py-4">
          <div className="rounded-lg bg-[#0D0D0D] border border-[#1E1E1E] p-4">
            <p className="text-sm leading-relaxed text-[#CCCCCC]">
              {insight.text}
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="px-6 pb-6 pt-0 gap-3 sm:gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="flex-1 border border-[#2A2A2A] text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] rounded-lg"
          >
            Dismiss
          </Button>
          <Button
            onClick={handleTryItNow}
            className="flex-1 bg-[#FDBA2D] hover:bg-[#D9A013] text-black font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[rgba(253,186,45,0.3)]"
          >
            Try It Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
