'use client';

import React from 'react';
import {
  ArrowRight,
  Sparkles,
  Download,
  Globe,
  Settings,
  Zap,
  Check,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNychIQStore } from '@/lib/store';

/* ── Install steps ── */
const STEPS = [
  {
    num: '1',
    title: 'Add to Chrome',
    desc: 'Click the install button below to add NychIQ to your Chrome browser from the Chrome Web Store.',
    icon: Download,
    color: '#4A9EFF',
  },
  {
    num: '2',
    title: 'Pin the Extension',
    desc: 'After installing, click the puzzle icon in Chrome and pin NychIQ to your toolbar for easy access.',
    icon: Settings,
    color: '#FDBA2D',
  },
  {
    num: '3',
    title: 'Browse YouTube',
    desc: 'Visit any YouTube video or channel page and NychIQ will automatically show real-time insights.',
    icon: Globe,
    color: '#10B981',
  },
];

export function OnboardingExtension() {
  const { completeOnboarding, setPage } = useNychIQStore();

  const handleComplete = () => {
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#141414]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FDBA2D] to-[#FDE68A] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="text-sm font-black tracking-[1.5px] uppercase">NY<span className="text-[#FDBA2D]">CHIQ</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= 2 ? 'bg-[#FDBA2D]' : 'bg-[#222]'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#444] font-mono">3 of 3</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(74,158,255,0.1)] border border-[rgba(74,158,255,0.2)] flex items-center justify-center mx-auto mb-6">
              <Download className="w-8 h-8 text-[#4A9EFF]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#E8E8E8] mb-2">
              Install NychIQ Extension
            </h2>
            <p className="text-sm text-[#666] max-w-sm mx-auto">
              Get instant insights on any YouTube page. It&apos;s optional but highly recommended.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.num}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] hover:border-[#2A2A2A] transition-colors"
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${step.color}15` }}
                    >
                      <StepIcon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                      style={{ backgroundColor: step.color }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#E8E8E8] mb-1">{step.title}</h3>
                    <p className="text-xs text-[#666] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bonus pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.15)]">
              <Coins className="w-4 h-4 text-[#FDBA2D]" />
              <span className="text-xs font-semibold text-[#FDBA2D]">+10 daily tokens with extension installed</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 max-w-xs mx-auto">
            <Button
              className="w-full bg-[#4A9EFF] text-white hover:bg-[#3A8AEF] h-11 font-semibold shadow-lg shadow-[rgba(74,158,255,0.15)]"
            >
              <Download className="w-4 h-4 mr-2" />
              Install Extension
            </Button>

            <Button
              className="w-full bg-[#FDBA2D] text-black hover:bg-[#D9A013] h-11 font-semibold shadow-lg shadow-[rgba(253,186,45,0.15)]"
              onClick={handleComplete}
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <button
              onClick={handleComplete}
              className="block text-xs text-[#444] hover:text-[#888] transition-colors mx-auto"
            >
              Skip extension, start using NychIQ →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
