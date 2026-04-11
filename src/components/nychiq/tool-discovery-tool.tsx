'use client';

import React, { useState, useMemo } from 'react';
import { useNychIQStore, TOOL_META, TOKEN_COSTS, SIDEBAR_SECTIONS } from '@/lib/store';
import {
  Search, X, Sparkles, ArrowRight, Zap, Filter, Flame, Star,
  LayoutDashboard, BarChart3, Lightbulb, SearchCode, Palette,
  TrendingUp, Clock, Settings, User, Coins, Archive,
  Film, DollarSign, Columns2, Grid3x3, Target, Crosshair,
  BrainCircuit, Anchor, Key, FileText, Monitor, ClipboardCheck,
  GitCompare, Activity, Image, ShieldCheck, BellRing, Radar,
  Stethoscope, Cpu, Handshake, History, MessageSquare,
  Layers, Scan, Wrench, ScrollText, Scale, Users, Copy,
  EyeOff, Package, Share2, AtSign, Heart, BarChart2, Building2,
  Bot, Globe, CalendarClock, Upload, MessageCircle, ShoppingBag,
  Mic, Wallet, RefreshCw, GitBranch, Link, UserCog, FileBarChart,
  Type, CalendarRange, PieChart, Compass,
} from 'lucide-react';

/* ── Icon map ── */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
  LayoutDashboard, BarChart3, Lightbulb, SearchCode, Palette,
  TrendingUp, Clock, Settings, User, Coins, Archive,
  Film, DollarSign, Columns2, Grid3x3, Target,
  Search, Zap, Crosshair, BrainCircuit, Anchor, Key,
  FileText, Monitor, ClipboardCheck, GitCompare, Activity, Image, ShieldCheck,
  BellRing, Radar, Stethoscope, Cpu, Handshake, History, MessageSquare,
  Sparkles, Layers, Scan, Wrench, ScrollText, Scale, Users, Copy,
  EyeOff, Package, Flame, Share2, AtSign, Heart, BarChart2, Building2,
  Bot, Globe, CalendarClock, Upload, MessageCircle, ShoppingBag, Mic, Wallet,
  RefreshCw, GitBranch, Link, UserCog, FileBarChart, Type, CalendarRange, PieChart, Compass,
};

function getIcon(name: string) {
  return ICON_MAP[name] ?? Sparkles;
}

/* ── Category styles ── */
const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  dashboard:      { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.15)' },
  analytics:      { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.15)' },
  research:       { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
  'seo-opt':      { color: '#10B981', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.15)' },
  'content-studio': { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
  growth:         { color: '#FDBA2D', bg: 'rgba(253,186,45,0.08)',  border: 'rgba(253,186,45,0.15)' },
  focus:          { color: '#10B981', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.15)' },
  account:        { color: '#A3A3A3', bg: 'rgba(136,136,136,0.08)', border: 'rgba(136,136,136,0.15)' },
  _sub:           { color: '#FDBA2D', bg: 'rgba(253,186,45,0.08)',  border: 'rgba(253,186,45,0.15)' },
};

/* ── Popular tools ── */
const POPULAR_IDS = new Set([
  'trending', 'viral', 'seo', 'keywords', 'hook', 'ideas', 'clipdrop', 'echoes',
  'rankings', 'thumbnail-lab', 'competitor', 'script', 'shorts', 'audit', 'saku',
]);

/* ── Category filter tabs ── */
const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Tools', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'popular', label: 'Popular', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'research', label: 'Research', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: 'seo-opt', label: 'SEO', icon: <SearchCode className="w-3.5 h-3.5" /> },
  { id: 'content-studio', label: 'Content', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'growth', label: 'Growth', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'focus', label: 'Focus', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'account', label: 'Account', icon: <Settings className="w-3.5 h-3.5" /> },
];

function getCategorySection(category: string): string {
  if (category === '_sub') return 'All Tools';
  const section = SIDEBAR_SECTIONS.find(s => s.id === category);
  return section?.label ?? category;
}

