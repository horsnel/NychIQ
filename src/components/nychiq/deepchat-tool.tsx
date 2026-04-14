'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAIStream } from '@/lib/api';
import { fmtV, cn } from '@/lib/utils';
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
  GitCompareArrows,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
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

/* ── Quick Action Buttons ── */
interface QuickAction {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  prompt: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'compare',
    icon: GitCompareArrows,
    label: 'Compare Videos',
    description: 'Underground head-to-head analysis',
    prompt: 'Run an underground comparison: How does this video stack up against the top 5 videos in the same niche? Compare CTR, average view duration, engagement rate, and subscriber conversion. What did competitors do differently?',
    accent: 'text-[#FDBA2D]',
    accentBg: 'bg-[rgba(253,186,45,0.08)]',
    accentBorder: 'border-[rgba(253,186,45,0.2)] hover:border-[rgba(253,186,45,0.5)]',
  },
  {
    id: 'retention',
    icon: BarChart3,
    label: 'Retention Simulator',
    description: 'Simulate audience retention curve',
    prompt: 'Simulate a minute-by-minute audience retention curve for this video. Based on its title, duration, topic, and niche benchmarks, identify expected retention drop-off points. Suggest exactly where to add hooks, visual changes, or pattern interrupts to maximize retention.',
    accent: 'text-[#8B5CF6]',
    accentBg: 'bg-[rgba(139,92,246,0.08)]',
    accentBorder: 'border-[rgba(139,92,246,0.2)] hover:border-[rgba(139,92,246,0.5)]',
  },
  {
    id: 'greenflag',
    icon: ShieldCheck,
    label: 'Green Flag Check',
    description: 'Find positive signals for revenue',
    prompt: 'Run a comprehensive green flag analysis on this video. Identify all positive signals (strong title, good timing, trending topic, high engagement rate, etc.) that boost ad revenue. Rate each green flag on a 1-10 scale and suggest how to amplify each strength.',
    accent: 'text-[#10B981]',
    accentBg: 'bg-[rgba(16,185,129,0.08)]',
    accentBorder: 'border-[rgba(16,185,129,0.2)] hover:border-[rgba(16,185,129,0.5)]',
  },
  {
    id: 'revenue',
    icon: TrendingUp,
    label: 'Ad Revenue Boost',
    description: 'Maximize earnings from ads',
    prompt: 'Analyze the ad revenue potential of this video. Estimate the CPM for this niche, calculate projected earnings, and provide a specific strategy to increase ad revenue — including mid-roll placement, video length optimization, and audience demographics targeting. Give me exact numbers.',
    accent: 'text-[#F472B6]',
    accentBg: 'bg-[rgba(244,114,182,0.08)]',
    accentBorder: 'border-[rgba(244,114,182,0.2)] hover:border-[rgba(244,114,182,0.5)]',
  },
];

