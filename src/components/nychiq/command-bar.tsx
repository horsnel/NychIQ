'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, ArrowRight, LogOut } from 'lucide-react';
import { useNychIQStore, TOOL_META } from '@/lib/store';
import { cn } from '@/lib/utils';

export function CommandBar() {
  const { commandBarOpen, setCommandBarOpen, setActiveTool, setPage, logout } = useNychIQStore();
  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCommandBarOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandBarOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandBarOpen]);

  const filteredTools = Object.entries(TOOL_META).filter(([, meta]) =>
    meta.label.toLowerCase().includes(query.toLowerCase())
  );

  const selectTool = useCallback((toolId: string) => {
    setActiveTool(toolId);
    setPage('app');
    setCommandBarOpen(false);
    setQuery('');
  }, [setActiveTool, setPage, setCommandBarOpen]);

  if (!commandBarOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60" onClick={() => setCommandBarOpen(false)} />
      <div className="relative w-full max-w-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] rounded-xl shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <Search className="w-4 h-4 text-[#666666] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, features..."
            className="flex-1 bg-transparent text-sm text-[#FFFFFF] placeholder-text-muted outline-none"
            autoFocus
          />
          <button
            onClick={() => setCommandBarOpen(false)}
            className="p-1 rounded text-[#666666] hover:text-[#FFFFFF]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#666666]">No results found</div>
          ) : (
            filteredTools.map(([id, meta]) => (
              <button
                key={id}
                onClick={() => selectTool(id)}
                className="group flex items-center justify-between w-full px-3 py-2 rounded-md text-sm text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
              >
                <span>{meta.label}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}

          {/* Sign Out action */}
          <div className="border-t border-[rgba(255,255,255,0.06)] mt-1 pt-1">
            <button
              onClick={() => {
                logout();
                setCommandBarOpen(false);
                setQuery('');
              }}
              className="group flex items-center justify-between w-full px-3 py-2 rounded-md text-sm text-[#888888] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
