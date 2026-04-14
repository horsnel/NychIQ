'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNychIQStore } from '@/lib/store';
import { askAI, askAIStream } from '@/lib/api';
import { cn, copyToClipboard } from '@/lib/utils';
import { Send, Bot, User, Sparkles, ChevronLeft, ChevronRight, Copy, Check, X, Loader2 } from 'lucide-react';

/* ── Types ── */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChannelConfig {
  channelUrl: string;
  channelName: string;
  niche: string;
  subNiche: string;
  brandVoice: string;
  tone: string;
  audience: string;
  language: string;
  goals: string[];
  customInstructions: string;
  contentTypes: string[];
  competitors: string[];
  keywords: string[];
}

/* ── Constants ── */
const STORAGE_KEY = 'nychiq_channel_assistant_config';

const SUGGESTED_PROMPTS = [
  'What\'s my best posting schedule?',
  'Analyze my latest video performance',
  'Give me 5 video ideas for next week',
  'How can I improve my thumbnails?',
  'Review my channel SEO',
  'Compare me with my competitors',
];

/* ── Helpers ── */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadChannelConfig(): ChannelConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.channelName) return null;
    return parsed as ChannelConfig;
  } catch {
    return null;
  }
}

function buildSystemPrompt(config: ChannelConfig): string {
  return `You are NychIQ's Channel Personal Assistant. You have deep knowledge about the user's YouTube channel.

Channel Name: ${config.channelName}
Niche: ${config.niche}${config.subNiche ? ' → ' + config.subNiche : ''}
Brand Voice: ${config.brandVoice}
Tone: ${config.tone}
Target Audience: ${config.audience}
Content Types: ${config.contentTypes.join(', ')}
Goals: ${config.goals.join(', ')}
Keywords: ${config.keywords.join(', ')}
Competitors: ${config.competitors.join(', ')}
Custom Instructions: ${config.customInstructions}

Provide actionable, data-driven YouTube growth advice. Be specific, concise, and helpful. Use formatting (bullet points, numbered lists) when appropriate.`;
}

/* ── Typing Indicator ── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 animate-fade-in-up">
      <div className="w-7 h-7 rounded-full bg-[rgba(246,168,40,0.12)] flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-[#F6A828]" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#F6A828] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#F6A828] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#F6A828] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/* ── No Config State ── */
function NoConfigState({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4">
      <div className="w-20 h-20 rounded-2xl bg-[rgba(246,168,40,0.08)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-6">
        <Bot className="w-10 h-10 text-[#F6A828]" />
      </div>
      <h2 className="text-lg font-bold text-[#FFFFFF] mb-2">Channel Assistant Not Configured</h2>
      <p className="text-sm text-[#a0a0a0] max-w-md text-center mb-6 leading-relaxed">
        Before chatting with your Channel Personal Assistant, you need to configure your channel details.
        This helps the AI understand your brand, audience, and goals.
      </p>
      <button
        onClick={onConfigure}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F6A828] text-[#0a0a0a] font-bold text-sm hover:bg-[#FFB340] transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Configure Channel Assistant
      </button>
    </div>
  );
}

