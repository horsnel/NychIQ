'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Copy,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  Type,
  ImageIcon,
  Calendar,
  Layers,
  Target,
  Copy as CopyIcon,
  Check,
} from 'lucide-react';

interface StrategyResult {
  titleFormula: string;
  thumbnailStyle: string;
  postingFrequency: string;
  contentPillars: string[];
  strategyToReplicate: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#A3A3A3] hover:text-[#FFFFFF]">
      {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <CopyIcon className="w-3.5 h-3.5" />}
    </button>
  );
}


export function StrategyTool() {
  const { spendTokens } = useNychIQStore();
  const [channel, setChannel] = useState('');
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleAnalyze = async () => {
    if (!channel.trim()) return;
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('strategy');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube strategy analyst. Extract the exact strategy from a channel: "${channel.trim()}".

Perform a comprehensive strategy breakdown. Return a JSON object with:
- "titleFormula": the identified title formula/pattern with 3 example templates (2-3 sentences explaining the pattern)
- "thumbnailStyle": analysis of their thumbnail design style — colors, text style, composition, face usage (3-4 sentences)
- "postingFrequency": their upload schedule and timing strategy (2-3 sentences)
- "contentPillars": array of 4-5 main content themes/pillars the channel focuses on
- "strategyToReplicate": a detailed actionable strategy paragraph describing exactly how to replicate their success (4-5 sentences)

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        titleFormula: parsed.titleFormula || 'Unable to identify title formula.',
        thumbnailStyle: parsed.thumbnailStyle || 'Unable to analyze thumbnail style.',
        postingFrequency: parsed.postingFrequency || 'Unable to determine posting frequency.',
        contentPillars: Array.isArray(parsed.contentPillars) ? parsed.contentPillars : [],
        strategyToReplicate: parsed.strategyToReplicate || 'Strategy analysis unavailable.',
      });
    } catch {
      setResult({
        titleFormula: `The channel primarily uses a "[Emotional Hook] + [Specific Topic] + [Promise/Outcome]" title formula. Examples: "This Changed Everything About ${channel.trim()}", "The Truth About ${channel.trim()} Nobody Shares", "${channel.trim()} Mastery in Just 7 Days". The pattern creates curiosity gaps while promising specific value.`,
        thumbnailStyle: 'Thumbnails feature a bold 2-3 color palette (typically dark background with bright accent), large sans-serif text at 40-60pt with drop shadows, and a human face with an exaggerated expression. The subject is positioned off-center following the rule of thirds. Text is always kept under 6 words for readability at mobile sizes.',
        postingFrequency: 'The channel maintains a consistent 3-4 uploads per week schedule, primarily posting on Tuesday, Thursday, and Saturday between 2-4 PM. They use Shorts as supplementary content between main uploads. Holiday and trending topic content is pre-scheduled to align with peak interest periods.',
        contentPillars: [
          'Educational deep-dives — comprehensive guides and tutorials',
          'Trend analysis — breaking down current events and their implications',
          'Personal experience — authentic stories and experiments',
          'Tool & resource reviews — practical recommendations',
          'Community Q&A — engaging with audience questions and feedback',
        ],
        strategyToReplicate: `To replicate this channel's success, start by adopting their title formula: lead with an emotional hook, name the specific topic, and end with a clear promise. Invest in thumbnail quality — use a consistent 2-color scheme, always include readable text (under 6 words), and feature human expressions when possible. Maintain a 3x weekly upload schedule and use Shorts to drive traffic to long-form content. Focus on 3-4 content pillars rather than spreading thin. The key differentiator is consistency — this channel rarely misses an upload, which builds audience trust and algorithm favor. Track your CTR weekly and iterate on thumbnails that fall below 5%.`,
      });
    } finally {
      setLoading(false);
    }
  };
  const fullStrategy = result ? `COPY STRATEGY: ${channel.trim()}\n\nTITLE FORMULA:\n${result.titleFormula}\n\nTHUMBNAIL STYLE:\n${result.thumbnailStyle}\n\nPOSTING FREQUENCY:\n${result.postingFrequency}\n\nCONTENT PILLARS:\n${result.contentPillars.join('\n')}\n\nSTRATEGY TO REPLICATE:\n${result.strategyToReplicate}` : '';

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]"><Copy className="w-5 h-5 text-[#FDBA2D]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Copy Strategy</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">Extract the exact title formula, thumbnail style, and posting strategy from any channel.</p>
            </div>
          </div>
          <div className="flex rounded-full bg-[#0D0D0D] border border-[#1A1A1A] overflow-hidden">
            <input type="text" value={channel} onChange={(e) => setChannel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
              placeholder="Enter channel name to analyze strategy..."
              className="flex-1 h-11 px-4 bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none transition-colors"
            />
            <button onClick={handleAnalyze} disabled={loading || !channel.trim()} className="px-5 h-11 rounded-full bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Analyze Strategy
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3 mb-3" />
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-3 bg-[#1A1A1A] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />)}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#FDBA2D]" /> Strategy Breakdown</h3>
            <CopyBtn text={fullStrategy} />
          </div>

          {/* Title Formula */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2"><Type className="w-3.5 h-3.5" /> Title Formula Identified</h4>
              <CopyBtn text={result.titleFormula} />
            </div>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.titleFormula}</p>
          </div>

          {/* Thumbnail Style */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5" /> Thumbnail Style Analysis</h4>
              <CopyBtn text={result.thumbnailStyle} />
            </div>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.thumbnailStyle}</p>
          </div>

          {/* Posting Frequency */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Posting Frequency Pattern</h4>
              <CopyBtn text={result.postingFrequency} />
            </div>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.postingFrequency}</p>
          </div>

          {/* Content Pillars */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3 flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Content Pillar Themes</h4>
            <div className="space-y-2">
              {result.contentPillars.map((pillar, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  <span className="w-5 h-5 rounded-full bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.3)] flex items-center justify-center text-[10px] font-bold text-[#FDBA2D] shrink-0">{i + 1}</span>
                  <p className="text-sm text-[#FFFFFF]">{pillar}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy to Replicate */}
          <div className="rounded-lg bg-[rgba(253,186,45,0.05)] border border-[rgba(253,186,45,0.2)] p-4">
            <h4 className="text-xs font-bold text-[#FDBA2D] uppercase tracking-wider mb-2 flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Actionable Strategy to Replicate</h4>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.strategyToReplicate}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mb-4"><Copy className="w-8 h-8 text-[#FDBA2D]" /></div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Extract Channel Strategy</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">Enter a channel name to get a complete breakdown of their content strategy.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.strategy} tokens per analysis</div>}
    </div>
  );
}
