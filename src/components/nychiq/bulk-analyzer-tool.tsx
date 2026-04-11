'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Link,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Target,
  Clock,
  Star,
  Loader2,
  TrendingUp,
} from 'lucide-react';

interface VideoResult {
  id: string;
  title: string;
  url: string;
  views: string;
  ctr: string;
  retention: string;
  score: number;
  expanded?: boolean;
  details: {
    likes: string;
    comments: string;
    subscribers: string;
    avgViewDuration: string;
    topKeywords: string[];
  };
}

const MOCK_RESULTS: VideoResult[] = [
  { id: '1', title: 'How I Made $50K on YouTube in 6 Months', url: 'youtube.com/watch?v=abc', views: '1.2M', ctr: '8.4%', retention: '62%', score: 94, details: { likes: '89K', comments: '4.2K', subscribers: '+18K', avgViewDuration: '6:12', topKeywords: ['youtube money', 'make money online', 'passive income'] } },
  { id: '2', title: 'Best Budget Camera for YouTube 2025', url: 'youtube.com/watch?v=def', views: '845K', ctr: '6.1%', retention: '54%', score: 82, details: { likes: '52K', comments: '3.1K', subscribers: '+12K', avgViewDuration: '8:45', topKeywords: ['budget camera', 'youtube camera', 'camera 2025'] } },
  { id: '3', title: 'YouTube Algorithm Secrets Revealed', url: 'youtube.com/watch?v=ghi', views: '2.1M', ctr: '11.2%', retention: '71%', score: 97, details: { likes: '142K', comments: '8.9K', subscribers: '+35K', avgViewDuration: '10:03', topKeywords: ['youtube algorithm', 'how youtube works', 'grow channel'] } },
  { id: '4', title: 'I Tried Every Free Video Editor', url: 'youtube.com/watch?v=jkl', views: '420K', ctr: '5.3%', retention: '48%', score: 68, details: { likes: '28K', comments: '1.8K', subscribers: '+6K', avgViewDuration: '7:22', topKeywords: ['free video editor', 'video editing', 'edit videos'] } },
  { id: '5', title: 'How to Get 1000 Subscribers Fast', url: 'youtube.com/watch?v=mno', views: '1.8M', ctr: '9.7%', retention: '58%', score: 88, details: { likes: '98K', comments: '5.6K', subscribers: '+28K', avgViewDuration: '9:15', topKeywords: ['get subscribers', '1000 subscribers', 'grow fast'] } },
];

function scoreColor(score: number): string {
  if (score >= 90) return '#00C48C';
  if (score >= 75) return '#F5A623';
  return '#E05252';
}

export function BulkAnalyzerTool() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!urls.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setAnalyzing(false);
    }, 1200);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(155,114,207,0.1)]">
            <BarChart3 className="w-5 h-5 text-[#9B72CF]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Bulk Analyzer</h2>
            <p className="text-xs text-[#888888] mt-0.5">Analyze multiple videos at once. Compare CTR, retention, and performance scores.</p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <Link className="w-4 h-4 text-[#666] mt-0.5 shrink-0" />
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Paste video URLs here (one per line)...&#10;https://youtube.com/watch?v=...&#10;https://youtube.com/watch?v=..."
              rows={3}
              className="flex-1 bg-transparent text-sm text-[#E8E8E8] placeholder:text-[#555] outline-none resize-none"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !urls.trim()}
            className="w-full sm:w-auto px-5 h-11 rounded-lg bg-[#9B72CF] text-white text-sm font-bold hover:bg-[#8B62BF] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Analyze Videos
          </button>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && !analyzing && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#9B72CF]" />
              Analysis Results ({results.length} videos)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  <th className="text-[10px] font-bold text-[#666] uppercase tracking-wider pb-2 pr-3">Video</th>
                  <th className="text-[10px] font-bold text-[#666] uppercase tracking-wider pb-2 px-2"><Eye className="w-3 h-3 inline" /></th>
                  <th className="text-[10px] font-bold text-[#666] uppercase tracking-wider pb-2 px-2"><Target className="w-3 h-3 inline" /></th>
                  <th className="text-[10px] font-bold text-[#666] uppercase tracking-wider pb-2 px-2"><Clock className="w-3 h-3 inline" /></th>
                  <th className="text-[10px] font-bold text-[#666] uppercase tracking-wider pb-2 px-2"><Star className="w-3 h-3 inline" /></th>
                  <th className="text-[10px] font-bold text-[#666] uppercase tracking-wider pb-2 pl-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((v) => (
                  <React.Fragment key={v.id}>
                    <tr
                      className="border-b border-[#1A1A1A] hover:bg-[#0D0D0D] cursor-pointer transition-colors"
                      onClick={() => toggleExpand(v.id)}
                    >
                      <td className="py-2.5 pr-3">
                        <p className="text-sm font-medium text-[#E8E8E8] truncate max-w-[240px]">{v.title}</p>
                      </td>
                      <td className="py-2.5 px-2 text-sm text-[#AAAAAA]">{v.views}</td>
                      <td className="py-2.5 px-2 text-sm font-medium text-[#F5A623]">{v.ctr}</td>
                      <td className="py-2.5 px-2 text-sm text-[#4A9EFF]">{v.retention}</td>
                      <td className="py-2.5 px-2">
                        <span className="text-sm font-bold" style={{ color: scoreColor(v.score) }}>{v.score}</span>
                      </td>
                      <td className="py-2.5 pl-3 text-[#666]">
                        {expandedIds.has(v.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>
                    {expandedIds.has(v.id) && (
                      <tr>
                        <td colSpan={6} className="py-3 px-2">
                          <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A]">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                              <div><p className="text-[10px] text-[#666] uppercase">Likes</p><p className="text-sm font-bold text-[#E8E8E8]">{v.details.likes}</p></div>
                              <div><p className="text-[10px] text-[#666] uppercase">Comments</p><p className="text-sm font-bold text-[#E8E8E8]">{v.details.comments}</p></div>
                              <div><p className="text-[10px] text-[#666] uppercase">Subscribers</p><p className="text-sm font-bold text-[#00C48C]">{v.details.subscribers}</p></div>
                              <div><p className="text-[10px] text-[#666] uppercase">Avg Duration</p><p className="text-sm font-bold text-[#E8E8E8]">{v.details.avgViewDuration}</p></div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {v.details.topKeywords.map((kw, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[rgba(74,158,255,0.1)] text-[#4A9EFF]">{kw}</span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !analyzing && (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg bg-[#111111] border border-[#222222]">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(155,114,207,0.1)] border border-[rgba(155,114,207,0.2)] flex items-center justify-center mb-3">
            <BarChart3 className="w-7 h-7 text-[#9B72CF]" />
          </div>
          <h3 className="text-sm font-semibold text-[#E8E8E8] mb-1">Paste Video URLs</h3>
          <p className="text-xs text-[#666] max-w-xs text-center">Enter one or more YouTube video URLs to start bulk analysis.</p>
        </div>
      )}
    </div>
  );
}
