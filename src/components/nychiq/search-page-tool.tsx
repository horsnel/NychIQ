'use client';

import React, { useState, useMemo } from 'react';
import { useNychIQStore, TOOL_META, SIDEBAR_SECTIONS } from '@/lib/store';
import {
  LayoutDashboard, BarChart3, Lightbulb, SearchCode, Palette, TrendingUp, Clock,
  Film, MessageSquare, Type, FileText, Sparkles, Eye, Users, DollarSign,
  TrendingDown, Zap, Crosshair, BrainCircuit, Key, Anchor, ClipboardCheck,
  GitCompare, Activity, Image, ShieldCheck, BellRing, Radar, Stethoscope,
  Cpu, Handshake, History, Flame, Share2, AtSign, Heart, BarChart2,
  Settings, Coins, User, Layers, Scan, Wrench, ScrollText, Scale,
  Columns2, Grid3x3, Package, Target, EyeOff, Archive, Bot, Copy, Building2,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── Icon map: string name → component ── */
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  BarChart3,
  Lightbulb,
  SearchCode,
  Palette,
  TrendingUp,
  TrendingDown,
  Clock,
  Film,
  MessageSquare,
  Type,
  FileText,
  Sparkles,
  Eye,
  EyeOff,
  Users,
  DollarSign,
  Zap,
  Crosshair,
  BrainCircuit,
  Key,
  Anchor,
  ClipboardCheck,
  GitCompare,
  Activity,
  Image,
  ShieldCheck,
  BellRing,
  Radar,
  Stethoscope,
  Cpu,
  Handshake,
  History,
  Flame,
  Share2,
  AtSign,
  Heart,
  BarChart2,
  Settings,
  Coins,
  User,
  Layers,
  Scan,
  Wrench,
  ScrollText,
  Scale,
  Columns2,
  Grid3x3,
  Package,
  Target,
  Archive,
  Bot,
  Copy,
  Building2,
  Search,
};

/* ── Accent colors for visual variety ── */
const ACCENT_PALETTE = [
  { color: '#F5A623', bg: 'rgba(245,166,35,0.10)', border: 'rgba(245,166,35,0.25)' },
  { color: '#9B72CF', bg: 'rgba(155,114,207,0.10)', border: 'rgba(155,114,207,0.25)' },
  { color: '#4A9EFF', bg: 'rgba(74,158,255,0.10)', border: 'rgba(74,158,255,0.25)' },
  { color: '#00C48C', bg: 'rgba(0,196,140,0.10)', border: 'rgba(0,196,140,0.25)' },
];

