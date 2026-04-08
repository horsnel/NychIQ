'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useNychIQStore } from '@/lib/store';
import { fmtV } from '@/lib/utils';
import {
  Palette,
  Crown,
  Lock,
  Eye,
  Users,
  Play,
  TrendingUp,
  Heart,
  BarChart3,
  Search,
  ImageIcon,
  ArrowUpDown,
  Wrench,
  CheckCircle2,
  Circle,
  Upload,
  Link,
  Loader2,
  Zap,
  FileText,
  Tag,
  Clock,
  Sparkles,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

/* ── Types ── */
type StudioTab = 'overview' | 'videos' | 'seo' | 'checklist' | 'preupload';

interface MockVideo {
  id: string;
  title: string;
  views: number;
  likes: number;
  viralScore: number;
  thumbnail: string;
  publishedAt: string;
}

interface SEOVideoScore {
  id: string;
  title: string;
  titleScore: number;
  descScore: number;
  tagsScore: number;
  total: number;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistCategory {
  name: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
}

/* ── Mock Data ── */
const MOCK_CHANNEL = {
  name: 'NychIQ Academy',
  handle: '@nychiqacademy',
  description: 'Data-driven YouTube strategies, algorithm breakdowns, and creator growth tips. Helping 500K+ creators go viral with real analytics.',
  avatar: 'NA',
  subscribers: 247800,
  totalViews: 18420000,
  videoCount: 342,
  avgViews: 53860,
  engagementRate: 6.8,
  healthScore: 78,
};

const MOCK_VIDEOS: MockVideo[] = [
  { id: 'v1', title: 'How YouTube Algorithm Really Works in 2025', views: 1245000, likes: 89200, viralScore: 94, thumbnail: 'HT', publishedAt: '3d ago' },
  { id: 'v2', title: '10 Mistakes Killing Your Channel Growth', views: 876000, likes: 62300, viralScore: 87, thumbnail: '10', publishedAt: '1w ago' },
  { id: 'v3', title: 'I Analyzed 1,000 Viral Videos – Here\'s What I Found', views: 2140000, likes: 156000, viralScore: 96, thumbnail: '1K', publishedAt: '2w ago' },
  { id: 'v4', title: 'Best Upload Time for YouTube Shorts', views: 342000, likes: 21400, viralScore: 62, thumbnail: 'BT', publishedAt: '3w ago' },
  { id: 'v5', title: 'How to Get 100K Subscribers in 6 Months', views: 567000, likes: 41200, viralScore: 78, thumbnail: '100', publishedAt: '1mo ago' },
  { id: 'v6', title: 'YouTube SEO Masterclass for Beginners', views: 198000, likes: 15600, viralScore: 55, thumbnail: 'SE', publishedAt: '1mo ago' },
  { id: 'v7', title: 'Why Your Videos Aren\'t Getting Views', views: 421000, likes: 28900, viralScore: 71, thumbnail: 'WY', publishedAt: '2mo ago' },
  { id: 'v8', title: 'Complete YouTube Analytics Tutorial', views: 156000, likes: 11200, viralScore: 48, thumbnail: 'YA', publishedAt: '3mo ago' },
];

const MOCK_SEO_SCORES: SEOVideoScore[] = [
  { id: 'v1', title: 'How YouTube Algorithm Really Works in 2025', titleScore: 92, descScore: 85, tagsScore: 78, total: 85 },
  { id: 'v2', title: '10 Mistakes Killing Your Channel Growth', titleScore: 88, descScore: 72, tagsScore: 65, total: 75 },
  { id: 'v3', title: 'I Analyzed 1,000 Viral Videos', titleScore: 95, descScore: 91, tagsScore: 88, total: 91 },
  { id: 'v4', title: 'Best Upload Time for YouTube Shorts', titleScore: 70, descScore: 55, tagsScore: 42, total: 56 },
  { id: 'v5', title: 'How to Get 100K Subscribers in 6 Months', titleScore: 82, descScore: 68, tagsScore: 58, total: 69 },
  { id: 'v6', title: 'YouTube SEO Masterclass for Beginners', titleScore: 65, descScore: 48, tagsScore: 38, total: 50 },
];

const DEFAULT_CHECKLIST: ChecklistCategory[] = [
  {
    name: 'Title',
    icon: <FileText className="w-3.5 h-3.5" />,
    items: [
      { id: 't1', text: 'Title is under 60 characters', checked: false },
      { id: 't2', text: 'Primary keyword in first half of title', checked: false },
      { id: 't3', text: 'Title creates curiosity or urgency', checked: false },
      { id: 't4', text: 'No clickbait — title matches content', checked: false },
      { id: 't5', text: 'Power word used (How, Why, Secret, etc.)', checked: false },
    ],
  },
  {
    name: 'Thumbnail',
    icon: <ImageIcon className="w-3.5 h-3.5" />,
    items: [
      { id: 'th1', text: 'Thumbnail has 3 or fewer text elements', checked: false },
      { id: 'th2', text: 'Text readable at mobile size', checked: false },
      { id: 'th3', text: 'High contrast background', checked: false },
      { id: 'th4', text: 'Human face with emotion (if applicable)', checked: false },
      { id: 'th5', text: 'Thumbnail differs from recent uploads', checked: false },
    ],
  },
  {
    name: 'Description',
    icon: <FileText className="w-3.5 h-3.5" />,
    items: [
      { id: 'd1', text: 'First 2 lines are compelling and keyword-rich', checked: false },
      { id: 'd2', text: 'Description is at least 200 words', checked: false },
      { id: 'd3', text: 'Includes relevant hashtags (#)', checked: false },
      { id: 'd4', text: 'Links to related videos / playlists', checked: false },
      { id: 'd5', text: 'Social media / subscribe CTA included', checked: false },
    ],
  },
  {
    name: 'Tags',
    icon: <Tag className="w-3.5 h-3.5" />,
    items: [
      { id: 'tg1', text: 'Primary keyword as first tag', checked: false },
      { id: 'tg2', text: '10-15 relevant tags used', checked: false },
      { id: 'tg3', text: 'Mix of broad and long-tail keywords', checked: false },
      { id: 'tg4', text: 'Tags match video content (no tag stuffing)', checked: false },
      { id: 'tg5', text: 'Competitor keyword tags included', checked: false },
    ],
  },
  {
    name: 'First 24 Hours',
    icon: <Clock className="w-3.5 h-3.5" />,
    items: [
      { id: 'f1', text: 'Posted at optimal time for audience', checked: false },
      { id: 'f2', text: 'Community post shared on upload', checked: false },
      { id: 'f3', text: 'Pinned comment with engagement question', checked: false },
      { id: 'f4', text: 'Shared on external social platforms', checked: false },
      { id: 'f5', text: 'Replied to early comments within 1 hour', checked: false },
    ],
  },
];

const STORAGE_KEY = 'nychiq_studio_checklist';

/* ── Health Score Gauge ── */
function HealthGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#00C48C' : score >= 40 ? '#F5A623' : '#E05252';
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Needs Work' : 'At Risk';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#1A1A1A" strokeWidth="8" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-[#888888]">/ 100</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

/* ── Score Badge ── */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#00C48C' : score >= 50 ? '#F5A623' : '#E05252';
  const bg = score >= 80 ? 'rgba(0,196,140,0.12)' : score >= 50 ? 'rgba(245,166,35,0.12)' : 'rgba(224,82,82,0.12)';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold" style={{ color, backgroundColor: bg }}>
      {score}
    </span>
  );
}

