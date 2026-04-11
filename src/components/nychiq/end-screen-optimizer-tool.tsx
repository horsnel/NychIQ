'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Monitor,
  Play,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Layout,
  ChevronDown,
  ThumbsUp,
  Eye,
  Zap,
  Bell,
  Video,
  UserPlus,
} from 'lucide-react';

interface VideoOption {
  id: string;
  title: string;
  views: string;
  duration: string;
}

interface EndScreenAnalysis {
  current: {
    hasSubscribe: boolean;
    linkedVideo: string | null;
    linkedVideoViews: string | null;
    cardTiming: string;
  };
}

interface HighRetentionMoment {
  timestamp: string;
  seconds: number;
  label: string;
  retention: number;
  recommendation: string;
}

interface Recommendation {
  type: 'subscribe' | 'video' | 'card' | 'playlist';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
}

const MOCK_VIDEOS: VideoOption[] = [
  { id: '1', title: 'How to Edit Like a Pro in 2025', views: '245K', duration: '12:34' },
  { id: '2', title: 'My SECRET Editing Workflow', views: '189K', duration: '8:21' },
  { id: '3', title: '10 Tips for Better Thumbnails', views: '312K', duration: '15:07' },
  { id: '4', title: 'YouTube Algorithm Explained', views: '567K', duration: '10:45' },
  { id: '5', title: 'Best Free Editing Software 2025', views: '423K', duration: '14:20' },
];

const MOCK_ANALYSIS: EndScreenAnalysis = {
  current: {
    hasSubscribe: true,
    linkedVideo: 'Best Free Editing Software 2025',
    linkedVideoViews: '423K',
    cardTiming: 'Last 15 seconds',
  },
};

const MOCK_MOMENTS: HighRetentionMoment[] = [
  { timestamp: '2:15', seconds: 135, label: 'Before/After reveal', retention: 94, recommendation: 'Place subscribe CTA here — viewers are highly engaged' },
  { timestamp: '5:40', seconds: 340, label: 'Key technique demo', retention: 87, recommendation: 'Ideal moment for a mid-roll card linking to related tutorial' },
  { timestamp: '8:22', seconds: 502, label: 'Pro tip surprise', retention: 79, recommendation: 'High engagement peak — add playlist link here' },
  { timestamp: '10:50', seconds: 650, label: 'Results comparison', retention: 68, recommendation: 'Good spot for end screen elements — retention still strong' },
];

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { type: 'video', title: 'Link "10 Tips for Better Thumbnails"', description: '312K views — 28% higher than your current linked video. Topic overlap is 85%.', impact: 'high', action: 'Swap linked video' },
  { type: 'subscribe', title: 'Move subscribe button to left', description: 'Eye-tracking data suggests left placement increases CTR by 15-22%.', impact: 'medium', action: 'Adjust layout' },
  { type: 'card', title: 'Show end screen 25s earlier', description: 'Your current timing at last 15s misses the high-retention window at 10:50.', impact: 'high', action: 'Update timing' },
  { type: 'playlist', title: 'Add playlist for series', description: 'Viewers who watch 2+ videos from a playlist are 4x more likely to subscribe.', impact: 'medium', action: 'Create playlist' },
];

function impactColor(impact: 'high' | 'medium' | 'low') {
  if (impact === 'high') return 'text-[#00C48C]';
  if (impact === 'medium') return 'text-[#F5A623]';
  return 'text-[#4A9EFF]';
}

function impactBg(impact: 'high' | 'medium' | 'low') {
  if (impact === 'high') return 'bg-[#00C48C]/10 border-[#00C48C]/20';
  if (impact === 'medium') return 'bg-[#F5A623]/10 border-[#F5A623]/20';
  return 'bg-[#4A9EFF]/10 border-[#4A9EFF]/20';
}

function recIcon(type: Recommendation['type']) {
  if (type === 'subscribe') return <UserPlus className="w-4 h-4 text-[#E05252]" />;
  if (type === 'video') return <Video className="w-4 h-4 text-[#4A9EFF]" />;
  if (type === 'card') return <Layout className="w-4 h-4 text-[#9B72CF]" />;
  return <Play className="w-4 h-4 text-[#00C48C]" />;
}

