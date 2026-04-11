'use client';

import React, { useState, useRef, useCallback, type ReactNode } from 'react';
import { Plus, Send, Loader2 } from 'lucide-react';

/* ── Types ── */
interface GlowRingInputProps {
  /** Placeholder text shown in the input */
  placeholder?: string;
  /** Called when user submits (Enter or send button) */
  onSubmit: (text: string) => void;
  /** Whether the AI is currently processing/streaming */
  isLoading?: boolean;
  /** Left icon slot — defaults to Plus button */
  leftAction?: ReactNode;
  /** Right icon slot — defaults to Send button */
  rightAction?: ReactNode;
  /** Additional class names for the outer container */
  className?: string;
  /** Controlled input value */
  value?: string;
  /** onChange handler */
  onChange?: (value: string) => void;
  /** Whether the ring starts active (e.g. auto-focused) */
  defaultActive?: boolean;
  /** Multiline support */
  multiline?: boolean;
  /** Maximum rows for multiline */
  maxRows?: number;
}

/* ── Component ── */
export function GlowRingInput({
  placeholder = 'Ask Ninja to create...',
  onSubmit,
  isLoading = false,
  leftAction,
  rightAction,
  className = '',
  value: controlledValue,
  onChange: controlledOnChange,
  defaultActive = false,
  multiline = false,
  maxRows = 4,
}: GlowRingInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isActive, setIsActive] = useState(defaultActive);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const value = controlledValue ?? internalValue;
  const setValue = controlledOnChange ?? setInternalValue;

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    if (!controlledValue) setInternalValue('');
  }, [value, isLoading, onSubmit, controlledValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  /* Auto-resize textarea */
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const v = (e.target as HTMLTextAreaElement).value;
      setValue(v);

      if (multiline && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const lineHeight = 24;
        const maxHeight = lineHeight * maxRows;
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, maxHeight) + 'px';
      }
    },
    [setValue, multiline, maxRows]
  );

  const inputElement = multiline ? (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsActive(true)}
      onBlur={() => !value && setIsActive(false)}
      placeholder={placeholder}
      rows={1}
      disabled={isLoading}
      className="flex-1 resize-none bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none disabled:opacity-50 py-3 min-h-[24px]"
    />
  ) : (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsActive(true)}
      onBlur={() => !value && setIsActive(false)}
      placeholder={placeholder}
      disabled={isLoading}
      className="flex-1 bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none disabled:opacity-50"
    />
  );

  return (
    <div className={`glow-ring-input ${isActive || value ? 'glow-ring-active' : ''} ${className}`}>
      <div className="glow-ring-inner flex items-center gap-2 px-3 py-1.5">
        {/* Left action */}
        <button
          type="button"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          tabIndex={-1}
        >
          {leftAction ?? <Plus className="w-4 h-4" />}
        </button>

        {/* Input */}
        <div className="flex-1 min-w-0 flex items-center">
          {inputElement}
        </div>

        {/* Right action / send */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            value.trim() && !isLoading
              ? 'bg-[#8B5CF6] text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
              : 'text-[#555555]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {rightAction ??
            (isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            ))}
        </button>
      </div>
    </div>
  );
}
