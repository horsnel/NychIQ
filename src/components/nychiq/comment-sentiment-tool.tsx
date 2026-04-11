'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  Search,
  Tag,
  BarChart3,
  Loader2,
  User,
} from 'lucide-react';

interface CommentData {
  id: string;
  author: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  likes: number;
}

interface ThemeDetection {
  theme: string;
  mentions: number;
  sentiment: string;
}

const MOCK_COMMENTS: CommentData[] = [
  { id: '1', author: 'TechFan2025', text: 'This is absolutely incredible content! Best explanation I have seen.', sentiment: 'positive', likes: 142 },
  { id: '2', author: 'SarahCodes', text: 'Could you make a follow-up on the API integration part?', sentiment: 'neutral', likes: 38 },
  { id: '3', author: 'DevReview', text: 'The audio quality was terrible, could barely hear anything.', sentiment: 'negative', likes: 12 },
  { id: '4', author: 'CodeNewbie', text: 'Thank you so much! This helped me land my first job!', sentiment: 'positive', likes: 89 },
  { id: '5', author: 'CriticalEye', text: 'Not really anything new here. Same info as every other tutorial.', sentiment: 'negative', likes: 5 },
  { id: '6', author: 'ReactDev', text: 'Solid tutorial, well-structured and easy to follow.', sentiment: 'positive', likes: 67 },
  { id: '7', author: 'DesignPro', text: 'What editor theme are you using? It looks great on screen.', sentiment: 'neutral', likes: 23 },
  { id: '8', author: 'FullStackMike', text: 'Best channel for developers, period.', sentiment: 'positive', likes: 201 },
];

const MOCK_THEMES: ThemeDetection[] = [
  { theme: 'Tutorial Quality', mentions: 34, sentiment: 'Mostly Positive' },
  { theme: 'Audio/Video Quality', mentions: 12, sentiment: 'Mixed' },
  { theme: 'Request for More Content', mentions: 28, sentiment: 'Positive' },
  { theme: 'Beginner Friendliness', mentions: 19, sentiment: 'Positive' },
];

const SENTIMENT_DATA = { positive: 58, negative: 12, neutral: 30 };

const SENTIMENT_STYLE = {
  positive: { color: '#00C48C', bg: 'rgba(0,196,140,0.1)', icon: Smile },
  negative: { color: '#E05252', bg: 'rgba(224,82,82,0.1)', icon: Frown },
  neutral: { color: '#4A9EFF', bg: 'rgba(74,158,255,0.1)', icon: Meh },
};

export function CommentSentimentTool() {
  const [videoUrl, setVideoUrl] = useState('');
  const [comments, setComments] = useState<CommentData[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = () => {
    if (!videoUrl.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setComments(MOCK_COMMENTS);
      setAnalyzed(true);
      setAnalyzing(false);
    }, 1500);
  };

  const sentimentIcon = (s: string) => {
    const cfg = SENTIMENT_STYLE[s as keyof typeof SENTIMENT_STYLE];
    const Icon = cfg.icon;
    return <Icon className="w-4 h-4" style={{ color: cfg.color }} />;
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
            <MessageSquare className="w-5 h-5 text-[#4A9EFF]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Comment Sentiment</h2>
            <p className="text-xs text-[#888888] mt-0.5">Analyze audience sentiment and detect recurring themes in comments.</p>
          </div>
        </div>

        {/* Video Input */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <Search className="w-4 h-4 text-[#666]" />
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Paste a YouTube video URL..."
              className="flex-1 bg-transparent text-sm text-[#E8E8E8] placeholder:text-[#555] outline-none"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !videoUrl.trim()}
            className="px-4 h-11 rounded-lg bg-[#4A9EFF] text-white text-sm font-bold hover:bg-[#3A8EEF] transition-colors disabled:opacity-50 shrink-0"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            Analyze
          </button>
        </div>
      </div>

      {analyzed && !analyzing && (
        <>
          {/* Sentiment Bar */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Sentiment Overview</h4>
            <div className="flex h-3 rounded-full overflow-hidden mb-3">
              <div className="bg-[#00C48C]" style={{ width: `${SENTIMENT_DATA.positive}%` }} />
              <div className="bg-[#4A9EFF]" style={{ width: `${SENTIMENT_DATA.neutral}%` }} />
              <div className="bg-[#E05252]" style={{ width: `${SENTIMENT_DATA.negative}%` }} />
            </div>
            <div className="flex items-center gap-4">
              {Object.entries(SENTIMENT_DATA).map(([key, val]) => {
                const cfg = SENTIMENT_STYLE[key as keyof typeof SENTIMENT_STYLE];
                const Icon = cfg.icon;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    <span className="text-xs capitalize" style={{ color: cfg.color }}>{key}</span>
                    <span className="text-xs font-bold text-[#E8E8E8]">{val}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment List */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
              <ThumbsUp className="w-3.5 h-3.5 text-[#00C48C]" />
              Comment Breakdown ({comments.length})
            </h4>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="w-3.5 h-3.5 text-[#666]" />
                    <span className="text-xs font-medium text-[#E8E8E8]">{c.author}</span>
                    <span className="ml-auto text-[10px] flex items-center gap-1 text-[#666]"><ThumbsUp className="w-3 h-3" />{c.likes}</span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded capitalize"
                      style={{ backgroundColor: SENTIMENT_STYLE[c.sentiment].bg, color: SENTIMENT_STYLE[c.sentiment].color }}
                    >
                      {c.sentiment}
                    </span>
                  </div>
                  <p className="text-xs text-[#AAAAAA] leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Themes Detected */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#9B72CF]" />
              Themes Detected
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOCK_THEMES.map((t, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#E8E8E8]">{t.theme}</p>
                    <span className="text-[10px] font-bold text-[#9B72CF]">{t.mentions} mentions</span>
                  </div>
                  <p className="text-[10px] text-[#888] mt-1">Sentiment: {t.sentiment}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!analyzed && !analyzing && (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg bg-[#111111] border border-[#222222]">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(74,158,255,0.1)] border border-[rgba(74,158,255,0.2)] flex items-center justify-center mb-3">
            <MessageSquare className="w-7 h-7 text-[#4A9EFF]" />
          </div>
          <h3 className="text-sm font-semibold text-[#E8E8E8] mb-1">Analyze Comment Sentiment</h3>
          <p className="text-xs text-[#666] max-w-xs text-center">Paste a YouTube video URL to analyze audience sentiment and discover themes.</p>
        </div>
      )}
    </div>
  );
}
