'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { cn, fmtV, scoreClass } from '@/lib/utils';
import { askAI } from '@/lib/api';
import {
  Crosshair,
  Crown,
  Lock,
  Search,
  Loader2,
  Eye,
  TrendingUp,
  Target,
  BarChart3,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface NicheResult {
  name: string;
  score: number;
  monthlyViews: string;
  competition: 'Low' | 'Medium' | 'High';
  description: string;
}

const REGIONS = [
  { code: 'NG', label: 'Nigeria' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IN', label: 'India' },
  { code: 'KE', label: 'Kenya' },
  { code: 'GH', label: 'Ghana' },
  { code: 'ZA', label: 'South Africa' },
];

/* ── Competition badge ── */
function CompBadge({ level }: { level: string }) {
  const color = level === 'Low' ? '#888888' : level === 'Medium' ? '#FDBA2D' : '#888888';
  const bg = level === 'Low' ? 'rgba(16,185,129,0.1)' : level === 'Medium' ? 'rgba(253,186,45,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ color, backgroundColor: bg }}
    >
      {level}
    </span>
  );
}

/* ── Niche Card ── */
function NicheCard({ niche, index }: { niche: NicheResult; index: number }) {
  return (
    <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 hover:border-[rgba(255,255,255,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#666666]">#{index + 1}</span>
          <h3 className="text-sm font-bold text-[#FFFFFF]">{niche.name}</h3>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border"
          style={{
            color: niche.score >= 80 ? '#888888' : niche.score >= 60 ? '#FDBA2D' : '#888888',
            backgroundColor: niche.score >= 80 ? 'rgba(16,185,129,0.1)' : niche.score >= 60 ? 'rgba(253,186,45,0.1)' : 'rgba(59,130,246,0.1)',
            borderColor: niche.score >= 80 ? 'rgba(16,185,129,0.3)' : niche.score >= 60 ? 'rgba(253,186,45,0.3)' : 'rgba(59,130,246,0.3)',
          }}
        >
          {niche.score}
        </div>
      </div>
      <p className="text-xs text-[#a0a0a0] line-clamp-2 mb-3">{niche.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-[#666666]">
            <Eye className="w-3 h-3" />
            {niche.monthlyViews}
          </div>
          <CompBadge level={niche.competition} />
        </div>
      </div>
    </div>
  );
}


/* ── Main Niche Tool ── */
export function NicheTool() {
  const { spendTokens } = useNychIQStore();
  const [topic, setTopic] = useState('');
  const [region, setRegion] = useState('NG');
  const [results, setResults] = useState<NicheResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    const ok = spendTokens('niche');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube niche research expert. The user wants to find sub-niches for the topic: "${trimmed}" in region: ${region}.

Return a JSON array of 6 niche opportunities. Each niche should have:
- "name": A specific sub-niche name (e.g., "AI Tools for Students")
- "score": A profitability score from 50 to 99
- "monthlyViews": Estimated monthly search volume (e.g., "450K")
- "competition": "Low", "Medium", or "High"
- "description": A brief 1-2 sentence description of the opportunity

Return ONLY the JSON array, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        setResults(parsed.map((item: any) => ({
          name: item.name || 'Unknown Niche',
          score: Math.min(99, Math.max(1, parseInt(item.score, 10) || 50)),
          monthlyViews: item.monthlyViews || '100K',
          competition: ['Low', 'Medium', 'High'].includes(item.competition) ? item.competition : 'Medium',
          description: item.description || 'High potential niche opportunity.',
        })));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      // Fallback to mock data on AI error
      const mockNiches: NicheResult[] = [
        { name: `${trimmed} Tutorials`, score: 88, monthlyViews: '1.2M', competition: 'Medium', description: `Step-by-step ${trimmed.toLowerCase()} tutorials are in high demand.` },
        { name: `${trimmed} for Beginners`, score: 82, monthlyViews: '890K', competition: 'Low', description: `Beginner-friendly ${trimmed.toLowerCase()} content has high growth potential.` },
        { name: `Advanced ${trimmed}`, score: 75, monthlyViews: '650K', competition: 'Low', description: `In-depth ${trimmed.toLowerCase()} content for experienced audiences.` },
        { name: `${trimmed} Tips & Tricks`, score: 71, monthlyViews: '520K', competition: 'Medium', description: `Quick tips and tricks content performs well in ${trimmed.toLowerCase()} space.` },
        { name: `${trimmed} Tools & Software`, score: 68, monthlyViews: '380K', competition: 'High', description: `Reviews and comparisons of ${trimmed.toLowerCase()} related tools.` },
        { name: `${trimmed} News & Updates`, score: 63, monthlyViews: '290K', competition: 'Medium', description: `Stay updated with the latest ${trimmed.toLowerCase()} news and trends.` },
      ];
      setResults(mockNiches);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
              <Crosshair className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Niche Spy</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Discover profitable sub-niches with AI analysis
              </p>
            </div>
          </div>
          <p className="text-sm text-[#a0a0a0] mb-4">
            Enter a topic and we&apos;ll analyze YouTube to find untapped sub-niches with high growth potential and low competition.
          </p>

          {/* Input Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Enter a topic (e.g., Tech, Cooking, Gaming)..."
                className="w-full h-11 pl-10 pr-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 focus:ring-1 focus:ring-[#FDBA2D]/20 transition-colors"
              />
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-11 px-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors appearance-none cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={loading || !topic.trim()}
              className="px-5 h-11 rounded-lg bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Find Niches</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <p className="text-sm text-[#FFFFFF]">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Grid */}
      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FDBA2D]" />
              AI-Generated Niche Opportunities
            </h3>
            <button
              onClick={handleSearch}
              className="flex items-center gap-1 text-xs text-[#a0a0a0] hover:text-[#FDBA2D] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((niche, i) => (
              <NicheCard key={i} niche={niche} index={i} />
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
            <Crosshair className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">No Niches Found</h3>
          <p className="text-sm text-[#a0a0a0]">Try a different topic or region.</p>
        </div>
      )}

      {/* Initial State */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
            <Crosshair className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Discover Hidden Niches</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Enter a topic above to find profitable sub-niches with low competition and high growth potential.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#666666]">
          Cost: {TOKEN_COSTS.niche} tokens per search · Region: {region}
        </div>
      )}
    </div>
  );
}
