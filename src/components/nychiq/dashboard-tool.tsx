'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNychIQStore, TOKEN_COSTS, TOOL_META } from '@/lib/store';
import { cn, fmtV, timeAgo, thumbUrl, copyToClipboard } from '@/lib/utils';
import { ytFetch } from '@/lib/api';
import {
  Search, Zap, TrendingUp, Eye, Heart, Coins,
  Flame, BarChart3, ArrowRight, Crown, Sparkles,
  Copy, Check, MoreHorizontal, ShieldCheck, Shield, Anchor, Image, Clock, FileText, SearchCode,
  Target, Cpu, BrainCircuit, Activity, Loader2, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';

/* ── Constants ── */
const QUICK_TOOLS = [
  { id: 'hooklab', label: 'HookLab', icon: Flame, color: '#8B5CF6' },
  { id: 'thumbnail-lab', label: 'Thumbnail Lab', icon: Image, color: '#EC4899' },
  { id: 'viral', label: 'Viral Predictor', icon: Zap, color: '#EF4444' },
  { id: 'posttime', label: 'Best Post Time', icon: Clock, color: '#FDBA2D' },
  { id: 'audit', label: 'Channel Audit', icon: ShieldCheck, color: '#10B981' },
  { id: 'ideas', label: 'Video Ideas', icon: Sparkles, color: '#3B82F6' },
  { id: 'seo', label: 'SEO Optimizer', icon: SearchCode, color: '#06B6D4' },
  { id: 'scriptflow', label: 'ScriptFlow', icon: FileText, color: '#6366F1' },
  { id: 'competitor', label: 'Competitor Track', icon: Target, color: '#F97316' },
  { id: 'trending', label: 'Analytics Deep Dive', icon: BarChart3, color: '#14B8A6' },
];

const ACTIVITY_ITEMS = [
  { icon: ShieldCheck, label: 'Recent Channel Audits', time: '2m ago', category: 'CHANNEL AUDITS', progress: 60, color: '#10B981' },
  { icon: TrendingUp, label: 'Viral Analysis', time: '2:02 am', category: 'VIRAL ANALYSIS', progress: 80, color: '#FDBA2D' },
  { icon: Anchor, label: 'Hook Generation', time: '0:27 am', category: 'HOOK GENERATION', progress: 40, color: '#8B5CF6' },
];

/* ── Copy Button ── */
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }, [text]);
  return (
    <button onClick={handleCopy} title={label || 'Copy'} className="p-1.5 rounded-full bg-[rgba(253,186,45,0.1)] hover:bg-[rgba(253,186,45,0.2)] transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#FDBA2D]" />}
    </button>
  );
}

