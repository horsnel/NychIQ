'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAIStream } from '@/lib/api';
import { fmtV } from '@/lib/utils';
import {
  MessageSquare,
  Play,
  Send,
  Loader2,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Zap,
  Sparkles,
  Coins,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

/* ── Types ── */
interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

interface VideoContext {
  title: string;
  channel: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  viralScore: number;
}

/* ── Loading Steps ── */
const LOADING_STEPS = [
  'Fetching video stats...',
  'Analyzing comments...',
  'Channel baseline extraction...',
  'AI enrichment processing...',
  'Building full context...',
];

/* ── Suggestion Chips ── */
const SUGGESTIONS = [
  'Why is this underperforming?',
  'Rewrite the title for more CTR',
  'How does this compare to channel average?',
  "What's the audience sentiment?",
  'Suggest 3 improvements',
  'Analyze the thumbnail strategy',
];

/* ── System Prompt ── */
function buildSystemPrompt(ctx: VideoContext): string {
  return `You are Deep Chat AI, a YouTube analytics expert assistant. You have analyzed the following video:

Title: "${ctx.title}"
Channel: ${ctx.channel}
Views: ${ctx.views.toLocaleString()}
Likes: ${ctx.likes.toLocaleString()}
Comments: ${ctx.comments.toLocaleString()}
Duration: ${ctx.duration}
Viral Score: ${ctx.viralScore}/100

Answer the user's questions about this video's performance, audience, strategy, thumbnails, SEO, engagement, and growth opportunities. Be specific, data-driven, and actionable. Keep responses concise but thorough. Use bullet points when listing recommendations.`;
}

/* ── Mock video data generator ── */
function generateMockVideo(url: string): VideoContext {
  const titles = [
    'The Ultimate Guide to YouTube Growth in 2025',
    'How I Got 1M Subscribers in 6 Months',
    'YouTube Algorithm Secrets Nobody Talks About',
    '10 Growth Hacks That Actually Work',
  ];
  const channels = ['TechCreator Pro', 'GrowthHub', 'Viral Academy', 'The Algorithm Guy'];
  const idx = Math.abs(url.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % titles.length;

  return {
    title: titles[idx],
    channel: channels[idx],
    views: Math.floor(Math.random() * 2000000) + 50000,
    likes: Math.floor(Math.random() * 100000) + 5000,
    comments: Math.floor(Math.random() * 10000) + 500,
    duration: `${Math.floor(Math.random() * 15) + 5}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    viralScore: Math.floor(Math.random() * 50) + 50,
  };
}

/* ── Typing Indicator ── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <div className="w-8 h-8 rounded-full bg-[rgba(155,114,207,0.15)] flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-[#9B72CF]" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[#1A1A1A] border border-[#222222] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#9B72CF] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#9B72CF] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#9B72CF] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function DeepChatTool() {
  const { spendTokens, tokenBalance, setUpgradeModalOpen } = useNychIQStore();

  /* State */
  const [url, setUrl] = useState('');
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [videoCtx, setVideoCtx] = useState<VideoContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Auto-resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  /* Load video: step-by-step loading animation */
  const handleLoadVideo = useCallback(async () => {
    if (!url.trim()) return;
    setLoadingSteps(true);
    setCurrentStep(0);
    setVideoCtx(null);
    setMessages([]);
    setError(null);

    /* Animate through steps */
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
    }

    const ctx = generateMockVideo(url);
    setVideoCtx(ctx);
    setLoadingSteps(false);

    /* Add system message */
    setMessages([
      {
        id: `sys-${Date.now()}`,
        role: 'bot',
        content: "I've analyzed this video. Ask me anything about its performance, audience, or strategy.",
        timestamp: Date.now(),
      },
    ]);
  }, [url]);

  /* Send message with streaming */
  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text || input).trim();
      if (!messageText || isTyping || !videoCtx) return;

      /* Spend tokens */
      const ok = spendTokens('deepchat');
      if (!ok) return;

      /* Add user message */
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      setError(null);

      /* Build messages array for API */
      const systemPrompt = buildSystemPrompt(videoCtx);
      const chatHistory = [
        { role: 'system', content: systemPrompt },
        ...messages
          .filter((m) => m.id !== messages[0]?.id || m.role === 'user')
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: messageText },
      ];

      const botMsgId = `bot-${Date.now()}`;

      await askAIStream(
        chatHistory,
        (token, fullText) => {
          /* Streaming token */
          setMessages((prev) => {
            const existing = prev.find((m) => m.id === botMsgId);
            if (existing) {
              return prev.map((m) => (m.id === botMsgId ? { ...m, content: fullText } : m));
            }
            return [
              ...prev,
              { id: botMsgId, role: 'bot' as const, content: fullText, timestamp: Date.now() },
            ];
          });
        },
        () => {
          setIsTyping(false);
        },
        (err) => {
          setIsTyping(false);
          setError(err.message || 'Failed to get response. Please try again.');
        }
      );
    },
    [input, isTyping, videoCtx, messages, spendTokens]
  );

  /* Handle textarea Enter key */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
            <MessageSquare className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#E8E8E8]">Deep Chat AI</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#9B72CF] bg-[rgba(155,114,207,0.15)] border border-[rgba(155,114,207,0.25)]">
                AI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#00C48C] bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)]">
                FREE
              </span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">Load any YouTube video for deep analysis</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)]">
            <Coins className="w-3 h-3 text-[#F5A623]" />
            <span className="text-[11px] font-bold text-[#F5A623]">{tokenBalance}</span>
          </div>
        </div>
      </div>

      {/* Video URL Input (shown when no video loaded) */}
      {!videoCtx && !loadingSteps && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-5">
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)] flex items-center justify-center mx-auto mb-3">
              <Play className="w-8 h-8 text-[#9B72CF]" />
            </div>
            <h3 className="text-base font-semibold text-[#E8E8E8] mb-1">Analyze Any YouTube Video</h3>
            <p className="text-sm text-[#888888] max-w-sm mx-auto">Paste a YouTube URL to get AI-powered insights on performance, audience, and strategy.</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLoadVideo(); }}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 h-12 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors"
            />
            <button
              onClick={handleLoadVideo}
              disabled={!url.trim()}
              className="px-6 h-12 rounded-lg bg-[#9B72CF] text-white text-sm font-bold hover:bg-[#8A62BE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Analyze Video
            </button>
          </div>
          <p className="text-[10px] text-[#444444] text-center mt-2">{TOKEN_COSTS.deepchat} tokens per message</p>
        </div>
      )}

      {/* Loading Steps */}
      {loadingSteps && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-6">
          <div className="flex items-center gap-3 mb-5">
            <Loader2 className="w-5 h-5 animate-spin text-[#9B72CF]" />
            <span className="text-sm font-medium text-[#E8E8E8]">Analyzing video...</span>
          </div>
          <div className="space-y-3">
            {LOADING_STEPS.map((step, i) => {
              const isDone = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300"
                    style={{
                      backgroundColor: isDone ? 'rgba(0,196,140,0.15)' : isCurrent ? 'rgba(155,114,207,0.15)' : '#1A1A1A',
                    }}
                  >
                    {isDone ? (
                      <ChevronRight className="w-3.5 h-3.5 text-[#00C48C]" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#9B72CF] animate-spin" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#444444]" />
                    )}
                  </div>
                  <span
                    className={`text-xs transition-colors duration-300 ${
                      isDone ? 'text-[#888888]' : isCurrent ? 'text-[#E8E8E8] font-medium' : 'text-[#444444]'
                    }`}
                  >
                    {step}
                  </span>
                  {isDone && <span className="text-[10px] text-[#00C48C] ml-auto">Done</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Context Card + Chat Area */}
      {videoCtx && !loadingSteps && (
        <div className="space-y-4">
          {/* Video Context Card */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Thumbnail placeholder */}
              <div className="w-full sm:w-48 h-28 rounded-lg bg-gradient-to-br from-[#1A1A1A] to-[#222222] flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <Play className="w-8 h-8 text-[#9B72CF] mx-auto mb-1" />
                  <span className="text-[10px] text-[#666666]">Video Preview</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#E8E8E8] mb-1 line-clamp-2">{videoCtx.title}</h3>
                <p className="text-xs text-[#9B72CF] mb-3">{videoCtx.channel}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#888888]" />
                    <span className="text-xs text-[#888888]">{fmtV(videoCtx.views)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#888888]" />
                    <span className="text-xs text-[#888888]">{fmtV(videoCtx.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#888888]" />
                    <span className="text-xs text-[#888888]">{fmtV(videoCtx.comments)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#888888]" />
                    <span className="text-xs text-[#888888]">{videoCtx.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#888888]" />
                    <span className={`text-xs font-bold ${videoCtx.viralScore >= 80 ? 'text-[#00C48C]' : videoCtx.viralScore >= 60 ? 'text-[#F5A623]' : 'text-[#E05252]'}`}>
                      {videoCtx.viralScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setVideoCtx(null); setMessages([]); setUrl(''); }}
                className="self-start p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-[#666666] hover:text-[#E8E8E8]"
                title="Analyze another video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggestion Chips (shown only on first load, no user messages yet) */}
          {messages.length <= 1 && (
            <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
              <p className="text-xs text-[#666666] mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="px-3 py-1.5 rounded-full text-xs text-[#E8E8E8] bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#9B72CF]/50 hover:text-[#9B72CF] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] p-4 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#222222 #0A0A0A' }}>
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 animate-fade-in-up">
                {msg.role === 'bot' ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-[rgba(155,114,207,0.15)] flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-[#9B72CF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl rounded-tl-sm bg-[#1A1A1A] border border-[#222222] px-4 py-3 max-w-[85%]">
                        <p className="text-sm text-[#E8E8E8] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-[#444444] mt-1 block">
                        Deep Chat AI
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0 flex flex-col items-end">
                      <div className="rounded-2xl rounded-tr-sm bg-[rgba(245,166,35,0.15)] border border-[rgba(245,166,35,0.2)] px-4 py-3 max-w-[85%]">
                        <p className="text-sm text-[#E8E8E8] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[rgba(245,166,35,0.15)] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#F5A623]">You</span>
                    </div>
                  </>
                )}
              </div>
            ))}

            {isTyping && <TypingIndicator />}

            <div ref={chatEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-[#111111] border border-[#E05252]/30 p-3 flex items-center gap-2">
              <span className="text-xs text-[#E05252]">{error}</span>
              <button onClick={() => setError(null)} className="text-[10px] text-[#666666] hover:text-[#E8E8E8] ml-auto">Dismiss</button>
            </div>
          )}

          {/* Input Area */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this video..."
                rows={1}
                disabled={isTyping}
                className="flex-1 resize-none bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg px-4 py-2.5 text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#9B72CF]/50 transition-colors disabled:opacity-50 min-h-[40px] max-h-[120px]"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-2.5 rounded-lg bg-[#9B72CF] text-white hover:bg-[#8A62BE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-[#444444]">{TOKEN_COSTS.deepchat} tokens per message</span>
              <span className="text-[10px] text-[#444444]">Press Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
