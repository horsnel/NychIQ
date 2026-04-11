'use client';

import React, { useState } from 'react';
import {
  BellRing,
  Info,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

type Severity = 'info' | 'warning' | 'critical';

interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  time: string;
}

interface ToggleSetting {
  key: Severity;
  label: string;
  enabled: boolean;
  color: string;
}

const MOCK_ALERTS: AlertItem[] = [
  { id: '1', severity: 'critical', title: 'Revenue Drop Detected', description: 'AdSense revenue dropped 32% in the last 24 hours across your top 3 videos.', time: '12m ago' },
  { id: '2', severity: 'warning', title: 'Subscriber Spike Anomaly', description: 'Unusual +2.4K subscribers in 1 hour. Could be bot activity or viral moment.', time: '45m ago' },
  { id: '3', severity: 'info', title: 'Upload Streak Milestone', description: 'You hit 30 consecutive uploads! Consistency score increased to 98.', time: '2h ago' },
  { id: '4', severity: 'warning', title: 'Thumbnail CTR Declining', description: 'Average CTR fell below 4% threshold on the last 5 videos.', time: '5h ago' },
  { id: '5', severity: 'critical', title: 'Copyright Strike Received', description: 'Video "Best of 2024" received a copyright claim. Review within 7 days.', time: '8h ago' },
  { id: '6', severity: 'info', title: 'Algorithm Favorability Up', description: 'Your content is being recommended 15% more this week compared to last.', time: '1d ago' },
];

const SEVERITY_CONFIG: Record<Severity, { icon: typeof Info; color: string; bg: string; border: string }> = {
  info: { icon: Info, color: '#4A9EFF', bg: 'rgba(74,158,255,0.1)', border: 'rgba(74,158,255,0.2)' },
  warning: { icon: AlertTriangle, color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' },
  critical: { icon: XCircle, color: '#E05252', bg: 'rgba(224,82,82,0.1)', border: 'rgba(224,82,82,0.2)' },
};

export function SmartAlertsTool() {
  const [toggles, setToggles] = useState<ToggleSetting[]>([
    { key: 'info', label: 'Info Alerts', enabled: true, color: '#4A9EFF' },
    { key: 'warning', label: 'Warnings', enabled: true, color: '#F5A623' },
    { key: 'critical', label: 'Critical', enabled: true, color: '#E05252' },
  ]);
  const [alerts] = useState<AlertItem[]>(MOCK_ALERTS);

  const filteredAlerts = alerts.filter(
    (a) => toggles.find((t) => t.key === a.severity)?.enabled
  );

  const handleToggle = (key: Severity) => {
    setToggles((prev) =>
      prev.map((t) => (t.key === key ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const counts = {
    info: alerts.filter((a) => a.severity === 'info').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
            <BellRing className="w-5 h-5 text-[#4A9EFF]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#E8E8E8]">Smart Alerts</h2>
            <p className="text-xs text-[#888888] mt-0.5">AI-powered channel monitoring with real-time severity tracking.</p>
          </div>
          <div className="p-2 rounded-lg bg-[rgba(0,196,140,0.1)] border border-[rgba(0,196,140,0.2)]">
            <ShieldCheck className="w-4 h-4 text-[#00C48C]" />
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="flex flex-wrap gap-3">
          {toggles.map((t) => (
            <button
              key={t.key}
              onClick={() => handleToggle(t.key)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all"
              style={{
                backgroundColor: t.enabled ? t.color + '15' : '#0D0D0D',
                borderColor: t.enabled ? t.color + '40' : '#1A1A1A',
              }}
            >
              <div
                className="w-8 h-4 rounded-full relative transition-colors"
                style={{ backgroundColor: t.enabled ? t.color : '#333' }}
              >
                <div
                  className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                  style={{ left: t.enabled ? '17px' : '2px' }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: t.enabled ? t.color : '#666' }}>
                {t.label}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: t.color + '20', color: t.color }}
              >
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#F5A623]" />
            Active Alerts ({filteredAlerts.length})
          </h4>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredAlerts.length === 0 ? (
            <p className="text-sm text-[#666666] text-center py-8">No alerts matching current filters.</p>
          ) : (
            filteredAlerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const Icon = config.icon;
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border transition-colors hover:border-[#333]"
                  style={{ backgroundColor: config.bg, borderColor: config.border }}
                >
                  <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: config.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#E8E8E8]">{alert.title}</span>
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: config.color + '20', color: config.color }}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#AAAAAA] leading-relaxed">{alert.description}</p>
                    <span className="text-[10px] text-[#666666] flex items-center gap-1 mt-1.5">
                      <Clock className="w-3 h-3" /> {alert.time}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#444] shrink-0 mt-1" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
