'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Sparkles,
  Play,
  Instagram,
  Monitor,
  Users,
  Search,
  Megaphone,
  CircleHelp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNychIQStore } from '@/lib/store';
import { XIcon } from '@/components/ui/x-icon';

/* ── 8 discovery options ── */
const DISCOVERY_OPTIONS = [
  { id: 'youtube', label: 'YouTube', icon: Play, color: '#EF4444' },
  { id: 'twitter', label: 'X (Twitter)', icon: XIcon, color: '#3B82F6' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#EF4444' },
  { id: 'tiktok', label: 'TikTok', icon: Monitor, color: '#10B981' },
  { id: 'friend', label: 'Friend', icon: Users, color: '#8B5CF6' },
  { id: 'google', label: 'Google', icon: Search, color: '#3B82F6' },
  { id: 'ads', label: 'Ads', icon: Megaphone, color: '#FDBA2D' },
  { id: 'other', label: 'Other', icon: CircleHelp, color: '#A3A3A3' },
];

export function OnboardingQuestions() {
  const { logout, setPage } = useNychIQStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setPage('ob-audit');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#141414]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[3px] bg-[#FDBA2D] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M10 6L18 12L10 18V6Z" fill="white"/>
              <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-black tracking-[1.5px] uppercase">NY<span className="text-[#FDBA2D]">CHIQ</span></span>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === 0 ? 'bg-[#FDBA2D]' : 'bg-[#222]'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#444] font-mono">1 of 3</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-3">
              How did you hear about us?
            </h2>
            <p className="text-sm text-[#666] max-w-sm mx-auto">
              This helps us personalize your experience and improve our platform.
            </p>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DISCOVERY_OPTIONS.map((opt) => {
              const isSelected = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                    isSelected
                      ? 'bg-[rgba(253,186,45,0.08)] border-[#FDBA2D] shadow-lg shadow-[rgba(253,186,45,0.08)]'
                      : 'bg-[#0D0D0D] border-[#1E1E1E] hover:border-[#333] hover:bg-[#141414]'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isSelected ? 'scale-110' : 'group-hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${opt.color}20` : `${opt.color}10`,
                      border: isSelected ? `1px solid ${opt.color}40` : '1px solid transparent',
                    }}
                  >
                    <opt.icon
                      className="w-5 h-5 transition-colors"
                      style={{ color: isSelected ? opt.color : '#666' }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      isSelected ? 'text-[#FDBA2D]' : 'text-[#888] group-hover:text-[#FFFFFF]'
                    }`}
                  >
                    {opt.label}
                  </span>
                  {/* Check indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#FDBA2D] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              className="w-full max-w-xs bg-[#FDBA2D] text-black hover:bg-[#C69320] font-semibold h-11 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[rgba(253,186,45,0.15)]"
              onClick={handleContinue}
              disabled={!selected}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              onClick={() => logout()}
              className="text-xs text-[#444] hover:text-[#888] transition-colors"
            >
              ← Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
