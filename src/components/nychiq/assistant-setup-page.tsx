'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Bot,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNychIQStore, type AssistantCharacter, type AssistantConfig } from '@/lib/store';

/* ── Question definitions ── */
const NICHE_OPTIONS = [
  'Tech', 'Gaming', 'Finance', 'Education',
  'Lifestyle', 'Fitness', 'Cooking', 'Music',
];

const AUDIENCE_OPTIONS = [
  'Kids', 'Teens', 'Young Adults', 'Professionals', 'Parents', 'Seniors',
];

const STYLE_OPTIONS = [
  'Educational', 'Entertaining', 'Vlog-style', 'Tutorial', 'News/Updates', 'Storytelling',
];

const OUTFIT_OPTIONS = [
  { id: 'casual', label: 'Casual', icon: '👕' },
  { id: 'professional', label: 'Professional', icon: '💼' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'sporty', label: 'Sporty', icon: '⚡' },
];

const CHARACTER_CARDS: { id: AssistantCharacter; label: string; color: string }[] = [
  { id: 'dog', label: 'Dog', color: '#FDBA2D' },
  { id: 'cat', label: 'Cat', color: '#8B5CF6' },
  { id: 'boy', label: 'Boy', color: '#3B82F6' },
  { id: 'girl', label: 'Girl', color: '#EF4444' },
  { id: 'man', label: 'Man', color: '#10B981' },
  { id: 'woman', label: 'Woman', color: '#FF6B9D' },
];

