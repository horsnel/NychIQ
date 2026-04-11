'use client';

import React, { useState } from 'react';
import {
  Search,
  DollarSign,
  Star,
  Clock,
  TrendingUp,
  Tag,
  ChevronDown,
  ChevronUp,
  Percent,
  BarChart3,
} from 'lucide-react';

interface AffiliateProgram {
  id: string;
  name: string;
  commission: string;
  cookieDays: number;
  rating: number;
  revenuePotential: string;
  category: string;
  expanded?: boolean;
}

const MOCK_PROGRAMS: AffiliateProgram[] = [
  { id: '1', name: 'Amazon Associates', commission: '1-10%', cookieDays: 24, rating: 4.5, revenuePotential: '$800 – $2,400/mo', category: 'E-Commerce' },
  { id: '2', name: 'ShareASale', commission: '5-30%', cookieDays: 30, rating: 4.3, revenuePotential: '$1,200 – $4,500/mo', category: 'Multi-Network' },
  { id: '3', name: 'Impact Radius', commission: '3-15%', cookieDays: 30, rating: 4.7, revenuePotential: '$1,500 – $5,000/mo', category: 'SaaS/Enterprise' },
  { id: '4', name: 'ClickBank', commission: '50-75%', cookieDays: 60, rating: 3.8, revenuePotential: '$2,000 – $8,000/mo', category: 'Digital Products' },
  { id: '5', name: 'CJ Affiliate', commission: '3-20%', cookieDays: 30, rating: 4.2, revenuePotential: '$900 – $3,200/mo', category: 'Multi-Network' },
  { id: '6', name: 'Shopify Partners', commission: '20% recurring', cookieDays: 30, rating: 4.6, revenuePotential: '$1,800 – $6,000/mo', category: 'E-Commerce/SaaS' },
];

const CATEGORIES = ['All', 'E-Commerce', 'SaaS/Enterprise', 'Digital Products', 'Multi-Network'];

export function AffiliateFinderTool() {
  const [niche, setNiche] = useState('');
  const [programs, setPrograms] = useState<AffiliateProgram[]>(MOCK_PROGRAMS);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('All');
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    if (!niche.trim()) return;
    setSearching(true);
    setTimeout(() => {
      setPrograms(MOCK_PROGRAMS);
      setSearching(false);
    }, 1000);
  };

  const filtered = activeCategory === 'All'
    ? programs
    : programs.filter((p) => p.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          style={{ color: i < Math.floor(rating) ? '#F5A623' : '#333', fill: i < Math.floor(rating) ? '#F5A623' : 'none' }}
        />
      ))}
      <span className="text-[10px] text-[#888] ml-1">{rating}</span>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(245,166,35,0.1)]">
            <DollarSign className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Affiliate Finder</h2>
            <p className="text-xs text-[#888888] mt-0.5">Discover high-paying affiliate programs matched to your niche.</p>
          </div>
        </div>

        {/* Niche Input */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <Search className="w-4 h-4 text-[#666]" />
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your niche (e.g., Tech, Fitness)..."
              className="flex-1 bg-transparent text-sm text-[#E8E8E8] placeholder:text-[#555] outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 h-11 rounded-lg bg-[#F5A623] text-[#0A0A0A] text-sm font-bold hover:bg-[#E6960F] transition-colors disabled:opacity-50 shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-[#F5A623] text-[#0A0A0A]'
                : 'bg-[#111111] text-[#888] border border-[#222] hover:border-[#333]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Program List */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
        <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-[#F5A623]" />
          Matching Programs ({filtered.length})
        </h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filtered.map((prog) => (
            <div key={prog.id} className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#111] transition-colors"
                onClick={() => toggleExpand(prog.id)}
              >
                <div className="w-10 h-10 rounded-lg bg-[rgba(245,166,35,0.1)] flex items-center justify-center shrink-0">
                  <Percent className="w-5 h-5 text-[#F5A623]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#E8E8E8]">{prog.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(74,158,255,0.1)] text-[#4A9EFF]">{prog.category}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[#00C48C] font-bold">{prog.commission}</span>
                    <span className="text-[10px] text-[#666] flex items-center gap-1"><Clock className="w-3 h-3" /> {prog.cookieDays}d cookie</span>
                    {renderStars(prog.rating)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-[#F5A623]">{prog.revenuePotential}</p>
                </div>
                {expandedIds.has(prog.id) ? <ChevronUp className="w-4 h-4 text-[#666]" /> : <ChevronDown className="w-4 h-4 text-[#666]" />}
              </div>
              {expandedIds.has(prog.id) && (
                <div className="px-3 pb-3 border-t border-[#1A1A1A] pt-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2 rounded-md bg-[#0A0A0A]">
                      <p className="text-[10px] text-[#666]">Commission</p>
                      <p className="text-sm font-bold text-[#00C48C]">{prog.commission}</p>
                    </div>
                    <div className="p-2 rounded-md bg-[#0A0A0A]">
                      <p className="text-[10px] text-[#666]">Cookie Length</p>
                      <p className="text-sm font-bold text-[#4A9EFF]">{prog.cookieDays} days</p>
                    </div>
                    <div className="p-2 rounded-md bg-[#0A0A0A]">
                      <p className="text-[10px] text-[#666]">Rating</p>
                      <p className="text-sm font-bold text-[#F5A623]">{prog.rating}/5</p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 rounded-md bg-[rgba(245,166,35,0.05)] border border-[rgba(245,166,35,0.15)]">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-[#F5A623]" />
                      <span className="text-[10px] font-bold text-[#F5A623]">Revenue Potential</span>
                    </div>
                    <p className="text-sm text-[#E8E8E8] mt-1">{prog.revenuePotential} based on your niche and audience size.</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
