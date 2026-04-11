'use client';

import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Upload,
  AlertTriangle,
  Sparkles,
  Bell,
  Eye,
  Users,
  Film,
  Heart,
  BarChart3,
  ArrowRight,
  Bot,
  Radio,
  Shield,
  ArrowUpRight,
  ChevronRight,
  Copy,
  Download,
  Check,
} from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { fmtV, timeAgo, copyToClipboard, exportVideoDataCSV } from '@/lib/utils';
import { showToast } from '@/lib/toast';

/* ═══════════════════════════════════════════════════════════
   Types — Channel data interfaces
   ═══════════════════════════════════════════════════════════ */

interface ChannelActivity {
  id?: string;
  type: 'upload' | 'trending' | 'trend' | 'alert' | 'milestone' | 'notification' | 'recommendation';
  title: string;
  description?: string;
  timestamp: string | number;
  toolLink?: string;
  toolLabel?: string;
}

interface ChannelProblem {
  id?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendedFix: string;
  fix?: string;
  toolLink?: string;
  toolLabel?: string;
}

interface ChannelData {
  channelName: string;
  channelHandle: string;
  channelAvatar: string;
  subscribers: number;
  totalViews: number;
  videosCount: number;
  engagementRate: number;
  weeklyGrowth: number;
  healthScore: number;
  lastScraped: string;
  subscriberChange: number;
  activities: ChannelActivity[];
  problems: ChannelProblem[];
}

