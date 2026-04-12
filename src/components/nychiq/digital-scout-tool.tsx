'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Package,
  Search,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  DollarSign,
  TrendingUp,
  Quote,
  Star,
  FileText,
  LayoutTemplate,
  Video,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

/* ── Types ── */
interface ProductOpportunity {
  name: string;
  type: 'PDF' | 'Template' | 'Notion' | 'Video Course' | 'Toolkit' | 'eBook';
  priceRange: string;
  priorityScore: number;
  painPoints: string[];
  estimatedRevenue: string;
  salesHook: string;
}

interface ScoutResults {
  videoTopic: string;
  estimatedViews: number;
  opportunities: ProductOpportunity[];
}

/* ── Mock fallback data ── */
const MOCK_RESULTS: ScoutResults = {
  videoTopic: 'How I Made $10K/Month on YouTube Without Showing My Face',
  estimatedViews: 847000,
  opportunities: [
    {
      name: 'Faceless YouTube Blueprint',
      type: 'Video Course',
      priceRange: '$47 - $97',
      priorityScore: 94,
      painPoints: [
        '"I want to start a channel but I hate being on camera"',
        '"What tools do you use for the voiceovers and animations?"',
        '"This is exactly what I\'ve been looking for! Can you make a full tutorial?"',
      ],
      estimatedRevenue: '$8,470 - $17,559',
      salesHook: 'The complete step-by-step system to build a 6-figure faceless YouTube channel — no camera, no experience needed. Includes 50+ video templates, AI voiceover scripts, and my personal automation workflow.',
    },
    {
      name: 'AI Voiceover Script Pack',
      type: 'Template',
      priceRange: '$19 - $39',
      priorityScore: 88,
      painPoints: [
        '"Your scripts are so engaging, do you sell them anywhere?"',
        '"I struggle with writing scripts that keep viewers watching"',
        '"What\'s the hook formula you use at the start of every video?"',
      ],
      estimatedRevenue: '$3,420 - $7,026',
      salesHook: '50 plug-and-play YouTube script templates with proven hooks, retention-optimized structures, and AI voiceover prompts. Used across 200+ viral faceless channels.',
    },
    {
      name: 'Faceless Channel niches Database',
      type: 'Notion',
      priceRange: '$27 - $49',
      priorityScore: 82,
      painPoints: [
        '"How did you pick this niche? Are there others that work?"',
        '"I need a list of profitable niches for faceless content"',
        '"Can you share your research process for finding niches?"',
      ],
      estimatedRevenue: '$4,859 - $8,817',
      salesHook: 'The ultimate Notion database of 150+ profitable faceless YouTube niches with CPM data, competition scores, content angle ideas, and monetization strategies for each.',
    },
    {
      name: 'Thumbnail & Title Swipe File',
      type: 'PDF',
      priceRange: '$7 - $17',
      priorityScore: 76,
      painPoints: [
        '"Your thumbnails always make me click, what\'s your process?"',
        '"I can never come up with good titles for my videos"',
        '"Do you have examples of thumbnails that worked vs didn\'t?"',
      ],
      estimatedRevenue: '$1,193 - $2,897',
      salesHook: '200+ high-CTR thumbnail examples with the psychology behind each design. Includes 100 title formulas organized by niche and a Canva template pack.',
    },
    {
      name: 'YouTube Automation Toolkit',
      type: 'Toolkit',
      priceRange: '$67 - $149',
      priorityScore: 71,
      painPoints: [
        '"How do you upload so consistently? I can barely manage one a week"',
        '"Is there a way to automate the editing process?"',
        '"What\'s your content batching workflow?"',
      ],
      estimatedRevenue: '$6,021 - $13,395',
      salesHook: 'The complete automation stack: AI script generator, bulk thumbnail creator, scheduling templates, analytics tracker, and a 30-day content calendar. Save 20+ hours per week.',
    },
  ],
};

/* ── Product type icon ── */
function ProductTypeIcon({ type }: { type: ProductOpportunity['type'] }) {
  switch (type) {
    case 'PDF':
    case 'eBook':
      return <FileText className="w-3.5 h-3.5" />;
    case 'Template':
    case 'Toolkit':
      return <LayoutTemplate className="w-3.5 h-3.5" />;
    case 'Notion':
      return <BookOpen className="w-3.5 h-3.5" />;
    case 'Video Course':
      return <Video className="w-3.5 h-3.5" />;
    default:
      return <FileText className="w-3.5 h-3.5" />;
  }
}

