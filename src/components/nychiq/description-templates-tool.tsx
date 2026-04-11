'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  FileText,
  Copy,
  Bookmark,
  Hash,
  CheckCircle,
  Sparkles,
  ChevronDown,
  Lightbulb,
  Type,
  AlignLeft,
} from 'lucide-react';

type Category = 'Tutorial' | 'Vlog' | 'Review' | 'How-To' | 'Listicle';

interface TemplateSection {
  label: string;
  content: string;
}

const CATEGORIES: Category[] = ['Tutorial', 'Vlog', 'Review', 'How-To', 'Listicle'];

const MOCK_TEMPLATES: Record<Category, { sections: TemplateSection[]; timestamps: string[] }> = {
  Tutorial: {
    sections: [
      { label: 'Hook', content: '🎯 Learn [SKILL] in just [TIME] — even if you\'re a complete beginner! No fluff, no filler, just actionable steps.' },
      { label: 'Summary', content: 'In this video, I\'ll walk you through everything you need to know about [TOPIC]. From setup to advanced techniques, we cover it all step by step.' },
      { label: 'Prerequisites', content: '📌 What you\'ll need:\n• [TOOL 1] — [link in description]\n• [TOOL 2] — [link in description]\n• Basic understanding of [RELATED CONCEPT]' },
      { label: 'CTA', content: '🔔 Subscribe for more [NICHE] tutorials!\n💬 Drop a comment telling me what you want to learn next.\n👍 Like this video if it helped you!' },
    ],
    timestamps: [
      '0:00 - Introduction & What You\'ll Learn',
      '0:45 - Prerequisites & Setup',
      '2:00 - Step 1: [FIRST STEP]',
      '5:30 - Step 2: [SECOND STEP]',
      '8:15 - Step 3: [THIRD STEP]',
      '11:00 - Pro Tips & Common Mistakes',
      '13:30 - Final Result & Wrap-up',
    ],
  },
  Vlog: {
    sections: [
      { label: 'Hook', content: '🎬 [EMOTIONAL HOOK] — This is what happened when I tried [EXPERIENCE] for the first time... and you won\'t believe the result!' },
      { label: 'Context', content: 'So today I\'m [ACTIVITY] in [LOCATION]. I\'ve been wanting to do this for [TIME] and it\'s finally happening. Come along for the ride!' },
      { label: 'Highlights', content: '✨ Moments you don\'t want to miss:\n• [HIGHLIGHT 1] — [TIMESTAMP]\n• [HIGHLIGHT 2] — [TIMESTAMP]\n• [HIGHLIGHT 3] — [TIMESTAMP]' },
      { label: 'CTA', content: '🎥 Watch [PREVIOUS VLOG]: [LINK]\n📱 Follow me on [SOCIAL]: [LINK]\n📧 Business inquiries: [EMAIL]' },
    ],
    timestamps: [
      '0:00 - Coming to you from...',
      '1:30 - The journey begins',
      '4:00 - First surprise',
      '7:30 - The main event',
      '10:00 - Plot twist',
      '12:30 - Reflections & takeaways',
    ],
  },
  Review: {
    sections: [
      { label: 'Hook', content: '⭐ Is [PRODUCT] worth it in 2025? After [TIME] of daily use, here\'s my honest review — the good, the bad, and the ugly.' },
      { label: 'Overview', content: '📋 Quick Specs:\n• Price: $[PRICE]\n• What\'s included: [ITEMS]\n• Best for: [TARGET AUDIENCE]\n• My rating: ⭐ [X]/5' },
      { label: 'Pros & Cons', content: '✅ Pros:\n• [PRO 1]\n• [PRO 2]\n• [PRO 3]\n\n❌ Cons:\n• [CON 1]\n• [CON 2]' },
      { label: 'CTA', content: '🛒 Get [PRODUCT] here: [AFFILIATE LINK]\n💰 Use code [CODE] for [DISCOUNT]% off!\n\nWas this helpful? Smash that like button!' },
    ],
    timestamps: [
      '0:00 - Should you buy this?',
      '1:15 - Unboxing & First Impressions',
      '3:30 - Features walkthrough',
      '6:00 - Real-world testing',
      '9:00 - Pros & Cons',
      '10:30 - Final verdict & rating',
    ],
  },
  'How-To': {
    sections: [
      { label: 'Hook', content: '🔧 Want to [ACHIEVE GOAL]? In this step-by-step guide, I\'ll show you exactly how to do it — no experience required!' },
      { label: 'Materials', content: '📦 What you need:\n1. [ITEM 1] — ~$[PRICE]\n2. [ITEM 2] — ~$[PRICE]\n3. [ITEM 3] (optional but recommended)' },
      { label: 'Steps', content: '📝 The process:\nStep 1: [ACTION] — Take your [ITEM] and [VERB]\nStep 2: [ACTION] — [DETAIL]\nStep 3: [ACTION] — [DETAIL]\nStep 4: [ACTION] — [FINAL TOUCHES]' },
      { label: 'CTA', content: '🔄 Save this for later! You\'ll thank me.\n📌 Pin this comment if it helped: [QUESTION]\n🔔 Subscribe — I post [FREQUENCY]' },
    ],
    timestamps: [
      '0:00 - Before & After Preview',
      '1:00 - Everything you need',
      '2:30 - Step-by-step walkthrough',
      '7:00 - Troubleshooting common issues',
      '9:00 - Before & After comparison',
      '10:00 - Bonus tips',
    ],
  },
  Listicle: {
    sections: [
      { label: 'Hook', content: '🔥 Top [NUMBER] [TOPIC] that will [BENEFIT] in 2025. I tested all of them so you don\'t have to. Number [SURPRISE] will shock you!' },
      { label: 'Overview', content: 'Here are the [NUMBER] [TOPIC] I\'ll be covering:\n[NUMBER]. [ITEM 1]\n[NUMBER]. [ITEM 2]\n[NUMBER]. [ITEM 3]\n...and more!' },
      { label: 'Details', content: '📊 Ranking criteria:\n• [CRITERION 1] (40%)\n• [CRITERION 2] (30%)\n• [CRITERION 3] (30%)\n\nFull methodology linked below.' },
      { label: 'CTA', content: '🔗 Links to everything mentioned: [LIST]\n\n💬 Which one is YOUR favorite? Let me know below!\n🔔 Subscribe — [NUMBER] videos every [TIMEFRAME]' },
    ],
    timestamps: [
      '0:00 - Quick overview',
      '0:30 - Honorable mentions',
      '1:15 - #[NUMBER] - [ITEM]',
      '3:00 - #[NUMBER] - [ITEM]',
      '4:30 - #[NUMBER] - [ITEM]',
      '6:00 - #[NUMBER] - [ITEM]',
      '8:00 - The #1 pick',
    ],
  },
};

