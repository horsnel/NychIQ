'use client';

import React, { useState } from 'react';
import {
  FileText,
  Users,
  Download,
  Eye,
  Calendar,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  FileDown,
  Loader2,
  LayoutTemplate,
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

interface Client {
  id: string;
  name: string;
  company: string;
  lastReport: string;
  status: 'Active' | 'Paused';
}

const MOCK_TEMPLATES: ReportTemplate[] = [
  { id: '1', name: 'Monthly Performance', description: 'Full channel analytics, growth metrics, and content performance.', sections: ['Overview', 'Growth', 'Top Videos', 'Revenue', 'Recommendations'] },
  { id: '2', name: 'Campaign Report', description: 'Specific campaign results with ROI and KPI tracking.', sections: ['Campaign Summary', 'KPIs', 'ROI', 'Content Breakdown'] },
  { id: '3', name: 'Quarterly Review', description: 'Deep-dive quarterly analysis with competitive benchmarking.', sections: ['Q Summary', 'Benchmark', 'Strategy', 'Next Quarter'] },
];

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'David Kim', company: 'TechFlow Inc.', lastReport: 'Jan 10, 2025', status: 'Active' },
  { id: '2', name: 'Lisa Chen', company: 'GrowthLab', lastReport: 'Dec 28, 2024', status: 'Active' },
  { id: '3', name: 'Mark Stevens', company: 'BrandWorks', lastReport: 'Nov 15, 2024', status: 'Paused' },
  { id: '4', name: 'Ana Rodriguez', company: 'ContentPro', lastReport: 'Jan 5, 2025', status: 'Active' },
];

export function ClientReportingTool() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>('1');
  const [selectedClient, setSelectedClient] = useState<string | null>('1');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const currentTemplate = MOCK_TEMPLATES.find((t) => t.id === selectedTemplate);
  const currentClient = MOCK_CLIENTS.find((c) => c.id === selectedClient);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
            <FileText className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Client Reporting</h2>
            <p className="text-xs text-[#888888] mt-0.5">Generate and export professional reports for your clients.</p>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
          <LayoutTemplate className="w-3.5 h-3.5 text-[#F5A623]" />
          Report Template
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {MOCK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => { setSelectedTemplate(tpl.id); setGenerated(false); }}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedTemplate === tpl.id
                  ? 'bg-[rgba(245,166,35,0.05)] border-[#F5A623]/40'
                  : 'bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#2A2A2A]'
              }`}
            >
              <p className="text-sm font-medium" style={{ color: selectedTemplate === tpl.id ? '#F5A623' : '#E8E8E8' }}>{tpl.name}</p>
              <p className="text-[10px] text-[#666] mt-1 leading-relaxed">{tpl.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {tpl.sections.map((s, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1A1A] text-[#888]">{s}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#9B72CF]" />
          Select Client
        </h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {MOCK_CLIENTS.map((client) => (
            <button
              key={client.id}
              onClick={() => { setSelectedClient(client.id); setGenerated(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                selectedClient === client.id
                  ? 'bg-[rgba(155,114,207,0.05)] border-[#9B72CF]/40'
                  : 'bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#2A2A2A]'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-[rgba(155,114,207,0.1)] flex items-center justify-center text-xs font-bold text-[#9B72CF] shrink-0">
                {client.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#E8E8E8]">{client.name}</p>
                <p className="text-[10px] text-[#666]">{client.company}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${client.status === 'Active' ? 'bg-[rgba(0,196,140,0.1)] text-[#00C48C]' : 'bg-[rgba(136,136,136,0.1)] text-[#888]'}`}>
                  {client.status}
                </span>
                <p className="text-[10px] text-[#555] mt-1 flex items-center gap-1 justify-end"><Calendar className="w-3 h-3" /> {client.lastReport}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedTemplate || !selectedClient}
          className="flex-1 px-5 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
        <button
          disabled={!generated}
          className="px-5 h-11 rounded-lg bg-[#111] text-[#E8E8E8] text-sm font-medium border border-[#222] hover:border-[#333] transition-colors disabled:opacity-30 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Report Preview */}
      {generated && !generating && currentTemplate && currentClient && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#00C48C]" />
              Report Preview
            </h4>
            <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
          </div>
          <div className="p-4 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
              <div>
                <p className="text-base font-bold text-[#E8E8E8]">{currentTemplate.name}</p>
                <p className="text-[10px] text-[#666]">Generated for {currentClient.name} · {currentClient.company}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#00C48C]" />
            </div>
            {currentTemplate.sections.map((section, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-[#0A0A0A] border border-[#1A1A1A]">
                <FileDown className="w-4 h-4 text-[#F5A623]" />
                <span className="text-sm text-[#E8E8E8]">{section}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C48C] ml-auto" />
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 text-[10px] text-[#666]">
              <FileDown className="w-3.5 h-3.5" />
              <span>Ready to export · PDF, CSV, or shareable link</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
