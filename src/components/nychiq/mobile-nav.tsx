'use client';

import React from 'react';
import { Home, TrendingUp, Search, Users, Share2, User } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'competitor', label: 'Spy', icon: Users },
  { id: 'social-trends', label: 'Social', icon: Share2 },
  { id: 'profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const { mobileNavTab, setMobileNavTab, setActiveTool } = useNychIQStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#070707] border-t border-[#1E1E1E]">
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const isActive = mobileNavTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setMobileNavTab(tab.id);
                setActiveTool(tab.id);
              }}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-colors',
                isActive ? 'text-[#F5A623]' : 'text-text-muted'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(245,166,35,0.5)]')} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#F5A623]" />
              )}
            </button>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