/* ── Hardcoded new features ── */
const NEW_FEATURES: Record<string, { label: string; icon: string; category: string; description: string }> = {
  'multi-platform': {
    label: 'Multi-Platform Tracker',
    icon: 'Share2',
    category: 'growth',
    description: 'Track YouTube, TikTok, Instagram Reels & Shorts in one unified dashboard',
  },
  'real-time-analytics': {
    label: 'Real-Time Analytics',
    icon: 'Activity',
    category: 'analytics',
    description: 'Live subscriber count, watch time, and revenue estimates updating every few minutes',
  },
  'date-comparison': {
    label: 'Date Comparison',
    icon: 'GitCompare',
    category: 'analytics',
    description: 'Compare any two periods side-by-side with visual analytics',
  },
  'channel-health': {
    label: 'Channel Health Score',
    icon: 'Heart',
    category: 'analytics',
    description: 'Overall score based on engagement rate, upload consistency, CTR, retention',
  },
  'revenue-tracker': {
    label: 'Revenue Tracker',
    icon: 'DollarSign',
    category: 'analytics',
    description: 'Estimated RPM, CPM, AdSense earnings, Super Chat, and Memberships predictions',
  },
  'keyword-gap': {
    label: 'Keyword Gap Analysis',
    icon: 'Key',
    category: 'seo-opt',
    description: 'Show keywords your competitors rank for but you don\'t',
  },
  'thumbnail-title-analyzer': {
    label: 'Thumbnail & Title Analyzer',
    icon: 'Eye',
    category: 'seo-opt',
    description: 'Score any video\'s thumbnail + title for click-worthiness (AI-powered)',
  },
  'video-title-generator': {
    label: 'Video Title Generator',
    icon: 'Sparkles',
    category: 'research',
    description: 'Generate 10+ high-CTR title + thumbnail ideas from a video topic or script',
  },
  'content-repurpose': {
    label: 'Content Repurpose',
    icon: 'Film',
    category: 'content-studio',
    description: 'Turn one long video into 5 Shorts/Reels + TikToks with timestamps',
  },
  'ranking-tracker': {
    label: 'Ranking Tracker',
    icon: 'BarChart3',
    category: 'seo-opt',
    description: 'Daily position tracking for target keywords + videos',
  },
  'description-templates': {
    label: 'Description Templates',
    icon: 'FileText',
    category: 'seo-opt',
    description: 'Smart templates that auto-fill based on video topic',
  },
  'retention-curve': {
    label: 'Retention Curve',
    icon: 'TrendingDown',
    category: 'analytics',
    description: 'Show exactly where viewers drop off + AI suggestions to improve retention',
  },
  'end-screen-optimizer': {
    label: 'End Screen Optimizer',
    icon: 'Target',
    category: 'content-studio',
    description: 'Recommendations for end screens based on high-retention moments',
  },
  'community-scheduler': {
    label: 'Community Scheduler',
    icon: 'Clock',
    category: 'growth',
    description: 'Track performance of community posts and best posting times',
  },
  'smart-alerts': {
    label: 'Smart Alerts',
    icon: 'BellRing',
    category: 'growth',
    description: 'Notifications for sudden growth/drop, copyright strikes, ranking changes',
  },
  'auto-upload': {
    label: 'Auto Upload',
    icon: 'Zap',
    category: 'content-studio',
    description: 'Connect to YouTube and schedule uploads directly from the tool',
  },
  'bulk-analyzer': {
    label: 'Bulk Analyzer',
    icon: 'Layers',
    category: 'analytics',
    description: 'Analyze 50+ videos at once and get optimization recommendations',
  },
  'brand-deal': {
    label: 'Brand Deal Estimator',
    icon: 'Handshake',
    category: 'growth',
    description: 'Estimate how much you can charge for sponsorships based on niche and stats',
  },
  'affiliate-finder': {
    label: 'Affiliate Finder',
    icon: 'Crosshair',
    category: 'growth',
    description: 'Suggest brands/products that match your audience',
  },
  'merch-optimizer': {
    label: 'Merch Optimizer',
    icon: 'Package',
    category: 'growth',
    description: 'Optimize merch shelf and channel memberships for maximum revenue',
  },
  'comment-sentiment': {
    label: 'Comment Sentiment',
    icon: 'MessageSquare',
    category: 'analytics',
    description: 'Analyze top comments for audience feedback and content ideas',
  },
  'voice-style': {
    label: 'Voice Style Analysis',
    icon: 'Stethoscope',
    category: 'content-studio',
    description: 'Detect if your speaking style/pacing matches top creators in your niche',
  },
  'multi-channel': {
    label: 'Multi-Channel Manager',
    icon: 'Users',
    category: 'growth',
    description: 'Manage multiple YouTube channels under one account',
  },
  'team-roles': {
    label: 'Team & Roles',
    icon: 'ShieldCheck',
    category: 'growth',
    description: 'Viewer, Editor, Admin levels for agencies or teams',
  },
  'client-reporting': {
    label: 'Client Reporting',
    icon: 'BarChart2',
    category: 'growth',
    description: 'Beautiful shareable reports with your branding',
  },
  'video-pipeline': {
    label: 'Video Pipeline',
    icon: 'ClipboardCheck',
    category: 'content-studio',
    description: 'Kanban-style board for video ideas → scripting → filming → publishing',
  },
  'audience-demographics': {
    label: 'Audience Demographics',
    icon: 'Scan',
    category: 'analytics',
    description: 'Age, gender, location, interests, devices deep dive',
  },
  'cross-platform-tracker': {
    label: 'Cross-Platform Tracker',
    icon: 'Share2',
    category: 'analytics',
    description: 'See how well your Shorts/TikToks convert to long-form subscribers',
  },
  'search-page': {
    label: 'Search & Discover',
    icon: 'Search',
    category: 'dashboard',
    description: 'Search and discover all features across the platform',
  },
};