/* ── Viral Badge ── */
function ViralBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#00C48C' : score >= 60 ? '#F5A623' : score >= 40 ? '#4A9EFF' : '#888888';
  const bg = score >= 80 ? 'rgba(0,196,140,0.12)' : score >= 60 ? 'rgba(245,166,35,0.12)' : score >= 40 ? 'rgba(74,158,255,0.12)' : 'rgba(136,136,136,0.12)';
  const label = score >= 80 ? 'Viral' : score >= 60 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color, backgroundColor: bg }}>
      <Zap className="w-2.5 h-2.5" /> {score} · {label}
    </span>
  );
}

/* ── Plan Gate ── */
function PlanGate() {
  const { setUpgradeModalOpen } = useNychIQStore();
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="max-w-sm w-full rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-[#F5A623]" />
        </div>
        <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">Studio Locked</h2>
        <p className="text-sm text-[#888888] mb-6">NychIQ Studio requires Starter plan or higher. Upgrade to access channel management, video SEO, and pre-upload tools.</p>
        <button onClick={() => setUpgradeModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors">
          <Crown className="w-4 h-4" /> Upgrade Now
        </button>
      </div>
    </div>
  );
}

/* ── Tabs Config ── */
const TABS: { id: StudioTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'videos', label: 'Videos', icon: <Play className="w-3.5 h-3.5" /> },
  { id: 'seo', label: 'SEO', icon: <Search className="w-3.5 h-3.5" /> },
  { id: 'checklist', label: 'Checklist', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { id: 'preupload', label: 'Pre-Upload', icon: <Upload className="w-3.5 h-3.5" /> },
];

