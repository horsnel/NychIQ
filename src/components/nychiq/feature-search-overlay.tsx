'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useNychIQStore, TOOL_META, SIDEBAR_SECTIONS } from '@/lib/store';
import { ICON_MAP } from '@/lib/icon-map';

/* ── Short descriptions for tools ── */
const TOOL_DESCRIPTIONS: Record<string, string> = {
  dashboard: 'Your complete analytics hub with real-time stats and activity feed.',
  trending: 'Real-time trending videos with viral scoring and category filters.',
  search: 'Search millions of videos, shorts, and channels with AI ranking.',
  rankings: 'Top channels and videos ranked by views, subscribers, and growth.',
  shorts: 'Trending YouTube Shorts with engagement metrics and viral scoring.',
  studio: 'Your creative suite with thumbnail, script, and hook tools.',
  lume: 'AI-powered layer system for content analysis and optimization.',
  hooklab: 'Generate and test attention-grabbing video hooks with AI.',
  pulsecheck: 'Real-time channel health monitoring and performance pulses.',
  'blueprint-ai': 'AI-generated content blueprints and strategy plans.',
  scriptflow: 'Visual script writing with flow diagrams and timing markers.',
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
  seo: 'Optimize titles, descriptions, tags, and metadata.',
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
  'history-intel': 'Analyze a channel\'s full upload history for patterns.',
  goffviral: 'Cross-platform viral tracking and trend detection.',
  'social-trends': 'Trending topics across YouTube, TikTok, and Instagram.',
  'social-mentions': 'Track when your channel is mentioned across platforms.',
  'social-comments': 'Comment sentiment analysis and engagement tracking.',
  'social-channels': 'Compare your channel stats with competitors.',
  saku: 'Your personal AI YouTube strategy assistant.',
  deepchat: 'Conversational AI assistant powered by large language models.',
  'channel-assistant': 'AI assistant customized for your channel brand.',
  'agency-dashboard': 'Multi-channel management for agencies.',
  settings: 'Manage your account, preferences, and integrations.',
  usage: 'View your token usage history and billing.',
  profile: 'Manage your profile and account details.',
  'sovereign-vault': 'Secure vault for your data and content.',
};

interface FeatureSearchOverlayProps {
  onClose: () => void;
}

export function FeatureSearchOverlay({ onClose }: FeatureSearchOverlayProps) {
  const { setActiveTool, setPage } = useNychIQStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Group tools by section
  const toolsBySection = useMemo(() => {
    return SIDEBAR_SECTIONS
      .map((section) => ({
        ...section,
        tools: Object.entries(TOOL_META)
          .filter(([id, meta]) => meta.category === section.id)
          .filter(([id, meta]) =>
            query.trim() === '' ||
            meta.label.toLowerCase().includes(query.toLowerCase()) ||
            (TOOL_DESCRIPTIONS[id] || '').toLowerCase().includes(query.toLowerCase())
          )
          .map(([id, meta]) => ({
            id,
            label: meta.label,
            icon: meta.icon,
            description: TOOL_DESCRIPTIONS[id] || 'A powerful YouTube intelligence tool.',
          })),
      }))
      .filter((s) => s.tools.length > 0);
  }, [query]);

  const totalResults = toolsBySection.reduce((sum, s) => sum + s.tools.length, 0);

  const handleSelect = (toolId: string) => {
    setActiveTool(toolId);
    setPage('app');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Overlay */}
      <div className="relative w-full max-w-3xl max-h-[75vh] bg-[#0D0D0D] border border-[#222222] rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden flex flex-col">
        {/* Search header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E1E1E]">
          <Search className="w-5 h-5 text-[#FDBA2D] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all tools..."
            className="flex-1 bg-transparent text-base text-[#FFFFFF] placeholder-[#555555] outline-none"
          />
          {query && (
            <span className="text-xs text-[#444444]">{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <X className="w-4 h-4 text-[#A3A3A3]" />
          </button>
        </div>

        {/* Tool grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {toolsBySection.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-[#333333] mx-auto mb-3" />
              <p className="text-sm text-[#555555]">No tools found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-[#444444] mt-1">Try a different search term</p>
            </div>
          ) : (
            toolsBySection.map((section) => (
              <div key={section.id}>
                <h3 className="text-[10px] font-semibold tracking-widest text-[#444444] uppercase mb-3 px-1">
                  {section.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {section.tools.map((tool) => {
                    const Icon = ICON_MAP[tool.icon] || Search;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleSelect(tool.id)}
                        className="flex items-start gap-3 p-3 rounded-xl bg-[#141414] border border-[#1E1E1E] hover:border-[#2A2A2A] hover:bg-[#1A1A1A] transition-all group text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.12)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(253,186,45,0.12)] transition-colors">
                          <Icon className="w-4 h-4 text-[#FDBA2D]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#FFFFFF] group-hover:text-[#FDBA2D] transition-colors truncate">
                              {tool.label}
                            </span>
                            <ArrowRight className="w-3 h-3 text-[#444444] group-hover:text-[#FDBA2D] shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                          <p className="text-xs text-[#666666] mt-0.5 line-clamp-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1E1E1E]">
          <span className="text-[10px] text-[#444444]">
            {TOOL_META && Object.keys(TOOL_META).length} tools available
          </span>
          <kbd className="px-2 py-0.5 text-[10px] rounded bg-[#1A1A1A] border border-[#222222] text-[#444444]">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  );
}
