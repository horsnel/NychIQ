'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Clock,
  Play,
  Square,
  RotateCcw,
  Youtube,
  Instagram,
  Twitter,
  Brain,
  Volume2,
  VolumeX,
} from 'lucide-react';

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'tiktok', label: 'TikTok', icon: Instagram },
  { id: 'x', label: 'X', icon: Twitter },
];

const MOTIVATIONAL_QUOTES = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Almost everything will work again if you unplug it for a few minutes, including you." — Anne Lamott',
  '"Your calm mind is the ultimate weapon against your challenges." — Bryant McGill',
  '"Take rest; a field that has rested gives a bountiful crop." — Ovid',
  '"In the middle of difficulty lies opportunity." — Albert Einstein',
  '"Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure." — Oprah Winfrey',
];

const FOCUS_DURATIONS = [5, 10, 15, 25];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PauseTool() {
  const {} = useNychIQStore();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [blockedPlatforms, setBlockedPlatforms] = useState<Set<string>>(new Set(['youtube', 'tiktok', 'x']));
  const [currentQuote] = useState(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  const [isMuted, setIsMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlatform = useCallback((platformId: string) => {
    setBlockedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  }, []);

  const handleStart = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  }, [isRunning]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
  }, [selectedDuration]);

  const handleDurationChange = useCallback((duration: number) => {
    if (isRunning) return;
    setSelectedDuration(duration);
    setTimeLeft(duration * 60);
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
              <Clock className="w-5 h-5 text-[#00C48C]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Pause</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Focus &amp; Mindfulness Tool
              </p>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="ml-auto p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#555555] hover:text-[#E8E8E8]"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-sm text-[#888888] leading-relaxed">
            Step away from distractions. Set a timer, block platforms, and focus on what matters — your next creative breakthrough.
          </p>
        </div>
      </div>

      {/* Timer Display */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 sm:p-8">
        <div className="flex flex-col items-center">
          {/* Circular Timer */}
          <div className="relative w-48 h-48 mb-6">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="4"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={isRunning ? '#00C48C' : timeLeft === 0 ? '#E05252' : '#333333'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl font-bold text-[#E8E8E8] font-mono tracking-wider">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] text-[#555555] mt-1 uppercase tracking-widest">
                {isRunning ? 'focusing' : timeLeft === 0 ? 'complete' : 'ready'}
              </span>
            </div>
          </div>

          {/* Duration Selector */}
          <div className="flex items-center gap-2 mb-6">
            {FOCUS_DURATIONS.map((dur) => (
              <button
                key={dur}
                onClick={() => handleDurationChange(dur)}
                disabled={isRunning}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedDuration === dur
                    ? 'bg-[#00C48C] text-[#0A0A0A]'
                    : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#888888] hover:text-[#E8E8E8] disabled:opacity-50'
                }`}
              >
                {dur}m
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-[#888888] hover:text-[#E8E8E8] hover:border-[#333333] transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleStart}
              className={`px-8 h-12 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg ${
                isRunning
                  ? 'bg-[#E05252] text-white hover:bg-[#D04242] shadow-[#E05252]/20'
                  : 'bg-[#00C48C] text-[#0A0A0A] hover:bg-[#00B07D] shadow-[#00C48C]/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Focus
                </>
              )}
            </button>
            <div className="w-11" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Platform Toggles */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-[#00C48C]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Platform Distractions</h3>
        </div>

        <div className="space-y-3">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isBlocked = blockedPlatforms.has(platform.id);
            return (
              <div
                key={platform.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#888888]" />
                  <span className="text-sm text-[#E8E8E8]">{platform.label}</span>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => togglePlatform(platform.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    isBlocked ? 'bg-[#00C48C]' : 'bg-[#333333]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      isBlocked ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-[#555555] mt-3 text-center">
          {blockedPlatforms.size} platform{blockedPlatforms.size !== 1 ? 's' : ''} paused during focus time
        </p>
      </div>

      {/* Motivational Quote */}
      <div className="rounded-lg bg-[#111111] border border-[#00C48C]/10 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-[#00C48C]/50" />
          <h3 className="text-xs font-medium text-[#555555] uppercase tracking-wider">Words to focus by</h3>
        </div>
        <p className="text-sm text-[#888888] leading-relaxed text-center italic">
          {currentQuote}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-[#444444]">Cost: 0 tokens (free tool)</div>
    </div>
  );
}