/* ── Description map for existing TOOL_META entries ── */
const TOOL_DESCRIPTIONS: Record<string, string> = {
  /* Hub pages */
  dashboard: 'Your channel overview with key metrics, recent performance, and quick actions',
  analytics: 'Deep-dive into views, watch time, CTR, revenue, and audience insights',
  'research-ideas': 'Find viral topics, trending niches, and generate video ideas with AI',
  'seo-hub': 'Optimize titles, tags, descriptions, thumbnails, and boost discoverability',
  'content-studio': 'Create scripts, thumbnails, captions, and manage your content pipeline',
  'growth-tools': 'AI coaching, milestones, competitor tracking, and growth strategies',
  focus: 'Stay productive with timers, focus modes, and content planning tools',

  /* Analytics sub-tools */
  trending: 'Discover trending videos and topics in your niche right now',
  rankings: 'Track video rankings and positions across search results',
  shorts: 'Analyze YouTube Shorts performance and discoverability',
  cpm: 'Estimate your CPM and potential earnings based on niche and audience',
  'niche-compare': 'Compare analytics across different niches side-by-side',
  'opportunity-heatmap': 'Visual heatmap of growth opportunities in your niche',
  'monetization-roadmap': 'Step-by-step roadmap to maximize your channel revenue',

  /* Research sub-tools */
  search: 'Search for videos, channels, and topics across YouTube',
  viral: 'AI-powered viral prediction for video topics and content',
  niche: 'Spy on niche competitors and discover underserved topics',
  algorithm: 'Understand YouTube algorithm recommendations for your channel',
  ideas: 'Generate video ideas tailored to your niche and audience',

  /* SEO sub-tools */
  seo: 'Full SEO audit and optimization for your videos and channel',
  hook: 'Generate attention-grabbing hooks for the first 5 seconds',
  keywords: 'Explore keyword volume, competition, and opportunities',
  script: 'AI-powered video script generation with structure and timing',
  posttime: 'Find the best posting times for maximum reach and engagement',
  audit: 'Comprehensive channel audit with actionable recommendations',
  'ab-test': 'A/B test thumbnails, titles, and descriptions',
  'vph-tracker': 'Track views per hour to optimize your upload timing',
  'thumbnail-lab': 'Design and test thumbnails for maximum click-through rate',
  'safe-check': 'Check for copyright issues, community strikes, and policy violations',
  'trend-alerts': 'Get notified when trends emerge in your niche',
  'outlier-scout': 'Find outlier videos that outperform in your niche',
  'perf-forensics': 'Deep-dive forensic analysis of video performance',
  automation: 'Automate repetitive tasks like reporting and tracking',
  'sponsorship-roi': 'Calculate ROI for brand deals and sponsorships',
  'history-intel': 'Historical data analysis for long-term trends and patterns',

  /* Content Studio sub-tools */
  studio: 'Your creative hub for all content creation tools',
  clipdrop: 'Clip and repurpose long videos into Shorts and highlights',
  echoes: 'Turn your videos into engaging social media posts and quotes',
  reeltype: 'Create eye-catching animated text overlays for Reels and Shorts',
  quoteflip: 'Transform key quotes from your videos into shareable images',
  captioncraft: 'Generate SEO-optimized captions and subtitles',
  lume: 'Professional color grading and visual enhancement tool',
  hooklab: 'Test and optimize video hooks with real engagement data',
  pulsecheck: 'Real-time health check on your video and channel performance',
  'blueprint-ai': 'AI-powered content planning and video blueprint generation',
  scriptflow: 'Write, edit, and collaborate on video scripts seamlessly',
  arbitrage: 'Identify and monetize content arbitrage opportunities',

  /* Growth sub-tools */
  competitor: 'Track and analyze competitor channels and strategies',
  strategy: 'Copy successful strategies from top-performing channels',
  'ghost-tracker': 'Track channels anonymously without them knowing',
  'digital-scout': 'Find profitable digital products to promote or create',
  goffviral: 'Analyze why videos go viral and replicate the patterns',
  'social-trends': 'Track cross-platform trends for content ideas',
  'social-mentions': 'Monitor when your channel or name is mentioned online',
  'social-comments': 'Analyze comment sentiment across your videos',
  'social-channels': 'Compare channel stats and growth benchmarks',
  'agency-dashboard': 'Manage multiple client channels from one dashboard',

  /* Focus sub-tools */
  pause: 'Take structured breaks to maintain creativity and avoid burnout',

  /* AI Assistants */
  saku: 'Your AI creative assistant for content ideation and feedback',
  deepchat: 'Advanced AI chat for deep YouTube strategy discussions',

  /* Account */
  settings: 'Manage your account, preferences, and integrations',
  usage: 'View your token usage history and remaining balance',
  profile: 'Manage your profile, branding, and public information',
  'sovereign-vault': 'Securely store and manage your sensitive data and credentials',
};

