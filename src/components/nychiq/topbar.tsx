'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Command, Search, ChevronDown, RefreshCw, User, Settings, Coins, LogOut, MapPin, Sliders, X } from 'lucide-react';
import { useNychIQStore, TOOL_META, TOKEN_COSTS, SIDEBAR_SECTIONS } from '@/lib/store';
import { TokenPill } from './token-pill';
import { cn } from '@/lib/utils';
import { useGeolocation } from '@/hooks/use-geolocation';
import { playClick, playNotification } from '@/lib/sounds';

const REGIONS = [
  { code: 'NG', label: 'Nigeria' },
  { code: 'GH', label: 'Ghana' },
  { code: 'KE', label: 'Kenya' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'TZ', label: 'Tanzania' },
  { code: 'EG', label: 'Egypt' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IN', label: 'India' },
  { code: 'CA', label: 'Canada' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'BR', label: 'Brazil' },
  { code: 'AU', label: 'Australia' },
  { code: 'JP', label: 'Japan' },
];

// Pages where the refresh button should be visible
const REFRESH_PAGES = ['dashboard', 'trending', 'shorts', 'rankings', 'viral'];

export function Topbar() {
  const {
    activeTool,
    userName,
    toggleSidebar,
    setNotifDrawerOpen,
    setCommandBarOpen,
    setActiveTool,
    setPage,
    logout,
    region,
    setRegion,
    setDetectedRegion,
    channelHealthStatus,
    notifications,
  } = useNychIQStore();

  // Geolocation hook
  const geo = useGeolocation();

  // Auto-set region from detected location (only if still on default 'US')
  const regionRef = useRef(region);
  useEffect(() => { regionRef.current = region; }, [region]);
  const geoRef = useRef(geo);
  useEffect(() => { geoRef.current = geo; }, [geo]);

  useEffect(() => {
    const detected = geoRef.current.detectedRegion;
    if (detected) {
      setDetectedRegion(detected);
      if (regionRef.current === 'US') {
        setRegion(detected);
      }
    }
  }, [geo.detectedRegion, geo.countryName, setDetectedRegion, setRegion]);

  // Country selector state
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Avatar dropdown state
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Channel profile from localStorage (set during onboarding audit)
  const [channelProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('nychiq_channel_profile');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const toolMeta = TOOL_META[activeTool];
  const pageTitle = toolMeta?.label ?? 'Dashboard';
  const tokenCost = TOKEN_COSTS[activeTool] ?? 0;

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Tapping the header search bar navigates to the feature search page
  const handleSearchBarClick = () => {
    setActiveTool('search');
    setPage('app');
  };

  const handleAvatarAction = (action: string) => {
    setShowAvatarMenu(false);
    switch (action) {
      case 'profile':
        setActiveTool('profile');
        setPage('app');
        break;
      case 'settings':
        setActiveTool('settings');
        setPage('app');
        break;
      case 'usage':
        setActiveTool('usage');
        setPage('app');
        break;
      case 'channel':
        setActiveTool('channel-assistant');
        setPage('app');
        break;
      case 'signout':
        logout();
        break;
    }
  };

  return (
    <>
    <header className="flex items-center gap-3 h-14 px-4 bg-[#0a0a0a] border-b border-[rgba(255,255,255,0.03)] sticky top-0 z-30">
      {/* Hamburger (mobile) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-1.5 rounded-md text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-[#FFFFFF] truncate">
        {pageTitle}
      </h1>

      {/* Token cost badge */}
      {tokenCost > 0 && (
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(253,186,45,0.1)] text-[#FDBA2D] border border-[rgba(255,255,255,0.03)]">
          {tokenCost} token{tokenCost > 1 ? 's' : ''}
        </span>
      )}

      {/* Pill Search Bar — feature search only, tap to navigate to search page */}
      <button
        onClick={handleSearchBarClick}
        className="hidden md:flex items-center ml-3 h-10 bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] rounded-full pl-4 pr-4 gap-2 hover:border-[rgba(255,255,255,0.03)] transition-colors w-[320px] cursor-pointer group"
      >
        <Search className="w-4 h-4 text-[#666666] shrink-0 group-hover:text-[#666666] transition-colors" />
        <span className="flex-1 text-sm text-[#666666] text-left group-hover:text-[#666666] transition-colors">
          Search tools &amp; features...
        </span>
      </button>

      {/* Detected location indicator — hidden on mobile */}
      {geo.detectedRegion && (
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md border border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.03)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#888888] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#888888]" />
          </span>
          <MapPin className="w-3 h-3 text-[#888888]" />
          <span className="text-[11px] font-medium text-[#888888]">
            {geo.countryName || geo.detectedRegion}
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Refresh Button — conditionally shown */}
        {REFRESH_PAGES.includes(activeTool) && (
          <button
            onClick={() => window.location.reload()}
            className="hidden md:flex p-2 rounded-full text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
            aria-label="Refresh"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Country Selector — hidden on mobile */}
        <div ref={countryRef} className="hidden md:block relative">
          <button
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[rgba(255,255,255,0.03)] text-[#a0a0a0] text-xs hover:border-[rgba(255,255,255,0.03)] hover:text-[#FFFFFF] transition-colors"
          >
            <span className="w-4 h-4 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[9px] font-bold text-[#FDBA2D]">
              {region.charAt(0)}
            </span>
            <span className="font-medium">{region}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showCountryDropdown && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => {
                    setRegion(r.code);
                    setShowCountryDropdown(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#1A1A1A] transition-colors',
                    region === r.code ? 'text-[#FDBA2D]' : 'text-[#a0a0a0]'
                  )}
                >
                  <span className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-[#FDBA2D] shrink-0">
                    {r.code.charAt(0)}
                  </span>
                  <span>{r.code} — {r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile search icon — navigates to search page */}
        <button
          onClick={handleSearchBarClick}
          className="md:hidden p-2 rounded-full hover:bg-[#1A1A1A] transition-colors"
          aria-label="Search tools"
          title="Search tools"
        >
          <Search className="w-4 h-4 text-[#a0a0a0]" />
        </button>

        {/* Command bar trigger */}
        <button
          onClick={() => setCommandBarOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.03)] text-[#666666] text-xs hover:border-[rgba(255,255,255,0.03)] hover:text-[#a0a0a0] transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>Search</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-[#1A1A1A] border border-[rgba(255,255,255,0.03)]">⌘K</kbd>
        </button>

        {/* Notification bell — channel health glow */}
        <button
          onClick={() => { playNotification(); setNotifDrawerOpen(true); }}
          className="relative p-2 rounded-full hover:bg-[#1A1A1A] transition-colors"
          aria-label="Notifications"
        >
          {/* Glow ring based on channel health */}
          <span className={cn(
            'absolute inset-0 rounded-full',
            channelHealthStatus === 'danger' && 'channel-ring-red',
            channelHealthStatus === 'good' && 'channel-ring-green',
            channelHealthStatus === 'neutral' && 'channel-ring-white',
          )} />
          <Bell className={cn(
            'w-4 h-4 relative z-10 transition-colors',
            channelHealthStatus === 'danger' && 'text-[#888888]',
            channelHealthStatus === 'good' && 'text-[#888888]',
            channelHealthStatus === 'neutral' && 'text-[#a0a0a0]',
          )} />
          {/* Unread dot */}
          {notifications.some((n) => !n.read) && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#888888] z-20" />
          )}
        </button>

        {/* Token pill */}
        <TokenPill />

        {/* Channel avatar with multicolor glowing rings */}
        {channelProfile ? (
          <button
            onClick={() => handleAvatarAction('channel')}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
            title={channelProfile.name}
            style={{ backgroundColor: channelProfile.avatarColor || '#FDBA2D', color: '#0a0a0a' }}
          >
            {/* Animated ring layer 1 — amber */}
            <span className="absolute inset-[-3px] rounded-full channel-ring-amber" />
            {/* Animated ring layer 2 — purple */}
            <span className="absolute inset-[-6px] rounded-full channel-ring-purple" />
            {/* Animated ring layer 3 — green */}
            <span className="absolute inset-[-9px] rounded-full channel-ring-green" />
            {/* Animated ring layer 4 — blue */}
            <span className="absolute inset-[-12px] rounded-full channel-ring-blue opacity-50" />
            {/* Avatar content */}
            <span className="relative z-10">{channelProfile.name.charAt(0).toUpperCase()}</span>
          </button>
        ) : (
          <button
            onClick={() => handleAvatarAction('channel')}
            className="relative p-1.5 rounded-full hover:bg-[#1A1A1A] transition-colors"
            aria-label="Channel Assistant"
            title="Channel Assistant"
          >
            <span className="absolute inset-[-2px] rounded-full channel-ring-amber" />
            <span className="absolute inset-[-5px] rounded-full channel-ring-purple opacity-50" />
            <Sliders className="w-4 h-4 text-[#a0a0a0] relative z-10" />
          </button>
        )}

        {/* User avatar dropdown */}
        <div ref={avatarRef} className="relative">
          <button
            onClick={() => setShowAvatarMenu(!showAvatarMenu)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FDBA2D] to-[#C69320] flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
            title={userName || 'User'}
            style={{ color: 'black' }}
          >
            {userName ? userName[0].toUpperCase() : 'U'}
          </button>
          {showAvatarMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] rounded-lg shadow-xl z-50 py-1">
              {channelProfile && (
                <button
                  onClick={() => handleAvatarAction('channel')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>My Channel</span>
                </button>
              )}
              <button
                onClick={() => handleAvatarAction('profile')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => handleAvatarAction('settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => handleAvatarAction('usage')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Token Usage</span>
              </button>
              <div className="my-1 border-t border-[rgba(255,255,255,0.03)]" />
              <button
                onClick={() => handleAvatarAction('signout')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#888888] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
