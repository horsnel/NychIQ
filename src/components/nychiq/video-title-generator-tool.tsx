'use client';

import React, { useState, useMemo } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Type,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Filter,
  TrendingUp,
  Flame,
  Heart,
  Zap,
  Lightbulb,
  ArrowRight,
  BarChart3,
  X,
  Hash,
} from 'lucide-react';

interface TitleIdea {
  id: number;
  title: string;
  ctrScore: number;
  emotionalTags: string[];
  category: string;
}

const MOCK_TITLES: TitleIdea[] = [
  { id: 1, title: 'I Tried the YouTube Algorithm Hack That Nobody Talks About', ctrScore: 94, emotionalTags: ['Curiosity', 'Secret'], category: 'Strategy' },
  { id: 2, title: 'How I Got 100K Subscribers in 30 Days (Not Clickbait)', ctrScore: 91, emotionalTags: ['Proof', 'Urgency'], category: 'Growth' },
  { id: 3, title: 'Stop Making This Thumbnail Mistake (Losing 60% of Views)', ctrScore: 88, emotionalTags: ['Fear', 'Loss'], category: 'Optimization' },
  { id: 4, title: 'The Shocking Truth About YouTube Shorts Nobody Tells You', ctrScore: 86, emotionalTags: ['Shock', 'Curiosity'], category: 'Shorts' },
  { id: 5, title: 'I Copied MrBeast\'s Exact Strategy for 7 Days — Here\'s What Happened', ctrScore: 92, emotionalTags: ['Experiment', 'Proof'], category: 'Strategy' },
  { id: 6, title: 'Why 99% of YouTubers Fail in the First Year (And How to Avoid It)', ctrScore: 83, emotionalTags: ['Fear', 'Hope'], category: 'Growth' },
  { id: 7, title: 'This Simple Trick Doubled My Video Views Overnight', ctrScore: 89, emotionalTags: ['Curiosity', 'Result'], category: 'Optimization' },
  { id: 8, title: 'YouTube\'s New Feature Is a Game Changer for Small Channels', ctrScore: 79, emotionalTags: ['Urgency', 'Opportunity'], category: 'Strategy' },
  { id: 9, title: 'I Asked ChatGPT to Write My Next Video — The Results Were Insane', ctrScore: 85, emotionalTags: ['Experiment', 'Shock'], category: 'AI' },
  { id: 10, title: 'The Perfect YouTube Upload Schedule Backed by Real Data', ctrScore: 77, emotionalTags: ['Authority', 'Proof'], category: 'Optimization' },
  { id: 11, title: 'What Happens When You Post Every Day for 30 Days Straight', ctrScore: 82, emotionalTags: ['Experiment', 'Curiosity'], category: 'Growth' },
  { id: 12, title: 'This Video Will Change How You Make YouTube Content Forever', ctrScore: 75, emotionalTags: ['Bold', 'Promise'], category: 'Strategy' },
];

const ALL_TAGS = ['Curiosity', 'Secret', 'Proof', 'Urgency', 'Fear', 'Loss', 'Shock', 'Experiment', 'Hope', 'Result', 'Opportunity', 'Authority', 'Bold', 'Promise'];
const ALL_CATEGORIES = ['Strategy', 'Growth', 'Optimization', 'Shorts', 'AI'];

const TAG_COLORS: Record<string, string> = {
  Curiosity: '#9B72CF', Secret: '#F5A623', Proof: '#00C48C', Urgency: '#E05252',
  Fear: '#E05252', Loss: '#E05252', Shock: '#F5A623', Experiment: '#4A9EFF',
  Hope: '#00C48C', Result: '#00C48C', Opportunity: '#4A9EFF', Authority: '#9B72CF',
  Bold: '#F5A623', Promise: '#9B72CF',
};

function CtrBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#00C48C' : score >= 80 ? '#4A9EFF' : score >= 70 ? '#F5A623' : '#E05252';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
      <TrendingUp className="w-3 h-3" style={{ color }} />
      <span className="text-xs font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

function EmotionalTag({ tag }: { tag: string }) {
  const color = TAG_COLORS[tag] || '#888888';
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
      style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
    >
      {tag}
    </span>
  );
}

