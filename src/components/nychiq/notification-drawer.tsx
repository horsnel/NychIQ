'use client';

import React from 'react';
import { X, Bell, Check } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const SAMPLE_NOTIFS: Notification[] = [
  { id: '1', title: 'Welcome to NychIQ', message: 'Your trial account is ready with 50 tokens.', time: 'Just now', read: false, type: 'info' },
  { id: '2', title: 'Trending Alert', message: 'Your niche "Tech Reviews" has 3 viral videos today.', time: '2h ago', read: false, type: 'success' },
  { id: '3', title: 'Token Low', message: 'You have less than 10 tokens remaining.', time: '1d ago', read: true, type: 'warning' },
];

export function NotificationDrawer() {
  const { notifDrawerOpen, setNotifDrawerOpen } = useNychIQStore();

  return (
    <>
      {/* Overlay */}
      {notifDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setNotifDrawerOpen(false)} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#111] border-l border-[#222] z-50 transition-transform duration-300 ${
          notifDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E1E]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F5A623]" />
            <h2 className="text-base font-semibold">Notifications</h2>
          </div>
          <button
            onClick={() => setNotifDrawerOpen(false)}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-[#1A1A1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-57px)] p-3 space-y-2">
          {SAMPLE_NOTIFS.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border transition-colors ${
                notif.read
                  ? 'bg-[#0A0A0A] border-[#1E1E1E]'
                  : 'bg-[#0A0A0A] border-[#F5A62333]'
              }`}
            >
              <div className="flex items-start gap-2">
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-[#F5A623] mt-1.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E8E8E8]">{notif.title}</p>
                  <p className="text-xs text-[#888888] mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-[#555555] mt-1">{notif.time}</p>
                </div>
              </div>
            </div>
          ))}

          {SAMPLE_NOTIFS.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
