'use client';

import React, { useState } from 'react';
import {
  KanbanSquare,
  Plus,
  GripVertical,
  Calendar,
  Clock,
  Film,
  Edit3,
  FileText,
  CheckCircle2,
  MoreHorizontal,
  Sparkles,
  ChevronRight,
  Circle,
} from 'lucide-react';

type PipelineStage = 'Ideas' | 'Scripting' | 'Filming' | 'Editing' | 'Published';

interface VideoCard {
  id: string;
  title: string;
  stage: PipelineStage;
  date: string;
  priority: 'high' | 'medium' | 'low';
  thumbnail?: string;
}

const STAGE_CONFIG: Record<PipelineStage, { color: string; bg: string; icon: typeof FileText }> = {
  Ideas: { color: '#9B72CF', bg: 'rgba(155,114,207,0.1)', icon: Sparkles },
  Scripting: { color: '#4A9EFF', bg: 'rgba(74,158,255,0.1)', icon: FileText },
  Filming: { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', icon: Film },
  Editing: { color: '#E05252', bg: 'rgba(224,82,82,0.1)', icon: Edit3 },
  Published: { color: '#00C48C', bg: 'rgba(0,196,140,0.1)', icon: CheckCircle2 },
};

const STAGES: PipelineStage[] = ['Ideas', 'Scripting', 'Filming', 'Editing', 'Published'];

const MOCK_CARDS: VideoCard[] = [
  { id: '1', title: 'Building a SaaS from Scratch', stage: 'Ideas', date: 'Jan 18', priority: 'high' },
  { id: '2', title: 'Top 10 AI Tools for Devs', stage: 'Ideas', date: 'Jan 20', priority: 'medium' },
  { id: '3', title: 'React 19 Deep Dive', stage: 'Scripting', date: 'Jan 15', priority: 'high' },
  { id: '4', title: 'VS Code Setup Tour 2025', stage: 'Scripting', date: 'Jan 16', priority: 'medium' },
  { id: '5', title: 'My Dev Journey Story', stage: 'Filming', date: 'Jan 13', priority: 'low' },
  { id: '6', title: 'Budget Tech Under $500', stage: 'Editing', date: 'Jan 10', priority: 'high' },
  { id: '7', title: 'Free Courses for Developers', stage: 'Editing', date: 'Jan 11', priority: 'medium' },
  { id: '8', title: 'How I Landed My Dream Job', stage: 'Published', date: 'Jan 8', priority: 'medium' },
  { id: '9', title: 'GitHub Copilot Full Review', stage: 'Published', date: 'Jan 5', priority: 'high' },
  { id: '10', title: 'My Morning Routine as Dev', stage: 'Published', date: 'Jan 3', priority: 'low' },
];

const PRIORITY_COLORS: Record<string, string> = {
  high: '#E05252',
  medium: '#F5A623',
  low: '#888888',
};

export function VideoPipelineTool() {
  const [cards] = useState<VideoCard[]>(MOCK_CARDS);
  const [showAddForm, setShowAddForm] = useState(false);

  const getCardsByStage = (stage: PipelineStage) => cards.filter((c) => c.stage === stage);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
            <KanbanSquare className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#E8E8E8]">Video Pipeline</h2>
            <p className="text-xs text-[#888888] mt-0.5">Track your content from idea to publish with a visual Kanban board.</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 h-8 rounded-lg bg-[#9B72CF] text-white text-xs font-bold hover:bg-[#8B62BF] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Idea
          </button>
        </div>

        {/* Pipeline Summary */}
        <div className="flex gap-3">
          {STAGES.map((stage) => {
            const cfg = STAGE_CONFIG[stage];
            const count = getCardsByStage(stage).length;
            return (
              <div key={stage} className="flex-1 p-2.5 rounded-lg text-center" style={{ backgroundColor: cfg.bg }}>
                <p className="text-sm font-bold" style={{ color: cfg.color }}>{count}</p>
                <p className="text-[9px] text-[#888] uppercase tracking-wider">{stage}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-lg bg-[#111111] border border-[#9B72CF]/30 p-4">
          <h4 className="text-xs font-bold text-[#9B72CF] uppercase tracking-wider mb-3">Add New Video</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Video title..."
              className="w-full h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] placeholder:text-[#555] outline-none focus:border-[#9B72CF]/50 transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#E8E8E8] outline-none"
              />
              <button className="px-4 h-10 rounded-lg bg-[#9B72CF] text-white text-xs font-bold hover:bg-[#8B62BF] transition-colors">
                Add to Ideas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cfg = STAGE_CONFIG[stage];
          const StageIcon = cfg.icon;
          const stageCards = getCardsByStage(stage);
          return (
            <div key={stage} className="min-w-[260px] flex-1">
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <StageIcon className="w-4 h-4" style={{ color: cfg.color }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{stage}</span>
                <span className="text-[10px] font-bold text-[#555] ml-auto">{stageCards.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[200px] max-h-[420px] overflow-y-auto pr-1">
                {stageCards.length === 0 ? (
                  <div className="p-6 rounded-lg border-2 border-dashed border-[#1A1A1A] flex flex-col items-center justify-center">
                    <Circle className="w-6 h-6 text-[#333] mb-1" />
                    <p className="text-[10px] text-[#555]">No videos</p>
                  </div>
                ) : (
                  stageCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-3 rounded-lg bg-[#111111] border border-[#222222] hover:border-[#333] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-[#333] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#E8E8E8] leading-snug">{card.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-[#666] flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {card.date}
                            </span>
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
                            />
                            <span className="text-[9px] text-[#555] capitalize">{card.priority}</span>
                          </div>
                        </div>
                        <button className="p-1 rounded hover:bg-[#1A1A1A] text-[#444] hover:text-[#888] opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
