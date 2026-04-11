'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Type,
  Sparkles,
  Play,
  Wand2,
  MonitorSmartphone,
} from 'lucide-react';

const TEXT_STYLES = [
  { id: 'neon', label: 'Neon', desc: 'Glowing neon text effect' },
  { id: 'typewriter', label: 'Typewriter', desc: 'Classic typewriter animation' },
  { id: 'glitch', label: 'Glitch', desc: 'Digital glitch distortion' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, elegant fade-in' },
];

function getStylePreviewBg(styleId: string): string {
  switch (styleId) {
    case 'neon': return 'rgba(155,114,207,0.08)';
    case 'typewriter': return 'rgba(155,114,207,0.05)';
    case 'glitch': return 'rgba(155,114,207,0.12)';
    case 'minimal': return 'rgba(155,114,207,0.04)';
    default: return 'rgba(155,114,207,0.06)';
  }
}

function getStyleTextStyle(styleId: string): React.CSSProperties {
  switch (styleId) {
    case 'neon':
      return {
        color: '#9B72CF',
        textShadow: '0 0 10px rgba(155,114,207,0.6), 0 0 30px rgba(155,114,207,0.3)',
      };
    case 'typewriter':
      return {
        color: '#E8E8E8',
        fontFamily: 'monospace',
      };
    case 'glitch':
      return {
        color: '#E8E8E8',
        textShadow: '2px 0 #9B72CF, -2px 0 #4A9EFF',
        letterSpacing: '0.05em',
      };
    case 'minimal':
      return {
        color: '#E8E8E8',
        letterSpacing: '0.1em',
      };
    default:
      return { color: '#E8E8E8' };
  }
}

export function ReelTypeTool() {
  const {} = useNychIQStore();
  const [selectedStyle, setSelectedStyle] = useState('neon');
  const [previewText] = useState('Your Story Starts Here');

  const activeStyle = TEXT_STYLES.find((s) => s.id === selectedStyle)!;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
              <Type className="w-5 h-5 text-[#9B72CF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">ReelType</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Text-Animated Video Generator
              </p>
            </div>
          </div>

          <p className="text-sm text-[#888888] mb-4 leading-relaxed">
            Create eye-catching text animations for your Reels and Shorts. Choose a style, enter your text, and generate scroll-stopping video intros.
          </p>
        </div>
      </div>

      {/* Text Style Selector */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-4 h-4 text-[#9B72CF]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Text Style</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TEXT_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`relative p-3 rounded-lg text-left transition-all duration-200 ${
                selectedStyle === style.id
                  ? 'bg-[#9B72CF]/15 border-2 border-[#9B72CF]/50 shadow-lg shadow-[#9B72CF]/10'
                  : 'bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#333333]'
              }`}
            >
              <div className="text-xs font-bold text-[#E8E8E8] mb-1">{style.label}</div>
              <div className="text-[10px] text-[#666666] leading-snug">{style.desc}</div>
              {selectedStyle === style.id && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#9B72CF]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-[#9B72CF]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Preview</h3>
          </div>
          <span className="text-[10px] text-[#555555] bg-[#1A1A1A] px-2 py-0.5 rounded-full">
            {activeStyle.label} style
          </span>
        </div>

        {/* Phone Preview Frame */}
        <div className="mx-auto w-56 bg-[#0D0D0D] rounded-2xl border border-[#1A1A1A] overflow-hidden">
          {/* Phone notch */}
          <div className="h-6 bg-[#0A0A0A] flex items-center justify-center">
            <div className="w-16 h-1 rounded-full bg-[#222222]" />
          </div>

          {/* Preview Content */}
          <div
            className="flex items-center justify-center py-16 px-4"
            style={{ backgroundColor: getStylePreviewBg(selectedStyle) }}
          >
            <div className="text-center">
              <p
                className="text-lg font-bold mb-2 transition-all duration-300"
                style={getStyleTextStyle(selectedStyle)}
              >
                {selectedStyle === 'typewriter' ? (
                  <>
                    {previewText.split('').map((char, i) => (
                      <span
                        key={i}
                        style={{ opacity: char === ' ' ? 0 : Math.random() > 0.3 ? 1 : 0.3 }}
                      >
                        {char}
                      </span>
                    ))}
                  </>
                ) : selectedStyle === 'glitch' ? (
                  <>
                    <span className="inline-block -mr-[3px]">{previewText.split(' ')[0]}</span>
                    <br />
                    <span className="inline-block">{previewText.split(' ').slice(1).join(' ')}</span>
                  </>
                ) : (
                  previewText
                )}
              </p>
              {selectedStyle === 'neon' && (
                <div className="w-12 h-[2px] mx-auto bg-[#9B72CF] rounded-full shadow-lg shadow-[#9B72CF]/50" />
              )}
              {selectedStyle === 'typewriter' && (
                <div className="w-0.5 h-5 bg-[#9B72CF] animate-pulse mx-auto mt-1" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#444444]">Cost: 0 tokens (free tool)</span>
        <button className="px-5 h-10 rounded-lg bg-[#9B72CF] text-white text-sm font-bold hover:bg-[#8A62BE] transition-colors flex items-center gap-2 shadow-lg shadow-[#9B72CF]/20">
          <Sparkles className="w-4 h-4" />
          Generate Video
        </button>
      </div>
    </div>
  );
}
