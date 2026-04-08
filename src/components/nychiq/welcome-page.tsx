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

/* ── Feature definitions (17 total) ── */
const FEATURES = [
  {
    num: '01',
    label: 'DASHBOARD',
    icon: BarChart3,
    name: 'Command Center',
    desc: 'Your complete YouTube analytics hub with real-time stats, activity feed, and quick actions.',
    tag: 'ALL PLANS',
    tagColor: '#F5A623',
    iconBg: '#F5A623',
  },
  {
    num: '02',
    label: 'TRENDING',
    icon: TrendingUp,
    name: 'Live Trend Radar',
    desc: 'Real-time trending videos across 9 regions with viral scoring and category filtering.',
    tag: 'LIVE DATA',
    tagColor: '#00C48C',
    iconBg: '#00C48C',
  },
  {
    num: '03',
    label: 'SEARCH',
    icon: Search,
    name: 'Universal Search',
    desc: 'Search millions of videos, shorts, and channels with AI-enhanced result ranking.',
    tag: 'ALL PLANS',
    tagColor: '#F5A623',
    iconBg: '#4A9EFF',
  },
  {
    num: '04',
    label: 'VIRAL PREDICTOR',
    icon: Zap,
    name: 'Viral Score Engine',
    desc: 'AI-powered viral prediction that analyzes titles, thumbnails, timing, and engagement patterns.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#F5A623',
  },
  {
    num: '05',
    label: 'NICHE SPY',
    icon: Eye,
    name: 'Niche Discovery',
    desc: 'Uncover untapped niches with high growth potential and low competition scores.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#4A9EFF',
  },
  {
    num: '06',
    label: 'ALGORITHM',
    icon: BrainCircuit,
    name: 'Algorithm Intel',
    desc: 'Understand how the YouTube algorithm ranks content in your specific niche.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#9B72CF',
  },
  {
    num: '07',
    label: 'SEO OPTIMIZER',
    icon: Key,
    name: 'SEO Toolkit',
    desc: 'Optimize titles, descriptions, tags, and metadata for maximum discoverability.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#00C48C',
  },
  {
    num: '08',
    label: 'HOOK GENERATOR',
    icon: Anchor,
    name: 'Hook Creator',
    desc: 'Generate attention-grabbing video hooks and intros using AI trained on viral content.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#E05252',
  },
  {
    num: '09',
    label: 'KEYWORD EXPLORER',
    icon: Search,
    name: 'Keyword Research',
    desc: 'Find high-volume, low-competition keywords specific to YouTube search.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#F5A623',
  },
  {
    num: '10',
    label: 'SCRIPT WRITER',
    icon: FileText,
    name: 'AI Script Studio',
    desc: 'Generate complete video scripts with structure, hooks, CTAs, and timing markers.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#4A9EFF',
  },
  {
    num: '11',
    label: 'VIDEO IDEAS',
    icon: Lightbulb,
    name: 'Idea Generator',
    desc: 'Get unlimited content ideas based on trending topics, your niche, and audience data.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#F5A623',
  },
  {
    num: '12',
    label: 'CPM ESTIMATOR',
    icon: DollarSign,
    name: 'Revenue Forecaster',
    desc: 'Estimate CPM rates and projected earnings across niches and regions.',
    tag: 'LIVE DATA',
    tagColor: '#00C48C',
    iconBg: '#00C48C',
  },
  {
    num: '13',
    label: 'CHANNEL AUDIT',
    icon: ClipboardCheck,
    name: 'Health Check',
    desc: 'Comprehensive channel audit with SEO, branding, content, and engagement scoring.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#9B72CF',
  },
  {
    num: '14',
    label: 'COMPETITOR',
    icon: Users,
    name: 'Track & Analyze',
    desc: 'Monitor competitor channels, content strategies, and growth trajectories.',
    tag: 'LIVE DATA',
    tagColor: '#00C48C',
    iconBg: '#E05252',
  },
  {
    num: '15',
    label: 'OUTLIER SCOUT',
    icon: Radar,
    name: 'Outlier Detection',
    desc: 'Find channels that are about to break out based on abnormal growth signals.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#00C48C',
  },
  {
    num: '16',
    label: 'SAKU AI',
    icon: Bot,
    name: 'AI Assistant',
    desc: 'Your personal YouTube expert — ask anything about strategy, trends, or growth.',
    tag: 'AI POWERED',
    tagColor: '#9B72CF',
    iconBg: '#9B72CF',
  },
  {
    num: '17',
    label: 'AUTOMATION',
    icon: Cpu,
    name: 'Auto Tasks',
    desc: 'Set up automated monitoring, alerts, and reporting for your channels.',
    tag: 'PRO+',
    tagColor: '#4A9EFF',
    iconBg: '#F5A623',
  },
];