const MOCK_HASHTAGS = ['#youtube', '#tutorial', '#howto', '#tips', '#guide', '#2025', '#viral', '#trending', '#subscribe', '#growth'];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckCircle className="w-3.5 h-3.5 text-[#00C48C]" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-[#666666]" />
      )}
    </button>
  );
}

export function DescriptionTemplatesTool() {
  const { spendTokens } = useNychIQStore();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<Category>('Tutorial');
  const [generated, setGenerated] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const template = MOCK_TEMPLATES[category];
  const charCount = template.sections.reduce((s, sec) => s + sec.content.length, 0) + template.timestamps.join('\n').length;
  const fullDescription = template.sections.map((s) => s.content).join('\n\n') + '\n\n📌 Timestamps:\n' + template.timestamps.join('\n');

  const handleGenerate = () => {
    spendTokens('description-templates');
    setGenerated(true);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
                <FileText className="w-5 h-5 text-[#F5A623]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E8E8E8]">Description Templates</h2>
                <p className="text-xs text-[#888888] mt-0.5">Generate SEO-optimized descriptions instantly</p>
              </div>
            </div>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 rounded-lg border border-[#222222] hover:bg-[#1A1A1A] transition-colors"
            >
              <AlignLeft className="w-4 h-4 text-[#888888]" />
            </button>
          </div>

          {/* Topic Input */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 block">Video Title / Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., How to Grow on YouTube in 2025"
                className="w-full bg-[#0A0A0A] border border-[#222222] rounded-lg px-3 py-2.5 text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#F5A623]/50 transition-colors"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-medium text-[#888888] mb-1.5 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setGenerated(false); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      category === cat
                        ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                        : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#E8E8E8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate Template
            </button>
          </div>
        </div>
      </div>

      {/* Main Content + SEO Sidebar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Template Preview */}
        <div className={`flex-1 ${showSidebar ? 'md:order-1' : ''}`}>
          <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#F5A623]" />
                <span className="text-sm font-semibold text-[#E8E8E8]">{category} Template</span>
              </div>
              <CopyButton text={generated ? fullDescription : ''} />
            </div>

            {generated ? (
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {template.sections.map((section, i) => (
                  <div key={i} className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-[#F5A623] uppercase tracking-wider">{section.label}</span>
                      <CopyButton text={section.content} />
                    </div>
                    <pre className="text-xs text-[#CCCCCC] whitespace-pre-wrap font-sans leading-relaxed">{section.content}</pre>
                  </div>
                ))}

                {/* Timestamps */}
                <div className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-[#4A9EFF] uppercase tracking-wider">📌 Timestamps</span>
                    <CopyButton text={template.timestamps.join('\n')} />
                  </div>
                  <div className="space-y-1">
                    {template.timestamps.map((ts, i) => (
                      <p key={i} className="text-xs text-[#CCCCCC]">{ts}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Type className="w-8 h-8 text-[#333333] mx-auto mb-2" />
                <p className="text-sm text-[#555555]">Enter a topic and generate your template</p>
              </div>
            )}
          </div>
        </div>

        {/* SEO Sidebar */}
        <div className={`w-full md:w-64 shrink-0 ${showSidebar ? 'md:order-2' : 'hidden md:block'}`}>
          <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#00C48C]" />
                <span className="text-sm font-semibold text-[#E8E8E8]">SEO Tips</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Character Count */}
              <div>
                <p className="text-[11px] text-[#666666] uppercase tracking-wider mb-1.5">Character Count</p>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-bold ${charCount > 4500 ? 'text-[#E05252]' : charCount > 3500 ? 'text-[#F5A623]' : 'text-[#00C48C]'}`}>{charCount}</span>
                  <span className="text-xs text-[#666666] mb-1">/ 5000</span>
                </div>
                <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      charCount > 4500 ? 'bg-[#E05252]' : charCount > 3500 ? 'bg-[#F5A623]' : 'bg-[#00C48C]'
                    }`}
                    style={{ width: `${Math.min((charCount / 5000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Keyword Density */}
              <div>
                <p className="text-[11px] text-[#666666] uppercase tracking-wider mb-1.5">Keyword Density</p>
                <p className="text-sm font-bold text-[#9B72CF]">2.3%</p>
                <p className="text-[11px] text-[#555555]">Ideal: 1-3%</p>
              </div>

              {/* Hashtag Suggestions */}
              <div>
                <p className="text-[11px] text-[#666666] uppercase tracking-wider mb-1.5">Suggested Hashtags</p>
                <div className="flex flex-wrap gap-1.5">
                  {MOCK_HASHTAGS.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-[11px] text-[#4A9EFF]">
                      <Hash className="w-2.5 h-2.5 inline mr-0.5" />{tag.slice(1)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-lg bg-[#00C48C]/5 border border-[#00C48C]/15 p-3">
                <p className="text-[11px] font-semibold text-[#00C48C] mb-1.5">💡 Pro Tips</p>
                <ul className="text-[11px] text-[#888888] space-y-1.5">
                  <li>• First 2 lines are most important (visible above fold)</li>
                  <li>• Include 3-5 relevant hashtags</li>
                  <li>• Add timestamps for videos &gt;5 min</li>
                  <li>• Link to your social profiles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
