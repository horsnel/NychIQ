'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useNychIQStore, TOOL_META, SIDEBAR_SECTIONS, TOKEN_COSTS } from '@/lib/store';
import { ICON_MAP } from '@/lib/icon-map';
import { cn } from '@/lib/utils';

/* ── Short descriptions for tools ── */
const TOOL_DESCRIPTIONS: Record<string, string> = {
  dashboard: 'Your complete analytics hub with real-time stats and activity feed.',
  'my-channel': 'View your linked channel stats, videos, and performance metrics.',
  trending: 'Real-time trending videos with viral scoring and category filters.',
  search: 'Search millions of videos, shorts, and channels with AI ranking.',
  rankings: 'Top channels and videos ranked by views, subscribers, and growth.',
  shorts: 'Trending YouTube Shorts with engagement metrics and viral scoring.',
  studio: 'Your creative suite with thumbnail, script, and hook tools.',
  lume: 'AI-powered layer system for content analysis and optimization.',
  hooklab: 'Generate and test attention-grabbing video hooks with AI.',
  pulsecheck: 'Real-time channel health monitoring and performance pulses.',
  'blueprint-ai': 'AI-generated content blueprints and strategy plans.',
  'next-uploader': 'Upload videos to YouTube with enhanced metadata and scheduling.',
  'auto-uploader': 'Automate video uploads with templates and batch processing.',
  scriptflow: 'Visual script writing with flow diagrams and timing markers.',
  'video-batch': 'Process and analyze multiple videos in batch operations.',
  arbitrage: 'Find low-competition, high-reward content opportunities.',
  viral: 'AI-powered viral prediction with title and thumbnail scoring.',
  niche: 'Discover untapped niches with growth potential and low competition.',
  algorithm: 'Understand how YouTube ranks content in your niche.',
  cpm: 'Estimate CPM rates and projected earnings across niches.',
  'niche-compare': 'Compare performance metrics between different niches.',
  'opportunity-heatmap': 'Visual heatmap of content opportunities.',
  'monetization-roadmap': 'Step-by-step monetization strategy for your channel.',
  competitor: 'Track competitor channels, content, and growth trajectories.',
  strategy: 'Analyze and replicate successful competitor strategies.',
  'ghost-tracker': 'Monitor channels that ghost or go inactive.',
  'digital-scout': 'Discover digital products and sponsorships.',
  seo: 'Optimize titles, descriptions, tags, and metadata for maximum reach.',
  hook: 'Generate attention-grabbing video hooks using AI.',
  keywords: 'Find high-volume, low-competition keywords for YouTube.',
  script: 'Generate complete video scripts with hooks and CTAs.',
  ideas: 'Get unlimited content ideas based on trends and your niche.',
  posttime: 'Find the best times to post for maximum engagement.',
  audit: 'Comprehensive channel audit with SEO and branding scoring.',
  'ab-test': 'A/B test thumbnails, titles, and descriptions.',
  'vph-tracker': 'Track views per hour in real-time after uploading.',
  'thumbnail-lab': 'AI-generated thumbnail concepts and A/B variants.',
  'safe-check': 'Scan scripts and thumbnails for policy risks.',
  'trend-alerts': 'Set up alerts for trending topics in your niche.',
  'outlier-scout': 'Find breakout channels before they go viral.',
  'perf-forensics': 'Diagnose why specific videos underperformed.',
  automation: 'Schedule and batch-run multiple tools automatically.',
  'sponsorship-roi': 'Calculate ROI for brand deals and sponsorships.',
  'history-intel': "Analyze a channel's full upload history for patterns.",
  goffviral: 'Cross-platform viral tracking and trend detection.',
  'social-trends': 'Trending topics across YouTube, TikTok, and Instagram.',
  'social-mentions': 'Track when your channel is mentioned across platforms.',
  'social-comments': 'Comment sentiment analysis and engagement tracking.',
  'social-channels': 'Compare your channel stats with competitors.',
  saku: 'Your personal AI YouTube strategy assistant.',
  deepchat: 'Conversational AI assistant powered by large language models.',
  'channel-assistant': 'AI assistant customized for your channel brand.',
  'channel-pa': 'Chat with an AI that knows your channel inside out.',
  'agency-dashboard': 'Multi-channel management for agencies.',
  'team-collab': 'Collaborate with team members on channel strategy.',
  'scheduled-reports': 'Automated recurring analytics reports.',
  settings: 'Manage your account, preferences, and integrations.',
  usage: 'View your token usage history and billing.',
  profile: 'Manage your profile and account details.',
  'sovereign-vault': 'Secure vault for your data and content.',
};

/* ── Section accent colors ── */
const SECTION_COLORS: Record<string, string> = {
  main: '#FDBA2D',
  studio: '#888888',
  intelligence: '#888888',
  competitor: '#888888',
  'ai-tools': '#888888',
  social: '#888888',
  'ai-assistants': '#888888',
  agency: '#888888',
  account: '#888888',
};

