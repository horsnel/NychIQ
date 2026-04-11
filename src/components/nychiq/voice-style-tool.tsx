'use client';

import React, { useState } from 'react';
import {
  Mic,
  Gauge,
  Zap,
  Eye,
  Users,
  Upload,
  Loader2,
  Volume2,
  BarChart3,
  Lightbulb,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface VoiceMetric {
  label: string;
  value: string;
  score: number;
  maxScore: number;
  color: string;
}

interface VoiceTip {
  title: string;
  description: string;
  priority: 'high' | 'medium';
}

interface ComparisonVoice {
  voice: string;
  wpm: number;
  energy: number;
  clarity: number;
}

const MOCK_METRICS: VoiceMetric[] = [
  { label: 'Words Per Minute', value: '165 WPM', score: 82, maxScore: 100, color: '#4A9EFF' },
  { label: 'Energy Level', value: '7.2 / 10', score: 72, maxScore: 100, color: '#F5A623' },
  { label: 'Clarity Score', value: '89 / 100', score: 89, maxScore: 100, color: '#00C48C' },
  { label: 'Audience Match', value: '94%', score: 94, maxScore: 100, color: '#9B72CF' },
];

const MOCK_COMPARISON: ComparisonVoice[] = [
  { voice: 'Your Voice', wpm: 165, energy: 72, clarity: 89 },
  { voice: 'Top Creator Avg', wpm: 155, energy: 85, clarity: 82 },
  { voice: 'Industry Avg', wpm: 140, energy: 65, clarity: 75 },
];

const MOCK_TIPS: VoiceTip[] = [
  { title: 'Slow down your pacing', description: 'Your WPM of 165 is 6% above optimal. Reduce to 150-155 for better comprehension.', priority: 'high' },
  { title: 'Increase vocal energy', description: 'Add more pitch variation and emphasis on key phrases. Top creators score 85+ energy.', priority: 'high' },
  { title: 'Use more pauses for emphasis', description: 'Strategic 1-2 second pauses before key points increase viewer retention by 18%.', priority: 'medium' },
  { title: 'Perfect your intro energy', description: 'First 30 seconds should have 20% more energy than your average. Hook the viewer early.', priority: 'medium' },
];

export function VoiceStyleTool() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleUpload = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzed(true);
      setAnalyzing(false);
    }, 1800);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
            <Mic className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Voice Style Analyzer</h2>
            <p className="text-xs text-[#888888] mt-0.5">Measure vocal delivery metrics and compare against top creators.</p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-[#2A2A2A] hover:border-[#9B72CF]/40 transition-colors cursor-pointer"
          onClick={handleUpload}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-8 h-8 text-[#9B72CF] animate-spin mb-2" />
              <p className="text-sm text-[#888]">Analyzing audio...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[#666] mb-2" />
              <p className="text-sm text-[#888]">Click to upload an audio or video file</p>
              <p className="text-[10px] text-[#555] mt-1">MP3, WAV, MP4, M4A — Max 100MB</p>
            </>
          )}
        </div>
      </div>

      {analyzed && (
        <>
          {/* Voice Metrics */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-[#9B72CF]" />
              Voice Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_METRICS.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[#666] uppercase tracking-wider">{m.label}</span>
                    <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${m.score}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Bars */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#4A9EFF]" />
              Comparison
            </h4>
            <div className="space-y-4">
              {['wpm', 'energy', 'clarity'].map((metric) => (
                <div key={metric}>
                  <p className="text-[10px] text-[#666] uppercase tracking-wider mb-2 capitalize">{metric === 'wpm' ? 'Words Per Min' : metric}</p>
                  <div className="space-y-1.5">
                    {MOCK_COMPARISON.map((v, i) => {
                      const val = v[metric as keyof ComparisonVoice] as number;
                      const maxVal = 200;
                      const color = i === 0 ? '#9B72CF' : i === 1 ? '#F5A623' : '#555';
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] text-[#888] w-24 truncate shrink-0">{v.voice}</span>
                          <div className="flex-1 h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(val / maxVal) * 100}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#F5A623]" />
              Improvement Tips
            </h4>
            <div className="space-y-2">
              {MOCK_TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tip.priority === 'high' ? '#E05252' : '#F5A623' }} />
                  <div>
                    <p className="text-sm font-medium text-[#E8E8E8]">{tip.title}</p>
                    <p className="text-xs text-[#AAAAAA] mt-0.5 leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