/* ── Main Component ── */
export function ToolDiscoveryTool() {
  const { setActiveTool, searchFilter } = useNychIQStore();
  const [searchQuery, setSearchQuery] = useState(searchFilter === 'All' ? '' : searchFilter);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus search on mount
  React.useEffect(() => {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter tools
  const filteredTools = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return Object.entries(TOOL_META).filter(([id, meta]) => {
      if (['dashboard', 'analytics', 'research-ideas', 'seo-hub', 'content-studio', 'growth-tools', 'focus'].includes(id)) return false;
      if (['saku', 'deepchat', 'tool-discovery'].includes(id)) return false;

      if (activeCategory === 'popular') {
        if (!POPULAR_IDS.has(id)) return false;
      } else if (activeCategory !== 'all') {
        if (meta.category !== activeCategory && meta.category !== '_sub') return false;
        if (meta.category === '_sub' && activeCategory !== 'all' && activeCategory !== 'popular') return false;
      }

      if (query) {
        return (
          meta.label.toLowerCase().includes(query) ||
          id.toLowerCase().includes(query) ||
          meta.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [searchQuery, activeCategory]);

  // Group by category
  const groupedTools = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'popular') {
      return [{ category: getCategorySection(activeCategory), tools: filteredTools }];
    }
    if (activeCategory === 'popular') {
      return [{ category: 'Popular Tools', tools: filteredTools }];
    }
    const groups: Record<string, [string, typeof TOOL_META[string]][]> = {};
    for (const [id, meta] of filteredTools) {
      const cat = meta.category === '_sub' ? 'Other Tools' : getCategorySection(meta.category);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push([id, meta]);
    }
    return Object.entries(groups).map(([category, tools]) => ({ category, tools }));
  }, [filteredTools, activeCategory]);

  const totalTools = Object.keys(TOOL_META).length;
  const resultCount = filteredTools.length;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Hero Search Header */}
      <div className="rounded-xl bg-gradient-to-br from-[#141414] to-[#0D0D0D] border border-[#1F1F1F] p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#FDBA2D]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[rgba(253,186,45,0.15)] to-[rgba(139,92,246,0.1)] border border-[rgba(253,186,45,0.2)]">
              <Sparkles className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#FFFFFF] tracking-tight">Discover Tools</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">Explore all {totalTools} tools across every category</p>
            </div>
          </div>

          {/* Search input with Ninja AI glow */}
          <div className={`ninja-search-wrap ${searchFocused ? 'ninja-search-active' : ''} rounded-xl`}>
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${searchFocused ? 'text-[#8B5CF6]' : 'text-[#555555]'}`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Type to search any tool, feature, or category..."
                className="w-full h-12 pl-12 pr-12 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] text-sm text-[#FFFFFF] placeholder-[#444444] focus:outline-none transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#555555] hover:text-[#FFFFFF] hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-[#FDBA2D] text-black shadow-[0_0_16px_rgba(253,186,45,0.2)]'
                    : 'bg-[#141414] text-[#A3A3A3] border border-[#1F1F1F] hover:border-[#333333] hover:text-[#FFFFFF]'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#666666]">
          Showing <span className="text-[#FFFFFF] font-semibold">{resultCount}</span> tools
          {searchQuery && (
            <span>
              {' '}for &ldquo;<span className="text-[#FDBA2D]">{searchQuery}</span>&rdquo;
            </span>
          )}
        </p>
        {(searchQuery || activeCategory !== 'all') && (
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="text-[11px] text-[#FDBA2D] hover:text-[#FFB840] font-medium transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Tool Grid */}
      {groupedTools.map((group) => {
        const catStyle = CATEGORY_STYLES[group.category.toLowerCase()] ?? CATEGORY_STYLES._sub;
        return (
          <div key={group.category} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: catStyle.color }} />
              <h3 className="text-sm font-semibold text-[#FFFFFF]">{group.category}</h3>
              <span className="text-[11px] text-[#555555] font-medium">({group.tools.length})</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {group.tools.map(([id, meta]) => {
                const IconComp = getIcon(meta.icon);
                const tokens = TOKEN_COSTS[id] ?? 0;
                const isFree = tokens === 0;
                const isPopular = POPULAR_IDS.has(id);
                const cardColor = catStyle.color;

                return (
                  <button
                    key={id}
                    onClick={() => setActiveTool(id)}
                    className="relative group rounded-xl bg-[#141414] border border-[#1F1F1F] p-4 text-left hover:border-[#2A2A2A] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${cardColor}08 0%, transparent 70%)` }}
                    />
                    {isPopular && (
                      <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.15)]">
                        <Flame className="w-2.5 h-2.5 text-[#FDBA2D]" />
                      </div>
                    )}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${cardColor}12`, border: `1px solid ${cardColor}20` }}
                    >
                      <IconComp className="w-5 h-5" color={cardColor} />
                    </div>
                    <h4 className="text-xs font-bold text-[#FFFFFF] leading-tight mb-1 group-hover:text-white transition-colors line-clamp-2">
                      {meta.label}
                    </h4>
                    <div className="mt-2 flex items-center gap-1">
                      {isFree ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)]">
                          FREE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold" style={{ color: cardColor, backgroundColor: `${cardColor}10`, border: `1px solid ${cardColor}18` }}>
                          <Zap className="w-2.5 h-2.5" />
                          {tokens}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: cardColor }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {groupedTools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.15)] flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">No tools found</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">Try a different search term or clear your filters to see all available tools.</p>
          <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="mt-4 px-5 py-2.5 rounded-xl bg-[#FDBA2D] text-black text-xs font-bold hover:bg-[#C69320] transition-colors">
            Show all tools
          </button>
        </div>
      )}

      {/* Footer CTA */}
      <div className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FDBA2D] to-[#8B5CF6] flex items-center justify-center shrink-0">
          <Star className="w-5 h-5 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#FFFFFF]">Can&apos;t find what you need?</h3>
          <p className="text-xs text-[#A3A3A3] mt-0.5">Ask Saku AI to help you find the right tool or create a custom workflow.</p>
        </div>
        <button onClick={() => setActiveTool('saku')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FDBA2D] to-[#8B5CF6] text-black text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5" />
          Ask Saku
        </button>
      </div>
    </div>
  );
}
