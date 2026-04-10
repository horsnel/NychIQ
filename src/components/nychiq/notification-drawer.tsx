'use client';

import React, { useState, useMemo } from 'react';
import { X, Bell, Check, CheckCheck, AlertTriangle, Crown, TrendingUp, Coins, Sparkles } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'system';
  navigateTo: string;
}

interface IntelligenceItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  color: string;
  bgColor: string;
}

const INITIAL_NOTIFS: Notification[] = [
  { id: '1', title: 'Welcome to NychIQ', message: 'Your trial account is ready with 20 tokens. More tokens unlock over 3 days!', time: 'Just now', read: false, type: 'info', navigateTo: 'dashboard' },
  { id: '2', title: 'Trending Alert', message: 'Your niche "Tech Reviews" has 3 viral videos today.', time: '2h ago', read: false, type: 'success', navigateTo: 'trending' },
  { id: '3', title: 'Token Low', message: 'You have less than 10 tokens remaining.', time: '1d ago', read: true, type: 'warning', navigateTo: 'usage' },
  { id: '4', title: 'Viral Score Updated', message: 'Channel viral score has been recalculated for your tracked niches.', time: '3h ago', read: false, type: 'system', navigateTo: 'dashboard' },
];

function useIntelligenceFeed(): IntelligenceItem[] {
  const { tokenBalance, userPlan, region } = useNychIQStore();

  return useMemo(() => {
    const items: IntelligenceItem[] = [];

    // Token balance warning
    if (tokenBalance < 10) {
      items.push({
        id: 'intel-tokens',
        icon: <Coins className="w-4 h-4 text-[#E05252]" />,
        title: 'Low Token Balance',
        message: `You only have ${tokenBalance} token${tokenBalance !== 1 ? 's' : ''} left. Upgrade or use a referral code for more.`,
        color: '#E05252',
        bgColor: 'rgba(224,82,82,0.08)',
      });
    } else if (tokenBalance < 30) {
      items.push({
        id: 'intel-tokens',
        icon: <AlertTriangle className="w-4 h-4 text-[#F5A623]" />,
        title: 'Token Balance Warning',
        message: `You have ${tokenBalance} tokens remaining. Consider upgrading for unlimited access.`,
        color: '#F5A623',
        bgColor: 'rgba(245,166,35,0.08)',
      });
    }

    // Plan upgrade suggestion
    if (userPlan === 'trial') {
      items.push({
        id: 'intel-plan',
        icon: <Crown className="w-4 h-4 text-[#F5A623]" />,
        title: 'Upgrade Your Plan',
        message: 'Unlock 40+ tools, higher limits, and priority AI with a Pro plan.',
        color: '#F5A623',
        bgColor: 'rgba(245,166,35,0.08)',
      });
    }

    // Region-specific trending info
    const regionNames: Record<string, string> = {
      US: 'United States', GB: 'United Kingdom', NG: 'Nigeria', GH: 'Ghana',
      KE: 'Kenya', ZA: 'South Africa', IN: 'India', CA: 'Canada', DE: 'Germany',
      FR: 'France', BR: 'Brazil', AU: 'Australia', JP: 'Japan', TZ: 'Tanzania', EG: 'Egypt',
    };
    const regionName = regionNames[region] || region;
    items.push({
      id: 'intel-region',
      icon: <TrendingUp className="w-4 h-4 text-[#00C48C]" />,
      title: `${regionName} Trending`,
      message: `Trending content is surging in ${regionName}. Check the Trending tool for the latest viral videos.`,
      color: '#00C48C',
      bgColor: 'rgba(0,196,140,0.08)',
    });

    // Time-based greeting/tip
    const hour = new Date().getHours();
    let greeting: string;
    let tip: string;
    if (hour < 12) {
      greeting = 'Good morning!';
      tip = 'Morning hours (9-11 AM) have the highest engagement rates for YouTube uploads.';
    } else if (hour < 17) {
      greeting = 'Good afternoon!';
      tip = 'Afternoon viewership peaks around 2-4 PM. Schedule your content accordingly.';
    } else {
      greeting = 'Good evening!';
      tip = 'Evening uploads (5-7 PM) perform well for educational and tech content.';
    }
    items.push({
      id: 'intel-time',
      icon: <Sparkles className="w-4 h-4 text-[#9B72CF]" />,
      title: greeting,
      message: tip,
      color: '#9B72CF',
      bgColor: 'rgba(155,114,207,0.08)',
    });

    return items;
  }, [tokenBalance, userPlan, region]);
}

export function NotificationDrawer() {
  const { notifDrawerOpen, setNotifDrawerOpen, setActiveTool, setPage } = useNychIQStore();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS);
  const intelligenceItems = useIntelligenceFeed();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    // Navigate
    setActiveTool(notif.navigateTo);
    setPage('app');
    setNotifDrawerOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {notifDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setNotifDrawerOpen(false)} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#111] border-l border-[#222] z-50 transition-transform duration-300 ${
          notifDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E1E]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F5A623]" />
            <h2 className="text-base font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F5A623] text-black">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-text-muted hover:text-[#F5A623] hover:bg-[rgba(245,166,35,0.1)] transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={() => setNotifDrawerOpen(false)}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto h-[calc(100%-57px)] p-3 space-y-2">
          {/* Intelligence Feed Section */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#9B72CF]" />
              Intelligence Feed
            </p>
            <div className="space-y-1.5">
              {intelligenceItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: item.bgColor,
                    borderColor: item.color + '20',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: item.color }}>
                        {item.title}
                      </p>
                      <p className="text-xs text-[#888888] mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-[#1E1E1E] my-2" />

          {/* Notifications Section */}
          <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider px-1 mb-2">
            Recent
          </p>

          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors cursor-pointer',
                notif.read
                  ? 'bg-[#0A0A0A] border-[#1E1E1E] hover:border-[#2A2A2A]'
                  : 'bg-[#0A0A0A] border-[rgba(245,166,35,0.2)] hover:border-[rgba(245,166,35,0.4)]'
              )}
            >
              <div className="flex items-start gap-2">
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-[#F5A623] mt-1.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#E8E8E8]">{notif.title}</p>
                    {notif.read && (
                      <Check className="w-3 h-3 text-[#444444] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#888888] mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-[#555555] mt-1">{notif.time}</p>
                </div>
              </div>
            </button>
          ))}

          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
