'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  RefreshCw,
  Loader2,
  Sparkles,
  Link,
  Scissors,
  Clock,
  Video,
  Smartphone,
  MonitorSmartphone,
  MessageSquare,
  FileText,
  Instagram,
  Twitter,
  Youtube,
  CheckCircle2,
  Flame,
  TrendingUp,
  Zap,
  Play,
  BarChart3,
} from 'lucide-react';

interface Segment {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  duration: string;
  viralityScore: number;
  platformFit: string[];
  type: 'hook' | 'story' | 'tip' | 'quote' | 'reaction';
}

interface PlatformSuggestion {
  platform: string;
  icon: React.ElementType;
  color: string;
  contentType: string;
  suggestedCount: number;
  avgVirality: number;
}

const MOCK_SEGMENTS: Segment[] = [
  { id: 1, title: 'Shocking opening statement about YouTube growth', startTime: '0:00', endTime: '0:15', duration: '15s', viralityScore: 92, platformFit: ['Shorts', 'Reels', 'TikTok'], type: 'hook' },
  { id: 2, title: 'Personal story about hitting 100K subscribers', startTime: '1:23', endTime: '2:47', duration: '1:24', viralityScore: 87, platformFit: ['Reels', 'TikTok', 'Twitter'], type: 'story' },
  { id: 3, title: 'The "3-second rule" for thumbnails explained', startTime: '3:10', endTime: '3:58', duration: '48s', viralityScore: 79, platformFit: ['Shorts', 'TikTok', 'Instagram'], type: 'tip' },
  { id: 4, title: '"Most creators overthink this one thing" — key quote', startTime: '5:42', endTime: '6:05', duration: '23s', viralityScore: 95, platformFit: ['Twitter', 'TikTok', 'LinkedIn'], type: 'quote' },
  { id: 5, title: 'Reaction to competitor\'s viral thumbnail strategy', startTime: '7:15', endTime: '8:30', duration: '1:15', viralityScore: 81, platformFit: ['Shorts', 'Reels', 'YouTube'], type: 'reaction' },
  { id: 6, title: 'Actionable 5-step framework for video titles', startTime: '9:00', endTime: '10:22', duration: '1:22', viralityScore: 74, platformFit: ['YouTube', 'Blog', 'Newsletter'], type: 'tip' },
  { id: 7, title: 'Emotional closing call-to-action moment', startTime: '11:45', endTime: '12:30', duration: '45s', viralityScore: 68, platformFit: ['Reels', 'TikTok', 'Shorts'], type: 'reaction' },
];

const MOCK_PLATFORMS: PlatformSuggestion[] = [
  { platform: 'YouTube Shorts', icon: Youtube, color: '#E05252', contentType: 'Vertical clips (< 60s)', suggestedCount: 4, avgVirality: 85 },
  { platform: 'Instagram Reels', icon: Instagram, color: '#9B72CF', contentType: 'Vertical clips + Stories', suggestedCount: 3, avgVirality: 82 },
  { platform: 'TikTok', icon: Smartphone, color: '#4A9EFF', contentType: 'Short clips + Duets', suggestedCount: 4, avgVirality: 88 },
  { platform: 'Twitter/X', icon: Twitter, color: '#F5A623', contentType: 'Quotes + Thread hooks', suggestedCount: 2, avgVirality: 76 },
];

const TYPE_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  hook: { color: '#00C48C', icon: Zap },
  story: { color: '#9B72CF', icon: MessageSquare },
  tip: { color: '#4A9EFF', icon: Sparkles },
  quote: { color: '#F5A623', icon: FileText },
  reaction: { color: '#E05252', icon: Flame },
};

function ViralityBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#00C48C' : score >= 80 ? '#4A9EFF' : score >= 70 ? '#F5A623' : '#E05252';
  const label = score >= 90 ? 'Viral' : score >= 80 ? 'Hot' : score >= 70 ? 'Good' : 'Low';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
      <TrendingUp className="w-3 h-3" style={{ color }} />
      <span className="text-[10px] font-bold" style={{ color }}>{label} {score}</span>
    </div>
  );
}

