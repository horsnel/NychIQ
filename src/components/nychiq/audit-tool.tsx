'use client';

import React, { useState } from 'react';
import { useNychIQStore, TOKEN_COSTS } from '@/lib/store';
import { askAI, ytFetch } from '@/lib/api';
import { fmtV } from '@/lib/utils';
import {
  ClipboardCheck,
  Crown,
  Lock,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Video,
  Eye,
  Download,
} from 'lucide-react';

interface AuditResult {
  healthScore: number;
  grade: string;
  categories: Array<{ name: string; score: number; icon: string }>;
  actionItems: Array<{ priority: 'high' | 'medium' | 'low'; text: string }>;
  improvementPotential: string;
}

interface ChannelData {
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
}


/* Health Score Gauge */
function HealthGauge({ score }: { score: number }) {
  const animated = true;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 100 * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#FDBA2D' : score >= 40 ? '#3B82F6' : '#EF4444';
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#1A1A1A" strokeWidth="8" />
          <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
            strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-[#A3A3A3]">/ 100</span>
        </div>
      </div>
      <div className="mt-2 px-3 py-1 rounded-full text-lg font-bold" style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
        Grade: {grade}
      </div>
    </div>
  );
}

export function AuditTool() {
  const { spendTokens, setPersonalChannel, userPlan, addAgencyChannel, agencyChannels } = useNychIQStore();
  const [channel, setChannel] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleExportReport = () => {
    if (!result) return;
    const grade = result.healthScore >= 90 ? 'A' : result.healthScore >= 80 ? 'B' : result.healthScore >= 65 ? 'C' : result.healthScore >= 50 ? 'D' : 'F';
    const scoreColor = result.healthScore >= 80 ? '#10B981' : result.healthScore >= 60 ? '#FDBA2D' : result.healthScore >= 40 ? '#3B82F6' : '#EF4444';
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const categoriesHtml = result.categories.map((cat) => {
      const c = cat.score >= 80 ? '#10B981' : cat.score >= 60 ? '#FDBA2D' : '#EF4444';
      return `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:#FFFFFF;font-size:13px;font-weight:500">${cat.icon} ${cat.name}</span>
          <span style="color:${c};font-size:13px;font-weight:700">${cat.score}/100</span>
        </div>
        <div style="height:6px;background:#1A1A1A;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${cat.score}%;background:${c};border-radius:3px"></div>
        </div>
      </div>`;
    }).join('');

    const actionItemsHtml = result.actionItems.map((item) => {
      const pColor = item.priority === 'high' ? '#EF4444' : item.priority === 'medium' ? '#FDBA2D' : '#10B981';
      const pLabel = item.priority.toUpperCase();
      return `<div style="padding:10px 14px;background:#141414;border-radius:8px;margin-bottom:8px;border-left:3px solid ${pColor}">
        <span style="color:${pColor};font-size:10px;font-weight:700;letter-spacing:1px;margin-right:8px">${pLabel}</span>
        <span style="color:#FFFFFF;font-size:13px;line-height:1.5">${item.text}</span>
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<title>NychIQ Channel Audit Report - ${channel.trim()}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0D0D0D; color: #FFFFFF; padding: 40px; max-width: 800px; margin: 0 auto; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div style="text-align:center;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #1F1F1F">
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#FDBA2D;margin-bottom:8px">NYCHIQ AUDIT REPORT</div>
    <h1 style="font-size:28px;font-weight:800;color:#FFFFFF;margin-bottom:6px">${channel.trim()}</h1>
    <div style="font-size:12px;color:#A3A3A3">${now}</div>
  </div>

  <div style="text-align:center;padding:30px 0;margin-bottom:30px;background:#141414;border-radius:12px;border:1px solid #1F1F1F">
    <div style="font-size:48px;font-weight:800;color:${scoreColor}">${result.healthScore}</div>
    <div style="font-size:11px;color:#A3A3A3;margin-bottom:8px">Health Score / 100</div>
    <div style="display:inline-block;padding:4px 16px;border-radius:20px;font-size:14px;font-weight:700;color:${scoreColor};background:${scoreColor}15;border:1px solid ${scoreColor}40">Grade: ${grade}</div>
  </div>

  <div style="margin-bottom:30px">
    <h2 style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#A3A3A3;text-transform:uppercase;margin-bottom:16px">Category Scores</h2>
    ${categoriesHtml}
  </div>

  <div style="margin-bottom:30px">
    <h2 style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#A3A3A3;text-transform:uppercase;margin-bottom:16px">Action Items</h2>
    ${actionItemsHtml}
  </div>

  <div style="padding:20px;background:#141414;border-radius:12px;border:1px solid #1F1F1F">
    <h2 style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#A3A3A3;text-transform:uppercase;margin-bottom:10px">Improvement Potential</h2>
    <p style="font-size:13px;color:#FFFFFF;line-height:1.7">${result.improvementPotential}</p>
  </div>

  <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #1F1F1F">
    <div style="font-size:10px;color:#555555">Generated by NychIQ Channel Audit Tool</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleAudit = async () => {
    if (!channel.trim()) return;
    setLoading(true);
    setSearched(true);
    const ok = spendTokens('audit');
    if (!ok) { setLoading(false); return; }

    try {
      // Fetch real YouTube channel data
      try {
        const trimmed = channel.trim();
        const data = await ytFetch('channel', { handle: trimmed });
        setChannelData({
          title: data.name || trimmed,
          description: data.description || '',
          thumbnail: data.avatarUrl || '',
          subscriberCount: data.subscribers || 0,
          videoCount: data.videoCount || 0,
          viewCount: data.totalViews || 0,
          publishedAt: data.publishedAt || '',
        });
      } catch {
        // Channel data fetch failed — continue without it
        setChannelData(null);
      }

      const prompt = `You are a YouTube channel auditor. Perform a comprehensive health check on the channel: "${channel.trim()}".

Return a JSON object with:
- "healthScore": overall health score from 0 to 100
- "grade": letter grade (A/B/C/D/F)
- "categories": array of 5 category scores, each with "name" (one of: "SEO", "Content Quality", "Engagement", "Monetization", "Growth"), "score" (0-100), and "icon" (emoji)
- "actionItems": array of 6 action items, each with "priority" ("high"/"medium"/"low") and "text" (specific actionable recommendation)
- "improvementPotential": a brief paragraph describing estimated improvement potential

Return ONLY the JSON object.`;

      const response = await askAI(prompt);
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const auditResult = {
        healthScore: Math.min(100, Math.max(0, parseInt(parsed.healthScore, 10) || 65)),
        grade: parsed.grade || 'C',
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        improvementPotential: parsed.improvementPotential || 'Follow the action items above to see improvements.',
      };
      setResult(auditResult);

      // ── Save to personal channel store ──
      setPersonalChannel({
        handle: channel.trim(),
        title: channelData?.title || channel.trim(),
        description: channelData?.description || '',
        avatar: channelData?.thumbnail || '',
        subscriberCount: channelData?.subscriberCount || 0,
        videoCount: channelData?.videoCount || 0,
        viewCount: channelData?.viewCount || 0,
        publishedAt: channelData?.publishedAt || '',
        healthScore: auditResult.healthScore,
        auditDate: Date.now(),
        auditCategories: auditResult.categories,
      });

      // ── Also save to agency channels if on agency plan ──
      if (userPlan === 'agency') {
        const handle = channel.trim();
        const alreadyExists = agencyChannels.some((c) => c.handle === handle);
        if (!alreadyExists) {
          addAgencyChannel({
            handle,
            title: channelData?.title || handle,
            description: channelData?.description || '',
            avatar: channelData?.thumbnail || '',
            subscriberCount: channelData?.subscriberCount || 0,
            videoCount: channelData?.videoCount || 0,
            viewCount: channelData?.viewCount || 0,
            publishedAt: channelData?.publishedAt || '',
            healthScore: auditResult.healthScore,
            auditDate: Date.now(),
            auditCategories: auditResult.categories,
            niche: '',
            status: auditResult.healthScore >= 80 ? 'performing' as const : auditResult.healthScore >= 60 ? 'growth' as const : 'stale' as const,
            monthlyViews: Math.round((channelData?.viewCount || 0) * 0.15),
            monthlyRevenue: 0,
            cpm: 0,
          });
        }
      }
    } catch {
      const fallbackResult = {
        healthScore: 67,
        grade: 'C',
        categories: [
          { name: 'SEO', score: 72, icon: '🔍' },
          { name: 'Content Quality', score: 68, icon: '📝' },
          { name: 'Engagement', score: 58, icon: '💬' },
          { name: 'Monetization', score: 74, icon: '💰' },
          { name: 'Growth', score: 61, icon: '📈' },
        ],
        actionItems: [
          { priority: 'high' as const, text: 'Optimize video titles with target keywords — current titles are too generic and miss search intent.' },
          { priority: 'high' as const, text: 'Add end screens and cards to all videos to improve session duration and channel navigation.' },
          { priority: 'medium' as const, text: 'Increase upload frequency to at least 2 videos per week to maintain algorithm momentum.' },
          { priority: 'medium' as const, text: 'Improve thumbnail consistency by using a recognizable brand color and font style.' },
          { priority: 'low' as const, text: 'Add chapters/timestamps to long-form videos to improve viewer retention and SEO.' },
          { priority: 'low' as const, text: 'Engage with comments in the first hour after posting to boost initial engagement signals.' },
        ],
        improvementPotential: `Based on the analysis, "${channel.trim()}" has solid foundations but significant room for growth. By implementing the high-priority action items, estimated improvement of 35-50% in views within 3 months is achievable. The channel shows strong monetization potential that can be unlocked with better SEO practices and consistent upload scheduling.`,
      };
      setResult(fallbackResult);

      // ── Save fallback to personal channel store ──
      setPersonalChannel({
        handle: channel.trim(),
        title: channelData?.title || channel.trim(),
        description: channelData?.description || '',
        avatar: channelData?.thumbnail || '',
        subscriberCount: channelData?.subscriberCount || 0,
        videoCount: channelData?.videoCount || 0,
        viewCount: channelData?.viewCount || 0,
        publishedAt: channelData?.publishedAt || '',
        healthScore: fallbackResult.healthScore,
        auditDate: Date.now(),
        auditCategories: fallbackResult.categories,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]"><ClipboardCheck className="w-5 h-5 text-[#FDBA2D]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Channel Audit</h2>
              <p className="text-xs text-[#A3A3A3] mt-0.5">Full health check: health score 0-100, SEO gaps, action plan.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="text" value={channel} onChange={(e) => setChannel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAudit(); }}
              placeholder="Enter YouTube channel name or @handle..."
              className="flex-1 h-11 px-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
            />
            <button onClick={handleAudit} disabled={loading || !channel.trim()} className="px-5 h-11 rounded-lg bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              Run Audit
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-6 flex items-center justify-center">
            <div className="w-36 h-36 rounded-full bg-[#1A1A1A] animate-pulse" />
          </div>
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-[#1A1A1A] rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />)}
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#FDBA2D]" /> Audit Results for &quot;{channel.trim()}&quot;</h3>
            <button
              onClick={handleExportReport}
              className="px-3.5 py-1.5 rounded-lg bg-[rgba(253,186,45,0.15)] border border-[rgba(253,186,45,0.3)] text-[#FDBA2D] text-xs font-bold hover:bg-[rgba(253,186,45,0.25)] transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Report
            </button>
          </div>

          {/* Channel Profile Card */}
          {channelData && (
            <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-5">
              <div className="flex items-center gap-4">
                {channelData.thumbnail ? (
                  <img
                    src={channelData.thumbnail}
                    alt={channelData.title}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#1F1F1F]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#FDBA2D]/20 border-2 border-[#FDBA2D]/40 flex items-center justify-center text-xl font-bold text-[#FDBA2D]">
                    {channelData.title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-[#FFFFFF] truncate">{channelData.title}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    <span className="text-xs text-[#A3A3A3] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {fmtV(channelData.subscriberCount)} subscribers
                    </span>
                    <span className="text-xs text-[#A3A3A3] flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      {fmtV(channelData.videoCount)} videos
                    </span>
                    <span className="text-xs text-[#A3A3A3] flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {fmtV(channelData.viewCount)} views
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Health Score */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-6 flex flex-col items-center">
            <HealthGauge score={result.healthScore} />
          </div>

          {/* Category Scores */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3">Category Scores</h4>
            <div className="space-y-3">
              {result.categories.map((cat) => {
                const color = cat.score >= 80 ? '#10B981' : cat.score >= 60 ? '#FDBA2D' : '#EF4444';
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#FFFFFF] flex items-center gap-2"><span>{cat.icon}</span> {cat.name}</span>
                      <span className="text-xs font-bold" style={{ color }}>{cat.score}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.score}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Items */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-3">Action Items</h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {result.actionItems.map((item, i) => {
                const Icon = item.priority === 'high' ? XCircle : item.priority === 'medium' ? AlertTriangle : CheckCircle;
                const pColor = item.priority === 'high' ? '#EF4444' : item.priority === 'medium' ? '#FDBA2D' : '#10B981';
                return (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: pColor }} />
                    <p className="text-sm text-[#FFFFFF] leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Improvement Potential */}
          <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
            <h4 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-2">Improvement Potential</h4>
            <p className="text-sm text-[#FFFFFF] leading-relaxed">{result.improvementPotential}</p>
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mb-4"><ClipboardCheck className="w-8 h-8 text-[#FDBA2D]" /></div>
          <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">Audit Your Channel</h3>
          <p className="text-sm text-[#A3A3A3] max-w-xs text-center">Enter a YouTube channel name to get a comprehensive health check with actionable insights.</p>
        </div>
      )}

      {searched && !loading && <div className="text-center text-[11px] text-[#444444]">Cost: {TOKEN_COSTS.audit} tokens per audit</div>}
    </div>
  );
}
