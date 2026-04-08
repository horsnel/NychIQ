'use client';

import React from 'react';
import { Menu, Bell, Command } from 'lucide-react';
import { useNychIQStore, TOOL_META, TOKEN_COSTS } from '@/lib/store';
import { TokenPill } from './token-pill';
import { cn } from '@/lib/utils';

export function Topbar() {
  const {
    activeTool,
    userName,
    toggleSidebar,
    setNotifDrawerOpen,
    setCommandBarOpen,
    setPage,
    logout,
  } = useNychIQStore();

  const toolMeta = TOOL_META[activeTool];
  const pageTitle = toolMeta?.label ?? 'Dashboard';
  const tokenCost = TOKEN_COSTS[activeTool] ?? 0;

  return (
    <header className="flex items-center gap-3 h-14 px-4 bg-[#0A0A0A] border-b border-[#1E1E1E] sticky top-0 z-30">
      {/* Hamburger (mobile) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-[#1A1A1A] transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-text-primary truncate">
        {pageTitle}
      </h1>

      {/* Token cost badge */}
      {tokenCost > 0 && (
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(245,166,35,0.1)] text-[#F5A623] border border-[rgba(245,166,35,0.2)]">
          {tokenCost} token{tokenCost > 1 ? 's' : ''}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Command bar trigger */}
        <button
          onClick={() => setCommandBarOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#222222] text-text-muted text-xs hover:border-[#2A2A2A] hover:text-text-secondary transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>Search</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-[#1A1A1A] border border-[#222222]">⌘K</kbd>
        </button>

        {/* Notification bell */}
        <button
          onClick={() => setNotifDrawerOpen(true)}
          className="relative p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-[#1A1A1A] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E05252]" />
        </button>

        {/* Token pill */}
        <TokenPill />

        {/* User avatar */}
        <button
          onClick={() => {
            if (confirm('Sign out?')) {
              logout();
            }
          }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F5A623] to-[#FFD700] flex items-center justify-center text-xs font-bold text-black cursor-pointer hover:opacity-90 transition-opacity"
          title={userName || 'User'}
        >
          {userName ? userName[0].toUpperCase() : 'U'}
        </button>
      </div>
    </header>
  );
}