export function SearchTool() {
  const { setActiveTool, setPage } = useNychIQStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  // Group tools by section, filtered by query
  const toolsBySection = useMemo(() => {
    const q = query.toLowerCase().trim();
    return SIDEBAR_SECTIONS
      .map((section) => ({
        ...section,
        tools: Object.entries(TOOL_META)
          .filter(([, meta]) => meta.category === section.id)
          .filter(([id, meta]) =>
            q === '' ||
            meta.label.toLowerCase().includes(q) ||
            (TOOL_DESCRIPTIONS[id] || '').toLowerCase().includes(q) ||
            id.toLowerCase().includes(q)
          )
          .map(([id, meta]) => ({
            id,
            label: meta.label,
            icon: meta.icon,
            description: TOOL_DESCRIPTIONS[id] || 'A powerful YouTube intelligence tool.',
            tokenCost: TOKEN_COSTS[id] ?? 0,
          })),
      }))
      .filter((s) => s.tools.length > 0);
  }, [query]);

  const totalResults = toolsBySection.reduce((sum, s) => sum + s.tools.length, 0);

  const handleSelect = (toolId: string) => {
    setActiveTool(toolId);
    setPage('app');
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-up">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold mb-1"
          style={{
            background: 'linear-gradient(135deg, #FDBA2D, #C69320)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Explore Tools
        </h2>
        <p className="text-sm text-[#666666]">
          Discover and access all {Object.keys(TOOL_META).length} tools available on NychIQ
        </p>
      </div>

      {/* ── Search Input (pill) ── */}
      <div className="mb-8">
        <div className="relative flex items-center h-12 sm:h-14 rounded-full transition-colors duration-200 bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] focus-within:border-[#FDBA2D]/40">
          <div className="pl-4 sm:pl-5 flex items-center">
            <Search className="w-5 h-5 text-[#666666]" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tools by name or description..."
            className="flex-1 h-full bg-transparent text-sm sm:text-[15px] text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none px-3"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="pr-4 p-1 rounded-full hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-4 h-4 text-[#666666]" />
            </button>
          )}
          {query && (
            <span className="hidden sm:inline-flex pr-4 text-xs text-[#666666]">
              {totalResults} result{totalResults !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Quick Stats ── */}
      {!query && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Tools', value: Object.keys(TOOL_META).length, color: '#FDBA2D' },
            { label: 'Free Tools', value: Object.keys(TOOL_META).filter(id => (TOKEN_COSTS[id] ?? 0) === 0).length, color: '#888888' },
            { label: 'AI-Powered', value: Object.keys(TOOL_META).filter(id => ['ai-tools', 'ai-assistants'].includes(TOOL_META[id]?.category)).length, color: '#888888' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-3 sm:p-4 text-center"
            >
              <div className="text-xl sm:text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[10px] sm:text-xs text-[#666666] mt-1 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tool Sections ── */}
      <div className="space-y-8">
        {toolsBySection.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="w-10 h-10 text-[#1a1a1a] mx-auto mb-3" />
            <p className="text-sm text-[#666666] font-medium">
              No tools found for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-[#666666] mt-1">
              Try a different search term
            </p>
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="mt-4 px-5 py-2 rounded-full text-xs font-medium text-[#FDBA2D] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(253,186,45,0.08)] transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          toolsBySection.map((section) => {
            const accentColor = SECTION_COLORS[section.id] || '#666666';
            return (
              <div key={section.id}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <h3 className="text-xs font-semibold tracking-widest uppercase" style={{ color: accentColor }}>
                    {section.label}
                  </h3>
                  <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
                  <span className="text-[10px] text-[#666666]">
                    {section.tools.length} tool{section.tools.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tool cards grid — responsive: 1 col on mobile, 2 on sm, 3 on md */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.tools.map((tool) => {
                    const Icon = ICON_MAP[tool.icon] || Search;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleSelect(tool.id)}
                        className="group flex items-start gap-3 p-4 rounded-xl bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] hover:bg-[#1A1A1A] transition-all duration-200 text-left active:scale-[0.98]"
                      >
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#1a1a1a] border border-[rgba(255,255,255,0.06)]"
                        >
                          <Icon
                            className="w-5 h-5 text-[#aaa]"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#FFFFFF] group-hover:text-[#FDBA2D] transition-colors truncate">
                              {tool.label}
                            </span>
                            <ArrowRight className="w-3 h-3 text-[#1a1a1a] group-hover:text-[#FDBA2D] shrink-0 opacity-0 group-hover:opacity-100 transition-all ml-auto" />
                          </div>
                          <p className="text-xs text-[#666666] mt-1 line-clamp-2 leading-relaxed">
                            {tool.description}
                          </p>
                          {/* Token cost badge */}
                          {tool.tokenCost > 0 && (
                            <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(253,186,45,0.08)] text-[#FDBA2D] border border-[rgba(255,255,255,0.06)]">
                              {tool.tokenCost} token{tool.tokenCost > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Bottom padding for mobile ── */}
      <div className="h-8" />
    </div>
  );
}
