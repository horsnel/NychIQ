'use client';

import React, { useState } from 'react';
import {
  Users,
  Shield,
  Send,
  Mail,
  Clock,
  Check,
  X,
  MoreHorizontal,
  Crown,
  Eye,
  Edit3,
  Trash2,
  Settings,
  Activity,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  avatar: string;
  lastActive: string;
  permissions: string[];
}

interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'upload' | 'edit' | 'settings' | 'comment';
}

const ROLE_CONFIG: Record<string, { color: string; bg: string; icon: typeof Shield }> = {
  Owner: { color: '#F5A623', bg: 'rgba(245,166,35,0.1)', icon: Crown },
  Admin: { color: '#E05252', bg: 'rgba(224,82,82,0.1)', icon: Shield },
  Editor: { color: '#4A9EFF', bg: 'rgba(74,158,255,0.1)', icon: Edit3 },
  Viewer: { color: '#888888', bg: 'rgba(136,136,136,0.1)', icon: Eye },
};

const PERMISSIONS = ['View Analytics', 'Edit Videos', 'Manage Team', 'Upload', 'Delete', 'Settings'];

const MOCK_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@studio.com', role: 'Owner', avatar: 'AJ', lastActive: 'Online', permissions: ['View Analytics', 'Edit Videos', 'Manage Team', 'Upload', 'Delete', 'Settings'] },
  { id: '2', name: 'Sarah Chen', email: 'sarah@studio.com', role: 'Admin', avatar: 'SC', lastActive: '5m ago', permissions: ['View Analytics', 'Edit Videos', 'Manage Team', 'Upload', 'Delete'] },
  { id: '3', name: 'Mike Rivera', email: 'mike@studio.com', role: 'Editor', avatar: 'MR', lastActive: '2h ago', permissions: ['View Analytics', 'Edit Videos', 'Upload'] },
  { id: '4', name: 'Emily Park', email: 'emily@studio.com', role: 'Viewer', avatar: 'EP', lastActive: '1d ago', permissions: ['View Analytics'] },
];

const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: '1', user: 'Alex Johnson', action: 'Updated channel settings', time: '10m ago', type: 'settings' },
  { id: '2', user: 'Sarah Chen', action: 'Uploaded "React 19 Deep Dive"', time: '1h ago', type: 'upload' },
  { id: '3', user: 'Mike Rivera', action: 'Edited "VS Code Extensions" video', time: '3h ago', type: 'edit' },
  { id: '4', user: 'Alex Johnson', action: 'Commented on thumbnail design', time: '5h ago', type: 'comment' },
];

const ACTIVITY_COLORS: Record<string, string> = {
  upload: '#00C48C',
  edit: '#4A9EFF',
  settings: '#F5A623',
  comment: '#9B72CF',
};

export function TeamRolesTool() {
  const [members] = useState<TeamMember[]>(MOCK_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'permissions' | 'activity'>('members');

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setInviteEmail('');
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#111111] border border-[#222222] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(224,82,82,0.1)]">
            <Users className="w-5 h-5 text-[#E05252]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#E8E8E8]">Team Roles</h2>
            <p className="text-xs text-[#888888] mt-0.5">Manage team members, permissions, and access control.</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[rgba(224,82,82,0.1)] text-[#E05252]">{members.length} members</span>
        </div>

        {/* Invite */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
            <Mail className="w-4 h-4 text-[#666]" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="Enter email to invite..."
              className="flex-1 bg-transparent text-sm text-[#E8E8E8] placeholder:text-[#555] outline-none"
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={!inviteEmail.trim()}
            className="px-3 h-10 rounded-lg bg-[#E05252] text-white text-xs font-bold hover:bg-[#C94545] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Invite
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[#111111] border border-[#222222]">
        {[
          { key: 'members' as const, label: 'Members', icon: Users },
          { key: 'permissions' as const, label: 'Permissions', icon: Shield },
          { key: 'activity' as const, label: 'Activity', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key ? 'bg-[#E05252] text-white' : 'text-[#888] hover:text-[#E8E8E8]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members List */}
      {activeTab === 'members' && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {members.map((m) => {
              const cfg = ROLE_CONFIG[m.role];
              const Icon = cfg.icon;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] hover:border-[#2A2A2A] transition-colors">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: cfg.color }}>
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#E8E8E8]">{m.name}</p>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        <Icon className="w-3 h-3" /> {m.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#666] mt-0.5">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] ${m.lastActive === 'Online' ? 'text-[#00C48C]' : 'text-[#555]'}`}>{m.lastActive}</span>
                    <button className="p-1 rounded hover:bg-[#1A1A1A] text-[#555] hover:text-[#E8E8E8] transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Permission Matrix */}
      {activeTab === 'permissions' && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3">Permission Matrix</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  <th className="text-[10px] font-bold text-[#666] uppercase pb-2 pr-4">Permission</th>
                  {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                    <th key={role} className="text-[10px] font-bold uppercase pb-2 px-2 text-center" style={{ color: cfg.color }}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm, i) => (
                  <tr key={i} className="border-b border-[#1A1A1A] last:border-0">
                    <td className="py-2 pr-4 text-[#AAAAAA]">{perm}</td>
                    {['Owner', 'Admin', 'Editor', 'Viewer'].map((role) => {
                      const hasPermission = members.find((m) => m.role === role)?.permissions.includes(perm);
                      return (
                        <td key={role} className="py-2 px-2 text-center">
                          {hasPermission ? (
                            <Check className="w-4 h-4 text-[#00C48C] inline" />
                          ) : (
                            <X className="w-4 h-4 text-[#333] inline" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {activeTab === 'activity' && (
        <div className="rounded-lg bg-[#111111] border border-[#222222] p-4">
          <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#888]" />
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {MOCK_ACTIVITY.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ACTIVITY_COLORS[entry.type] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#E8E8E8]"><span className="font-medium">{entry.user}</span> {entry.action}</p>
                  <p className="text-[10px] text-[#666] mt-0.5">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