function SegmentCard({ segment }: { segment: Segment }) {
  const config = TYPE_CONFIG[segment.type];
  const Icon = config.icon;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#333333] transition-colors">
      <div className="p-1.5 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: `${config.color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-[#E8E8E8] font-medium leading-relaxed mb-1.5">{segment.title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-[#888888]">
            <Clock className="w-3 h-3" />
            <span>{segment.startTime} - {segment.endTime}</span>
            <span className="text-[#555555]">({segment.duration})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {segment.platformFit.map((p) => (
              <span key={p} className="px-1.5 py-0.5 rounded text-[9px] font-medium text-[#888888] bg-[#1A1A1A]">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
      <ViralityBadge score={segment.viralityScore} />
    </div>
  );
}

export function ContentRepurposeTool() {
  const { spendTokens } = useNychIQStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [platforms, setPlatforms] = useState<PlatformSuggestion[] | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setAnalyzed(true);
    const ok = spendTokens('content-repurpose');
    if (!ok) { setLoading(false); return; }
    await new Promise((r) => setTimeout(r, 2500));
    setSegments(MOCK_SEGMENTS);
    setPlatforms(MOCK_PLATFORMS);
    setLoading(false);
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 3000));
    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 4000);
  };

  const totalPotential = segments ? segments.length * 3 : 0;
  const topVirality = segments ? Math.max(...segments.map((s) => s.viralityScore)) : 0;
  const avgVirality = segments ? Math.round(segments.reduce((s, seg) => s + seg.viralityScore, 0) / segments.length) : 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Input Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
              <RefreshCw className="w-5 h-5 text-[#00C48C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Content Repurpose Engine</h2>
              <p className="text-xs text-[#888888] mt-0.5">Turn any video into platform-ready clips with AI-detected viral segments.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
                placeholder="Paste a YouTube video URL..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#00C48C]/50 transition-colors"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#00C48C] text-[#0A0A0A] text-sm font-bold hover:bg-[#00B07C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze & Detect Segments
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-6">
          <div className="flex flex-col items-center py-8">
            <div className="w-12 h-12 rounded-xl bg-[rgba(0,196,140,0.1)] flex items-center justify-center mb-4 animate-pulse">
              <Scissors className="w-6 h-6 text-[#00C48C]" />
            </div>
            <p className="text-sm text-[#888888]">Analyzing video content...</p>
            <p className="text-[10px] text-[#555555] mt-1">Detecting viral segments & optimal clips</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && segments && (
        <div className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Segments Found', value: segments.length, color: '#00C48C', icon: Scissors },
              { label: 'Potential Clips', value: totalPotential, color: '#4A9EFF', icon: Video },
              { label: 'Top Virality', value: `${topVirality}`, color: '#F5A623', icon: Flame },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: stat.color }} />
                  <div>
                    <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] text-[#888888] uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detected Segments */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-[#00C48C]" />
                <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Detected Segments</h4>
              </div>
              <span className="text-[10px] text-[#555555]">Avg virality: <span className="text-[#4A9EFF] font-bold">{avgVirality}</span></span>
            </div>
            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
              {segments
                .sort((a, b) => b.viralityScore - a.viralityScore)
                .map((segment) => (
                <SegmentCard key={segment.id} segment={segment} />
              ))}
            </div>
          </div>

          {/* Platform Suggestions */}
          {platforms && (
            <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A1A1A]">
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="w-3.5 h-3.5 text-[#4A9EFF]" />
                  <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Platform Suggestions</h4>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#1A1A1A]">
                {platforms.map((plat) => {
                  const PlatIcon = plat.icon;
                  return (
                    <div key={plat.platform} className="p-4 hover:bg-[#0D0D0D]/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <PlatIcon className="w-4 h-4" style={{ color: plat.color }} />
                        <span className="text-sm font-semibold text-[#E8E8E8]">{plat.platform}</span>
                      </div>
                      <p className="text-[10px] text-[#888888] mb-2">{plat.contentType}</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-base font-bold" style={{ color: plat.color }}>{plat.suggestedCount}</p>
                          <p className="text-[9px] text-[#555555] uppercase">Clips</p>
                        </div>
                        <div>
                          <p className="text-base font-bold" style={{ color: plat.color }}>{plat.avgVirality}</p>
                          <p className="text-[9px] text-[#555555] uppercase">Avg Score</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Generate All Button */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            {generated ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle2 className="w-5 h-5 text-[#00C48C]" />
                <span className="text-sm font-semibold text-[#00C48C]">All {totalPotential} clips generated successfully!</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#E8E8E8]">Ready to generate {totalPotential} platform-ready clips?</p>
                  <p className="text-xs text-[#888888] mt-0.5">AI will auto-format each segment for its best-fit platform.</p>
                </div>
                <button
                  onClick={handleGenerateAll}
                  disabled={generating}
                  className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#00C48C] text-[#0A0A0A] text-sm font-bold hover:bg-[#00B07C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate All Clips
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !analyzed && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)] flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-[#00C48C]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Repurpose Your Content</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Paste any YouTube video URL to detect viral segments and generate platform-ready clips.</p>
        </div>
      )}
    </div>
  );
}
