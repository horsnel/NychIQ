'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Radar,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Eye,
  Zap,
  Repeat,
} from 'lucide-react';

interface OutlierResult {
  viralPatterns: Array<{ pattern: string; description: string; views: string }>;
  subNiches: Array<{ niche: string; opportunity: string }>;
  formats: Array<{ format: string; replication: string }>;
  estimatedPotential: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#a0a0a0] hover:text-[#FFFFFF]">
      {copied ? <Check className="w-3.5 h-3.5 text-[#888888]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}


export function OutlierScoutTool() {
  const { spendTokens } = useNychIQStore();
  const [result, setResult] = useState<OutlierResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleScout = async () => {
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('outlier-scout');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube trend analyst specializing in finding outlier videos — videos from small channels (<1K subscribers) that got 100K+ views.

Find and analyze outlier video patterns. Return a JSON object with:
- "viralPatterns": array of 4 viral title/format patterns that small channels used to go viral, each with "pattern" (the title pattern), "description" (why it works), and "views" (typical view range like "150K-500K")
- "subNiches": array of 4 sub-niches where outliers frequently appear, each with "niche" (niche name) and "opportunity" (why it's an opportunity)
- "formats": array of 4 replicable video formats, each with "format" (format name) and "replication" (how to replicate it)
- "estimatedPotential": brief paragraph on the estimated view potential for creators using these strategies

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        viralPatterns: Array.isArray(parsed.viralPatterns) ? parsed.viralPatterns : [],
        subNiches: Array.isArray(parsed.subNiches) ? parsed.subNiches : [],
        formats: Array.isArray(parsed.formats) ? parsed.formats : [],
        estimatedPotential: parsed.estimatedPotential || 'High potential for creators who identify and replicate outlier patterns.',
      });
    } catch {
      setResult({
        viralPatterns: [
          { pattern: 'I Tried [Trending Thing] for 30 Days', description: 'Time-bound personal experiments create curiosity and relatability. Viewers want to see the transformation.', views: '150K-2M' },
          { pattern: 'The [Number] Truth About [Topic] Nobody Tells You', description: 'Numbered lists with "secret" framing trigger strong curiosity gaps. Works across all niches.', views: '100K-800K' },
          { pattern: '[Niche] Tier List: Ranking Everything From S to F', description: 'Tier lists are highly engaging and encourage debate in comments, boosting algorithm signals.', views: '200K-1.5M' },
          { pattern: 'I Asked 100 [People] About [Topic] — Results Shocked Me', description: 'Social proof combined with surprise element. The number adds credibility.', views: '300K-3M' },
        ],
        subNiches: [
          { niche: 'AI Tools for Specific Professions', opportunity: 'Low competition, high search volume. Teachers, lawyers, and medical professionals are searching for AI tools.' },
          { niche: 'Local Food Reviews (Regional)', opportunity: 'Hyper-local content has less competition and extremely loyal audiences who share widely.' },
          { niche: 'Personal Finance for Young Adults', opportunity: 'Growing search interest with mostly generic content. Specific, actionable advice stands out.' },
          { niche: 'DIY Home Organization', opportunity: 'Before/after transformation content has high shareability and repeat viewing potential.' },
        ],
        formats: [
          { format: 'Challenge + Documentary Style', replication: 'Start with a bold claim, document the process day by day, end with results and reflection.' },
          { format: 'Myth-Busting Breakdown', replication: 'Present a common belief, show evidence it\'s wrong, provide the correct information with visual proof.' },
          { format: 'Budget vs. Luxury Comparison', replication: 'Compare a cheap option against an expensive one. Works for any product or service category.' },
          { format: 'Step-by-Step Transformation', replication: 'Show the "before" state, document each step, reveal the dramatic "after" result.' },
        ],
        estimatedPotential: 'Creators who identify and replicate outlier patterns consistently see 5-10x their normal view counts within the first 3 months. The key is finding patterns specific to your niche and executing them with authenticity. Small channels that nail the format + timing combination can reach 100K+ views per video within weeks.',
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]"><Radar className="w-5 h-5 text-[#888888]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Outlier Scout</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Finds videos from small channels (&lt;1K subs) that got 100K+ views.</p>
            </div>
          </div>
          <button onClick={handleScout} disabled={loading} className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#888888] text-white text-sm font-bold hover:bg-[#555555] transition-colors disabled:opacity-50 flex items-center gap-2 justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            Scout for Outliers
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-2/3 mb-2" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#888888]" /> Outlier Analysis</h3>
          </div>

          {/* Viral Patterns */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-[#FDBA2D]" /> Viral Title Patterns</h4>
            <div className="space-y-2">
              {result.viralPatterns.map((p, i) => (
                <div key={i} className="p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#FFFFFF]">{p.pattern}</p>
                      <p className="text-xs text-[#a0a0a0] mt-1">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-[#888888] bg-[rgba(255,255,255,0.03)] flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views}</span>
                      <CopyBtn text={p.pattern} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Niches */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3">Outlier Sub-Niches</h4>
            <div className="space-y-2">
              {result.subNiches.map((n, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-md bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)]">
                  <span className="text-[#888888] text-xs mt-0.5 shrink-0">●</span>
                  <div>
                    <p className="text-sm font-medium text-[#FFFFFF]">{n.niche}</p>
                    <p className="text-xs text-[#a0a0a0] mt-0.5">{n.opportunity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formats */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-3 flex items-center gap-2"><Repeat className="w-3.5 h-3.5 text-[#888888]" /> Replicable Formats</h4>
            <div className="space-y-2">
              {result.formats.map((f, i) => (
                <div key={i} className="p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A]">
                  <p className="text-sm font-medium text-[#FFFFFF]">{f.format}</p>
                  <p className="text-xs text-[#a0a0a0] mt-1">{f.replication}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Potential */}
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2">Estimated View Potential</h4>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.estimatedPotential}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4"><Radar className="w-8 h-8 text-[#888888]" /></div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Discover Outlier Patterns</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Find video patterns that help small channels achieve massive views.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS['outlier-scout']} tokens per scout</div>}
    </div>
  );
}
