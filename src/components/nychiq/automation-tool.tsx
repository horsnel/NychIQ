'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Cpu,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  DollarSign,
  Calendar,
  Wrench,
  TrendingUp,
  CheckSquare,
} from 'lucide-react';

interface AutomationResult {
  niches: Array<{ name: string; cpm: string; difficulty: string; monthlyRevenue: string }>;
  schedule: string;
  tools: string[];
  revenueProjections: string;
  checklist: string[];
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888888] hover:text-[#E8E8E8]">
      {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}


export function AutomationTool() {
  const { spendTokens } = useNychIQStore();
  const [result, setResult] = useState<AutomationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('automation');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube cash cow channel expert. Generate a complete automation strategy for building faceless YouTube channels that generate passive income.

Return a JSON object with:
- "niches": array of 5 recommended niches for automation, each with "name", "cpm" (typical CPM like "$25"), "difficulty" ("Easy"/"Medium"/"Hard"), and "monthlyRevenue" (estimated monthly revenue like "$2,000-$5,000")
- "schedule": a detailed weekly content schedule template (2-3 sentences describing the upload cadence)
- "tools": array of 5 recommended tools for automation (tool names with brief descriptions)
- "revenueProjections": a paragraph describing revenue projections for months 1-6 and 6-12
- "checklist": array of 8 setup checklist items to get started

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({
        niches: Array.isArray(parsed.niches) ? parsed.niches : [],
        schedule: parsed.schedule || 'Post 3-4 times per week.',
        tools: Array.isArray(parsed.tools) ? parsed.tools : [],
        revenueProjections: parsed.revenueProjections || 'Revenue projections unavailable.',
        checklist: Array.isArray(parsed.checklist) ? parsed.checklist : [],
      });
    } catch {
      setResult({
        niches: [
          { name: 'Personal Finance & Investing', cpm: '$28', difficulty: 'Medium', monthlyRevenue: '$3,000-$8,000' },
          { name: 'Technology Reviews', cpm: '$22', difficulty: 'Medium', monthlyRevenue: '$2,000-$5,000' },
          { name: 'Health & Wellness', cpm: '$18', difficulty: 'Easy', monthlyRevenue: '$1,500-$4,000' },
          { name: 'Business & Entrepreneurship', cpm: '$32', difficulty: 'Hard', monthlyRevenue: '$4,000-$12,000' },
          { name: 'Educational / How-To', cpm: '$15', difficulty: 'Easy', monthlyRevenue: '$1,000-$3,000' },
        ],
        schedule: 'Upload 4 videos per week (Mon/Wed/Fri/Sat) at 2 PM and 7 PM. Batch-record content on weekends — aim for 8-12 videos per recording session. Use scheduling tools to maintain consistent upload times.',
        tools: ['Canva Pro — Thumbnail design and channel branding', 'ElevenLabs — AI voiceover generation with natural-sounding voices', 'Pictory/InVideo AI — Automated video creation from scripts', 'Tubebuddy — Keyword research and SEO optimization', 'Metricool — Social media scheduling and analytics'],
        revenueProjections: 'Months 1-3: Expect $0-$500/month as the channel builds momentum and the algorithm learns your audience. Months 3-6: With consistent uploads and optimized content, revenue typically reaches $500-$2,000/month. Months 6-12: Established channels with 50+ videos can generate $2,000-$10,000/month depending on niche CPM and view volume. Top performers in high-CPM niches can exceed $15,000/month by month 12.',
        checklist: ['Choose a high-CPM niche with low competition', 'Create channel branding (name, logo, banner, color scheme)', 'Set up AI voiceover tool and select consistent voice', 'Create thumbnail template in Canva', 'Write first 10 video scripts using keyword research', 'Batch-record and edit first 10 videos', 'Set up upload schedule and scheduling tool', 'Create social media accounts for cross-promotion'],
      });
    } finally {
      setLoading(false);
    }
  };
  const diffColor = (d: string) => d === 'Easy' ? '#10B981' : d === 'Medium' ? '#FDBA2D' : '#EF4444';

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]"><Cpu className="w-5 h-5 text-[#9B72CF]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Automation Master</h2>
              <p className="text-xs text-[#888888] mt-0.5">Cash cow channel strategy. High-CPM niches + low-competition topics for faceless channels.</p>
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#9B72CF] text-white text-sm font-bold hover:bg-[#8B62BF] transition-colors disabled:opacity-50 flex items-center gap-2 justify-center">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Strategy
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#141414] border border-[#222222] p-4">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/3 mb-3" />
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-3 bg-[#1A1A1A] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />)}</div>
            </div>
          ))}
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#9B72CF]" /> Automation Strategy</h3>
            <CopyBtn text={JSON.stringify(result, null, 2)} />
          </div>

          {/* Top Niches */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-[#10B981]" /> Top 5 Automation Niches</h4>
            <div className="space-y-2">
              {result.niches.map((n, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-[#666666]">#{i + 1}</span>
                    <span className="text-sm text-[#E8E8E8] truncate">{n.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold text-[#10B981]">CPM {n.cpm}</span>
                    <span className="text-[10px] font-bold" style={{ color: diffColor(n.difficulty) }}>{n.difficulty}</span>
                    <span className="text-[10px] text-[#888888]">{n.monthlyRevenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Content Schedule Template</h4>
            <p className="text-sm text-[#E8E8E8] leading-relaxed">{result.schedule}</p>
          </div>

          {/* Tools */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2"><Wrench className="w-3.5 h-3.5" /> Recommended Tools</h4>
            <div className="space-y-2">
              {result.tools.map((tool, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  <span className="text-[#9B72CF] text-xs mt-0.5">●</span>
                  <p className="text-sm text-[#E8E8E8]">{tool}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Projections */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Revenue Projections</h4>
            <p className="text-sm text-[#E8E8E8] leading-relaxed">{result.revenueProjections}</p>
          </div>

          {/* Checklist */}
          <div className="rounded-lg bg-[#141414] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5" /> Setup Checklist</h4>
            <div className="space-y-2">
              {result.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="w-4 h-4 rounded border border-[#2A2A2A] shrink-0" />
                  <p className="text-sm text-[#E8E8E8]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)] flex items-center justify-center mb-4"><Cpu className="w-8 h-8 text-[#9B72CF]" /></div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Build Your Cash Cow</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Generate a complete automation strategy for faceless YouTube channels.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.automation} tokens per generation</div>}
    </div>
  );
}