/* ── Context Sidebar Content ── */
function ContextSidebarContent({ config, onConfigure, onClose }: { config: ChannelConfig; onConfigure: () => void; onClose: () => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.03)]">
        <h3 className="text-sm font-bold text-[#FFFFFF]">Channel Context</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.03)] transition-colors lg:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#0f0f0f #0f0f0f' }}>
        {/* Channel name */}
        <div>
          <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Channel</p>
          <p className="text-sm font-bold text-[#FFFFFF]">{config.channelName}</p>
          {config.niche && (
            <p className="text-xs text-[#a0a0a0] mt-0.5">
              {config.niche}{config.subNiche ? ` → ${config.subNiche}` : ''}
            </p>
          )}
        </div>

        {/* Content Types */}
        {config.contentTypes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Content Types</p>
            <div className="flex flex-wrap gap-1.5">
              {config.contentTypes.map((ct) => (
                <span
                  key={ct}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[rgba(246,168,40,0.08)] border border-[rgba(255,255,255,0.03)] text-[11px] font-medium text-[#F6A828]"
                >
                  {ct}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {config.goals.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Goals</p>
            <ul className="space-y-1">
              {config.goals.map((goal) => (
                <li key={goal} className="flex items-start gap-2 text-xs text-[#a0a0a0]">
                  <span className="w-1 h-1 rounded-full bg-[#F6A828] mt-1.5 shrink-0" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Audience */}
        {config.audience && (
          <div>
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Target Audience</p>
            <p className="text-xs text-[#a0a0a0] leading-relaxed">{config.audience}</p>
          </div>
        )}

        {/* Brand Voice & Tone */}
        {(config.brandVoice || config.tone) && (
          <div>
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Voice & Tone</p>
            <div className="space-y-1">
              {config.brandVoice && (
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-[#666666] shrink-0 w-12 pt-px">Voice:</span>
                  <span className="text-xs text-[#a0a0a0]">{config.brandVoice}</span>
                </div>
              )}
              {config.tone && (
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-[#666666] shrink-0 w-12 pt-px">Tone:</span>
                  <span className="text-xs text-[#a0a0a0] capitalize">{config.tone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Keywords */}
        {config.keywords.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {config.keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.03)] text-[11px] text-[#a0a0a0]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Competitors */}
        {config.competitors.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Competitors</p>
            <div className="flex flex-wrap gap-1.5">
              {config.competitors.map((comp) => (
                <span
                  key={comp}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a0a0a] border border-[rgba(255,255,255,0.03)] text-[11px] text-[#a0a0a0]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#888888]" />
                  {comp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Custom Instructions */}
        {config.customInstructions && (
          <div>
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1.5">Custom Instructions</p>
            <p className="text-xs text-[#a0a0a0] leading-relaxed">{config.customInstructions}</p>
          </div>
        )}
      </div>

      {/* Configure button */}
      <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.03)]">
        <button
          onClick={onConfigure}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(246,168,40,0.08)] border border-[rgba(255,255,255,0.03)] text-xs font-bold text-[#F6A828] hover:bg-[rgba(246,168,40,0.15)] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Edit Configuration
        </button>
      </div>
    </div>
  );
}

/* ── Message Bubble ── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await copyToClipboard(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex items-start gap-2.5 animate-fade-in-up', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
        isUser
          ? 'bg-[rgba(246,168,40,0.15)]'
          : 'bg-[rgba(246,168,40,0.08)]'
      )}>
        {isUser ? (
          <User className="w-3.5 h-3.5 text-[#F6A828]" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-[#F6A828]" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn(
        'group relative max-w-[70%] px-4 py-3',
        isUser
          ? 'bg-[#0f0f0f] rounded-2xl rounded-tr-sm border border-[rgba(255,255,255,0.03)]'
          : 'bg-[#0f0f0f] rounded-2xl rounded-tl-sm border border-[rgba(255,255,255,0.03)]'
      )}>
        {/* Content — render markdown-like formatting */}
        <div className="text-sm text-[#FFFFFF] leading-relaxed whitespace-pre-wrap break-words channel-pa-content">
          {message.content.split(/(\*\*[^*]+\*\*|#{1,3}\s.+|```[\s\S]*?```|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/gm).map((segment, i) => {
            if (segment.startsWith('**') && segment.endsWith('**')) {
              return <strong key={i} className="font-bold text-[#FFFFFF]">{segment.slice(2, -2)}</strong>;
            }
            if (segment.startsWith('```') && segment.endsWith('```')) {
              return (
                <pre key={i} className="mt-1.5 mb-1.5 p-2.5 rounded-lg bg-[#0a0a0a] border border-[rgba(255,255,255,0.03)] text-xs text-[#a0a0a0] overflow-x-auto font-mono">
                  {segment.slice(3, -3).replace(/^\n/, '')}
                </pre>
              );
            }
            if (segment.startsWith('*') && segment.endsWith('*')) {
              return <em key={i} className="text-[#a0a0a0]">{segment.slice(1, -1)}</em>;
            }
            return segment;
          })}
        </div>

        {/* Copy button (AI messages only) */}
        {!isUser && message.content.length > 0 && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] text-[#a0a0a0] hover:text-[#FFFFFF] shadow-sm"
          >
            {copied ? <Check className="w-3 h-3 text-[#888888]" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function ChannelPATool() {
  const { setActiveTool } = useNychIQStore();

  /* State */
  const [channelConfig, setChannelConfig] = useState<ChannelConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Load channel config on mount */
  useEffect(() => {
    const config = loadChannelConfig();
    setChannelConfig(config);
    setMounted(true);
  }, []);

  /* Auto-scroll to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  /* Close context sidebar on resize to mobile */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && contextOpen) {
        // Keep open on mobile (overlay mode)
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [contextOpen]);

  /* System prompt from channel config */
  const systemPrompt = useMemo(() => {
    if (!channelConfig) return '';
    return buildSystemPrompt(channelConfig);
  }, [channelConfig]);

  /* Send message */
  const handleSend = async (text?: string) => {
    const messageText = (text || inputValue).trim();
    if (!messageText || isStreaming || !channelConfig) return;

    /* Add user message */
    const userMsg: ChatMessage = {
      id: `user-${uid()}`,
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);

    /* Build messages array for streaming API */
    const chatHistory = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: messageText },
    ];

    const botMsgId = `bot-${uid()}`;

    await askAIStream(
      chatHistory,
      (token, fullText) => {
        /* Streaming token — update or create bot message */
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === botMsgId);
          if (existing) {
            return prev.map((m) => (m.id === botMsgId ? { ...m, content: fullText } : m));
          }
          return [
            ...prev,
            { id: botMsgId, role: 'assistant' as const, content: fullText, timestamp: Date.now() },
          ];
        });
      },
      () => {
        setIsStreaming(false);
      },
      () => {
        setIsStreaming(false);
        setMessages((prev) => {
          const hasBot = prev.find((m) => m.id === botMsgId);
          if (hasBot) {
            return prev.map((m) =>
              m.id === botMsgId ? { ...m, content: m.content || 'Sorry, I encountered an error. Please try again.' } : m
            );
          }
          return [
            ...prev,
            {
              id: botMsgId,
              role: 'assistant' as const,
              content: 'Sorry, I encountered an error. Please try again.',
              timestamp: Date.now(),
            },
          ];
        });
      }
    );
  };

  /* Handle Enter key */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Navigate to configure */
  const handleConfigure = () => {
    setActiveTool('channel-assistant');
  };

  /* No config state */
  if (mounted && !channelConfig) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[rgba(255,255,255,0.03)]">
          <button
            onClick={() => setActiveTool('my-channel')}
            className="p-2 rounded-lg text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-[#FFFFFF]">Channel Assistant</h1>
        </div>
        <NoConfigState onConfigure={handleConfigure} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      {/* ── Header Bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[rgba(255,255,255,0.03)]">
        {/* Left: Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTool('my-channel')}
            className="p-2 rounded-lg text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
            title="Back to My Channel"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Title */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[rgba(246,168,40,0.1)] flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-[#F6A828]" />
          </div>
          <h1 className="text-base font-semibold text-[#FFFFFF]">Channel Assistant</h1>
        </div>

        {/* Right: Context toggle */}
        <button
          onClick={() => setContextOpen(!contextOpen)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            contextOpen
              ? 'text-[#F6A828] bg-[rgba(246,168,40,0.1)]'
              : 'text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.03)]'
          )}
          title={contextOpen ? 'Hide channel context' : 'Show channel context'}
        >
          <ChevronRight className={cn('w-5 h-5 transition-transform duration-200', contextOpen && 'rotate-180')} />
        </button>
      </div>

      {/* ── Body: Chat + Sidebar ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#0f0f0f #0a0a0a' }}>
            {/* Empty state: suggested prompts */}
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(246,168,40,0.08)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-[#F6A828]" />
                </div>
                <h2 className="text-base font-bold text-[#FFFFFF] mb-1">
                  Hi{channelConfig ? `, ${channelConfig.channelName}` : ''}!
                </h2>
                <p className="text-sm text-[#a0a0a0] mb-6 text-center max-w-sm">
                  I know everything about your channel. Ask me anything about growth, content strategy, or optimization.
                </p>

                {/* Suggestion chips grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={isStreaming}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] text-left text-sm text-[#a0a0a0] hover:text-[#FFFFFF] hover:border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.03)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F6A828] opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Typing indicator */}
            {isStreaming && !messages.find((m) => m.id.startsWith('bot-') && messages.indexOf(m) === messages.length - 1)?.content && (
              <TypingIndicator />
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── Input Bar ── */}
          <div className="sticky bottom-0 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-[rgba(255,255,255,0.03)]">
            <div className="flex items-center gap-2 max-w-3xl mx-auto">
              <div className="flex-1 flex items-center bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] rounded-full px-4 h-12 focus-within:border-[rgba(255,255,255,0.03)] transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your channel..."
                  disabled={isStreaming}
                  className="flex-1 bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none disabled:opacity-50"
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isStreaming}
                className="w-9 h-9 rounded-full bg-[#F6A828] text-[#0a0a0a] flex items-center justify-center hover:bg-[#FFB340] hover:shadow-lg hover:shadow-[rgba(246,168,40,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Context Sidebar ── */}
        {channelConfig && (
          <>
            {/* Desktop sidebar */}
            <aside
              className={cn(
                'hidden lg:flex flex-col w-[300px] shrink-0 bg-[#0f0f0f] border-l border-[rgba(255,255,255,0.03)] transition-all duration-300 overflow-hidden',
                contextOpen ? 'opacity-100 ml-0' : 'opacity-0 ml-[-300px] w-0'
              )}
            >
              <div className="w-[300px] min-w-[300px] h-full">
                <ContextSidebarContent
                  config={channelConfig}
                  onConfigure={handleConfigure}
                  onClose={() => setContextOpen(false)}
                />
              </div>
            </aside>

            {/* Mobile overlay */}
            {contextOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="lg:hidden fixed inset-0 bg-black/60 z-30"
                  onClick={() => setContextOpen(false)}
                />
                {/* Slide-in panel */}
                <aside className="lg:hidden fixed right-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-[#0f0f0f] border-l border-[rgba(255,255,255,0.03)] z-40 shadow-2xl shadow-black/40 animate-slide-in-right">
                  <ContextSidebarContent
                    config={channelConfig}
                    onConfigure={handleConfigure}
                    onClose={() => setContextOpen(false)}
                  />
                </aside>
              </>
            )}
          </>
        )}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
