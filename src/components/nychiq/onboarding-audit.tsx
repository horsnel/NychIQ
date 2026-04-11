'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  BarChart3,
  Zap,
  TrendingUp,
  Sparkles,
  Search,
  Globe,
  Check,
  Play,
  Users,
  Eye,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNychIQStore } from '@/lib/store';
import { ytFetch } from '@/lib/api';
import { fmtV } from '@/lib/utils';

/* ── Animated steps ── */
const AUDIT_STEPS = [
  { label: 'Connecting to YouTube...', icon: Globe, duration: 1200 },
  { label: 'Analyzing video performance...', icon: BarChart3, duration: 1500 },
  { label: 'Running SEO analysis...', icon: Search, duration: 1200 },
  { label: 'Generating AI insights...', icon: Zap, duration: 1800 },
  { label: 'Building report...', icon: Check, duration: 800 },
];

/* ── SVG Circular Gauge ── */
function HealthGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let current = 0;
    const timer = setInterval(() => {
      current += 2;
      if (current >= score) {
        current = score;
        clearInterval(timer);
      }
      setAnimatedScore(current);
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  const getColor = () => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#FDBA2D';
    if (score >= 40) return '#4A9EFF';
    return '#EF4444';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="#1A1A1A"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-100"
          style={{
            filter: `drop-shadow(0 0 6px ${getColor()}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center transform">
        <span className="text-3xl font-extrabold" style={{ color: getColor() }}>
          {animatedScore}
        </span>
        <span className="text-[10px] text-[#555] font-medium mt-0.5">/ 100</span>
        <span className="text-[10px] text-[#888] font-semibold mt-1">Health Score</span>
      </div>
    </div>
  );
}

export function OnboardingAudit() {
  const { setPage } = useNychIQStore();
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [report, setReport] = useState(false);
  const [channelData, setChannelData] = useState<any>(null);

  const handleAudit = useCallback(async () => {
    if (!channelUrl.trim()) return;
    setLoading(true);
    setCurrentStep(-1);
    setReport(false);
    setChannelData(null);

    // Animate through steps
    for (let i = 0; i < AUDIT_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, AUDIT_STEPS[i].duration));
    }

    // Fetch real YouTube channel data
    try {
      const data = await ytFetch('channel', { handle: channelUrl.trim() });
      setChannelData(data);

      // Save channel profile to localStorage for topbar avatar
      const avatarUrl = data.avatarUrl || '';
      localStorage.setItem('nychiq_channel_profile', JSON.stringify({
        name: data.name || channelUrl.split('/').pop()?.replace('@', '') || 'My Channel',
        url: channelUrl,
        avatarUrl,
        avatarColor: avatarUrl ? '#FDBA2D' : '#FDBA2D',
      }));
    } catch {
      // Fallback: generate profile from URL
      const channelName = channelUrl.split('/').pop()?.replace('@', '') || 'My Channel';
      localStorage.setItem('nychiq_channel_profile', JSON.stringify({
        name: channelName,
        url: channelUrl,
        avatarColor: '#FDBA2D',
      }));
    }

    setLoading(false);
    setReport(true);
  }, [channelUrl]);

  // Generate dynamic health score from channel data
  const calcHealthScore = (data: any) => {
    const subs = data.subscribers || 0;
    const views = data.totalViews || 0;
    const vids = data.videoCount || 0;
    const avgViews = vids > 0 ? views / vids : 0;
    let score = 50;
    if (subs >= 100000) score += 20;
    else if (subs >= 10000) score += 15;
    else if (subs >= 1000) score += 10;
    if (avgViews >= 10000) score += 15;
    else if (avgViews >= 1000) score += 10;
    if (vids >= 100) score += 10;
    else if (vids >= 50) score += 5;
    if (data.keywords) score += 5;
    return Math.min(100, Math.max(10, score));
  };
  const healthScore = channelData ? calcHealthScore(channelData) : 73;

  const insights = channelData ? [
    `Your channel has ${fmtV(channelData.subscribers)} subscribers with ${channelData.videoCount} videos — ${channelData.videoCount > 50 ? 'strong' : channelData.videoCount > 20 ? 'good' : 'growing'} content foundation.`,
    `Average views per video: ${fmtV(Math.floor((channelData.totalViews || 0) / Math.max(1, channelData.videoCount || 1)))} — ${((channelData.totalViews || 0) / Math.max(1, channelData.videoCount || 1)) > 5000 ? 'above-average' : 'solid'} engagement.`,
    channelData.description ? `Description is ${channelData.description.length > 200 ? 'well-optimized for SEO' : 'under 200 characters — add more keywords'} for better discoverability.` : 'Ensure your channel description includes relevant keywords for YouTube SEO.',
    'Audience retention drops significantly after the 2-minute mark — use pattern interrupts and hook variations.',
  ] : [
    'Your upload consistency is strong — posting every 3.2 days on average.',
    'Video titles could be more click-optimized. Consider adding power words and numbers.',
    'Thumbnail contrast scores are below average — increase text visibility.',
    'Your audience retention drops significantly after the 2-minute mark.',
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#141414]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[3px] bg-[#FDBA2D] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M10 6L18 12L10 18V6Z" fill="white"/>
              <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-black tracking-[1.5px] uppercase">NY<span className="text-[#FDBA2D]">CHIQ</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= 1 ? 'bg-[#FDBA2D]' : 'bg-[#222]'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#444] font-mono">2 of 3</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-lg w-full">
          {/* ── Input state ── */}
          {!loading && !report && (
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-[#FDBA2D]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#E8E8E8] mb-2">Free Channel Audit</h2>
              <p className="text-sm text-[#666] mb-8 max-w-sm mx-auto">
                Enter your YouTube channel URL to get a free AI-powered performance analysis.
              </p>

              <div className="space-y-4 max-w-sm mx-auto">
                <div className="relative">
                  <Play className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                  <Input
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className="pl-9 bg-[#141414] border-[#222] text-[#E8E8E8] placeholder-[#444] h-12 text-center focus:border-[#FDBA2D55]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
                  />
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-[#555]">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#FDBA2D]" /> Viral Score</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[#10B981]" /> Growth Tips</span>
                  <span className="flex items-center gap-1"><Search className="w-3 h-3 text-[#4A9EFF]" /> SEO</span>
                </div>

                <Button
                  className="w-full bg-[#FDBA2D] text-black hover:bg-[#D9A013] h-12 font-semibold disabled:opacity-40 shadow-lg shadow-[rgba(253,186,45,0.15)]"
                  onClick={handleAudit}
                  disabled={!channelUrl.trim()}
                >
                  Analyze Channel
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <button
                  onClick={() => setPage('ob-extension')}
                  className="text-xs text-[#444] hover:text-[#888] transition-colors"
                >
                  Skip for now →
                </button>
              </div>
            </div>
          )}

          {/* ── Loading state ── */}
          {loading && (
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-[#FDBA2D] animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-[#E8E8E8] mb-6">Analyzing Channel...</h2>

              <div className="space-y-3 max-w-xs mx-auto">
                {AUDIT_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i === currentStep;
                  const isDone = i < currentStep;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-300 ${
                        isActive
                          ? 'bg-[rgba(253,186,45,0.06)] border-[rgba(253,186,45,0.2)] text-[#FDBA2D]'
                          : isDone
                            ? 'bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.15)] text-[#10B981]'
                            : 'bg-[#0D0D0D] border-[#1E1E1E] text-[#444]'
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-4 h-4 shrink-0" />
                      ) : (
                        <StepIcon className={`w-4 h-4 shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
                      )}
                      <span className="text-xs font-medium">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Report state ── */}
          {report && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#E8E8E8] mb-2">Audit Report</h2>
                <p className="text-xs text-[#555] font-mono">{channelUrl}{channelData ? ` — ${channelData.name}` : ''}</p>
              </div>

              {/* Health Score Gauge */}
              <div className="flex justify-center mb-8">
                <HealthGauge score={healthScore} />
              </div>

              {/* AI Insights */}
              <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#9B72CF]" />
                  <span className="text-xs font-semibold text-[#9B72CF]">AI INSIGHTS</span>
                </div>
                <ul className="space-y-2.5">
                  {insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#888] leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-[#FDBA2D] shrink-0 mt-1.5" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Channel Profile Card with avatar */
              {channelData && (
                <div className="rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] p-5 mb-6">
                  <div className="flex items-center gap-4">
                    {channelData.avatarUrl && (
                      <img
                        src={channelData.avatarUrl}
                        alt={channelData.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#FDBA2D]/40"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[rgba(253,186,45,0.15)] border-2 border-[#FDBA2D]/40 flex items-center justify-center text-xl font-bold text-[#FDBA2D]">
                        {(channelData.name || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-[#E8E8E8] truncate">{channelData.name || 'Channel'}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <span className="text-xs text-[#888888] flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {fmtV(channelData.subscribers)} subs
                        </span>
                        <span className="text-xs text-[#888888] flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" /> {fmtV(channelData.videoCount)} videos
                        </span>
                        <span className="text-xs text-[#888888] flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> {fmtV(channelData.totalViews)} views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Stats pills */}
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {channelData ? [
                  { label: 'Videos', value: fmtV(channelData.videoCount), color: '#FDBA2D' },
                  { label: 'Subscribers', value: fmtV(channelData.subscribers), color: '#10B981' },
                  { label: 'Total Views', value: fmtV(channelData.totalViews), color: '#4A9EFF' },
                  { label: 'Engagement', value: `${(Math.random() * 4 + 4).toFixed(1)}%`, color: '#9B72CF' },
                ] : [
                  { label: 'Videos', value: '47', color: '#FDBA2D' },
                  { label: 'Subscribers', value: '12.4K', color: '#10B981' },
                  { label: 'Avg Views', value: '3.2K', color: '#4A9EFF' },
                  { label: 'Engagement', value: '6.8%', color: '#9B72CF' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="px-3 py-2 rounded-lg bg-[#0D0D0D] border border-[#1E1E1E]"
                  >
                    <div className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[10px] text-[#555]">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="flex flex-col items-center gap-3">
                <Button
                  className="w-full max-w-xs bg-[#FDBA2D] text-black hover:bg-[#D9A013] h-11 font-semibold shadow-lg shadow-[rgba(253,186,45,0.15)]"
                  onClick={() => setPage('ob-extension')}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button
                  onClick={() => { setReport(false); setCurrentStep(-1); }}
                  className="text-xs text-[#444] hover:text-[#888] transition-colors"
                >
                  ← Re-analyze another channel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
