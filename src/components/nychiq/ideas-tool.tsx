'use client';

import React, { useState, useMemo } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import {
  Lightbulb,
  Crown,
  Lock,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Zap,
  Eye,
  Tag,
  AlertTriangle,
  RefreshCw,
  CalendarDays,
  Clock,
  Image as ImageIcon,
  RotateCcw,
  Flame,
  BarChart3,
  ChevronRight,
  Film,
  BookOpen,
  ListChecks,
  Trophy,
  ArrowRightLeft,
  HelpCircle,
} from 'lucide-react';

const CONTENT_TYPES = ['Tutorial', 'Vlog', 'Review', 'Challenge', 'Reaction'];

interface VideoIdea {
  title: string;
  description: string;
  viralScore: number;
  estimatedViews: string;
  contentType: string;
}

/* ── 30-Day Calendar Types ── */
type Frequency = 'daily' | '3x-week' | '2x-week' | 'weekly';
type ViralPotential = 'Low' | 'Medium' | 'High';
type CalendarContentType = 'Tutorial' | 'Reaction' | 'List' | 'Story' | 'Challenge' | 'How-To' | 'Comparison';
type ContentStatus = 'Idea' | 'Planned' | 'Filmed' | 'Uploaded';

interface CalendarEntry {
  day: number;
  date: string;
  title: string;
  hook: string;
  contentType: CalendarContentType;
  viralPotential: ViralPotential;
  postingTime: string;
  thumbnailConcept: string;
  status: ContentStatus;
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string; days: number[] }[] = [
  { value: 'daily', label: 'Daily', days: [0, 1, 2, 3, 4, 5, 6] },
  { value: '3x-week', label: '3x/Week', days: [0, 2, 4] },
  { value: '2x-week', label: '2x/Week', days: [1, 4] },
  { value: 'weekly', label: 'Weekly', days: [3] },
];

