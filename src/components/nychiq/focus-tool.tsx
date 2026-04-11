'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore } from '@/lib/store';
import { Clock, Play, Square, RotateCcw, Sparkles, Brain, Quote } from 'lucide-react';

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', color: '#E05252' },
  { id: 'tiktok', label: 'TikTok', color: '#4A9EFF' },
  { id: 'x', label: 'X (Twitter)', color: '#E8E8E8' },
];

const DURATIONS = [5, 10, 15, 25, 45];

const MOTIVATIONAL_QUOTES = [
  { text: '"Deep work is the ability to focus without distraction on a cognitively demanding task."', author: 'Cal Newport' },
  { text: '"The cost of a thing is the amount of what I call life which is required to be exchanged for it."', author: 'Henry David Thoreau' },
  { text: '"Almost everything will work again if you unplug it for a few minutes, including you."', author: 'Anne Lamott' },
  { text: '"Focus is not about saying yes; it is about saying no to the hundred other good ideas."', author: 'Steve Jobs' },
  { text: '"You do not rise to the level of your goals. You fall to the level of your systems."', author: 'James Clear' },
  { text: '"What you do today can improve all your tomorrows."', author: 'Ralph Marston' },
];

export function FocusTool() {
  const { setActiveTool } = useNychIQStore();
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({
    youtube: true,
    tiktok: true,
    x: false,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [quote, setQuote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const handleStart = useCallback(() => {
    if (!isRunning) {
      setTimeLeft(selectedDuration * 60);
      setIsRunning(true);
      const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
      setQuote(MOTIVATIONAL_QUOTES[idx]);
    }
  }, [isRunning, selectedDuration]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
  }, [selectedDuration]);

  const togglePlatform = (id: string) => {
    if (isRunning) return;
    setPlatforms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = selectedDuration * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border border-[rgba(0,196,140,0.25)]" style={{ background: 'radial-gradient(circle, rgba(0,196,140,0.2) 0%, transparent 70%)' }}>
            <Clock className="w-5 h-5 text-[#00C48C]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#E8E8E8] tracking-tight">Focus & Productivity</h2>
            <p className="text-[11px] text-[#888888] mt-0.5">Block infinite scroll, stay focused, and protect your deep work sessions.</p>
          </div>
        </div>
      </div>

      {/* Pause Tool Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-[#00C48C]" />
          <h3 className="text-sm font-bold text-[#E8E8E8]">Pause — Smart Scroll Blocker</h3>
        </div>

        <div className="flex flex-col items-center">
          {/* Timer Ring */}
          <div className="relative mb-6" style={{ width: 200, height: 200 }}>
            <svg className="-rotate-90" style={{ width: 200, height: 200 }} viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#1A1A1A" strokeWidth="6" />
              <circle
                cx="100" cy="100" r="90"
                fill="none"
                stroke={isRunning ? '#00C48C' : '#9B72CF'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 8px ${isRunning ? 'rgba(0,196,140,0.4)' : 'rgba(155,114,207,0.3)'})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tracking-wider" style={{ color: isRunning ? '#00C48C' : '#E8E8E8', fontFamily: 'monospace' }}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-[#666] mt-1">
                {isRunning ? 'FOCUSING' : timeLeft === 0 ? 'DONE!' : 'READY'}
              </span>
            </div>
          </div>

          {/* Duration Buttons */}
          {!isRunning && (
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDuration(d); setTimeLeft(d * 60); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedDuration === d
                      ? 'bg-[#00C48C] text-black shadow-[0_0_16px_rgba(0,196,140,0.3)]'
                      : 'bg-[#1A1A1A] text-[#888] border border-[#222] hover:border-[#333] hover:text-[#E8E8E8]'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center gap-3">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00C48C] text-black text-sm font-bold hover:bg-[#00A876] transition-all shadow-[0_0_20px_rgba(0,196,140,0.3)]"
              >
                <Play className="w-4 h-4" /> Start Focus
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E05252] text-white text-sm font-bold hover:bg-[#C94444] transition-all shadow-[0_0_20px_rgba(224,82,82,0.3)]"
              >
                <Square className="w-4 h-4" /> Stop
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1A1A1A] text-[#888] text-sm font-medium border border-[#222] hover:border-[#333] hover:text-[#E8E8E8] transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Platform Toggles */}
        <div className="mt-8 border-t border-[#1E1E1E] pt-5">
          <p className="text-[11px] text-[#666] font-semibold uppercase tracking-wider mb-3">Block Platforms</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                disabled={isRunning}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  platforms[p.id]
                    ? 'border shadow-sm'
                    : 'bg-[#1A1A1A] text-[#555] border border-[#222] hover:border-[#333]'
                } ${isRunning ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={platforms[p.id] ? {
                  backgroundColor: `${p.color}15`,
                  color: p.color,
                  borderColor: `${p.color}30`,
                } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platforms[p.id] ? p.color : '#444' }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="mt-6 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] p-5">
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-[#00C48C] mt-0.5 shrink-0 opacity-60" />
            <div>
              <p className="text-sm leading-relaxed text-[#AAAAAA] italic">{quote.text}</p>
              <p className="text-[11px] text-[#666] mt-2 font-medium">— {quote.author}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Other Focus Tools */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
        <h3 className="text-sm font-bold text-[#E8E8E8] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9B72CF]" /> More Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTool('content-studio')}
            className="flex items-center gap-3 p-4 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] hover:border-[#333] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-[rgba(155,114,207,0.1)] flex items-center justify-center text-[#9B72CF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#E8E8E8]">Content Studio</p>
              <p className="text-[10px] text-[#888]">12 creation & repurposing tools</p>
            </div>
          </button>
          <button
            onClick={() => setActiveTool('growth-tools')}
            className="flex items-center gap-3 p-4 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] hover:border-[#333] transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-[rgba(245,166,35,0.1)] flex items-center justify-center text-[#F5A623]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#E8E8E8]">Growth Tools</p>
              <p className="text-[10px] text-[#888]">AI Coach & growth intelligence</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
