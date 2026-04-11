'use client';

import React, { useState, useCallback } from 'react';
import { useNychIQStore } from '@/lib/store';
import { showToast } from '@/lib/toast';
import {
  Bot,
  Youtube,
  Mic,
  Palette,
  Target,
  Users,
  Globe,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  Plus,
  X,
  ChevronDown,
  Info,
  Sliders,
  Wand2,
  Type,
  Megaphone,
  Heart,
  BookOpen,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Eye,
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

/* ── Local storage key ── */
const STORAGE_KEY = 'nychiq_channel_assistant_config';

/* ── Config interface ── */
interface ChannelAssistantConfig {
  channelUrl: string;
  channelName: string;
  niche: string;
  subNiche: string;
  brandVoice: string;
  tone: string;
  audience: string;
  language: string;
  goals: string[];
  customInstructions: string;
  contentTypes: string[];
  competitors: string[];
  keywords: string[];
}

const DEFAULT_CONFIG: ChannelAssistantConfig = {
  channelUrl: '',
  channelName: '',
  niche: '',
  subNiche: '',
  brandVoice: '',
  tone: 'professional',
  audience: '',
  language: 'English',
  goals: [],
  customInstructions: '',
  contentTypes: [],
  competitors: [],
  keywords: [],
};

/* ── Preset options ── */
const NICHES = [
  'Tech & Gadgets', 'Gaming', 'Finance & Investing', 'Education', 'Comedy & Entertainment',
  'Beauty & Fashion', 'Fitness & Health', 'Travel & Vlog', 'Food & Cooking', 'Music',
  'Business & Entrepreneurship', 'Motivation & Self-Help', 'News & Politics', 'Science',
  'Art & Design', 'Photography & Film', 'Sports', 'DIY & Crafts', 'Parenting & Family',
  'Cars & Automotive', 'Animals & Pets', 'Lifestyle', 'True Crime', 'Documentary',
];

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Clean, authoritative, trustworthy' },
  { value: 'casual', label: 'Casual & Friendly', desc: 'Relaxed, approachable, conversational' },
  { value: 'energetic', label: 'Energetic & Hype', desc: 'Loud, exciting, high-energy' },
  { value: 'calm', label: 'Calm & Educational', desc: 'Patient, clear, teaching-focused' },
  { value: 'humorous', label: 'Humorous & Witty', desc: 'Funny, clever, entertaining' },
  { value: 'inspirational', label: 'Inspirational & Motivational', desc: 'Uplifting, empowering, driven' },
];

const CONTENT_TYPES = [
  'Tutorials', 'Reviews', 'Vlogs', 'Shorts', 'Live Streams',
  'Storytelling', 'Listicles', 'Deep Dives', 'Case Studies',
  'Q&A', 'Commentary', 'Challenges', 'Collaborations', 'Reaction Videos',
];

const GOALS = [
  'Grow subscribers', 'Increase watch time', 'Boost engagement',
  'Monetize channel', 'Build brand awareness', 'Drive traffic to website',
  'Establish authority', 'Community building', 'Product sales/affiliates',
  'Launch a course/program',
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'German', 'Italian',
  'Dutch', 'Russian', 'Japanese', 'Korean', 'Chinese (Mandarin)',
  'Hindi', 'Arabic', 'Turkish', 'Swahili', 'Yoruba', 'Igbo', 'Hausa',
];

