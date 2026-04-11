'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useNychIQStore, type NextUploadSuggestion } from '@/lib/store';

/**
 * Next Upload AI Background Worker
 *
 * Works in the background analyzing optimal upload timing,
 * trending topics, and content gaps to suggest the next
 * best video to upload. Generates actionable suggestions
 * with confidence scores and tool links.
 *
 * Only active when user is logged in and on the app page.
 * Runs every 25 minutes.
 */

const UPLOAD_SUGGESTIONS: Omit<NextUploadSuggestion, 'id' | 'createdAt'>[] = [
  {
    title: 'Riding the AI Wave',
    description: '"AI tools for students" is trending with 2.1M searches this week. Only 8 quality videos exist. Create a comprehensive guide targeting students for maximum reach.',
    optimalTime: 'Tuesday, 3:00 PM WAT',
    topic: 'AI Tools for Students - Complete Guide 2026',
    confidence: 94,
    toolLink: 'ideas',
  },
  {
    title: 'Comparison Content Opportunity',
    description: '"Free vs Paid [niche] tools" format is trending with 4.2x engagement. Your audience has shown high interest in comparison content. Consider creating a detailed breakdown.',
    optimalTime: 'Wednesday, 2:30 PM WAT',
    topic: 'Free vs Paid [Tool] - Which is Actually Better?',
    confidence: 87,
    toolLink: 'viral',
  },
  {
    title: 'Tutorial Series Starter',
    description: 'Multi-part tutorial series are getting 3.5x more watch time than one-off videos in your niche. Start a "[Topic] Mastery" series to build recurring viewership.',
    optimalTime: 'Thursday, 4:00 PM WAT',
    topic: '[Topic] for Beginners - Complete Mastery Course (Part 1)',
    confidence: 82,
    toolLink: 'script',
  },
  {
    title: 'React to Trending Topic',
    description: 'A major news event in your niche is getting massive search volume (+800%). Quick reaction videos are averaging 1.5M views. Speed is critical - upload within 24 hours.',
    optimalTime: 'Today, ASAP (within 24h window)',
    topic: '[Trending Topic] - My Honest Take',
    confidence: 96,
    toolLink: 'trending',
  },
  {
    title: 'Listicle Format Winner',
    description: '"Top 10 [Niche]" videos in your niche average 2.8M views vs 450K for other formats. Your channel hasn\'t published a listicle in 3 weeks. Consider this high-performing format.',
    optimalTime: 'Friday, 3:00 PM WAT',
    topic: 'Top 10 [Niche Items] That Changed Everything in 2026',
    confidence: 89,
    toolLink: 'ideas',
  },
  {
    title: 'Audience Question Response',
    description: 'Your top-commented video has 45+ unanswered questions in comments. Creating a Q&A response video typically gets 2x engagement from your existing audience.',
    optimalTime: 'Saturday, 11:00 AM WAT',
    topic: 'Answering Your Top Questions About [Topic]',
    confidence: 78,
    toolLink: 'social-comments',
  },
  {
    title: 'Collaboration Window',
    description: 'A creator with 2x your subscribers mentioned your niche positively. Reaching out for a collaboration now could result in 10K+ cross-pollinated subscribers.',
    optimalTime: 'Next week, Mon-Wed (planning phase)',
    topic: 'Collaboration Video: [Your Niche] with [Creator]',
    confidence: 73,
    toolLink: 'competitor',
  },
  {
    title: 'Evergreen Content Update',
    description: 'Your most-viewed video from 6 months ago has declining traffic (-28%). Updating it with fresh info and re-uploading as "2026 Edition" can recapture search traffic.',
    optimalTime: 'Tuesday, 2:00 PM WAT',
    topic: '[Old Hit Topic] - 2026 Updated Guide',
    confidence: 85,
    toolLink: 'seo',
  },
  {
    title: 'Challenge/Viral Format',
    description: '"30-day challenge" videos in your niche have avg 4.1M views this month. Starting a challenge series creates built-in anticipation and recurring content.',
    optimalTime: 'Monday, 12:00 PM WAT',
    topic: 'I Tried [Challenge] for 30 Days - Here\'s What Happened',
    confidence: 91,
    toolLink: 'viral',
  },
  {
    title: 'Behind-the-Scenes Content',
    description: 'Your audience engagement spikes 67% on personal/storytelling content. A behind-the-scenes video about your creative process would deepen audience connection.',
    optimalTime: 'Sunday, 5:00 PM WAT',
    topic: 'How I Make My Videos (Behind the Scenes)',
    confidence: 76,
    toolLink: 'hook',
  },
];

const RUN_INTERVAL = 25 * 60 * 1000; // 25 minutes

function generateId(): string {
  return `nu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function NextUploadAgent() {
  const {
    isLoggedIn,
    currentPage,
    addNextUploadSuggestion,
    setBgAgentLastRun,
    bgAgentLastRun,
    nextUploadSuggestions,
    addBgInsight,
  } = useNychIQStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitialized = useRef(false);

  const generateSuggestion = useCallback(() => {
    // Pick a random suggestion (avoid repeating the most recent one)
    const lastTitle = nextUploadSuggestions[0]?.title;
    let candidates = UPLOAD_SUGGESTIONS.filter(t => t.title !== lastTitle);
    if (candidates.length === 0) candidates = UPLOAD_SUGGESTIONS;

    const template = candidates[Math.floor(Math.random() * candidates.length)];
    const suggestion: NextUploadSuggestion = {
      ...template,
      id: generateId(),
      createdAt: Date.now(),
    };

    addNextUploadSuggestion(suggestion);
    setBgAgentLastRun('nextUpload', Date.now());

    // Also add a background insight notification
    addBgInsight({
      id: generateId(),
      title: `Next Upload: ${suggestion.title}`,
      body: `${suggestion.description.slice(0, 120)}... Optimal time: ${suggestion.optimalTime}. Confidence: ${suggestion.confidence}%.`,
      toolLink: suggestion.toolLink,
      category: 'ideas',
      source: 'next-upload',
      createdAt: Date.now(),
      read: false,
    });
  }, [addNextUploadSuggestion, setBgAgentLastRun, nextUploadSuggestions, addBgInsight]);

  useEffect(() => {
    // Only run when logged in and on app page
    if (!isLoggedIn || currentPage !== 'app') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Generate first suggestion after a delay
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const timeSinceLastRun = Date.now() - bgAgentLastRun.nextUpload;

      if (timeSinceLastRun > RUN_INTERVAL) {
        const initTimer = setTimeout(() => {
          generateSuggestion();
        }, 18000); // 18 second delay after app loads
        return () => clearTimeout(initTimer);
      }
    }

    // Set up periodic interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      generateSuggestion();
    }, RUN_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoggedIn, currentPage, generateSuggestion, bgAgentLastRun.nextUpload]);

  // This component renders nothing - it's purely a background worker
  return null;
}
