'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { copyToClipboard } from '@/lib/utils';
import { askAI } from '@/lib/api';
import {
  Anchor,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Zap,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const STYLES = [
  { value: 'all', label: 'All 3 Styles' },
  { value: 'shocking', label: 'Shocking Stat' },
  { value: 'personal', label: 'Personal Story' },
  { value: 'provocative', label: 'Provocative Question' },
];

interface HookResult {
  style: string;
  styleLabel: string;
  script: string;
  duration: string;
}

/* ── Copy Button ── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888888] hover:text-[#E8E8E8]" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ── Hook style colors ── */
function styleColor(index: number): { color: string; bg: string; border: string } {
  const styles = [
    { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
    { color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.3)' },
    { color: '#4A9EFF', bg: 'rgba(74,158,255,0.1)', border: 'rgba(74,158,255,0.3)' },
  ];
  return styles[index % 3];
}

function styleIcon(style: string) {
  switch (style) {
    case 'shocking': return <Zap className="w-3.5 h-3.5" />;
    case 'personal': return <BookOpen className="w-3.5 h-3.5" />;
    case 'provocative': return <HelpCircle className="w-3.5 h-3.5" />;
    default: return <Anchor className="w-3.5 h-3.5" />;
  }
}


export function HookTool() {
  const { spendTokens } = useNychIQStore();
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('all');
  const [results, setResults] = useState<HookResult[]>([]);
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
    const ok = spendTokens('hook');
    if (!ok) { setLoading(false); return; }

    try {
      const styleInstruction = style === 'all' ? '3 different hook styles: a shocking statistic, a personal story, and a provocative question' : `a ${style} hook style`;
      const prompt = `You are a YouTube hook writing expert. Generate ${styleInstruction} for a video about: "${topic.trim()}".

Return a JSON array of hooks. Each hook should have:
- "style": "shocking", "personal", or "provocative"
- "styleLabel": a label like "HOOK 1", "HOOK 2", or "HOOK 3"
- "script": a full hook script (75-85 words, about 30 seconds of speaking time). Include timestamp markers like [0s], [5s], [15s], [25s] within the script text.
- "duration": estimated spoken duration like "~30 seconds"

Return ONLY the JSON array.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        setRawText(response);
        setResults([]);
        return;
      }
      if (Array.isArray(parsed)) {
        setResults(parsed.map((h: any) => ({
          style: h.style || 'shocking',
          styleLabel: h.styleLabel || 'HOOK',
          script: h.script || 'No hook generated.',
          duration: h.duration || '~30 seconds',
        })));
      } else {
        setRawText(response);
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hooks. Please try again.');
      setResults([]);
      setRawText(null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#141414] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]"><Anchor className="w-5 h-5 text-[#FDBA2D]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Hook Generator</h2>
              <p className="text-xs text-[#888888] mt-0.5">Generate 3 different hook styles for the same topic — Shocking Stat, Personal Story, Provocative Question.</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="Enter your video topic..."
              className="w-full h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-2 flex-1">
                {STYLES.map((s) => (
                  <button key={s.value} onClick={() => setStyle(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${style === s.value ? 'bg-[#FDBA2D] text-[#0D0D0D]' : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#888888] hover:text-[#E8E8E8]'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <button onClick={handleGenerate} disabled={loading || !topic.trim()} className="px-5 h-9 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#D9A013] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Hooks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-3" />
          <p className="text-sm text-[#E8E8E8] mb-4">{error}</p>
          <button onClick={handleGenerate} className="px-4 py-2 rounded-lg bg-[#EF4444] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-[#141414] border border-[#222222] p-4">
              <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-1/4 mb-3" />
              <div className="space-y-2"><div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full" /><div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-5/6" /><div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-4/6" /></div>
            </div>
          ))}
        </div>
      )}

      {/* Raw Text Fallback */}
      {!loading && rawText && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FDBA2D]" /> Hook Results (Raw)
          </h3>
          <div className="rounded-lg bg-[#141414] border border-[#FDBA2D]/30 p-4">
            <p className="text-[10px] text-[#FDBA2D] mb-2 font-medium">Could not format the AI response. Showing raw output:</p>
            <pre className="text-sm text-[#E8E8E8] whitespace-pre-wrap leading-relaxed font-sans">{rawText}</pre>
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#E8E8E8] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#FDBA2D]" /> Generated Hooks</h3>
          {results.map((hook, i) => {
            const sc = styleColor(i);
            return (
              <div key={i} className="rounded-lg bg-[#141414] border border-[#222222] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold" style={{ color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.border}` }}>
                      {hook.styleLabel}
                    </span>
                    <span className="text-xs text-[#666666] flex items-center gap-1">{styleIcon(hook.style)} {hook.style}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#666666]">{hook.duration}</span>
                    <CopyBtn text={hook.script} />
                  </div>
                </div>
                <p className="text-sm text-[#E8E8E8] leading-relaxed whitespace-pre-line">{hook.script}</p>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mb-4"><Anchor className="w-8 h-8 text-[#FDBA2D]" /></div>
          <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Create Viral Hooks</h3>
          <p className="text-sm text-[#888888] max-w-xs text-center">Enter a video topic to generate 3 different hook styles with scripts and timing.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.hook} tokens per generation</div>}
    </div>
  );
}
