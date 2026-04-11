'use client';

import React, { useState } from 'react';
import {
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  Youtube,
  MoreVertical,
  Plus,
  Zap,
  FileVideo,
} from 'lucide-react';

type UploadStatus = 'Scheduled' | 'Processing' | 'Published';

interface QueueItem {
  id: string;
  title: string;
  status: UploadStatus;
  scheduledDate: string;
  duration: string;
  size: string;
}

const STATUS_CONFIG: Record<UploadStatus, { color: string; bg: string; icon: typeof Upload }> = {
  Scheduled: { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', icon: Clock },
  Processing: { color: '#4A9EFF', bg: 'rgba(74,158,255,0.1)', icon: Loader2 },
  Published: { color: '#00C48C', bg: 'rgba(0,196,140,0.1)', icon: CheckCircle2 },
};

const MOCK_QUEUE: QueueItem[] = [
  { id: '1', title: 'How to Build a SaaS in 2025', status: 'Scheduled', scheduledDate: 'Jan 15, 2:00 PM', duration: '12:34', size: '2.1 GB' },
  { id: '2', title: 'React 19 Deep Dive Tutorial', status: 'Processing', scheduledDate: 'Jan 14, 6:00 PM', duration: '18:22', size: '3.4 GB' },
  { id: '3', title: 'My Dev Setup Tour 2025', status: 'Published', scheduledDate: 'Jan 13, 3:00 PM', duration: '9:45', size: '1.8 GB' },
  { id: '4', title: 'Top 10 VS Code Extensions', status: 'Published', scheduledDate: 'Jan 12, 4:30 PM', duration: '14:10', size: '2.6 GB' },
  { id: '5', title: 'AI Tools Every Developer Needs', status: 'Scheduled', scheduledDate: 'Jan 16, 5:00 PM', duration: '15:50', size: '2.9 GB' },
];

export function AutoUploadTool() {
  const [queue] = useState<QueueItem[]>(MOCK_QUEUE);
  const [selectedDate, setSelectedDate] = useState('');
  const [connected, setConnected] = useState(true);

  const statusCounts = {
    Scheduled: queue.filter((q) => q.status === 'Scheduled').length,
    Processing: queue.filter((q) => q.status === 'Processing').length,
    Published: queue.filter((q) => q.status === 'Published').length,
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
            <Upload className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#E8E8E8]">Auto Upload</h2>
            <p className="text-xs text-[#888888] mt-0.5">Schedule and automate your video publishing pipeline.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(Object.entries(statusCounts) as [UploadStatus, number][]).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="p-3 rounded-lg border" style={{ backgroundColor: cfg.bg, borderColor: cfg.color + '30' }}>
                <p className="text-lg font-bold" style={{ color: cfg.color }}>{count}</p>
                <p className="text-[10px] text-[#888888] uppercase tracking-wider">{status}</p>
              </div>
            );
          })}
        </div>

        {/* Schedule Picker + Connect */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <Calendar className="w-4 h-4 text-[#666]" />
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#E8E8E8] outline-none"
            />
          </div>
          <button
            onClick={() => setConnected(!connected)}
            className={`px-4 h-11 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shrink-0 ${
              connected
                ? 'bg-[rgba(224,82,82,0.1)] text-[#E05252] border border-[rgba(224,82,82,0.3)]'
                : 'bg-[#E05252] text-white hover:bg-[#C94545]'
            }`}
          >
            <Youtube className="w-4 h-4" />
            {connected ? 'Disconnect YouTube' : 'Connect YouTube'}
          </button>
        </div>
      </div>

      {/* Upload Queue */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#F5A623]" />
            Upload Queue ({queue.length})
          </h4>
          <button className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#888] hover:text-[#E8E8E8]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {queue.map((item) => {
            const cfg = STATUS_CONFIG[item.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
                <div className="p-2 rounded-lg" style={{ backgroundColor: cfg.bg }}>
                  <FileVideo className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E8E8E8] truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#666] flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.scheduledDate}
                    </span>
                    <span className="text-[10px] text-[#555]">·</span>
                    <span className="text-[10px] text-[#666]">{item.duration}</span>
                    <span className="text-[10px] text-[#555]">·</span>
                    <span className="text-[10px] text-[#666]">{item.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    <StatusIcon className={`w-3 h-3 ${item.status === 'Processing' ? 'animate-spin' : ''}`} />
                    {item.status}
                  </span>
                  <button className="p-1 rounded hover:bg-[#1A1A1A] text-[#555] hover:text-[#E8E8E8] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
