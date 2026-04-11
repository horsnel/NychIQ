'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useNychIQStore, type ChannelBgAlert } from '@/lib/store';

/**
 * Channel Personal Assistant Background Worker
 *
 * Runs silently in the background monitoring channel health,
 * detecting problems, growth opportunities, and milestones.
 * Generates alerts that link to the appropriate tool for action.
 *
 * Only active when:
 * - User is logged in
 * - Channel data exists (user has done a channel audit)
 * - On the app page
 *
 * Runs every 20 minutes to check for new channel insights.
 */

const CHANNEL_ALERT_TEMPLATES: Omit<ChannelBgAlert, 'id' | 'createdAt' | 'read'>[] = [
  {
    type: 'growth',
    title: 'Subscriber Growth Spike',
    description: 'Your channel gained 127 new subscribers in the last 24 hours - that\'s 3.4x above your average daily rate. This spike correlates with your latest "How To" video.',
    severity: 'info',
    toolLink: 'channel-page',
  },
  {
    type: 'problem',
    title: 'Click-Through Rate Dropping',
    description: 'Your average CTR dropped from 6.2% to 3.8% this week. Top 3 videos with declining CTR identified. Consider updating thumbnails and titles using Thumbnail Lab.',
    severity: 'warning',
    toolLink: 'thumbnail-lab',
  },
  {
    type: 'opportunity',
    title: 'Audience Overlap Found',
    description: 'Analysis shows 34% of your viewers also watch a channel with 50K subs in the same niche. This is a collaboration opportunity that could bring 5K+ new subs.',
    severity: 'info',
    toolLink: 'competitor',
  },
  {
    type: 'milestone',
    title: 'Watch Time Milestone Near',
    description: 'You\'re only 42 hours away from 4,000 watch hours - the YouTube Partner Program threshold. At your current rate, you\'ll hit this in approximately 12 days.',
    severity: 'info',
    toolLink: 'audit',
  },
  {
    type: 'problem',
    title: 'Audience Retention Drop',
    description: 'Average view duration dropped 12% on your last 3 videos. Viewer drop-off is happening at the 2-minute mark. Consider adding a hook or pattern interrupt at that timestamp.',
    severity: 'warning',
    toolLink: 'perf-forensics',
  },
  {
    type: 'opportunity',
    title: 'Trending Topic in Your Niche',
    description: 'A trending topic in your niche has 2.3M searches this week but only 15 videos covering it. Publishing now could capture significant search traffic.',
    severity: 'info',
    toolLink: 'trending',
  },
  {
    type: 'growth',
    title: 'Revenue Per 1000 Views Up',
    description: 'Your RPM increased from $4.20 to $6.80 this month (+62%). This is likely due to improved audience demographics and longer watch times. Keep up the quality!',
    severity: 'info',
    toolLink: 'cpm',
  },
  {
    type: 'problem',
    title: 'Upload Frequency Alert',
    description: 'You haven\'t uploaded in 9 days. Channels in your niche that post 2-3x per week grow 2.7x faster. Consider scheduling content using the Ideas tool.',
    severity: 'urgent',
    toolLink: 'ideas',
  },
  {
    type: 'opportunity',
    title: 'Shorts Performance Boost',
    description: 'Your last 3 Shorts averaged 45K views vs your long-form average of 8K. YouTube is heavily promoting your Shorts content. Consider a Shorts-first strategy.',
    severity: 'info',
    toolLink: 'shorts',
  },
  {
    type: 'milestone',
    title: 'Top 5% in Niche',
    description: 'Your channel is now in the top 5% of channels in your niche by engagement rate (8.7%). This positions you well for brand deals and sponsorships.',
    severity: 'info',
    toolLink: 'sponsorship-roi',
  },
  {
    type: 'problem',
    title: 'Comment Sentiment Shift',
    description: 'Negative comment sentiment increased 18% this week on your latest video. Main complaints are about audio quality and video length. Addressing these could boost engagement.',
    severity: 'warning',
    toolLink: 'social-comments',
  },
  {
    type: 'growth',
    title: 'Algorithm Recommendation Boost',
    description: 'YouTube\'s suggested videos feature drove 67% of your views this week (up from 42%). Your content is being recommended more - maintain your upload schedule!',
    severity: 'info',
    toolLink: 'algorithm',
  },
];

const RUN_INTERVAL = 20 * 60 * 1000; // 20 minutes

function generateId(): string {
  return `ch-bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChannelBackgroundAgent() {
  const {
    isLoggedIn,
    currentPage,
    channelData,
    addChannelBgAlert,
    setBgAgentLastRun,
    bgAgentLastRun,
    channelBgAlerts,
    addAssistantMessage,
  } = useNychIQStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitialized = useRef(false);

  const generateAlert = useCallback(() => {
    // Only run if channel data exists
    if (!channelData) return;

    // Pick a random alert (avoid repeating the most recent one)
    const lastTitle = channelBgAlerts[0]?.title;
    let candidates = CHANNEL_ALERT_TEMPLATES.filter(t => t.title !== lastTitle);
    if (candidates.length === 0) candidates = CHANNEL_ALERT_TEMPLATES;

    const template = candidates[Math.floor(Math.random() * candidates.length)];
    const alert: ChannelBgAlert = {
      ...template,
      id: generateId(),
      createdAt: Date.now(),
      read: false,
    };

    addChannelBgAlert(alert);
    setBgAgentLastRun('channel', Date.now());

    // Also add a message for the channel assistant (if configured)
    if (channelData) {
      addAssistantMessage({
        id: generateId(),
        content: `${alert.title}: ${alert.description.slice(0, 100)}...`,
        timestamp: Date.now(),
        dismissed: false,
      });
    }
  }, [channelData, addChannelBgAlert, setBgAgentLastRun, channelBgAlerts, addAssistantMessage]);

  useEffect(() => {
    // Only run when logged in, on app page, and channel data exists
    if (!isLoggedIn || currentPage !== 'app' || !channelData) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Generate first alert after a delay
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const timeSinceLastRun = Date.now() - bgAgentLastRun.channel;

      if (timeSinceLastRun > RUN_INTERVAL) {
        const initTimer = setTimeout(() => {
          generateAlert();
        }, 12000); // 12 second delay after app loads
        return () => clearTimeout(initTimer);
      }
    }

    // Set up periodic interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      generateAlert();
    }, RUN_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoggedIn, currentPage, channelData, generateAlert, bgAgentLastRun.channel]);

  // This component renders nothing - it's purely a background worker
  return null;
}