export function EndScreenOptimizerTool() {
  const { spendTokens } = useNychIQStore();
  const [selectedVideo, setSelectedVideo] = useState(MOCK_VIDEOS[0]);
  const [showPreview, setShowPreview] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const handleOptimize = () => {
    setOptimizing(true);
    spendTokens('end-screen-optimizer');
    setTimeout(() => { setOptimizing(false); setShowPreview(true); }, 1800);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
              <Monitor className="w-5 h-5 text-[#00C48C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">End Screen Optimizer</h2>
              <p className="text-xs text-[#888888] mt-0.5">Maximize engagement with data-driven end screen placement</p>
            </div>
          </div>

          {/* Video Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <select
                value={selectedVideo.id}
                onChange={(e) => { setSelectedVideo(MOCK_VIDEOS.find((v) => v.id === e.target.value) || MOCK_VIDEOS[0]); setShowPreview(false); }}
                className="w-full appearance-none bg-[#0A0A0A] border border-[#222222] rounded-lg px-3 py-2.5 pr-8 text-sm text-[#E8E8E8] focus:outline-none focus:border-[#00C48C]/50 transition-colors"
              >
                {MOCK_VIDEOS.map((v) => (
                  <option key={v.id} value={v.id}>{v.title} ({v.duration})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none" />
            </div>
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#00C48C] text-[#0A0A0A] text-sm font-bold hover:bg-[#00B37D] transition-colors disabled:opacity-50 shrink-0"
            >
              <Zap className={`w-4 h-4 ${optimizing ? 'animate-pulse' : ''}`} />
              {optimizing ? 'Optimizing...' : 'Optimize End Screen'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Analysis */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#888888]" />
          <span className="text-sm font-semibold text-[#E8E8E8]">Current End Screen Analysis</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3">
              <p className="text-[11px] text-[#666666] uppercase tracking-wider mb-1">Subscribe Button</p>
              <div className="flex items-center gap-1.5">
                {MOCK_ANALYSIS.current.hasSubscribe ? (
                  <CheckCircle className="w-4 h-4 text-[#00C48C]" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-[#E05252]" />
                )}
                <span className="text-sm font-medium text-[#E8E8E8]">{MOCK_ANALYSIS.current.hasSubscribe ? 'Active' : 'Missing'}</span>
              </div>
            </div>
            <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3">
              <p className="text-[11px] text-[#666666] uppercase tracking-wider mb-1">Linked Video</p>
              <p className="text-sm font-medium text-[#E8E8E8] truncate">{MOCK_ANALYSIS.current.linkedVideo || 'None'}</p>
              {MOCK_ANALYSIS.current.linkedVideoViews && (
                <p className="text-[11px] text-[#888888]">{MOCK_ANALYSIS.current.linkedVideoViews} views</p>
              )}
            </div>
            <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3">
              <p className="text-[11px] text-[#666666] uppercase tracking-wider mb-1">Card Timing</p>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#F5A623]" />
                <span className="text-sm font-medium text-[#E8E8E8]">{MOCK_ANALYSIS.current.cardTiming}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Retention Moments */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F5A623]" />
          <span className="text-sm font-semibold text-[#E8E8E8]">High-Retention Moments</span>
          <span className="text-[11px] text-[#666666] ml-auto">Best placement points for end screens</span>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {MOCK_MOMENTS.map((moment, i) => (
            <div key={i} className="px-4 py-3.5 hover:bg-[#0D0D0D]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-12 h-8 rounded-md bg-[#00C48C]/10 border border-[#00C48C]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#00C48C]">{moment.timestamp}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-[#E8E8E8]">{moment.label}</p>
                    <span className="text-[11px] font-semibold text-[#00C48C]">{moment.retention}% retention</span>
                  </div>
                  <p className="text-xs text-[#888888] leading-relaxed">{moment.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9B72CF]" />
          <span className="text-sm font-semibold text-[#E8E8E8]">AI Recommendations</span>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {MOCK_RECOMMENDATIONS.map((rec, i) => (
            <div key={i} className="px-4 py-3.5 hover:bg-[#0D0D0D]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-[#1A1A1A] shrink-0 mt-0.5">
                  {recIcon(rec.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-medium text-[#E8E8E8]">{rec.title}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${impactBg(rec.impact)} ${impactColor(rec.impact)}`}>
                      {rec.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <p className="text-xs text-[#888888] leading-relaxed mb-2">{rec.description}</p>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-[#00C48C] hover:text-[#00D99D] transition-colors">
                    <ArrowRight className="w-3 h-3" />
                    {rec.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Mockup */}
      {showPreview && (
        <div className="rounded-lg bg-[#111111] border border-[#00C48C]/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
            <Layout className="w-4 h-4 text-[#00C48C]" />
            <span className="text-sm font-semibold text-[#E8E8E8]">Suggested End Screen Layout</span>
          </div>
          <div className="p-6">
            {/* 16:9 mockup */}
            <div className="relative w-full aspect-video rounded-lg bg-[#0A0A0A] border border-[#222222] overflow-hidden">
              {/* Video content bg */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-[#1A1A1A]" />

              {/* Subtle video frame */}
              <div className="absolute top-2 left-2 text-[10px] text-[#555]">▶ Preview</div>

              {/* End screen elements */}
              <div className="absolute inset-0 flex items-center justify-between p-6">
                {/* Left side - Subscribe */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-[#E05252] flex items-center justify-center">
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">Subscribe</span>
                </div>

                {/* Center - message */}
                <div className="text-center">
                  <p className="text-lg font-bold text-white mb-1">Thanks for watching!</p>
                  <p className="text-xs text-[#AAAAAA]">Next: 10 Tips for Better Thumbnails</p>
                </div>

                {/* Right side - Video link */}
                <div className="w-36 rounded-lg overflow-hidden border border-[#333] bg-[#222]">
                  <div className="aspect-video bg-gradient-to-r from-[#2A2A2A] to-[#333] flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-[#CCCCCC] font-medium leading-tight line-clamp-2">10 Tips for Better Thumbnails</p>
                    <p className="text-[9px] text-[#888888] mt-1">312K views</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-[#666666]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E05252]" />Subscribe (left)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4A9EFF]" />Video Link (right)</span>
              <span className="flex items-center gap-1"><Bell className="w-3 h-3" />CTA Message (center)</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-[11px] text-[#444444]">
        Optimization based on retention data & engagement patterns · Apply changes in YouTube Studio
      </div>
    </div>
  );
}
