'use client';

import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';

const LEGAL_CONTENT: Record<string, { title: string; lastUpdated: string }> = {
  privacy: { title: 'Privacy Policy', lastUpdated: 'April 2025' },
  terms: { title: 'Terms of Service', lastUpdated: 'April 2025' },
  refund: { title: 'Refund Policy', lastUpdated: 'April 2025' },
  cookies: { title: 'Cookie Policy', lastUpdated: 'April 2025' },
};

interface LegalPageProps {
  type: string;
}

export function LegalPage({ type }: LegalPageProps) {
  const { setPage } = useNychIQStore();
  const info = LEGAL_CONTENT[type] || { title: 'Legal', lastUpdated: '' };

  return (
    <div className="min-h-screen bg-[#070707]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1E1E1E]">
        <button
          onClick={() => setPage('welcome')}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F5A623]" />
          <span className="text-sm font-bold text-gradient-amber">NychIQ</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#E8E8E8] mb-2">{info.title}</h1>
        {info.lastUpdated && (
          <p className="text-sm text-[#888888] mb-8">Last updated: {info.lastUpdated}</p>
        )}

        <div className="nychiq-card p-6">
          <div className="space-y-4 text-sm text-[#888888] leading-relaxed">
            <p>This is a placeholder for the <strong className="text-[#E8E8E8]">{info.title}</strong> content.</p>
            <p>The full legal text will be added in a subsequent task. This page demonstrates the correct layout, styling, and navigation structure.</p>
            <p>For questions about this policy, please contact us at <span className="text-[#4A9EFF]">legal@nychiq.com</span>.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1E1E1E] px-6 py-6 mt-12">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} NychIQ</span>
          <button onClick={() => setPage('privacy')} className="hover:text-text-secondary transition-colors">Privacy</button>
          <button onClick={() => setPage('terms')} className="hover:text-text-secondary transition-colors">Terms</button>
          <button onClick={() => setPage('contact')} className="hover:text-text-secondary transition-colors">Contact</button>
        </div>
      </footer>
    </div>
  );
}
