'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { copyToClipboard } from '@/lib/utils';
import { askAI } from '@/lib/api';
import {
  Key,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Search,
  BarChart3,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface KeywordResult {
  mainKeyword: string;
  searchVolume: string;
  relatedKeywords: Array<{
    keyword: string;
    volume: string;
    competition: 'Low' | 'Medium' | 'High';
  }>;
  opportunities: string[];
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#a0a0a0] hover:text-[#FFFFFF]" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-[#888888]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CompBadge({ level }: { level: string }) {
  const color = level === 'Low' ? '#888888' : level === 'Medium' ? '#FDBA2D' : '#888888';
  const bg = level === 'Low' ? 'rgba(16,185,129,0.1)' : level === 'Medium' ? 'rgba(253,186,45,0.1)' : 'rgba(239,68,68,0.1)';
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color, backgroundColor: bg }}>{level}</span>;
}


export function KeywordsTool() {
  const { spendTokens } = useNychIQStore();
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<KeywordResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);

  const handleExplore = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    setRawText(null);
    const ok = spendTokens('keywords');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube keyword research expert. Analyze the keyword: "${keyword.trim()}".

Return a JSON object with:
- "mainKeyword": the main keyword
- "searchVolume": estimated monthly search volume (e.g., "12.5K")
- "relatedKeywords": array of 6-8 related keywords, each with "keyword", "volume" (string like "8.2K"), and "competition" ("Low"/"Medium"/"High")
- "opportunities": array of 3-4 keyword opportunity suggestions (specific long-tail keywords to target)

Return ONLY the JSON object.`;

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
        mainKeyword: parsed.mainKeyword || keyword.trim(),
        searchVolume: parsed.searchVolume || '10K',
        relatedKeywords: Array.isArray(parsed.relatedKeywords) ? parsed.relatedKeywords : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to explore keywords. Please try again.');
      setResult(null);
      setRawText(null);
    } finally {
      setLoading(false);
    }
  };
  const allText = result ? `Main: ${result.mainKeyword}\nVolume: ${result.searchVolume}\n\nRelated:\n${result.relatedKeywords.map(k => `- ${k.keyword} (${k.volume}, ${k.competition})`).join('\n')}\n\nOpportunities:\n${result.opportunities.join('\n')}` : '';

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)]"><Key className="w-5 h-5 text-[#888888]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Keyword Explorer</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Discover high-volume, low-competition keywords for your YouTube content.</p>
            </div>
          </div>
          <div className="flex items-center rounded-full bg-[#0a0a0a] border border-[#1A1A1A] overflow-hidden">
            <Search className="ml-4 w-4 h-4 text-[#666666] shrink-0" />
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleExplore(); }}
              placeholder="Enter a keyword to explore..."
              className="flex-1 h-11 px-3 bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none transition-colors"
            />
            <button onClick={handleExplore} disabled={loading || !keyword.trim()} className="px-5 h-11 rounded-full bg-[#888888] text-white text-sm font-bold hover:bg-[#3A8EEF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              Explore
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#888888] mx-auto mb-3" />
          <p className="text-sm text-[#FFFFFF] mb-4">{error}</p>
          <button onClick={handleExplore} className="px-4 py-2 rounded-lg bg-[#888888] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <div className="h-6 bg-[#1A1A1A] rounded animate-pulse w-2/3 mb-3" />
            <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-3 flex items-center justify-between">
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-1/2" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Raw Text Fallback */}
      {!loading && rawText && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#888888]" /> Keyword Results (Raw)
          </h3>
          <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-4">
            <p className="text-[10px] text-[#888888] mb-2 font-medium">Could not format the AI response. Showing raw output:</p>
            <pre className="text-sm text-[#FFFFFF] whitespace-pre-wrap leading-relaxed font-sans">{rawText}</pre>
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          {/* Main keyword */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Main Keyword</h4>
                <p className="text-lg font-bold text-[#FFFFFF] mt-1">{result.mainKeyword}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#666666]">Search Volume</span>
                <p className="text-lg font-bold text-[#888888]">{result.searchVolume}<span className="text-xs text-[#666666] font-normal">/mo</span></p>
              </div>
            </div>
          </div>

          {/* Related keywords table */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Related Keywords</h4>
              <CopyBtn text={allText} />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {result.relatedKeywords.map((kw, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between border-b border-[#1A1A1A] last:border-0 hover:bg-[#0a0a0a] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-[#666666] w-4">{i + 1}</span>
                    <span className="text-sm text-[#FFFFFF] truncate">{kw.keyword}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[#a0a0a0]">{kw.volume}/mo</span>
                    <CompBadge level={kw.competition} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          {result.opportunities.length > 0 && (
            <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
              <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3">Keyword Opportunities</h4>
              <div className="space-y-2">
                {result.opportunities.map((opp, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-md bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)]">
                    <span className="text-[#888888] text-xs mt-0.5">●</span>
                    <p className="text-sm text-[#FFFFFF]">{opp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4"><Key className="w-8 h-8 text-[#888888]" /></div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Explore Keywords</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Enter a keyword to discover search volume, competition, and related terms.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS.keywords} tokens per search</div>}
    </div>
  );
}
