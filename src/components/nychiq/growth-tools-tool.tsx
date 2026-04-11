'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  TrendingUp,
  Bot,
  Send,
  Target,
  Clock,
  Video,
  Users,
  Bell,
  BellOff,
  Trophy,
  Flame,
  ArrowRight,
  Zap,
  Lightbulb,
  BarChart3,
  Eye,
  Star,
} from 'lucide-react';

/* ── Mock Daily Insight ── */
const DAILY_INSIGHT = 'Your best performing time slot is 2-4 PM WAT on Wednesdays. Videos posted in this window get 3.2x more views in the first 24 hours. Consider scheduling your next upload accordingly.';

/* ── Quick Tips ── */
const QUICK_TIPS = [
  {
    icon: <Zap className="w-4 h-4" />,
    title: 'Post Consistently',
    description: 'Channels that post 3x/week grow 2.5x faster than those posting once weekly.',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.1)',
    border: 'rgba(245,166,35,0.2)',
  },
  {
    icon: <Lightbulb className="w-4 h-4" />,
    title: 'Hook in 5 Seconds',
    description: '85% of viewers decide to stay or leave within the first 5 seconds. Front-load value.',
    color: '#00C48C',
    bg: 'rgba(0,196,140,0.1)',
    border: 'rgba(0,196,140,0.2)',
  },
  {
    icon: <Star className="w-4 h-4" />,
    title: 'Engage Comments',
    description: 'Replying to comments within 1 hour boosts engagement by 40%. Pin your best questions.',
    color: '#9B72CF',
    bg: 'rgba(155,114,207,0.1)',
    border: 'rgba(155,114,207,0.2)',
  },
];

/* ── Milestones ── */
const MILESTONES = [
  {
    label: '1K Subscribers',
    current: 847,
    target: 1000,
    percent: 84.7,
    icon: <Users className="w-4 h-4" />,
    color: '#F5A623',
    eta: '~3 weeks',
  },
  {
    label: '4K Watch Hours',
    current: 3200,
    target: 4000,
    percent: 80,
    icon: <Clock className="w-4 h-4" />,
    color: '#00C48C',
    eta: '~2 weeks',
  },
  {
    label: '100 Videos',
    current: 72,
    target: 100,
    percent: 72,
    icon: <Video className="w-4 h-4" />,
    color: '#9B72CF',
    eta: '~5 weeks',
  },
];

/* ── Weekly Summary Metrics ── */
const WEEKLY_METRICS = [
  { label: 'Total Views', value: '127.4K', change: '+12.5%', positive: true },
  { label: 'New Subscribers', value: '+1,247', change: '+8.3%', positive: true },
  { label: 'Avg. Watch Time', value: '6:42', change: '+4.1%', positive: true },
  { label: 'CTR', value: '7.8%', change: '-0.3%', positive: false },
  { label: 'Revenue', value: '$842', change: '+15.2%', positive: true },
];

/* ── Notification Toggles ── */
interface NotifToggle {
  label: string;
  description: string;
  enabled: boolean;
}

