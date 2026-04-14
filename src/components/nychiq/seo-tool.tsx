'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { copyToClipboard } from '@/lib/utils';
import { askAI } from '@/lib/api';
import {
  SearchCode,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Globe,
  Users,
  Type,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const LANGUAGES = ['English', 'Yoruba', 'Pidgin', 'Igbo', 'Hausa'];
const AUDIENCES = ['Nigeria', 'US', 'UK', 'India', 'Global'];

interface SEOResult {
  titles: string[];
  description: string;
  tags: string[];
  hashtags: string[];
  thumbnailConcept: string;
  bestTimeToPost: string;
}

/* ── Copy Button ── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#a0a0a0] hover:text-[#FFFFFF]" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-[#888888]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ── Title color coding ── */
function titleColorClass(len: number): string {
  if (len < 55) return 'text-[#888888]';
  if (len <= 70) return 'text-[#FDBA2D]';
  return 'text-[#888888]';
}


export function SEOTool() {
  const { spendTokens } = useNychIQStore();
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('English');
  const [audience, setAudience] = useState('Nigeria');
  const [result, setResult] = useState<SEOResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    setRawText(null);
    const ok = spendTokens('seo');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube SEO expert. Generate a complete SEO pack for a video about: "${topic.trim()}".
Language: ${language}. Target audience: ${audience}.

Return a JSON object with these exact fields:
- "titles": array of 3 title variations (each under 70 characters, click-optimized)
- "description": a compelling 200-250 character video description with keywords
- "tags": array of 8-12 comma-separated keyword tags
- "hashtags": array of 5-8 hashtags
- "thumbnailConcept": a detailed thumbnail concept (background, text overlay, color scheme, subject)
- "bestTimeToPost": best day and time to post for this niche/audience

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        setRawText(response);
        setResult(null);
        return;
      }
      setResult({
        titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 3) : ['Untitled Video', 'Untitled Video', 'Untitled Video'],
        description: parsed.description || 'No description generated.',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        thumbnailConcept: parsed.thumbnailConcept || 'No concept generated.',
        bestTimeToPost: parsed.bestTimeToPost || 'Not specified',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SEO pack. Please try again.');
      setResult(null);
      setRawText(null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]"><SearchCode className="w-5 h-5 text-[#FDBA2D]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">SEO Optimizer</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Generate fully optimized YouTube metadata — titles, description, tags, hashtags and thumbnail concept.</p>
            </div>
          </div>
          {/* Inputs */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#a0a0a0] flex items-center gap-1"><Type className="w-3 h-3" /> Video Topic</label>
                <span className="text-[10px] text-[#666666]">{topic.length}/120</span>
              </div>
              <input
                type="text" value={topic} onChange={(e) => setTopic(e.target.value.slice(0, 120))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                placeholder="Enter your video topic..."
                className="w-full h-11 px-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3" /> Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors appearance-none cursor-pointer">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" /> Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors appearance-none cursor-pointer">
                  {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate SEO Pack
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#888888] mx-auto mb-3" />
          <p className="text-sm text-[#FFFFFF] mb-4">{error}</p>
          <button onClick={handleGenerate} className="px-4 py-2 rounded-lg bg-[#888888] text-white text-sm font-medium hover:bg-[#555555] transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3 mb-3" />
              <div className="space-y-2"><div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" /><div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-3/4" /></div>
            </div>
          ))}
        </div>
      )}

      {/* Raw Text Fallback (parse failed) */}
      {!loading && rawText && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FDBA2D]" /> SEO Results (Raw)
          </h3>
          <div className="rounded-lg bg-[#0f0f0f] border border-[#FDBA2D]/30 p-4">
            <p className="text-[10px] text-[#FDBA2D] mb-2 font-medium">Could not format the AI response. Showing raw output:</p>
            <pre className="text-sm text-[#FFFFFF] whitespace-pre-wrap leading-relaxed font-sans">{rawText}</pre>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FDBA2D]" /> SEO Pack Generated
          </h3>

          {/* Titles */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3">Title Variations</h4>
            <div className="space-y-2">
              {result.titles.map((title, i) => (
                <div key={i} className="flex items-start justify-between gap-2 p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#666666] uppercase">Title {i + 1}</span>
                    <p className={`text-sm text-[#FFFFFF] mt-0.5 font-medium ${titleColorClass(title.length)}`}>{title}</p>
                    <span className={`text-[10px] ${titleColorClass(title.length)}`}>{title.length} chars {title.length < 55 ? '✓ Optimal' : title.length <= 70 ? '⚠ Good' : '✗ Too long'}</span>
                  </div>
                  <CopyBtn text={title} />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Description</h4>
              <CopyBtn text={result.description} />
            </div>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.description}</p>
            <span className="text-[10px] text-[#666666] mt-2 inline-block">{result.description.length} chars</span>
          </div>

          {/* Tags */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Tags</h4>
              <CopyBtn text={result.tags.join(', ')} />
            </div>
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs text-[#FFFFFF] bg-[#0a0a0a] border border-[#1A1A1A]">{tag}</span>
              ))}
            </div>
          </div>

          {/* Hashtags */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Hashtags</h4>
              <CopyBtn text={result.hashtags.join(' ')} />
            </div>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium text-[#FDBA2D] bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.03)]">{tag}</span>
              ))}
            </div>
          </div>

          {/* Thumbnail Concept */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Thumbnail Concept</h4>
              <CopyBtn text={result.thumbnailConcept} />
            </div>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.thumbnailConcept}</p>
          </div>

          {/* Best Time */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#888888]" />
                <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Best Time to Post</h4>
              </div>
              <CopyBtn text={result.bestTimeToPost} />
            </div>
            <p className="text-sm text-[#FFFFFF] mt-2">{result.bestTimeToPost}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4">
            <SearchCode className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Optimize Your Videos</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Enter a video topic to generate a complete SEO pack with titles, description, tags, and more.</p>
        </div>
      )}

      {searched && !loading && (
        <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS.seo} tokens per generation</div>
      )}
    </div>
  );
}