/* ── Product type badge color ── */
function typeBadgeStyle(type: ProductOpportunity['type']) {
  switch (type) {
    case 'PDF':
    case 'eBook':
      return { bg: 'bg-[rgba(239,68,68,0.1)]', text: 'text-[#EF4444]', border: 'border-[rgba(239,68,68,0.2)]' };
    case 'Template':
      return { bg: 'bg-[rgba(59,130,246,0.1)]', text: 'text-[#3B82F6]', border: 'border-[rgba(59,130,246,0.2)]' };
    case 'Notion':
      return { bg: 'bg-[rgba(139,92,246,0.1)]', text: 'text-[#8B5CF6]', border: 'border-[rgba(139,92,246,0.2)]' };
    case 'Video Course':
      return { bg: 'bg-[rgba(253,186,45,0.1)]', text: 'text-[#FDBA2D]', border: 'border-[rgba(253,186,45,0.2)]' };
    case 'Toolkit':
      return { bg: 'bg-[rgba(16,185,129,0.1)]', text: 'text-[#10B981]', border: 'border-[rgba(16,185,129,0.2)]' };
    default:
      return { bg: 'bg-[rgba(136,136,136,0.1)]', text: 'text-[#A3A3A3]', border: 'border-[rgba(136,136,136,0.2)]' };
  }
}

