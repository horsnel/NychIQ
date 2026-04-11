'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  MessageSquare,
  ThumbsUp,
  Heart,
  Play,
  Zap,
  Link,
} from 'lucide-react';

interface MockComment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  timestamp: string;
  engagement: 'high' | 'medium' | 'low';
}

const MOCK_COMMENTS: MockComment[] = [
  {
    id: 1,
    author: '@creativeMind',
    avatar: 'CM',
    text: 'This technique completely changed how I approach thumbnails. The contrast tip at 3:24 was mind-blowing!',
    likes: 1247,
    timestamp: '2h ago',
    engagement: 'high',
  },
  {
    id: 2,
    author: '@techsavy99',
    avatar: 'TS',
    text: 'Can you make a follow-up video on how to apply this to gaming channels specifically? Would love to see that!',
    likes: 892,
    timestamp: '4h ago',
    engagement: 'high',
  },
  {
    id: 3,
    author: '@contentqueen',
    avatar: 'CQ',
    text: 'I tried this on my last 3 videos and CTR went up 40%. Absolutely worth every minute of setup.',
    likes: 534,
    timestamp: '6h ago',
    engagement: 'medium',
  },
];

function engagementColor(engagement: string) {
  if (engagement === 'high') return { color: '#4A9EFF', bg: 'rgba(74,158,255,0.1)', border: 'rgba(74,158,255,0.3)' };
  if (engagement === 'medium') return { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' };
  return { color: '#888888', bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.3)' };
}

export function EchoesTool() {
  const {} = useNychIQStore();
  const [url, setUrl] = useState('');

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header Card */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
              <MessageSquare className="w-5 h-5 text-[#4A9EFF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Echoes</h2>
              <p className="text-xs text-[#888888] mt-0.5">
                Comment-to-Clip Generator
              </p>
            </div>
          </div>

          <p className="text-sm text-[#888888] mb-4 leading-relaxed">
            Scan your most engaging comments and automatically turn them into viral clip ideas. Find the questions your audience is asking and answer them with content.
          </p>

          {/* URL Input */}
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your video URL to scan comments..."
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#4A9EFF]/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Comment Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-[#4A9EFF]" />
          <h3 className="text-sm font-semibold text-[#E8E8E8]">Top Comments</h3>
          <span className="text-[10px] text-[#555555] bg-[#1A1A1A] px-2 py-0.5 rounded-full">
            sorted by engagement
          </span>
        </div>

        {MOCK_COMMENTS.map((comment) => {
          const ec = engagementColor(comment.engagement);
          return (
            <div
              key={comment.id}
              className="rounded-lg bg-[#111111] border border-[#222222] p-4 hover:border-[#2A2A2A] transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#4A9EFF]">{comment.avatar}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#E8E8E8]">{comment.author}</span>
                    <span className="text-[10px] text-[#555555]">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-[#888888] leading-relaxed mb-3">
                    {comment.text}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: ec.color }}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {comment.likes.toLocaleString()}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          color: ec.color,
                          backgroundColor: ec.bg,
                          border: `1px solid ${ec.border}`,
                        }}
                      >
                        {comment.engagement} engagement
                      </span>
                    </div>

                    <button className="px-3 py-1.5 rounded-lg bg-[#4A9EFF]/10 border border-[#4A9EFF]/30 text-[#4A9EFF] text-xs font-medium hover:bg-[#4A9EFF]/20 transition-colors flex items-center gap-1.5">
                      <Play className="w-3 h-3" />
                      Generate Clip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-[#444444]">Cost: 0 tokens (free tool)</div>
    </div>
  );
}
