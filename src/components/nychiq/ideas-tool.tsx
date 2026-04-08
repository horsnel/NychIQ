'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Lightbulb,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Zap,
  Eye,
  Tag,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const CONTENT_TYPES = ['Tutorial', 'Vlog', 'Review', 'Challenge', 'Reaction'];

interface VideoIdea {
  title: string;
  description: string;
  viralScore: number;
  estimatedViews: string;
  contentType: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888888] hover:text-[#E8E8E8]" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function viralColor(score: number) {
  if (score >= 80) return { color: '#00C48C', bg: 'rgba(0,196,140,0.1)', border: 'rgba(0,196,140,0.3)' };
  if (score >= 60) return { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' };
  if (score >= 40) return { color: '#4A9EFF', bg: 'rgba(74,158,255,0.1)', border: 'rgba(74,158,255,0.3)' };
  return { color: '#888888', bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.3)' };
}


export function IdeasTool() {
  const { spendTokens } = useNychIQStore();
  const [niche, setNiche] = useState('');
  const [contentType, setContentType] = useState('Tutorial');
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    setRawText(null);
    const ok = spendTokens('ideas');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube content strategist. Generate 10 high-potential video ideas for the niche: "${niche.trim()}" with content type: ${contentType}.

Return a JSON array of 10 ideas. Each idea should have:
- "title": a catchy, click-worthy title
- "description": a brief 1-2 sentence description of what the video covers
- "viralScore": a predicted viral score from 30 to 99
- "estimatedViews": estimated view range like "50K-200K" or "1M-5M"
- "contentType": the content type

Return ONLY the JSON array.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        setRawText(response);
        setIdeas([]);
        return;
      }
      if (Array.isArray(parsed)) {
        setIdeas(parsed.map((idea: any) => ({
          title: idea.title || 'Untitled',
          description: idea.description || 'No description',
          viralScore: Math.min(99, Math.max(1, parseInt(idea.viralScore, 10) || 50)),
          estimatedViews: idea.estimatedViews || '10K-50K',
          contentType: idea.contentType || contentType,
        })));
      } else {
        setRawText(response);
        setIdeas([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas. Please try again.');
      setIdeas([]);
      setRawText(null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]"><Lightbulb className="w-5 h-5 text-[#F5A623]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Video Ideas</h2>
              <p className="text-xs text-[#888888] mt-0.5">10 high-potential ideas based on your niche, with viral score prediction.</p>
            </div>
          </div>
          <div className="space-y-3">
            <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="Enter your niche or topic..."
              className="w-full h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-2 flex-1">
                {CONTENT_TYPES.map((t) => (
                  <button key={t} onClick={() => setContentType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${contentType === t ? 'bg-[#F5A623] text-[#0A0A0A]' : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#888888] hover:text-[#E8E8E8]'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={handleGenerate} disabled={loading || !niche.trim()} className="px-5 h-9 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Ideas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#E05252] mx-auto mb-3" />
          <p className="text-sm text-[#E8E8E8] mb-4">{error}</p>
          <button onClick={handleGenerate} className="px-4 py-2 rounded-lg bg-[#E05252] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4 mb-2" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full mb-1" />
              <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3 mb-3" />
              <div className="flex gap-2"><div className="h-5 w-12 bg-[#1A1A1A] rounded animate-pulse" /><div className="h-5 w-16 bg-[#1A1A1A] rounded animate-pulse" /></div>
            </div>
          ))}
        </div>
      )}

      {/* Raw Text Fallback */}
      {!loading && rawText && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F5A623]" /> Ideas Results (Raw)
          </h3>
          <div className="rounded-lg bg-[#111111] border border-[#F5A623]/30 p-4">
            <p className="text-[10px] text-[#F5A623] mb-2 font-medium">Could not format the AI response. Showing raw output:</p>
            <pre className="text-sm text-[#E8E8E8] whitespace-pre-wrap leading-relaxed font-sans">{rawText}</pre>
          </div>
        </div>
      )}

      {!loading && ideas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#F5A623]" /> {ideas.length} Video Ideas Generated</h3>
            <button onClick={async () => { const text = ideas.map((id, i) => `${i + 1}. ${id.title}\n${id.description}\nViral Score: ${id.viralScore} | Views: ${id.estimatedViews} | Type: ${id.contentType}`).join('\n\n'); await copyToClipboard(text); }}
              className="flex items-center gap-1 text-xs text-[#888888] hover:text-[#00C48C] transition-colors"><Copy className="w-3 h-3" /> Copy All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ideas.map((idea, i) => {
              const vc = viralColor(idea.viralScore);
              return (
                <div key={i} className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#2A2A2A] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-[#666666]">#{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#888888] flex items-center gap-1"><Eye className="w-3 h-3" /> {idea.estimatedViews}</span>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ color: vc.color, backgroundColor: vc.bg, border: `1px solid ${vc.border}` }}>
                        {idea.viralScore}
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-[#E8E8E8] mb-1.5 line-clamp-2">{idea.title}</h4>
                  <p className="text-xs text-[#888888] line-clamp-2 mb-3">{idea.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-[#9B72CF] bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)] flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> {idea.contentType}
                    </span>
                    <CopyBtn text={idea.title} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mb-4"><Lightbulb className="w-8 h-8 text-[#F5A623]" /></div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Get Video Ideas</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Enter your niche to get 10 video ideas with viral score predictions.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.ideas} tokens per generation</div>}
    </div>
  );
}
