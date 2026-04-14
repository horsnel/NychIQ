'use client';

import React from 'react';
import {
  ChevronDown, ChevronRight, Lock, X,
} from 'lucide-react';
import { useNychIQStore, SIDEBAR_SECTIONS, TOOL_META, PLAN_ACCESS, type Plan } from '@/lib/store';
import { ICON_MAP } from '@/lib/icon-map';

const FALLBACK_ICON = ICON_MAP.LayoutDashboard;
import { cn } from '@/lib/utils';
import { playNav, playClick } from '@/lib/sounds';

/* ── Plan badge colors ── */
const PLAN_COLORS: Record<Plan, string> = {
  trial: 'text-[#666666]',
  starter: 'text-[#a0a0a0]',
  pro: 'text-[#888888]',
  elite: 'text-[#888888]',
  agency: 'text-[#F6A828]',
};

/* ── Plan hierarchy (lowest to highest) ── */
const PLAN_HIERARCHY: Plan[] = ['trial', 'starter', 'pro', 'elite', 'agency'];

/* ── Upsell badge info based on minimum plan required ── */
type BadgeInfo = { text: string; color: string } | null;

function getUpsellBadge(toolId: string, userPlan: Plan): BadgeInfo {
  // Find the minimum plan that includes this tool
  let minPlan: Plan | null = null;
  for (const plan of PLAN_HIERARCHY) {
    if (PLAN_ACCESS[plan]?.includes(toolId)) {
      minPlan = plan;
      break;
    }
  }
  if (!minPlan || minPlan === 'trial') return null;

  // If user's plan >= minPlan, they have access — no badge
  const userRank = PLAN_HIERARCHY.indexOf(userPlan);
  const minRank = PLAN_HIERARCHY.indexOf(minPlan);
  if (userRank >= minRank) return null;

  switch (minPlan) {
    case 'starter': return { text: 'NEW', color: '#888888' };
    case 'pro':     return { text: 'PRO+', color: '#F6A828' };
    case 'elite':   return { text: 'ELITE+', color: '#888888' };
    case 'agency':  return { text: 'AGENCY', color: '#888888' };
    default:        return null;
  }
}

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
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgba(255,255,255,0.03)]">
        <div className="w-10 h-10 rounded-[5px] bg-[#F6A828] flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M10 6L18 12L10 18V6Z" fill="white"/>
            <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-display-tight text-base font-black tracking-[2.5px] uppercase leading-none" style={{ color: '#FFFFFF' }}>
            NY<span className="text-[#F6A828]">CHIQ</span>
          </span>
          <span className="text-[9px] text-[#a0a0a0] tracking-[1.5px] uppercase mt-1 leading-none">YouTube Intelligence</span>
        </div>
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
              className="flex items-center gap-1 w-full px-2 py-1.5 text-[10px] font-semibold tracking-wider text-[#666666] hover:text-[#a0a0a0] transition-colors uppercase"
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
                  const Icon = ICON_MAP[tool.icon] || FALLBACK_ICON;
                  const toolId = tool.id;
                  const hasAccess = PLAN_ACCESS[userPlan]?.includes(toolId) ?? false;

                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        if (!hasAccess) {
                          playClick();
                          useNychIQStore.getState().setUpgradeModalOpen(true);
                          return;
                        }
                        playNav();
                        setActiveTool(tool.id);
                        setPage('app');
                      }}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-all duration-150',
                        isActive
                          ? 'sidebar-active bg-[rgba(246,168,40,0.08)] text-[#F6A828]'
                          : 'text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.04)]'
                      )}
                    >
                      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all duration-200', isActive ? 'bg-[rgba(246,168,40,0.12)]' : '')}>
                        <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#F6A828]' : '')} />
                      </div>
                      <span className="truncate">{tool.label}</span>
                      {!hasAccess && (() => {
                        const badge = getUpsellBadge(toolId, userPlan);
                        return badge ? (
                          <span
                            className="text-[8px] font-bold px-1 py-0 rounded ml-auto"
                            style={{
                              color: badge.color,
                              backgroundColor: `${badge.color}18`,
                            }}
                          >
                            {badge.text}
                          </span>
                        ) : null;
                      })()}
                      {!hasAccess && (
                        <Lock className="w-3 h-3 ml-auto text-[#666666] shrink-0" />
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
      <div className="border-t border-[rgba(255,255,255,0.03)] px-3 py-3">
        <button
          onClick={() => setPage('about')}
          className="flex items-center gap-3 w-full px-2 py-1.5 text-xs text-[#666666] hover:text-[#a0a0a0] transition-colors"
        >
          <span>About</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.03)] shrink-0 sticky top-0">
        {navContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-[280px] bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.03)] z-50 lg:hidden animate-fade-in-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.03)]">
              <span className="text-sm font-semibold text-[#a0a0a0]">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="text-[#666666] hover:text-[#FFFFFF]">
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