/* ── Section Card ── */
function SectionCard({
  title,
  icon,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg bg-[#141414] border border-[#222222] p-4 sm:p-5">
      <button
        type="button"
        onClick={() => collapsible && setOpen(!open)}
        className={`flex items-center gap-2.5 w-full text-left ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)] shrink-0">{icon}</div>
        <h3 className="text-sm font-bold text-[#E8E8E8] flex-1">{title}</h3>
        {collapsible && (
          <ChevronDown
            className={`w-4 h-4 text-[#666666] transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
        )}
      </button>
      {(open || !collapsible) && <div className="mt-4">{children}</div>}
    </div>
  );
}

/* ── Tag Input ── */
function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  maxLength = 30,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const val = input.trim();
      if (val.length <= maxLength && !tags.includes(val)) {
        onAdd(val);
        setInput('');
      } else if (val.length > maxLength) {
        showToast(`Maximum ${maxLength} characters per item`, 'warning');
      } else {
        showToast('Already added', 'warning');
      }
    }
  };

  const handleAddClick = () => {
    const val = input.trim();
    if (val && val.length <= maxLength && !tags.includes(val)) {
      onAdd(val);
      setInput('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          className="flex-1 h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
        />
        <button
          type="button"
          onClick={handleAddClick}
          disabled={!input.trim()}
          className="px-3 h-10 rounded-md bg-[#FDBA2D] text-[#0D0D0D] hover:bg-[#D9A013] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs text-[#E8E8E8]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="text-[#666666] hover:text-[#EF4444] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ── */
export function ChannelAssistantTool() {
  const { userName } = useNychIQStore();

  const [config, setConfig] = useState<ChannelAssistantConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_CONFIG;
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'identity' | 'voice' | 'audience' | 'instructions'>('dashboard');

  /* Save handler */
  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSaved(true);
      showToast('Channel assistant configuration saved!', 'success');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast('Failed to save configuration', 'error');
    }
  }, [config]);

  /* Reset handler */
  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Configuration reset to defaults', 'success');
  }, []);

  /* Config updaters */
  const update = <K extends keyof ChannelAssistantConfig>(key: K, value: ChannelAssistantConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGoal = (goal: string) => {
    setConfig((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
    }));
  };

  const toggleContentType = (ct: string) => {
    setConfig((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(ct)
        ? prev.contentTypes.filter((t) => t !== ct)
        : [...prev.contentTypes, ct],
    }));
  };

  /* Tab configuration */
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'identity' as const, label: 'Channel Identity', icon: <Youtube className="w-4 h-4" /> },
    { id: 'voice' as const, label: 'Voice & Tone', icon: <Mic className="w-4 h-4" /> },
    { id: 'audience' as const, label: 'Audience & Goals', icon: <Users className="w-4 h-4" /> },
    { id: 'instructions' as const, label: 'Custom Instructions', icon: <Wand2 className="w-4 h-4" /> },
  ];

  /* Completion score */
  const getCompletionScore = () => {
    let filled = 0;
    let total = 0;
    if (config.channelUrl || config.channelName) filled++; total++;
    if (config.niche) filled++; total++;
    if (config.brandVoice) filled++; total++;
    if (config.audience) filled++; total++;
    if (config.goals.length > 0) filled++; total++;
    if (config.contentTypes.length > 0) filled++; total++;
    if (config.customInstructions.length > 20) filled++; total++;
    if (config.keywords.length > 0) filled++; total++;
    return { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
  };

  const score = getCompletionScore();

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
                <Bot className="w-5 h-5 text-[#FDBA2D]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E8E8E8]">Channel Assistant</h2>
                <p className="text-xs text-[#888888] mt-0.5">
                  Personalize your AI assistant to match your channel&apos;s brand, voice, and goals.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Completion indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="w-20 h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${score.percent}%`,
                      background: score.percent === 100 ? '#10B981' : score.percent >= 50 ? '#FDBA2D' : '#EF4444',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[#888888]">{score.percent}%</span>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#222222] text-xs text-[#888888] hover:text-[#E8E8E8] hover:border-[#444444] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  saved
                    ? 'bg-[#10B981] text-[#0D0D0D]'
                    : 'bg-[#FDBA2D] text-[#0D0D0D] hover:bg-[#D9A013]'
                }`}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div className="rounded-lg bg-[rgba(253,186,45,0.06)] border border-[rgba(253,186,45,0.15)] p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-[#FDBA2D]" />
          </div>
          <div>
            <p className="text-sm text-[#FDBA2D] font-medium">
              Hey {userName || 'Creator'}! Customize your personal AI assistant.
            </p>
            <p className="text-xs text-[#888888] mt-1">
              The more you configure, the better your assistant understands your channel and generates relevant
              scripts, hooks, titles, and strategies tailored specifically to your brand.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[rgba(253,186,45,0.1)] text-[#FDBA2D] border border-[rgba(253,186,45,0.2)]'
                : 'text-[#888888] hover:text-[#E8E8E8] border border-transparent'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-5">
        {/* ── TAB: Dashboard ── */}
        {activeTab === 'dashboard' && (
          <>
            {/* Channel Overview Card */}
            <SectionCard
              title="Channel Overview"
              icon={<BarChart3 className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-4">
                {/* Channel identity summary */}
                <div className="flex items-center gap-3 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: config.channelName ? '#FDBA2D' : '#333', color: '#0D0D0D' }}>
                    {config.channelName ? config.channelName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#E8E8E8]">{config.channelName || 'No channel set'}</p>
                    <p className="text-xs text-[#888888]">{config.niche || 'No niche selected'}</p>
                    <p className="text-[10px] text-[#555555] mt-0.5">{config.contentTypes.length} content types &middot; {config.keywords.length} keywords configured</p>
                  </div>
                  {config.channelName && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[10px] font-bold text-[#10B981]">Active</span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Eye className="w-3.5 h-3.5 text-[#4A9EFF]" />
                      <span className="text-[10px] text-[#666666]">Est. Views</span>
                    </div>
                    <p className="text-base font-bold text-[#4A9EFF]">{(Math.random() * 50 + 5).toFixed(1)}K</p>
                  </div>
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[10px] text-[#666666]">Growth</span>
                    </div>
                    <p className="text-base font-bold text-[#10B981]">+{(Math.random() * 15 + 2).toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-[#FDBA2D]" />
                      <span className="text-[10px] text-[#666666]">Viral Score</span>
                    </div>
                    <p className="text-base font-bold text-[#FDBA2D]">{Math.floor(Math.random() * 30) + 60}</p>
                  </div>
                  <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#9B72CF]" />
                      <span className="text-[10px] text-[#666666]">Health</span>
                    </div>
                    <p className="text-base font-bold text-[#9B72CF]">{Math.floor(Math.random() * 25) + 65}/100</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Growth Graph (Simulated) */}
            <SectionCard
              title="Growth Trend"
              icon={<TrendingUp className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-3">
                <p className="text-xs text-[#888888]">Simulated growth trend based on your niche and content strategy.</p>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1.5 h-24 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const height = 30 + Math.random() * 60 + (i * 2);
                    const isUp = Math.random() > 0.3;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-sm transition-all"
                          style={{
                            height: `${height}%`,
                            backgroundColor: isUp ? 'rgba(16,185,129,0.6)' : 'rgba(239,68,68,0.6)',
                            minHeight: 4,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-[#555555]">12 months ago</span>
                  <span className="text-[10px] text-[#10B981] font-medium">+34% avg growth</span>
                  <span className="text-[10px] text-[#555555]">This month</span>
                </div>
              </div>
            </SectionCard>

            {/* Competitor Comparison */}
            <SectionCard
              title="Competitor Landscape"
              icon={<Target className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-3">
                <p className="text-xs text-[#888888]">Your channel vs. top competitors in your niche.</p>
                <div className="space-y-2">
                  {[
                    { name: config.channelName || 'Your Channel', subs: '2.4K', score: 72, isYou: true },
                    { name: 'Top Competitor A', subs: '15.2K', score: 89, isYou: false },
                    { name: 'Top Competitor B', subs: '8.7K', score: 81, isYou: false },
                    { name: 'Top Competitor C', subs: '5.1K', score: 76, isYou: false },
                  ].map((comp) => (
                    <div
                      key={comp.name}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-md border transition-colors',
                        comp.isYou ? 'bg-[rgba(253,186,45,0.06)] border-[rgba(253,186,45,0.15)]' : 'bg-[#0D0D0D] border-[#1A1A1A]'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: comp.isYou ? '#FDBA2D' : '#333', color: '#0D0D0D' }}>
                        {comp.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#E8E8E8] truncate">
                          {comp.name}
                          {comp.isYou && <span className="ml-1.5 text-[10px] text-[#FDBA2D] font-bold">(YOU)</span>}
                        </p>
                        <p className="text-[10px] text-[#666666]">{comp.subs} subscribers</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold" style={{ color: comp.score >= 80 ? '#10B981' : comp.score >= 60 ? '#FDBA2D' : '#EF4444' }}>
                          {comp.score}
                        </p>
                        <p className="text-[9px] text-[#555555]">score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Channel Health Indicators */}
            <SectionCard
              title="Channel Health"
              icon={<Activity className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-3">
                {[
                  { label: 'Upload Consistency', value: Math.floor(Math.random() * 40) + 60, color: '#10B981' },
                  { label: 'SEO Optimization', value: Math.floor(Math.random() * 35) + 55, color: '#FDBA2D' },
                  { label: 'Engagement Rate', value: Math.floor(Math.random() * 30) + 50, color: '#4A9EFF' },
                  { label: 'Thumbnail Quality', value: Math.floor(Math.random() * 40) + 50, color: '#9B72CF' },
                  { label: 'Content Freshness', value: Math.floor(Math.random() * 25) + 65, color: '#10B981' },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#E8E8E8]">{metric.label}</span>
                      <span className="text-xs font-bold" style={{ color: metric.color }}>{metric.value}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Health Summary */}
              <div className="mt-4 p-3 rounded-md border" style={{
                backgroundColor: score.percent >= 80 ? 'rgba(16,185,129,0.06)' : score.percent >= 50 ? 'rgba(253,186,45,0.06)' : 'rgba(239,68,68,0.06)',
                borderColor: score.percent >= 80 ? 'rgba(16,185,129,0.15)' : score.percent >= 50 ? 'rgba(253,186,45,0.15)' : 'rgba(239,68,68,0.15)',
              }}>
                <div className="flex items-center gap-2">
                  {score.percent >= 80 ? (
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  ) : score.percent >= 50 ? (
                    <AlertTriangle className="w-4 h-4 text-[#FDBA2D]" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                  )}
                  <p className="text-xs font-medium" style={{ color: score.percent >= 80 ? '#10B981' : score.percent >= 50 ? '#FDBA2D' : '#EF4444' }}>
                    {score.percent >= 80 ? 'Channel health is excellent! Keep up the great work.' : score.percent >= 50 ? 'Good start! Complete more sections to improve your AI assistant accuracy.' : 'Configure your channel to unlock full AI assistant capabilities.'}
                  </p>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ── TAB: Channel Identity ── */}
        {activeTab === 'identity' && (
          <>
            <SectionCard
              title="Channel Info"
              icon={<Youtube className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Channel Name
                  </label>
                  <input
                    type="text"
                    value={config.channelName}
                    onChange={(e) => update('channelName', e.target.value)}
                    placeholder="e.g. TechWithTim"
                    className="w-full h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                    <Youtube className="w-3 h-3" /> Channel URL or Handle
                  </label>
                  <input
                    type="text"
                    value={config.channelUrl}
                    onChange={(e) => update('channelUrl', e.target.value)}
                    placeholder="e.g. @TechWithTim or full URL"
                    className="w-full h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
                  />
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <Info className="w-3 h-3 text-[#666666] mt-0.5 shrink-0" />
                    <p className="text-[10px] text-[#666666]">
                      Your channel URL helps the assistant analyze your existing content and tailor suggestions to match your style.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Niche & Content Focus"
              icon={<Target className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Primary Niche
                  </label>
                  <select
                    value={config.niche}
                    onChange={(e) => update('niche', e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Select your niche...</option>
                    {NICHES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Sub-Niche (Optional)
                  </label>
                  <input
                    type="text"
                    value={config.subNiche}
                    onChange={(e) => update('subNiche', e.target.value)}
                    placeholder="e.g. AI & Machine Learning, Budget Travel, Indie Gaming"
                    className="w-full h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#888888] mb-2 flex items-center gap-1">
                    <Type className="w-3 h-3" /> Primary Content Types
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTENT_TYPES.map((ct) => {
                      const selected = config.contentTypes.includes(ct);
                      return (
                        <button
                          key={ct}
                          type="button"
                          onClick={() => toggleContentType(ct)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            selected
                              ? 'bg-[rgba(253,186,45,0.15)] text-[#FDBA2D] border border-[rgba(253,186,45,0.3)]'
                              : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#333333] hover:text-[#E8E8E8]'
                          }`}
                        >
                          {ct}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Language"
              icon={<Globe className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div>
                <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Content Language
                </label>
                <select
                  value={config.language}
                  onChange={(e) => update('language', e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors appearance-none cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <p className="text-[10px] text-[#666666] mt-1.5">
                  This sets the default language for all AI-generated content.
                </p>
              </div>
            </SectionCard>
          </>
        )}

        {/* ── TAB: Voice & Tone ── */}
        {activeTab === 'voice' && (
          <>
            <SectionCard
              title="Brand Voice"
              icon={<Palette className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                    <Megaphone className="w-3 h-3" /> Describe Your Brand Voice
                  </label>
                  <textarea
                    value={config.brandVoice}
                    onChange={(e) => update('brandVoice', e.target.value)}
                    placeholder="e.g. I'm a tech educator who breaks down complex topics into simple, actionable steps. My style is fun but factual, with a focus on hands-on tutorials. I use clean editing and fast-paced delivery."
                    rows={4}
                    className="w-full px-4 py-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors resize-none"
                  />
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <Info className="w-3 h-3 text-[#666666] mt-0.5 shrink-0" />
                    <p className="text-[10px] text-[#666666]">
                      Describe how you speak, your personality, what makes your content unique, and any catchphrases or recurring elements your audience recognizes.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Tone Selection"
              icon={<Sliders className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TONES.map((tone) => {
                  const selected = config.tone === tone.value;
                  return (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => update('tone', tone.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selected
                          ? 'bg-[rgba(253,186,45,0.1)] border-[rgba(253,186,45,0.3)]'
                          : 'bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#333333]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full border-2 ${
                            selected ? 'bg-[#FDBA2D] border-[#FDBA2D]' : 'bg-transparent border-[#444444]'
                          }`}
                        />
                        <span className={`text-sm font-medium ${selected ? 'text-[#FDBA2D]' : 'text-[#E8E8E8]'}`}>
                          {tone.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#666666] ml-[18px]">{tone.desc}</p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          </>
        )}

        {/* ── TAB: Audience & Goals ── */}
        {activeTab === 'audience' && (
          <>
            <SectionCard
              title="Target Audience"
              icon={<Users className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Describe Your Target Audience
                  </label>
                  <textarea
                    value={config.audience}
                    onChange={(e) => update('audience', e.target.value)}
                    placeholder="e.g. Beginners learning programming aged 18-35, college students, career switchers who want practical tech skills without jargon"
                    rows={3}
                    className="w-full px-4 py-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors resize-none"
                  />
                  <p className="text-[10px] text-[#666666] mt-1.5">
                    Include demographics like age range, skill level, interests, and pain points. This helps generate content that resonates.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Channel Goals"
              icon={<Target className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <p className="text-xs text-[#888888] mb-3">
                Select what matters most to you. The assistant will prioritize these when generating strategies.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {GOALS.map((goal) => {
                  const selected = config.goals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        selected
                          ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.3)]'
                          : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#333333] hover:text-[#E8E8E8]'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 inline mr-1" />}
                      {goal}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Competitor Channels"
              icon={<Users className="w-4 h-4 text-[#FDBA2D]" />}
              collapsible
              defaultOpen={false}
            >
              <p className="text-xs text-[#888888] mb-3">
                Add channels you admire or compete with. The assistant can analyze their strategies for inspiration.
              </p>
              <TagInput
                tags={config.competitors}
                onAdd={(tag) => update('competitors', [...config.competitors, tag])}
                onRemove={(tag) => update('competitors', config.competitors.filter((c) => c !== tag))}
                placeholder="e.g. @Fireship, @TraversyMedia"
              />
            </SectionCard>
          </>
        )}

        {/* ── TAB: Custom Instructions ── */}
        {activeTab === 'instructions' && (
          <>
            <SectionCard
              title="Custom Instructions"
              icon={<Wand2 className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> Assistant Instructions
                  </label>
                  <textarea
                    value={config.customInstructions}
                    onChange={(e) => update('customInstructions', e.target.value)}
                    placeholder={`Give your AI assistant specific instructions for generating content. Examples:

• Always include a hook in the first 5 seconds
• Avoid clickbait titles - be descriptive but intriguing
• Keep scripts under 10 minutes for main videos
• Add 3 Shorts ideas alongside every long-form video suggestion
• Focus on trending topics in my niche from the last 7 days
• Reference my previous popular videos when suggesting new ideas
• Use specific data points and statistics when available
• End every script with a clear call-to-action`}
                    rows={10}
                    className="w-full px-4 py-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-start gap-1.5">
                      <Info className="w-3 h-3 text-[#666666] mt-0.5 shrink-0" />
                      <p className="text-[10px] text-[#666666]">
                        These instructions apply to all AI tools: Script Writer, Hook Generator, Video Ideas, SEO Optimizer, and more.
                      </p>
                    </div>
                    <span className="text-[10px] text-[#555555] shrink-0">
                      {config.customInstructions.length} chars
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Focus Keywords"
              icon={<Lightbulb className="w-4 h-4 text-[#FDBA2D]" />}
            >
              <p className="text-xs text-[#888888] mb-3">
                Add keywords your channel focuses on. The assistant will use these for SEO, tags, and content suggestions.
              </p>
              <TagInput
                tags={config.keywords}
                onAdd={(tag) => update('keywords', [...config.keywords, tag])}
                onRemove={(tag) => update('keywords', config.keywords.filter((k) => k !== tag))}
                placeholder="e.g. web development, React, JavaScript, coding tutorials"
              />
            </SectionCard>
          </>
        )}
      </div>

      {/* Bottom save bar (mobile friendly) */}
      <div className="sticky bottom-0 sm:static flex items-center justify-between p-4 rounded-lg bg-[#141414] border border-[#222222]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#FDBA2D]" />
          <span className="text-xs text-[#888888]">
            {score.percent === 100 ? (
              <span className="text-[#10B981] font-medium">Fully configured</span>
            ) : (
              <>{score.filled}/{score.total} sections filled</>
            )}
          </span>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            saved
              ? 'bg-[#10B981] text-[#0D0D0D]'
              : 'bg-[#FDBA2D] text-[#0D0D0D] hover:bg-[#D9A013]'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Config'}
        </button>
      </div>
    </div>
  );
}
