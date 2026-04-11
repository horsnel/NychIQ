'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  Eye,
  Trophy,
  BarChart2,
  RefreshCw,
  Leaf,
  Zap,
  ArrowRight,
} from 'lucide-react';

/* ── Mock Generated Ideas ── */
const MOCK_IDEAS = [
  {
    title: '10 AI Tools That Will Replace Your Job in 2025',
    estimatedViews: '500K-2M',
    competition: 'High',
    competitionColor: '#E05252',
    viralScore: 92,
  },
  {
    title: 'I Built a Full App Using Only AI (Zero Coding)',
    estimatedViews: '200K-800K',
    competition: 'Medium',
    competitionColor: '#F5A623',
    viralScore: 85,
  },
  {
    title: 'The Future Nobody Is Talking About: AGI by 2027',
    estimatedViews: '100K-400K',
    competition: 'Low',
    competitionColor: '#00C48C',
    viralScore: 78,
  },
  {
    title: 'Why 99% of People Use ChatGPT Wrong',
    estimatedViews: '300K-1.2M',
    competition: 'Medium',
    competitionColor: '#F5A623',
    viralScore: 88,
  },
  {
    title: 'I Let AI Run My Business for 30 Days — Results',
    estimatedViews: '150K-600K',
    competition: 'Low',
    competitionColor: '#00C48C',
    viralScore: 74,
  },
];

/* ── Trending Topics ── */
const TRENDING_TOPICS = [
  {
    topic: 'AI Agents & Automation',
    momentum: '+340%',
    description: 'Autonomous AI agents are exploding across YouTube. High search volume, low content saturation.',
    tag: 'Hot 🔥',
  },
  {
    topic: 'Side Hustle with AI',
    momentum: '+180%',
    description: 'People are searching for AI-powered income strategies. Perfect for tutorial-style content.',
    tag: 'Rising 📈',
  },
  {
    topic: 'AI Image & Video Generation',
    momentum: '+260%',
    description: 'Sora, Midjourney v7, and Runway are driving massive interest. Tutorial and review formats perform best.',
    tag: 'Hot 🔥',
  },
];

/* ── Evergreen Topics ── */
const EVERGREEN_TOPICS = [
  {
    title: 'Beginner\'s Guide to AI Tools',
    description: 'Evergreen demand: 80K+ monthly searches. Create a comprehensive playlist targeting beginners entering the AI space.',
    searchVolume: '82K/mo',
    longevityScore: 95,
  },
  {
    title: 'AI vs Human: Productivity Comparison',
    description: 'Timeless debate format with consistent search traffic year-round. Perfect for series content.',
    searchVolume: '45K/mo',
    longevityScore: 88,
  },
];

export function ResearchIdeasTool() {
  const { tokenBalance } = useNychIQStore();
  const [niche, setNiche] = useState('');
  const [showIdeas, setShowIdeas] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!niche.trim()) return;
    setLoading(true);
    setShowIdeas(false);
    // Simulate loading delay
    setTimeout(() => {
      setLoading(false);
      setShowIdeas(true);
    }, 1500);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
            <Lightbulb className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Research & Ideas</h2>
            <p className="text-xs text-[#888888] mt-0.5">AI-powered research tools to discover winning content ideas and trends.</p>
          </div>
        </div>
      </div>

      {/* AI Next-Video Planner */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#9B72CF]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">AI Next-Video Planner</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="Enter your niche or topic..."
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !niche.trim()}
              className="px-5 h-11 rounded-lg bg-[#9B72CF] text-[#0A0A0A] text-sm font-bold hover:bg-[#8A62BE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Ideas
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-[#0D0D0D] p-4 border border-[#1A1A1A]">
                <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4 mb-2" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2 mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-[#1A1A1A] rounded animate-pulse" />
                  <div className="h-5 w-16 bg-[#1A1A1A] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generated Ideas */}
        {showIdeas && !loading && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_IDEAS.map((idea, i) => (
              <div
                key={i}
                className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-4 hover:border-[rgba(155,114,207,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-[#666666]">#{i + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#888888] flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {idea.estimatedViews}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        color: idea.viralScore >= 80 ? '#00C48C' : '#F5A623',
                        backgroundColor: idea.viralScore >= 80 ? 'rgba(0,196,140,0.1)' : 'rgba(245,166,35,0.1)',
                        border: `1px solid ${idea.viralScore >= 80 ? 'rgba(0,196,140,0.3)' : 'rgba(245,166,35,0.3)'}`,
                      }}
                    >
                      {idea.viralScore}
                    </div>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-[#E8E8E8] mb-2 line-clamp-2">{idea.title}</h4>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: idea.competitionColor,
                      backgroundColor: `${idea.competitionColor}15`,
                      border: `1px solid ${idea.competitionColor}30`,
                    }}
                  >
                    {idea.competition} Competition
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending Topics */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#9B72CF]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Trending Topics</h3>
          </div>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {TRENDING_TOPICS.map((topic, i) => (
            <div
              key={i}
              className="px-4 sm:px-5 py-4 hover:bg-[#0D0D0D]/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[#E8E8E8] group-hover:text-[#9B72CF] transition-colors">
                    {topic.topic}
                  </h4>
                  <span className="text-[10px] font-medium text-[#9B72CF] bg-[rgba(155,114,207,0.1)] px-1.5 py-0.5 rounded">
                    {topic.tag}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#00C48C] shrink-0">{topic.momentum}</span>
              </div>
              <p className="text-xs text-[#888888] leading-relaxed">{topic.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Evergreen Content Finder */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#9B72CF]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Evergreen Content Finder</h3>
          </div>
          <p className="text-xs text-[#888888] mt-1">Topics with consistent, long-term search demand.</p>
        </div>
        <div className="divide-y divide-[#1A1A1A]">
          {EVERGREEN_TOPICS.map((topic, i) => (
            <div
              key={i}
              className="px-4 sm:px-5 py-4 hover:bg-[#0D0D0D]/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-[#E8E8E8] group-hover:text-[#9B72CF] transition-colors">
                  {topic.title}
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-[#888888] flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" /> {topic.searchVolume}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      color: '#00C48C',
                      backgroundColor: 'rgba(0,196,140,0.1)',
                      border: '1px solid rgba(0,196,140,0.3)',
                    }}
                  >
                    {topic.longevityScore}
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#888888] leading-relaxed">{topic.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
