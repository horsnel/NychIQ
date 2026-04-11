'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Heart,
} from 'lucide-react';

const VIBES = [
  { id: 'funny', label: '😂 Funny', emoji: '😂' },
  { id: 'deep', label: '🧠 Deep', emoji: '🧠' },
  { id: 'sassy', label: '💅 Sassy', emoji: '💅' },
  { id: 'motivational', label: '🔥 Motivational', emoji: '🔥' },
];

interface GeneratedCaption {
  id: number;
  text: string;
  hashtags: string[];
  vibe: string;
}

const MOCK_CAPTIONS: GeneratedCaption[] = [
  {
    id: 1,
    text: 'POV: You spent 6 hours editing a 30-second video and nobody noticed the 400 transitions 😅🎬',
    hashtags: ['#contentcreator', '#editinglife', '#relatable'],
    vibe: 'funny',
  },
  {
    id: 2,
    text: 'Every great creator started with zero views. Your first 10 subscribers are the hardest — and the most important.',
    hashtags: ['#growthmindset', '#creators', '#keeppushing'],
    vibe: 'motivational',
  },
  {
    id: 3,
    text: 'The algorithm didn\'t ghost you. You just haven\'t posted the right hook yet 💅✨',
    hashtags: ['#socialmedia', '#algorithm', '#creatorlife'],
    vibe: 'sassy',
  },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888888] hover:text-[#E8E8E8]"
      title="Copy"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[#00C48C]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export function CaptionCraftTool() {
  const {} = useNychIQStore();
  const [selectedVibe, setSelectedVibe] = useState('funny');

  const filteredCaptions = MOCK_CAPTIONS.filter((c) => c.vibe === selectedVibe);
  const displayCaptions = filteredCaptions.length > 0 ? filteredCaptions : MOCK_CAPTIONS.slice(0, 2);

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
              <FileText className="w-5 h-5 text-[#00C48C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">CaptionCraft</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                AI-Powered Caption Generator
              </p>
            </div>
          </div>

          <p className="text-sm text-[#888888] mb-4 leading-relaxed">
            Generate scroll-stopping captions for any post. Pick a vibe, get multiple options with hashtags, and copy instantly.
          </p>
        </div>
      </div>

      {/* Vibe Selector */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-[#00C48C]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Choose a Vibe</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VIBES.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => setSelectedVibe(vibe.id)}
              className={`p-3 rounded-lg text-center transition-all duration-200 ${
                selectedVibe === vibe.id
                  ? 'bg-[#00C48C]/15 border-2 border-[#00C48C]/50 shadow-lg shadow-[#00C48C]/10'
                  : 'bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#333333]'
              }`}
            >
              <span className="text-xl block mb-1">{vibe.emoji}</span>
              <span className="text-xs font-bold text-[#E8E8E8]">{vibe.label}</span>
              {selectedVibe === vibe.id && (
                <div className="w-2 h-2 rounded-full bg-[#00C48C] mx-auto mt-2" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button className="w-full px-5 h-10 rounded-lg bg-[#00C48C] text-[#0A0A0A] text-sm font-bold hover:bg-[#00B07D] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#00C48C]/20">
        <Sparkles className="w-4 h-4" />
        Generate Captions
      </button>

      {/* Generated Captions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00C48C]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Generated Captions</h3>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#00C48C] transition-colors">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {displayCaptions.map((caption) => (
          <div
            key={caption.id}
            className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#2A2A2A] transition-all duration-200 group"
          >
            <p className="text-sm text-[#E8E8E8] leading-relaxed mb-3">
              {caption.text}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {caption.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium text-[#00C48C] bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#555555] capitalize">{caption.vibe} vibe</span>
              <CopyBtn text={caption.text + '\n\n' + caption.hashtags.join(' ')} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-[#444444]">Cost: 0 tokens (free tool)</div>
    </div>
  );
}