interface AssistantConfig {
  name: string;
  character: string;
  characterType?: string;
  isActive: boolean;
  active?: boolean;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */

const MOCK_CHANNEL_DATA: ChannelData = {
  channelName: 'TechVision Studio',
  channelHandle: '@techvisionstudio',
  channelAvatar: '',
  subscribers: 245800,
  totalViews: 18420000,
  videosCount: 312,
  engagementRate: 7.2,
  weeklyGrowth: 4.8,
  healthScore: 82,
  lastScraped: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  subscriberChange: 2.3,
  activities: [
    {
      type: 'upload',
      title: 'New video published',
      description: '"Building a Full-Stack App with Next.js 16" is now live',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      toolLink: 'search',
      toolLabel: 'Analyze',
    },
    {
      type: 'trending',
      title: 'Video trending upward',
      description: '"AI Tools for 2025" surged +340% in views this week',
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      type: 'alert',
      title: 'Engagement drop detected',
      description: 'Last 3 videos show 18% lower than average CTR on thumbnails',
      timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      toolLink: 'thumbnail-lab',
      toolLabel: 'Thumbnail Lab',
    },
    {
      type: 'milestone',
      title: 'Subscriber milestone approaching',
      description: 'Only 4,200 subs away from 250K! Current pace: ~1,200/week.',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      type: 'notification',
      title: 'Algorithm recommendation',
      description: 'YouTube suggests posting on Tue & Thu for max reach in your niche',
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      toolLink: 'posttime',
      toolLabel: 'Best Post Time',
    },
  ],
  problems: [
    {
      severity: 'HIGH',
      title: 'Thumbnail CTR below niche average',
      description: 'Your last 5 videos average 4.2% CTR vs. 6.8% niche average. This is suppressing impressions.',
      recommendedFix: 'Run a thumbnail A/B test using the Thumbnail Lab. Increase contrast, add face/emotion, and use max 5 words of text. Test against top-performing thumbnails in your niche.',
      toolLink: 'thumbnail-lab',
      toolLabel: 'Thumbnail Lab',
    },
    {
      severity: 'MEDIUM',
      title: 'Upload frequency inconsistency',
      description: 'Gaps of 9-14 days between uploads detected. Algorithm favors channels with consistent 2-3x weekly schedules.',
      recommendedFix: 'Use ScriptFlow to batch-script 4 videos at once, then schedule across 2 weeks. Consistency signals reliability to YouTube\'s recommendation engine.',
      toolLink: 'scriptflow',
      toolLabel: 'ScriptFlow',
    },
    {
      severity: 'LOW',
      title: 'Missing end screens on older videos',
      description: '47 of your 312 videos lack end screens, missing potential session-time and subscriber conversion signals.',
      recommendedFix: 'Prioritize adding end screens to your top 20 most-viewed videos. YouTube Studio allows bulk editing of end screen templates.',
    },
  ],
};

const MOCK_ACTIVITIES: ChannelActivity[] = [
  {
    type: 'upload',
    title: 'New video published',
    description: '"React Server Components Deep Dive" is now live on your channel',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    toolLink: 'search',
    toolLabel: 'Analyze',
  },
  {
    type: 'trending',
    title: 'Spike in search traffic',
    description: 'Your SEO keywords drove +2.1K impressions in the last 24 hours',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    toolLink: 'seo',
    toolLabel: 'SEO Tool',
  },
  {
    type: 'alert',
    title: 'Comment sentiment shift',
    description: 'Negative sentiment increased by 12% on the latest upload',
    timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    toolLink: 'social-comments',
    toolLabel: 'Comment Sentiment',
  },
  {
    type: 'milestone',
    title: 'Monthly views target hit',
    description: 'You reached 1.2M views this month — 15% above target',
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
  {
    type: 'notification',
    title: 'Competitor activity detected',
    description: 'A tracked channel uploaded a video targeting the same keyword',
    timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    toolLink: 'competitor',
    toolLabel: 'Track Channels',
  },
];

const MOCK_PROBLEMS: ChannelProblem[] = [
  {
    severity: 'HIGH',
    title: 'Video retention dropping',
    description: 'Average view duration fell to 42% from 58% over the past month.',
    recommendedFix: 'Use HookLab to test stronger openers. The first 30 seconds are critical — add a pattern interrupt or tease the payoff early.',
    toolLink: 'hooklab',
    toolLabel: 'HookLab',
  },
  {
    severity: 'MEDIUM',
    title: 'Underperforming Shorts',
    description: 'Last 5 Shorts average 2.3% engagement vs. 5.1% benchmark.',
    recommendedFix: 'Shorts need fast hooks under 1 second, loop-friendly endings, and trending audio. Use the Shorts tool for optimal format analysis.',
    toolLink: 'shorts',
    toolLabel: 'Shorts Intel',
  },
  {
    severity: 'LOW',
    title: 'Description SEO not optimized',
    description: 'Only 8 of 312 videos use the recommended description template with timestamps and links.',
    recommendedFix: 'Create a description template with sections: Hook, Timestamps, Links, Keywords. Apply to all new uploads via a checklist.',
  },
];

const MOCK_ASSISTANT: AssistantConfig = {
  name: 'SAKU',
  character: 'bot',
  characterType: 'Strategic Analyst',
  isActive: true,
  active: true,
};

/* ═══════════════════════════════════════════════════════════
   Helper: Activity type icon map
   ═══════════════════════════════════════════════════════════ */

const ACTIVITY_ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  upload: { icon: Upload, color: '#10B981' },
  trending: { icon: TrendingUp, color: '#3B82F6' },
  trend: { icon: TrendingUp, color: '#3B82F6' },
  recommendation: { icon: Bell, color: '#3B82F6' },
  alert: { icon: AlertTriangle, color: '#FDBA2D' },
  milestone: { icon: Sparkles, color: '#8B5CF6' },
  notification: { icon: Bell, color: '#A3A3A3' },
};

/* ═══════════════════════════════════════════════════════════
   Sci-Fi Card Wrapper — Corner brackets + grid background
   ═══════════════════════════════════════════════════════════ */

function SciFiCard({
  children,
  accentColor = '#10B981',
  className = '',
  style,
  topBorder = true,
}: {
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
  topBorder?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: '#0D0D0D',
        borderTop: topBorder ? `2px solid ${accentColor}` : undefined,
        borderLeft: '1px solid #1F1F1F',
        borderRight: '1px solid #1F1F1F',
        borderBottom: '1px solid #1F1F1F',
        ...style,
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Corner brackets */}
      <span className="absolute top-1 left-1 w-2.5 h-2.5 pointer-events-none" style={{ borderTop: `1px solid ${accentColor}40`, borderLeft: `1px solid ${accentColor}40` }} />
      <span className="absolute top-1 right-1 w-2.5 h-2.5 pointer-events-none" style={{ borderTop: `1px solid ${accentColor}40`, borderRight: `1px solid ${accentColor}40` }} />
      <span className="absolute bottom-1 left-1 w-2.5 h-2.5 pointer-events-none" style={{ borderBottom: `1px solid ${accentColor}40`, borderLeft: `1px solid ${accentColor}40` }} />
      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 pointer-events-none" style={{ borderBottom: `1px solid ${accentColor}40`, borderRight: `1px solid ${accentColor}40` }} />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Health Score Donut Gauge
   ═══════════════════════════════════════════════════════════ */

function HealthGauge({ score }: { score: number }) {
  const radius = 44;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const color =
    score >= 80 ? '#10B981' : score >= 60 ? '#FDBA2D' : score >= 40 ? '#3B82F6' : '#EF4444';
  const grade =
    score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[108px] h-[108px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1F1F1F" strokeWidth={strokeWidth} />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 4px ${color}60)`,
            }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] text-[#A3A3A3] font-mono tracking-wider">
            GRADE {grade}
          </span>
        </div>
      </div>
      <div
        className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider"
        style={{
          color,
          backgroundColor: `${color}15`,
          border: `1px solid ${color}30`,
        }}
      >
        HEALTH SCORE
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 1 — Mission Briefing Header
   ═══════════════════════════════════════════════════════════ */

function MissionBriefingHeader({
  channelData,
}: {
  channelData: ChannelData;
}) {
  const handle = channelData.channelHandle.replace('@', '');

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
        }}
      />

      <div
        className="relative z-10 p-5 sm:p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(16,185,129,0.04) 50%, rgba(0,0,0,0) 100%)',
          border: '1px solid #1F1F1F',
          borderRadius: '0.75rem',
        }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with purple glow ring */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{
                background: channelData.channelAvatar
                  ? `url(${channelData.channelAvatar}) center/cover`
                  : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                boxShadow: '0 0 20px rgba(139,92,246,0.4), 0 0 40px rgba(139,92,246,0.15)',
                border: '3px solid rgba(139,92,246,0.6)',
              }}
            >
              {!channelData.channelAvatar && channelData.channelName.charAt(0)}
            </div>
            {/* Pulsing ring */}
            <div
              className="absolute -inset-1 rounded-full animate-ping opacity-20"
              style={{
                border: '2px solid #8B5CF6',
                animationDuration: '2.5s',
              }}
            />
          </div>

          {/* Channel info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mb-1">
              {channelData.channelName}
            </h2>
            <p className="text-sm text-[#A3A3A3] font-mono mb-3">{channelData.channelHandle}</p>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <a
                href={`https://youtube.com/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all duration-200 hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  boxShadow: '0 0 12px rgba(139,92,246,0.3)',
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                VISIT CHANNEL
              </a>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-mono text-[#A3A3A3] bg-[#141414] border border-[#1F1F1F]">
                <Radio className="w-3 h-3 text-[#10B981]" />
                Scanned {timeAgo(channelData.lastScraped)}
              </span>
            </div>
          </div>

          {/* Health Gauge */}
          <div className="shrink-0 hidden sm:block">
            <HealthGauge score={channelData.healthScore} />
          </div>
        </div>

        {/* Mobile health gauge */}
        <div className="flex justify-center mt-5 sm:hidden">
          <HealthGauge score={channelData.healthScore} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 2 — Stats Grid (6 sci-fi metric cards)
   ═══════════════════════════════════════════════════════════ */

