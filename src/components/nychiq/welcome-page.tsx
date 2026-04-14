'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Menu, X, ArrowRight, ChevronRight, Zap, BarChart3, Search,
  Shield, Users, Star, BrainCircuit, Eye, DollarSign, Key, FileText,
  Lightbulb, Clock, ClipboardCheck, Activity, Anchor, Cpu, Radar,
  Stethoscope, Bot, TrendingUp, Sparkles, Check, Globe, Lock, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNychIQStore } from '@/lib/store';

/* ── Category colors for semantic visual scanning ── */
type CatColor = 'gold' | 'emerald' | 'coral' | 'indigo';
const CAT: Record<CatColor, { hex: string; rgba: (a: number) => string }> = {
  gold:    { hex: '#F6A828', rgba: (a) => `rgba(246,168,40,${a})` },
  emerald: { hex: '#10B981', rgba: (a) => `rgba(16,185,129,${a})` },
  coral:   { hex: '#F87171', rgba: (a) => `rgba(248,113,113,${a})` },
  indigo:  { hex: '#818CF8', rgba: (a) => `rgba(129,140,248,${a})` },
};

/* ── Feature definitions (17 total) ── */
const FEATURES = [
  { num: '01', label: 'DASHBOARD', icon: BarChart3, name: 'Command Center', desc: 'Your complete YouTube analytics hub with real-time stats, activity feed, and quick actions.', tag: 'CORE', cat: 'gold' as CatColor },
  { num: '02', label: 'TRENDING', icon: TrendingUp, name: 'Live Trend Radar', desc: 'Real-time trending videos across 9 regions with viral scoring and category filtering.', tag: 'LIVE DATA', cat: 'emerald' as CatColor },
  { num: '03', label: 'SEARCH', icon: Search, name: 'Universal Search', desc: 'Search millions of videos, shorts, and channels with AI-enhanced result ranking.', tag: 'CORE', cat: 'gold' as CatColor },
  { num: '04', label: 'VIRAL PREDICTOR', icon: Zap, name: 'Viral Score Engine', desc: 'AI-powered viral prediction that analyzes titles, thumbnails, timing, and engagement patterns.', tag: 'AI POWERED', cat: 'gold' as CatColor },
  { num: '05', label: 'NICHE SPY', icon: Eye, name: 'Niche Discovery', desc: 'Uncover untapped niches with high growth potential and low competition scores.', tag: 'AI POWERED', cat: 'gold' as CatColor },
  { num: '06', label: 'ALGORITHM', icon: BrainCircuit, name: 'Algorithm Intel', desc: 'Understand how the YouTube algorithm ranks content in your specific niche.', tag: 'AI POWERED', cat: 'indigo' as CatColor },
  { num: '07', label: 'SEO OPTIMIZER', icon: Key, name: 'SEO Toolkit', desc: 'Optimize titles, descriptions, tags, and metadata for maximum discoverability.', tag: 'AI POWERED', cat: 'indigo' as CatColor },
  { num: '08', label: 'HOOK GENERATOR', icon: Anchor, name: 'Hook Creator', desc: 'Generate attention-grabbing video hooks and intros using AI trained on viral content.', tag: 'STRATEGY', cat: 'coral' as CatColor },
  { num: '09', label: 'KEYWORD EXPLORER', icon: Search, name: 'Keyword Research', desc: 'Find high-volume, low-competition keywords specific to YouTube search.', tag: 'AI POWERED', cat: 'indigo' as CatColor },
  { num: '10', label: 'SCRIPT WRITER', icon: FileText, name: 'AI Script Studio', desc: 'Generate complete video scripts with structure, hooks, CTAs, and timing markers.', tag: 'STRATEGY', cat: 'coral' as CatColor },
  { num: '11', label: 'VIDEO IDEAS', icon: Lightbulb, name: 'Idea Generator', desc: 'Get unlimited content ideas based on trending topics, your niche, and audience data.', tag: 'STRATEGY', cat: 'coral' as CatColor },
  { num: '12', label: 'CPM ESTIMATOR', icon: DollarSign, name: 'Revenue Forecaster', desc: 'Estimate CPM rates and projected earnings across niches and regions.', tag: 'LIVE DATA', cat: 'emerald' as CatColor },
  { num: '13', label: 'CHANNEL AUDIT', icon: ClipboardCheck, name: 'Health Check', desc: 'Comprehensive channel audit with SEO, branding, content, and engagement scoring.', tag: 'STRATEGY', cat: 'coral' as CatColor },
  { num: '14', label: 'COMPETITOR', icon: Users, name: 'Track & Analyze', desc: 'Monitor competitor channels, content strategies, and growth trajectories.', tag: 'LIVE DATA', cat: 'emerald' as CatColor },
  { num: '15', label: 'OUTLIER SCOUT', icon: Radar, name: 'Outlier Detection', desc: 'Find channels that are about to break out based on abnormal growth signals.', tag: 'LIVE DATA', cat: 'emerald' as CatColor },
  { num: '16', label: 'SAKU AI', icon: Bot, name: 'AI Assistant', desc: 'Your personal YouTube expert — ask anything about strategy, trends, or growth.', tag: 'AI POWERED', cat: 'indigo' as CatColor },
  { num: '17', label: 'AUTOMATION', icon: Cpu, name: 'Auto Tasks', desc: 'Set up automated monitoring, alerts, and reporting for your channels.', tag: 'GROWTH', cat: 'emerald' as CatColor },
];

