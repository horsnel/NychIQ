'use client';

import React from 'react';
import { Share2, TrendingUp, ArrowRight, Users, Eye } from 'lucide-react';

const SHORTS_DATA = [
  { platform: 'YouTube Shorts', published: 89, totalViews: '3.1M', converted: 12400, rate: '0.4%', trend: '+12%', best: '5 Tips in 30s' },
  { platform: 'TikTok', published: 320, totalViews: '1.8M', converted: 8200, rate: '0.46%', trend: '+8%', best: 'AI Tool Demo' },
  { platform: 'Instagram Reels', published: 210, totalViews: '920K', converted: 3400, rate: '0.37%', trend: '+15%', best: 'Quick Tutorial' },
];

const TOP_CONVERTING = [
  { title: '5 AI Tools You Need Now', platform: 'YouTube Shorts', views: '420K', conversions: 1800, rate: '0.43%' },
  { title: 'This Changed My Workflow', platform: 'TikTok', views: '380K', conversions: 2100, rate: '0.55%' },
  { title: '60-Second Code Review', platform: 'Instagram Reels', views: '290K', conversions: 980, rate: '0.34%' },
  { title: 'Setup Tour 2025', platform: 'YouTube Shorts', views: '520K', conversions: 2400, rate: '0.46%' },
  { title: 'Quick Productivity Hack', platform: 'TikTok', views: '310K', conversions: 1650, rate: '0.53%' },
];

export function CrossPlatformTrackerTool() {
  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
            <Share2 className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Cross-Platform Growth Tracker</h2>
            <p className="text-xs text-[#888888] mt-0.5">See how well your Shorts/TikToks convert to long-form subscribers.</p>
          </div>
        </div>
      </div>

      {/* Platform Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SHORTS_DATA.map((p) => (
          <div key={p.platform} className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#333] transition-all">
            <h4 className="text-sm font-bold text-[#E8E8E8] mb-3">{p.platform}</h4>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-xs text-[#888888]">Published</span><span className="text-xs font-bold text-[#E8E8E8]">{p.published}</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#888888]">Total Views</span><span className="text-xs font-bold text-[#4A9EFF]">{p.totalViews}</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#888888]">Conversions</span><span className="text-xs font-bold text-[#00C48C]">{p.converted.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-xs text-[#888888]">Conversion Rate</span><span className="text-xs font-bold text-[#F5A623]">{p.rate}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
              <span className="text-[10px] text-[#888888]">Trend</span>
              <span className="text-[10px] font-bold text-[#00C48C]">{p.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Converting Content */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#9B72CF]" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Top Converting Content</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left px-4 py-3 text-[#888888] font-semibold">Title</th>
                <th className="text-left px-3 py-3 text-[#888888] font-semibold">Platform</th>
                <th className="text-right px-3 py-3 text-[#888888] font-semibold">Views</th>
                <th className="text-right px-3 py-3 text-[#888888] font-semibold">Conversions</th>
                <th className="text-right px-4 py-3 text-[#888888] font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {TOP_CONVERTING.map((item, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]/50 hover:bg-[#0D0D0D]/50 transition-colors">
                  <td className="px-4 py-3 text-[#E8E8E8] font-medium max-w-[200px] truncate">{item.title}</td>
                  <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-[#1A1A1A] text-[#888888]">{item.platform}</span></td>
                  <td className="text-right px-3 py-3 text-[#E8E8E8] font-bold">{item.views}</td>
                  <td className="text-right px-3 py-3 text-[#00C48C] font-bold">{item.conversions.toLocaleString()}</td>
                  <td className="text-right px-4 py-3 text-[#F5A623] font-bold">{item.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#E8E8E8] mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00C48C]" /> Conversion Optimization Tips
        </h3>
        <div className="space-y-3">
          {[
            'Add a verbal CTA in the last 3 seconds of every Short mentioning your long-form content.',
            'Use pinned comments with direct links to your most relevant full-length videos.',
            'Cross-post your best performing TikToks to YouTube Shorts with optimized titles.',
            'Create "Part 2" content on long-form that directly references your viral Shorts.',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
              <span className="text-xs font-bold text-[#9B72CF] shrink-0">#{i + 1}</span>
              <p className="text-xs text-[#888888] leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
