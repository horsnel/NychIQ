'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Minimize2, Bot, Sparkles, Zap, TrendingUp, Lightbulb,
  Search, FileText, MessageSquare, BarChart3, Eye, Key, DollarSign, Coins,
} from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { askAIStream } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/* ── Sidebar quick modes ── */
const QUICK_MODES = [
  { id: 'general', icon: Sparkles, label: 'General', desc: 'Ask anything' },
  { id: 'strategy', icon: BarChart3, label: 'Strategy', desc: 'Growth plan' },
  { id: 'ideas', icon: Lightbulb, label: 'Ideas', desc: 'Content ideas' },
  { id: 'seo', icon: Key, label: 'SEO', desc: 'Optimization' },
  { id: 'viral', icon: TrendingUp, label: 'Viral', desc: 'Prediction' },
  { id: 'money', icon: DollarSign, label: 'Revenue', desc: 'Monetize' },
];

/* ── Suggestion chips per mode ── */
const MODE_SUGGESTIONS: Record<string, string[]> = {
  general: ['What can you help me with?', 'How does NychIQ work?', 'Tips for beginners'],
  strategy: ['How to get 1K subscribers fast?', 'Best content strategy for tech niche', 'How often should I post?'],
  ideas: ['Give me 5 viral video ideas', 'Trending topics in gaming', 'Content ideas for faceless channel'],
  seo: ['How to write SEO titles?', 'Tag optimization tips', 'Description template for YouTube'],
  viral: ['What makes a video go viral?', 'How to predict viral content?', 'Viral hooks that work'],
  money: ['How to monetize faster?', 'CPM rates by niche', 'Sponsorship negotiation tips'],
};

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up py-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F6A828] to-[#D4921F] flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-black" />
      </div>
      <div className="bg-[#1A1A1A] px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2.5 h-2.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2.5 h-2.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export function SakuFullPage() {
  const { sakuFullOpen, setSakuFullOpen, setSakuOpen, spendTokens, tokenBalance } = useNychIQStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeMode, setActiveMode] = useState('general');
  const [sakuMode, setSakuMode] = useState<'2.0' | '3x'>('2.0');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgIdRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (sakuFullOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [sakuFullOpen]);

  const getSystemPrompt = useCallback((mode: string, sakuV: string) => {
    const modePrompts: Record<string, string> = {
      general: 'You are Saku, the NychIQ YouTube AI assistant. Be concise, helpful, and expert.',
      strategy: 'You are a YouTube growth strategist. Focus on actionable growth plans, subscriber tactics, and content calendars.',
      ideas: 'You are a creative YouTube content strategist. Generate specific, actionable video ideas with titles and angles.',
      seo: 'You are a YouTube SEO expert. Focus on titles, descriptions, tags, and metadata optimization.',
      viral: 'You are a viral content analyst. Analyze what makes videos go viral and predict viral potential.',
      money: 'You are a YouTube monetization expert. Focus on CPM, sponsorship, and revenue optimization.',
    };
    return modePrompts[mode] || modePrompts.general;
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    const tokenCost = sakuMode === '3x' ? 3 : 1;
    const action = sakuMode === '3x' ? 'saku3x' : 'saku';

    if (!spendTokens(action)) return;

    const userMsg: Message = {
      id: `msg-${++msgIdRef.current}`,
      role: 'user',
      content: messageText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Add placeholder for streaming response
    const botMsgId = `msg-${++msgIdRef.current}`;
    setMessages((prev) => [
      ...prev,
      { id: botMsgId, role: 'assistant', content: '' },
    ]);

    const systemPrompt = getSystemPrompt(activeMode, sakuMode);

    await askAIStream(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageText },
      ],
      (token, _fullText) => {
        // Update the assistant message with each token
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, content: m.content + token } : m
          )
        );
      },
      () => {
        setIsTyping(false);
      },
      () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId && !m.content
              ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
              : m
          )
        );
        setIsTyping(false);
      }
    );
  }, [input, isTyping, activeMode, sakuMode, spendTokens, getSystemPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!sakuFullOpen) return null;

  const suggestions = MODE_SUGGESTIONS[activeMode] || MODE_SUGGESTIONS.general;

  return (
    <div className="fixed inset-0 z-[55] bg-[#0a0a0a] flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[rgba(255,255,255,0.03)] shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-[#555] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F6A828] to-[#D4921F] flex items-center justify-center">
            <Bot className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#FFFFFF]">Saku AI</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#888888] animate-pulse-live" />
                <span className="text-[10px] text-[#888888]">Online</span>
              </div>
              <span className="text-[10px] text-[#333]">·</span>
              <span className="text-[10px] text-[#555]">{tokenBalance} tokens</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center bg-[#0f0f0f] rounded-lg p-0.5 border border-[rgba(255,255,255,0.03)]">
            <button
              onClick={() => setSakuMode('2.0')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sakuMode === '2.0'
                  ? 'bg-[#F6A828] text-black shadow-sm'
                  : 'text-[#555] hover:text-[#a0a0a0]'
              }`}
            >
              Saku 2.0
              <Coins className="w-3 h-3 ml-1 inline" />
              <span className="ml-0.5 opacity-70">1</span>
            </button>
            <button
              onClick={() => setSakuMode('3x')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sakuMode === '3x'
                  ? 'bg-[#888888] text-white shadow-sm'
                  : 'text-[#555] hover:text-[#a0a0a0]'
              }`}
            >
              Saku 3X
              <Coins className="w-3 h-3 ml-1 inline" />
              <span className="ml-0.5 opacity-70">3</span>
            </button>
          </div>
          <button
            onClick={() => { setSakuFullOpen(false); setSakuOpen(true); }}
            className="p-2 rounded-md text-[#555] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors hidden sm:block"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSakuFullOpen(false)}
            className="p-2 rounded-md text-[#555] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-[200px] lg:w-[220px] border-r border-[rgba(255,255,255,0.03)] p-3 flex flex-col gap-1 overflow-y-auto no-scrollbar shrink-0 animate-fade-in-up">
            <span className="text-[10px] text-[#444] font-semibold tracking-wider uppercase px-2 mb-1">Quick Modes</span>
            {QUICK_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                  activeMode === mode.id
                    ? 'bg-[rgba(246,168,40,0.08)] border border-[rgba(255,255,255,0.03)] text-[#F6A828]'
                    : 'hover:bg-[rgba(255,255,255,0.03)] text-[#666] hover:text-[#a0a0a0] border border-transparent'
                }`}
              >
                <mode.icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium">{mode.label}</div>
                  <div className="text-[10px] text-[#444] truncate">{mode.desc}</div>
                </div>
              </button>
            ))}

            {/* Clear chat */}
            <div className="mt-auto pt-3 border-t border-[#1A1A1A]">
              <button
                onClick={() => setMessages([])}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#444] hover:text-[#888888] hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Clear chat
              </button>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 no-scrollbar">
            <div className="max-w-2xl mx-auto">
              {/* Welcome state */}
              {messages.length === 0 && !isTyping && (
                <div className="text-center py-8 sm:py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F6A828] to-[#D4921F] flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">How can I help you today?</h3>
                  <p className="text-sm text-[#666] mb-8 max-w-sm mx-auto">
                    Ask me about YouTube strategy, content ideas, SEO, viral prediction, or monetization.
                  </p>

                  {/* Suggestion chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg mx-auto">
                    {suggestions.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSend(sug)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] text-left hover:border-[#333] hover:bg-[#161616] transition-all group"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#444] group-hover:text-[#F6A828] transition-colors shrink-0" />
                        <span className="text-xs text-[#a0a0a0] group-hover:text-[#FFFFFF] transition-colors">{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 && (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex items-start gap-3',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F6A828] to-[#D4921F] flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-black" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] px-4 py-3 text-sm leading-relaxed',
                          msg.role === 'user'
                            ? 'bg-[#F6A828] text-black rounded-2xl rounded-tr-sm'
                            : 'bg-[#1A1A1A] text-[#FFFFFF] rounded-2xl rounded-tl-sm'
                        )}
                      >
                        {msg.role === 'assistant' && !msg.content && isTyping ? (
                          <div className="flex gap-1.5 py-0.5">
                            <span className="w-2.5 h-2.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2.5 h-2.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2.5 h-2.5 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Streaming typing indicator (only if there's no streaming message yet) */}
                  {isTyping && messages.every((m) => m.content || m.role === 'user') && (
                    <TypingIndicator />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 pt-3 shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-end gap-3 bg-[#0f0f0f] rounded-xl px-4 py-3 border border-[rgba(255,255,255,0.03)] focus-within:border-[rgba(255,255,255,0.03)] transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask Saku about ${activeMode}...`}
                  className="flex-1 bg-transparent text-sm text-[#FFFFFF] placeholder-[#444] outline-none resize-none min-h-[24px] max-h-[120px]"
                  rows={1}
                  disabled={isTyping}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    sakuMode === '2.0'
                      ? 'bg-[#F6A828] text-black hover:bg-[#FFB340] disabled:opacity-30'
                      : 'bg-[#888888] text-white hover:bg-[#8560B5] disabled:opacity-30'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-[#444]">
                  {sakuMode === '2.0' ? 'Saku 2.0' : 'Saku 3X (enhanced)'} · {sakuMode === '2.0' ? '1' : '3'} token per message
                </p>
                <p className="text-[10px] text-[#333]">
                  {tokenBalance} tokens remaining
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
