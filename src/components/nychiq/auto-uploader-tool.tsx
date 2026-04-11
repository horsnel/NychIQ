'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  Upload,
  Clock,
  Bot,
  Layers,
  Mail,
  CheckCircle2,
  ArrowRight,
  Check,
  Loader2,
  Users,
  Zap,
} from 'lucide-react';

/* ── Feature Preview Data ── */
const FEATURES = [
  {
    icon: Clock,
    title: 'Smart Upload',
    description: 'Schedule and auto-upload videos at optimal times with AI timing analysis',
    color: '#FDBA2D',
    bg: 'rgba(253,186,45,0.1)',
    border: 'rgba(253,186,45,0.2)',
  },
  {
    icon: Bot,
    title: 'Channel Autopilot',
    description: 'AI manages your upload schedule, descriptions, tags, and thumbnails',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.2)',
  },
  {
    icon: Layers,
    title: 'Batch Processing',
    description: 'Upload multiple videos at once with automatic optimization for each',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.2)',
  },
] as const;

/* ── Timeline Data ── */
const TIMELINE = [
  { label: 'Core AI Engine Ready', status: 'completed' as const },
  { label: 'Scheduling Algorithm Built', status: 'completed' as const },
  { label: 'Integration Testing', status: 'in-progress' as const },
  { label: 'Beta Launch', status: 'upcoming' as const },
  { label: 'Public Release', status: 'upcoming' as const },
] as const;

/* ── Email Validation ── */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Timeline Status Config ── */
function timelineConfig(status: typeof TIMELINE[number]['status']) {
  switch (status) {
    case 'completed':
      return {
        dotColor: '#10B981',
        ringColor: 'rgba(16,185,129,0.2)',
        textColor: '#10B981',
        lineColor: '#10B981',
        icon: <Check className="w-3 h-3" />,
      };
    case 'in-progress':
      return {
        dotColor: '#FDBA2D',
        ringColor: 'rgba(253,186,45,0.2)',
        textColor: '#FDBA2D',
        lineColor: '#222222',
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
      };
    case 'upcoming':
      return {
        dotColor: '#555555',
        ringColor: 'rgba(85,85,85,0.2)',
        textColor: '#555555',
        lineColor: '#222222',
        icon: null,
      };
  }
}

/* ════════════════════════════════════════════════
   AUTO UPLOADER & CHANNEL AUTOPILOT — COMING SOON
   ════════════════════════════════════════════════ */
