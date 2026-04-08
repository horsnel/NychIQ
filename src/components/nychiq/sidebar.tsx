'use client';

import React from 'react';
import {
  LayoutDashboard, TrendingUp, Search, BarChart3, Film,
  Bot, Palette, MessageSquare, Building2, Zap, Crosshair,
  BrainCircuit, DollarSign, Users, Copy, SearchCode, Anchor,
  Key, FileText, Lightbulb, Clock, ClipboardCheck, GitCompare,
  Activity, Image, ShieldCheck, BellRing, Radar, Stethoscope,
  Cpu, Handshake, History, Flame, Share2, AtSign, Heart,
  BarChart2, Settings, Coins, User, ChevronDown, ChevronRight,
  Lock, X, Sparkles,
} from 'lucide-react';
import { useNychIQStore, SIDEBAR_SECTIONS, TOOL_META, type Plan } from '@/lib/store';
import { cn } from '@/lib/utils';

/* ── Icon map ── */
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, TrendingUp, Search, BarChart3, Film,
  Bot, Palette, MessageSquare, Building2, Zap, Crosshair,
  BrainCircuit, DollarSign, Users, Copy, SearchCode, Anchor,
  Key, FileText, Lightbulb, Clock, ClipboardCheck, GitCompare,
  Activity, Image, ShieldCheck, BellRing, Radar, Stethoscope,
  Cpu, Handshake, History, Flame, Share2, AtSign, Heart,
  BarChart2, Settings, Coins, User, Sparkles,
};

/* ── Plan badge colors ── */
const PLAN_COLORS: Record<Plan, string> = {
  trial: 'text-text-muted',
  starter: 'text-text-secondary',
  pro: 'text-blue',
  elite: 'text-purple',
  agency: 'text-amber',
};

export function Sidebar() {
  const { activeTool, userPlan, sidebarOpen, setSidebarOpen, setActiveTool, setPage } = useNychIQStore();
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Group tools by section category
  const toolsBySection = SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    tools: Object.entries(TOOL_META)
      .filter(([, meta]) => meta.category === section.id)
      .map(([id, meta]) => ({ id, ...meta })),
  })).filter((s) => s.tools.length > 0);

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1E1E1E]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#FFD700] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-black" />
        </div>
        <span className="text-lg font-bold text-gradient-amber">NychIQ</span>
        <span className={cn('text-xs font-medium ml-auto', PLAN_COLORS[userPlan])}>
          {userPlan.toUpperCase()}
        </span>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-2 px-2">
        {toolsBySection.map((section) => (
          <div key={section.id} className="mb-1">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center gap-1 w-full px-2 py-1.5 text-[10px] font-semibold tracking-wider text-text-muted hover:text-text-secondary transition-colors uppercase"
            >
              {collapsedSections[section.id] ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {section.label}
            </button>

            {/* Section items */}
            {!collapsedSections[section.id] && (
              <div className="space-y-0.5">
                {section.tools.map((tool) => {
                  const isActive = activeTool === tool.id;
                  const Icon = ICON_MAP[tool.icon] || LayoutDashboard;
                  const canAccess = useNychIQStore.getState().canAccess(tool.id);

                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        if (!canAccess) {
                          useNychIQStore.getState().setUpgradeModalOpen(true);
                          return;
                        }
                        setActiveTool(tool.id);
                        setPage('app');
                      }}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-all duration-150',
                        isActive
                          ? 'sidebar-active bg-[rgba(245,166,35,0.1)] text-[#F5A623]'
                          : 'text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A]'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#F5A623]' : '')} />
                      <span className="truncate">{tool.label}</span>
                      {!canAccess && (
                        <Lock className="w-3 h-3 ml-auto text-text-muted shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[#1E1E1E] px-3 py-3">
        <button
          onClick={() => setPage('about')}
          className="flex items-center gap-3 w-full px-2 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <span>About</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-[#070707] border-r border-[#1E1E1E] shrink-0 sticky top-0">
        {navContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-[280px] bg-[#070707] border-r border-[#1E1E1E] z-50 lg:hidden animate-fade-in-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
              <span className="text-sm font-semibold text-text-secondary">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
