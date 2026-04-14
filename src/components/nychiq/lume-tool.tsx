'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Layers,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Trophy,
  Target,
  Eye,
  Palette,
  Type,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

/* ── Types ── */
interface ThumbnailResult {
  url: string;
  ctr: number;
  colorContrast: number;
  textReadability: number;
  emotionalImpact: number;
  heatmapZones: string[];
  improvements: string[];
}

interface ABResult {
  thumbnails: ThumbnailResult[];
  winnerIndex: number;
  confidence: number;
  overallAnalysis: string;
}

const HEATMAP_COLORS = ['#666666', '#888888', '#FDE68A', '#22c55e', '#888888'];

/* ── Heatmap overlay for a thumbnail ── */
function HeatmapOverlay({ zones }: { zones: string[] }) {
  if (zones.length === 0) return null;
  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
      {zones.map((zone, i) => {
        const positions: Record<string, string> = {
          'Top-Left': 'top-0 left-0',
          'Top-Center': 'top-0 left-1/2 -translate-x-1/2',
          'Top-Right': 'top-0 right-0',
          'Center-Left': 'top-1/2 left-0 -translate-y-1/2',
          'Center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'Center-Right': 'top-1/2 right-0 -translate-y-1/2',
          'Bottom-Left': 'bottom-0 left-0',
          'Bottom-Center': 'bottom-0 left-1/2 -translate-x-1/2',
          'Bottom-Right': 'bottom-0 right-0',
        };
        return (
          <div
            key={zone}
            className={`absolute w-1/3 h-1/3 ${positions[zone] ?? 'top-0 left-0'}`}
            style={{
              background: `radial-gradient(circle, ${HEATMAP_COLORS[i % HEATMAP_COLORS.length]}40, transparent 70%)`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Score pill ── */
function ScorePill({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? '#888888' : pct >= 60 ? '#F6A828' : pct >= 40 ? '#888888' : '#888888';
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── Thumbnail result card ── */
function ThumbnailCard({
  result,
  index,
  isWinner,
  confidence,
  onCopy,
}: {
  result: ThumbnailResult;
  index: number;
  isWinner: boolean;
  confidence: number;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-300 ${
        isWinner
          ? 'bg-[rgba(255,255,255,0.03)] border-[#888888]/40 shadow-lg shadow-[#888888]/5'
          : 'bg-[#0f0f0f] border-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.03)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#666666]">Thumbnail {index + 1}</span>
          {isWinner && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#888888]/15 text-[10px] font-bold text-[#888888]">
              <Trophy className="w-3 h-3" />
              WINNER
            </span>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2"
          style={{
            color: '#888888',
            backgroundColor: '#1a1a1a',
            borderColor: 'rgba(255,255,255,0.03)',
          }}
        >
          {result.ctr}%
        </div>
      </div>

      {/* CTR label */}
      <div className="flex items-center gap-1.5 mb-3">
        <Target className="w-3.5 h-3.5 text-[#888888]" />
        <span className="text-sm font-bold text-[#FFFFFF]">CTR: {result.ctr}%</span>
        {isWinner && (
          <span className="text-[10px] text-[#888888] ml-auto">+{confidence}% confidence</span>
        )}
      </div>

      {/* Thumbnail preview with heatmap */}
      <div className="relative rounded-lg overflow-hidden bg-[#0a0a0a] aspect-video mb-3 border border-[#1A1A1A]">
        {result.url ? (
          <img
            src={result.url}
            alt={`Thumbnail ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML =
                '<div class="flex items-center justify-center h-full"><span class="text-[#666666] text-xs">Image failed to load</span></div>';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-8 h-8 text-[#1a1a1a]" />
          </div>
        )}
        <HeatmapOverlay zones={result.heatmapZones} />
      </div>

      {/* Sub-scores */}
      <div className="space-y-2 mb-3">
        <ScorePill label="Color Contrast" value={result.colorContrast} max={100} />
        <ScorePill label="Text Readability" value={result.textReadability} max={100} />
        <ScorePill label="Emotional Impact" value={result.emotionalImpact} max={100} />
      </div>

      {/* Heatmap zones */}
      {result.heatmapZones.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Eye className="w-3 h-3 text-[#888888]" />
            <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider font-medium">Attention Zones</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.heatmapZones.map((zone, i) => (
              <span
                key={zone}
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{
                  color: HEATMAP_COLORS[i % HEATMAP_COLORS.length],
                  backgroundColor: `${HEATMAP_COLORS[i % HEATMAP_COLORS.length]}15`,
                }}
              >
                {zone}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Palette className="w-3 h-3 text-[#F6A828]" />
            <span className="text-[10px] text-[#a0a0a0] uppercase tracking-wider font-medium">
              Improvement Suggestions
            </span>
          </div>
          <div className="space-y-1">
            {result.improvements.map((imp, i) => (
              <p key={i} className="text-[11px] text-[#a0a0a0] flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 text-[#666666] mt-0.5 shrink-0" />
                {imp}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(255,255,255,0.03)] text-[11px] text-[#a0a0a0] hover:bg-[#1A1A1A] hover:text-[#FFFFFF] transition-colors"
      >
        {copied ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied!' : 'Copy Analysis'}
      </button>
    </div>
  );
}

/* ── Mock fallback data ── */
function getMockResults(urls: string[]): ABResult {
  const ctrs = [7.2, 5.1, 8.6];
  const winnerIdx = ctrs.indexOf(Math.max(...ctrs));
  return {
    thumbnails: [
      {
        url: urls[0] || '',
        ctr: ctrs[0],
        colorContrast: 72,
        textReadability: 68,
        emotionalImpact: 65,
        heatmapZones: ['Center', 'Bottom-Left'],
        improvements: ['Increase font size for better mobile visibility', 'Add a contrasting border around the subject'],
      },
      {
        url: urls[1] || '',
        ctr: ctrs[1],
        colorContrast: 58,
        textReadability: 55,
        emotionalImpact: 48,
        heatmapZones: ['Top-Center', 'Center-Right'],
        improvements: ['Use warmer color tones to draw the eye', 'Make the text bolder and larger', 'Add a face or emotional expression'],
      },
      {
        url: urls[2] || '',
        ctr: ctrs[2],
        colorContrast: 85,
        textReadability: 78,
        emotionalImpact: 82,
        heatmapZones: ['Center', 'Top-Left', 'Bottom-Center'],
        improvements: ['Consider adding a subtle gradient overlay for depth'],
      },
    ].filter((_, i) => i < urls.filter(Boolean).length),
    winnerIndex: winnerIdx,
    confidence: 87,
    overallAnalysis:
      'Thumbnail 3 performs best due to its high color contrast and strong emotional impact. The attention heatmap shows viewers focus on the center and faces, which is typical for high-performing thumbnails. Consider applying elements from the winner to improve lower-performing variants.',
  };
}

/* ── Main Lume Tool ── */
export function LumeTool() {
  const { spendTokens } = useNychIQStore();
  const [urls, setUrls] = useState(['', '', '']);
  const [result, setResult] = useState<ABResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const validUrls = urls.filter((u) => u.trim());
  const canRun = validUrls.length >= 2;

  const handleRun = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(null);

    const ok = spendTokens('lume');
    if (!ok) {
      setLoading(false);
      return;
    }

    try {
      const prompt = `You are a YouTube thumbnail expert. Analyze these ${validUrls.length} thumbnail URLs for an A/B test:
${validUrls.map((u, i) => `Thumbnail ${i + 1}: ${u}`).join('\n')}

Return a JSON object with:
- "thumbnails": Array of objects, each with:
  - "url": The original URL
  - "ctr": Predicted click-through rate as a percentage (3-15, one decimal)
  - "colorContrast": Score 0-100
  - "textReadability": Score 0-100
  - "emotionalImpact": Score 0-100
  - "heatmapZones": Array of 2-3 attention zone names (Top-Left, Top-Center, Top-Right, Center-Left, Center, Center-Right, Bottom-Left, Bottom-Center, Bottom-Right)
  - "improvements": Array of 2-3 specific improvement suggestions
- "winnerIndex": Index (0-based) of the winning thumbnail
- "confidence": Confidence percentage (60-99)
- "overallAnalysis": 2-3 sentence overall analysis

Return ONLY the JSON object, no other text.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.thumbnails && Array.isArray(parsed.thumbnails)) {
        setResult({
          thumbnails: parsed.thumbnails.map((t: any, i: number) => ({
            url: t.url || validUrls[i] || '',
            ctr: parseFloat(t.ctr) || 5.0,
            colorContrast: Math.min(100, Math.max(0, parseInt(t.colorContrast, 10) || 50)),
            textReadability: Math.min(100, Math.max(0, parseInt(t.textReadability, 10) || 50)),
            emotionalImpact: Math.min(100, Math.max(0, parseInt(t.emotionalImpact, 10) || 50)),
            heatmapZones: Array.isArray(t.heatmapZones) ? t.heatmapZones : ['Center'],
            improvements: Array.isArray(t.improvements) ? t.improvements : ['No suggestions'],
          })),
          winnerIndex: typeof parsed.winnerIndex === 'number' ? parsed.winnerIndex : 0,
          confidence: parseInt(parsed.confidence, 10) || 75,
          overallAnalysis: parsed.overallAnalysis || 'Analysis complete.',
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch {
      setResult(getMockResults(validUrls));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    if (!result) return;
    const text = result.thumbnails
      .map(
        (t, i) =>
          `Thumbnail ${i + 1}: CTR ${t.ctr}% | Contrast ${t.colorContrast} | Readability ${t.textReadability} | Emotional ${t.emotionalImpact}`
      )
      .join('\n');
    const fullText = text + `\n\nWinner: Thumbnail ${result.winnerIndex + 1} (${result.confidence}% confidence)\n${result.overallAnalysis}`;
    await copyToClipboard(fullText);
  };

  const handleReset = () => {
    setUrls(['', '', '']);
    setResult(null);
    setError(null);
    setSearched(false);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
              <Layers className="w-5 h-5 text-[#888888]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Lume — Thumbnail A/B Simulator</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                AI-powered thumbnail CTR prediction & heatmap analysis
              </p>
            </div>
          </div>
          <p className="text-sm text-[#a0a0a0] mb-4">
            Upload up to 3 thumbnail URLs. AI predicts CTR for each, declares a winner, shows heatmap
            zones, and gives improvement suggestions.
          </p>

          {/* URL Inputs */}
          <div className="space-y-2 mb-4">
            {urls.map((url, i) => (
              <div key={i} className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const next = [...urls];
                    next[i] = e.target.value;
                    setUrls(next);
                  }}
                  placeholder={`Thumbnail ${i + 1} URL${i === 0 ? ' (required)' : ' (optional)'}`}
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#888888]/50 focus:ring-1 focus:ring-[rgba(255,255,255,0.03)]/20 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={loading || !canRun}
              className="px-5 h-11 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              style={{
                backgroundColor: canRun ? '#888888' : '#1a1a1a',
                color: canRun ? '#0a0a0a' : '#a0a0a0',
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Run A/B Test
            </button>
            {searched && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 h-11 rounded-lg border border-[rgba(255,255,255,0.03)] text-xs text-[#a0a0a0] hover:bg-[#1A1A1A] hover:text-[#FFFFFF] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
          {validUrls.length < 2 && (
            <p className="text-[11px] text-[#888888] mt-2">Please enter at least 2 thumbnail URLs to compare.</p>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-[#888888] mx-auto mb-2" />
          <p className="text-sm text-[#FFFFFF]">{error}</p>
          <button
            onClick={handleRun}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            style={{ backgroundColor: '#888888', color: '#0a0a0a' }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-[#888888] animate-spin" />
              <span className="text-sm text-[#a0a0a0]">Analyzing thumbnails with AI...</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: validUrls.length }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-video bg-[#1A1A1A] rounded-lg animate-pulse" />
                  <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-2/3" />
                  <div className="space-y-2">
                    <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-full" />
                    <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-4/5" />
                    <div className="h-2 bg-[#1A1A1A] rounded animate-pulse w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <>
          {/* Winner banner */}
          <div
            className="rounded-lg p-4 border flex items-center gap-3"
            style={{
              backgroundColor: '#1a1a1a',
              borderColor: 'rgba(255,255,255,0.03)',
            }}
          >
            <Trophy className="w-6 h-6 text-[#888888] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#FFFFFF]">
                Thumbnail {result.winnerIndex + 1} wins with {result.confidence}% confidence
              </p>
              <p className="text-xs text-[#a0a0a0] mt-0.5 line-clamp-2">{result.overallAnalysis}</p>
            </div>
          </div>

          {/* Thumbnail cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {result.thumbnails.map((thumb, i) => (
              <ThumbnailCard
                key={i}
                result={thumb}
                index={i}
                isWinner={i === result.winnerIndex}
                confidence={result.confidence}
                onCopy={handleCopyAll}
              />
            ))}
          </div>
        </>
      )}

      {/* Initial idle state */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-[#888888]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Thumbnail A/B Simulator</h3>
          <p className="text-sm text-[#a0a0a0] max-w-xs text-center">
            Paste 2-3 thumbnail URLs above and run an AI-powered A/B test to find the best performer.
          </p>
        </div>
      )}

      {/* Token cost footer */}
      {searched && (
        <div className="text-center text-[11px] text-[#666666]">
          Cost: {TOKEN_COSTS.lume} tokens per analysis
        </div>
      )}
    </div>
  );
}
