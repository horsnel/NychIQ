'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import {
  SearchCode, Anchor, Key, FileText, Lightbulb, Clock, ClipboardCheck,
  GitCompare, Activity, Image as ImageIcon, ShieldCheck, BellRing, Radar, Stethoscope,
  Cpu, Handshake, History, ArrowRight, Zap, Sparkles, Target, Type, Monitor, Upload, Search,
} from 'lucide-react';

interface SubTool {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  tokens: number;
}

const SEO_TOOLS: SubTool[] = [
  { id: 'seo', name: 'SEO Optimizer', subtitle: 'Full SEO audit for every video', icon: <SearchCode className="w-6 h-6" />, color: '#4A9EFF', glowColor: 'rgba(74,158,255,0.15)', tokens: TOKEN_COSTS['seo'] ?? 5 },
  { id: 'hook', name: 'Hook Generator', subtitle: 'AI-powered hook creation', icon: <Anchor className="w-6 h-6" />, color: '#F5A623', glowColor: 'rgba(245,166,35,0.15)', tokens: TOKEN_COSTS['hook'] ?? 8 },
  { id: 'keywords', name: 'Keyword Explorer', subtitle: 'Long-tail keywords & tags', icon: <Key className="w-6 h-6" />, color: '#9B72CF', glowColor: 'rgba(155,114,207,0.15)', tokens: TOKEN_COSTS['keywords'] ?? 2 },
  { id: 'script', name: 'Script Writer', subtitle: 'Full script generation', icon: <FileText className="w-6 h-6" />, color: '#00C48C', glowColor: 'rgba(0,196,140,0.15)', tokens: TOKEN_COSTS['script'] ?? 12 },
  { id: 'ideas', name: 'Video Ideas', subtitle: 'AI content idea generator', icon: <Lightbulb className="w-6 h-6" />, color: '#F5A623', glowColor: 'rgba(245,166,35,0.15)', tokens: TOKEN_COSTS['ideas'] ?? 6 },
  { id: 'posttime', name: 'Best Post Time', subtitle: 'Optimal upload scheduler', icon: <Clock className="w-6 h-6" />, color: '#4A9EFF', glowColor: 'rgba(74,158,255,0.15)', tokens: TOKEN_COSTS['posttime'] ?? 5 },
  { id: 'audit', name: 'Channel Audit', subtitle: 'Complete channel health check', icon: <ClipboardCheck className="w-6 h-6" />, color: '#E05252', glowColor: 'rgba(224,82,82,0.15)', tokens: TOKEN_COSTS['audit'] ?? 20 },
  { id: 'ab-test', name: 'A/B Tester', subtitle: 'Thumbnail & title testing', icon: <GitCompare className="w-6 h-6" />, color: '#9B72CF', glowColor: 'rgba(155,114,207,0.15)', tokens: TOKEN_COSTS['ab-test'] ?? 8 },
  { id: 'vph-tracker', name: 'VPH Tracker', subtitle: 'Views per hour analytics', icon: <Activity className="w-6 h-6" />, color: '#00C48C', glowColor: 'rgba(0,196,140,0.15)', tokens: TOKEN_COSTS['vph-tracker'] ?? 2 },
  { id: 'thumbnail-lab', name: 'Thumbnail Lab', subtitle: 'AI thumbnail analysis', icon: <ImageIcon className="w-6 h-6" />, color: '#F5A623', glowColor: 'rgba(245,166,35,0.15)', tokens: TOKEN_COSTS['thumbnail-lab'] ?? 8 },
  { id: 'safe-check', name: 'Safe Check', subtitle: 'Copyright & compliance scan', icon: <ShieldCheck className="w-6 h-6" />, color: '#00C48C', glowColor: 'rgba(0,196,140,0.15)', tokens: TOKEN_COSTS['safe-check'] ?? 5 },
  { id: 'trend-alerts', name: 'Trend Alerts', subtitle: 'Real-time trend notifications', icon: <BellRing className="w-6 h-6" />, color: '#E05252', glowColor: 'rgba(224,82,82,0.15)', tokens: TOKEN_COSTS['trend-alerts'] ?? 3 },
  { id: 'outlier-scout', name: 'Outlier Scout', subtitle: 'Find viral outlier videos', icon: <Radar className="w-6 h-6" />, color: '#4A9EFF', glowColor: 'rgba(74,158,255,0.15)', tokens: TOKEN_COSTS['outlier-scout'] ?? 12 },
  { id: 'perf-forensics', name: 'Perf Forensics', subtitle: 'Deep performance analysis', icon: <Stethoscope className="w-6 h-6" />, color: '#9B72CF', glowColor: 'rgba(155,114,207,0.15)', tokens: TOKEN_COSTS['perf-forensics'] ?? 15 },
  { id: 'automation', name: 'Automation Master', subtitle: 'Workflow automation engine', icon: <Cpu className="w-6 h-6" />, color: '#F5A623', glowColor: 'rgba(245,166,35,0.15)', tokens: TOKEN_COSTS['automation'] ?? 10 },
  { id: 'sponsorship-roi', name: 'Sponsorship ROI', subtitle: 'Brand deal value estimator', icon: <Handshake className="w-6 h-6" />, color: '#00C48C', glowColor: 'rgba(0,196,140,0.15)', tokens: TOKEN_COSTS['sponsorship-roi'] ?? 8 },
  { id: 'history-intel', name: 'History Intel', subtitle: 'Historical data archive', icon: <History className="w-6 h-6" />, color: '#E05252', glowColor: 'rgba(224,82,82,0.15)', tokens: TOKEN_COSTS['history-intel'] ?? 10 },
  { id: 'keyword-gap', name: 'Keyword Gap', subtitle: 'Find competitor keywords you\'re missing', icon: <Key className="w-6 h-6" />, color: '#F5A623', glowColor: 'rgba(245,166,35,0.15)', tokens: TOKEN_COSTS['keyword-gap'] ?? 5 },
  { id: 'ranking-tracker', name: 'Ranking Tracker', subtitle: 'Monitor keyword positions daily', icon: <Target className="w-6 h-6" />, color: '#9B72CF', glowColor: 'rgba(155,114,207,0.15)', tokens: TOKEN_COSTS['ranking-tracker'] ?? 5 },
  { id: 'thumbnail-title-analyzer', name: 'Thumbnail/Title Analyzer', subtitle: 'CTR prediction & scoring', icon: <ImageIcon className="w-6 h-6" />, color: '#E05252', glowColor: 'rgba(224,82,82,0.15)', tokens: TOKEN_COSTS['thumbnail-title-analyzer'] ?? 8 },
  { id: 'description-templates', name: 'Description Templates', subtitle: 'AI-optimized descriptions', icon: <FileText className="w-6 h-6" />, color: '#00C48C', glowColor: 'rgba(0,196,140,0.15)', tokens: TOKEN_COSTS['description-templates'] ?? 5 },
  { id: 'video-title-generator', name: 'Video Title Generator', subtitle: 'High-CTR title suggestions', icon: <Type className="w-6 h-6" />, color: '#4A9EFF', glowColor: 'rgba(74,158,255,0.15)', tokens: TOKEN_COSTS['video-title-generator'] ?? 5 },
  { id: 'end-screen-optimizer', name: 'End Screen Optimizer', subtitle: 'End screen placement analysis', icon: <Monitor className="w-6 h-6" />, color: '#00C48C', glowColor: 'rgba(0,196,140,0.15)', tokens: TOKEN_COSTS['end-screen-optimizer'] ?? 5 },
  { id: 'auto-upload', name: 'Auto Upload', subtitle: 'Scheduled auto-upload engine', icon: <Upload className="w-6 h-6" />, color: '#F5A623', glowColor: 'rgba(245,166,35,0.15)', tokens: TOKEN_COSTS['auto-upload'] ?? 8 },
  { id: 'search-page', name: 'Search Page Optimizer', subtitle: 'Optimize search presence', icon: <Search className="w-6 h-6" />, color: '#9B72CF', glowColor: 'rgba(155,114,207,0.15)', tokens: TOKEN_COSTS['search-page'] ?? 3 },
];