export function AutoUploaderTool() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* Check localStorage on mount */
  useEffect(() => {
    const stored = localStorage.getItem('nychiq_waitlist_email');
    if (stored) {
      // Batch state updates to avoid cascading renders
      React.startTransition(() => {
        setEmail(stored);
        setAlreadyJoined(true);
        setSubmitted(true);
      });
    }
  }, []);

  const handleSubmit = () => {
    const trimmed = email.trim();

    if (!trimmed) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!isValidEmail(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setSubmitting(true);

    // Simulate a brief network delay for UX
    setTimeout(() => {
      localStorage.setItem('nychiq_waitlist_email', trimmed);
      setSubmitted(true);
      setAlreadyJoined(true);
      setSubmitting(false);
      showToast("You're on the waitlist! We'll notify you when Auto Uploader is ready.", 'success');
    }, 600);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ──────── HERO SECTION ──────── */}
      <div className="relative rounded-lg overflow-hidden">
        {/* Animated gradient border wrapper */}
        <div
          className="absolute inset-0 rounded-lg animate-gradient-spin"
          style={{
            background: 'conic-gradient(from 0deg, #FDBA2D, #8B5CF6, #FDBA2D, #8B5CF6, #FDBA2D)',
            padding: '1.5px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        {/* Card content */}
        <div className="relative rounded-lg bg-[#141414] px-6 py-10 sm:px-10 sm:py-14">
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6, rgba(139,92,246,0.6))',
                boxShadow: '0 8px 32px rgba(139,92,246,0.25)',
              }}
            >
              <Upload className="w-8 h-8 text-white" />
            </div>

            {/* Title + Coming Soon badge */}
            <div className="flex items-center gap-3 mb-4 flex-wrap justify-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF]">
                Auto Uploader &amp; Channel Autopilot
              </h1>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#0D0D0D] animate-pulse-badge"
                style={{ backgroundColor: '#FDBA2D' }}
              >
                <Zap className="w-3 h-3" />
                Coming Soon
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed max-w-md">
              AI-powered automatic video uploading, scheduling, and channel management. Let
              NychIQ handle your uploads while you focus on creating content.
            </p>
          </div>
        </div>
      </div>

      {/* ──────── FEATURE PREVIEW CARDS ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg bg-[#141414] border border-[#222222] p-5 hover:border-[#333333] transition-colors group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
              style={{ backgroundColor: feature.bg, border: `1px solid ${feature.border}` }}
            >
              <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
            </div>
            <h3 className="text-sm font-bold text-[#FFFFFF] mb-1.5">{feature.title}</h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* ──────── WAITLIST SECTION ──────── */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] p-6 sm:p-8">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          {/* Confirmation State */}
          {submitted ? (
            <div className="flex flex-col items-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <CheckCircle2 className="w-7 h-7" style={{ color: '#10B981' }} />
              </div>
              <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">You&apos;re on the list!</h3>
              <p className="text-sm text-[#A3A3A3] mb-4">
                We&apos;ll notify <span className="text-[#FFFFFF] font-medium">{email}</span> when
                Auto Uploader is ready.
              </p>
              <p className="text-xs text-[#555555]">
                You&apos;re one of 2,847 creators on the waitlist
              </p>
            </div>
          ) : (
            <>
              {/* Social proof */}
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[#555555]" />
                <span className="text-xs text-[#555555]">Join 2,847 creators on the waitlist</span>
              </div>

              <h3 className="text-base font-bold text-[#FFFFFF] mb-2">
                Be the first to know when it launches
              </h3>
              <p className="text-sm text-[#A3A3A3] mb-5">
                Enter your email to get early access and exclusive launch pricing.
              </p>

              {/* Email Input + Button */}
              <div className="w-full flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555] pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit();
                    }}
                    placeholder="you@email.com"
                    className={cn(
                      'w-full h-11 pl-10 pr-4 rounded-lg bg-[#0D0D0D] border text-sm text-[#FFFFFF] placeholder:text-[#444444] focus:outline-none transition-colors',
                      emailError ? 'border-[#EF4444]' : 'border-[#1A1A1A]'
                    )}
                    style={{ caretColor: '#FDBA2D' }}
                    onFocus={(e) => {
                      if (!emailError) e.target.style.borderColor = 'rgba(253,186,45,0.5)';
                    }}
                    onBlur={(e) => {
                      if (!emailError) e.target.style.borderColor = '#1A1A1A';
                    }}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !email.trim()}
                  className="h-11 px-6 rounded-lg text-[#0D0D0D] text-sm font-bold flex items-center justify-center gap-2 shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: '#FDBA2D' }}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Error message */}
              {emailError && (
                <p className="text-xs mt-2" style={{ color: '#EF4444' }}>
                  {emailError}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ──────── STATUS TIMELINE ──────── */}
      <div className="rounded-lg bg-[#141414] border border-[#222222] p-6 sm:p-8">
        <h3 className="text-sm font-bold text-[#FFFFFF] mb-5 flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: '#FDBA2D' }} />
          Development Progress
        </h3>
        <div className="flex flex-col gap-0">
          {TIMELINE.map((step, i) => {
            const cfg = timelineConfig(step.status);
            const isLast = i === TIMELINE.length - 1;

            return (
              <div key={step.label} className="flex items-start gap-3">
                {/* Line + Dot column */}
                <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                  {/* Dot */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                      step.status === 'in-progress' && 'animate-pulse-dot'
                    )}
                    style={{
                      backgroundColor: cfg.ringColor,
                      border: `1.5px solid ${cfg.dotColor}`,
                    }}
                  >
                    {cfg.icon && <span style={{ color: cfg.dotColor }}>{cfg.icon}</span>}
                  </div>
                  {/* Connecting line */}
                  {!isLast && (
                    <div
                      className="w-px flex-1 min-h-[28px]"
                      style={{ backgroundColor: cfg.lineColor }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="pt-[2px] pb-4">
                  <span
                    className="text-sm font-medium"
                    style={{ color: cfg.textColor }}
                  >
                    {step.label}
                  </span>
                  {step.status === 'in-progress' && (
                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: '#FDBA2D', backgroundColor: 'rgba(253,186,45,0.1)' }}>
                      IN PROGRESS
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──────── EMBEDDED KEYFRAMES ──────── */}
      <style jsx global>{`
        @keyframes gradient-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .animate-gradient-spin {
          animation: gradient-spin 4s linear infinite;
        }

        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(253,186,45,0.5); }
          50%      { box-shadow: 0 0 0 8px rgba(253,186,45,0); }
        }

        .animate-pulse-badge {
          animation: pulse-badge 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(253,186,45,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(253,186,45,0); }
        }

        .animate-pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