/* ── Merge all features into a unified list ── */
interface FeatureEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  category: string;
  description: string;
  isNew?: boolean;
}

function buildAllFeatures(): FeatureEntry[] {
  const features: FeatureEntry[] = [];

  /* Existing TOOL_META entries */
  for (const [id, meta] of Object.entries(TOOL_META)) {
    const IconComp = ICON_MAP[meta.icon];
    if (!IconComp) continue;
    features.push({
      id,
      label: meta.label,
      icon: IconComp,
      category: meta.category === '_sub' ? 'tools' : meta.category,
      description: TOOL_DESCRIPTIONS[id] || `${meta.label} tool for your YouTube channel`,
    });
  }

  /* New features */
  for (const [id, meta] of Object.entries(NEW_FEATURES)) {
    const IconComp = ICON_MAP[meta.icon];
    if (!IconComp) continue;
    features.push({
      id,
      label: meta.label,
      icon: IconComp,
      category: meta.category,
      description: meta.description,
      isNew: true,
    });
  }

  return features;
}

const ALL_FEATURES = buildAllFeatures();

/* ── Category labels from SIDEBAR_SECTIONS + extras ── */
const CATEGORY_LABELS: Record<string, string> = {};
for (const section of SIDEBAR_SECTIONS) {
  CATEGORY_LABELS[section.id] = section.label;
}
CATEGORY_LABELS['tools'] = 'TOOLS';

/* ── Category order (sidebar order + tools) ── */
const CATEGORY_ORDER = [
  'dashboard',
  'analytics',
  'research',
  'seo-opt',
  'content-studio',
  'growth',
  'focus',
  'account',
  'tools',
];

/* ── Category header colors ── */
const CATEGORY_COLORS: Record<string, typeof ACCENT_PALETTE[number]> = {
  dashboard: ACCENT_PALETTE[0],
  analytics: ACCENT_PALETTE[2],
  research: ACCENT_PALETTE[1],
  'seo-opt': ACCENT_PALETTE[3],
  'content-studio': ACCENT_PALETTE[0],
  growth: ACCENT_PALETTE[1],
  focus: ACCENT_PALETTE[2],
  account: ACCENT_PALETTE[3],
  tools: ACCENT_PALETTE[0],
};

/* ── Stable color for each feature based on its id ── */
function getFeatureAccent(id: string): typeof ACCENT_PALETTE[number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
}