export function SeoHubTool() {
  const [search, setSearch] = useState('');
  const { setActiveTool } = useNychIQStore();

  const filtered = search.trim()
    ? SEO_TOOLS.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.subtitle.toLowerCase().includes(search.toLowerCase()))
    : SEO_TOOLS;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] px-4 sm:px-5 py-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#4A9EFF 1px, transparent 1px), linear-gradient(90deg, #4A9EFF 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg border border-[rgba(74,158,255,0.25)]" style={{ background: 'radial-gradient(circle, rgba(74,158,255,0.2) 0%, transparent 70%)' }}>
              <SearchCode className="w-5 h-5 text-[#4A9EFF]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#E8E8E8] tracking-tight">SEO & Optimization</h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-[#4A9EFF] bg-[rgba(74,158,255,0.1)] border border-[rgba(74,158,255,0.2)]">25 TOOLS</span>
              </div>
              <p className="text-[11px] text-[#888888] mt-0.5">Optimize every aspect of your YouTube content for maximum discoverability and growth.</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-3 flex items-center gap-2 bg-[#0A0A0A] rounded-lg px-3 py-2 border border-[#1E1E1E] focus-within:border-[#4A9EFF]/40 transition-colors">
            <Sparkles className="w-4 h-4 text-[#555]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SEO tools..."
              className="flex-1 bg-transparent text-xs text-[#E8E8E8] placeholder-[#444] outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[10px] text-[#555] hover:text-[#E8E8E8]">Clear</button>
            )}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="rounded-lg bg-[#111111] border border-[#222222] p-4 text-left hover:border-[#333333] transition-all duration-300 group hover:shadow-[0_0_20px_rgba(74,158,255,0.05)]"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: tool.glowColor, color: tool.color }}
              >
                {tool.icon}
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: tool.color, backgroundColor: tool.glowColor }}>
                <Zap className="w-2.5 h-2.5" /> {tool.tokens}
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#E8E8E8] group-hover:text-white transition-colors">{tool.name}</h4>
            <p className="text-[11px] text-[#888888] mt-1">{tool.subtitle}</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold" style={{ color: tool.color }}>
              Launch <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#666] text-sm">
          No tools found for &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  );
}
