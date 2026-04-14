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
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNychIQStore } from '@/lib/store';
import { ytFetch, askAI } from '@/lib/api';
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
    if (score >= 80) return '#888888';
    if (score >= 60) return '#FDBA2D';
    if (score >= 40) return '#888888';
    return '#888888';
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
        <span className="text-[10px] text-[#a0a0a0] font-semibold mt-1">Health Score</span>
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
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [apiError, setApiError] = useState(false);

  const handleAudit = useCallback(async () => {
    if (!channelUrl.trim()) return;
    setLoading(true);
    setCurrentStep(-1);
    setReport(false);
    setChannelData(null);
    setAiInsights([]);
    setApiError(false);

    // Animate through steps
    for (let i = 0; i < AUDIT_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, AUDIT_STEPS[i].duration));
    }

    // Fetch real YouTube channel data
    try {
      const data = await ytFetch('channel', { handle: channelUrl.trim() });
      const normalizedChannel = {
        name: data.snippet?.title || channelUrl.split('/').pop()?.replace('@', '') || 'My Channel',
        avatarUrl: data.snippet?.thumbnails?.high?.url || data.snippet?.thumbnails?.default?.url || '',
        subscribers: parseInt(data.statistics?.subscriberCount || '0', 10),
        totalViews: parseInt(data.statistics?.viewCount || '0', 10),
        videoCount: parseInt(data.statistics?.videoCount || '0', 10),
        description: data.snippet?.description || '',
        publishedAt: data.snippet?.publishedAt || '',
        keywords: data.snippet?.keywords || [],
      };
      setChannelData(normalizedChannel);

      // Save channel profile to localStorage for topbar avatar
      const avatarUrl = normalizedChannel.avatarUrl;
      localStorage.setItem('nychiq_channel_profile', JSON.stringify({
        name: normalizedChannel.name,
        url: channelUrl,
        avatarUrl,
        avatarColor: avatarUrl ? '#FDBA2D' : '#FDBA2D',
      }));

      // Generate AI insights from real channel data
      const avgViews = normalizedChannel.videoCount > 0
        ? Math.floor(normalizedChannel.totalViews / normalizedChannel.videoCount)
        : 0;
      const channelAge = normalizedChannel.publishedAt
        ? Math.floor((Date.now() - new Date(normalizedChannel.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const channelAgeYears = (channelAge / 365).toFixed(1);

      const prompt = `You are a YouTube channel growth analyst. Analyze this channel and provide exactly 4 concise, specific, actionable insights (each 1-2 sentences max):

Channel: "${normalizedChannel.name}"
- Subscribers: ${fmtV(normalizedChannel.subscribers)}
- Total Videos: ${fmtV(normalizedChannel.videoCount)}
- Total Views: ${fmtV(normalizedChannel.totalViews)}
- Avg Views per Video: ${fmtV(avgViews)}
- Channel Age: ${channelAgeYears} years
- Description: ${(normalizedChannel.description || 'No description').substring(0, 300)}

Focus on:
1. Content volume and upload consistency assessment
2. View-to-subscriber ratio and audience engagement quality
3. SEO and discoverability optimization opportunities
4. A specific, data-backed growth recommendation

Return ONLY a JSON array of 4 strings. No explanations, no markdown, just the array.`;

      try {
        const aiResponse = await askAI(prompt);
        const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiInsights(parsed.slice(0, 4));
        }
      } catch {
        // If AI fails, generate basic data-driven insights (no mock data)
        const insights = [
          `Your channel "${normalizedChannel.name}" has ${fmtV(normalizedChannel.subscribers)} subscribers with ${fmtV(normalizedChannel.videoCount)} videos published over ${channelAgeYears} years.`,
          `Average views per video: ${fmtV(avgViews)} — ${avgViews > normalizedChannel.subscribers * 0.1 ? 'strong' : avgViews > normalizedChannel.subscribers * 0.01 ? 'moderate' : 'below-average'} relative to your subscriber base.`,
          normalizedChannel.description
            ? `Your ${normalizedChannel.description.length > 200 ? 'detailed' : 'brief'} channel description can be optimized with more target keywords for better YouTube SEO.`
            : 'Your channel has no description — adding one with relevant keywords will significantly improve discoverability.',
          channelAgeYears !== '0.0'
            ? `At ${channelAgeYears} years old with ${normalizedChannel.videoCount} videos, your upload frequency is ${channelAge > 0 ? (channelAge / Math.max(1, normalizedChannel.videoCount)).toFixed(1) : 'N/A'} days per video — ${normalizedChannel.videoCount > 50 ? 'a strong content library' : 'consider increasing upload frequency'}.`
            : `With ${normalizedChannel.videoCount} videos and ${fmtV(normalizedChannel.totalViews)} total views, focus on consistent uploads to build momentum.`,
        ];
        setAiInsights(insights);
      }
    } catch {
      setApiError(true);
      // Fallback: generate profile from URL only
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

  // Generate dynamic health score from real channel data
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
    if (data.keywords && data.keywords.length > 0) score += 5;
    // Bonus for description length (SEO signal)
    if (data.description && data.description.length > 200) score += 3;
    return Math.min(100, Math.max(10, score));
  };

  const healthScore = channelData ? calcHealthScore(channelData) : 0;

  // Calculate real engagement from channel data
  const calcEngagement = (data: any) => {
    if (!data) return null;
    const subs = data.subscribers || 0;
    const totalViews = data.totalViews || 0;
    const vids = data.videoCount || 0;
    // Engagement proxy: avg views / subscribers ratio (as percentage)
    if (subs === 0) return null;
    const avgViews = vids > 0 ? totalViews / vids : 0;
    const engagementRatio = (avgViews / subs) * 100;
    // Cap at 200% for display purposes
    return Math.min(engagementRatio, 200).toFixed(1);
  };

  const engagement = calcEngagement(channelData);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#0f0f0f]">
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
                  i <= 1 ? 'bg-[#FDBA2D]' : 'bg-[#0f0f0f]'
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
              <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-[#FDBA2D]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-2">Free Channel Audit</h2>
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
                    className="pl-9 bg-[#0f0f0f] border-[rgba(255,255,255,0.06)] text-[#FFFFFF] placeholder-[#444] h-12 text-center focus:border-[#FDBA2D55]"
                    onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
                  />
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-[#555]">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#FDBA2D]" /> Viral Score</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[#888888]" /> Growth Tips</span>
                  <span className="flex items-center gap-1"><Search className="w-3 h-3 text-[#888888]" /> SEO</span>
                </div>

                <Button
                  className="w-full bg-[#FDBA2D] text-black hover:bg-[#C69320] h-12 font-semibold disabled:opacity-40 shadow-lg shadow-[rgba(253,186,45,0.12)]"
                  onClick={handleAudit}
                  disabled={!channelUrl.trim()}
                >
                  Analyze Channel
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <button
                  onClick={() => setPage('ob-extension')}
                  className="text-xs text-[#444] hover:text-[#a0a0a0] transition-colors"
                >
                  Skip for now &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ── Loading state ── */}
          {loading && (
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-[#FDBA2D] animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-[#FFFFFF] mb-6">Analyzing Channel...</h2>

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
                          ? 'bg-[rgba(253,186,45,0.06)] border-[rgba(255,255,255,0.06)] text-[#FDBA2D]'
                          : isDone
                            ? 'bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.06)] text-[#888888]'
                            : 'bg-[#0a0a0a] border-[rgba(255,255,255,0.06)] text-[#444]'
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
              {/* ── API Error state ── */}
              {apiError && !channelData && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-[#888888]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">Could Not Analyze Channel</h2>
                  <p className="text-sm text-[#666] mb-8 max-w-sm mx-auto">
                    We couldn&apos;t fetch data for this channel. Make sure the URL is correct and the channel is publicly accessible.
                  </p>

                  <div className="flex flex-col items-center gap-3">
                    <Button
                      className="w-full max-w-xs bg-[#FDBA2D] text-black hover:bg-[#C69320] h-11 font-semibold shadow-lg shadow-[rgba(253,186,45,0.12)]"
                      onClick={() => { setReport(false); setCurrentStep(-1); setApiError(false); }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <button
                      onClick={() => setPage('ob-extension')}
                      className="text-xs text-[#444] hover:text-[#a0a0a0] transition-colors"
                    >
                      Skip for now &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* ── Success state (with real data) ── */}
              {!apiError && channelData && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">Audit Report</h2>
                    <p className="text-xs text-[#555] font-mono">{channelUrl} &mdash; {channelData.name}</p>
                  </div>

                  {/* Health Score Gauge */}
                  <div className="flex justify-center mb-8">
                    <HealthGauge score={healthScore} />
                  </div>

                  {/* AI Insights */}
                  {aiInsights.length > 0 && (
                    <div className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#888888]" />
                        <span className="text-xs font-semibold text-[#888888]">AI INSIGHTS</span>
                      </div>
                      <ul className="space-y-2.5">
                        {aiInsights.map((insight, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#a0a0a0] leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-[#FDBA2D] shrink-0 mt-1.5" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Channel Profile Card with avatar */}
                  <div className="rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] p-5 mb-6">
                    <div className="flex items-center gap-4">
                      {channelData.avatarUrl ? (
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
                        <h3 className="text-base font-bold text-[#FFFFFF] truncate">{channelData.name || 'Channel'}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                          <span className="text-xs text-[#a0a0a0] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> {fmtV(channelData.subscribers)} subs
                          </span>
                          <span className="text-xs text-[#a0a0a0] flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5" /> {fmtV(channelData.videoCount)} videos
                          </span>
                          <span className="text-xs text-[#a0a0a0] flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" /> {fmtV(channelData.totalViews)} views
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats pills — all from real data */}
                  <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {[
                      { label: 'Videos', value: fmtV(channelData.videoCount), color: '#FDBA2D' },
                      { label: 'Subscribers', value: fmtV(channelData.subscribers), color: '#888888' },
                      { label: 'Total Views', value: fmtV(channelData.totalViews), color: '#888888' },
                      ...(engagement !== null
                        ? [{ label: 'Avg View / Sub', value: `${engagement}%`, color: '#888888' }]
                        : []),
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)]"
                      >
                        <div className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-[10px] text-[#555]">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="flex flex-col items-center gap-3">
                    <Button
                      className="w-full max-w-xs bg-[#FDBA2D] text-black hover:bg-[#C69320] h-11 font-semibold shadow-lg shadow-[rgba(253,186,45,0.12)]"
                      onClick={() => setPage('ob-extension')}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <button
                      onClick={() => { setReport(false); setCurrentStep(-1); setApiError(false); }}
                      className="text-xs text-[#444] hover:text-[#a0a0a0] transition-colors"
                    >
                      &larr; Re-analyze another channel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
