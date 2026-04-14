'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Eye,
  Zap,
  BarChart3,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  X,
} from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/* ── Insight item interface ── */
interface DailyInsightItem {
  id: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  title: string;
  description: string;
  tool: string;
  toolLabel: string;
  priority: 'urgent' | 'high' | 'medium' | 'info';
}

/* ── Generate daily insights based on day of week ── */
function generateDailyInsights(): DailyInsightItem[] {
  const dayIndex = new Date().getDay();
  const weekNumber = Math.floor((new Date().getDate() - 1) / 7) + 1;

  // Competitor intelligence pool
  const competitorInsights = [
    { title: 'Competitor Upload Detected', description: '"TechWithTim" uploaded a new video 2h ago titled "Why Most Developers Fail at System Design". It gained 12K views in the first hour — consider creating a response or complementary content.', tool: 'competitor', toolLabel: 'Track Channels' },
    { title: 'Rival Channel Growth Spike', description: '"Fireship" gained 15K subscribers in the last 48 hours after a viral Shorts clip. The topic was AI coding assistants — currently trending in your niche.', tool: 'ghost-tracker', toolLabel: 'Ghost Tracker' },
    { title: 'Top Competitor SEO Strategy', description: '"TraversyMedia" updated 8 video descriptions with new keyword clusters. Their average CTR improved by 18%. Consider analyzing their keyword strategy.', tool: 'strategy', toolLabel: 'Copy Strategy' },
    { title: 'Competitor Content Gap Found', description: 'None of your top 5 competitors have covered "AI Agents for Content Creators" — this is a high-potential gap with 2.3K monthly searches and zero competition.', tool: 'digital-scout', toolLabel: 'Product Scout' },
  ];

  // Channel fault detection pool
  const faultInsights = [
    { title: 'Thumbnail CTR Below Average', description: 'Your last 3 videos have a 4.2% CTR, which is 23% below your niche average of 5.5%. Consider testing brighter colors and adding faces/text overlays.', tool: 'thumbnail-lab', toolLabel: 'Thumbnail Lab' },
    { title: 'Upload Frequency Drop', description: 'You uploaded only 1 video this week vs. your average of 2.5. The algorithm penalizes inconsistent schedules — consider batch-recording to maintain momentum.', tool: 'automation', toolLabel: 'Automation' },
    { title: 'Title Pattern Detected', description: 'Your last 5 titles all start with "How to" — audiences in your niche respond 31% better to question-based titles like "Can You...?" or "Why Does...?".', tool: 'hook', toolLabel: 'Hook Generator' },
    { title: 'Description SEO Weakness', description: '3 of your recent videos have descriptions under 100 words. Videos with 200-300 word descriptions rank 40% higher in YouTube search.', tool: 'seo', toolLabel: 'SEO Optimizer' },
    { title: 'End Screen Missing', description: 'Your latest video has no end screen or cards. Adding end screens can increase session duration by up to 25%.', tool: 'audit', toolLabel: 'Channel Audit' },
  ];

  // Niche insight pool
  const nicheInsights = [
    { title: 'Rising Niche Opportunity', description: '"AI Coding Tutorials" niche grew 47% this month with an average CPM of $18.50. The competition is still low — now is the time to establish authority.', tool: 'niche', toolLabel: 'Niche Spy' },
    { title: 'Keyword Goldmine Found', description: '"Claude AI tutorial" has 8.1K monthly searches with only 12 competing videos. Estimated traffic potential: 2.5K views/month if you rank #1.', tool: 'keywords', toolLabel: 'Keyword Explorer' },
    { title: 'Audience Trend Shift', description: 'Your niche audience is 34% more interested in "no-code tools" vs. 6 months ago. Consider pivoting 20% of your content to match this demand.', tool: 'algorithm', toolLabel: 'Algorithm' },
    { title: 'Cross-Platform Opportunity', description: 'Your top-performing YouTube topic "React Server Components" has 3.2M views on TikTok but only 5 creators covering it. Repurpose your existing content!', tool: 'goffviral', toolLabel: 'GoffViral' },
  ];

  // Growth tips pool
  const growthInsights = [
    { title: 'Optimal Upload Window', description: 'Based on your audience analytics, the best upload time is Wednesday 2-4 PM WAT. Your next scheduled video should target this window for maximum reach.', tool: 'posttime', toolLabel: 'Best Post Time' },
    { title: 'Shorts Growth Strategy', description: 'Channels that post 3 Shorts/week alongside 1 long-form video grow 2.8x faster. Convert your best performing segments into Shorts.', tool: 'shorts', toolLabel: 'Shorts' },
    { title: 'Script Hook Optimization', description: 'Your best performing video had a 92% retention rate in the first 30 seconds because of a controversial statement hook. Replicate this pattern.', tool: 'script', toolLabel: 'Script Writer' },
    { title: 'Viral Potential Detected', description: 'AI predicts your topic "Building a Full-Stack App with AI Agents" has an 82% viral probability. Consider prioritizing this for your next upload.', tool: 'viral', toolLabel: 'Viral Predictor' },
    { title: 'Engagement Boost Available', description: 'Adding pinned comments with questions can increase engagement by 35%. Your last 3 videos have zero pinned comments.', tool: 'social-comments', toolLabel: 'Comment Sentiment' },
  ];

  // Select insights based on day + week rotation for variety
  const pick = (arr: typeof competitorInsights, offset: number) => arr[(dayIndex + weekNumber + offset) % arr.length];

  const insights: DailyInsightItem[] = [];

  // Always include one urgent/high priority item
  const urgentItem = pick(faultInsights, 0);
  insights.push({
    id: 'fault-1',
    icon: <AlertTriangle className="w-4 h-4" />,
    iconColor: '#888888',
    iconBg: 'rgba(0,0,0,0)',
    borderColor: 'rgba(255,255,255,0.03)',
    title: urgentItem.title,
    description: urgentItem.description,
    tool: urgentItem.tool,
    toolLabel: urgentItem.toolLabel,
    priority: 'urgent',
  });

  // One competitor intelligence item
  const compItem = pick(competitorInsights, 1);
  insights.push({
    id: 'comp-1',
    icon: <Eye className="w-4 h-4" />,
    iconColor: '#888888',
    iconBg: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.03)',
    title: compItem.title,
    description: compItem.description,
    tool: compItem.tool,
    toolLabel: compItem.toolLabel,
    priority: 'high',
  });

  // One niche insight
  const nicheItem = pick(nicheInsights, 2);
  insights.push({
    id: 'niche-1',
    icon: <Target className="w-4 h-4" />,
    iconColor: '#888888',
    iconBg: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.03)',
    title: nicheItem.title,
    description: nicheItem.description,
    tool: nicheItem.tool,
    toolLabel: nicheItem.toolLabel,
    priority: 'medium',
  });

  // One growth tip
  const growthItem = pick(growthInsights, 3);
  insights.push({
    id: 'growth-1',
    icon: <Lightbulb className="w-4 h-4" />,
    iconColor: '#FDBA2D',
    iconBg: 'rgba(253,186,45,0.1)',
    borderColor: 'rgba(255,255,255,0.03)',
    title: growthItem.title,
    description: growthItem.description,
    tool: growthItem.tool,
    toolLabel: growthItem.toolLabel,
    priority: 'info',
  });

  return insights;
}