/* ── Component ── */
export function SearchPageTool() {
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const setActiveTool = useNychIQStore((s) => s.setActiveTool);
  const activeTool = useNychIQStore((s) => s.activeTool);

  const lowerQuery = query.toLowerCase().trim();

  /* Filter features by search query */
  const filtered = useMemo(() => {
    if (!lowerQuery) return ALL_FEATURES;
    return ALL_FEATURES.filter(
      (f) =>
        f.label.toLowerCase().includes(lowerQuery) ||
        f.description.toLowerCase().includes(lowerQuery) ||
        f.id.includes(lowerQuery) ||
        f.category.includes(lowerQuery)
    );
  }, [lowerQuery]);

  /* Group features by category */
  const grouped = useMemo(() => {
    const map = new Map<string, FeatureEntry[]>();
    for (const f of filtered) {
      const list = map.get(f.category) || [];
      list.push(f);
      map.set(f.category, list);
    }
    /* Sort each group alphabetically */
    for (const [, list] of map) {
      list.sort((a, b) => a.label.localeCompare(b.label));
    }
    /* Return in CATEGORY_ORDER */
    const ordered: { category: string; label: string; items: FeatureEntry[] }[] = [];
    for (const catId of CATEGORY_ORDER) {
      const items = map.get(catId);
      if (items && items.length > 0) {
        ordered.push({
          category: catId,
          label: CATEGORY_LABELS[catId] || catId,
          items,
        });
      }
    }
    /* Any remaining categories not in the order */
    for (const [catId, items] of map) {
      if (!CATEGORY_ORDER.includes(catId)) {
        ordered.push({
          category: catId,
          label: CATEGORY_LABELS[catId] || catId,
          items,
        });
      }
    }
    return ordered;
  }, [filtered]);

  const totalFeatures = ALL_FEATURES.length;
  const showingCount = filtered.length;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
            <Search className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Search & Discover</h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Explore all {totalFeatures} features across the platform
            </p>
          </div>
        </div>
      </div>

      {/* ── Search Input with Ninja AI glowing rings ── */}
      <div className={`ninja-ring-wrap ${searchFocused ? 'ninja-ring-active' : ''} rounded-xl`}>
        <span className="ninja-ring-inner rounded-xl" />
        <span className="ninja-glow-ambient" />
        <div className="relative">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${searchFocused ? 'text-[#F5A623]' : 'text-[#555555]'}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search features, tools, keywords..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0A0A0A] border border-[#222222] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#888888] transition-colors"
            >
              <span className="text-xs font-medium">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Results Count ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#888888]">
          {lowerQuery ? (
            <>
              Showing <span className="text-[#E8E8E8] font-medium">{showingCount}</span> result
              {showingCount !== 1 ? 's' : ''} for &ldquo;
              <span className="text-[#F5A623]">{query}</span>&rdquo;
            </>
          ) : (
            <>
              <span className="text-[#E8E8E8] font-medium">{showingCount}</span> features
              available
            </>
          )}
        </p>
      </div>

      {/* ── Feature Grid by Category ── */}
      {grouped.length === 0 ? (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
          <Search className="w-8 h-8 text-[#333333] mx-auto mb-3" />
          <p className="text-sm text-[#888888]">No features found matching your search</p>
          <p className="text-xs text-[#555555] mt-1">Try different keywords or clear the search</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const catColor = CATEGORY_COLORS[group.category] || ACCENT_PALETTE[0];
            return (
              <div key={group.category}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-1.5 h-4 rounded-full"
                    style={{ backgroundColor: catColor.color }}
                  />
                  <h3 className="text-xs font-bold tracking-wider uppercase text-[#888888]">
                    {group.label}
                  </h3>
                  <span className="text-[10px] text-[#555555]">({group.items.length})</span>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {group.items.map((feature) => {
                    const accent = getFeatureAccent(feature.id);
                    const isActive = activeTool === feature.id;
                    return (
                      <button
                        key={feature.id}
                        onClick={() => setActiveTool(feature.id)}
                        className={`
                          group relative rounded-lg bg-[#111111] border p-4 text-left
                          transition-all duration-200 cursor-pointer
                          hover:scale-[1.03] hover:-translate-y-0.5
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]/50
                          ${isActive ? 'border-[#F5A623]/40' : 'border-[#222222]'}
                        `}
                        style={
                          !isActive
                            ? undefined
                            : { borderColor: 'rgba(245,166,35,0.4)' }
                        }
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = accent.border;
                            e.currentTarget.style.boxShadow = `0 0 20px ${accent.bg}`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = '';
                            e.currentTarget.style.boxShadow = '';
                          }
                        }}
                      >
                        {/* New badge */}
                        {feature.isNew && (
                          <span
                            className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{
                              color: '#00C48C',
                              backgroundColor: 'rgba(0,196,140,0.12)',
                              border: '1px solid rgba(0,196,140,0.2)',
                            }}
                          >
                            NEW
                          </span>
                        )}

                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
                          style={{
                            backgroundColor: accent.bg,
                            color: accent.color,
                          }}
                        >
                          <feature.icon className="w-5 h-5" />
                        </div>

                        {/* Label */}
                        <p className="text-xs font-semibold text-[#E8E8E8] leading-tight mb-1.5 line-clamp-1">
                          {feature.label}
                        </p>

                        {/* Description */}
                        <p className="text-[10px] text-[#666666] leading-relaxed line-clamp-2">
                          {feature.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 text-center">
        <p className="text-xs text-[#555555]">
          Showing {showingCount} of {totalFeatures} features &middot; New features added regularly
        </p>
      </div>
    </div>
  );
}
