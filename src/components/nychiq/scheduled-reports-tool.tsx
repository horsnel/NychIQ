'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import { showToast } from '@/lib/toast';
import { StatCard } from '@/components/nychiq/stat-card';
import {
  CalendarClock,
  Mail,
  Bell,
  Plus,
  Trash2,
  Eye,
  Download,
  FileText,
  TrendingUp,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

/* ── Types ── */
type ReportType = 'weekly' | 'monthly' | 'custom';
type DeliveryMethod = 'email' | 'in-app';
type DeliveryStatus = 'sent' | 'failed' | 'pending';

interface Schedule {
  id: string;
  type: ReportType;
  label: string;
  days: string[];
  time: string;
  deliveryMethods: DeliveryMethod[];
  enabled: boolean;
  nextDelivery: string;
}

interface DeliveryRecord {
  id: string;
  date: string;
  type: ReportType;
  label: string;
  status: DeliveryStatus;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['6:00 AM', '8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  weekly: 'Weekly Performance Summary',
  monthly: 'Monthly Analytics Deep-Dive',
  custom: 'Custom Report',
};

const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  weekly: '#888888',
  monthly: '#888888',
  custom: '#F6A828',
};

const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'sched-1',
    type: 'weekly',
    label: 'Weekly Performance Summary',
    days: ['Mon'],
    time: '8:00 AM',
    deliveryMethods: ['email', 'in-app'],
    enabled: true,
    nextDelivery: 'Mon, Apr 14 · 8:00 AM',
  },
  {
    id: 'sched-2',
    type: 'monthly',
    label: 'Monthly Analytics Deep-Dive',
    days: ['Mon'],
    time: '10:00 AM',
    deliveryMethods: ['email'],
    enabled: true,
    nextDelivery: 'Mon, May 5 · 10:00 AM',
  },
  {
    id: 'sched-3',
    type: 'custom',
    label: 'Content Strategy Report',
    days: ['Wed', 'Fri'],
    time: '2:00 PM',
    deliveryMethods: ['in-app'],
    enabled: false,
    nextDelivery: 'Wed, Apr 16 · 2:00 PM',
  },
];

const INITIAL_HISTORY: DeliveryRecord[] = [
  { id: 'del-1', date: 'Apr 7, 2026', type: 'weekly', label: 'Weekly Performance Summary', status: 'sent' },
  { id: 'del-2', date: 'Apr 1, 2026', type: 'monthly', label: 'Monthly Analytics Deep-Dive', status: 'sent' },
  { id: 'del-3', date: 'Mar 31, 2026', type: 'weekly', label: 'Weekly Performance Summary', status: 'sent' },
  { id: 'del-4', date: 'Mar 24, 2026', type: 'weekly', label: 'Weekly Performance Summary', status: 'failed' },
  { id: 'del-5', date: 'Mar 17, 2026', type: 'weekly', label: 'Weekly Performance Summary', status: 'sent' },
  { id: 'del-6', date: 'Mar 1, 2026', type: 'monthly', label: 'Monthly Analytics Deep-Dive', status: 'sent' },
  { id: 'del-7', date: 'Feb 28, 2026', type: 'custom', label: 'Content Strategy Report', status: 'pending' },
];