/* ── Pricing plans ── */
const PLANS = [
  { tier: 'Starter', price: '₦15K', period: '/ month', features: ['50 daily tokens', '5 core tools', 'Basic analytics', 'Email support', '1 channel tracked'], highlight: false },
  { tier: 'Pro', price: '₦35K', period: '/ month', features: ['3,500 tokens/month', '17 intelligence modules', 'Advanced analytics', 'Priority support', '5 channels tracked', 'API access'], highlight: true, badge: 'MOST POPULAR' },
  { tier: 'Elite', price: '₦70K', period: '/ month', features: ['10,000 daily tokens', 'Full tool suite', 'Enterprise analytics', 'Dedicated support', '25 channels tracked', 'White-label reports'], highlight: false },
  { tier: 'Agency', price: '₦150K', period: '/ month', features: ['50,000 daily tokens', 'Everything in Elite', 'Agency dashboard', 'Team management', 'Unlimited channels', 'Custom integrations'], highlight: false },
];

/* ── Terminal typing animation ── */
const TERMINAL_LINES = [
  { text: '> SCANNING 12 TRENDING VIDEOS...', color: '#a0a0a0' },
  { text: '> ANALYZING 2,400+ CHANNELS...', color: '#a0a0a0' },
  { text: '> VIRAL SCORE: 94/99 ⚡', color: '#F6A828' },
  { text: '> AI ANALYSIS READY', color: '#888888' },
];