function StatsGrid({ channelData }: { channelData: ChannelData }) {
  const stats = [
    {
      label: 'SUBSCRIBERS',
      value: fmtV(channelData.subscribers),
      change: channelData.subscriberChange,
      accentColor: '#8B5CF6',
      icon: <Users className="w-4 h-4" />,
    },
    {
      label: 'TOTAL VIEWS',
      value: fmtV(channelData.totalViews),
      change: null,
      accentColor: '#3B82F6',
      icon: <Eye className="w-4 h-4" />,
    },
    {
      label: 'VIDEOS',
      value: channelData.videosCount.toLocaleString(),
      change: null,
      accentColor: '#10B981',
      icon: <Film className="w-4 h-4" />,
    },
    {
      label: 'ENGAGEMENT',
      value: `${channelData.engagementRate}%`,
      change: channelData.engagementRate >= 6 ? 1.8 : -0.5,
      accentColor: '#FDBA2D',
      icon: <Heart className="w-4 h-4" />,
    },
    {
      label: 'WEEKLY GROWTH',
      value: `${channelData.weeklyGrowth}%`,
      change: channelData.weeklyGrowth,
      accentColor: '#10B981',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: 'HEALTH SCORE',
      value: `${channelData.healthScore}/100`,
      change: null,
      accentColor:
        channelData.healthScore >= 80
          ? '#10B981'
          : channelData.healthScore >= 60
          ? '#FDBA2D'
          : '#EF4444',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const isPositive = stat.change !== null && stat.change > 0;
        const isNegative = stat.change !== null && stat.change < 0;

        return (
          <SciFiCard
            key={stat.label}
            accentColor={stat.accentColor}
            className="p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-mono font-bold tracking-widest text-[#A3A3A3]"
              >
                {stat.label}
              </span>
              <span style={{ color: `${stat.accentColor}80` }}>{stat.icon}</span>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-xl sm:text-2xl font-bold text-[#FFFFFF]">
                {stat.value}
              </span>
              {stat.change !== null && (
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-bold mb-0.5 ${
                    isPositive ? 'text-[#10B981]' : isNegative ? 'text-[#EF4444]' : 'text-[#A3A3A3]'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : isNegative ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : null}
                  {isPositive ? '+' : ''}
                  {stat.change}%
                </span>
              )}
            </div>
          </SciFiCard>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 3 — Channel Activity Log
   ═══════════════════════════════════════════════════════════ */

function ActivityLog({ activities }: { activities: ChannelActivity[] }) {
  const { setActiveTool } = useNychIQStore();

  return (
    <SciFiCard accentColor="#10B981" className="overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 border-b border-[#1F1F1F] flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full animate-pulse-live"
          style={{ backgroundColor: '#10B981' }}
        />
        <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-[#FFFFFF]">
          CHANNEL ACTIVITY LOG
        </h3>
      </div>

      {/* Activity list */}
      <div className="max-h-[400px] overflow-y-auto">
        {activities.map((activity, idx) => {
          const iconData = ACTIVITY_ICON_MAP[activity.type] || ACTIVITY_ICON_MAP.notification;
          const Icon = iconData.icon;

          return (
            <div
              key={activity.id || idx}
              className="relative px-4 sm:px-5 py-3.5 transition-colors hover:bg-[rgba(255,255,255,0.015)]"
            >
              {/* Left accent line */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ backgroundColor: `${iconData.color}30` }}
              />

              {/* Faint grid line between items */}
              {idx < activities.length - 1 && (
                <div className="absolute bottom-0 left-4 right-4 h-px bg-[#1F1F1F]" />
              )}

              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-md shrink-0 mt-0.5"
                  style={{ backgroundColor: `${iconData.color}12` }}
                >
                  <Icon className="w-4 h-4" style={{ color: iconData.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[#FFFFFF] truncate">
                      {activity.title}
                    </h4>
                    <span className="text-[10px] text-[#555555] font-mono shrink-0">
                      {timeAgo(String(activity.timestamp))}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-[#A3A3A3] mt-0.5 leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                  {activity.toolLink && (
                    <button
                      onClick={() => setActiveTool(activity.toolLink!)}
                      className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-colors"
                      style={{
                        backgroundColor: `${iconData.color}10`,
                        color: iconData.color,
                        border: `1px solid ${iconData.color}25`,
                      }}
                    >
                      Open {activity.toolLabel || 'Tool'}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SciFiCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 4 — Threat Analysis (Problems & Fixes)
   ═══════════════════════════════════════════════════════════ */

function ThreatAnalysis({ problems }: { problems: ChannelProblem[] }) {
  const { setActiveTool } = useNychIQStore();

  const severityStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    LOW: {
      bg: 'rgba(16,185,129,0.06)',
      border: 'rgba(16,185,129,0.15)',
      text: '#10B981',
      label: 'LOW',
    },
    low: {
      bg: 'rgba(16,185,129,0.06)',
      border: 'rgba(16,185,129,0.15)',
      text: '#10B981',
      label: 'LOW',
    },
    MEDIUM: {
      bg: 'rgba(253,186,45,0.06)',
      border: 'rgba(253,186,45,0.15)',
      text: '#FDBA2D',
      label: 'MEDIUM',
    },
    medium: {
      bg: 'rgba(253,186,45,0.06)',
      border: 'rgba(253,186,45,0.15)',
      text: '#FDBA2D',
      label: 'MEDIUM',
    },
    HIGH: {
      bg: 'rgba(239,68,68,0.06)',
      border: 'rgba(239,68,68,0.15)',
      text: '#EF4444',
      label: 'HIGH',
    },
    high: {
      bg: 'rgba(239,68,68,0.06)',
      border: 'rgba(239,68,68,0.15)',
      text: '#EF4444',
      label: 'HIGH',
    },
  };

  return (
    <SciFiCard accentColor="#EF4444" className="overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 border-b border-[#1F1F1F] flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
        <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-[#FFFFFF]">
          THREAT ANALYSIS
        </h3>
        <span className="ml-auto text-[10px] font-mono text-[#555555]">
          {problems.length} ISSUE{problems.length !== 1 ? 'S' : ''}
        </span>
      </div>

      {/* Problems list */}
      <div className="max-h-[500px] overflow-y-auto">
        {problems.map((problem, idx) => {
          const style = severityStyles[problem.severity];
          const isHigh = problem.severity === 'HIGH';

          return (
            <div
              key={problem.id || idx}
              className="relative px-4 sm:px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.01)]"
              style={
                isHigh
                  ? {
                      backgroundColor: 'rgba(239,68,68,0.03)',
                    }
                  : undefined
              }
            >
              {/* Faint grid line between items */}
              {idx < problems.length - 1 && (
                <div className="absolute bottom-0 left-4 right-4 h-px bg-[#1F1F1F]" />
              )}

              {/* Severity badge + title row */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider"
                    style={{
                      backgroundColor: style.bg,
                      border: `1px solid ${style.border}`,
                      color: style.text,
                    }}
                  >
                    {style.label}
                  </span>
                  <h4 className="text-sm font-semibold text-[#FFFFFF] truncate">
                    {problem.title}
                  </h4>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#A3A3A3] leading-relaxed mb-3 pl-[52px] sm:pl-[60px]">
                {problem.description}
              </p>

              {/* Recommended Fix */}
              <div
                className="ml-[52px] sm:ml-[60px] p-3 rounded-md"
                style={{
                  backgroundColor: '#0D0D0D',
                  borderLeft: `2px solid ${style.text}40`,
                }}
              >
                <span
                  className="text-[10px] font-mono font-bold tracking-wider"
                  style={{ color: style.text }}
                >
                  RECOMMENDED FIX
                </span>
                <p className="text-xs text-[#AAAAAA] mt-1 leading-relaxed">
                  {problem.recommendedFix}
                </p>
                {problem.toolLink && (
                  <button
                    onClick={() => setActiveTool(problem.toolLink!)}
                    className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all hover:brightness-110"
                    style={{
                      backgroundColor: `${style.text}15`,
                      color: style.text,
                      border: `1px solid ${style.text}30`,
                    }}
                  >
                    Fix with {problem.toolLabel || 'Tool'}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SciFiCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 5 — Assistant Status Card
   ═══════════════════════════════════════════════════════════ */

function AssistantCard() {
  const { setActiveTool, navigateToAssistantSetup, assistantConfig } = useNychIQStore();
  // Use store data if available, otherwise fall back to mock
  const assistant: AssistantConfig | null = assistantConfig
    ? {
        name: assistantConfig.name,
        character: assistantConfig.character,
        characterType: assistantConfig.character,
        isActive: true,
        active: true,
      }
    : null;

  if (!assistant?.isActive && !assistant?.active) {
    return (
      <SciFiCard accentColor="#8B5CF6" className="p-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
              boxShadow: '0 0 16px rgba(139,92,246,0.15)',
            }}
          >
            <Bot className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#FFFFFF] mb-1">Channel Assistant</h4>
            <p className="text-xs text-[#A3A3A3] max-w-[240px]">
              Activate your personal channel assistant for AI-powered insights and recommendations.
            </p>
          </div>
          <button
            onClick={() => {
              if (navigateToAssistantSetup) navigateToAssistantSetup();
              else setActiveTool('saku');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              boxShadow: '0 0 12px rgba(139,92,246,0.25)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            ACTIVATE ASSISTANT
          </button>
        </div>
      </SciFiCard>
    );
  }

  return (
    <SciFiCard accentColor="#8B5CF6" className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.25)',
          }}
        >
          <Bot className="w-5 h-5 text-[#8B5CF6]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-[#FFFFFF]">{assistant.name}</h4>
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#10B981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse-live" />
              ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-[#A3A3A3] font-mono">{assistant.characterType || assistant.character}</p>
        </div>
      </div>
      <button
        onClick={() => setActiveTool('saku')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-[#8B5CF6] transition-all hover:bg-[rgba(139,92,246,0.08)]"
        style={{
          border: '1px solid rgba(139,92,246,0.2)',
          backgroundColor: 'rgba(139,92,246,0.05)',
        }}
      >
        Ask your assistant
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </SciFiCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 5b — Latest Video Display
   ═══════════════════════════════════════════════════════════ */

function LatestVideoDisplay({
  lastVideoTitle,
  lastVideoViews,
  lastVideoEngagement,
}: {
  lastVideoTitle: string;
  lastVideoViews: number;
  lastVideoEngagement: number;
}) {
  const [copied, setCopied] = useState(false);

  const videoTitle = lastVideoTitle || 'No recent video';
  const videoViews = lastVideoViews || 0;
  const videoEngagement = lastVideoEngagement || 0;

  const handleCopyAll = async () => {
    const text = `Title: ${videoTitle}\nViews: ${fmtV(videoViews)}\nEngagement Rate: ${videoEngagement}%`;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      showToast('Video details copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExportCSV = () => {
    exportVideoDataCSV({
      videoId: 'latest',
      title: videoTitle,
      viewCount: videoViews,
      viralScore: videoEngagement,
    });
    showToast('Video data exported as CSV!', 'success');
  };

  return (
    <SciFiCard accentColor="#10B981" className="p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Film className="w-4 h-4 text-[#10B981]" />
        <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-[#FFFFFF]">
          LATEST VIDEO
        </h3>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-[#10B981]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse-live" />
          LIVE DATA
        </span>
      </div>

      <div className="space-y-3">
        {/* Video Title */}
        <div className="p-3 rounded-md bg-[#141414] border border-[#1F1F1F]">
          <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1">Video Title</p>
          <p className="text-sm font-semibold text-[#FFFFFF] leading-snug">{videoTitle}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-[#141414] border border-[#1F1F1F]">
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1">Views</p>
            <p className="text-lg font-bold text-[#FFFFFF]">{fmtV(videoViews)}</p>
          </div>
          <div className="p-3 rounded-md bg-[#141414] border border-[#1F1F1F]">
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1">Engagement</p>
            <p className="text-lg font-bold" style={{ color: videoEngagement >= 5 ? '#10B981' : '#FDBA2D' }}>
              {videoEngagement}%
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-[#1F1F1F] text-[#A3A3A3] text-xs font-medium hover:border-[#10B981]/40 hover:text-[#10B981] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy All Details'}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-[#1F1F1F] text-[#A3A3A3] text-xs font-medium hover:border-[#10B981]/40 hover:text-[#10B981] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
        </div>
      </div>
    </SciFiCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Section 6 — Growth Trajectory Chart (with real data support)
   ═══════════════════════════════════════════════════════════ */

function GrowthChart({
  weeklyData,
  weeklyGrowth,
  subscriberCount,
}: {
  weeklyData?: number[];
  weeklyGrowth?: number;
  subscriberCount?: number;
}) {
  const weekLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const padding = 5; // horizontal padding
    const chartTop = 8;
    const chartBottom = 78;
    const chartHeight = chartBottom - chartTop;

    if (weeklyData && weeklyData.length >= 2) {
      // Use real weekly data — normalize to chart coordinates
      const min = Math.min(...weeklyData);
      const max = Math.max(...weeklyData);
      const range = max - min || 1;

      weeklyData.forEach((val, i) => {
        const x = padding + (i / (weeklyData.length - 1)) * (100 - 2 * padding);
        const normalizedY = ((val - min) / range) * chartHeight;
        const y = chartBottom - normalizedY;
        pts.push({ x, y });
      });
    } else {
      // Fallback: seeded procedural wave from weeklyGrowth and subscriberCount
      const growth = weeklyGrowth ?? 4.8;
      const subs = subscriberCount ?? 245800;
      const seed = ((growth * 1000) + (subs % 10000)) / 10000;
      const baseY = 50;

      for (let i = 0; i <= 20; i++) {
        const x = (i / 20) * 100;
        const wave =
          Math.sin(i * 0.6 + seed * 10) * 12 +
          Math.cos(i * 0.3 + seed * 5) * 8 +
          (i / 20) * (growth * 2);
        const y = baseY - wave;
        pts.push({ x, y });
      }
    }
    return pts;
  }, [weeklyData, weeklyGrowth, subscriberCount]);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} 85 L ${points[0].x} 85 Z`;

  // Generate week label x positions
  const labelPositions = useMemo(() => {
    if (weeklyData && weeklyData.length >= 2) {
      const padding = 5;
      return weeklyData.map((_, i) => padding + (i / (weeklyData.length - 1)) * (100 - 2 * padding));
    }
    // Fallback: evenly spaced
    return weekLabels.map((_, i) => 5 + (i / (weekLabels.length - 1)) * 90);
  }, [weeklyData]);

  const hasRealData = weeklyData && weeklyData.length >= 2;

  return (
    <SciFiCard accentColor="#3B82F6" className="p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[#3B82F6]" />
        <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-[#FFFFFF]">
          GROWTH TRAJECTORY
        </h3>
        {hasRealData && (
          <span className="ml-auto text-[10px] font-mono text-[#3B82F6]">
            {weeklyData!.length} WEEKS OF DATA
          </span>
        )}
      </div>

      <div className="relative w-full" style={{ aspectRatio: '2.5 / 1' }}>
        <svg
          viewBox="0 0 100 85"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[20, 40, 60, 80].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#1F1F1F"
              strokeWidth="0.3"
              strokeDasharray="2,2"
            />
          ))}

          {/* Week label positions (vertical markers) */}
          {labelPositions.map((x, i) => (
            <line
              key={`wv-${i}`}
              x1={x}
              y1="0"
              x2={x}
              y2="85"
              stroke="#1F1F1F"
              strokeWidth="0.2"
              strokeDasharray="1,3"
            />
          ))}

          {/* Area fill gradient */}
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <path d={areaD} fill="url(#growthGrad)" />

          {/* Main curve line */}
          <path
            d={pathD}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.5))',
            }}
          />

          {/* Data point dots (only for real data) */}
          {hasRealData && points.map((p, i) => (
            <circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r="0.8"
              fill="#3B82F6"
              style={{
                filter: 'drop-shadow(0 0 2px rgba(59,130,246,0.6))',
              }}
            />
          ))}

          {/* Endpoint dot */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="1.2"
              fill="#3B82F6"
              style={{
                filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.8))',
              }}
            />
          )}

          {/* Week labels (W1-W8) */}
          {weekLabels.map((label, i) => {
            const x = labelPositions[i];
            if (x === undefined) return null;
            return (
              <text
                key={label}
                x={x}
                y="84"
                textAnchor="middle"
                fill="#555555"
                fontSize="2.5"
                fontFamily="monospace"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <p className="text-center text-[10px] font-mono text-[#555555] mt-3 tracking-wider">
        {hasRealData ? 'SUBSCRIBER COUNT PER WEEK' : 'DATA SYNCS WITH EACH SCRAPE'}
      </p>
    </SciFiCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Empty State — No channel connected
   ═══════════════════════════════════════════════════════════ */

function EmptyState() {
  const { setActiveTool } = useNychIQStore();

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
      {/* Scanline background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{
            backgroundColor: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.2)',
            boxShadow: '0 0 24px rgba(139,92,246,0.15)',
          }}
        >
          <Radio className="w-8 h-8 text-[#8B5CF6]" />
        </div>

        <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">No Channel Connected</h3>
        <p className="text-sm text-[#A3A3A3] mb-6 leading-relaxed">
          Connect your YouTube channel to unlock the mission control dashboard with health
          scores, threat analysis, and growth tracking.
        </p>

        <button
          onClick={() => setActiveTool('audit')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            boxShadow: '0 0 16px rgba(139,92,246,0.3)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          Run Channel Audit
        </button>

        <p className="text-[11px] text-[#555555] font-mono mt-4 tracking-wider">
          CONNECT YOUR CHANNEL TO ACTIVATE THIS PANEL
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT — ChannelPageTool
   ═══════════════════════════════════════════════════════════ */

export function ChannelPageTool() {
  // Access from store — may not exist yet; falls back to mock data
  const store = useNychIQStore() as any;
  const rawChannelData: any | null = store.channelData ?? null;

  // If no channel data in store, show empty state
  if (!rawChannelData) {
    return <EmptyState />;
  }

  // Map store ChannelData → local ChannelData interface
  const channelData: ChannelData = {
    channelName: rawChannelData.channelName || 'Unknown Channel',
    channelHandle: rawChannelData.channelHandle || '@channel',
    channelAvatar: rawChannelData.channelAvatar || '',
    subscribers: rawChannelData.subscriberCount ?? rawChannelData.subscribers ?? 0,
    totalViews: rawChannelData.totalViews ?? 0,
    videosCount: rawChannelData.videoCount ?? rawChannelData.videosCount ?? 0,
    engagementRate: rawChannelData.engagementRate ?? 0,
    weeklyGrowth: rawChannelData.weeklyGrowth ?? 0,
    healthScore: rawChannelData.healthScore ?? 0,
    lastScraped: new Date(rawChannelData.lastScrapedAt || Date.now()).toISOString(),
    subscriberChange: rawChannelData.weeklyGrowth ?? 0,
    activities:
      (rawChannelData.activities?.length > 0)
        ? rawChannelData.activities.map((a: any) => ({
            ...a,
            type: a.type === 'trend' ? 'trending' : a.type,
            timestamp: typeof a.timestamp === 'number' ? new Date(a.timestamp).toISOString() : a.timestamp,
          }))
        : MOCK_ACTIVITIES,
    problems:
      (rawChannelData.problems?.length > 0)
        ? rawChannelData.problems.map((p: any) => ({
            ...p,
            severity: (p.severity || '').toUpperCase() as ChannelProblem['severity'],
            recommendedFix: p.recommendedFix || p.fix || '',
          }))
        : MOCK_PROBLEMS,
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Section 1 — Mission Briefing Header */}
      <MissionBriefingHeader channelData={channelData} />

      {/* Section 2 — Stats Grid */}
      <StatsGrid channelData={channelData} />

      {/* Bottom: Activity + Threat + Side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Section 3 — Activity Log */}
        <div className="lg:col-span-2">
          <ActivityLog activities={channelData.activities} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Section 4 — Threat Analysis */}
          <ThreatAnalysis problems={channelData.problems} />

          {/* Section 5b — Latest Video Display */}
          <LatestVideoDisplay
            lastVideoTitle={rawChannelData.lastVideoTitle || ''}
            lastVideoViews={rawChannelData.lastVideoViews || 0}
            lastVideoEngagement={rawChannelData.lastVideoEngagement || 0}
          />

          {/* Section 6 — Growth Chart */}
          <GrowthChart
            weeklyData={rawChannelData.weeklyData}
            weeklyGrowth={channelData.weeklyGrowth}
            subscriberCount={channelData.subscribers}
          />
        </div>
      </div>

      {/* Section 5 — Assistant Card */}
      <AssistantCard />
    </div>
  );
}
