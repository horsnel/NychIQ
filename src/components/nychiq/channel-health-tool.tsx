'use client';

import React from 'react';
import { Heart, Activity, Upload, Target, Clock, TrendingUp } from 'lucide-react';

const OVERALL_SCORE = 74;

const SUB_SCORES = [
  { label: 'Engagement Rate', score: 82, tip: 'Your likes + comments are well above average. Keep encouraging interaction with CTAs.' },
  { label: 'Upload Consistency', score: 68, tip: 'You missed 2 uploads last month. Try batching content to maintain your weekly schedule.' },
  { label: 'Click-Through Rate', score: 71, tip: 'Good CTR but thumbnails could improve. Test more contrasting colors and larger text.' },
  { label: 'Audience Retention', score: 65, tip: 'Average viewer drops off at 2:30. Try front-loading your main value and hooks.' },
  { label: 'Growth Velocity', score: 84, tip: 'Excellent growth! Your subscriber rate is in the top 15% for your niche.' },
];

function getColor(score: number) {
  if (score >= 70) return { color: '#00C48C', bg: 'rgba(0,196,140,0.1)', border: 'rgba(0,196,140,0.3)' };
  if (score >= 40) return { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' };
  return { color: '#E05252', bg: 'rgba(224,82,82,0.1)', border: 'rgba(224,82,82,0.3)' };
}

export function ChannelHealthTool() {
  const overallColor = getColor(OVERALL_SCORE);
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (OVERALL_SCORE / 100) * circumference;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)]">
            <Heart className="w-5 h-5 text-[#00C48C]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Channel Health Score</h2>
            <p className="text-xs text-[#888888] mt-0.5">Overall score based on engagement, consistency, CTR, retention & growth.</p>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-6 sm:p-8 flex flex-col items-center">
        <div className="relative mb-4" style={{ width: 180, height: 180 }}>
          <svg className="-rotate-90" width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="80" fill="none" stroke="#1A1A1A" strokeWidth="8" />
            <circle cx="90" cy="90" r="80" fill="none" stroke={overallColor.color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ filter: `drop-shadow(0 0 10px ${overallColor.color}40)`, transition: 'stroke-dashoffset 1s ease-out' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: overallColor.color }}>{OVERALL_SCORE}</span>
            <span className="text-[10px] text-[#666] mt-1">out of 100</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00C48C]" />
          <span className="text-sm font-semibold text-[#00C48C]">Good — Top 25% in your niche</span>
        </div>
      </div>

      {/* Sub-Scores */}
      <div className="space-y-3">
        {SUB_SCORES.map((item) => {
          const c = getColor(item.score);
          return (
            <div key={item.label} className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#333] transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-semibold text-[#E8E8E8]">{item.label}</span>
                </div>
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
                  {item.score}/100
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0D0D0D] overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.score}%`, backgroundColor: c.color }} />
              </div>
              <p className="text-[11px] text-[#888888] leading-relaxed">{item.tip}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
