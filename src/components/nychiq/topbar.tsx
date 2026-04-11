'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Command, Search, ChevronDown, RefreshCw, User, Settings, Coins, LogOut, MapPin, Sliders, X } from 'lucide-react';
import { useNychIQStore, TOOL_META, TOKEN_COSTS, SIDEBAR_SECTIONS } from '@/lib/store';
import { TokenPill } from './token-pill';
import { FeatureSearchOverlay } from './feature-search-overlay';
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

const FILTER_OPTIONS = ['All', 'Videos', 'Shorts', 'Channels'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

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
    searchFilter,
    setSearchFilter,
    setDetectedRegion,
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const searchFilterRef = useRef<HTMLDivElement>(null);

  // Country selector state
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Avatar dropdown state
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Feature search state
  const [featureSearchOpen, setFeatureSearchOpen] = useState(false);

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
      if (searchFilterRef.current && !searchFilterRef.current.contains(e.target as Node)) {
        setShowSearchFilter(false);
      }
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveTool('search');
      setPage('app');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
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
    <header className="flex items-center gap-3 h-14 px-4 bg-[#0D0D0D] border-b border-[#1E1E1E] sticky top-0 z-30">
      {/* Hamburger (mobile) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-1.5 rounded-md text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-[#E8E8E8] truncate">
        {pageTitle}
      </h1>

      {/* Token cost badge */}
      {tokenCost > 0 && (
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(253,186,45,0.1)] text-[#FDBA2D] border border-[rgba(253,186,45,0.2)]">
          {tokenCost} token{tokenCost > 1 ? 's' : ''}
        </span>
      )}

      {/* Search Bar — hidden on mobile */}
      <div className="hidden md:flex items-center ml-3">
        <div className="relative flex items-center">
          {/* Search input */}
          <div className="flex items-center h-8 bg-[#141414] border border-[#222222] rounded-l-lg px-3 gap-2 focus-within:border-[#FDBA2D]/50 transition-colors">
            <Search className="w-3.5 h-3.5 text-[#444444] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search videos, channels..."
              className="w-48 bg-transparent text-xs text-[#E8E8E8] placeholder-text-muted outline-none"
            />
            {/* Filter dropdown toggle */}
            <div ref={searchFilterRef} className="relative">
              <button
                onClick={() => setShowSearchFilter(!showSearchFilter)}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded text-[#FDBA2D] hover:bg-[rgba(253,186,45,0.1)] transition-colors"
              >
                {searchFilter}
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
              {showSearchFilter && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-[#141414] border border-[#222222] rounded-lg shadow-xl z-50 py-1">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSearchFilter(opt);
                        setShowSearchFilter(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-[#1A1A1A] transition-colors',
                        searchFilter === opt ? 'text-[#FDBA2D]' : 'text-[#888888]'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* GO button */}
          <button
            onClick={handleSearch}
            className="h-8 px-3 bg-[#FDBA2D] hover:bg-[#D9A013] text-black text-xs font-semibold rounded-r-lg transition-colors"
          >
            GO
          </button>
        </div>
      </div>

      {/* Filter Chips — hidden on mobile */}
      <div className="hidden lg:flex items-center gap-1.5 ml-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setSearchFilter(opt)}
            className={cn(
              'px-3 py-1 text-[11px] font-medium rounded-full border transition-colors',
              searchFilter === opt
                ? 'bg-[#FDBA2D] text-black border-[#FDBA2D]'
                : 'bg-transparent text-[#888888] border-[#222222] hover:border-[#333333] hover:text-[#E8E8E8]'
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Detected location indicator — hidden on mobile */}
      {geo.detectedRegion && (
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md border border-[#10B981]/20 bg-[rgba(16,185,129,0.06)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
          </span>
          <MapPin className="w-3 h-3 text-[#10B981]" />
          <span className="text-[11px] font-medium text-[#10B981]">
            {geo.countryName || geo.detectedRegion}
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Refresh Button — conditionally shown */}
        {REFRESH_PAGES.includes(activeTool) && (
          <button
            onClick={() => window.location.reload()}
            className="hidden md:flex p-2 rounded-full text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#222222] text-[#888888] text-xs hover:border-[#2A2A2A] hover:text-[#E8E8E8] transition-colors"
          >
            <span className="w-4 h-4 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[9px] font-bold text-[#FDBA2D]">
              {region.charAt(0)}
            </span>
            <span className="font-medium">{region}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showCountryDropdown && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-[#141414] border border-[#222222] rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => {
                    setRegion(r.code);
                    setShowCountryDropdown(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#1A1A1A] transition-colors',
                    region === r.code ? 'text-[#FDBA2D]' : 'text-[#888888]'
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

        {/* Command bar trigger */}
        <button
          onClick={() => setCommandBarOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#222222] text-[#444444] text-xs hover:border-[#2A2A2A] hover:text-[#888888] transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>Search</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-[#1A1A1A] border border-[#222222]">⌘K</kbd>
        </button>

        {/* Notification bell */}
        <button
          onClick={() => { playNotification(); setNotifDrawerOpen(true); }}
          className="relative p-2 rounded-md text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444]" />
        </button>

        {/* Token pill */}
        <TokenPill />

        {/* Search icon with glow */}
        <button
          onClick={() => setFeatureSearchOpen(true)}
          className="relative p-2 rounded-full hover:bg-[#1A1A1A] transition-colors group"
          aria-label="Feature Search"
          title="Search tools"
        >
          <span className="absolute inset-0 rounded-full channel-ring-amber" />
          <Search className="w-4 h-4 text-[#FDBA2D] relative z-10" />
        </button>

        {/* Channel avatar with multicolor glowing rings */}
        {channelProfile ? (
          <button
            onClick={() => handleAvatarAction('channel')}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
            title={channelProfile.name}
            style={{ backgroundColor: channelProfile.avatarColor || '#FDBA2D', color: '#0D0D0D' }}
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
            <Sliders className="w-4 h-4 text-[#888888] relative z-10" />
          </button>
        )}

        {/* User avatar dropdown */}
        <div ref={avatarRef} className="relative">
          <button
            onClick={() => setShowAvatarMenu(!showAvatarMenu)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FDBA2D] to-[#FDE68A] flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity"
            title={userName || 'User'}
            style={{ color: 'black' }}
          >
            {userName ? userName[0].toUpperCase() : 'U'}
          </button>
          {showAvatarMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#141414] border border-[#222222] rounded-lg shadow-xl z-50 py-1">
              {channelProfile && (
                <button
                  onClick={() => handleAvatarAction('channel')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>My Channel</span>
                </button>
              )}
              <button
                onClick={() => handleAvatarAction('profile')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => handleAvatarAction('settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => handleAvatarAction('usage')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Token Usage</span>
              </button>
              <div className="my-1 border-t border-[#1E1E1E]" />
              <button
                onClick={() => handleAvatarAction('signout')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    {/* Feature Search Overlay */}
    {featureSearchOpen && (
      <FeatureSearchOverlay onClose={() => setFeatureSearchOpen(false)} />
    )}
    </>
  );
}