/* ── Main Component ── */
export function StudioTool() {
  const { canAccess } = useNychIQStore();
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');

  if (!canAccess('studio')) return <PlanGate />;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]"><Palette className="w-5 h-5 text-[#9B72CF]" /></div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">NychIQ Studio</h2>
            <p className="text-xs text-[#888888] mt-0.5">Channel management, video optimization, and pre-upload analysis.</p>
          </div>
          <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold text-[#F5A623] bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)]">PRO+</span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[rgba(155,114,207,0.15)] text-[#9B72CF] border border-[rgba(155,114,207,0.25)]'
                  : 'text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] border border-transparent'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'videos' && <VideosTab />}
      {activeTab === 'seo' && <SeoTab />}
      {activeTab === 'checklist' && <ChecklistTab />}
      {activeTab === 'preupload' && <PreUploadTab />}
    </div>
  );
}

/* ════════════════════════════════════════════════
   OVERVIEW TAB
   ════════════════════════════════════════════════ */
function OverviewTab() {
  const ch = MOCK_CHANNEL;
  const stats = [
    { label: 'Subscribers', value: fmtV(ch.subscribers), icon: <Users className="w-4 h-4 text-[#9B72CF]" />, color: '#9B72CF' },
    { label: 'Total Views', value: fmtV(ch.totalViews), icon: <Eye className="w-4 h-4 text-[#4A9EFF]" />, color: '#4A9EFF' },
    { label: 'Videos', value: ch.videoCount.toLocaleString(), icon: <Play className="w-4 h-4 text-[#F5A623]" />, color: '#F5A623' },
    { label: 'Avg Views', value: fmtV(ch.avgViews), icon: <BarChart3 className="w-4 h-4 text-[#00C48C]" />, color: '#00C48C' },
    { label: 'Engagement', value: `${ch.engagementRate}%`, icon: <TrendingUp className="w-4 h-4 text-[#E05252]" />, color: '#E05252' },
  ];

  return (
    <div className="space-y-4">
      {/* Channel Card + Health Score */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9B72CF] to-[#F5A623] flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">{ch.avatar}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#E8E8E8]">{ch.name}</h3>
            <p className="text-sm text-[#9B72CF] mb-2">{ch.handle}</p>
            <p className="text-sm text-[#888888] leading-relaxed line-clamp-2">{ch.description}</p>
          </div>

          {/* Health Score */}
          <div className="flex-shrink-0">
            <HealthGauge score={ch.healthScore} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-[#111111] border border-[#222222] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">{stat.label}</span>
              {stat.icon}
            </div>
            <span className="text-xl font-bold text-[#E8E8E8]">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   VIDEOS TAB
   ════════════════════════════════════════════════ */
function VideosTab() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'views' | 'likes' | 'viralScore'>('views');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let list = [...MOCK_VIDEOS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortDir === 'desc' ? -diff : diff;
    });
    return list;
  }, [search, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search videos..."
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider">Video</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider cursor-pointer hover:text-[#888888] select-none" onClick={() => toggleSort('views')}>
                  <span className="inline-flex items-center gap-1">Views <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider cursor-pointer hover:text-[#888888] select-none hidden sm:table-cell" onClick={() => toggleSort('likes')}>
                  <span className="inline-flex items-center gap-1">Likes <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider cursor-pointer hover:text-[#888888] select-none" onClick={() => toggleSort('viralScore')}>
                  <span className="inline-flex items-center gap-1">Viral <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((video) => (
                <tr key={video.id} className="border-b border-[#1A1A1A] last:border-0 hover:bg-[#0D0D0D] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-9 rounded-md bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[#666666]">{video.thumbnail}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[#E8E8E8] font-medium truncate max-w-[200px] sm:max-w-[300px]">{video.title}</p>
                        <p className="text-[10px] text-[#666666]">{video.publishedAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#888888] whitespace-nowrap">{fmtV(video.views)}</td>
                  <td className="px-4 py-3 text-sm text-[#888888] whitespace-nowrap hidden sm:table-cell">{fmtV(video.likes)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><ViralBadge score={video.viralScore} /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium text-[#F5A623] bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] hover:bg-[rgba(245,166,35,0.2)] transition-colors">
                      <Wrench className="w-3 h-3" /> SEO Fix
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[#666666]">No videos found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SEO TAB
   ════════════════════════════════════════════════ */
function SeoTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-[#F5A623]" />
        <p className="text-xs text-[#888888]">SEO scores are calculated from title optimization, description quality, and tag relevance. <span className="text-[#F5A623] font-medium">Green ≥80</span> · <span className="text-[#F5A623] font-medium">Amber ≥50</span> · <span className="text-[#E05252] font-medium">Red &lt;50</span></p>
      </div>

      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider">Video</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider text-center">Title</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider text-center hidden sm:table-cell">Desc</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider text-center hidden sm:table-cell">Tags</th>
                <th className="px-4 py-3 text-[10px] font-bold text-[#666666] uppercase tracking-wider text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SEO_SCORES.map((v) => (
                <tr key={v.id} className="border-b border-[#1A1A1A] last:border-0 hover:bg-[#0D0D0D] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#E8E8E8] font-medium truncate max-w-[240px] sm:max-w-[340px]">{v.title}</p>
                  </td>
                  <td className="px-4 py-3 text-center"><ScoreBadge score={v.titleScore} /></td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell"><ScoreBadge score={v.descScore} /></td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell"><ScoreBadge score={v.tagsScore} /></td>
                  <td className="px-4 py-3 text-center"><ScoreBadge score={v.total} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   CHECKLIST TAB
   ════════════════════════════════════════════════ */
function loadChecklist(): ChecklistCategory[] {
  if (typeof window === 'undefined') return DEFAULT_CHECKLIST;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_CHECKLIST;
}

function persistChecklist(cats: ChecklistCategory[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cats)); } catch { /* ignore */ }
}

function ChecklistTab() {
  const [categories, setCategories] = useState<ChecklistCategory[]>(loadChecklist);

  const toggleItem = useCallback((catIdx: number, itemId: string) => {
    setCategories((prev) => {
      const next = prev.map((cat, ci) =>
        ci === catIdx
          ? { ...cat, items: cat.items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)) }
          : cat
      );
      persistChecklist(next);
      return next;
    });
  }, []);

  const resetChecklist = useCallback(() => {
    const reset = DEFAULT_CHECKLIST.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({ ...item, checked: false })),
    }));
    setCategories(reset);
    persistChecklist(reset);
  }, []);

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedItems = categories.reduce((acc, cat) => acc + cat.items.filter((i) => i.checked).length, 0);
  const progressPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  if (categories.length === 0) {
    return (
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#9B72CF] mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#9B72CF]" />
            <span className="text-sm font-semibold text-[#E8E8E8]">Pre-Publish Checklist</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#888888]">{checkedItems}/{totalItems} completed</span>
            <button onClick={resetChecklist} className="text-[10px] text-[#666666] hover:text-[#888888] transition-colors">Reset All</button>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              backgroundColor: progressPct >= 80 ? '#00C48C' : progressPct >= 40 ? '#F5A623' : '#E05252',
            }}
          />
        </div>
        <p className="text-[10px] text-[#666666] mt-1.5">{progressPct}% complete</p>
      </div>

      {/* Categories */}
      {categories.map((cat, catIdx) => (
        <div key={cat.name} className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#9B72CF]">{cat.icon}</span>
            <h4 className="text-xs font-bold text-[#E8E8E8] uppercase tracking-wider">{cat.name}</h4>
            <span className="text-[10px] text-[#666666] ml-auto">{cat.items.filter((i) => i.checked).length}/{cat.items.length}</span>
          </div>
          <div className="space-y-1">
            {cat.items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(catIdx, item.id)}
                className="flex items-start gap-2.5 w-full text-left px-2 py-1.5 rounded-md hover:bg-[#0D0D0D] transition-colors group"
              >
                {item.checked ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00C48C] flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-[#444444] group-hover:text-[#666666] flex-shrink-0 mt-0.5 transition-colors" />
                )}
                <span className={`text-sm transition-colors ${item.checked ? 'text-[#666666] line-through' : 'text-[#E8E8E8]'}`}>
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════
   PRE-UPLOAD TAB
   ════════════════════════════════════════════════ */
function PreUploadTab() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    algoScore: number;
    viralEst: string;
    strategy: string;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    /* Simulated analysis delay */
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setResult({
      algoScore: Math.floor(Math.random() * 40) + 55,
      viralEst: `${(Math.random() * 800 + 200).toFixed(0)}K – ${(Math.random() * 2000 + 1000).toFixed(0)}K`,
      strategy:
        'Your video has strong potential in the "How-To" category. Key recommendations:\n\n1. Optimize the first 8 seconds — front-load the hook and use pattern interrupts.\n2. Add chapters in the description for better search indexing.\n3. Use 8-12 long-tail keyword tags for discoverability.\n4. Schedule the premiere for Tuesday 2-4 PM EST for peak engagement.\n5. Create a Community Poll teaser 24 hours before publishing.',
    });
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? 'border-[#9B72CF] bg-[rgba(155,114,207,0.05)]'
            : 'border-[#222222] bg-[#111111] hover:border-[#444444]'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)] flex items-center justify-center mx-auto mb-3">
          <Upload className="w-7 h-7 text-[#9B72CF]" />
        </div>
        <p className="text-sm font-medium text-[#E8E8E8] mb-1">Drag & drop your video file</p>
        <p className="text-xs text-[#666666]">MP4, MOV, AVI up to 256 GB (simulated)</p>
      </div>

      {/* URL Input */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <label className="text-xs font-medium text-[#888888] mb-1.5 flex items-center gap-1">
          <Link className="w-3 h-3" /> Paste YouTube URL
        </label>
        <div className="flex gap-2">
          <input
            type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1 h-10 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="px-5 h-10 rounded-lg bg-[#9B72CF] text-white text-sm font-bold hover:bg-[#8A62BE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Analyze
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-6">
          <div className="flex items-center gap-3 mb-5">
            <Loader2 className="w-5 h-5 animate-spin text-[#9B72CF]" />
            <span className="text-sm font-medium text-[#E8E8E8]">Analyzing video...</span>
          </div>
          <div className="space-y-3">
            {[
              'Extracting video metadata',
              'Analyzing thumbnail & title',
              'Evaluating keyword strategy',
              'Scoring algorithmic potential',
              'Generating recommendations',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: i < 3 ? 'rgba(0,196,140,0.15)' : '#1A1A1A' }}>
                  {i < 3 ? (
                    <CheckCircle2 className="w-3 h-3 text-[#00C48C]" />
                  ) : (
                    <Loader2 className="w-3 h-3 text-[#666666] animate-spin" />
                  )}
                </div>
                <span className={`text-xs ${i < 3 ? 'text-[#888888]' : i === 3 ? 'text-[#E8E8E8] font-medium' : 'text-[#444444]'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9B72CF]" /> Analysis Complete
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Algorithm Score */}
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Algorithm Score</span>
              <div className="flex items-center gap-2 mt-2">
                <HealthGauge score={result.algoScore} />
              </div>
            </div>

            {/* Viral Estimate */}
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Estimated Views</span>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-5 h-5 text-[#00C48C]" />
                <span className="text-xl font-bold text-[#E8E8E8]">{result.viralEst}</span>
              </div>
              <p className="text-[10px] text-[#666666] mt-1">Based on niche, title, and upload timing</p>
            </div>
          </div>

          {/* Strategy */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex items-center gap-2 mb-3">
              <ChevronRight className="w-4 h-4 text-[#9B72CF]" />
              <span className="text-xs font-bold text-[#888888] uppercase tracking-wider">AI Strategy</span>
            </div>
            <p className="text-sm text-[#E8E8E8] leading-relaxed whitespace-pre-line">{result.strategy}</p>
          </div>
        </div>
      )}
    </div>
  );
}
