'use client';

import React, { useState } from 'react';
import { useNychIQStore } from '@/lib/store';
import {
  Calendar,
  MessageSquare,
  Clock,
  BarChart3,
  Heart,
  Eye,
  Image as ImageIcon,
  Plus,
  Send,
  TrendingUp,
  Users,
  ImagePlus,
  ListChecks,
  Film,
  FileText,
} from 'lucide-react';

type PostType = 'Text' | 'Poll' | 'Image' | 'Video';

interface ScheduledPost {
  id: string;
  type: PostType;
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'draft' | 'sent';
}

interface PastPost {
  id: string;
  type: PostType;
  content: string;
  date: string;
  likes: number;
  comments: number;
  views: number;
  engagement: number;
}

const POST_TYPES: { key: PostType; label: string; icon: React.ReactNode }[] = [
  { key: 'Text', label: 'Text', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'Poll', label: 'Poll', icon: <ListChecks className="w-3.5 h-3.5" /> },
  { key: 'Image', label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" /> },
  { key: 'Video', label: 'Video', icon: <Film className="w-3.5 h-3.5" /> },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];

// Heatmap data: day -> hour -> engagement score (0-100)
const HEATMAP_DATA: Record<string, number[]> = {
  Mon: [30, 45, 65, 50, 40, 55, 70, 45],
  Tue: [25, 40, 70, 55, 45, 50, 65, 40],
  Wed: [35, 50, 60, 60, 50, 60, 75, 50],
  Thu: [30, 55, 75, 65, 55, 65, 80, 55],
  Fri: [40, 60, 80, 70, 60, 70, 85, 60],
  Sat: [20, 30, 45, 40, 50, 55, 60, 45],
  Sun: [15, 25, 35, 35, 40, 45, 50, 35],
};

const MOCK_PAST_POSTS: PastPost[] = [
  { id: '1', type: 'Poll', content: 'What topic should I cover next?', date: '2 days ago', likes: 342, comments: 89, views: 2100, engagement: 20.5 },
  { id: '2', type: 'Image', content: 'Behind the scenes of our latest shoot!', date: '3 days ago', likes: 567, comments: 124, views: 3400, engagement: 20.3 },
  { id: '3', type: 'Text', content: 'New video dropping tomorrow at 3PM! Set your reminders 🎬', date: '5 days ago', likes: 891, comments: 203, views: 5600, engagement: 19.5 },
  { id: '4', type: 'Video', content: 'Sneak peek of what\'s coming next week...', date: '1 week ago', likes: 423, comments: 67, views: 2800, engagement: 17.5 },
  { id: '5', type: 'Text', content: 'Thank you all for 100K subscribers! 🎉 Here\'s what\'s next...', date: '1 week ago', likes: 1203, comments: 312, views: 8900, engagement: 17.0 },
  { id: '6', type: 'Poll', content: 'Do you prefer long-form or short-form content?', date: '2 weeks ago', likes: 289, comments: 156, views: 1900, engagement: 23.3 },
];

function heatColor(value: number): string {
  if (value >= 75) return 'bg-[#00C48C]/80';
  if (value >= 60) return 'bg-[#00C48C]/50';
  if (value >= 45) return 'bg-[#F5A623]/50';
  if (value >= 30) return 'bg-[#F5A623]/30';
  return 'bg-[#222222]';
}

function postTypeIcon(type: PostType) {
  if (type === 'Poll') return <ListChecks className="w-3.5 h-3.5 text-[#9B72CF]" />;
  if (type === 'Image') return <ImageIcon className="w-3.5 h-3.5 text-[#4A9EFF]" />;
  if (type === 'Video') return <Film className="w-3.5 h-3.5 text-[#E05252]" />;
  return <FileText className="w-3.5 h-3.5 text-[#F5A623]" />;
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function CommunitySchedulerTool() {
  const { spendTokens } = useNychIQStore();
  const [postType, setPostType] = useState<PostType>('Text');
  const [postContent, setPostContent] = useState('');
  const [scheduleDate, setScheduleDate] = useState('2025-01-20');
  const [scheduleTime, setScheduleTime] = useState('15:00');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    { id: 's1', type: 'Poll', content: 'What color scheme for next video?', scheduledDate: '2025-01-18', scheduledTime: '15:00', status: 'scheduled' },
    { id: 's2', type: 'Text', content: 'Behind the scenes update coming tonight!', scheduledDate: '2025-01-19', scheduledTime: '12:00', status: 'scheduled' },
  ]);

  const handleSchedule = () => {
    if (!postContent.trim()) return;
    spendTokens('community-scheduler');
    setScheduledPosts((prev) => [
      { id: Date.now().toString(), type: postType, content: postContent.trim(), scheduledDate: scheduleDate, scheduledTime, status: 'scheduled' },
      ...prev,
    ]);
    setPostContent('');
  };

  const avgEngagement = Math.round(MOCK_PAST_POSTS.reduce((s, p) => s + p.engagement, 0) / MOCK_PAST_POSTS.length * 10) / 10;

  // Find best slot
  let bestDay = DAYS[0];
  let bestHour = HOURS[0];
  let bestVal = 0;
  DAYS.forEach((day) => {
    HEATMAP_DATA[day].forEach((val, hi) => {
      if (val > bestVal) { bestVal = val; bestDay = day; bestHour = HOURS[hi]; }
    });
  });

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[rgba(224,82,82,0.1)]">
              <Calendar className="w-5 h-5 text-[#E05252]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E8E8E8]">Community Scheduler</h2>
              <p className="text-xs text-[#888888] mt-0.5">Schedule posts & find the best posting times</p>
            </div>
          </div>

          {/* Post Type Selector */}
          <div className="flex gap-1.5 mb-4">
            {POST_TYPES.map((pt) => (
              <button
                key={pt.key}
                onClick={() => setPostType(pt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  postType === pt.key
                    ? 'bg-[#E05252]/15 text-[#E05252] border border-[#E05252]/30'
                    : 'bg-[#0D0D0D] text-[#888888] border border-[#1A1A1A] hover:border-[#2A2A2A] hover:text-[#E8E8E8]'
                }`}
              >
                {pt.icon}
                {pt.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div className="space-y-3">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={postType === 'Poll' ? 'Enter your poll question...' : 'What\'s on your mind? Write your community post...'}
              rows={3}
              className="w-full bg-[#0A0A0A] border border-[#222222] rounded-lg px-3 py-2.5 text-sm text-[#E8E8E8] placeholder:text-[#555555] focus:outline-none focus:border-[#E05252]/50 transition-colors resize-none"
            />

            {/* Image placeholder */}
            {(postType === 'Image' || postType === 'Video') && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-[#333] bg-[#0D0D0D] text-[#555555]">
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs">Click or drag to upload {postType === 'Video' ? 'video' : 'image'}</span>
              </div>
            )}

            {/* Schedule Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 bg-[#0A0A0A] border border-[#222222] rounded-lg px-3 py-2 text-sm text-[#E8E8E8] focus:outline-none focus:border-[#E05252]/50 transition-colors"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-28 bg-[#0A0A0A] border border-[#222222] rounded-lg px-3 py-2 text-sm text-[#E8E8E8] focus:outline-none focus:border-[#E05252]/50 transition-colors"
                />
              </div>
              <button
                onClick={handleSchedule}
                disabled={!postContent.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#E05252] text-white text-sm font-bold hover:bg-[#D04545] transition-colors disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
          <p className="text-[11px] text-[#666666] uppercase tracking-wider">Avg Engagement</p>
          <p className="text-lg font-bold text-[#00C48C] mt-0.5">{avgEngagement}%</p>
        </div>
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
          <p className="text-[11px] text-[#666666] uppercase tracking-wider">Total Posts</p>
          <p className="text-lg font-bold text-[#E8E8E8] mt-0.5">{MOCK_PAST_POSTS.length}</p>
        </div>
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
          <p className="text-[11px] text-[#666666] uppercase tracking-wider">Scheduled</p>
          <p className="text-lg font-bold text-[#F5A623] mt-0.5">{scheduledPosts.length}</p>
        </div>
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-3 text-center">
          <p className="text-[11px] text-[#666666] uppercase tracking-wider">Best Slot</p>
          <p className="text-sm font-bold text-[#9B72CF] mt-0.5">{bestDay} {bestHour}</p>
        </div>
      </div>

      {/* Best Posting Times Heatmap */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#9B72CF]" />
          <span className="text-sm font-semibold text-[#E8E8E8]">Best Posting Times</span>
        </div>
        <div className="p-4 overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Hour headers */}
            <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '40px repeat(8, 1fr)' }}>
              <div />
              {HOURS.map((h) => (
                <div key={h} className="text-[10px] text-[#666666] text-center font-medium">{h}</div>
              ))}
            </div>
            {/* Rows */}
            {DAYS.map((day) => (
              <div key={day} className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '40px repeat(8, 1fr)' }}>
                <div className="text-[11px] text-[#888888] font-medium flex items-center">{day}</div>
                {HEATMAP_DATA[day].map((val, hi) => (
                  <div
                    key={hi}
                    className={`h-8 rounded-md ${heatColor(val)} flex items-center justify-center text-[10px] font-semibold ${
                      val >= 60 ? 'text-white' : val >= 30 ? 'text-[#E8E8E8]' : 'text-[#555555]'
                    }`}
                    title={`${day} ${HOURS[hi]}: ${val}% engagement`}
                  >
                    {val}
                  </div>
                ))}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center justify-end gap-3 mt-3">
              <span className="text-[10px] text-[#555555]">Low</span>
              <div className="flex gap-1">
                <div className="w-4 h-3 rounded-sm bg-[#222222]" />
                <div className="w-4 h-3 rounded-sm bg-[#F5A623]/30" />
                <div className="w-4 h-3 rounded-sm bg-[#F5A623]/50" />
                <div className="w-4 h-3 rounded-sm bg-[#00C48C]/50" />
                <div className="w-4 h-3 rounded-sm bg-[#00C48C]/80" />
              </div>
              <span className="text-[10px] text-[#555555]">High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Posts */}
      {scheduledPosts.length > 0 && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F5A623]" />
            <span className="text-sm font-semibold text-[#E8E8E8]">Scheduled Posts</span>
            <span className="ml-auto text-[11px] text-[#666666]">{scheduledPosts.length} upcoming</span>
          </div>
          <div className="divide-y divide-[#1A1A1A]">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="px-4 py-3 hover:bg-[#0D0D0D]/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-[#1A1A1A] shrink-0 mt-0.5">{postTypeIcon(post.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E8E8E8] truncate">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-[#F5A623]">
                        <Calendar className="w-3 h-3" />
                        {post.scheduledDate}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-[#888888]">
                        <Clock className="w-3 h-3" />
                        {post.scheduledTime}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F5A623]/10 text-[#F5A623]">
                        SCHEDULED
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Posts Performance */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#4A9EFF]" />
          <span className="text-sm font-semibold text-[#E8E8E8]">Past Post Performance</span>
        </div>
        <div className="divide-y divide-[#1A1A1A] max-h-80 overflow-y-auto custom-scrollbar">
          {MOCK_PAST_POSTS.map((post) => (
            <div key={post.id} className="px-4 py-3.5 hover:bg-[#0D0D0D]/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-[#1A1A1A] shrink-0 mt-0.5">{postTypeIcon(post.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#E8E8E8] truncate">{post.content}</p>
                  <p className="text-[11px] text-[#666666] mt-0.5">{post.date}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-[#E05252]">
                      <Heart className="w-3 h-3" />{formatNum(post.likes)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#4A9EFF]">
                      <MessageSquare className="w-3 h-3" />{formatNum(post.comments)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#888888]">
                      <Eye className="w-3 h-3" />{formatNum(post.views)}
                    </span>
                    <span className={`ml-auto text-[11px] font-bold ${post.engagement >= 20 ? 'text-[#00C48C]' : 'text-[#F5A623]'}`}>
                      {post.engagement}% engage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-[#444444] text-[11px]">
        Scheduling powered by engagement analytics · Posts are published automatically at the scheduled time
      </div>
    </div>
  );
}
