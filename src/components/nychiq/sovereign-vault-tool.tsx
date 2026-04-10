'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { copyToClipboard } from '@/lib/utils';
import {
  Archive,
  Search,
  Plus,
  Trash2,
  Download,
  FileText,
  GitCompare,
  BarChart3,
  FolderOpen,
  X,
  Save,
  Tag,
  Clock,
  Hash,
  Copy,
  Check,
  AlertCircle,
  Filter,
} from 'lucide-react';

/* ── Types ── */
interface VideoMetaEntry {
  id: string;
  type: 'video-meta';
  title: string;
  tags: string[];
  description: string;
  date: string;
  createdAt: string;
}

interface ABTestEntry {
  id: string;
  type: 'ab-archive';
  videoTitle: string;
  testType: 'thumbnail' | 'title';
  variantA: string;
  variantB: string;
  winner: 'A' | 'B' | 'pending';
  viewsA: number;
  viewsB: number;
  ctrA: number;
  ctrB: number;
  date: string;
  createdAt: string;
}

interface GrowthDataEntry {
  id: string;
  type: 'growth-data';
  month: string;
  subscribers: number;
  totalViews: number;
  avgWatchTime: number;
  revenue: number;
  createdAt: string;
}

type VaultEntry = VideoMetaEntry | ABTestEntry | GrowthDataEntry;

interface VaultData {
  videoMeta: VideoMetaEntry[];
  abArchive: ABTestEntry[];
  growthData: GrowthDataEntry[];
}

const STORAGE_KEY = 'nychiq_vault';

/* ── Default vault data ── */
const DEFAULT_VAULT: VaultData = {
  videoMeta: [
    {
      id: 'vm-1',
      type: 'video-meta',
      title: 'How I Made $10K/Month on YouTube Without Showing My Face',
      tags: ['youtube', 'passive income', 'faceless channel', 'monetization'],
      description: 'In this video, I share the exact strategies I used to build a faceless YouTube channel that generates $10,000+ per month in ad revenue and sponsorships.',
      date: '2025-01-15',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'vm-2',
      type: 'video-meta',
      title: 'Top 10 AI Tools That Will Replace Your Job in 2025',
      tags: ['AI', 'tools', 'productivity', 'future of work'],
      description: 'These 10 AI tools are so powerful they might just make your current job obsolete. From coding assistants to content creators, here is what you need to know.',
      date: '2025-02-20',
      createdAt: new Date().toISOString(),
    },
  ],
  abArchive: [
    {
      id: 'ab-1',
      type: 'ab-archive',
      videoTitle: 'Faceless YouTube Blueprint',
      testType: 'thumbnail',
      variantA: 'Yellow text + shocked face stock photo',
      variantB: 'Minimalist white text + gradient background',
      winner: 'A',
      viewsA: 142000,
      viewsB: 89000,
      ctrA: 12.4,
      ctrB: 7.8,
      date: '2025-01-18',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ab-2',
      type: 'ab-archive',
      videoTitle: 'AI Tools That Will Replace You',
      testType: 'title',
      variantA: 'Top 10 AI Tools That Will Replace Your Job in 2025',
      variantB: 'These AI Tools Are SCARY Powerful (You Won\'t Believe #7)',
      winner: 'B',
      viewsA: 215000,
      viewsB: 342000,
      ctrA: 8.1,
      ctrB: 14.2,
      date: '2025-02-22',
      createdAt: new Date().toISOString(),
    },
  ],
  growthData: [
    { id: 'gd-1', type: 'growth-data', month: '2025-01', subscribers: 12400, totalViews: 485000, avgWatchTime: 4.2, revenue: 1820, createdAt: new Date().toISOString() },
    { id: 'gd-2', type: 'growth-data', month: '2025-02', subscribers: 18700, totalViews: 623000, avgWatchTime: 4.8, revenue: 2640, createdAt: new Date().toISOString() },
    { id: 'gd-3', type: 'growth-data', month: '2025-03', subscribers: 28900, totalViews: 891000, avgWatchTime: 5.1, revenue: 3980, createdAt: new Date().toISOString() },
    { id: 'gd-4', type: 'growth-data', month: '2025-04', subscribers: 42300, totalViews: 1240000, avgWatchTime: 5.5, revenue: 5420, createdAt: new Date().toISOString() },
  ],
};