const STORAGE_KEY = 'nychiq_saku_popup_date';

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SakuDailyPopup() {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLoggedIn = useNychIQStore((s) => s.isLoggedIn);
  const currentPage = useNychIQStore((s) => s.currentPage);
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  const setPage = useNychIQStore((s) => s.setPage);
  const canAccess = useNychIQStore((s) => s.canAccess);

  const insights = useMemo(() => generateDailyInsights(), []);
  const currentInsight = insights[currentIndex] || insights[0];

  const handleFixNow = useCallback(() => {
    if (currentInsight && canAccess(currentInsight.tool)) {
      setActiveTool(currentInsight.tool);
      setPage('app');
    }
    setOpen(false);
  }, [currentInsight, setActiveTool, setPage, canAccess]);

  const handleNext = useCallback(() => {
    if (currentIndex < insights.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, insights.length]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || currentPage !== 'app') return;

    const lastShown = localStorage.getItem(STORAGE_KEY);
    const today = getTodayDateString();
    if (lastShown === today) return;

    const timer = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, today);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoggedIn, currentPage]);

  if (!currentInsight || insights.length === 0) return null;

  const isLast = currentIndex === insights.length - 1;
  const progress = ((currentIndex + 1) / insights.length) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-lg bg-[#0f0f0f] border-[rgba(255,255,255,0.03)] p-0 overflow-hidden"
        showCloseButton={true}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Saku AI avatar */}
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#111111] flex items-center justify-center shrink-0 shadow-lg shadow-[rgba(0,0,0,0.3)]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#888888] border-2 border-[#0f0f0f]" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#FFFFFF]">
                  Saku Daily Intelligence
                </DialogTitle>
                <DialogDescription className="text-xs text-[#a0a0a0] mt-0.5">
                  {insights.length} insights for today &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </DialogDescription>
              </div>
            </div>

            {/* Priority badge */}
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                currentInsight.priority === 'urgent' && 'bg-[rgba(255,255,255,0.03)] text-[#888888] border border-[rgba(255,255,255,0.03)]',
                currentInsight.priority === 'high' && 'bg-[rgba(253,186,45,0.15)] text-[#FDBA2D] border border-[rgba(255,255,255,0.03)]',
                currentInsight.priority === 'medium' && 'bg-[rgba(255,255,255,0.03)] text-[#888888] border border-[rgba(255,255,255,0.03)]',
                currentInsight.priority === 'info' && 'bg-[rgba(255,255,255,0.03)] text-[#888888] border border-[rgba(255,255,255,0.03)]',
              )}
            >
              {currentInsight.priority === 'urgent' ? 'Urgent' : currentInsight.priority === 'high' ? 'High' : currentInsight.priority === 'medium' ? 'Medium' : 'Tip'}
            </span>
          </div>
        </DialogHeader>

        {/* ── Progress bar ── */}
        <div className="px-6 pt-4">
          <div className="w-full h-1 rounded-full bg-[#1A1A1A] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${currentInsight.iconColor}, ${currentInsight.iconColor}88)`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-[#666666]">
              {currentIndex + 1} of {insights.length}
            </span>
            <div className="flex items-center gap-1">
              {insights.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    i === currentIndex ? currentInsight.iconColor : i < currentIndex ? '#666666' : '#1a1a1a'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Insight Card ── */}
        <div className="px-6 py-4">
          <div
            className="rounded-lg p-4 border transition-all"
            style={{
              backgroundColor: currentInsight.iconBg,
              borderColor: currentInsight.borderColor,
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: currentInsight.iconBg, border: `1px solid ${currentInsight.borderColor}` }}
              >
                <span style={{ color: currentInsight.iconColor }}>{currentInsight.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#FFFFFF] mb-1.5">
                  {currentInsight.title}
                </h3>
                <p className="text-xs text-[#BBBBBB] leading-relaxed">
                  {currentInsight.description}
                </p>
              </div>
            </div>

            {/* Navigate to tool link */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canAccess(currentInsight.tool)) {
                  setActiveTool(currentInsight.tool);
                  setPage('app');
                  setOpen(false);
                }
              }}
              className="flex items-center gap-2 mt-3 px-3 py-2 rounded-md bg-black/20 border border-white/5 hover:bg-black/30 transition-colors w-full group"
            >
              <span className="text-xs text-[#a0a0a0] group-hover:text-[#FFFFFF] transition-colors">
                Open {currentInsight.toolLabel} to fix
              </span>
              <ArrowRight className="w-3 h-3 text-[#666666] group-hover:text-[#FDBA2D] transition-colors ml-auto" />
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="px-6 pb-6 pt-0 gap-2 sm:gap-3 flex-col sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full sm:w-auto border border-[rgba(255,255,255,0.03)] text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] rounded-lg"
          >
            <X className="w-4 h-4 mr-2" />
            Dismiss All
          </Button>

          {!isLast ? (
            <Button
              onClick={handleNext}
              className="w-full sm:w-auto bg-[#1A1A1A] border border-[#1a1a1a] text-[#FFFFFF] hover:bg-[#0f0f0f] hover:border-[#666666] rounded-lg transition-all"
            >
              Next Insight
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFixNow}
              className="w-full sm:w-auto bg-[#FDBA2D] hover:bg-[#C69320] text-black font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[rgba(253,186,45,0.12)]"
            >
              <Zap className="w-4 h-4 mr-2" />
              Fix Now — {currentInsight.toolLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
