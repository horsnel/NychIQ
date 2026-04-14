'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  Wrench,
  Loader2,
  Copy,
  Check,
  FileText,
  Hash,
  Search,
  Globe,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Tag,
  Clock,
} from 'lucide-react';

/* ── Types ── */
interface BlueprintResult {
  titles: { text: string; chars: number }[];
  description: string;
  tags: string[];
  hashtags: string[];
  searchablePhrases: string[];
}

const CATEGORIES = [
  'How-To & Education',
  'Entertainment',
  'Tech & Gadgets',
  'Finance & Business',
  'Health & Fitness',
  'Gaming',
  'Vlogs & Lifestyle',
  'Music & Arts',
  'News & Politics',
  'Food & Cooking',
  'Travel & Adventure',
  'Comedy & Skits',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'pi', label: 'Pidgin' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
];

/* ── Copy Button ── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    copyToClipboard(text).then(() => {
      setCopied(true);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[#a0a0a0] hover:text-[#888888] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ── Char Count Color ── */
function CharBadge({ count }: { count: number }) {
  const color = count <= 60 ? '#888888' : count <= 70 ? '#F6A828' : '#888888';
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color, backgroundColor: `${color}15` }}>
      {count} chars
    </span>
  );
}

/* ── Mock Data ── */
function getMockBlueprint(topic: string, lang: string): BlueprintResult {
  return {
    titles: [
      { text: `How to Master ${topic} in 2025 (Complete Guide)`, chars: 50 },
      { text: `${topic}: The Ultimate Tutorial for Beginners`, chars: 49 },
      { text: `I Tried ${topic} for 30 Days — Here's What Happened`, chars: 54 },
    ],
    description: `In this video, I break down everything you need to know about ${topic}. Whether you're a complete beginner or looking to level up, this guide covers it all.\n\nTimestamps:\n0:00 - Introduction\n2:30 - What is ${topic}?\n5:00 - Getting Started\n7:45 - Essential Tips & Tricks\n10:30 - Common Mistakes to Avoid\n13:00 - Advanced Strategies\n15:30 - Real-World Examples\n18:00 - Final Thoughts & Q&A\n\nIf you found this helpful, smash that LIKE button and SUBSCRIBE for more content like this! Drop a comment below with your biggest question about ${topic}.\n\n#youtube #tutorial #howto`,
    tags: [
      `${topic} tutorial`, `${topic} guide`, `how to ${topic.toLowerCase()}`, `${topic} for beginners`,
      `${topic} 2025`, `best ${topic.toLowerCase()} tips`, `${topic} explained`, `learn ${topic.toLowerCase()}`,
      `${topic} step by step`, `${topic} tips and tricks`, `${topic} review`, `${topic} vs competitors`,
    ],
    hashtags: [
      `#${topic.replace(/\s+/g, '')}`, '#YouTubeGrowth', '#ContentCreator', '#Tutorial',
      '#LearnOnline', '#HowTo', '#BeginnerGuide', '#ViralContent',
    ],
    searchablePhrases: [
      `best ${topic.toLowerCase()} tutorial for beginners 2025`,
      `how to get started with ${topic.toLowerCase()} step by step`,
      `${topic.toLowerCase()} tips that nobody tells you`,
      `${topic.toLowerCase()} complete guide for free`,
      `what is ${topic.toLowerCase()} and how does it work`,
      `top ${topic.toLowerCase()} strategies for 2025`,
    ],
  };
}

/* ════════════════════════════════════════════════
   BLUEPRINT AI TOOL
   ════════════════════════════════════════════════ */