/* ── SVG Character illustrations (geometric style) ── */
function CharacterIcon({ character, color, size = 64 }: { character: AssistantCharacter; color: string; size?: number }) {
  const s = size;
  const half = s / 2;

  switch (character) {
    case 'dog':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          {/* Body */}
          <ellipse cx={half} cy={s * 0.65} rx={s * 0.28} ry={s * 0.22} fill={color} opacity="0.8" />
          {/* Head */}
          <circle cx={half} cy={s * 0.4} r={s * 0.2} fill={color} />
          {/* Ears */}
          <ellipse cx={s * 0.28} cy={s * 0.28} rx={s * 0.06} ry={s * 0.1} fill={color} transform="rotate(-15 20 18)" />
          <ellipse cx={s * 0.72} cy={s * 0.28} rx={s * 0.06} ry={s * 0.1} fill={color} transform="rotate(15 44 18)" />
          {/* Eyes */}
          <circle cx={s * 0.43} cy={s * 0.37} r={s * 0.028} fill="#0D0D0D" />
          <circle cx={s * 0.57} cy={s * 0.37} r={s * 0.028} fill="#0D0D0D" />
          {/* Nose */}
          <ellipse cx={half} cy={s * 0.44} rx={s * 0.03} ry={s * 0.02} fill="#0D0D0D" />
          {/* Tail */}
          <path d={`M ${s * 0.72} ${s * 0.6} Q ${s * 0.88} ${s * 0.45} ${s * 0.82} ${s * 0.55}`} stroke={color} strokeWidth={s * 0.04} strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'cat':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          {/* Body */}
          <ellipse cx={half} cy={s * 0.65} rx={s * 0.25} ry={s * 0.2} fill={color} opacity="0.8" />
          {/* Head */}
          <circle cx={half} cy={s * 0.4} r={s * 0.19} fill={color} />
          {/* Ears (triangles) */}
          <polygon points={`${s * 0.34},${s * 0.3} ${s * 0.3},${s * 0.15} ${s * 0.44},${s * 0.24}`} fill={color} />
          <polygon points={`${s * 0.66},${s * 0.3} ${s * 0.7},${s * 0.15} ${s * 0.56},${s * 0.24}`} fill={color} />
          {/* Inner ears */}
          <polygon points={`${s * 0.35},${s * 0.28} ${s * 0.32},${s * 0.18} ${s * 0.43},${s * 0.25}`} fill={color} opacity="0.5" />
          <polygon points={`${s * 0.65},${s * 0.28} ${s * 0.68},${s * 0.18} ${s * 0.57},${s * 0.25}`} fill={color} opacity="0.5" />
          {/* Eyes */}
          <ellipse cx={s * 0.43} cy={s * 0.38} rx={s * 0.025} ry={s * 0.032} fill="#0D0D0D" />
          <ellipse cx={s * 0.57} cy={s * 0.38} rx={s * 0.025} ry={s * 0.032} fill="#0D0D0D" />
          {/* Nose */}
          <polygon points={`${half},${s * 0.43} ${s * 0.48},${s * 0.45} ${s * 0.52},${s * 0.45}`} fill="#0D0D0D" />
          {/* Whiskers */}
          <line x1={s * 0.35} y1={s * 0.44} x2={s * 0.2} y2={s * 0.42} stroke={color} strokeWidth="1" opacity="0.6" />
          <line x1={s * 0.35} y1={s * 0.46} x2={s * 0.2} y2={s * 0.48} stroke={color} strokeWidth="1" opacity="0.6" />
          <line x1={s * 0.65} y1={s * 0.44} x2={s * 0.8} y2={s * 0.42} stroke={color} strokeWidth="1" opacity="0.6" />
          <line x1={s * 0.65} y1={s * 0.46} x2={s * 0.8} y2={s * 0.48} stroke={color} strokeWidth="1" opacity="0.6" />
          {/* Tail */}
          <path d={`M ${s * 0.72} ${s * 0.65} Q ${s * 0.9} ${s * 0.5} ${s * 0.85} ${s * 0.35}`} stroke={color} strokeWidth={s * 0.035} strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'boy':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          {/* Body / shirt */}
          <rect x={s * 0.3} y={s * 0.52} width={s * 0.4} height={s * 0.32} rx={s * 0.06} fill={color} opacity="0.8" />
          {/* Neck */}
          <rect x={s * 0.44} y={s * 0.46} width={s * 0.12} height={s * 0.08} rx={s * 0.02} fill={color} opacity="0.6" />
          {/* Head */}
          <circle cx={half} cy={s * 0.35} r={s * 0.18} fill={color} />
          {/* Hair */}
          <path d={`M ${s * 0.33} ${s * 0.32} Q ${half} ${s * 0.12} ${s * 0.67} ${s * 0.32}`} fill={color} opacity="0.7" />
          <path d={`M ${s * 0.33} ${s * 0.32} L ${s * 0.33} ${s * 0.38} Q ${half} ${s * 0.14} ${s * 0.67} ${s * 0.38} L ${s * 0.67} ${s * 0.32}`} fill={color} opacity="0.5" />
          {/* Eyes */}
          <circle cx={s * 0.43} cy={s * 0.34} r={s * 0.025} fill="#0D0D0D" />
          <circle cx={s * 0.57} cy={s * 0.34} r={s * 0.025} fill="#0D0D0D" />
          {/* Smile */}
          <path d={`M ${s * 0.44} ${s * 0.41} Q ${half} ${s * 0.46} ${s * 0.56} ${s * 0.41}`} stroke="#0D0D0D" strokeWidth={s * 0.02} strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'girl':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          {/* Body / dress */}
          <path d={`M ${s * 0.35} ${s * 0.52} L ${s * 0.25} ${s * 0.85} Q ${half} ${s * 0.9} ${s * 0.75} ${s * 0.85} L ${s * 0.65} ${s * 0.52} Z`} fill={color} opacity="0.8" />
          {/* Neck */}
          <rect x={s * 0.44} y={s * 0.46} width={s * 0.12} height={s * 0.08} rx={s * 0.02} fill={color} opacity="0.6" />
          {/* Head */}
          <circle cx={half} cy={s * 0.35} r={s * 0.18} fill={color} />
          {/* Hair (long) */}
          <path d={`M ${s * 0.3} ${s * 0.35} Q ${half} ${s * 0.1} ${s * 0.7} ${s * 0.35}`} fill={color} opacity="0.7" />
          <path d={`M ${s * 0.3} ${s * 0.35} Q ${s * 0.25} ${s * 0.55} ${s * 0.3} ${s * 0.5}`} fill={color} opacity="0.5" />
          <path d={`M ${s * 0.7} ${s * 0.35} Q ${s * 0.75} ${s * 0.55} ${s * 0.7} ${s * 0.5}`} fill={color} opacity="0.5" />
          {/* Eyes */}
          <circle cx={s * 0.43} cy={s * 0.34} r={s * 0.025} fill="#0D0D0D" />
          <circle cx={s * 0.57} cy={s * 0.34} r={s * 0.025} fill="#0D0D0D" />
          {/* Blush */}
          <circle cx={s * 0.38} cy={s * 0.39} r={s * 0.03} fill={color} opacity="0.3" />
          <circle cx={s * 0.62} cy={s * 0.39} r={s * 0.03} fill={color} opacity="0.3" />
          {/* Smile */}
          <path d={`M ${s * 0.44} ${s * 0.41} Q ${half} ${s * 0.46} ${s * 0.56} ${s * 0.41}`} stroke="#0D0D0D" strokeWidth={s * 0.02} strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'man':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          {/* Body / suit */}
          <rect x={s * 0.28} y={s * 0.52} width={s * 0.44} height={s * 0.32} rx={s * 0.05} fill={color} opacity="0.8" />
          {/* Collar */}
          <polygon points={`${s * 0.44},${s * 0.52} ${half},${s * 0.6} ${s * 0.56},${s * 0.52}`} fill={color} />
          {/* Tie */}
          <rect x={s * 0.48} y={s * 0.58} width={s * 0.04} height={s * 0.14} rx={s * 0.01} fill={color} opacity="0.5" />
          {/* Neck */}
          <rect x={s * 0.43} y={s * 0.46} width={s * 0.14} height={s * 0.08} rx={s * 0.02} fill={color} opacity="0.6" />
          {/* Head */}
          <circle cx={half} cy={s * 0.35} r={s * 0.19} fill={color} />
          {/* Hair (short, neat) */}
          <path d={`M ${s * 0.32} ${s * 0.32} Q ${half} ${s * 0.1} ${s * 0.68} ${s * 0.32}`} fill={color} opacity="0.7" />
          {/* Eyes */}
          <circle cx={s * 0.43} cy={s * 0.34} r={s * 0.022} fill="#0D0D0D" />
          <circle cx={s * 0.57} cy={s * 0.34} r={s * 0.022} fill="#0D0D0D" />
          {/* Slight smile */}
          <path d={`M ${s * 0.44} ${s * 0.42} Q ${half} ${s * 0.45} ${s * 0.56} ${s * 0.42}`} stroke="#0D0D0D" strokeWidth={s * 0.018} strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'woman':
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
          {/* Body / top */}
          <rect x={s * 0.3} y={s * 0.52} width={s * 0.4} height={s * 0.32} rx={s * 0.06} fill={color} opacity="0.8" />
          {/* Neck */}
          <rect x={s * 0.44} y={s * 0.46} width={s * 0.12} height={s * 0.08} rx={s * 0.02} fill={color} opacity="0.6" />
          {/* Necklace */}
          <circle cx={half} cy={s * 0.51} r={s * 0.015} fill="#FDBA2D" />
          {/* Head */}
          <circle cx={half} cy={s * 0.35} r={s * 0.19} fill={color} />
          {/* Hair (styled) */}
          <path d={`M ${s * 0.28} ${s * 0.33} Q ${half} ${s * 0.08} ${s * 0.72} ${s * 0.33}`} fill={color} opacity="0.7" />
          <path d={`M ${s * 0.28} ${s * 0.33} Q ${s * 0.24} ${s * 0.52} ${s * 0.32} ${s * 0.48}`} fill={color} opacity="0.5" />
          <path d={`M ${s * 0.72} ${s * 0.33} Q ${s * 0.76} ${s * 0.52} ${s * 0.68} ${s * 0.48}`} fill={color} opacity="0.5" />
          {/* Eyes */}
          <circle cx={s * 0.43} cy={s * 0.34} r={s * 0.025} fill="#0D0D0D" />
          <circle cx={s * 0.57} cy={s * 0.34} r={s * 0.025} fill="#0D0D0D" />
          {/* Eyelashes */}
          <path d={`M ${s * 0.41} ${s * 0.32} L ${s * 0.4} ${s * 0.3}`} stroke="#0D0D0D" strokeWidth="1" strokeLinecap="round" />
          <path d={`M ${s * 0.59} ${s * 0.32} L ${s * 0.6} ${s * 0.3}`} stroke="#0D0D0D" strokeWidth="1" strokeLinecap="round" />
          {/* Blush */}
          <circle cx={s * 0.38} cy={s * 0.39} r={s * 0.03} fill={color} opacity="0.3" />
          <circle cx={s * 0.62} cy={s * 0.39} r={s * 0.03} fill={color} opacity="0.3" />
          {/* Smile */}
          <path d={`M ${s * 0.44} ${s * 0.41} Q ${half} ${s * 0.46} ${s * 0.56} ${s * 0.41}`} stroke="#0D0D0D" strokeWidth={s * 0.02} strokeLinecap="round" fill="none" />
          {/* Lips accent */}
          <ellipse cx={half} cy={s * 0.435} rx={s * 0.03} ry={s * 0.012} fill={color} opacity="0.4" />
        </svg>
      );

    default:
      return <Bot size={s} color={color} />;
  }
}