/* ── Video Index Card ── */
function VideoIndexCard({ video }: { video: any }) {
  const videoId = video.id?.videoId || video.id;
  const title = video.snippet?.title || 'Untitled';
  const channel = video.snippet?.channelTitle || '';
  const thumb = video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '';
  const published = video.snippet?.publishedAt || '';
  const url = `https://youtube.com/watch?v=${videoId}`;

  return (
    <div className="shrink-0 w-[240px] rounded-xl bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] overflow-hidden group hover:border-[rgba(255,255,255,0.1)] transition-all duration-200">
      <div className="relative h-[135px] bg-[#141414] overflow-hidden">
        <img src={thumb} alt={title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-3 pb-4">
        <h4 className="text-sm text-[#FFFFFF] font-medium leading-snug line-clamp-2 mb-1">{title}</h4>
        <p className="text-[11px] text-[#555555]">{channel} {published ? `• ${timeAgo(published)}` : ''}</p>
        <div className="flex items-center justify-end mt-2">
          <CopyButton text={`${url}\n${title}`} label="Copy URL & title" />
        </div>
      </div>
    </div>
  );
}

/* ── Growth Chart ── */
function GrowthChart() {
  const { region } = useNychIQStore();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [data, setData] = useState<{ labels: string[]; values: number[]; prev: number[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchChart() {
      try {
        const res = await ytFetch('charts', { type: 'trending', region });
        if (cancelled) return;
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const labels: string[] = [];
        const values: number[] = [];
        const prev: number[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en', { weekday: 'short' }));
          values.push(Math.floor(Math.random() * 80000 + 20000));
          prev.push(Math.floor(Math.random() * 60000 + 15000));
        }
        setData({ labels, values, prev });
      } catch {
        if (cancelled) return;
        const days = range === '7d' ? 7 : range === '30d' ? 14 : 20;
        const labels: string[] = [];
        const values: number[] = [];
        const prev: number[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en', { weekday: 'short' }));
          values.push(Math.floor(30000 + Math.sin(i * 0.5) * 20000 + i * 1500));
          prev.push(Math.floor(25000 + Math.sin(i * 0.5) * 15000 + i * 1000));
        }
        setData({ labels, values, prev });
      }
    }
    fetchChart();
    return () => { cancelled = true; };
  }, [range, region]);

  const rangeBtns: Array<{ key: '7d' | '30d' | '90d'; label: string }> = [
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
  ];

  if (!data) {
    return (
      <div className="w-full h-[280px] rounded-2xl bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#FDBA2D] animate-spin" />
      </div>
    );
  }

  const maxVal = Math.max(...data.values, ...data.prev, 1) * 1.15;
  const width = 800;
  const height = 200;
  const pad = { top: 10, right: 20, bottom: 30, left: 50 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const pts = data.values.map((v, i) => ({
    x: pad.left + (i / (data.values.length - 1)) * chartW,
    y: pad.top + chartH - (v / maxVal) * chartH,
  }));
  const prevPts = data.prev.map((v, i) => ({
    x: pad.left + (i / (data.prev.length - 1)) * chartW,
    y: pad.top + chartH - (v / maxVal) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.top + chartH} L ${pts[0].x} ${pad.top + chartH} Z`;
  const prevLinePath = prevPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const fmtAxis = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(0) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return String(n);
  };

  const labelStep = Math.max(1, Math.floor(data.labels.length / 7));

  return (
    <div className="w-full h-[280px] rounded-2xl bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#FFFFFF]">Growth Trend</h3>
        <div className="flex gap-1 p-0.5 rounded-lg bg-[#0D0D0D] border border-[rgba(255,255,255,0.05)]">
          {rangeBtns.map((b) => (
            <button key={b.key} onClick={() => setRange(b.key)}
              className={cn('px-3 py-1 rounded-md text-xs font-medium transition-all', range === b.key ? 'bg-[rgba(253,186,45,0.15)] text-[#FDBA2D]' : 'text-[#555555] hover:text-[#A3A3A3]')}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = pad.top + chartH * (1 - frac);
            return (
              <g key={frac}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={pad.left - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill="#555555">{fmtAxis(maxVal * frac)}</text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#dashGrad)" />
          <path d={prevLinePath} fill="none" stroke="#555555" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill="#0D0D0D" stroke="#10B981" strokeWidth="2" />
              {i % labelStep === 0 && <text x={p.x} y={height - 6} textAnchor="middle" className="text-[10px]" fill="#555555">{data.labels[i]}</text>}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ── Quick Tool Card ── */
function QuickToolCard({ tool }: { tool: typeof QUICK_TOOLS[0] }) {
  const { setActiveTool } = useNychIQStore();
  const Icon = tool.icon;
  return (
    <button onClick={() => setActiveTool(tool.id)}
      className="flex items-center justify-between w-[160px] h-[80px] p-3 rounded-xl bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] hover:bg-[#252525] transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${tool.color}20`, color: tool.color }}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[13px] font-medium text-[#FFFFFF] text-left leading-tight">{tool.label}</span>
      </div>
      <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-[#555555] hover:text-[#A3A3A3]">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </button>
  );
}

/* ── Activity Card ── */
function ActivityCard({ item }: { item: typeof ACTIVITY_ITEMS[0] }) {
  const Icon = item.icon;
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-[#141414] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[#FFFFFF] truncate">{item.label}</h4>
          <p className="text-[11px] text-[#555555]">{item.time}</p>
        </div>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FDBA2D]">{item.category}</span>
      <div className="w-full h-1 rounded-full bg-[#0D0D0D] overflow-hidden">
        <div className="h-full rounded-full bg-[#FDBA2D]" style={{ width: `${item.progress}%` }} />
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export function DashboardTool() {
  const { userName, setActiveTool, region, personalChannel } = useNychIQStore();
  const [videos, setVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [toolsScroll, setToolsScroll] = useState(0);

  // Fetch recent videos for channel
  useEffect(() => {
    if (!personalChannel?.linked) { setVideosLoading(false); return; }
    let cancelled = false;
    async function fetch() {
      try {
        setVideosLoading(true);
        const res = await ytFetch('search', { channelId: personalChannel.youtubeChannelId, maxResults: 6, type: 'video', order: 'date', regionCode: region });
        if (!cancelled) setVideos(res?.items || []);
      } catch { if (!cancelled) setVideos([]); }
      finally { if (!cancelled) setVideosLoading(false); }
    }
    fetch();
    return () => { cancelled = true; };
  }, [personalChannel?.linked, personalChannel?.youtubeChannelId, region]);

  // Quick tools scroll
  const toolsRef = React.useRef<HTMLDivElement>(null);
  const scrollTools = (dir: number) => {
    if (toolsRef.current) {
      toolsRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
      setToolsScroll(toolsRef.current.scrollLeft);
    }
  };

  const displayName = userName || 'Noah';

  return (
    <div className="space-y-0 animate-fade-in-up">
      {/* ═══ WELCOME + VIDEO INDEX ═══ */}
      <h2 className="text-2xl font-bold mb-6" style={{ background: 'linear-gradient(135deg, #FDBA2D, #FDE68A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Welcome back, {displayName}!
      </h2>

      <div className="mb-6">
        <h3 className="text-base font-semibold text-[#FFFFFF] mb-4">Current Video Indexed</h3>
        {videosLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-[240px] h-[210px] rounded-xl bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] animate-pulse" />
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {videos.slice(0, 6).map((v: any, i: number) => (
              <VideoIndexCard key={i} video={v} />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-[240px] rounded-xl bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] p-4 flex flex-col items-center justify-center h-[210px]">
                <Eye className="w-8 h-8 text-[#333333] mb-2" />
                <p className="text-xs text-[#555555]">No videos yet</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ GROWTH TREND CHART ═══ */}
      <div className="mt-6">
        <GrowthChart />
      </div>

      {/* ═══ QUICK TOOLS GRID ═══ */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#FFFFFF]">Quick Tools</h3>
          <div className="flex gap-1">
            <button onClick={() => scrollTools(-1)} className="p-1.5 rounded-lg hover:bg-[#1F1F1F] text-[#555555] hover:text-[#A3A3A3] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTools(1)} className="p-1.5 rounded-lg hover:bg-[#1F1F1F] text-[#555555] hover:text-[#A3A3A3] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div ref={toolsRef} className="overflow-x-auto pb-2 no-scrollbar">
          <div className="flex gap-4 min-w-max">
            {QUICK_TOOLS.map((tool) => (
              <QuickToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RECENT ACTIVITY ═══ */}
      <div className="mt-6 rounded-2xl bg-[#1F1F1F] border border-[rgba(255,255,255,0.05)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#FFFFFF]">Recent Activity</h3>
          <button className="text-xs font-medium text-[#FDBA2D] hover:text-[#FDE68A] transition-colors">View All</button>
        </div>
        <div className="flex gap-4">
          {ACTIVITY_ITEMS.map((item, i) => (
            <ActivityCard key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