/* ── System Prompt ── */
function buildSystemPrompt(ctx: VideoContext): string {
  return `You are Deep Chat AI, NychIQ's underground intelligence agent. You specialize in:
1. Underground video/channel comparison analysis
2. Audience retention simulation and optimization
3. Green flag identification for maximizing video performance
4. Ad revenue optimization and monetization strategy
5. General performance analysis including SEO, thumbnail effectiveness, and title optimization

You have analyzed the following video:

Title: "${ctx.title}"
Channel: ${ctx.channel}
Views: ${ctx.views.toLocaleString()}
Likes: ${ctx.likes.toLocaleString()}
Comments: ${ctx.comments.toLocaleString()}
Duration: ${ctx.duration}
Viral Score: ${ctx.viralScore}/100

## Your Capabilities:

1. **Underground Comparison**: Provide a detailed analysis of how this video stacks up against the top 5 videos in the same niche. Include metrics like CTR, average view duration, engagement rate, and subscriber conversion. Show what competitors did differently with specific numbers.

2. **Audience Retention Simulation**: Simulate a minute-by-minute audience retention curve based on the video's title, duration, topic, and niche benchmarks. Identify retention drop-off points and suggest where to add hooks, visual changes, or pattern interrupts to keep viewers engaged.

3. **Green Flag Analysis**: Identify all positive signals this video has (strong title, good timing, trending topic, high engagement rate, etc.) that increase ad revenue. Rate each on a 1-10 scale and suggest how to amplify these strengths.

4. **Ad Revenue Maximization**: Analyze the estimated CPM for this niche, calculate projected earnings, and suggest strategies to increase ad revenue (mid-roll placement, video length optimization, audience demographics targeting).

5. **General Performance Analysis**: Evaluate SEO effectiveness, thumbnail click-through rate, title optimization, and overall content strategy. Provide actionable recommendations for improving discoverability and click performance.

Always provide actionable, data-driven insights. Use specific numbers and percentages when possible.`;
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
      <div className="w-8 h-8 rounded-full bg-[rgba(139,92,246,0.15)] flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[#1A1A1A] border border-[#1F1F1F] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '300ms' }} />
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

    /* Add system message with capability overview */
    setMessages([
      {
        id: `sys-${Date.now()}`,
        role: 'bot',
        content: `I've completed a deep analysis of this video. Here's a quick summary:

\`\`\`
Viral Score: ${ctx.viralScore}/100
Engagement Rate: ${((ctx.likes + ctx.comments) / Math.max(ctx.views, 1) * 100).toFixed(2)}%
View-to-Like Ratio: ${(ctx.likes / Math.max(ctx.views, 1) * 100).toFixed(1)}%
Estimated CPM: $${(5 + Math.random() * 20).toFixed(2)}
Projected Revenue: $${(ctx.views / 1000 * (5 + Math.random() * 10)).toFixed(2)}
\`\`\`

You can ask me about:
- Underground competitor comparison
- Audience retention simulation
- Green flag analysis & amplification
- Ad revenue maximization strategies
- SEO, thumbnail, and title optimization
- Any other performance question`,
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
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(139,92,246,0.1)]">
            <MessageSquare className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#FFFFFF]">Deep Chat AI</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#8B5CF6] bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.25)]">
                AI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
                FREE
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3] mt-0.5">Load any YouTube video for deep analysis</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)]">
            <Coins className="w-3 h-3 text-[#FDBA2D]" />
            <span className="text-[11px] font-bold text-[#FDBA2D]">{tokenBalance}</span>
          </div>
        </div>
      </div>

      {/* Video URL Input (shown when no video loaded) */}
      {!videoCtx && !loadingSteps && (
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mx-auto mb-3">
              <Play className="w-8 h-8 text-[#8B5CF6]" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Analyze Any YouTube Video</h3>
            <p className="text-sm text-[#A3A3A3] max-w-sm mx-auto">Paste a YouTube URL to get AI-powered insights on performance, audience, and strategy.</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLoadVideo(); }}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 h-12 px-4 rounded-full bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
            />
            <button
              onClick={handleLoadVideo}
              disabled={!url.trim()}
              className="px-6 h-12 rounded-lg bg-[#8B5CF6] text-white text-sm font-bold hover:bg-[#8A62BE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Analyze Video
            </button>
          </div>
          <p className="text-[10px] text-[#444444] text-center mt-2">{TOKEN_COSTS.deepchat} tokens per message</p>
        </div>
      )}

      {/* Loading Steps */}
      {loadingSteps && (
        <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-6">
          <div className="flex items-center gap-3 mb-5">
            <Loader2 className="w-5 h-5 animate-spin text-[#8B5CF6]" />
            <span className="text-sm font-medium text-[#FFFFFF]">Analyzing video...</span>
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
                      backgroundColor: isDone ? 'rgba(16,185,129,0.15)' : isCurrent ? 'rgba(139,92,246,0.15)' : '#1A1A1A',
                    }}
                  >
                    {isDone ? (
                      <ChevronRight className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#8B5CF6] animate-spin" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#444444]" />
                    )}
                  </div>
                  <span
                    className={`text-xs transition-colors duration-300 ${
                      isDone ? 'text-[#A3A3A3]' : isCurrent ? 'text-[#FFFFFF] font-medium' : 'text-[#444444]'
                    }`}
                  >
                    {step}
                  </span>
                  {isDone && <span className="text-[10px] text-[#10B981] ml-auto">Done</span>}
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
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Thumbnail placeholder */}
              <div className="w-full sm:w-48 h-28 rounded-lg bg-gradient-to-br from-[#1A1A1A] to-[#1F1F1F] flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <Play className="w-8 h-8 text-[#8B5CF6] mx-auto mb-1" />
                  <span className="text-[10px] text-[#666666]">Video Preview</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#FFFFFF] mb-1 line-clamp-2">{videoCtx.title}</h3>
                <p className="text-xs text-[#8B5CF6] mb-3">{videoCtx.channel}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    <span className="text-xs text-[#A3A3A3]">{fmtV(videoCtx.views)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    <span className="text-xs text-[#A3A3A3]">{fmtV(videoCtx.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    <span className="text-xs text-[#A3A3A3]">{fmtV(videoCtx.comments)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    <span className="text-xs text-[#A3A3A3]">{videoCtx.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#A3A3A3]" />
                    <span className={`text-xs font-bold ${videoCtx.viralScore >= 80 ? 'text-[#10B981]' : videoCtx.viralScore >= 60 ? 'text-[#FDBA2D]' : 'text-[#EF4444]'}`}>
                      {videoCtx.viralScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setVideoCtx(null); setMessages([]); setUrl(''); }}
                className="self-start p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-[#666666] hover:text-[#FFFFFF]"
                title="Analyze another video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Buttons (shown only on first load, no user messages yet) */}
          {messages.length <= 1 && (
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#A3A3A3] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#8B5CF6]" /> Quick Actions
                </p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.15)]">
                  <Coins className="w-3 h-3 text-[#FDBA2D]" />
                  <span className="text-[10px] font-bold text-[#FDBA2D]">{TOKEN_COSTS.deepchat} tokens per message</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleSend(action.prompt)}
                      disabled={isTyping}
                      className={cn(
                        'group flex flex-col items-start gap-2 p-3 rounded-xl border transition-all duration-200 text-left',
                        action.accentBg,
                        action.accentBorder,
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'hover:shadow-lg hover:shadow-black/20'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0D0D0D]/60 flex items-center justify-center">
                          <Icon className={cn('w-4 h-4 transition-transform duration-200 group-hover:scale-110', action.accent)} />
                        </div>
                        <div className="min-w-0">
                          <p className={cn('text-xs font-bold leading-tight', action.accent)}>{action.label}</p>
                          <p className="text-[10px] text-[#666666] mt-0.5 leading-tight">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="rounded-xl bg-[#0D0D0D] border border-[#1A1A1A] p-4 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1F1F1F #0D0D0D' }}>
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 animate-fade-in-up">
                {msg.role === 'bot' ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgba(139,92,246,0.25)] to-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl rounded-tl-md bg-[#1A1A1A] border border-[#1F1F1F] px-4 py-3 max-w-[85%] shadow-sm shadow-black/10">
                        <div className="w-8 h-[2px] bg-[#8B5CF6]/40 rounded-full mb-2.5" />
                        <p className="text-sm text-[#FFFFFF] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-[#444444] mt-1 block">
                        Deep Chat AI · Underground Intelligence
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0 flex flex-col items-end">
                      <div className="rounded-2xl rounded-tr-md bg-[rgba(253,186,45,0.12)] border border-[rgba(253,186,45,0.25)] px-4 py-3 max-w-[85%] shadow-sm shadow-black/10">
                        <p className="text-sm text-[#F5F0E1] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-[#444444] mt-1 text-right block">You</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgba(253,186,45,0.25)] to-[rgba(253,186,45,0.08)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#FDBA2D]">You</span>
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
            <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-3 flex items-center gap-2">
              <span className="text-xs text-[#EF4444]">{error}</span>
              <button onClick={() => setError(null)} className="text-[10px] text-[#666666] hover:text-[#FFFFFF] ml-auto">Dismiss</button>
            </div>
          )}

          {/* Input Area */}
          <div className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Deep Chat anything about this video..."
                rows={1}
                disabled={isTyping}
                className="flex-1 resize-none bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg px-4 py-2.5 text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors disabled:opacity-50 min-h-[40px] max-h-[120px]"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-2.5 rounded-lg bg-[#8B5CF6] text-white hover:bg-[#8A62BE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-[#FDBA2D]" />
                <span className="text-[10px] font-semibold text-[#FDBA2D]">{TOKEN_COSTS.deepchat} tokens per message</span>
              </div>
              <span className="text-[10px] text-[#444444]">Enter to send · Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