/* ── Pricing plans ── */
const PLANS = [
  {
    tier: 'Starter',
    price: '₦15K',
    period: '/ month',
    features: ['50 daily tokens', '5 core tools', 'Basic analytics', 'Email support', '1 channel tracked'],
    highlight: false,
  },
  {
    tier: 'Pro',
    price: '₦35K',
    period: '/ month',
    features: ['3,500 tokens/month', '17 intelligence modules', 'Advanced analytics', 'Priority support', '5 channels tracked', 'API access'],
    highlight: true,
    badge: 'MOST POPULAR',
  },
  {
    tier: 'Elite',
    price: '₦70K',
    period: '/ month',
    features: ['10,000 daily tokens', 'Full tool suite', 'Enterprise analytics', 'Dedicated support', '25 channels tracked', 'White-label reports'],
    highlight: false,
  },
  {
    tier: 'Agency',
    price: '₦150K',
    period: '/ month',
    features: ['50,000 daily tokens', 'Everything in Elite', 'Agency dashboard', 'Team management', 'Unlimited channels', 'Custom integrations'],
    highlight: false,
  },
];

/* ── Terminal typing animation ── */
const TERMINAL_LINES = [
  { text: '> SCANNING 12 TRENDING VIDEOS...', color: '#888888' },
  { text: '> VIRAL SCORE: 94/99 ⚡', color: '#00C48C' },
  { text: '> AI ANALYSIS READY', color: '#4A9EFF' },
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
    }, 30);
    return () => clearInterval(interval);
  }, [visible, text]);

  if (!visible) return null;
  return (
    <div className="font-mono text-xs" style={{ color }}>
      <span className="text-[#F5A623]">▸ </span>
      {textVisible}
      {textVisible.length < text.length && (
        <span className="inline-block w-1.5 h-3.5 bg-[#F5A623] ml-0.5 animate-pulse" />
      )}
    </div>
  );
}

