'use client';

import React, { useEffect, useState } from 'react';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/**
 * Saku AI Floating Action Button (FAB)
 *
 * A persistent animated button visible on all app pages.
 * Shows unread insight count badge, pulses when new insights are available.
 * Click to toggle SakuPanel.
 */
export function SakuFab() {
  const { sakuOpen, sakuFullOpen, setSakuOpen, bgInsights } = useNychIQStore();
  const [mounted, setMounted] = useState(false);

  const unreadCount = bgInsights.filter(i => !i.read).length;

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (sakuOpen) {
      setSakuOpen(false);
    } else if (sakuFullOpen) {
      // Don't open panel if full page is open
      return;
    } else {
      setSakuOpen(true);
    }
  };

  // Hide FAB when Saku full page is open
  if (!mounted || sakuFullOpen) return null;

  const hasUnread = unreadCount > 0 && !sakuOpen;

  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 z-[45] transition-all duration-500',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        sakuOpen && 'scale-0 opacity-0 pointer-events-none',
      )}
    >
      {/* Pulse rings when unread */}
      {hasUnread && (
        <>
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#FDBA2D]"
            style={{ animation: 'sakufabPulse 2.5s ease-out infinite' }}
          />
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#FDBA2D]"
            style={{ animation: 'sakufabPulse 2.5s ease-out 0.8s infinite' }}
          />
        </>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group',
          'bg-gradient-to-br from-[#8B5CF6] to-[#FDBA2D] shadow-lg',
          'hover:shadow-xl hover:shadow-[rgba(139,92,246,0.3)] hover:scale-110',
          'active:scale-95',
          hasUnread && 'animate-sakufab-bounce',
        )}
        title={sakuOpen ? 'Close Saku' : 'Open Saku AI'}
      >
        {/* Animated background shimmer */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            style={{ animation: 'sakufabShimmer 3s ease-in-out infinite' }} />
        </div>

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {sakuOpen ? (
            <X className="w-6 h-6 text-black" />
          ) : (
            <MessageCircle className="w-6 h-6 text-black" />
          )}
        </div>

        {/* Unread badge */}
        {hasUnread && (
          <div className="absolute -top-1 -right-1 z-20 min-w-[20px] h-5 px-1 rounded-full bg-[#EF4444] text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0D0D0D] shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}

        {/* Sparkle accent */}
        {!sakuOpen && (
          <Sparkles className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 text-[#FDBA2D] opacity-60" style={{ animation: 'sakufabSpin 4s linear infinite' }} />
        )}
      </button>
    </div>
  );
}
