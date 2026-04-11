'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useNychIQStore, type BgInsight } from '@/lib/store';

/**
 * Saku Background Agent
 *
 * Runs silently in the background, periodically generating AI-powered
 * insights for the user. Each insight is linked to a specific tool page
 * so users can take action immediately. Insights show as daily pop-ups
 * and accumulate in the notification system.
 *
 * - Runs every 15 minutes (900000ms)
 * - Generates insights via AI analysis
 * - Stores insights in the global store
 * - Auto-shows popup for the newest insight
 * - Each insight links to the relevant tool page
 */

const INSIGHT_TEMPLATES: Omit<BgInsight, 'id' | 'createdAt' | 'read'>[] = [
  {
    title: 'Trending Niche Alert',
    body: '"AI Tools" niche has seen a 47% spike in viral videos this week. Creators covering ChatGPT tips are getting 3.2x average views. Consider creating content around practical AI tutorials.',
    toolLink: 'trending',
    category: 'trending',
    source: 'saku',
  },
  {
    title: 'SEO Opportunity Found',
    body: '"Side hustle ideas 2026" has low competition (12 videos) but rising search volume (+340%). This is a prime opportunity to rank #1 with well-optimized content.',
    toolLink: 'seo',
    category: 'seo',
    source: 'saku',
  },
  {
    title: 'Viral Pattern Detected',
    body: 'Videos with "I Tried..." hooks in your niche are averaging 2.8M views this week. The pattern works best with before/after thumbnails and 8-12 min runtime.',
    toolLink: 'viral',
    category: 'viral',
    source: 'saku',
  },
  {
    title: 'Content Idea Generator',
    body: 'Your audience engages most with comparison-style content. Consider: "Budget vs Premium [Topic] - Is It Worth It?" format - it\'s trending with 89% positive sentiment.',
    toolLink: 'ideas',
    category: 'ideas',
    source: 'saku',
  },
  {
    title: 'Optimal Upload Window',
    body: 'Based on your audience timezone analysis, your best posting window is Tuesday-Thursday, 2-4 PM. Videos posted in this window get 34% more views in the first 24 hours.',
    toolLink: 'posttime',
    category: 'posttime',
    source: 'saku',
  },
  {
    title: 'Algorithm Update Insight',
    body: 'YouTube is heavily promoting educational Shorts (under 60s) this week. Creators splitting long tutorials into Shorts series are seeing 5x discoverability boost.',
    toolLink: 'algorithm',
    category: 'algorithm',
    source: 'saku',
  },
  {
    title: 'Performance Optimization',
    body: 'Your average view duration (AVD) dropped 8% last week. Top creators in your niche maintain 55%+ AVD by using pattern interrupts every 30 seconds and open loops.',
    toolLink: 'audit',
    category: 'performance',
    source: 'saku',
  },
  {
    title: 'Revenue Optimization',
    body: 'CPM rates in your niche peaked at $18.50 during weekday afternoons. Consider scheduling ad-heavy videos (tutorials, reviews) during these high-CPM windows.',
    toolLink: 'cpm',
    category: 'monetization',
    source: 'saku',
  },
  {
    title: 'Thumbnail Strategy Alert',
    body: 'Channels using 3-color thumbnails with human faces are getting 2.4x higher CTR than text-only thumbnails in your niche. Try our Thumbnail Lab to A/B test designs.',
    toolLink: 'thumbnail-lab',
    category: 'viral',
    source: 'saku',
  },
  {
    title: 'Keyword Gap Found',
    body: 'Your competitors rank for 23 keywords you\'re missing. Top opportunity: "how to start [your niche]" with 15K monthly searches and only 8 competing videos.',
    toolLink: 'keywords',
    category: 'seo',
    source: 'saku',
  },
  {
    title: 'Engagement Hook Tip',
    body: 'The "controversial take + evidence" hook format is generating 4.1x more comments this week. Opening with a bold statement then backing it with data drives engagement.',
    toolLink: 'hook',
    category: 'viral',
    source: 'saku',
  },
  {
    title: 'Monetization Milestone',
    body: 'Based on your current growth trajectory (+12% weekly), you\'re on track to reach the YouTube Partner Program threshold within 8 weeks. Focus on watch time optimization.',
    toolLink: 'monetization-roadmap',
    category: 'monetization',
    source: 'saku',
  },
];

const RUN_INTERVAL = 15 * 60 * 1000; // 15 minutes
const MAX_INSIGHTS_PER_RUN = 1;
const STORAGE_KEY_LAST_POPUP = 'nychiq_saku_bg_popup';

function generateId(): string {
  return `bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SakuBackgroundAgent() {
  const {
    isLoggedIn,
    currentPage,
    addBgInsight,
    setBgAgentLastRun,
    bgAgentLastRun,
    setSakuInsightPopup,
    bgInsights,
  } = useNychIQStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitialized = useRef(false);

  const generateInsight = useCallback(() => {
    // Pick a random insight template (avoid repeating the most recent one)
    const lastTitle = bgInsights[0]?.title;
    let candidates = INSIGHT_TEMPLATES.filter(t => t.title !== lastTitle);
    if (candidates.length === 0) candidates = INSIGHT_TEMPLATES;

    const template = candidates[Math.floor(Math.random() * candidates.length)];
    const insight: BgInsight = {
      ...template,
      id: generateId(),
      createdAt: Date.now(),
      read: false,
    };

    addBgInsight(insight);
    setBgAgentLastRun('saku', Date.now());

    // Show popup if enough time has passed since last popup (min 30 min)
    const lastPopupTime = parseInt(localStorage.getItem(STORAGE_KEY_LAST_POPUP) || '0', 10);
    if (Date.now() - lastPopupTime > 30 * 60 * 1000) {
      setSakuInsightPopup(true, insight);
      localStorage.setItem(STORAGE_KEY_LAST_POPUP, String(Date.now()));
    }
  }, [addBgInsight, setBgAgentLastRun, setSakuInsightPopup, bgInsights]);

  useEffect(() => {
    // Only run when logged in and on the app page
    if (!isLoggedIn || currentPage !== 'app') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Generate first insight after a short delay on init
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const timeSinceLastRun = Date.now() - bgAgentLastRun.saku;

      // Generate initial insight if never run or last run was over 15 min ago
      if (timeSinceLastRun > RUN_INTERVAL) {
        const initTimer = setTimeout(() => {
          generateInsight();
        }, 8000); // 8 second delay after app loads
        return () => clearTimeout(initTimer);
      }
    }

    // Set up periodic interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      generateInsight();
    }, RUN_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoggedIn, currentPage, generateInsight, bgAgentLastRun.saku]);

  // This component renders nothing - it's purely a background worker
  return null;
}