export function GrowthToolsTool() {
  const { userName } = useNychIQStore();
  const [coachQuestion, setCoachQuestion] = useState('');
  const [notifications, setNotifications] = useState<NotifToggle[]>([
    { label: 'Milestone Alerts', description: 'Get notified when you hit key milestones', enabled: true },
    { label: 'Growth Tips', description: 'Daily personalized growth suggestions', enabled: true },
    { label: 'Performance Drops', description: 'Alert when metrics fall below average', enabled: false },
    { label: 'Trending Alerts', description: 'Notifications when topics in your niche trend', enabled: true },
  ]);

  const toggleNotif = (index: number) => {
    setNotifications((prev) =>
      prev.map((n, i) => (i === index ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
            <TrendingUp className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Growth Tools</h2>
            <p className="text-xs text-[#888888] mt-0.5">AI-powered coaching, milestone tracking, and growth insights.</p>
          </div>
        </div>
      </div>

      {/* AI Coach Card */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(0,196,140,0.05) 100%)',
          borderColor: 'rgba(245,166,35,0.2)',
        }}
      >
        <div className="px-4 sm:px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-[rgba(245,166,35,0.15)]">
              <Bot className="w-4 h-4 text-[#F5A623]" />
            </div>
            <h3 className="text-sm font-semibold text-[#E8E8E8]">AI Coach</h3>
            <span className="text-[10px] font-bold text-[#F5A623] bg-[rgba(245,166,35,0.1)] px-2 py-0.5 rounded-full border border-[rgba(245,166,35,0.2)]">
              DAILY INSIGHT
            </span>
          </div>

          {/* Daily Insight */}
          <div className="rounded-lg bg-[#0D0D0D]/80 border border-[#1A1A1A] p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-[rgba(245,166,35,0.1)] shrink-0 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-[#F5A623]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F5A623] mb-1">Today&apos;s Insight for {userName || 'Creator'}</p>
                <p className="text-sm text-[#E8E8E8] leading-relaxed">{DAILY_INSIGHT}</p>
              </div>
            </div>
          </div>

          {/* Ask AI Coach */}
          <div className="relative mb-5">
            <input
              type="text"
              value={coachQuestion}
              onChange={(e) => setCoachQuestion(e.target.value)}
              placeholder="Ask AI Coach anything about growing your channel..."
              className="w-full h-11 pl-4 pr-11 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
            />
            <button
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md bg-[#F5A623] text-[#0A0A0A] hover:bg-[#E6960F] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={!coachQuestion.trim()}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUICK_TIPS.map((tip, i) => (
              <div
                key={i}
                className="rounded-lg bg-[#0D0D0D]/80 border p-3 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                style={{ borderColor: tip.border }}
              >
                <div
                  className="p-1.5 rounded-md w-fit mb-2 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: tip.bg, color: tip.color }}
                >
                  {tip.icon}
                </div>
                <h4 className="text-xs font-semibold text-[#E8E8E8] mb-1">{tip.title}</h4>
                <p className="text-[11px] text-[#888888] leading-relaxed">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Milestones + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Milestone Tracker */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F5A623]" />
              <h3 className="text-sm font-semibold text-[#E8E8E8]">Milestone Tracker</h3>
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            {MILESTONES.map((milestone, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: milestone.color }}>{milestone.icon}</span>
                    <span className="text-xs font-semibold text-[#E8E8E8]">{milestone.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888888]">{milestone.current}/{milestone.target}</span>
                    <span className="text-[10px] font-medium text-[#F5A623]">ETA: {milestone.eta}</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[#0D0D0D] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${milestone.percent}%`,
                      background: `linear-gradient(90deg, ${milestone.color}CC 0%, ${milestone.color} 100%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Notifications */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#F5A623]" />
              <h3 className="text-sm font-semibold text-[#E8E8E8]">Growth Notifications</h3>
            </div>
          </div>
          <div className="divide-y divide-[#1A1A1A]">
            {notifications.map((notif, i) => (
              <div key={i} className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#E8E8E8]">{notif.label}</p>
                  <p className="text-[11px] text-[#888888]">{notif.description}</p>
                </div>
                <button
                  onClick={() => toggleNotif(i)}
                  className="relative w-10 h-6 rounded-full shrink-0 transition-colors duration-200"
                  style={{
                    backgroundColor: notif.enabled ? '#F5A623' : '#2A2A2A',
                  }}
                >
                  <span
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                    style={{
                      left: notif.enabled ? '22px' : '4px',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F5A623]" />
              <h3 className="text-sm font-semibold text-[#E8E8E8]">Weekly Summary</h3>
            </div>
            <span className="text-[10px] font-medium text-[#888888]">Nov 18 – Nov 24, 2025</span>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {WEEKLY_METRICS.map((metric, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-[#0D0D0D]">
                <p className="text-lg font-bold text-[#E8E8E8]">{metric.value}</p>
                <p className="text-[11px] text-[#888888] mt-0.5">{metric.label}</p>
                <span
                  className={`text-[10px] font-semibold mt-1 inline-block ${
                    metric.positive ? 'text-[#00C48C]' : 'text-[#E05252]'
                  }`}
                >
                  {metric.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
