'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Palette,
  Sparkles,
  Download,
  Quote,
  Brush,
} from 'lucide-react';

const STYLE_PRESETS = [
  { id: 'minimal', label: 'Minimal', desc: 'Clean & simple' },
  { id: 'bold', label: 'Bold', desc: 'High impact' },
  { id: 'elegant', label: 'Elegant', desc: 'Sophisticated' },
];

function getPresetColors(preset: string) {
  switch (preset) {
    case 'minimal':
      return { bg: '#1A1A1A', text: '#E8E8E8', accent: '#E05252', border: '#2A2A2A' };
    case 'bold':
      return { bg: '#E05252', text: '#FFFFFF', accent: '#FFFFFF', border: '#C94242' };
    case 'elegant':
      return { bg: '#0D0D0D', text: '#D4AF37', accent: '#E05252', border: '#333333' };
    default:
      return { bg: '#1A1A1A', text: '#E8E8E8', accent: '#E05252', border: '#2A2A2A' };
  }
}

export function QuoteFlipTool() {
  const {} = useNychIQStore();
  const [quote, setQuote] = useState('The only way to do great work is to love what you do.');
  const [author, setAuthor] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('minimal');
  const colors = getPresetColors(selectedPreset);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(224,82,82,0.1)]">
              <Palette className="w-5 h-5 text-[#E05252]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">QuoteFlip</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Quote Graphic Generator
              </p>
            </div>
          </div>

          <p className="text-sm text-[#888888] mb-4 leading-relaxed">
            Turn any quote into a stunning shareable graphic. Perfect for Instagram Stories, Twitter headers, or video thumbnails.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#666666] mb-1.5 block">
              Your Quote
            </label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Enter your quote or message..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#E05252]/50 transition-colors resize-none leading-relaxed"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#666666] mb-1.5 block">
              Author (optional)
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Steve Jobs"
              className="w-full h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#E05252]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Style Presets */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brush className="w-4 h-4 text-[#E05252]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Style Preset</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {STYLE_PRESETS.map((preset) => {
            const presetColors = getPresetColors(preset.id);
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                className={`relative p-3 rounded-lg text-left transition-all duration-200 ${
                  selectedPreset === preset.id
                    ? 'bg-[#E05252]/15 border-2 border-[#E05252]/50 shadow-lg shadow-[#E05252]/10'
                    : 'bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#333333]'
                }`}
              >
                {/* Mini preview */}
                <div
                  className="w-full h-10 rounded mb-2 flex items-center justify-center"
                  style={{ backgroundColor: presetColors.bg, border: `1px solid ${presetColors.border}` }}
                >
                  <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: presetColors.text }} />
                </div>
                <div className="text-xs font-bold text-[#E8E8E8] mb-0.5">{preset.label}</div>
                <div className="text-[10px] text-[#666666]">{preset.desc}</div>
                {selectedPreset === preset.id && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E05252]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E05252]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Preview</h3>
          </div>
        </div>

        {/* Quote Graphic Mockup */}
        <div
          className="mx-auto max-w-md rounded-xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* Decorative elements */}
          {selectedPreset === 'elegant' && (
            <>
              <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)` }} />
              <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(to right, transparent, ${colors.accent}, transparent)` }} />
            </>
          )}
          {selectedPreset === 'bold' && (
            <div className="absolute top-4 right-4 opacity-10">
              <Quote className="w-16 h-16" style={{ color: colors.text }} />
            </div>
          )}

          {/* Quote mark */}
          <Quote
            className="w-6 h-6 mb-4 opacity-40"
            style={{ color: selectedPreset === 'bold' ? colors.text : colors.accent }}
          />

          {/* Quote text */}
          <p
            className="text-base sm:text-lg font-medium leading-relaxed mb-4"
            style={{
              color: colors.text,
              fontStyle: selectedPreset === 'elegant' ? 'italic' : 'normal',
              fontWeight: selectedPreset === 'bold' ? 800 : 500,
              letterSpacing: selectedPreset === 'minimal' ? '0.01em' : selectedPreset === 'elegant' ? '0.02em' : '0',
            }}
          >
            &ldquo;{quote}&rdquo;
          </p>

          {/* Author */}
          {author && (
            <p className="text-sm opacity-70" style={{ color: colors.text }}>
              — {author}
            </p>
          )}
        </div>
      </div>

      {/* Download Button */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#444444]">Cost: 0 tokens (free tool)</span>
        <button className="px-5 h-10 rounded-lg bg-[#E05252] text-white text-sm font-bold hover:bg-[#D04242] transition-colors flex items-center gap-2 shadow-lg shadow-[#E05252]/20">
          <Download className="w-4 h-4" />
          Download Graphic
        </button>
      </div>
    </div>
  );
}
