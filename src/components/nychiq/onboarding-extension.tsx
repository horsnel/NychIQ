'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Download,
  Globe,
  Settings,
  Check,
  Coins,
  PartyPopper,
  Bot,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNychIQStore } from '@/lib/store';

/* ── Install steps ── */
const STEPS = [
  {
    num: '1',
    title: 'Add to Chrome',
    desc: 'Click the install button below to add NychIQ to your Chrome browser from the Chrome Web Store.',
    icon: Download,
    color: '#888888',
  },
  {
    num: '2',
    title: 'Pin the Extension',
    desc: 'After installing, click the puzzle icon in Chrome and pin NychIQ to your toolbar for easy access.',
    icon: Settings,
    color: '#FDBA2D',
  },
  {
    num: '3',
    title: 'Browse YouTube',
    desc: 'Visit any YouTube video or channel page and NychIQ will automatically show real-time insights.',
    icon: Globe,
    color: '#888888',
  },
];

/* ── Next-steps roadmap (shown after extension install) ── */
const SETUP_STEPS = [
  {
    num: '1',
    title: 'Customize Your AI Assistant',
    desc: 'Set brand voice, audience goals & content strategy',
    icon: Bot,
    color: '#FDBA2D',
  },
  {
    num: '2',
    title: 'Saku AI Welcome',
    desc: 'Get your first personalized intelligence briefing',
    icon: Sparkles,
    color: '#888888',
  },
  {
    num: '3',
    title: 'Channel Intelligence',
    desc: 'View real audit data & activate your assistant',
    icon: BarChart3,
    color: '#888888',
  },
];

export function OnboardingExtension() {
  const { completeOnboarding, setPage, setActiveTool } = useNychIQStore();
  const [showChannelPopup, setShowChannelPopup] = useState(false);
  const [extensionClicked, setExtensionClicked] = useState(false);

  const handleInstallExtension = () => {
    // Open the extension popup in a new tab (simulates extension experience)
    window.open('/extension/popup.html', '_blank');
    setExtensionClicked(true);
  };

  const handleContinueToSetup = () => {
    /* Mark extension installed so Saku knows to show welcome */
    localStorage.setItem('nychiq_extension_installed', 'true');
    completeOnboarding();
    setActiveTool('channel-assistant');
    setPage('app');
  };

  const handleGoToDashboard = () => {
    setShowChannelPopup(true);
  };

  const handleSkipExtension = () => {
    setShowChannelPopup(true);
  };

  const handleCustomizeNow = () => {
    completeOnboarding();
    setActiveTool('channel-assistant');
    setPage('app');
  };

  const handleSkipPopup = () => {
    completeOnboarding();
  };

  /* Post-install roadmap section */
  const postInstallRoadmap = extensionClicked && (
    <div className="animate-fade-in-up space-y-3">
      <div className="rounded-xl bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#a0a0a0] mb-3">What comes next</p>
        <div className="space-y-2.5">
          {SETUP_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <div key={step.num} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: step.color + '15' }}
                >
                  <StepIcon className="w-3.5 h-3.5" style={{ color: step.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#FFFFFF]">{step.title}</p>
                  <p className="text-[10px] text-[#666666]">{step.desc}</p>
                </div>
                {idx < SETUP_STEPS.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-[#666666] shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button
        className="w-full bg-[#FDBA2D] text-black hover:bg-[#C69320] h-11 font-semibold shadow-lg shadow-[rgba(253,186,45,0.12)]"
        onClick={handleContinueToSetup}
      >
        Continue to Setup
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  /* Pre-install actions */
  const preInstallActions = !extensionClicked && (
    <>
      <Button
        className="w-full bg-[#FDBA2D] text-black hover:bg-[#C69320] h-11 font-semibold shadow-lg shadow-[rgba(253,186,45,0.12)]"
        onClick={handleGoToDashboard}
      >
        Go to Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <button
        onClick={handleSkipExtension}
        className="block text-xs text-[#666666] hover:text-[#a0a0a0] transition-colors mx-auto"
      >
        Skip extension, start using NychIQ &#x2192;
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#0f0f0f]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[3px] bg-[#FDBA2D] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M10 6L18 12L10 18V6Z" fill="white" />
              <rect x="5" y="5" width="2.5" height="14" rx="1" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-black tracking-[1.5px] uppercase">NY<span className="text-[#FDBA2D]">CHIQ</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= 2 ? 'bg-[#FDBA2D]' : 'bg-[#0f0f0f]'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-[#666666] font-mono">3 of 3</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mx-auto mb-6">
              <Download className="w-8 h-8 text-[#888888]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] mb-2">
              Install NychIQ Extension
            </h2>
            <p className="text-sm text-[#666] max-w-sm mx-auto">
              Get instant insights on any YouTube page. It&apos;s optional but highly recommended.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.num}
                  className="flex items-start gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: step.color + '15' }}
                    >
                      <StepIcon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                      style={{ backgroundColor: step.color }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#FFFFFF] mb-1">{step.title}</h3>
                    <p className="text-xs text-[#666] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bonus pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(253,186,45,0.08)] border border-[rgba(255,255,255,0.06)]">
              <Coins className="w-4 h-4 text-[#FDBA2D]" />
              <span className="text-xs font-semibold text-[#FDBA2D]">+10 daily tokens with extension installed</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 max-w-xs mx-auto">
            <Button
              className={[
                'w-full h-11 font-semibold shadow-lg transition-all',
                extensionClicked
                  ? 'bg-[#888888] text-white shadow-[rgba(0,0,0,0.3)]'
                  : 'bg-[#888888] text-white hover:bg-[#3A8AEF] shadow-[rgba(0,0,0,0.3)]',
              ].join(' ')}
              onClick={handleInstallExtension}
            >
              {extensionClicked ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Extension Opened
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Open Extension Preview
                </>
              )}
            </Button>

            {postInstallRoadmap}
            {preInstallActions}
          </div>
        </div>
      </div>

      {/* Channel Assistant Popup */}
      {showChannelPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 sm:p-8 animate-fade-in-up shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                  <PartyPopper className="w-8 h-8 text-[#FDBA2D]" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FDBA2D] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-black" />
                </div>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mb-2 text-center">
              Personalize Your AI Assistant
            </h2>
            <p className="text-sm text-[#a0a0a0] text-center mb-8 leading-relaxed">
              Customize your Channel Assistant with your brand voice, audience goals, and content strategy. It&apos;s free for all plans!
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['Brand Voice', 'Audience Goals', 'Content Strategy', 'Niche Targeting'].map((feature) => (
                <span
                  key={feature}
                  className="text-[10px] font-medium px-3 py-1.5 rounded-full bg-[rgba(253,186,45,0.08)] text-[#FDBA2D] border border-[rgba(255,255,255,0.06)]"
                >
                  {feature}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              <Button
                className="w-full bg-[#FDBA2D] text-black hover:bg-[#C69320] h-11 font-semibold shadow-lg shadow-[rgba(253,186,45,0.12)]"
                onClick={handleCustomizeNow}
              >
                Customize Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button
                onClick={handleSkipPopup}
                className="block w-full text-center text-xs text-[#555] hover:text-[#a0a0a0] transition-colors py-2"
              >
                Skip, Go to Dashboard &#x2192;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
