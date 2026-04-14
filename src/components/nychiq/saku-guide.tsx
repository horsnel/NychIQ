'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Bot,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Wrench,
  Settings,
  Tv,
  Building2,
  PartyPopper,
  Zap,
} from 'lucide-react';
import { useNychIQStore } from '@/lib/store';

/* ── Guide step definition ── */
interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  targetHint: string; // CSS selector or description of where the tooltip points
  position: 'bottom-center' | 'bottom-right' | 'center';
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: 'Welcome to NychIQ!',
    description:
      'Your tactical command center for YouTube growth. Let me show you around — I\'m Saku, your AI assistant. Together we\'ll explore every tool at your disposal.',
    icon: Sparkles,
    accentColor: '#FDBA2D',
    targetHint: 'topbar',
    position: 'bottom-center',
  },
  {
    id: 2,
    title: 'This is your Dashboard',
    description:
      'Your mission control. See real-time stats, quick actions, channel health, and personalized insights all in one place. It updates live as your channel grows.',
    icon: LayoutDashboard,
    accentColor: '#888888',
    targetHint: 'dashboard-content',
    position: 'bottom-center',
  },
  {
    id: 3,
    title: 'Discover What\'s Trending',
    description:
      'The trending intel feed surfaces viral topics before they peak. Filter by niche, region, and category to find your next big content opportunity.',
    icon: TrendingUp,
    accentColor: '#888888',
    targetHint: 'trending',
    position: 'bottom-center',
  },
  {
    id: 4,
    title: 'Meet Saku AI',
    description:
      'I\'m always here for you! Click the floating button in the bottom-right corner anytime to ask me anything about YouTube strategy, SEO, scripting, or analytics.',
    icon: Bot,
    accentColor: '#888888',
    targetHint: 'saku-fab',
    position: 'bottom-right',
  },
  {
    id: 5,
    title: 'Explore 50+ Tools',
    description:
      'The sidebar is your toolkit. Browse SEO analyzers, viral predictors, competitor trackers, thumbnail labs, and so much more. Every tool is built for creators.',
    icon: Wrench,
    accentColor: '#FDBA2D',
    targetHint: 'sidebar',
    position: 'center',
  },
  {
    id: 6,
    title: 'Track Your Channel',
    description:
      'The My Channel tool gives you deep analytics on your own channel — subscriber growth, content performance, audience demographics, and AI-powered recommendations.',
    icon: Tv,
    accentColor: '#888888',
    targetHint: 'my-channel',
    position: 'bottom-center',
  },
  {
    id: 7,
    title: 'Customize Your Settings',
    description:
      'Tailor NychIQ to your workflow. Set preferences, manage your plan, configure notifications, and connect your YouTube account for deeper insights.',
    icon: Settings,
    accentColor: '#a0a0a0',
    targetHint: 'settings',
    position: 'bottom-center',
  },
  {
    id: 8,
    title: 'You\'re All Set!',
    description:
      'The command center is fully operational. Start exploring, analyzing, and growing your channel. Remember — Saku AI is always one click away. Let\'s go viral!',
    icon: PartyPopper,
    accentColor: '#FDBA2D',
    targetHint: 'center',
    position: 'center',
  },
];

/* ── Sparkle particle effect for final step ── */
function SparkleParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 2,
  }));

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-pulse pointer-events-none"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.id % 3 === 0 ? '#FDBA2D' : p.id % 3 === 1 ? '#888888' : '#888888',
            opacity: 0.4,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
}

/* ── Saku guide animated avatar ── */
function SakuAvatar({ size = 56, accentColor }: { size?: number; accentColor: string }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-2xl animate-pulse"
        style={{
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          transform: 'scale(1.4)',
        }}
      />
      {/* Avatar container */}
      <div
        className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#FDBA2D] to-[#C69320] flex items-center justify-center shadow-lg animate-saku-glow"
      >
        <Bot className="text-black" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    </div>
  );
}

/* ── Progress dots ── */
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => {}}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 6,
            height: 6,
            backgroundColor: i === current ? '#FDBA2D' : i < current ? '#888888' : '#0f0f0f',
          }}
        />
      ))}
    </div>
  );
}