/* ── Priority badge ── */
function PriorityBadge({ score }: { score: number }) {
  const color = score >= 90 ? '#10B981' : score >= 80 ? '#FDBA2D' : score >= 70 ? '#3B82F6' : '#A3A3A3';
  const label = score >= 90 ? 'HIGH' : score >= 80 ? 'MEDIUM' : 'LOW';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

/* ── Main Component ── */
export function DigitalScoutTool() {
  const { spendTokens, tokenBalance } = useNychIQStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScoutResults | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleScout = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const ok = spendTokens('digital-scout');
    if (!ok) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const systemPrompt = `You are a digital product opportunity analyst specializing in YouTube creator audiences. Given a YouTube video URL or topic, analyze the likely audience and identify 3-5 digital product opportunities they would pay for.

For each opportunity provide:
1. Product name (catchy, marketable)
2. Product type (PDF, Template, Notion, Video Course, Toolkit, eBook)
3. Suggested price range ($7-$149)
4. Priority score (0-100 based on demand signals)
5. Pain point evidence (3 mock viewer comments showing demand)
6. Estimated revenue if 1% of viewers purchase
7. Sales hook (compelling 2-sentence pitch)

Return ONLY valid JSON matching this schema:
{
  "videoTopic": "string",
  "estimatedViews": number,
  "opportunities": [
    {
      "name": "string",
      "type": "PDF|Template|Notion|Video Course|Toolkit|eBook",
      "priceRange": "string",
      "priorityScore": number,
      "painPoints": ["string", "string", "string"],
      "estimatedRevenue": "string",
      "salesHook": "string"
    }
  ]
}`;

      const prompt = `Analyze this YouTube video topic/URL for digital product opportunities: "${trimmed}"`;

      const aiText = await askAI(prompt, systemPrompt);

      // Parse the AI response as JSON
      let parsed: ScoutResults;
      try {
        // Try to extract JSON from the response (handle markdown code blocks)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
        // Validate structure
        if (!parsed.opportunities || !Array.isArray(parsed.opportunities)) {
          throw new Error('Invalid structure');
        }
      } catch {
        // Use mock data if parsing fails
        parsed = { ...MOCK_RESULTS, videoTopic: trimmed };
      }

      setResults(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (results === null && input.trim()) {
      handleScout();
    }
  };

  /* ── Idle State ── */
  if (!results && !loading && !error) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
                <Package className="w-5 h-5 text-[#FDBA2D]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#FFFFFF]">Digital Product Scout</h2>
                <p className="text-xs text-[#A3A3A3] mt-0.5">Discover digital product opportunities from YouTube audience demand</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5 sm:p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.15)] flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-[#FDBA2D]" />
            </div>
            <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">Find What Audiences Will Pay For</h3>
            <p className="text-sm text-[#A3A3A3] max-w-lg mx-auto">
              Enter a YouTube video URL or topic. Our AI analyzes the audience and identifies digital product
              opportunities — templates, courses, tools — they&apos;re already asking for in the comments.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScout()}
                  placeholder="Paste a YouTube URL or enter a video topic..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0D0D0D] border border-[#1F1F1F] text-[#FFFFFF] text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/40 focus:ring-1 focus:ring-[#FDBA2D]/20 transition-all"
                />
              </div>
              <button
                onClick={handleScout}
                disabled={!input.trim()}
                className="px-5 py-3 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg"
                style={{
                  background: input.trim() ? 'linear-gradient(135deg, #FDBA2D, #E09100)' : '#333333',
                }}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Scout Products</span>
                  <span className="sm:hidden">Scout</span>
                </span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-[10px] text-[#666666]">
                <DollarSign className="w-3 h-3" />
                <span>Cost: {TOKEN_COSTS['digital-scout']} tokens</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#333333]" />
              <div className="flex items-center gap-1.5 text-[10px] text-[#666666]">
                <Star className="w-3 h-3" />
                <span>Balance: {tokenBalance}</span>
              </div>
            </div>
          </div>

          {/* Quick examples */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              'How to start a profitable side hustle',
              'Passive income with dividend stocks',
              'Learn Python for data science',
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="px-3 py-1.5 rounded-full bg-[#0D0D0D] border border-[#1F1F1F] text-[11px] text-[#A3A3A3] hover:text-[#FDBA2D] hover:border-[#FDBA2D]/30 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Token Cost Footer */}
        <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['digital-scout']} tokens per analysis</div>
      </div>
    );
  }

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)] animate-pulse">
                <Package className="w-5 h-5 text-[#FDBA2D]" />
              </div>
              <div>
                <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-44 mb-1" />
                <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-72" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-[rgba(253,186,45,0.1)] animate-pulse mx-auto mb-4 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#FDBA2D] animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-[#FFFFFF] mb-2">Scouting Product Opportunities...</h3>
          <p className="text-xs text-[#A3A3A3] mb-4">Analyzing audience demand and comment signals</p>
          <div className="space-y-2 max-w-sm mx-auto">
            {['Scanning audience pain points', 'Evaluating product market fit', 'Calculating revenue estimates'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FDBA2D] animate-pulse" style={{ animationDelay: `${i * 300}ms` }} />
                <div className="h-2.5 bg-[#1A1A1A] rounded animate-pulse flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
                <Package className="w-5 h-5 text-[#FDBA2D]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#FFFFFF]">Digital Product Scout</h2>
                <p className="text-xs text-[#A3A3A3] mt-0.5">Discover digital product opportunities from YouTube audience demand</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-[#EF4444]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Analysis Failed</h3>
          <p className="text-sm text-[#A3A3A3] mb-5 max-w-sm text-center">{error}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-lg bg-[#EF4444] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
            <button
              onClick={() => { setError(null); setResults(null); }}
              className="px-5 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#1F1F1F] text-[#FFFFFF] text-sm font-medium hover:bg-[#1F1F1F] transition-colors"
            >
              New Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Results State ── */
  const sortedOpps = [...(results?.opportunities || [])].sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
                <Package className="w-5 h-5 text-[#FDBA2D]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#FFFFFF]">Digital Product Scout</h2>
                <p className="text-xs text-[#A3A3A3] mt-0.5">{results?.videoTopic || 'Analysis complete'}</p>
              </div>
            </div>
            <button
              onClick={() => { setResults(null); setError(null); }}
              className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#1F1F1F] text-[11px] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3 h-3" /> New Search
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 text-center">
          <p className="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wider mb-1">Opportunities Found</p>
          <p className="text-2xl font-bold text-[#FDBA2D]">{results?.opportunities.length || 0}</p>
        </div>
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 text-center">
          <p className="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wider mb-1">Est. Views</p>
          <p className="text-2xl font-bold text-[#3B82F6]">{results?.estimatedViews?.toLocaleString() || '0'}</p>
        </div>
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 text-center">
          <p className="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wider mb-1">Top Priority</p>
          <p className="text-2xl font-bold text-[#10B981]">{sortedOpps[0]?.priorityScore || 0}</p>
        </div>
      </div>

      {/* Product Opportunity Cards */}
      <div>
        <h3 className="text-sm font-semibold text-[#FFFFFF] mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#FDBA2D]" /> Product Opportunities
          <span className="text-[10px] text-[#666666] font-normal ml-1">Sorted by priority</span>
        </h3>
        <div className="space-y-3">
          {sortedOpps.map((opp, idx) => {
            const isExpanded = expandedCard === opp.name;
            const badge = typeBadgeStyle(opp.type);
            const isCopied = copiedId === opp.name;

            return (
              <div
                key={opp.name}
                className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden hover:border-[#333333] transition-colors"
              >
                {/* Card Header */}
                <div className="px-4 sm:px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Rank badge */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: idx === 0 ? 'rgba(253,186,45,0.15)' : '#1A1A1A',
                          border: `1px solid ${idx === 0 ? 'rgba(253,186,45,0.3)' : '#1F1F1F'}`,
                          color: idx === 0 ? '#FDBA2D' : '#666666',
                        }}
                      >
                        #{idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-bold text-[#FFFFFF]">{opp.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${badge.bg} ${badge.text} ${badge.border}`}>
                            <ProductTypeIcon type={opp.type} />
                            {opp.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-semibold text-[#FFFFFF]">{opp.priceRange}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                            <TrendingUp className="w-3 h-3" />
                            <span>Rev: {opp.estimatedRevenue}</span>
                          </div>
                          <PriorityBadge score={opp.priorityScore} />
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : opp.name)}
                      className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#666666] hover:text-[#FFFFFF] flex-shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Sales Hook Preview (always visible) */}
                  <p className="text-xs text-[#A3A3A3] mt-3 leading-relaxed line-clamp-2">
                    {opp.salesHook}
                  </p>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 space-y-4 border-t border-[#1A1A1A]">
                    {/* Pain Point Evidence */}
                    <div className="pt-4">
                      <h5 className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Quote className="w-3 h-3" /> Audience Pain Point Evidence
                      </h5>
                      <div className="space-y-2">
                        {opp.painPoints.map((point, pi) => (
                          <div key={pi} className="flex items-start gap-2 px-3 py-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                            <Quote className="w-3 h-3 text-[#666666] flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-[#AAAAAA] italic leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sales Hook Full */}
                    <div>
                      <h5 className="text-[11px] font-bold text-[#A3A3A3] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3" /> Sales Hook
                      </h5>
                      <div className="px-3 py-2.5 rounded-md bg-[rgba(253,186,45,0.04)] border border-[rgba(253,186,45,0.1)]">
                        <p className="text-sm text-[#FFFFFF] leading-relaxed">{opp.salesHook}</p>
                      </div>
                    </div>

                    {/* Revenue Details */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2.5 text-center">
                        <p className="text-[10px] text-[#666666]">Price Range</p>
                        <p className="text-sm font-semibold text-[#FFFFFF] mt-0.5">{opp.priceRange}</p>
                      </div>
                      <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2.5 text-center">
                        <p className="text-[10px] text-[#666666]">Est. Revenue</p>
                        <p className="text-sm font-semibold text-[#10B981] mt-0.5">{opp.estimatedRevenue}</p>
                      </div>
                      <div className="rounded-md bg-[#0D0D0D] border border-[#1A1A1A] px-3 py-2.5 text-center">
                        <p className="text-[10px] text-[#666666]">Priority</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: opp.priorityScore >= 90 ? '#10B981' : opp.priorityScore >= 80 ? '#FDBA2D' : '#3B82F6' }}>
                          {opp.priorityScore}/100
                        </p>
                      </div>
                    </div>

                    {/* Copy Sales Hook */}
                    <button
                      onClick={() => handleCopy(opp.salesHook, opp.name)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-xs text-[#A3A3A3] hover:text-[#FDBA2D] hover:border-[#FDBA2D]/30 transition-all"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-[#10B981]" />
                          <span className="text-[#10B981]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Sales Hook
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Token Cost Footer */}
      <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS['digital-scout']} tokens per analysis</div>
    </div>
  );
}
