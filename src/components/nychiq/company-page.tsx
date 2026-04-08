'use client';

import React from 'react';
import { ArrowLeft, Sparkles, Mail, MapPin, Github } from 'lucide-react';
import { useNychIQStore } from '@/lib/store';

const PAGE_CONFIG: Record<string, { title: string; subtitle: string }> = {
  about: { title: 'About NychIQ', subtitle: 'YouTube Intelligence Platform' },
  contact: { title: 'Contact Us', subtitle: 'We\'d love to hear from you' },
  careers: { title: 'Careers', subtitle: 'Join the NychIQ team' },
  changelog: { title: 'Changelog', subtitle: 'Latest updates and improvements' },
};

interface CompanyPageProps {
  type: string;
}

export function CompanyPage({ type }: CompanyPageProps) {
  const { setPage } = useNychIQStore();
  const config = PAGE_CONFIG[type] || { title: 'NychIQ', subtitle: '' };

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
        <h1 className="text-3xl font-bold text-[#E8E8E8] mb-2">{config.title}</h1>
        <p className="text-[#888888] mb-8">{config.subtitle}</p>

        {type === 'contact' && (
          <div className="space-y-4">
            <div className="nychiq-card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[rgba(245,166,35,0.1)] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[#F5A623]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#E8E8E8]">Email</h3>
                <p className="text-sm text-[#888888] mt-0.5">support@nychiq.com</p>
              </div>
            </div>
            <div className="nychiq-card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[rgba(74,158,255,0.1)] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#4A9EFF]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#E8E8E8]">Location</h3>
                <p className="text-sm text-[#888888] mt-0.5">Remote-first, worldwide team</p>
              </div>
            </div>
            <div className="nychiq-card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[rgba(155,114,207,0.1)] flex items-center justify-center shrink-0">
                <Github className="w-5 h-5 text-[#9B72CF]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#E8E8E8]">Open Source</h3>
                <p className="text-sm text-[#888888] mt-0.5">github.com/nychiq</p>
              </div>
            </div>
          </div>
        )}

        {type === 'changelog' && (
          <div className="space-y-3">
            {[
              { ver: 'v1.0.0', date: 'Apr 2025', msg: 'Initial release — core intelligence features, Saku AI, viral predictor.' },
            ].map((entry) => (
              <div key={entry.ver} className="nychiq-card p-4 flex items-start gap-4">
                <span className="text-xs font-bold text-[#F5A623] bg-[rgba(245,166,35,0.1)] px-2 py-1 rounded">{entry.ver}</span>
                <div>
                  <p className="text-sm text-[#E8E8E8]">{entry.msg}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{entry.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!['contact', 'changelog'].includes(type) && (
          <div className="nychiq-card p-6">
            <div className="space-y-4 text-sm text-[#888888] leading-relaxed">
              <p>Content for the <strong className="text-[#E8E8E8]">{config.title}</strong> page will be added in a subsequent task.</p>
              <p>This page demonstrates the correct layout, styling, and navigation structure for company-related pages.</p>
            </div>
          </div>
        )}
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