export function WelcomePage() {
  const { setPage } = useNychIQStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#070707] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#070707] to-[#050505]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[rgba(245,166,35,0.02)] blur-[100px]" />
      <div className="absolute top-[40%] right-0 w-[400px] h-[400px] rounded-full bg-[rgba(0,196,140,0.015)] blur-[80px]" />

      <div className="relative z-10">
        {/* ═══ NAVIGATION BAR ═══ */}
        <nav
          className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'bg-[#000]/95 backdrop-blur-md border-b border-[#111]'
              : 'bg-transparent border-b border-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <button
                onClick={() => setPage('welcome')}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#FFD700] flex items-center justify-center shadow-lg shadow-[rgba(245,166,35,0.2)] group-hover:shadow-[rgba(245,166,35,0.35)] transition-shadow">
                  <Play className="w-4.5 h-4.5 text-black fill-black ml-0.5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-gradient-amber">NychIQ</span>
              </button>

              {/* Center links - desktop */}
              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-sm text-[#888888] hover:text-[#E8E8E8] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.03)]"
                >
                  Features
                </button>
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-4 py-2 text-sm text-[#888888] hover:text-[#E8E8E8] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.03)]"
                >
                  Pricing
                </button>
                <button
                  onClick={() => setPage('privacy')}
                  className="px-4 py-2 text-sm text-[#888888] hover:text-[#E8E8E8] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.03)]"
                >
                  Legal
                </button>
                <button
                  onClick={() => setPage('login')}
                  className="px-4 py-2 text-sm text-[#888888] hover:text-[#E8E8E8] transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.03)]"
                >
                  Live Demo
                </button>
              </div>

              {/* Right buttons — desktop */}
              <div className="hidden md:flex items-center gap-3">
                <Button
                  variant="outline"
                  className="border-[#333] text-[#888888] hover:text-[#E8E8E8] hover:border-[#444] hover:bg-transparent text-sm font-medium"
                  onClick={() => setPage('login')}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-[#F5A623] text-black hover:bg-[#E6960F] text-sm font-semibold shadow-lg shadow-[rgba(245,166,35,0.15)]"
                  onClick={() => setPage('login')}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 text-[#888888] hover:text-[#E8E8E8] transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#111] border-t border-[#1E1E1E] animate-fade-in-up">
              <div className="px-4 py-4 space-y-1">
                <button
                  onClick={() => { featuresRef.current?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-sm text-[#888888] hover:text-[#E8E8E8] hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-sm text-[#888888] hover:text-[#E8E8E8] hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors"
                >
                  Pricing
                </button>
                <button
                  onClick={() => { setPage('privacy'); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-sm text-[#888888] hover:text-[#E8E8E8] hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors"
                >
                  Legal
                </button>
                <button
                  onClick={() => { setPage('login'); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-sm text-[#888888] hover:text-[#E8E8E8] hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors"
                >
                  Live Demo
                </button>
                <div className="pt-3 border-t border-[#1E1E1E] flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full border-[#333] text-[#888888] hover:text-[#E8E8E8] hover:bg-transparent"
                    onClick={() => { setPage('login'); setMobileMenuOpen(false); }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="w-full bg-[#F5A623] text-black hover:bg-[#E6960F] font-semibold"
                    onClick={() => { setPage('login'); setMobileMenuOpen(false); }}
                  >
                    Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* ═══ HERO SECTION ═══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column */}
            <div className="animate-fade-in-up">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[rgba(0,196,140,0.08)] border border-[rgba(0,196,140,0.15)] text-xs text-[#00C48C] font-semibold tracking-wide uppercase mb-6">
                <span className="live-dot" />
                LIVE YOUTUBE INTELLIGENCE
              </div>

              {/* H1 */}
              <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold leading-[1.1] mb-6">
                <span className="text-[#E8E8E8] block">YouTube</span>
                <span className="text-gradient-amber block">Intelligence</span>
                <span className="text-[#666666] block">Platform.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#888888] max-w-lg mb-8 leading-relaxed">
                Predict viral videos before they blow up. Discover trending niches, optimize your content with AI, and outsmart the algorithm — all from one dashboard.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8">
                {[
                  { value: '2.4M+', label: 'Videos Indexed' },
                  { value: '94%', label: 'Viral Accuracy' },
                  { value: '3,200+', label: 'Active Creators' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#E8E8E8]">{stat.value}</span>
                    <span className="text-xs text-[#666666]">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-[#F5A623] text-black hover:bg-[#E6960F] font-semibold px-8 h-12 shadow-lg shadow-[rgba(245,166,35,0.2)]"
                  onClick={() => setPage('login')}
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#333] text-[#888888] hover:text-[#E8E8E8] hover:border-[#444] hover:bg-transparent h-12 font-medium"
                  onClick={() => setPage('login')}
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  View live demo
                </Button>
              </div>
            </div>

            {/* Right column — Dashboard mockup */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="absolute -inset-4 bg-gradient-to-r from-[rgba(245,166,35,0.06)] to-[rgba(0,196,140,0.06)] rounded-2xl blur-2xl" />
              <div className="relative bg-[#0D0D0D] border border-[#222] rounded-xl overflow-hidden shadow-2xl">
                {/* Browser bar */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#111] border-b border-[#1E1E1E]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#E05252]" />
                    <div className="w-3 h-3 rounded-full bg-[#F5A623]" />
                    <div className="w-3 h-3 rounded-full bg-[#00C48C]" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-[#0A0A0A] rounded-md px-3 py-1.5">
                    <Globe className="w-3 h-3 text-[#444]" />
                    <span className="text-xs text-[#666] font-mono">nychiq.com/dashboard</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)]">
                    <span className="live-dot" style={{ width: 6, height: 6 }} />
                    <span className="text-[10px] text-[#00C48C] font-semibold">LIVE</span>
                  </div>
                </div>

                {/* Terminal area */}
                <div className="px-5 py-6 space-y-3 min-h-[160px] flex flex-col justify-center">
                  {TERMINAL_LINES.map((line, i) => (
                    <TerminalLine key={i} text={line.text} color={line.color} delay={800 + i * 1200} />
                  ))}
                </div>

                {/* Play button overlay */}
                <div className="relative -mt-2 flex justify-center pb-4">
                  <button
                    className="w-14 h-14 rounded-full bg-[#F5A623] flex items-center justify-center shadow-lg shadow-[rgba(245,166,35,0.3)] hover:scale-105 transition-transform animate-glow-amber"
                    onClick={() => setPage('login')}
                  >
                    <Play className="w-6 h-6 text-black fill-black ml-1" />
                  </button>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-4 border-t border-[#1E1E1E]">
                  {[
                    { label: 'Trending', value: '142' },
                    { label: 'Top Score', value: '94' },
                    { label: 'CPM', value: '$22.40' },
                    { label: 'Engines', value: '13' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="px-3 py-3 border-r border-[#1E1E1E] last:border-r-0 text-center"
                    >
                      <div className="text-xs font-bold text-[#E8E8E8]">{stat.value}</div>
                      <div className="text-[10px] text-[#555] mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURES GRID ═══ */}
        <section ref={featuresRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
          {/* Section header */}
          <div className="mb-10">
            <span className="text-xs text-[#444] font-mono tracking-wider">{'//'} CORE ENGINES</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#E8E8E8] mt-2">17 Intelligence Modules</h2>
            <p className="text-sm text-[#666] mt-2 max-w-lg">Every tool you need to research, create, optimize, and grow your YouTube channel — powered by AI.</p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#1A1A1A]">
            {FEATURES.map((feat) => (
              <button
                key={feat.num}
                onClick={() => setPage('login')}
                className="bg-[#0A0A0A] hover:bg-[#111] p-5 sm:p-6 text-left transition-all duration-200 group cursor-pointer"
              >
                {/* Number + tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-[#444] tracking-wider">
                    {feat.num} / {feat.label}
                  </span>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: feat.tagColor,
                      backgroundColor: `${feat.tagColor}15`,
                      border: `1px solid ${feat.tagColor}30`,
                    }}
                  >
                    {feat.tag}
                  </span>
                </div>

                {/* Icon + name */}
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${feat.iconBg}15` }}
                  >
                    <feat.icon className="w-4.5 h-4.5" style={{ color: feat.iconBg }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#E8E8E8] group-hover:text-[#F5A623] transition-colors">
                      {feat.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#666] leading-relaxed mt-1">
                  {feat.desc}
                </p>

                {/* Hover arrow */}
                <div className="mt-3 flex items-center gap-1 text-[10px] text-[#444] group-hover:text-[#F5A623] transition-colors">
                  <span>Learn more</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ═══ PRICING SECTION ═══ */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
          {/* Section header */}
          <div className="text-center mb-12">
            <span className="text-xs text-[#444] font-mono tracking-wider">{'//'} PRICING</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#E8E8E8] mt-2">Choose Your Plan</h2>
            <p className="text-sm text-[#666] mt-2">Start free with 50 tokens. Upgrade when you need more power.</p>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`relative rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 ${
                  plan.highlight
                    ? 'bg-[#0D0D0D] border-2 border-[#F5A623] shadow-lg shadow-[rgba(245,166,35,0.1)]'
                    : 'bg-[#0A0A0A] border border-[#222] hover:border-[#2A2A2A]'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#F5A623] text-black text-[10px] font-bold rounded-full tracking-wide shadow-md">
                    {plan.badge}
                  </div>
                )}

                {/* Tier name */}
                <h3 className="text-sm font-semibold text-[#888] tracking-wide uppercase mb-4 mt-1">
                  {plan.tier}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-[#E8E8E8]">{plan.price}</span>
                  <span className="text-sm text-[#555] ml-1">{plan.period}</span>
                </div>

                {/* Features list */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-[#888]">
                      <Check className="w-3.5 h-3.5 text-[#00C48C] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Button
                  className={`w-full font-semibold text-sm ${
                    plan.highlight
                      ? 'bg-[#F5A623] text-black hover:bg-[#E6960F] shadow-md shadow-[rgba(245,166,35,0.15)]'
                      : 'bg-[#1A1A1A] text-[#888] hover:text-[#E8E8E8] hover:bg-[#222] border border-[#222]'
                  }`}
                  onClick={() => setPage('login')}
                >
                  GET STARTED
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="border-t border-[#1E1E1E]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-1">
                <button onClick={() => setPage('welcome')} className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#FFD700] flex items-center justify-center">
                    <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                  </div>
                  <span className="text-lg font-bold text-gradient-amber">NychIQ</span>
                </button>
                <p className="text-xs text-[#555] leading-relaxed max-w-[200px]">
                  AI-powered YouTube intelligence platform for creators who want to grow faster and smarter.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="text-xs font-semibold text-[#888] tracking-wide uppercase mb-4">Product</h4>
                <ul className="space-y-2.5">
                  <li>
                  <button
                    onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-xs text-[#555] hover:text-[#888] transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-xs text-[#555] hover:text-[#888] transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setPage('login')}
                    className="text-xs text-[#555] hover:text-[#888] transition-colors"
                  >
                    Live Demo
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setPage('changelog')}
                    className="text-xs text-[#555] hover:text-[#888] transition-colors"
                  >
                    Changelog
                  </button>
                </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-xs font-semibold text-[#888] tracking-wide uppercase mb-4">Company</h4>
                <ul className="space-y-2.5">
                  {[
                    { label: 'About', page: 'about' as const },
                    { label: 'Blog', page: 'about' as const },
                    { label: 'Contact', page: 'contact' as const },
                    { label: 'Careers', page: 'careers' as const },
                  ].map((item) => (
                    <li key={item.label}>
                      <button
                        onClick={() => setPage(item.page)}
                        className="text-xs text-[#555] hover:text-[#888] transition-colors"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-xs font-semibold text-[#888] tracking-wide uppercase mb-4">Legal</h4>
                <ul className="space-y-2.5">
                  {[
                    { label: 'Privacy Policy', page: 'privacy' as const },
                    { label: 'Terms of Service', page: 'terms' as const },
                    { label: 'Refund Policy', page: 'refund' as const },
                    { label: 'Cookie Policy', page: 'cookies' as const },
                  ].map((item) => (
                    <li key={item.label}>
                      <button
                        onClick={() => setPage(item.page)}
                        className="text-xs text-[#555] hover:text-[#888] transition-colors"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-6 border-t border-[#1A1A1A] text-center">
              <p className="text-xs text-[#444]">
                &copy; 2026 NychIQ. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
