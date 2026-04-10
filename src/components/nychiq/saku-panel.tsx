'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Maximize2, Bot, Sparkles, Zap, TrendingUp, Lightbulb, Search } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { askAI } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/* ── Suggestion chips ── */
const SUGGESTIONS = [
  { icon: TrendingUp, text: 'What\'s trending today?' },
  { icon: Lightbulb, text: 'Give me 5 video ideas' },
  { icon: Search, text: 'How to optimize my SEO?' },
  { icon: Zap, text: 'Predict viral potential' },
  { icon: Sparkles, text: 'Best time to post?' },
];

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 animate-fade-in-up">
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#9B72CF] to-[#FDBA2D] flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-black" />
      </div>
      <div className="bg-[#1A1A1A] px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export function SakuPanel() {
  const { sakuOpen, setSakuOpen, setSakuFullOpen, spendTokens, tokenBalance } = useNychIQStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Focus input when panel opens
  useEffect(() => {
    if (sakuOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [sakuOpen]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    // Spend token
    if (!spendTokens('saku')) return;

    const userMsg: Message = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askAI(messageText, 'You are Saku, the NychIQ YouTube AI assistant. Be concise and helpful.');
      const botMsg: Message = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, spendTokens]);

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  if (!sakuOpen) return null;

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={() => setSakuOpen(false)}
      />

      {/* Panel */}
      <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-[#141414] border border-[#222] rounded-xl shadow-2xl flex flex-col animate-fade-in-up lg:bottom-5 lg:right-5"
        style={{ height: '520px', maxHeight: '75vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9B72CF] to-[#FDBA2D] flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-black" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E8E8E8]">Saku AI</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse-live" />
                <p className="text-[10px] text-[#10B981]">Online</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { setSakuOpen(false); setSakuFullOpen(true); }}
              className="p-1.5 rounded-md text-[#555] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSakuOpen(false)}
              className="p-1.5 rounded-md text-[#555] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Welcome state (no messages) */}
          {messages.length === 0 && !isTyping && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9B72CF] to-[#FDBA2D] flex items-center justify-center mx-auto mb-3">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <p className="text-sm font-semibold text-[#E8E8E8] mb-1">Hey! I&apos;m Saku</p>
              <p className="text-xs text-[#666] mb-5">Your YouTube AI assistant. Ask me anything!</p>

              {/* Suggestion chips */}
              <div className="space-y-2">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.text}
                    onClick={() => handleSuggestionClick(sug.text)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#1A1A1A] border border-[#222] text-left hover:border-[#333] hover:bg-[#1E1E1E] transition-all group"
                  >
                    <sug.icon className="w-3.5 h-3.5 text-[#555] group-hover:text-[#FDBA2D] transition-colors shrink-0" />
                    <span className="text-xs text-[#888] group-hover:text-[#E8E8E8] transition-colors">{sug.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex items-start gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#9B72CF] to-[#FDBA2D] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-black" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[82%] px-3.5 py-2.5 text-[13px] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[#FDBA2D] text-black rounded-2xl rounded-tr-sm'
                    : 'bg-[#1A1A1A] text-[#E8E8E8] rounded-2xl rounded-tl-sm'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Token badge */}
        <div className="px-4 pt-2 pb-1 shrink-0">
          <span className="text-[10px] text-[#444]">1 token per message · {tokenBalance} remaining</span>
        </div>

        {/* Input */}
        <div className="p-3 pt-2 border-t border-[#1E1E1E] shrink-0">
          <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-xl px-3.5 py-2.5 border border-[#222] focus-within:border-[rgba(253,186,45,0.3)] transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask Saku anything..."
              className="flex-1 bg-transparent text-sm text-[#E8E8E8] placeholder-[#444] outline-none"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="p-1.5 rounded-lg text-[#FDBA2D] hover:bg-[rgba(253,186,45,0.1)] disabled:text-[#333] disabled:hover:bg-transparent transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