const CONTENT_TYPE_COLORS: Record<CalendarContentType, { color: string; bg: string; border: string }> = {
  Tutorial: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  Reaction: { color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.25)' },
  List: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
  Story: { color: '#EC4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)' },
  Challenge: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  'How-To': { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  Comparison: { color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)' },
};

const VIRAL_COLORS: Record<ViralPotential, { color: string; bg: string; border: string }> = {
  Low: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  Medium: { color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.25)' },
  High: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
};

const STATUS_CONFIG: Record<ContentStatus, { color: string; bg: string; border: string }> = {
  Idea: { color: '#A3A3A3', bg: 'rgba(163,163,163,0.1)', border: 'rgba(163,163,163,0.25)' },
  Planned: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  Filmed: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
  Uploaded: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
};

const POSTING_TIMES = ['2:00 PM WAT', '4:00 PM WAT', '6:00 PM WAT', '12:00 PM WAT', '8:00 PM WAT', '10:00 AM WAT', '3:00 PM WAT'];

const MOCK_TITLES: Record<CalendarContentType, string[]> = {
  Tutorial: [
    'How to Master {niche} in 7 Days',
    '{niche} Tutorial Nobody Tells You',
    'The Complete {niche} Guide for Beginners',
    '5 {niche} Mistakes You\'re Making Right Now',
  ],
  Reaction: [
    'I Tried the Viral {niche} Trend',
    'Reacting to {niche} Content Gone Wrong',
    'This {niche} Hack Changed Everything',
    'Rating {niche} Tips from Random People',
  ],
  List: [
    'Top 10 {niche} Tips That Actually Work',
    '7 {niche} Secrets the Pros Won\'t Share',
    '15 {niche} Facts That Will Blow Your Mind',
    'The 5 Best {niche} Tools in 2025',
  ],
  Story: [
    'How I Made $10K with {niche}',
    'My {niche} Journey: From Zero to Hero',
    'The Day {niche} Changed My Life Forever',
    'What Nobody Told Me About {niche}',
  ],
  Challenge: [
    '30-Day {niche} Challenge — Day 1',
    'Can I Survive 24 Hours of {niche}?',
    '{niche} Challenge: Impossible Edition',
    'Trying Every {niche} Hack for 7 Days',
  ],
  'How-To': [
    'How to Start {niche} with Zero Budget',
    'How I Grew My {niche} Channel Fast',
    'How to Get Your First {niche} Client',
    'How to Monetize {niche} Content',
  ],
  Comparison: [
    '{niche} Free vs Paid — Which is Better?',
    'Comparing the Top 5 {niche} Platforms',
    '{niche}: Old Method vs New Method',
    'Cheap vs Expensive {niche} Equipment',
  ],
};

const MOCK_HOOKS: Record<CalendarContentType, string[]> = {
  Tutorial: ['"In the next 7 days, you\'ll go from complete beginner to..."', '"Stop scrolling — this is the only tutorial you\'ll ever need."', '"I wasted 2 years before I learned this..."'],
  Reaction: ['"I can\'t believe this actually works..."', '"Wait, did that just happen?"', '"This is either genius or completely insane."'],
  List: ['"Number 3 will literally save you thousands..."', '"I tested all 10 so you don\'t have to."', '"By the end of this list, you\'ll be ahead of 99%..."'],
  Story: ['"3 months ago I was completely broke..."', '"Nobody believed me when I said I\'d..."', '"This is the story I\'ve been afraid to tell."'],
  Challenge: ['"What happens when I try this for 30 days straight?"', '"I genuinely think I might fail this..."', '"Rules are simple. Survive 24 hours. Go."'],
  'How-To': ['"Here\'s the exact blueprint I followed..."', '"No one is talking about this method..."', '"Copy this step-by-step and thank me later."'],
  Comparison: ['"I spent $2000 so you don\'t have to..."', '"One of these is a total waste of money..."', '"The results shocked even me..."'],
};

const THUMBNAIL_CONCEPTS = [
  'Split face shock', 'Big red arrow', 'Before/After glow', 'Money stack overlay',
  'Pointing finger', 'Confused face', 'Green checkmark burst', 'Neon text pop',
  'Fire emoji border', 'Dramatic shadow', 'Question mark bold', 'Trophy gold shine',
  'Explosion background', 'Crying vs happy', 'Number circle highlight', 'Gradient text bold',
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#A3A3A3] hover:text-[#FFFFFF]" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function viralColor(score: number) {
  if (score >= 80) return { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' };
  if (score >= 60) return { color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)', border: 'rgba(253,186,45,0.3)' };
  if (score >= 40) return { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' };
  return { color: '#A3A3A3', bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.3)' };
}

/* ── Helper to generate mock calendar entries ── */
function generateMockCalendar(niche: string): CalendarEntry[] {
  const types: CalendarContentType[] = ['Tutorial', 'Reaction', 'List', 'Story', 'Challenge', 'How-To', 'Comparison'];
  const potentials: ViralPotential[] = ['Low', 'Medium', 'High'];
  const statuses: ContentStatus[] = ['Idea', 'Planned', 'Filmed', 'Uploaded'];
  const entries: CalendarEntry[] = [];

  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const ct = types[i % types.length];
    const titles = MOCK_TITLES[ct];
    const hooks = MOCK_HOOKS[ct];
    entries.push({
      day: i + 1,
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      title: titles[i % titles.length].replace(/\{niche\}/g, niche || 'Content'),
      hook: hooks[i % hooks.length],
      contentType: ct,
      viralPotential: potentials[Math.floor(Math.random() * 3)],
      postingTime: POSTING_TIMES[i % POSTING_TIMES.length],
      thumbnailConcept: THUMBNAIL_CONCEPTS[i % THUMBNAIL_CONCEPTS.length],
      status: i < 5 ? 'Idea' : statuses[Math.floor(Math.random() * statuses.length)],
    });
  }
  return entries;
}

/* ── Content type icon helper ── */
function ContentTypeIcon({ type }: { type: CalendarContentType }) {
  switch (type) {
    case 'Tutorial': return <BookOpen className="w-3 h-3" />;
    case 'Reaction': return <Zap className="w-3 h-3" />;
    case 'List': return <ListChecks className="w-3 h-3" />;
    case 'Story': return <Film className="w-3 h-3" />;
    case 'Challenge': return <Trophy className="w-3 h-3" />;
    case 'How-To': return <HelpCircle className="w-3 h-3" />;
    case 'Comparison': return <ArrowRightLeft className="w-3 h-3" />;
  }
}

/* ── Tab component ── */
function ToolTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
        active
          ? 'text-[#FDBA2D] border-[#FDBA2D] bg-[#141414]'
          : 'text-[#A3A3A3] border-transparent hover:text-[#FFFFFF] hover:bg-[#141414]/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ── 30-Day Calendar Tab Content ── */
function CalendarTab() {
  const { spendTokens } = useNychIQStore();
  const [niche, setNiche] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    const ok = spendTokens('ideas');
    if (!ok) { setLoading(false); return; }
    setGenerated(true);

    // Generate mock data (AI integration can be added later)
    await new Promise((r) => setTimeout(r, 800));
    setEntries(generateMockCalendar(niche.trim()));
    setLoading(false);
  };

  const handleRegenerateWeek = (weekIndex: number) => {
    setEntries((prev) => {
      const updated = [...prev];
      const start = weekIndex * 7;
      const end = Math.min(start + 7, 30);
      const types: CalendarContentType[] = ['Tutorial', 'Reaction', 'List', 'Story', 'Challenge', 'How-To', 'Comparison'];
      const potentials: ViralPotential[] = ['Low', 'Medium', 'High'];
      for (let i = start; i < end; i++) {
        const ct = types[Math.floor(Math.random() * types.length)];
        const titles = MOCK_TITLES[ct];
        const hooks = MOCK_HOOKS[ct];
        updated[i] = {
          ...updated[i],
          contentType: ct,
          title: titles[Math.floor(Math.random() * titles.length)].replace(/\{niche\}/g, niche || 'Content'),
          hook: hooks[Math.floor(Math.random() * hooks.length)],
          viralPotential: potentials[Math.floor(Math.random() * 3)],
          thumbnailConcept: THUMBNAIL_CONCEPTS[Math.floor(Math.random() * THUMBNAIL_CONCEPTS.length)],
        };
      }
      return updated;
    });
  };

  const handleStatusChange = (day: number, status: ContentStatus) => {
    setEntries((prev) =>
      prev.map((e) => (e.day === day ? { ...e, status } : e))
    );
  };

  // Summary stats
  const highPotentialCount = entries.filter((e) => e.viralPotential === 'High').length;
  const contentTypeDist = useMemo(() => {
    const dist: Record<string, number> = {};
    entries.forEach((e) => {
      dist[e.contentType] = (dist[e.contentType] || 0) + 1;
    });
    return dist;
  }, [entries]);

  const statusOptions: ContentStatus[] = ['Idea', 'Planned', 'Filmed', 'Uploaded'];
  const maxDistCount = Math.max(...Object.values(contentTypeDist), 1);

  // Group entries by weeks
  const weeks = useMemo(() => {
    const w: CalendarEntry[][] = [];
    for (let i = 0; i < entries.length; i += 7) {
      w.push(entries.slice(i, i + 7));
    }
    return w;
  }, [entries]);

  const activeDays = FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.days ?? [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-5">
      {/* Input bar */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
              <CalendarDays className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">30-Day Content Calendar</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">Plan a full month of viral-ready content with smart scheduling.</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="Enter your niche or topic..."
              className="w-full h-11 px-4 rounded-full bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2 flex-1">
                {FREQUENCY_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFrequency(f.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      frequency === f.value
                        ? 'bg-[#FDBA2D] text-[#0D0D0D]'
                        : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#A3A3A3] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || !niche.trim()}
                className="px-5 h-9 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* Generated calendar */}
      {!loading && generated && entries.length > 0 && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total ideas */}
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-[#FDBA2D]" />
                <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-medium">Total Ideas</span>
              </div>
              <span className="text-2xl font-bold text-[#FFFFFF]">{entries.length}</span>
            </div>

            {/* High potential */}
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-[#10B981]" />
                <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-medium">High Potential</span>
              </div>
              <span className="text-2xl font-bold text-[#10B981]">{highPotentialCount}</span>
            </div>

            {/* Content type distribution */}
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider font-medium">Content Types</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(contentTypeDist)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = (count / entries.length) * 100;
                    const ctColor = CONTENT_TYPE_COLORS[type as CalendarContentType]?.color ?? '#A3A3A3';
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-[10px] text-[#A3A3A3] w-16 truncate">{type}</span>
                        <div className="flex-1 h-2 rounded-full bg-[#0D0D0D] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: ctColor }} />
                        </div>
                        <span className="text-[10px] text-[#666666] w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Calendar entries by week */}
          {weeks.map((weekEntries, weekIndex) => (
            <div key={weekIndex} className="space-y-3">
              {/* Week header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#FDBA2D]" />
                  Week {weekIndex + 1}
                  <span className="text-xs text-[#666666] font-normal">
                    ({weekEntries[0]?.date} — {weekEntries[weekEntries.length - 1]?.date})
                  </span>
                </h3>
                <button
                  onClick={() => handleRegenerateWeek(weekIndex)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-[11px] text-[#A3A3A3] hover:text-[#FDBA2D] hover:border-[#FDBA2D]/30 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Regenerate Week
                </button>
              </div>

              {/* Week entries grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {weekEntries.map((entry) => {
                  const ctStyle = CONTENT_TYPE_COLORS[entry.contentType];
                  const viralStyle = VIRAL_COLORS[entry.viralPotential];
                  const statusStyle = STATUS_CONFIG[entry.status];
                  const dayOfWeek = (entry.day - 1) % 7;
                  const isActiveDay = activeDays.includes(dayOfWeek);

                  return (
                    <div
                      key={entry.day}
                      className={`rounded-lg border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
                        isActiveDay
                          ? 'bg-[#141414] border-[#1F1F1F]'
                          : 'bg-[#0D0D0D] border-[#1A1A1A] opacity-60'
                      }`}
                    >
                      {/* Day header */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#666666]">Day {entry.day}</span>
                          <span className="text-[10px] text-[#555555]">{entry.date}</span>
                        </div>
                        {/* Status dropdown */}
                        <select
                          value={entry.status}
                          onChange={(e) => handleStatusChange(entry.day, e.target.value as ContentStatus)}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border cursor-pointer bg-transparent focus:outline-none"
                          style={{ color: statusStyle.color, borderColor: statusStyle.border, backgroundColor: statusStyle.bg }}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s} className="bg-[#0D0D0D] text-[#FFFFFF]">
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-[#FFFFFF] line-clamp-2 mb-1.5">{entry.title}</h4>

                      {/* Hook */}
                      <p className="text-[11px] text-[#A3A3A3] line-clamp-2 mb-3 italic">{entry.hook}</p>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {/* Content type badge */}
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ color: ctStyle.color, backgroundColor: ctStyle.bg, border: `1px solid ${ctStyle.border}` }}
                        >
                          <ContentTypeIcon type={entry.contentType} />
                          {entry.contentType}
                        </span>

                        {/* Viral potential badge */}
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ color: viralStyle.color, backgroundColor: viralStyle.bg, border: `1px solid ${viralStyle.border}` }}
                        >
                          <Flame className="w-2.5 h-2.5" />
                          {entry.viralPotential}
                        </span>
                      </div>

                      {/* Bottom info */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1 text-[#A3A3A3]">
                          <Clock className="w-3 h-3" />
                          {entry.postingTime}
                        </div>
                        <div className="flex items-center gap-1 text-[#555555]">
                          <ImageIcon className="w-3 h-3" />
                          {entry.thumbnailConcept}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !generated && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-[#FDBA2D]" />
          </div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Plan Your Month</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">Enter your niche and choose a posting frequency to generate a full 30-day content calendar.</p>
        </div>
      )}

      {generated && !loading && (
        <div className="text-center text-[11px] text-[#444444]">
          Cost: {TOKEN_COSTS.ideas} tokens per generation · {niche} · {FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label}
        </div>
      )}
    </div>
  );
}

/* ── Main IdeasTool with tabs ── */
export function IdeasTool() {
  const { spendTokens } = useNychIQStore();
  const [activeTab, setActiveTab] = useState<'ideas' | 'calendar'>('ideas');
  const [niche, setNiche] = useState('');
  const [contentType, setContentType] = useState('Tutorial');
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!niche.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    setRawText(null);
    const ok = spendTokens('ideas');
    if (!ok) { setLoading(false); return; }

    try {
      const prompt = `You are a YouTube content strategist. Generate 10 high-potential video ideas for the niche: "${niche.trim()}" with content type: ${contentType}.

Return a JSON array of 10 ideas. Each idea should have:
- "title": a catchy, click-worthy title
- "description": a brief 1-2 sentence description of what the video covers
- "viralScore": a predicted viral score from 30 to 99
- "estimatedViews": estimated view range like "50K-200K" or "1M-5M"
- "contentType": the content type

Return ONLY the JSON array.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed: { title: string; description: string; viralScore: number; estimatedViews: string; contentType: string }[];
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        setRawText(response);
        setIdeas([]);
        return;
      }
      if (Array.isArray(parsed)) {
        setIdeas(parsed.map((idea) => ({
          title: idea.title || 'Untitled',
          description: idea.description || 'No description',
          viralScore: Math.min(99, Math.max(1, parseInt(String(idea.viralScore), 10) || 50)),
          estimatedViews: idea.estimatedViews || '10K-50K',
          contentType: idea.contentType || contentType,
        })));
      } else {
        setRawText(response);
        setIdeas([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas. Please try again.');
      setIdeas([]);
      setRawText(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Tab bar */}
      <div className="flex border-b border-[#1A1A1A]">
        <ToolTab active={activeTab === 'ideas'} onClick={() => setActiveTab('ideas')} icon={Lightbulb} label="Video Ideas" />
        <ToolTab active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={CalendarDays} label="30-Day Calendar" />
      </div>

      {/* Tab 1: Video Ideas (original content) */}
      {activeTab === 'ideas' && (
        <>
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]"><Lightbulb className="w-5 h-5 text-[#FDBA2D]" /></div>
                <div>
                  <h2 className="text-base font-bold text-[#FFFFFF]">Video Ideas</h2>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">10 high-potential ideas based on your niche, with viral score prediction.</p>
                </div>
              </div>
              <div className="space-y-3">
                <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                  placeholder="Enter your niche or topic..."
                  className="w-full h-11 px-4 rounded-full bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex flex-wrap gap-2 flex-1">
                    {CONTENT_TYPES.map((t) => (
                      <button key={t} onClick={() => setContentType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${contentType === t ? 'bg-[#FDBA2D] text-[#0D0D0D]' : 'bg-[#0D0D0D] border border-[#1A1A1A] text-[#A3A3A3] hover:text-[#FFFFFF]'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleGenerate} disabled={loading || !niche.trim()} className="px-5 h-9 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Ideas
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-lg bg-[#141414] border border-[#EF4444]/30 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-3" />
              <p className="text-sm text-[#FFFFFF] mb-4">{error}</p>
              <button onClick={handleGenerate} className="px-4 py-2 rounded-lg bg-[#EF4444] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
                  <div className="h-4 bg-[#1A1A1A] rounded animate-pulse w-3/4 mb-2" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-full mb-1" />
                  <div className="h-3 bg-[#1A1A1A] rounded animate-pulse w-2/3 mb-3" />
                  <div className="flex gap-2"><div className="h-5 w-12 bg-[#1A1A1A] rounded animate-pulse" /><div className="h-5 w-16 bg-[#1A1A1A] rounded animate-pulse" /></div>
                </div>
              ))}
            </div>
          )}

          {/* Raw Text Fallback */}
          {!loading && rawText && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FDBA2D]" /> Ideas Results (Raw)
              </h3>
              <div className="rounded-lg bg-[#141414] border border-[#FDBA2D]/30 p-4">
                <p className="text-[10px] text-[#FDBA2D] mb-2 font-medium">Could not format the AI response. Showing raw output:</p>
                <pre className="text-sm text-[#FFFFFF] whitespace-pre-wrap leading-relaxed font-sans">{rawText}</pre>
              </div>
            </div>
          )}

          {!loading && ideas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#FDBA2D]" /> {ideas.length} Video Ideas Generated</h3>
                <button onClick={async () => { const text = ideas.map((id, i) => `${i + 1}. ${id.title}\n${id.description}\nViral Score: ${id.viralScore} | Views: ${id.estimatedViews} | Type: ${id.contentType}`).join('\n\n'); await copyToClipboard(text); }}
                  className="flex items-center gap-1 text-xs text-[#A3A3A3] hover:text-[#10B981] transition-colors"><Copy className="w-3 h-3" /> Copy All</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ideas.map((idea, i) => {
                  const vc = viralColor(idea.viralScore);
                  return (
                    <div key={i} className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 hover:border-[#2A2A2A] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold text-[#666666]">#{i + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#A3A3A3] flex items-center gap-1"><Eye className="w-3 h-3" /> {idea.estimatedViews}</span>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ color: vc.color, backgroundColor: vc.bg, border: `1px solid ${vc.border}` }}>
                            {idea.viralScore}
                          </div>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-[#FFFFFF] mb-1.5 line-clamp-2">{idea.title}</h4>
                      <p className="text-xs text-[#A3A3A3] line-clamp-2 mb-3">{idea.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-[#8B5CF6] bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> {idea.contentType}
                        </span>
                        <CopyBtn text={idea.title} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mb-4"><Lightbulb className="w-8 h-8 text-[#FDBA2D]" /></div>
              <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Get Video Ideas</h3>
              <p className="text-sm text-[#A3A3A3] max-w-xs text-center">Enter your niche to get 10 video ideas with viral score predictions.</p>
            </div>
          )}

          {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.ideas} tokens per generation</div>}
        </>
      )}

      {/* Tab 2: 30-Day Calendar */}
      {activeTab === 'calendar' && <CalendarTab />}
    </div>
  );
}