/* ── Small character icon for preview ── */
function CharacterIconSmall({ character, color }: { character: AssistantCharacter; color: string }) {
  return <CharacterIcon character={character} color={color} size={40} />;
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════ */
export function AssistantSetupPage() {
  const { setPage, setAssistantConfig, addAssistantMessage, channelData } = useNychIQStore();

  /* ── Wizard state ── */
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  /* ── Answers ── */
  const [channelNiche, setChannelNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [channelStyle, setChannelStyle] = useState('');
  const [channelGoals, setChannelGoals] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<AssistantCharacter | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState('casual');
  const [assistantName, setAssistantName] = useState('');

  /* ── Step progress ── */
  const totalSteps = 3;
  const stepLabels = ['Channel', 'Character', 'Name'];

  /* ── Questions array for Step 1 ── */
  const questions = useMemo(() => [
    {
      title: "What's your channel's main niche?",
      subtitle: 'This helps your assistant understand your content area.',
      type: 'options' as const,
      options: NICHE_OPTIONS,
      value: channelNiche,
      setValue: setChannelNiche,
    },
    {
      title: 'Who is your target audience?',
      subtitle: 'We\'ll tailor recommendations to your viewers.',
      type: 'options' as const,
      options: AUDIENCE_OPTIONS,
      value: targetAudience,
      setValue: setTargetAudience,
    },
    {
      title: 'How would you describe your current content style?',
      subtitle: 'This shapes how your assistant communicates.',
      type: 'options' as const,
      options: STYLE_OPTIONS,
      value: channelStyle,
      setValue: setChannelStyle,
    },
    {
      title: "What's your biggest goal for this channel?",
      subtitle: 'Be as specific as you like — your assistant will keep it in mind.',
      type: 'text' as const,
      placeholder: 'e.g., Reach 100K subscribers in 6 months',
      value: channelGoals,
      setValue: setChannelGoals,
    },
  ], [channelNiche, targetAudience, channelStyle, channelGoals]);

  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const isQuestionAnswered = currentQuestion?.type === 'text'
    ? channelGoals.trim().length > 0
    : currentQuestion?.value !== '';

  /* ── Animation helper ── */
  const animateTransition = useCallback((callback: () => void) => {
    setIsAnimating(true);
    setTimeout(() => {
      callback();
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  }, []);

  /* ── Step 1 handlers ── */
  const handleOptionSelect = useCallback((value: string) => {
    currentQuestion?.setValue(value);
    // Auto-advance after a short delay
    if (!isLastQuestion) {
      animateTransition(() => setQuestionIndex((q) => q + 1));
    }
  }, [currentQuestion, isLastQuestion, animateTransition]);

  const handleNextQuestion = useCallback(() => {
    if (!isQuestionAnswered) return;
    if (isLastQuestion) {
      animateTransition(() => setCurrentStep(2));
    } else {
      animateTransition(() => setQuestionIndex((q) => q + 1));
    }
  }, [isLastQuestion, isQuestionAnswered, animateTransition]);

  const handlePrevQuestion = useCallback(() => {
    if (questionIndex > 0) {
      animateTransition(() => setQuestionIndex((q) => q - 1));
    }
  }, [questionIndex, animateTransition]);

  /* ── Step 2 handlers ── */
  const handleCharacterSelect = useCallback((char: AssistantCharacter) => {
    setSelectedCharacter(char);
  }, []);

  const handleStep2Next = useCallback(() => {
    if (!selectedCharacter) return;
    animateTransition(() => setCurrentStep(3));
  }, [selectedCharacter, animateTransition]);

  const handleStep2Back = useCallback(() => {
    animateTransition(() => setCurrentStep(1));
  }, [animateTransition]);

  /* ── Step 3 handlers ── */
  const handleActivate = useCallback(() => {
    if (!assistantName.trim() || !selectedCharacter) return;

    const config: AssistantConfig = {
      isActive: true,
      name: assistantName.trim(),
      character: selectedCharacter,
      outfit: selectedOutfit,
      channelNiche,
      targetAudience,
      channelStyle,
      channelGoals,
      longTermVision: '',
      createdAt: Date.now(),
    };

    setAssistantConfig(config);
    addAssistantMessage({
      id: `msg-${Date.now()}`,
      content: `Hey! I'm ${assistantName.trim()}, your personal channel assistant. I'll be watching your channel's performance and guiding you to the right tools at the perfect time. Let's grow together!`,
      timestamp: Date.now(),
      dismissed: false,
    });
    setPage('app');
  }, [assistantName, selectedCharacter, selectedOutfit, channelNiche, targetAudience, channelStyle, channelGoals, setAssistantConfig, addAssistantMessage, setPage]);

  const handleStep3Back = useCallback(() => {
    animateTransition(() => setCurrentStep(2));
  }, [animateTransition]);

  /* ── Get character color ── */
  const characterColor = selectedCharacter
    ? CHARACTER_CARDS.find((c) => c.id === selectedCharacter)?.color ?? '#8B5CF6'
    : '#8B5CF6';

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[5px] bg-[#FDBA2D] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M10 6L18 12L10 18V6Z" fill="white"/>
              <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="text-base font-black tracking-[2px] uppercase">
            NY<span className="text-[#FDBA2D]">CHIQ</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Step progress */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;
              return (
                <React.Fragment key={stepNum}>
                  {i > 0 && (
                    <div
                      className={`w-4 sm:w-6 h-px transition-colors ${
                        isCompleted ? 'bg-[#8B5CF6]' : 'bg-[#1F1F1F]'
                      }`}
                    />
                  )}
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isActive
                          ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[rgba(139,92,246,0.3)]'
                          : isCompleted
                            ? 'bg-[rgba(139,92,246,0.15)] text-[#8B5CF6]'
                            : 'bg-[#1F1F1F] text-[#555] border border-[#2A2A2A]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : stepNum}
                    </div>
                    <span
                      className={`text-[9px] font-medium hidden sm:block ${
                        isActive ? 'text-[#8B5CF6]' : 'text-[#444]'
                      }`}
                    >
                      {stepLabels[i]}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <span className="text-[10px] text-[#444] font-mono">{currentStep} of {totalSteps}</span>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="max-w-lg w-full">
          {/* ─────────────── STEP 1: Channel Questions ─────────────── */}
          {currentStep === 1 && (
            <div className="animate-fade-in-up">
              {currentQuestion && (
                <div key={`${questionIndex}-${isAnimating}`} className="animate-fade-in-up">
                  {/* Question progress */}
                  <div className="flex items-center justify-center gap-1.5 mb-8">
                    {questions.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i === questionIndex
                            ? 'w-8 bg-[#8B5CF6]'
                            : i < questionIndex
                              ? 'w-4 bg-[rgba(139,92,246,0.4)]'
                              : 'w-4 bg-[#1F1F1F]'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-3">
                      {currentQuestion.title}
                    </h2>
                    <p className="text-sm text-[#666] max-w-sm mx-auto">
                      {currentQuestion.subtitle}
                    </p>
                  </div>

                  {/* Options or text input */}
                  {currentQuestion.type === 'options' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {currentQuestion.options.map((opt: string) => {
                        const isSelected = currentQuestion.value === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleOptionSelect(opt)}
                            className={`relative flex items-center justify-center px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                              isSelected
                                ? 'bg-[rgba(139,92,246,0.08)] border-[#8B5CF6] shadow-lg shadow-[rgba(139,92,246,0.08)]'
                                : 'bg-[#0D0D0D] border-[#1F1F1F] hover:border-[#333] hover:bg-[#141414]'
                            }`}
                          >
                            <span
                              className={`text-sm font-medium transition-colors ${
                                isSelected ? 'text-[#8B5CF6]' : 'text-[#888] group-hover:text-[#FFFFFF]'
                              }`}
                            >
                              {opt}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'text' && (
                    <div className="mx-auto max-w-md">
                      <div className="glow-ring-input glow-ring-active">
                        <div className="glow-ring-inner flex items-center px-4 py-3">
                          <textarea
                            value={channelGoals}
                            onChange={(e) => setChannelGoals(e.target.value)}
                            placeholder={currentQuestion.placeholder}
                            rows={3}
                            className="flex-1 resize-none bg-transparent text-sm text-[#FFFFFF] placeholder:text-[#555] focus:outline-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between">
                    <button
                      onClick={handlePrevQuestion}
                      className={`flex items-center gap-1.5 text-sm text-[#555] hover:text-[#888] transition-colors ${
                        questionIndex === 0 ? 'invisible' : ''
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>

                    <Button
                      className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED] font-semibold h-11 px-6 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[rgba(139,92,246,0.15)]"
                      onClick={handleNextQuestion}
                      disabled={!isQuestionAnswered}
                    >
                      {isLastQuestion ? 'Next Step' : 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────── STEP 2: Character Selection ─────────────── */}
          {currentStep === 2 && (
            <div className="animate-fade-in-up">
              {/* Title */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-3">
                  Choose your assistant&apos;s look
                </h2>
                <p className="text-sm text-[#666] max-w-sm mx-auto">
                  Pick a character that matches your channel vibe. You can always change this later.
                </p>
              </div>

              {/* Character grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {CHARACTER_CARDS.map((char) => {
                  const isSelected = selectedCharacter === char.id;
                  return (
                    <button
                      key={char.id}
                      onClick={() => handleCharacterSelect(char.id)}
                      className={`relative flex flex-col items-center gap-3 p-5 sm:p-6 rounded-xl border transition-all duration-300 cursor-pointer group ${
                        isSelected
                          ? 'bg-[rgba(139,92,246,0.06)] border-[#8B5CF6] shadow-lg shadow-[rgba(139,92,246,0.12)]'
                          : 'bg-[#0D0D0D] border-[#1F1F1F] hover:border-[#333] hover:bg-[#141414]'
                      }`}
                    >
                      {/* Glow effect on selected */}
                      {isSelected && (
                        <div className="absolute inset-0 rounded-xl bg-[rgba(139,92,246,0.04)]" />
                      )}

                      {/* Character SVG */}
                      <div
                        className={`relative transition-transform duration-200 ${
                          isSelected ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                      >
                        <CharacterIcon
                          character={char.id}
                          color={isSelected ? '#8B5CF6' : '#666'}
                          size={64}
                        />
                      </div>

                      {/* Label */}
                      <span
                        className={`text-sm font-medium transition-colors relative ${
                          isSelected ? 'text-[#8B5CF6]' : 'text-[#888] group-hover:text-[#FFFFFF]'
                        }`}
                      >
                        {char.label}
                      </span>

                      {/* Selected check */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Outfit selection */}
              <div className="mb-8">
                <p className="text-xs text-[#555] font-medium uppercase tracking-wider mb-3 text-center">
                  Choose an outfit style
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {OUTFIT_OPTIONS.map((outfit) => {
                    const isSelected = selectedOutfit === outfit.id;
                    return (
                      <button
                        key={outfit.id}
                        onClick={() => setSelectedOutfit(outfit.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-[rgba(139,92,246,0.1)] border-[#8B5CF6] text-[#8B5CF6]'
                            : 'bg-[#0D0D0D] border-[#1F1F1F] text-[#888] hover:border-[#333] hover:text-[#FFFFFF]'
                        }`}
                      >
                        <span>{outfit.icon}</span>
                        <span className="font-medium">{outfit.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleStep2Back}
                  className="flex items-center gap-1.5 text-sm text-[#555] hover:text-[#888] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <Button
                  className="bg-[#8B5CF6] text-white hover:bg-[#7C3AED] font-semibold h-11 px-6 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[rgba(139,92,246,0.15)]"
                  onClick={handleStep2Next}
                  disabled={!selectedCharacter}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ─────────────── STEP 3: Name Your Assistant ─────────────── */}
          {currentStep === 3 && (
            <div className="animate-fade-in-up">
              {/* Title */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-3">
                  Give your assistant a name
                </h2>
                <p className="text-sm text-[#666] max-w-sm mx-auto">
                  Something memorable that fits your channel&apos;s personality.
                </p>
              </div>

              {/* Name input with glow ring */}
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-md">
                  <div className="glow-ring-input glow-ring-active">
                    <div className="glow-ring-inner flex items-center px-5 py-4">
                      <Sparkles className="w-5 h-5 text-[#8B5CF6] mr-3 shrink-0" />
                      <input
                        type="text"
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && assistantName.trim() && selectedCharacter) {
                            handleActivate();
                          }
                        }}
                        placeholder="e.g., Ninja, Coach, Sidekick..."
                        className="flex-1 bg-transparent text-lg font-semibold text-[#FFFFFF] placeholder:text-[#444] placeholder:font-normal focus:outline-none"
                        maxLength={24}
                        autoFocus
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#444] text-center mt-2">
                    {assistantName.length}/24 characters
                  </p>
                </div>
              </div>

              {/* Preview card */}
              {selectedCharacter && (
                <div className="flex justify-center mb-8">
                  <div className="w-full max-w-xs bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-6 text-center">
                    {/* Character avatar */}
                    <div
                      className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{
                        backgroundColor: `${characterColor}10`,
                        border: `1px solid ${characterColor}25`,
                      }}
                    >
                      <CharacterIcon
                        character={selectedCharacter}
                        color={characterColor}
                        size={52}
                      />
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-bold text-[#FFFFFF] mb-1">
                      {assistantName.trim() || 'Your Assistant'}
                    </h3>

                    {/* Channel context */}
                    <p className="text-xs text-[#666] mb-4">
                      {channelData?.channelName
                        ? `Assistant for ${channelData.channelName}`
                        : 'Your personal channel assistant'}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {channelNiche && (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.08)] text-[#8B5CF6] border border-[rgba(139,92,246,0.15)]">
                          {channelNiche}
                        </span>
                      )}
                      {targetAudience && (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[rgba(253,186,45,0.08)] text-[#FDBA2D] border border-[rgba(253,186,45,0.15)]">
                          {targetAudience}
                        </span>
                      )}
                      {channelStyle && (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.08)] text-[#10B981] border border-[rgba(16,185,129,0.15)]">
                          {channelStyle}
                        </span>
                      )}
                    </div>

                    {/* Outfit badge */}
                    <div className="mt-3 pt-3 border-t border-[#1F1F1F]">
                      <span className="text-[10px] text-[#555]">
                        {selectedOutfit.charAt(0).toUpperCase() + selectedOutfit.slice(1)} style · {CHARACTER_CARDS.find(c => c.id === selectedCharacter)?.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleStep3Back}
                  className="flex items-center gap-1.5 text-sm text-[#555] hover:text-[#888] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <Button
                  className="bg-gradient-to-r from-[#FDBA2D] to-[#FFD700] text-black hover:from-[#C69320] hover:to-[#F5C800] font-bold h-12 px-8 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[rgba(253,186,45,0.2)] text-base"
                  onClick={handleActivate}
                  disabled={!assistantName.trim() || !selectedCharacter}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Activate Assistant
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