/* ── Main Saku Guide overlay ── */
export function SakuGuide() {
  const { isLoggedIn, onboardingCompleted, setActiveTool } = useNychIQStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const step = GUIDE_STEPS[currentStep];
  const totalSteps = GUIDE_STEPS.length;
  const isLastStep = currentStep === totalSteps - 1;
  const StepIcon = step.icon;

  /* Check if guide should show */
  useEffect(() => {
    if (isLoggedIn && onboardingCompleted) {
      const completed = localStorage.getItem('nychiq_saku_guide_completed');
      if (!completed) {
        // Delay slightly so the dashboard renders first
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, onboardingCompleted]);

  const dismissGuide = useCallback((delay = 300) => {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem('nychiq_saku_guide_completed', 'true');
      setIsVisible(false);
      setIsExiting(false);
    }, delay);
  }, []);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      dismissGuide(500);
      return;
    }
    setAnimKey((k) => k + 1);
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [isLastStep, dismissGuide]);

  const handlePrev = useCallback(() => {
    setAnimKey((k) => k + 1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    dismissGuide(300);
  }, [dismissGuide]);

  if (!isVisible) return null;

  /* Position the tooltip card based on step */
  const getPositionClasses = () => {
    switch (step.position) {
      case 'center':
        return 'items-center justify-center';
      case 'bottom-right':
        return 'items-end justify-end';
      default:
        return 'items-center justify-center';
    }
  };

  /* Highlight target area with a pulsing ring */
  const getHighlightStyle = (): React.CSSProperties => {
    switch (step.targetHint) {
      case 'topbar':
        return {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          boxShadow: `0 4px 20px ${step.accentColor}30`,
          borderRadius: 0,
          pointerEvents: 'none',
          zIndex: 9998,
        };
      case 'saku-fab':
        return {
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          boxShadow: `0 0 30px ${step.accentColor}50`,
          pointerEvents: 'none',
          zIndex: 9998,
        };
      case 'sidebar':
        return {
          position: 'fixed',
          top: 64,
          left: 0,
          bottom: 0,
          width: 240,
          boxShadow: `4px 0 20px ${step.accentColor}20`,
          pointerEvents: 'none',
          zIndex: 9998,
          display: 'none', // hidden on mobile
        };
      default:
        return { display: 'none' };
    }
  };

  return (
    <div className="fixed inset-0 z-[9990]">
      {/* Semi-transparent backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          isExiting ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleSkip}
      />

      {/* Highlight target area */}
      <div
        className={`transition-all duration-500 ${
          isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={getHighlightStyle()}
      />

      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 z-[9999]">
        <div className="h-1 bg-[#0f0f0f]">
          <div
            className="h-full bg-gradient-to-r from-[#FDBA2D] to-[#C69320] transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step counter (top-right) */}
      <div className="absolute top-4 right-4 z-[9999]">
        <span className="text-[10px] font-mono text-[#666666]">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Skip button (top-right, below counter) */}
      <div className="absolute top-10 right-4 z-[9999]">
        <button
          onClick={handleSkip}
          className="text-xs text-[#666666] hover:text-[#a0a0a0] transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Skip Tour
        </button>
      </div>

      {/* Tooltip card */}
      <div
        className={`absolute inset-0 flex ${getPositionClasses()} p-4 z-[9999] pointer-events-none`}
      >
        <div
          key={animKey}
          className={`pointer-events-auto w-full max-w-[420px] rounded-2xl bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] shadow-2xl shadow-black/50 transition-all duration-300 ${
            isExiting
              ? 'opacity-0 scale-95 translate-y-4'
              : 'opacity-100 scale-100 translate-y-0'
          } ${isLastStep ? 'overflow-hidden' : ''}`}
        >
          {isLastStep && <SparkleParticles />}

          <div className="p-5 sm:p-6">
            {/* Header: Avatar + Icon */}
            <div className="flex items-center gap-3.5 mb-4">
              <SakuAvatar accentColor={step.accentColor} />
              <div className="flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: step.accentColor + '15' }}
                >
                  <StepIcon className="w-5 h-5" style={{ color: step.accentColor }} />
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">{step.title}</h3>

            {/* Description */}
            <p className="text-sm text-[#a0a0a0] leading-relaxed mb-5">{step.description}</p>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-[#a0a0a0] bg-[#0f0f0f] hover:bg-[#111111] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-black transition-all hover:brightness-110"
                style={{
                  background: `linear-gradient(135deg, ${step.accentColor}, ${step.accentColor}DD)`,
                  boxShadow: `0 4px 15px ${step.accentColor}30`,
                }}
              >
                {isLastStep ? (
                  <>
                    <Zap className="w-4 h-4" />
                    Start Using NychIQ
                  </>
                ) : (
                  <>
                    Got it!
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center mt-4">
              <ProgressDots current={currentStep} total={totalSteps} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