export function BlueprintAITool() {
  const { spendTokens } = useNychIQStore();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const langLabel = LANGUAGES.find((l) => l.code === language)?.label ?? 'English';

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('blueprint-ai');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube SEO metadata architect. Generate a complete metadata package for a video about: "${trimmed}"${category ? ` in category "${category}"` : ''}. Language: ${langLabel}.

Return a JSON object with these exact keys:
- "titles": array of 3 title variations (each object with "text" and "chars" fields)
- "description": a full YouTube description with auto-generated timestamps (0:00, 2:30, 5:00, etc.), include a call-to-action, and relevant hashtags
- "tags": array of 10-15 optimized SEO tags
- "hashtags": array of 5-8 hashtags
- "searchablePhrases": array of 5-7 long-tail keyword phrases people search for

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setResult({
        titles: Array.isArray(parsed.titles)
          ? parsed.titles.map((t: any) => ({ text: t.text || '', chars: t.chars || t.text?.length || 0 }))
          : getMockBlueprint(trimmed, language).titles,
        description: typeof parsed.description === 'string' ? parsed.description : getMockBlueprint(trimmed, language).description,
        tags: Array.isArray(parsed.tags) ? parsed.tags : getMockBlueprint(trimmed, language).tags,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : getMockBlueprint(trimmed, language).hashtags,
        searchablePhrases: Array.isArray(parsed.searchablePhrases) ? parsed.searchablePhrases : getMockBlueprint(trimmed, language).searchablePhrases,
      });
    } catch {
      setResult(getMockBlueprint(trimmed, language));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!result) return;
    const all = [
      '=== TITLES ===',
      ...result.titles.map((t) => `${t.text} (${t.chars} chars)`),
      '\n=== DESCRIPTION ===',
      result.description,
      '\n=== TAGS ===',
      result.tags.join(', '),
      '\n=== HASHTAGS ===',
      result.hashtags.join(' '),
      '\n=== SEARCHABLE PHRASES ===',
      ...result.searchablePhrases,
    ].join('\n');
    copyToClipboard(all).then(() => showToast('Full metadata copied!', 'success'));
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
              <Wrench className="w-5 h-5" style={{ color: '#aaa' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Blueprint AI</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Metadata Architect — Generate complete SEO metadata packs</p>
            </div>
          </div>
          <p className="text-sm text-[#a0a0a0] mb-4">
            Paste a video topic and AI generates a full metadata structure: titles, description with timestamps, tags, hashtags, and searchable phrases.
          </p>

          {/* Topic Input */}
          <div className="space-y-2">
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                placeholder="Enter video topic or keyword..."
                className="w-full h-11 pl-10 pr-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none transition-colors"
                style={{ caretColor: '#888888' }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(34,197,94,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
              />
            </div>

            {/* Dropdowns Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Category Dropdown */}
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                <button
                  onClick={() => { setCatOpen(!catOpen); setLangOpen(false); }}
                  className="w-full h-10 pl-10 pr-10 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-left flex items-center justify-between transition-colors hover:border-[#1a1a1a]"
                >
                  <span className={category ? 'text-[#FFFFFF]' : 'text-[#666666]'}>
                    {category || 'Category (optional)'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                </button>
                {catOpen && (
                  <div className="absolute z-20 top-full mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-[#151515] border border-[rgba(255,255,255,0.03)] shadow-xl">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCategory(c); setCatOpen(false); }}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-[#1A1A1A] transition-colors ${category === c ? 'text-[#888888]' : 'text-[#FFFFFF]'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Language Dropdown */}
              <div className="relative w-full sm:w-44">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                <button
                  onClick={() => { setLangOpen(!langOpen); setCatOpen(false); }}
                  className="w-full h-10 pl-10 pr-10 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-left flex items-center justify-between transition-colors hover:border-[#1a1a1a]"
                >
                  <span className="text-[#FFFFFF]">{langLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                </button>
                {langOpen && (
                  <div className="absolute z-20 top-full mt-1 w-full rounded-lg bg-[#151515] border border-[rgba(255,255,255,0.03)] shadow-xl">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-[#1A1A1A] transition-colors ${language === l.code ? 'text-[#888888]' : 'text-[#FFFFFF]'}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="px-5 h-10 rounded-lg text-[#0a0a0a] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                style={{ backgroundColor: '#888888' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Blueprint
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click-outside for dropdowns */}
      {(catOpen || langOpen) && (
        <div className="fixed inset-0 z-10" onClick={() => { setCatOpen(false); setLangOpen(false); }} />
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-5 text-center">
          <p className="text-sm text-[#888888] mb-3">{error}</p>
          <button onClick={handleGenerate} className="px-4 py-2 rounded-lg bg-[#888888]/10 text-[#888888] text-xs font-medium hover:bg-[#888888]/20 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-5">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-4/5" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-3/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#aaa' }} />
              Metadata Blueprint
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={handleCopyAll} className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: '#aaa' }}>
                <Copy className="w-3 h-3" /> Copy All
              </button>
              <button onClick={handleGenerate} className="flex items-center gap-1 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
          </div>

          {/* Title Variations */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" style={{ color: '#aaa' }} /> Title Variations
              </h4>
            </div>
            <div className="space-y-2">
              {result.titles.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] group hover:border-[rgba(255,255,255,0.03)] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-[#666666] shrink-0">#{i + 1}</span>
                    <p className="text-sm text-[#FFFFFF] truncate">{t.text}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CharBadge count={t.chars} />
                    <CopyBtn text={t.text} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" style={{ color: '#aaa' }} /> Description
              </h4>
              <CopyBtn text={result.description} />
            </div>
            <pre className="text-sm text-[#FFFFFF] whitespace-pre-wrap leading-relaxed font-sans max-h-64 overflow-y-auto p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">{result.description}</pre>
          </div>

          {/* Tags */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" style={{ color: '#aaa' }} /> Optimized Tags ({result.tags.length})
              </h4>
              <CopyBtn text={result.tags.join(', ')} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.tags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs text-[#FFFFFF] bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[#1a1a1a] transition-colors">{tag}</span>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" style={{ color: '#aaa' }} /> Hashtags
              </h4>
              <CopyBtn text={result.hashtags.join(' ')} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.hashtags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors" style={{ color: '#888888', backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.03)' }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Searchable Phrases */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" style={{ color: '#aaa' }} /> Searchable Phrases (Long-tail Keywords)
              </h4>
              <CopyBtn text={result.searchablePhrases.join('\n')} />
            </div>
            <div className="space-y-1.5">
              {result.searchablePhrases.map((phrase, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[rgba(255,255,255,0.03)] transition-colors">
                  <Search className="w-3 h-3 text-[#666666] shrink-0" />
                  <p className="text-sm text-[#FFFFFF]">{phrase}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-4" style={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.03)' }}>
            <Wrench className="w-8 h-8" style={{ color: '#aaa' }} />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Generate Your Metadata Blueprint</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Enter a video topic above to generate a complete SEO metadata pack with titles, description, tags, and more.
          </p>
        </div>
      )}

      {/* Token Cost Footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#666666]">
          Cost: {TOKEN_COSTS['blueprint-ai']} tokens per analysis
        </div>
      )}
    </div>
  );
}
