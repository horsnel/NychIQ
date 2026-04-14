'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { copyToClipboard } from '@/lib/utils';
import { askAI } from '@/lib/api';
import {
  FileText,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const TONES = ['Casual', 'Professional', 'Educational', 'Entertaining'];
const LENGTHS = [
  { value: '5min', label: '5 min' },
  { value: '10min', label: '10 min' },
  { value: '15min', label: '15 min' },
  { value: '20min', label: '20 min' },
];

interface ScriptSection {
  heading: string;
  content: string;
}

interface ScriptResult {
  topic: string;
  tone: string;
  targetLength: string;
  sections: ScriptSection[];
  estimatedReadTime: string;
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


export function ScriptTool() {
  const { spendTokens } = useNychIQStore();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Casual');
  const [length, setLength] = useState('10min');
  const [result, setResult] = useState<ScriptResult | null>(null);
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
    const ok = spendTokens('script');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a professional YouTube scriptwriter. Write a complete video script for the topic: "${topic.trim()}".
Tone: ${tone}. Target length: ${length}.

Structure the script with these sections:
1. HOOK (attention-grabbing opening, 15-20 seconds)
2. INTRO (channel branding + video overview, 20-30 seconds)
3. BODY (main content with clear points, transitions, examples)
4. CTA (call to action — subscribe, like, comment, 15-20 seconds)
5. OUTRO (closing thoughts + next video tease, 15-20 seconds)

Return a JSON object with:
- "topic": the topic
- "tone": the tone used
- "targetLength": "${length}"
- "estimatedReadTime": estimated time to read aloud (e.g., "~8 minutes")
- "sections": array of objects, each with "heading" (like "HOOK", "INTRO", etc.) and "content" (the full section script text, 150-400+ words per section)

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
        topic: parsed.topic || topic.trim(),
        tone: parsed.tone || tone,
        targetLength: parsed.targetLength || length,
        estimatedReadTime: parsed.estimatedReadTime || '~8 minutes',
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script. Please try again.');
      setResult(null);
      setRawText(null);
    } finally {
      setLoading(false);
    }
  };
  const fullScript = result ? result.sections.map((s) => `[${s.heading}]\n${s.content}`).join('\n\n') : '';

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(246,168,40,0.1)]"><FileText className="w-5 h-5 text-[#F6A828]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Script Writer</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Full video script with sections: Hook, Intro, Body, CTA, Outro</p>
            </div>
          </div>
          <div className="space-y-3">
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="Enter your video topic..."
              className="w-full h-11 px-4 rounded-full bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#F6A828]/50 transition-colors"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[#666666] mb-1 block">Tone</label>
                <div className="flex gap-1.5">
                  {TONES.map((t) => (
                    <button key={t} onClick={() => setTone(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tone === t ? 'bg-[#F6A828] text-[#0a0a0a]' : 'bg-[#0a0a0a] border border-[#1A1A1A] text-[#a0a0a0] hover:text-[#FFFFFF]'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#666666] mb-1 block">Length</label>
                <div className="flex gap-1.5">
                  {LENGTHS.map((l) => (
                    <button key={l.value} onClick={() => setLength(l.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${length === l.value ? 'bg-[#F6A828] text-[#0a0a0a]' : 'bg-[#0a0a0a] border border-[#1A1A1A] text-[#a0a0a0] hover:text-[#FFFFFF]'}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#F6A828] text-[#0a0a0a] text-sm font-bold hover:bg-[#FFB340] hover:shadow-lg hover:shadow-[rgba(246,168,40,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Write Script
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

      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
            <div className="h-5 bg-[#1A1A1A] rounded animate-pulse w-1/3 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-3 bg-[#1A1A1A] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />)}
            </div>
          </div>
        </div>
      )}

      {/* Raw Text Fallback */}
      {!loading && rawText && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F6A828]" /> Script Results (Raw)
          </h3>
          <div className="rounded-lg bg-[#0f0f0f] border border-[#F6A828]/30 p-4">
            <p className="text-[10px] text-[#F6A828] mb-2 font-medium">Could not format the AI response. Showing raw output:</p>
            <pre className="text-sm text-[#FFFFFF] whitespace-pre-wrap leading-relaxed font-sans">{rawText}</pre>
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F6A828]" /> Script Generated
              <span className="text-[10px] text-[#666666] font-normal flex items-center gap-1"><Clock className="w-3 h-3" /> {result.estimatedReadTime}</span>
            </h3>
            <CopyBtn text={fullScript} />
          </div>
          {result.sections.map((section, i) => (
            <div key={i} className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{
                  color: i === 0 ? '#888888' : i === 1 ? '#888888' : i === 2 ? '#F6A828' : i === 3 ? '#888888' : '#888888'
                }}>{section.heading}</h4>
                <CopyBtn text={section.content} />
              </div>
              <p className="text-sm text-[#FFFFFF] leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(246,168,40,0.1)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-[#F6A828]" /></div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Write Your Script</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">Enter a topic to generate a complete video script with Hook, Intro, Body, CTA, and Outro sections.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#666666]">Cost: {TOKEN_COSTS.script} tokens per generation</div>}
    </div>
  );
}