/* ── Status badge ── */
function StatusBadge({ status }: { status: DeliveryStatus }) {
  const config = {
    sent: { color: '#888888', icon: CheckCircle2, label: 'Sent' },
    failed: { color: '#888888', icon: XCircle, label: 'Failed' },
    pending: { color: '#F6A828', icon: Clock, label: 'Pending' },
  }[status];
  const Icon = config.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${config.color}15`, color: config.color }}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

/* ── Report preview mock data ── */
const PREVIEW_DATA = {
  channelOverview: { subscribers: '24.8K', totalViews: '1.2M', videos: 156, avgWatchTime: '4:32' },
  growthMetrics: [
    { label: 'Subscribers (30d)', value: '+1,240', change: '+12.4%' },
    { label: 'Views (30d)', value: '+89.2K', change: '+18.6%' },
    { label: 'Engagement Rate', value: '6.8%', change: '+0.9%' },
    { label: 'Revenue Est.', value: '₦420K', change: '+22.1%' },
  ],
  topContent: [
    { title: 'Why Most Developers Fail at System Design', views: '125K', score: 92 },
    { title: 'React vs Vue in 2026 — Full Comparison', views: '89K', score: 78 },
    { title: 'Learn CSS Grid in 15 Minutes', views: '45K', score: 65 },
  ],
  recommendations: [
    'Increase upload frequency to 3x/week — data shows algorithm favors consistency.',
    'Focus on "How-To" content — your top 5 videos are all tutorials.',
    'Optimize first 30 seconds — average retention drops 40% at 0:30.',
    'Cross-promote Shorts to drive traffic to long-form content.',
  ],
};

export function ScheduledReportsTool() {
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [history, setHistory] = useState<DeliveryRecord[]>(INITIAL_HISTORY);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [newSchedule, setNewSchedule] = useState<{
    type: ReportType;
    days: string[];
    time: string;
    email: boolean;
    inApp: boolean;
  }>({
    type: 'weekly',
    days: ['Mon'],
    time: '8:00 AM',
    email: true,
    inApp: true,
  });

  const toggleDay = (day: string) => {
    setNewSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  const createSchedule = () => {
    if (newSchedule.days.length === 0) {
      showToast('Select at least one day', 'warning');
      return;
    }
    if (!newSchedule.email && !newSchedule.inApp) {
      showToast('Select at least one delivery method', 'warning');
      return;
    }
    const methods: DeliveryMethod[] = [];
    if (newSchedule.email) methods.push('email');
    if (newSchedule.inApp) methods.push('in-app');

    const newSched: Schedule = {
      id: `sched-${Date.now()}`,
      type: newSchedule.type,
      label: REPORT_TYPE_LABELS[newSchedule.type],
      days: newSchedule.days,
      time: newSchedule.time,
      deliveryMethods: methods,
      enabled: true,
      nextDelivery: `${newSchedule.days[0]}, Apr 21 · ${newSchedule.time}`,
    };
    setSchedules((prev) => [...prev, newSched]);
    setShowNewForm(false);
    setNewSchedule({ type: 'weekly', days: ['Mon'], time: '8:00 AM', email: true, inApp: true });
    showToast('Schedule created successfully', 'success');
  };

  const deleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('Schedule deleted', 'info');
  };

  const toggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
    const sched = schedules.find((s) => s.id === id);
    if (sched) {
      showToast(sched.enabled ? 'Schedule paused' : 'Schedule resumed', 'info');
    }
  };

  const handlePreview = () => {
    setPreviewLoading(true);
    setTimeout(() => {
      setPreviewLoading(false);
      setShowPreview(true);
    }, 1500);
  };

  const handleDownload = (record: DeliveryRecord) => {
    showToast(`Downloading ${record.label}...`, 'info');
  };

  const activeCount = schedules.filter((s) => s.enabled).length;
  const sentCount = history.filter((h) => h.status === 'sent').length;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
              <CalendarClock className="w-5 h-5 text-[#888888]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Scheduled Reports</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Automate recurring analytics reports delivered on your schedule.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Schedules" value={activeCount} color="#888888" icon={<CalendarClock className="w-4 h-4" />} />
        <StatCard label="Reports Delivered" value={sentCount} color="#888888" icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Total Schedules" value={schedules.length} color="#F6A828" icon={<FileText className="w-4 h-4" />} />
        <StatCard label="Delivery Rate" value="92%" change="+2.4%" changeType="up" color="#888888" icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      {/* Schedule Configuration + Preview side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Schedule Configuration */}
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Schedule Configuration</h3>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)] text-xs font-semibold text-[#888888] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Schedule
            </button>
          </div>

          {/* New schedule form */}
          {showNewForm && (
            <div className="rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] p-4 mb-4 space-y-4">
              {/* Report Type */}
              <div>
                <label className="text-[11px] font-bold text-[#a0a0a0] uppercase tracking-wider block mb-2">Report Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['weekly', 'monthly', 'custom'] as ReportType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewSchedule((p) => ({ ...p, type }))}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                        newSchedule.type === type
                          ? 'border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.03)] text-[#888888]'
                          : 'border-[#1A1A1A] bg-[#0a0a0a] text-[#a0a0a0] hover:border-[rgba(255,255,255,0.03)]'
                      }`}
                    >
                      {REPORT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Picker */}
              <div>
                <label className="text-[11px] font-bold text-[#a0a0a0] uppercase tracking-wider block mb-2">Delivery Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`w-10 h-9 rounded-lg text-xs font-semibold transition-all border ${
                        newSchedule.days.includes(day)
                          ? 'border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.03)] text-[#888888]'
                          : 'border-[#1A1A1A] bg-[#0a0a0a] text-[#666666] hover:border-[rgba(255,255,255,0.03)] hover:text-[#a0a0a0]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Picker */}
              <div>
                <label className="text-[11px] font-bold text-[#a0a0a0] uppercase tracking-wider block mb-2">Delivery Time</label>
                <div className="relative">
                  <select
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule((p) => ({ ...p, time: e.target.value }))}
                    className="w-full h-10 px-3 pr-10 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#888888]/50 transition-colors appearance-none cursor-pointer"
                  >
                    {TIMES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] pointer-events-none" />
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="text-[11px] font-bold text-[#a0a0a0] uppercase tracking-wider block mb-2">Delivery Method</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewSchedule((p) => ({ ...p, email: !p.email }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      newSchedule.email
                        ? 'border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.03)] text-[#888888]'
                        : 'border-[#1A1A1A] bg-[#0a0a0a] text-[#666666] hover:border-[rgba(255,255,255,0.03)]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </button>
                  <button
                    onClick={() => setNewSchedule((p) => ({ ...p, inApp: !p.inApp }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      newSchedule.inApp
                        ? 'border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.03)] text-[#888888]'
                        : 'border-[#1A1A1A] bg-[#0a0a0a] text-[#666666] hover:border-[rgba(255,255,255,0.03)]'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    In-App
                  </button>
                </div>
              </div>

              {/* Create button */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={createSchedule}
                  className="flex-1 h-10 rounded-lg bg-[#888888] text-white text-sm font-bold hover:bg-[#555555] transition-colors"
                >
                  Create Schedule
                </button>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="px-4 h-10 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#a0a0a0] hover:border-[rgba(255,255,255,0.03)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Active Schedules List */}
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`rounded-lg border p-4 transition-all ${
                  schedule.enabled
                    ? 'bg-[#0a0a0a] border-[#1A1A1A]'
                    : 'bg-[#0a0a0a] border-[#1A1A1A] opacity-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: REPORT_TYPE_COLORS[schedule.type] }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#FFFFFF] truncate">{schedule.label}</p>
                      <p className="text-xs text-[#a0a0a0] mt-0.5">
                        {schedule.days.join(', ')} · {schedule.time}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {schedule.deliveryMethods.includes('email') && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#888888]">
                            <Mail className="w-3 h-3" /> Email
                          </span>
                        )}
                        {schedule.deliveryMethods.includes('in-app') && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#888888]">
                            <Bell className="w-3 h-3" /> In-App
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleSchedule(schedule.id)} className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors">
                      {schedule.enabled ? (
                        <ToggleRight className="w-5 h-5 text-[#888888]" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-[#666666]" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.03)] transition-colors text-[#666666] hover:text-[#888888]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {schedule.enabled && (
                  <div className="mt-3 pt-3 border-t border-[#1A1A1A]">
                    <p className="text-[11px] text-[#666666]">
                      Next delivery: <span className="text-[#a0a0a0]">{schedule.nextDelivery}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Report Preview */}
        <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Report Preview</h3>
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(246,168,40,0.1)] border border-[rgba(255,255,255,0.03)] text-xs font-semibold text-[#F6A828] hover:bg-[rgba(246,168,40,0.2)] transition-colors disabled:opacity-50"
            >
              {previewLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              Preview Report
            </button>
          </div>

          {previewLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-[#1A1A1A] rounded w-2/3" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-[#1A1A1A] rounded-lg" />
                ))}
              </div>
              <div className="h-3 bg-[#1A1A1A] rounded w-full" />
              <div className="h-3 bg-[#1A1A1A] rounded w-4/5" />
              <div className="h-3 bg-[#1A1A1A] rounded w-3/5" />
            </div>
          )}

          {!previewLoading && !showPreview && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
                <Eye className="w-6 h-6 text-[#888888]" />
              </div>
              <p className="text-sm text-[#a0a0a0] text-center">Click &quot;Preview Report&quot; to generate a sample report.</p>
            </div>
          )}

          {!previewLoading && showPreview && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {/* Report header */}
              <div className="rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-[#888888]" />
                  <h4 className="text-sm font-bold text-[#FFFFFF]">Weekly Performance Summary</h4>
                </div>
                <p className="text-[11px] text-[#666666]">Generated: Apr 12, 2026 · Channel: NychIQ Official</p>
              </div>

              {/* Channel Overview */}
              <div>
                <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Channel Overview
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Subscribers', value: PREVIEW_DATA.channelOverview.subscribers },
                    { label: 'Total Views', value: PREVIEW_DATA.channelOverview.totalViews },
                    { label: 'Videos', value: PREVIEW_DATA.channelOverview.videos },
                    { label: 'Avg Watch Time', value: PREVIEW_DATA.channelOverview.avgWatchTime },
                  ].map((item) => (
                    <div key={item.label} className="rounded-md bg-[#0a0a0a] border border-[#1A1A1A] p-3">
                      <p className="text-[10px] text-[#666666] uppercase tracking-wider">{item.label}</p>
                      <p className="text-base font-bold text-[#FFFFFF] mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Metrics */}
              <div>
                <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Growth Metrics
                </h4>
                <div className="space-y-2">
                  {PREVIEW_DATA.growthMetrics.map((m) => (
                    <div key={m.label} className="flex items-center justify-between rounded-md bg-[#0a0a0a] border border-[#1A1A1A] p-3">
                      <span className="text-xs text-[#a0a0a0]">{m.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#FFFFFF]">{m.value}</span>
                        <span className="text-[10px] font-semibold text-[#888888]">{m.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Content */}
              <div>
                <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Top Performing Content
                </h4>
                <div className="space-y-2">
                  {PREVIEW_DATA.topContent.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A] p-3">
                      <span className="text-[10px] font-bold text-[#666666] w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#FFFFFF] truncate">{c.title}</p>
                        <p className="text-[10px] text-[#666666]">{c.views} views</p>
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                        style={{
                          backgroundColor: c.score >= 80 ? 'rgba(34,197,94,0.1)' : c.score >= 60 ? 'rgba(246,168,40,0.2)' : 'rgba(255,255,255,0.03)',
                          color: c.score >= 80 ? '#888888' : c.score >= 60 ? '#F6A828' : '#888888',
                        }}
                      >
                        {c.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Recommendations
                </h4>
                <div className="space-y-2">
                  {PREVIEW_DATA.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-md bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)]">
                      <span className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center text-[10px] font-bold text-[#888888] shrink-0">{i + 1}</span>
                      <p className="text-xs text-[#a0a0a0] leading-relaxed">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delivery History */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.03)] p-4 sm:p-5">
        <h3 className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Delivery History
        </h3>
        <div className="overflow-x-auto">
          {/* Desktop table */}
          <table className="hidden sm:table w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left text-[11px] font-bold text-[#666666] uppercase tracking-wider pb-3 pr-4">Date</th>
                <th className="text-left text-[11px] font-bold text-[#666666] uppercase tracking-wider pb-3 pr-4">Report</th>
                <th className="text-left text-[11px] font-bold text-[#666666] uppercase tracking-wider pb-3 pr-4">Status</th>
                <th className="text-right text-[11px] font-bold text-[#666666] uppercase tracking-wider pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id} className="border-b border-[#1A1A1A] last:border-0">
                  <td className="py-3 pr-4 text-xs text-[#a0a0a0] whitespace-nowrap">{record.date}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: REPORT_TYPE_COLORS[record.type] }} />
                      <span className="text-xs text-[#FFFFFF]">{record.label}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4"><StatusBadge status={record.status} /></td>
                  <td className="py-3 text-right">
                    {record.status === 'sent' && (
                      <button
                        onClick={() => handleDownload(record)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {history.map((record) => (
              <div key={record.id} className="rounded-lg bg-[#0a0a0a] border border-[#1A1A1A] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#666666]">{record.date}</span>
                  <StatusBadge status={record.status} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: REPORT_TYPE_COLORS[record.type] }} />
                  <span className="text-xs text-[#FFFFFF]">{record.label}</span>
                </div>
                {record.status === 'sent' && (
                  <button
                    onClick={() => handleDownload(record)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center text-[11px] text-[#666666]">
        Scheduled Reports — Free for Agency plan members
      </div>
    </div>
  );
}
