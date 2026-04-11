'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Film,
  Link,
  Download,
  Scissors,
  MonitorSmartphone,
  Smartphone,
  Square,
} from 'lucide-react';

const ASPECT_RATIOS = [
  { label: '16:9', value: '16:9', icon: MonitorSmartphone },
  { label: '9:16', value: '9:16', icon: Smartphone },
  { label: '1:1', value: '1:1', icon: Square },
];

export function ClipDropTool() {
  const {} = useNychIQStore();
  const [url, setUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
              <Film className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">ClipDrop</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                In-Browser Clip Trimmer &amp; Reformatter
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-[#888888] mb-4 leading-relaxed">
            Instantly capture, trim, and convert any segment into vertical Reels/Shorts format.
          </p>

          {/* URL Input */}
          <div className="space-y-4">
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste video URL..."
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-xs font-medium text-[#666666] mb-2 block">
                Output Format
              </label>
              <div className="flex flex-wrap gap-2">
                {ASPECT_RATIOS.map((ar) => {
                  const Icon = ar.icon;
                  return (
                    <button
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        aspectRatio === ar.value
                          ? 'bg-[#F5A623] text-[#0A0A0A] shadow-lg shadow-[#F5A623]/20'
                          : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#888888] hover:text-[#E8E8E8] hover:border-[#333333]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {ar.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trim Timeline Mockup */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Scissors className="w-4 h-4 text-[#F5A623]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Trim Timeline</h3>
        </div>

        {/* Timeline Bar */}
        <div className="relative mt-4 mb-6">
          <div className="h-12 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] overflow-hidden relative">
            {/* Waveform mockup */}
            <div className="absolute inset-0 flex items-center gap-[2px] px-2">
              {Array.from({ length: 80 }).map((_, i) => {
                const h = 15 + Math.sin(i * 0.3) * 20 + Math.random() * 15;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-[#333333]"
                    style={{ height: `${Math.min(h, 100)}%` }}
                  />
                );
              })}
            </div>
            {/* Selected region */}
            <div
              className="absolute top-0 bottom-0 bg-[#F5A623]/10 border-x-2 border-[#F5A623]"
              style={{ left: '20%', right: '35%' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F5A623] cursor-col-resize" />
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#F5A623] cursor-col-resize" />
            </div>
          </div>
          {/* Time markers */}
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-[#555555]">0:00</span>
            <span className="text-[10px] text-[#F5A623] font-medium">0:12</span>
            <span className="text-[10px] text-[#F5A623] font-medium">0:34</span>
            <span className="text-[10px] text-[#555555]">1:00</span>
          </div>
        </div>

        {/* Trim Info */}
        <div className="flex items-center justify-between text-xs text-[#666666]">
          <span>
            Selected: <span className="text-[#E8E8E8]">0:12 - 0:34</span> ({' '}
            <span className="text-[#F5A623]">22s</span> )
          </span>
          <span>
            Format: <span className="text-[#E8E8E8]">{aspectRatio}</span>
          </span>
        </div>
      </div>

      {/* Preview Area */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#E8E8E8] mb-3">Preview</h3>
        <div
          className={`mx-auto bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg flex items-center justify-center text-[#333333] text-sm ${
            aspectRatio === '9:16'
              ? 'w-48 h-[21.3rem]'
              : aspectRatio === '16:9'
              ? 'w-full h-48 sm:h-64'
              : 'w-64 h-64'
          }`}
        >
          <div className="text-center">
            <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <span className="text-[#555555]">
              {url ? 'Video preview area' : 'Paste a URL to preview'}
            </span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#444444]">Cost: 0 tokens (free tool)</span>
        <button className="px-5 h-10 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors flex items-center gap-2 shadow-lg shadow-[#F5A623]/20">
          <Download className="w-4 h-4" />
          Export Clip
        </button>
      </div>
    </div>
  );
}
