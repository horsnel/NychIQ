'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import {
  Film, MessageSquare, Type, Palette, FileText, Clock,
  Layers, Activity, Scan, Wrench, ScrollText, Scale,
  ArrowRight, Sparkles, Timer, Bot, RefreshCw, Workflow, Mic,
} from 'lucide-react';

/* ── Types ── */
interface SubTool {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  tokens: number;
}

type StudioTab = 'repurposing' | 'visuals' | 'focus' | 'preupload';

/* ── Tool Data ── */
const TABS: { id: StudioTab; label: string; icon: React.ReactNode; count: number }[] = [
  { id: 'repurposing', label: 'Repurposing', icon: <Film className="w-3.5 h-3.5" />, count: 3 },
  { id: 'visuals', label: 'Visuals & Quotes', icon: <Palette className="w-3.5 h-3.5" />, count: 2 },
  { id: 'focus', label: 'Focus Tools', icon: <Timer className="w-3.5 h-3.5" />, count: 1 },
  { id: 'preupload', label: 'Pre-Upload Suite', icon: <Sparkles className="w-3.5 h-3.5" />, count: 9 },
];

const TOOLS_BY_TAB: Record<StudioTab, SubTool[]> = {
  repurposing: [
    {
      id: 'clipdrop',
      name: 'ClipDrop',
      subtitle: 'In-Browser Clip Trimmer & Reformatter',
      icon: <Film className="w-6 h-6" />,
      color: '#F5A623',
      glowColor: 'rgba(245,166,35,0.15)',
      tokens: TOKEN_COSTS['clipdrop'] ?? 0,
    },
    {
      id: 'echoes',
      name: 'Echoes',
      subtitle: 'Automatic Comment-to-Clip Generator',
      icon: <MessageSquare className="w-6 h-6" />,
      color: '#4A9EFF',
      glowColor: 'rgba(74,158,255,0.15)',
      tokens: TOKEN_COSTS['echoes'] ?? 0,
    },
    {
      id: 'reeltype',
      name: 'ReelType',
      subtitle: 'Silent Text-Animated Video Converter',
      icon: <Type className="w-6 h-6" />,
      color: '#9B72CF',
      glowColor: 'rgba(155,114,207,0.15)',
      tokens: TOKEN_COSTS['reeltype'] ?? 0,
    },
  ],
  visuals: [
    {
      id: 'quoteflip',
      name: 'QuoteFlip',
      subtitle: 'One-Click Quote Graphic Generator',
      icon: <Palette className="w-6 h-6" />,
      color: '#E05252',
      glowColor: 'rgba(224,82,82,0.15)',
      tokens: TOKEN_COSTS['quoteflip'] ?? 0,
    },
    {
      id: 'captioncraft',
      name: 'CaptionCraft',
      subtitle: 'On-Brand Caption Generator for Photos',
      icon: <FileText className="w-6 h-6" />,
      color: '#00C48C',
      glowColor: 'rgba(0,196,140,0.15)',
      tokens: TOKEN_COSTS['captioncraft'] ?? 0,
    },
  ],
  focus: [
    {
      id: 'pause',
      name: 'Pause',
      subtitle: 'Smart Infinite Scroll Blocker',
      icon: <Clock className="w-6 h-6" />,
      color: '#00C48C',
      glowColor: 'rgba(0,196,140,0.15)',
      tokens: TOKEN_COSTS['pause'] ?? 0,
    },
  ],
  preupload: [
    {
      id: 'lume',
      name: 'Lume',
      subtitle: 'Thumbnail A/B Simulator',
      icon: <Layers className="w-6 h-6" />,
      color: '#F5A623',
      glowColor: 'rgba(245,166,35,0.15)',
      tokens: TOKEN_COSTS['lume'] ?? 8,
    },
    {
      id: 'hooklab',
      name: 'HookLab',
      subtitle: 'Retention Predictor',
      icon: <Activity className="w-6 h-6" />,
      color: '#E05252',
      glowColor: 'rgba(224,82,82,0.15)',
      tokens: TOKEN_COSTS['hooklab'] ?? 10,
    },
    {
      id: 'pulsecheck',
      name: 'PulseCheck',
      subtitle: 'Algorithm Alignment',
      icon: <Scan className="w-6 h-6" />,
      color: '#00C48C',
      glowColor: 'rgba(0,196,140,0.15)',
      tokens: TOKEN_COSTS['pulsecheck'] ?? 5,
    },
    {
      id: 'blueprint-ai',
      name: 'Blueprint AI',
      subtitle: 'Metadata Architect',
      icon: <Wrench className="w-6 h-6" />,
      color: '#4A9EFF',
      glowColor: 'rgba(74,158,255,0.15)',
      tokens: TOKEN_COSTS['blueprint-ai'] ?? 5,
    },
    {
      id: 'scriptflow',
      name: 'ScriptFlow',
      subtitle: 'Dialogue Audit & Power Words',
      icon: <ScrollText className="w-6 h-6" />,
      color: '#9B72CF',
      glowColor: 'rgba(155,114,207,0.15)',
      tokens: TOKEN_COSTS['scriptflow'] ?? 8,
    },
    {
      id: 'arbitrage',
      name: 'Arbitrage',
      subtitle: 'Revenue Tagging',
      icon: <Scale className="w-6 h-6" />,
      color: '#D4A843',
      glowColor: 'rgba(212,168,67,0.15)',
      tokens: TOKEN_COSTS['arbitrage'] ?? 8,
    },
    {
      id: 'content-repurpose',
      name: 'Content Repurpose',
      subtitle: 'Turn videos into posts, shorts, tweets',
      icon: <RefreshCw className="w-6 h-6" />,
      color: '#4A9EFF',
      glowColor: 'rgba(74,158,255,0.15)',
      tokens: TOKEN_COSTS['content-repurpose'] ?? 3,
    },
    {
      id: 'video-pipeline',
      name: 'Video Pipeline',
      subtitle: 'Batch processing workflow builder',
      icon: <Workflow className="w-6 h-6" />,
      color: '#00C48C',
      glowColor: 'rgba(0,196,140,0.15)',
      tokens: TOKEN_COSTS['video-pipeline'] ?? 3,
    },
    {
      id: 'voice-style',
      name: 'Voice Style',
      subtitle: 'Tone & voice consistency checker',
      icon: <Mic className="w-6 h-6" />,
      color: '#E05252',
      glowColor: 'rgba(224,82,82,0.15)',
      tokens: TOKEN_COSTS['voice-style'] ?? 3,
    },
  ],
};