/* ── Vault helpers ── */
function loadVault(): VaultData {
  if (typeof window === 'undefined') return DEFAULT_VAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VAULT;
    const parsed = JSON.parse(raw) as VaultData;
    return {
      videoMeta: Array.isArray(parsed.videoMeta) ? parsed.videoMeta : DEFAULT_VAULT.videoMeta,
      abArchive: Array.isArray(parsed.abArchive) ? parsed.abArchive : DEFAULT_VAULT.abArchive,
      growthData: Array.isArray(parsed.growthData) ? parsed.growthData : DEFAULT_VAULT.growthData,
    };
  } catch {
    return DEFAULT_VAULT;
  }
}

function saveVault(data: VaultData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function genId() {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ── Main Component ── */
export function SovereignVaultTool() {
  const { tokenBalance } = useNychIQStore();
  const [vault, setVault] = useState<VaultData>(DEFAULT_VAULT);
  const [activeTab, setActiveTab] = useState<'overview' | 'video-meta' | 'ab-archive' | 'growth-data' | 'export'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  // Form state for adding video metadata
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState('');

  // Load vault on mount
  useEffect(() => {
    setVault(loadVault());
  }, []);

  // Persist vault on change
  useEffect(() => {
    saveVault(vault);
  }, [vault]);

  // Computed stats
  const totalItems = vault.videoMeta.length + vault.abArchive.length + vault.growthData.length;
  const categories = 3;
  const lastBackup = useMemo(() => {
    const allDates = [
      ...vault.videoMeta.map((e) => e.createdAt),
      ...vault.abArchive.map((e) => e.createdAt),
      ...vault.growthData.map((e) => e.createdAt),
    ];
    if (allDates.length === 0) return 'Never';
    const latest = new Date(Math.max(...allDates.map((d) => new Date(d).getTime())));
    const diff = Date.now() - latest.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, [vault]);

  // Filter entries by search
  const filteredMeta = useMemo(() => {
    if (!searchQuery.trim()) return vault.videoMeta;
    const q = searchQuery.toLowerCase();
    return vault.videoMeta.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.description.toLowerCase().includes(q)
    );
  }, [vault.videoMeta, searchQuery]);

  const filteredAB = useMemo(() => {
    if (!searchQuery.trim()) return vault.abArchive;
    const q = searchQuery.toLowerCase();
    return vault.abArchive.filter(
      (e) =>
        e.videoTitle.toLowerCase().includes(q) ||
        e.variantA.toLowerCase().includes(q) ||
        e.variantB.toLowerCase().includes(q)
    );
  }, [vault.abArchive, searchQuery]);

  const filteredGrowth = useMemo(() => {
    if (!searchQuery.trim()) return vault.growthData;
    const q = searchQuery.toLowerCase();
    return vault.growthData.filter((e) => e.month.toLowerCase().includes(q));
  }, [vault.growthData, searchQuery]);

  // CRUD operations
  const deleteEntry = (category: keyof VaultData, id: string) => {
    setVault((prev) => ({
      ...prev,
      [category]: prev[category].filter((e) => e.id !== id),
    }));
  };

  const handleAddVideoMeta = () => {
    if (!formTitle.trim()) return;
    const entry: VideoMetaEntry = {
      id: genId(),
      type: 'video-meta',
      title: formTitle.trim(),
      tags: formTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      description: formDesc.trim(),
      date: formDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    setVault((prev) => ({
      ...prev,
      videoMeta: [entry, ...prev.videoMeta],
    }));
    setFormTitle('');
    setFormTags('');
    setFormDesc('');
    setFormDate('');
    setShowAddForm(false);
  };

  const handleExportAll = async () => {
    const ok = await copyToClipboard(JSON.stringify(vault, null, 2));
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nychiq-vault-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Tabs ── */
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FolderOpen },
    { id: 'video-meta' as const, label: 'Video Metadata', icon: FileText },
    { id: 'ab-archive' as const, label: 'A/B Archive', icon: GitCompare },
    { id: 'growth-data' as const, label: 'Growth Data', icon: BarChart3 },
    { id: 'export' as const, label: 'Export', icon: Download },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
                <Archive className="w-5 h-5 text-[#9B72CF]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E8E8E8]">Sovereign Vault</h2>
                <p className="text-xs text-[#888888] mt-0.5">Your personal data vault — everything stays on your device</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] text-[10px] font-bold text-[#10B981] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              LOCAL ONLY
            </span>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all vault items..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#141414] border border-[#222222] text-[#E8E8E8] text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/40 focus:ring-1 focus:ring-[#9B72CF]/20 transition-all"
          />
        </div>
        {(searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-2.5 rounded-lg bg-[#141414] border border-[#222222] text-[#888888] hover:text-[#E8E8E8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )) || (
          <div className="p-2.5 rounded-lg bg-[#141414] border border-[#222222]">
            <Filter className="w-4 h-4 text-[#666666]" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#9B72CF]/10 text-[#9B72CF] border border-[#9B72CF]/20'
                : 'bg-[#141414] border border-[#222222] text-[#888888] hover:text-[#E8E8E8] hover:border-[#333333]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#141414] border border-[#222222] p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-[rgba(155,114,207,0.1)] flex items-center justify-center mx-auto mb-2">
                <Hash className="w-4 h-4 text-[#9B72CF]" />
              </div>
              <p className="text-xl font-bold text-[#E8E8E8]">{totalItems}</p>
              <p className="text-[10px] text-[#888888] mt-1">Total Saved Items</p>
            </div>
            <div className="rounded-lg bg-[#141414] border border-[#222222] p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-[rgba(74,158,255,0.1)] flex items-center justify-center mx-auto mb-2">
                <FolderOpen className="w-4 h-4 text-[#4A9EFF]" />
              </div>
              <p className="text-xl font-bold text-[#E8E8E8]">{categories}</p>
              <p className="text-[10px] text-[#888888] mt-1">Categories</p>
            </div>
            <div className="rounded-lg bg-[#141414] border border-[#222222] p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-[rgba(16,185,129,0.1)] flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-[#10B981]" />
              </div>
              <p className="text-sm font-bold text-[#E8E8E8] mt-1">{lastBackup}</p>
              <p className="text-[10px] text-[#888888] mt-1">Last Update</p>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setActiveTab('video-meta')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#9B72CF]/30 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.15)]">
                <FileText className="w-4 h-4 text-[#9B72CF]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#E8E8E8] group-hover:text-[#9B72CF] transition-colors">Video Metadata</p>
                <p className="text-[10px] text-[#888888]">{vault.videoMeta.length} entries saved</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ab-archive')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#4A9EFF]/30 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)] border border-[rgba(74,158,255,0.15)]">
                <GitCompare className="w-4 h-4 text-[#4A9EFF]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#E8E8E8] group-hover:text-[#4A9EFF] transition-colors">A/B Archive</p>
                <p className="text-[10px] text-[#888888]">{vault.abArchive.length} tests recorded</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('growth-data')}
              className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#10B981]/30 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.15)]">
                <BarChart3 className="w-4 h-4 text-[#10B981]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#E8E8E8] group-hover:text-[#10B981] transition-colors">Growth Data</p>
                <p className="text-[10px] text-[#888888]">{vault.growthData.length} snapshots</p>
              </div>
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg bg-[rgba(155,114,207,0.04)] border border-[rgba(155,114,207,0.1)] px-4 py-3">
            <p className="text-xs text-[#888888] flex items-center gap-2">
              <Archive className="w-3.5 h-3.5 text-[#9B72CF] flex-shrink-0" />
              All data is stored locally in your browser using localStorage. No data is sent to any server. Your vault is entirely under your control.
            </p>
          </div>
        </div>
      )}

      {/* ── VIDEO METADATA TAB ── */}
      {activeTab === 'video-meta' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#9B72CF]" /> Saved Video Metadata
              <span className="text-[10px] text-[#666666] font-normal ml-1">{filteredMeta.length} entries</span>
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
              style={{
                background: showAddForm ? '#1A1A1A' : 'rgba(155,114,207,0.1)',
                border: showAddForm ? '1px solid #222222' : '1px solid rgba(155,114,207,0.2)',
                color: showAddForm ? '#888888' : '#9B72CF',
              }}
            >
              {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showAddForm ? 'Cancel' : 'Add New'}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="rounded-lg bg-[#141414] border border-[#9B72CF]/20 p-5 space-y-4">
              <div>
                <label className="text-[11px] text-[#888888] font-medium uppercase tracking-wider block mb-1.5">Video Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Enter video title..."
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#222222] text-[#E8E8E8] text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/40 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#888888] font-medium uppercase tracking-wider block mb-1.5">Tags (comma-separated)</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666666]" />
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="youtube, seo, tutorial..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#222222] text-[#E8E8E8] text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/40 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#888888] font-medium uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Video description..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#222222] text-[#E8E8E8] text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/40 transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#888888] font-medium uppercase tracking-wider block mb-1.5">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#222222] text-[#E8E8E8] text-sm focus:outline-none focus:border-[#9B72CF]/40 transition-all"
                />
              </div>
              <button
                onClick={handleAddVideoMeta}
                disabled={!formTitle.trim()}
                className="px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: formTitle.trim() ? '#9B72CF' : '#333333' }}
              >
                <Save className="w-3.5 h-3.5" /> Save to Vault
              </button>
            </div>
          )}

          {/* Entries List */}
          {filteredMeta.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-[#333333] mx-auto mb-3" />
              <p className="text-sm text-[#888888]">No video metadata saved yet</p>
              <p className="text-xs text-[#666666] mt-1">Click &quot;Add New&quot; to save your first entry</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMeta.map((entry) => (
                <div key={entry.id} className="rounded-lg bg-[#141414] border border-[#222222] p-4 group hover:border-[#333333] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#E8E8E8] mb-1.5 truncate">{entry.title}</h4>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-[#0D0D0D] border border-[#1A1A1A] text-[10px] text-[#888888]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-[#666666] line-clamp-2">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-[#555555]" />
                        <span className="text-[10px] text-[#555555]">{entry.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEntry('videoMeta', entry.id)}
                      className="p-1.5 rounded-md hover:bg-[rgba(239,68,68,0.1)] text-[#555555] hover:text-[#EF4444] transition-all opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── A/B ARCHIVE TAB ── */}
      {activeTab === 'ab-archive' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-1.5">
            <GitCompare className="w-4 h-4 text-[#4A9EFF]" /> A/B Test Archive
            <span className="text-[10px] text-[#666666] font-normal ml-1">{filteredAB.length} tests</span>
          </h3>

          {filteredAB.length === 0 ? (
            <div className="text-center py-12">
              <GitCompare className="w-10 h-10 text-[#333333] mx-auto mb-3" />
              <p className="text-sm text-[#888888]">No A/B tests recorded yet</p>
              <p className="text-xs text-[#666666] mt-1">Use the A/B Tester tool to run tests, results are auto-saved here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAB.map((entry) => (
                <div key={entry.id} className="rounded-lg bg-[#141414] border border-[#222222] p-4 group hover:border-[#333333] transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-[#E8E8E8]">{entry.videoTitle}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-[rgba(74,158,255,0.1)] border border-[rgba(74,158,255,0.2)] text-[10px] font-medium text-[#4A9EFF]">
                          {entry.testType}
                        </span>
                        <span className="text-[10px] text-[#555555] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {entry.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          entry.winner === 'A'
                            ? 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)] text-[#10B981]'
                            : entry.winner === 'B'
                            ? 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)] text-[#10B981]'
                            : 'bg-[rgba(253,186,45,0.1)] border-[rgba(253,186,45,0.2)] text-[#FDBA2D]'
                        }`}
                      >
                        {entry.winner === 'pending' ? '⏳ Pending' : `Winner: ${entry.winner}`}
                      </span>
                      <button
                        onClick={() => deleteEntry('abArchive', entry.id)}
                        className="p-1.5 rounded-md hover:bg-[rgba(239,68,68,0.1)] text-[#555555] hover:text-[#EF4444] transition-all opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Variant Comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-md p-3 border ${entry.winner === 'A' ? 'bg-[rgba(16,185,129,0.03)] border-[rgba(16,185,129,0.15)]' : 'bg-[#0D0D0D] border-[#1A1A1A]'}`}>
                      <p className="text-[10px] text-[#666666] font-medium mb-1.5">VARIANT A</p>
                      <p className="text-xs text-[#E8E8E8] mb-2">{entry.variantA}</p>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#888888]">Views: <span className="text-[#E8E8E8] font-semibold">{entry.viewsA.toLocaleString()}</span></span>
                        <span className="text-[#888888]">CTR: <span className="text-[#E8E8E8] font-semibold">{entry.ctrA}%</span></span>
                      </div>
                    </div>
                    <div className={`rounded-md p-3 border ${entry.winner === 'B' ? 'bg-[rgba(16,185,129,0.03)] border-[rgba(16,185,129,0.15)]' : 'bg-[#0D0D0D] border-[#1A1A1A]'}`}>
                      <p className="text-[10px] text-[#666666] font-medium mb-1.5">VARIANT B</p>
                      <p className="text-xs text-[#E8E8E8] mb-2">{entry.variantB}</p>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#888888]">Views: <span className="text-[#E8E8E8] font-semibold">{entry.viewsB.toLocaleString()}</span></span>
                        <span className="text-[#888888]">CTR: <span className="text-[#E8E8E8] font-semibold">{entry.ctrB}%</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── GROWTH DATA TAB ── */}
      {activeTab === 'growth-data' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#10B981]" /> Monthly Growth Snapshots
            <span className="text-[10px] text-[#666666] font-normal ml-1">{filteredGrowth.length} months</span>
          </h3>

          {filteredGrowth.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-10 h-10 text-[#333333] mx-auto mb-3" />
              <p className="text-sm text-[#888888]">No growth data recorded</p>
              <p className="text-xs text-[#666666] mt-1">Manually add monthly snapshots to track your channel growth</p>
            </div>
          ) : (
            <>
              {/* Visual Growth Chart (CSS bars) */}
              <div className="rounded-lg bg-[#141414] border border-[#222222] p-5">
                <p className="text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-4">Subscriber Growth</p>
                <div className="flex items-end gap-2 h-32">
                  {filteredGrowth.map((entry) => {
                    const maxSubs = Math.max(...filteredGrowth.map((e) => e.subscribers), 1);
                    const height = (entry.subscribers / maxSubs) * 100;
                    return (
                      <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-[#888888] font-medium">{(entry.subscribers / 1000).toFixed(1)}K</span>
                        <div
                          className="w-full rounded-t-sm transition-all duration-500"
                          style={{ height: `${height}%`, background: 'linear-gradient(to top, #9B72CF, #9B72CF80)', minHeight: 4 }}
                        />
                        <span className="text-[9px] text-[#555555]">{entry.month.split('-')[1]}/{entry.month.split('-')[0].slice(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1A1A1A]">
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#666666] uppercase tracking-wider">Month</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold text-[#666666] uppercase tracking-wider">Subscribers</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold text-[#666666] uppercase tracking-wider">Total Views</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold text-[#666666] uppercase tracking-wider">Avg Watch</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-bold text-[#666666] uppercase tracking-wider">Revenue</th>
                        <th className="px-4 py-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]">
                      {filteredGrowth.map((entry) => (
                        <tr key={entry.id} className="group hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="px-4 py-3 text-xs text-[#E8E8E8] font-medium">{entry.month}</td>
                          <td className="px-4 py-3 text-xs text-[#E8E8E8] text-right font-semibold">{entry.subscribers.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-[#E8E8E8] text-right">{entry.totalViews.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-[#E8E8E8] text-right">{entry.avgWatchTime}m</td>
                          <td className="px-4 py-3 text-xs text-[#10B981] text-right font-semibold">${entry.revenue.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deleteEntry('growthData', entry.id)}
                              className="p-1 rounded-md hover:bg-[rgba(239,68,68,0.1)] text-[#555555] hover:text-[#EF4444] transition-all opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── EXPORT TAB ── */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-1.5">
            <Download className="w-4 h-4 text-[#9B72CF]" /> Export Vault Data
          </h3>

          <div className="rounded-lg bg-[#141414] border border-[#222222] p-5 space-y-4">
            <p className="text-sm text-[#888888]">
              Export all your vault data as JSON. You can use this for backups, migration, or data analysis.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2.5 text-center">
                <p className="text-[10px] text-[#666666]">Video Meta</p>
                <p className="text-sm font-bold text-[#E8E8E8]">{vault.videoMeta.length}</p>
              </div>
              <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2.5 text-center">
                <p className="text-[10px] text-[#666666]">A/B Tests</p>
                <p className="text-sm font-bold text-[#E8E8E8]">{vault.abArchive.length}</p>
              </div>
              <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2.5 text-center">
                <p className="text-[10px] text-[#666666]">Growth Data</p>
                <p className="text-sm font-bold text-[#E8E8E8]">{vault.growthData.length}</p>
              </div>
              <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2.5 text-center">
                <p className="text-[10px] text-[#666666]">Total Size</p>
                <p className="text-sm font-bold text-[#E8E8E8]">{(new Blob([JSON.stringify(vault)]).size / 1024).toFixed(1)}KB</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportAll}
                className="flex-1 px-4 py-3 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#9B72CF' }}
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy as JSON
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadJSON}
                className="flex-1 px-4 py-3 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                style={{ background: '#1A1A1A', border: '1px solid #222222', color: '#E8E8E8' }}
              >
                <Download className="w-4 h-4" /> Download .json
              </button>
            </div>

            {/* Preview */}
            <div>
              <p className="text-[11px] text-[#666666] font-medium mb-2">Preview (first 500 chars)</p>
              <pre className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] p-3 text-[10px] text-[#888888] overflow-x-auto max-h-48 overflow-y-auto font-mono leading-relaxed">
                {JSON.stringify(vault, null, 2).slice(0, 500)}
                {JSON.stringify(vault).length > 500 ? '\n...' : ''}
              </pre>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.1)] p-5">
            <h4 className="text-sm font-semibold text-[#EF4444] mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Danger Zone
            </h4>
            <p className="text-xs text-[#888888] mb-3">Permanently delete all vault data from this browser. This action cannot be undone.</p>
            <button
              onClick={() => {
                if (confirm('Are you sure? This will delete ALL vault data permanently.')) {
                  localStorage.removeItem(STORAGE_KEY);
                  setVault(DEFAULT_VAULT);
                }
              }}
              className="px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-xs font-medium text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)] transition-colors"
            >
              Delete All Vault Data
            </button>
          </div>
        </div>
      )}

      {/* Token Cost Footer */}
      <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['sovereign-vault']} tokens (FREE tool)</div>
    </div>
  );
}