export function VideoTitleGeneratorTool() {
  const { spendTokens } = useNychIQStore();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [titles, setTitles] = useState<TitleIdea[] | null>(null);
  const [generated, setGenerated] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const ok = spendTokens('video-title-generator');
    if (!ok) { setLoading(false); return; }
    await new Promise((r) => setTimeout(r, 2200));
    setTitles(MOCK_TITLES);
    setGenerated(true);
    setLoading(false);
  };

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const filteredTitles = useMemo(() => {
    if (!titles) return [];
    return titles.filter((t) => {
      if (activeTags.length > 0 && !activeTags.some((tag) => t.emotionalTags.includes(tag))) return false;
      if (activeCategory && t.category !== activeCategory) return false;
      return true;
    });
  }, [titles, activeTags, activeCategory]);

  const handleCopy = (title: string, id: number) => {
    navigator.clipboard.writeText(title);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    if (!filteredTitles.length) return;
    const text = filteredTitles.map((t) => `${t.title} (CTR: ${t.ctrScore}%)`).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const topScore = filteredTitles.length > 0 ? Math.max(...filteredTitles.map((t) => t.ctrScore)) : 0;
  const avgScore = filteredTitles.length > 0 ? Math.round(filteredTitles.reduce((s, t) => s + t.ctrScore, 0) / filteredTitles.length) : 0;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Input Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
              <Type className="w-5 h-5 text-[#9B72CF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Video Title Generator</h2>
              <p className="text-xs text-[#888888] mt-0.5">Generate high-CTR title ideas with emotional analysis for any topic.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Lightbulb className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                placeholder="Enter your video topic... (e.g., YouTube growth tips)"
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#9B72CF] text-white text-sm font-bold hover:bg-[#8A62BE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Titles
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-6">
          <div className="flex flex-col items-center py-8">
            <div className="w-12 h-12 rounded-xl bg-[rgba(155,114,207,0.1)] flex items-center justify-center mb-4 animate-pulse">
              <Sparkles className="w-6 h-6 text-[#9B72CF]" />
            </div>
            <p className="text-sm text-[#888888]">Generating creative title ideas...</p>
            <p className="text-[10px] text-[#555555] mt-1">Analyzing emotional triggers & CTR potential</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && titles && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Ideas Generated', value: titles.length, color: '#9B72CF', icon: Hash },
              { label: 'Top CTR', value: `${topScore}%`, color: '#00C48C', icon: Flame },
              { label: 'Avg CTR', value: `${avgScore}%`, color: '#4A9EFF', icon: BarChart3 },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: stat.color }} />
                  <div>
                    <p className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[10px] text-[#888888] uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter Tags */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-3.5 h-3.5 text-[#888888]" />
              <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">Filter by Emotion</h4>
              {activeTags.length > 0 && (
                <button onClick={() => setActiveTags([])} className="ml-auto p-1 rounded hover:bg-[#1A1A1A] transition-colors">
                  <X className="w-3 h-3 text-[#555555]" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    activeTags.includes(tag)
                      ? 'bg-[#9B72CF]/20 text-[#9B72CF] border border-[#9B72CF]/30'
                      : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#333333]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#555555] shrink-0">Category:</span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                        : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#333333]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title List */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider">
                Title Ideas
                <span className="text-[#555555] ml-1.5">({filteredTitles.length})</span>
              </h4>
              <button
                onClick={handleCopyAll}
                className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888888] hover:text-[#E8E8E8]"
                title="Copy all filtered titles"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-[480px] overflow-y-auto divide-y divide-[#1A1A1A]">
              {filteredTitles.length === 0 ? (
                <div className="py-12 text-center">
                  <Filter className="w-6 h-6 text-[#444444] mx-auto mb-2" />
                  <p className="text-sm text-[#888888]">No titles match your filters</p>
                  <button onClick={() => { setActiveTags([]); setActiveCategory(null); }} className="text-xs text-[#9B72CF] mt-2 hover:underline">Clear filters</button>
                </div>
              ) : (
                filteredTitles.map((item) => (
                  <div key={item.id} className="px-4 py-3 hover:bg-[#0D0D0D]/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#E8E8E8] leading-relaxed mb-2">{item.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.emotionalTags.map((tag) => (
                            <EmotionalTag key={tag} tag={tag} />
                          ))}
                          <span className="text-[10px] text-[#444444] ml-1">{item.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <CtrBadge score={item.ctrScore} />
                        <button
                          onClick={() => handleCopy(item.title, item.id)}
                          className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888888] hover:text-[#E8E8E8]"
                          title="Copy title"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !generated && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)] flex items-center justify-center mb-4">
            <Type className="w-8 h-8 text-[#9B72CF]" />
          </div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Generate Viral Titles</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Enter a topic and get 10+ title ideas with CTR predictions and emotional trigger analysis.</p>
        </div>
      )}
    </div>
  );
}