/* ── Tool Card ── */
function ToolCard({ tool, onLaunch }: { tool: SubTool; onLaunch: (id: string) => void }) {
  return (
    <button
      onClick={() => onLaunch(tool.id)}
      className="rounded-lg bg-[#111111] border border-[#222222] p-5 text-left hover:border-[#333333] transition-all duration-300 group hover:shadow-[0_0_24px_rgba(155,114,207,0.05)] animate-fade-in-up"
    >
      {/* Top accent */}
      <div className="h-0.5 w-full rounded-t-lg mb-4" style={{ backgroundColor: tool.color, opacity: 0.5 }} />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: tool.glowColor, color: tool.color }}
        >
          {tool.icon}
        </div>
        {tool.tokens > 0 && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ color: tool.color, backgroundColor: tool.glowColor }}
          >
            ⚡ {tool.tokens}
          </span>
        )}
        {tool.tokens === 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#00C48C] bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)]">
            FREE
          </span>
        )}
      </div>

      <h4 className="text-sm font-bold text-[#E8E8E8] group-hover:text-white transition-colors">
        {tool.name}
      </h4>
      <p className="text-[11px] text-[#888888] mt-1 leading-relaxed">
        {tool.subtitle}
      </p>

      <div
        className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 group-hover:gap-2.5"
        style={{
          backgroundColor: `${tool.color}12`,
          color: tool.color,
          border: `1px solid ${tool.color}28`,
        }}
      >
        Launch <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

/* ── Main Component ── */
export function ContentStudioTool() {
  const [activeTab, setActiveTab] = useState<StudioTab>('repurposing');
  const { setActiveTool } = useNychIQStore();

  const handleLaunch = (id: string) => {
    setActiveTool(id);
  };

  const tools = TOOLS_BY_TAB[activeTab];

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] px-4 sm:px-5 py-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#9B72CF 1px, transparent 1px), linear-gradient(90deg, #9B72CF 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg border border-[rgba(155,114,207,0.25)]" style={{ background: 'radial-gradient(circle, rgba(155,114,207,0.2) 0%, transparent 70%)' }}>
              <Sparkles className="w-5 h-5 text-[#9B72CF]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#E8E8E8] tracking-tight">Content Studio</h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-[#9B72CF] bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)]">15 TOOLS</span>
              </div>
              <p className="text-[11px] text-[#888888] mt-0.5">Create, repurpose, and optimize your content with AI-powered micro-tools.</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C48C] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C48C]" />
              </span>
              <span className="text-[10px] font-medium text-[#00C48C]">ALL ACTIVE</span>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 mt-4 -mb-1 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[rgba(155,114,207,0.15)] text-[#9B72CF] border border-[rgba(155,114,207,0.3)] shadow-[0_0_12px_rgba(155,114,207,0.1)]'
                    : 'text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] border border-transparent'
                }`}
              >
                {tab.icon} {tab.label}
                <span className="text-[10px] opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} onLaunch={handleLaunch} />
        ))}
      </div>

      {/* AI Upload Workflow Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, #F5A623 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9B72CF] to-[#F5A623] flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#E8E8E8]">Plan My Next Video</h3>
            <p className="text-[11px] text-[#888888] mt-0.5">Let AI analyze your channel and generate personalized content ideas, scripts, and optimization tips.</p>
          </div>
          <button
            onClick={() => setActiveTool('research-ideas')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#9B72CF] to-[#F5A623] text-black text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