function TerminalLine({ text, color, delay }: { text: string; color: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState('');

  useEffect(() => {
    const timer1 = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer1);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setTextVisible(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [visible, text]);

  if (!visible) return null;
  return (
    <div className="font-terminal text-[11px] leading-relaxed" style={{ color }}>
      <span className="text-[#F6A828] mr-1">▸</span>
      {textVisible}
      {textVisible.length < text.length && (
        <span className="inline-block w-[6px] h-[12px] bg-[#F6A828] ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
}

/* ── Dashboard mockup for hero right column ── */
function DashboardTerminal() {
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 8 + 2;
      });
    }, 300);
    const timeout = setTimeout(() => clearInterval(interval), 4000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="absolute -inset-6 rounded-2xl" style={{ boxShadow: '0 0 50px rgba(246, 168, 40, 0.15), 0 0 100px rgba(246, 168, 40, 0.05)' }} />

      {/* Terminal card */}
      <div className="relative bg-[#141414] rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/60">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F6A828]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#0D0D0D] rounded-md px-3 py-1">
            <Globe className="w-3 h-3 text-[#444]" />
            <span className="text-[10px] text-[#666] font-terminal">nychiq.com/dashboard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span className="text-[10px] text-[#F6A828] font-terminal font-semibold tracking-wide">LIVE</span>
          </div>
        </div>

        {/* Scan progress bar */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-[#888] font-terminal uppercase tracking-widest">Scanning</span>
            <span className="text-[9px] text-[#F6A828] font-terminal">{Math.min(100, Math.round(scanProgress))}%</span>
          </div>
          <div className="w-full h-[2px] bg-[#0D0D0D] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F6A828] to-[#FFB340] transition-all duration-300"
              style={{ width: `${Math.min(100, scanProgress)}%`, boxShadow: '0 0 8px rgba(246, 168, 40, 0.4)' }}
            />
          </div>
        </div>

        {/* Terminal lines */}
        <div className="px-5 py-3 space-y-2">
          {TERMINAL_LINES.map((line, i) => (
            <TerminalLine key={i} text={line.text} color={line.color} delay={600 + i * 1000} />
          ))}
        </div>

        {/* Viral Score highlight */}
        <div className="mx-5 mb-4 p-3 rounded-lg bg-[rgba(246,168,40,0.06)] border border-[rgba(246,168,40,0.15)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#F6A828]" />
              <span className="text-[9px] text-[#888] font-terminal uppercase tracking-widest">Viral Score</span>
            </div>
            <span className="stat-number text-2xl text-[#F6A828]" style={{ textShadow: '0 0 15px rgba(246, 168, 40, 0.5)' }}>94</span>
          </div>
          <div className="mt-2 w-full h-[3px] bg-[#0D0D0D] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#F6A828]" style={{ width: '94%', boxShadow: '0 0 6px rgba(246, 168, 40, 0.3)' }} />
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-4 border-t border-white/[0.05]">
          {[
            { label: 'Trending', value: '142' },
            { label: 'Top Score', value: '94' },
            { label: 'CPM', value: '$22.40' },
            { label: 'Engines', value: '13' },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-2.5 text-center border-r border-white/[0.05] last:border-r-0">
              <div className="stat-number text-[11px] font-bold text-[#F6A828]" style={{ textShadow: '0 0 8px rgba(246, 168, 40, 0.3)' }}>{stat.value}</div>
              <div className="text-[8px] text-[#555] font-terminal mt-0.5 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WelcomePage() {
  const { setPage, isLoggedIn } = useNychIQStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn) setPage('app');
  }, [isLoggedIn, setPage]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute inset-0 bg-[#0D0D0D]" />
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[rgba(246,168,40,0.025)] blur-[120px] pointer-events-none" />
      <div className="absolute top-[60%] right-[-200px] w-[500px] h-[500px] rounded-full bg-[rgba(246,168,40,0.015)] blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        {/* ═══ NAVIGATION BAR ═══ */}
        <nav
          className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-white/[0.05]'
              : 'bg-transparent border-b border-transparent'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <button onClick={() => setPage('welcome')} className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-[5px] bg-[#F6A828] flex items-center justify-center shadow-lg shadow-[rgba(246,168,40,0.15)] group-hover:shadow-[rgba(246,168,40,0.25)] transition-shadow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M10 6L18 12L10 18V6Z" fill="white"/>
                    <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
                  </svg>
                </div>
                <span className="font-display-tight text-lg font-black tracking-[2px] uppercase">NY<span className="text-[#F6A828]">CHIQ</span></span>
              </button>

              {/* Center links */}
              <div className="hidden md:flex items-center gap-1">
                {['Features', 'Pricing', 'Legal'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (item === 'Legal') setPage('privacy');
                      else document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 text-[13px] text-[#888888] hover:text-[#FFFFFF] transition-colors rounded-lg hover:bg-white/[0.03]"
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Right buttons */}
              <div className="hidden md:flex items-center gap-3">
                <Button variant="ghost" className="text-[#888888] hover:text-[#FFFFFF] text-sm" onClick={() => setPage('login')}>Sign In</Button>
                <Button className="bg-[#F6A828] text-black hover:bg-[#FFB340] text-sm font-semibold shadow-lg shadow-[rgba(246,168,40,0.15)] hover:shadow-[rgba(246,168,40,0.3)] transition-all" onClick={() => setPage('login')}>
                  Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              {/* Mobile hamburger */}
              <button className="md:hidden p-2 text-[#888888] hover:text-[#FFFFFF]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#141414]/95 backdrop-blur-xl border-t border-white/[0.05] animate-fade-in-up">
              <div className="px-4 py-4 space-y-1">
                {['Features', 'Pricing', 'Legal', 'Sign In'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (item === 'Legal') setPage('privacy');
                      else if (item === 'Sign In') setPage('login');
                      else document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-sm text-[#888888] hover:text-[#FFFFFF] hover:bg-white/[0.03] rounded-lg"
                  >
                    {item}
                  </button>
                ))}
                <div className="pt-3 border-t border-white/[0.05]">
                  <Button className="w-full bg-[#F6A828] text-black hover:bg-[#FFB340] font-semibold" onClick={() => { setPage('login'); setMobileMenuOpen(false); }}>
                    Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* ═══ HERO SECTION — Split 65/35 ═══ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left column — 65% */}
            <div className="lg:col-span-7 animate-fade-in-up">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] mb-8">
                <span className="live-dot" />
                <span className="text-[10px] text-[#888888] font-terminal font-semibold tracking-widest uppercase">Live YouTube Intelligence</span>
              </div>

              {/* H1 — Inter Tight, text-6xl/7xl, tracking-tight */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.25rem] xl:text-7xl font-black leading-[0.92] mb-7" style={{ letterSpacing: '-0.05em' }}>
                <span className="text-[#FFFFFF] block">YouTube</span>
                <span
                  className="block mt-1"
                  style={{
                    color: '#F6A828',
                    textShadow: '0 0 40px rgba(246, 168, 40, 0.3), 0 0 80px rgba(246, 168, 40, 0.1)',
                  }}
                >
                  Intelligence
                </span>
                <span className="text-[#555555] block mt-1">Platform.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[15px] sm:text-base text-[#888888] max-w-md mb-10 leading-relaxed">
                Predict viral videos before they blow up. Discover trending niches, optimize your content with AI, and outsmart the algorithm.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 mb-10">
                {[
                  { value: '2.4M+', label: 'Videos Indexed' },
                  { value: '94%', label: 'Viral Accuracy' },
                  { value: '3,200+', label: 'Active Creators' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-baseline gap-1.5">
                    <span className="stat-number text-lg font-bold text-[#FFFFFF]">{stat.value}</span>
                    <span className="text-[11px] text-[#555555]">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-[#F6A828] text-black hover:bg-[#FFB340] font-bold px-8 h-12 rounded-xl shadow-lg shadow-[rgba(246,168,40,0.15)] hover:shadow-[0_0_30px_rgba(246,168,40,0.25)] transition-all text-[15px]"
                  onClick={() => setPage('login')}
                >
                  Start free trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-[#888888] hover:text-[#FFFFFF] h-12 rounded-xl text-[15px]"
                  onClick={() => setPage('login')}
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  View live demo
                </Button>
              </div>
            </div>

            {/* Right column — 35% Dashboard Terminal */}
            <div className="lg:col-span-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <DashboardTerminal />
            </div>
          </div>
        </section>

        {/* ═══ FEATURES GRID — 17 Modules ═══ */}
        <section id="features" ref={featuresRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
          {/* Section header */}
          <div className="mb-12">
            <span className="text-[10px] text-[#444] font-terminal tracking-widest uppercase">{'//'} CORE ENGINES</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#FFFFFF] mt-3" style={{ letterSpacing: '-0.03em' }}>17 Intelligence Modules</h2>
            <p className="text-sm text-[#888888] mt-3 max-w-lg leading-relaxed">Every tool you need to research, create, optimize, and grow your YouTube channel — powered by AI.</p>
          </div>

          {/* Grid — glassmorphism cards with semantic color system */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              const c = CAT[feat.cat];
              return (
                <button
                  key={feat.num}
                  onClick={() => setPage('login')}
                  className="group relative text-left p-5 rounded-xl bg-[#141414]/80 backdrop-blur-md border border-white/[0.05] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                  style={{ ['--card-color' as string]: c.hex }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.rgba(0.35); }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                >
                  {/* Number + badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-terminal text-[#444] tracking-widest">{feat.num} / {feat.label}</span>
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-widest uppercase"
                      style={{ color: c.hex, backgroundColor: c.rgba(0.08), border: `1px solid ${c.rgba(0.15)}` }}
                    >
                      {feat.tag}
                    </span>
                  </div>

                  {/* Icon + name */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: c.rgba(0.1), border: `1px solid ${c.rgba(0.12)}` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: c.hex }} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#FFFFFF] leading-snug" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => { (e.target as HTMLElement).style.color = c.hex; }} onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#FFFFFF'; }}>{feat.name}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-[12px] text-[#888888] leading-relaxed">{feat.desc}</p>

                  {/* Hover link */}
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-[#444] transition-colors" style={{}} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = c.hex; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#444'; }}>
                    <span>Learn more</span> <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ PRICING SECTION — Glassmorphism ═══ */}
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
          {/* Section header */}
          <div className="text-center mb-12">
            <span className="text-[10px] text-[#444] font-terminal tracking-widest uppercase">{'//'} PRICING</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#FFFFFF] mt-3" style={{ letterSpacing: '-0.03em' }}>Choose Your Plan</h2>
            <p className="text-sm text-[#888888] mt-3">Start free with 50 tokens. Upgrade when you need more power.</p>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative rounded-xl p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? 'bg-[#141414]/90 border border-[#F6A828]/40 shadow-lg'
                    : 'bg-[#141414]/60 border border-white/[0.05] hover:border-white/[0.08]'
                }`}
                style={plan.highlight ? {
                  boxShadow: '0 0 40px rgba(246, 168, 40, 0.1), 0 20px 60px rgba(0, 0, 0, 0.4)',
                  borderImage: 'linear-gradient(180deg, rgba(246, 168, 40, 0.4) 0%, rgba(246, 168, 40, 0.05) 100%) 1',
                } : {}}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#F6A828] text-black text-[9px] font-bold rounded-full tracking-widest shadow-md shadow-[rgba(246,168,40,0.2)]">
                    {plan.badge}
                  </div>
                )}

                {/* Tier name */}
                <h3 className="text-xs font-semibold text-[#888888] tracking-widest uppercase mb-4 mt-1">{plan.tier}</h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="stat-number text-3xl text-[#FFFFFF]" style={{ letterSpacing: '-0.04em' }}>{plan.price}</span>
                  <span className="text-xs text-[#555555] ml-1.5">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-[12px] text-[#888888]">
                      <Check className="w-3.5 h-3.5 text-[#F6A828] shrink-0 mt-0.5" strokeWidth={2} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full font-semibold text-[13px] rounded-lg h-10 ${
                    plan.highlight
                      ? 'bg-[#F6A828] text-black hover:bg-[#FFB340] shadow-md shadow-[rgba(246,168,40,0.15)]'
                      : 'bg-white/[0.04] text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-white/[0.08] border border-white/[0.05]'
                  }`}
                  onClick={() => setPage('login')}
                >
                  GET STARTED <ArrowRight className="w-3 h-3 ml-1.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-1">
                <button onClick={() => setPage('welcome')} className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-[4px] bg-[#F6A828] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M10 6L18 12L10 18V6Z" fill="white"/>
                      <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
                    </svg>
                  </div>
                  <span className="font-display-tight text-base font-black tracking-[2px] uppercase">NY<span className="text-[#F6A828]">CHIQ</span></span>
                </button>
                <p className="text-[11px] text-[#555555] leading-relaxed max-w-[200px]">
                  AI-powered YouTube intelligence for creators who want to grow faster and smarter.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-[10px] font-semibold text-[#888888] tracking-widest uppercase mb-4">Product</h4>
                <ul className="space-y-2.5">
                  {['Features', 'Pricing', 'Live Demo', 'Changelog'].map((item) => (
                    <li key={item}>
                      <button
                        onClick={() => {
                          if (item === 'Live Demo') setPage('login');
                          else if (item === 'Changelog') setPage('changelog');
                          else document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-[11px] text-[#555555] hover:text-[#a0a0a0] transition-colors"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-[10px] font-semibold text-[#888888] tracking-widest uppercase mb-4">Company</h4>
                <ul className="space-y-2.5">
                  {['About', 'Blog', 'Contact', 'Careers'].map((item) => (
                    <li key={item}>
                      <button onClick={() => setPage(item.toLowerCase() as any)} className="text-[11px] text-[#555555] hover:text-[#a0a0a0] transition-colors">{item}</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-[10px] font-semibold text-[#888888] tracking-widest uppercase mb-4">Legal</h4>
                <ul className="space-y-2.5">
                  {['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Cookie Policy'].map((item) => (
                    <li key={item}>
                      <button onClick={() => setPage(item === 'Privacy Policy' ? 'privacy' : item === 'Terms of Service' ? 'terms' : item === 'Refund Policy' ? 'refund' : 'cookies' as any)} className="text-[11px] text-[#555555] hover:text-[#a0a0a0] transition-colors">{item}</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-6 border-t border-white/[0.04] text-center">
              <p className="text-[11px] text-[#444]">&copy; 2026 NychIQ. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
