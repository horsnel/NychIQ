'use client';

import React, { useState, useMemo } from 'react';
import { X, Bell, Check, CheckCheck, AlertTriangle, Crown, TrendingUp, Coins, Sparkles, Activity, Zap, ShieldAlert, ShieldCheck, Eye, Heart, ChevronRight } from 'lucide-react';
import { useNychIQStore, PLAN_TOKENS, type Notification as StoreNotification } from '@/lib/store';
import { cn } from '@/lib/utils';
import { playNotification, playClick } from '@/lib/sounds';

interface LocalNotification {
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

/* ── Channel Health Status ── */
type HealthStatus = 'danger' | 'viral' | 'info' | 'healthy';

interface ChannelHealthAlert {
  id: string;
  status: HealthStatus;
  title: string;
  message: string;
  metric: string;
  metricValue: string;
  navigateTo: string;
  time: string;
}

const INITIAL_NOTIFS: LocalNotification[] = [
  { id: '1', title: 'Welcome to NychIQ', message: 'Your trial account is ready with 100 tokens. More tokens unlock over 3 days!', time: 'Just now', read: false, type: 'info', navigateTo: 'dashboard' },
  { id: '2', title: 'Trending Alert', message: 'Your niche "Tech Reviews" has 3 viral videos today.', time: '2h ago', read: false, type: 'success', navigateTo: 'trending' },
  { id: '3', title: 'Token Reset Info', message: 'Free tokens reset automatically on the 31st of every month.', time: '1d ago', read: true, type: 'warning', navigateTo: 'usage' },
  { id: '4', title: 'Viral Score Updated', message: 'Channel viral score has been recalculated for your tracked niches.', time: '3h ago', read: false, type: 'system', navigateTo: 'dashboard' },
];

/* ── Generate channel health alerts based on time-based simulation ── */
function generateHealthAlerts(): ChannelHealthAlert[] {
  const alerts: ChannelHealthAlert[] = [];
  const hour = new Date().getHours();

  // Danger alert — simulated based on channel health metrics
  const healthScore = Math.floor(Math.random() * 30) + 55; // 55-85
  if (healthScore < 70) {
    alerts.push({
      id: 'health-danger',
      status: 'danger',
      title: 'Channel Health Alert',
      message: 'Your channel health score dropped below 70. Audience retention is declining and upload consistency is flagged.',
      metric: 'Health Score',
      metricValue: `${healthScore}/100`,
      navigateTo: 'audit',
      time: '5m ago',
    });
  }

  // Viral alert — simulated
  if (hour >= 9 && hour <= 21) {
    alerts.push({
      id: 'health-viral',
      status: 'viral',
      title: 'Video Going Viral!',
      message: 'One of your tracked competitor videos is gaining rapid traction. This could be an opportunity to create response content.',
      metric: 'Growth Rate',
      metricValue: '+342%',
      navigateTo: 'competitor',
      time: '12m ago',
    });
  }

  // Info alert — general channel update
  alerts.push({
    id: 'health-info',
    status: 'info',
    title: 'New Subscriber Milestone',
    message: 'Your channel is approaching the next subscriber milestone. Plan a community post to engage your audience.',
    metric: 'Subscribers',
    metricValue: '2.4K',
    navigateTo: 'dashboard',
    time: '1h ago',
  });

  // Healthy status
  if (healthScore >= 70) {
    alerts.push({
      id: 'health-healthy',
      status: 'healthy',
      title: 'Channel Health: Good',
      message: 'Your channel metrics are stable. Keep up the consistent upload schedule and maintain your SEO optimization.',
      metric: 'Overall',
      metricValue: `${healthScore}/100`,
      navigateTo: 'pulsecheck',
      time: '30m ago',
    });
  }

  return alerts;
}

/* ── Health Status Glow Config ── */
function healthGlowConfig(status: HealthStatus) {
  switch (status) {
    case 'danger':
      return {
        glowColor: 'rgba(239,68,68,0.4)',
        borderColor: 'rgba(239,68,68,0.3)',
        bgColor: 'rgba(239,68,68,0.06)',
        textColor: '#EF4444',
        icon: <ShieldAlert className="w-4 h-4" />,
        badge: 'DANGER',
        badgeColor: '#EF4444',
        badgeBg: 'rgba(239,68,68,0.15)',
        ringClass: 'health-glow-red',
      };
    case 'viral':
      return {
        glowColor: 'rgba(16,185,129,0.4)',
        borderColor: 'rgba(16,185,129,0.3)',
        bgColor: 'rgba(16,185,129,0.06)',
        textColor: '#10B981',
        icon: <Zap className="w-4 h-4" />,
        badge: 'VIRAL',
        badgeColor: '#10B981',
        badgeBg: 'rgba(16,185,129,0.15)',
        ringClass: 'health-glow-green',
      };
    case 'info':
      return {
        glowColor: 'rgba(255,255,255,0.15)',
        borderColor: 'rgba(255,255,255,0.1)',
        bgColor: 'rgba(255,255,255,0.03)',
        textColor: '#FFFFFF',
        icon: <Eye className="w-4 h-4" />,
        badge: 'NEW',
        badgeColor: '#FFFFFF',
        badgeBg: 'rgba(255,255,255,0.08)',
        ringClass: 'health-glow-white',
      };
    case 'healthy':
      return {
        glowColor: 'rgba(59,130,246,0.3)',
        borderColor: 'rgba(59,130,246,0.2)',
        bgColor: 'rgba(59,130,246,0.05)',
        textColor: '#3B82F6',
        icon: <ShieldCheck className="w-4 h-4" />,
        badge: 'OK',
        badgeColor: '#3B82F6',
        badgeBg: 'rgba(59,130,246,0.12)',
        ringClass: 'health-glow-blue',
      };
  }
}

function useIntelligenceFeed(): IntelligenceItem[] {
  const { tokenBalance, userPlan, region, totalTokensSpent } = useNychIQStore();

  return useMemo(() => {
    const items: IntelligenceItem[] = [];

    // Token balance warning
    const maxTokens = PLAN_TOKENS[userPlan];
    const threshold = Math.floor(maxTokens * 0.2);

    if (tokenBalance <= 0) {
      items.push({
        id: 'intel-tokens',
        icon: <AlertTriangle className="w-4 h-4 text-[#EF4444]" />,
        title: 'Tokens Exhausted',
        message: 'You have no tokens remaining. Upgrade your plan or wait for the monthly reset on the 31st.',
        color: '#EF4444',
        bgColor: 'rgba(239,68,68,0.08)',
      });
    } else if (tokenBalance < threshold) {
      items.push({
        id: 'intel-tokens',
        icon: <Coins className="w-4 h-4 text-[#EF4444]" />,
        title: 'Low Token Balance',
        message: `You only have ${tokenBalance} token${tokenBalance !== 1 ? 's' : ''} left (${Math.round((tokenBalance / maxTokens) * 100)}%). Consider upgrading.`,
        color: '#EF4444',
        bgColor: 'rgba(239,68,68,0.08)',
      });
    } else if (tokenBalance < Math.floor(maxTokens * 0.4)) {
      items.push({
        id: 'intel-tokens',
        icon: <AlertTriangle className="w-4 h-4 text-[#FDBA2D]" />,
        title: 'Token Balance Warning',
        message: `You have ${tokenBalance} tokens remaining. Consider upgrading for unlimited access.`,
        color: '#FDBA2D',
        bgColor: 'rgba(253,186,45,0.08)',
      });
    }

    // Plan upgrade suggestion
    if (userPlan === 'trial') {
      items.push({
        id: 'intel-plan',
        icon: <Crown className="w-4 h-4 text-[#FDBA2D]" />,
        title: 'Upgrade Your Plan',
        message: 'Unlock 40+ tools, higher limits, and priority AI with a Pro plan.',
        color: '#FDBA2D',
        bgColor: 'rgba(253,186,45,0.08)',
      });
    }

    // Total spent insight
    if (totalTokensSpent > 0) {
      items.push({
        id: 'intel-spent',
        icon: <TrendingUp className="w-4 h-4 text-[#3B82F6]" />,
        title: 'Usage Insight',
        message: `You've spent ${totalTokensSpent} tokens this cycle. Check Token Usage for a breakdown.`,
        color: '#3B82F6',
        bgColor: 'rgba(59,130,246,0.08)',
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
      icon: <TrendingUp className="w-4 h-4 text-[#10B981]" />,
      title: `${regionName} Trending`,
      message: `Trending content is surging in ${regionName}. Check the Trending tool for the latest viral videos.`,
      color: '#10B981',
      bgColor: 'rgba(16,185,129,0.08)',
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
      icon: <Sparkles className="w-4 h-4 text-[#8B5CF6]" />,
      title: greeting,
      message: tip,
      color: '#8B5CF6',
      bgColor: 'rgba(139,92,246,0.08)',
    });

    return items;
  }, [tokenBalance, userPlan, region, totalTokensSpent]);
}

export function NotificationDrawer() {
  const {
    notifDrawerOpen,
    setNotifDrawerOpen,
    setActiveTool,
    setPage,
    channelHealth,
    channelHealthStatus,
    notifications: storeNotifications,
    markNotificationRead,
    clearNotifications,
  } = useNychIQStore();
  const [localNotifs, setLocalNotifs] = useState<LocalNotification[]>(INITIAL_NOTIFS);
  const intelligenceItems = useIntelligenceFeed();
  const healthAlerts = useMemo(() => generateHealthAlerts(), []);

  // Derive channel health icon config from store status
  const healthIconConfig = useMemo(() => {
    switch (channelHealthStatus) {
      case 'danger':
        return { icon: <ShieldAlert className="w-4 h-4" />, color: '#EF4444', label: 'Danger' };
      case 'good':
        return { icon: <ShieldCheck className="w-4 h-4" />, color: '#10B981', label: 'Good' };
      case 'neutral':
        return { icon: <Activity className="w-4 h-4" />, color: '#FFFFFF', label: 'Fair' };
    }
  }, [channelHealthStatus]);

  // Total unread = store notifications + local + health alerts (danger/viral)
  const unreadCount = storeNotifications.filter((n) => !n.read).length
    + localNotifs.filter((n) => !n.read).length
    + healthAlerts.filter((a) => a.status === 'danger' || a.status === 'viral').length;

  const handleMarkAllRead = () => {
    playClick();
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    storeNotifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const handleNotificationClick = (notif: LocalNotification) => {
    playClick();
    setLocalNotifs((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setActiveTool(notif.navigateTo);
    setPage('app');
    setNotifDrawerOpen(false);
  };

  const handleStoreNotifClick = (notif: StoreNotification) => {
    playClick();
    markNotificationRead(notif.id);
    if (notif.link) {
      setActiveTool(notif.link);
      setPage('app');
    }
    setNotifDrawerOpen(false);
  };

  const handleClearAll = () => {
    playClick();
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    clearNotifications();
  };

  const handleHealthClick = (alert: ChannelHealthAlert) => {
    playClick();
    setActiveTool(alert.navigateTo);
    setPage('app');
    setNotifDrawerOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {notifDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { playClick(); setNotifDrawerOpen(false); }} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#141414] border-l border-[#222] z-50 transition-transform duration-300 ${
          notifDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E1E]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#FDBA2D]" />
            <h2 className="text-base font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#FDBA2D] text-black animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Mark all read */}
            {unreadCount > 0 && (
              <>
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[#A3A3A3] hover:text-[#FDBA2D] hover:bg-[rgba(253,186,45,0.1)] transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-[#A3A3A3] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                  title="Clear all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={() => { playClick(); setNotifDrawerOpen(false); }}
              className="p-1 rounded-md text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto h-[calc(100%-57px)] p-3 space-y-2">
          {/* Channel Health Score Banner */}
          <div className="mb-3 p-3 rounded-lg border border-[#222]"
            style={{
              backgroundColor: channelHealthStatus === 'danger' ? 'rgba(239,68,68,0.06)' : channelHealthStatus === 'good' ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
              borderColor: channelHealthStatus === 'danger' ? 'rgba(239,68,68,0.2)' : channelHealthStatus === 'good' ? 'rgba(16,185,129,0.2)' : '#222',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: channelHealthStatus === 'danger' ? 'rgba(239,68,68,0.15)' : channelHealthStatus === 'good' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${channelHealthStatus === 'danger' ? 'rgba(239,68,68,0.3)' : channelHealthStatus === 'good' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: channelHealthStatus === 'danger' ? '0 0 8px rgba(239,68,68,0.4)' : channelHealthStatus === 'good' ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
                  }}
                >
                  <span style={{ color: healthIconConfig.color }}>{healthIconConfig.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: healthIconConfig.color }}>
                    Channel Health: {healthIconConfig.label}
                  </p>
                  <p className="text-[10px] text-[#666666]">Score: {channelHealth}/100</p>
                </div>
              </div>
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1E1E1E" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={healthIconConfig.color} strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={`${(channelHealth / 100) * 97.4} 97.4`}
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: healthIconConfig.color }}>
                  {channelHealth}
                </span>
              </div>
            </div>
          </div>

          {/* Channel Health Alerts Section — with glow indicators */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
              <Activity className="w-3 h-3" style={{ color: healthIconConfig.color }} />
              Health Alerts
            </p>
            <div className="space-y-2">
              {healthAlerts.map((alert) => {
                const cfg = healthGlowConfig(alert.status);
                return (
                  <button
                    key={alert.id}
                    onClick={() => handleHealthClick(alert)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden',
                    )}
                    style={{
                      backgroundColor: cfg.bgColor,
                      borderColor: cfg.borderColor,
                      boxShadow: cfg.ringClass ? `0 0 12px ${cfg.glowColor}` : 'none',
                    }}
                  >
                    {/* Glow ring overlay for danger and viral */}
                    {(alert.status === 'danger' || alert.status === 'viral') && (
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
                        style={{
                          boxShadow: `inset 0 0 20px ${cfg.glowColor}, 0 0 15px ${cfg.glowColor}`,
                        }}
                      />
                    )}

                    <div className="relative flex items-start gap-2.5">
                      {/* Status icon with colored ring */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: cfg.bgColor,
                          border: `1.5px solid ${cfg.borderColor}`,
                          boxShadow: alert.status === 'danger'
                            ? '0 0 8px rgba(239,68,68,0.5)'
                            : alert.status === 'viral'
                            ? '0 0 8px rgba(16,185,129,0.5)'
                            : 'none',
                        }}
                      >
                        <span style={{ color: cfg.textColor }}>{cfg.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium" style={{ color: cfg.textColor }}>
                            {alert.title}
                          </p>
                          {/* Status badge */}
                          <span
                            className="px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider shrink-0"
                            style={{
                              color: cfg.badgeColor,
                              backgroundColor: cfg.badgeBg,
                            }}
                          >
                            {cfg.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#A3A3A3] mt-0.5 leading-relaxed line-clamp-2">
                          {alert.message}
                        </p>

                        {/* Metric display */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-[#666666]">{alert.metric}:</span>
                          <span className="text-[11px] font-bold" style={{ color: cfg.textColor }}>
                            {alert.metricValue}
                          </span>
                          <span className="text-[10px] text-[#555555] ml-auto">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Store Notifications — channel health, viral, saku, system */}
          {storeNotifications.length > 0 && (
            <>
              <div className="border-t border-[#1E1E1E] my-2" />
              <div className="mb-4">
                <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-[#FDBA2D]" />
                  Alerts & Tips
                </p>
                <div className="space-y-1.5">
                  {storeNotifications.map((notif) => {
                    const typeIcon = notif.type === 'channel_health' ? <Heart className="w-4 h-4" />
                      : notif.type === 'viral_alert' ? <Zap className="w-4 h-4" />
                      : notif.type === 'saku_tip' ? <Sparkles className="w-4 h-4" />
                      : <Activity className="w-4 h-4" />;

                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleStoreNotifClick(notif)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden',
                          notif.read
                            ? 'bg-[#0D0D0D] border-[#1E1E1E] hover:border-[#2A2A2A]'
                            : 'hover:border-[#333333]',
                        )}
                        style={{
                          backgroundColor: notif.read ? '#0D0D0D' : `${notif.color}08`,
                          borderColor: notif.read ? '#1E1E1E' : `${notif.color}30`,
                          boxShadow: !notif.read ? `0 0 8px ${notif.color}15` : 'none',
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0" style={{ color: notif.color }}>
                            {typeIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium" style={{ color: notif.color }}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: notif.color }} />
                              )}
                            </div>
                            <p className="text-xs text-[#A3A3A3] mt-0.5 leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-[#555555] mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {notif.link && (
                            <span className="text-[10px] text-[#555555] shrink-0 mt-1">
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Separator */}
          <div className="border-t border-[#1E1E1E] my-2" />

          {/* Intelligence Feed Section */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
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
                      <p className="text-xs text-[#A3A3A3] mt-0.5 leading-relaxed">
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

          {localNotifs.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors cursor-pointer',
                notif.read
                  ? 'bg-[#0D0D0D] border-[#1E1E1E] hover:border-[#2A2A2A]'
                  : 'bg-[#0D0D0D] border-[rgba(253,186,45,0.2)] hover:border-[rgba(253,186,45,0.4)]'
              )}
            >
              <div className="flex items-start gap-2">
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-[#FDBA2D] mt-1.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#FFFFFF]">{notif.title}</p>
                    {notif.read && (
                      <Check className="w-3 h-3 text-[#444444] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-[#555555] mt-1">{notif.time}</p>
                </div>
              </div>
            </button>
          ))}

          {localNotifs.length === 0 && storeNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-[#666666]">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
