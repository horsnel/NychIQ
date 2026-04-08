'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useNychIQStore, TOOL_META } from '@/lib/store';
import { cn } from '@/lib/utils';

export function CommandBar() {
  const { commandBarOpen, setCommandBarOpen, setActiveTool, setPage } = useNychIQStore();
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
      <div className="relative w-full max-w-lg bg-[#111] border border-[#222] rounded-xl shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E]">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, features..."
            className="flex-1 bg-transparent text-sm text-[#E8E8E8] placeholder-text-muted outline-none"
            autoFocus
          />
          <button
            onClick={() => setCommandBarOpen(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-6 text-center text-sm text-text-muted">No results found</div>
          ) : (
            filteredTools.map(([id, meta]) => (
              <button
                key={id}
                onClick={() => selectTool(id)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm text-[#888888] hover:text-[#E8E8E8] hover:bg-[#1A1A1A] transition-colors"
              >
                <span>{meta.label}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
