'use client';

import React from 'react';
import { Globe, Smartphone, Monitor, Users, MapPin, Heart } from 'lucide-react';

const AGE_DATA = [
  { range: '18-24', percent: 32 }, { range: '25-34', percent: 38 },
  { range: '35-44', percent: 16 }, { range: '45-54', percent: 9 },
  { range: '55-64', percent: 3 }, { range: '65+', percent: 2 },
];

const GENDER = { male: 62, female: 34, other: 4 };

const LOCATIONS = [
  { country: '🇺🇸 United States', percent: 35 },
  { country: '🇬🇧 United Kingdom', percent: 18 },
  { country: '🇨🇦 Canada', percent: 12 },
  { country: '🇦🇺 Australia', percent: 8 },
  { country: '🇩🇪 Germany', percent: 7 },
  { country: '🇮🇳 India', percent: 6 },
  { country: '🇳🇬 Nigeria', percent: 5 },
  { country: '🇧🇷 Brazil', percent: 4 },
  { country: '🇯🇵 Japan', percent: 3 },
  { country: 'Other', percent: 2 },
];

const DEVICES = [
  { label: 'Mobile', percent: 58, icon: <Smartphone className="w-4 h-4" />, color: '#4A9EFF' },
  { label: 'Desktop', percent: 28, icon: <Monitor className="w-4 h-4" />, color: '#9B72CF' },
  { label: 'Tablet', percent: 8, icon: <Monitor className="w-4 h-4" />, color: '#F5A623' },
  { label: 'Smart TV', percent: 6, icon: <Monitor className="w-4 h-4" />, color: '#00C48C' },
];

const INTERESTS = [
  'Technology', 'AI & ML', 'Coding', 'Productivity', 'Web Dev', 'Startups',
  'Gadgets', 'Software', 'Design', 'Business', 'Finance', 'Remote Work',
  'Cloud Computing', 'Mobile Dev', 'Data Science', 'DevOps',
];

export function AudienceDemographicsTool() {
  const maxAge = Math.max(...AGE_DATA.map((a) => a.percent));

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(74,158,255,0.1)]">
            <Globe className="w-5 h-5 text-[#4A9EFF]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E8E8E8]">Audience Demographics</h2>
            <p className="text-xs text-[#888888] mt-0.5">Age, gender, location, interests, and device breakdown.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Age Distribution */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[#E8E8E8] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#9B72CF]" /> Age Distribution
          </h3>
          <div className="space-y-2.5">
            {AGE_DATA.map((item) => (
              <div key={item.range} className="flex items-center gap-3">
                <span className="text-xs text-[#888888] w-12 shrink-0">{item.range}</span>
                <div className="flex-1 h-5 bg-[#0D0D0D] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#9B72CF]/70 to-[#9B72CF] transition-all duration-500"
                    style={{ width: `${(item.percent / maxAge) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-[#E8E8E8] w-10 text-right">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Split */}
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-[#E8E8E8] mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#E05252]" /> Gender Split
          </h3>
          <div className="flex gap-1 h-8 rounded-full overflow-hidden mb-4">
            <div className="bg-[#4A9EFF] flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${GENDER.male}%` }}>
              {GENDER.male}%
            </div>
            <div className="bg-[#E0529A] flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${GENDER.female}%` }}>
              {GENDER.female}%
            </div>
            <div className="bg-[#9B72CF] flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${GENDER.other}%` }}>
              {GENDER.other}%
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#4A9EFF]" /><span className="text-xs text-[#888888]">Male ({GENDER.male}%)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#E0529A]" /><span className="text-xs text-[#888888]">Female ({GENDER.female}%)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#9B72CF]" /><span className="text-xs text-[#888888]">Other ({GENDER.other}%)</span></div>
          </div>

          {/* Device Breakdown */}
          <h3 className="text-sm font-semibold text-[#E8E8E8] mt-6 mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#4A9EFF]" /> Device Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {DEVICES.map((d) => (
              <div key={d.label} className="rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] p-3 flex items-center gap-3">
                <div className="p-1.5 rounded-md" style={{ backgroundColor: `${d.color}15`, color: d.color }}>{d.icon}</div>
                <div>
                  <p className="text-sm font-bold text-[#E8E8E8]">{d.percent}%</p>
                  <p className="text-[10px] text-[#888888]">{d.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Locations */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#E8E8E8] mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#00C48C]" /> Top Locations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LOCATIONS.map((loc, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#333] transition-colors">
              <span className="text-sm text-[#E8E8E8]">{loc.country}</span>
              <span className="text-xs font-bold text-[#888888]">{loc.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Interests */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-[#E8E8E8] mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#F5A623]" /> Top Audience Interests
        </h3>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <span key={interest} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#0D0D0D] border border-[#1A1A1A] text-[#888888] hover:text-[#F5A623] hover:border-[rgba(245,166,35,0.3)] transition-colors cursor-default">
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
