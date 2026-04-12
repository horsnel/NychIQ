'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNychIQStore, type TeamMember, type PendingInvite, type TeamActivity } from '@/lib/store';
import { showToast } from '@/lib/toast';
import { getInitials, copyToClipboard } from '@/lib/utils';
import {
  UsersRound, Shield, Eye, BarChart3, Plus, X, Mail, Copy, Check,
  Send, RefreshCw, Crown, UserCog, ClipboardCheck, ChevronDown,
  Clock, AlertCircle, UserMinus, UserPlus, ToggleLeft, ToggleRight,
  Activity, Link2, MoreHorizontal, Trash2, CheckCircle2, XCircle,
  type LucideIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Constants & Types
   ═══════════════════════════════════════════ */
type Role = TeamMember['role'];
type Status = TeamMember['status'];

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; border: string; icon: LucideIcon; desc: string }> = {
  owner:   { label: 'Owner',   color: '#FDBA2D', bg: 'rgba(253,186,45,0.1)',  border: 'rgba(253,186,45,0.25)', icon: Crown,          desc: 'Full access + team management + billing' },
  admin:   { label: 'Admin',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', icon: UserCog,        desc: 'All tools + channel management' },
  analyst: { label: 'Analyst', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', icon: BarChart3,       desc: 'Read-only analytics + reports' },
  viewer:  { label: 'Viewer',  color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: Eye,             desc: 'Dashboard only' },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  active:   { label: 'Active',   color: '#10B981', dot: 'bg-[#10B981]' },
  inactive: { label: 'Inactive', color: '#666666', dot: 'bg-[#666666]' },
  invited:  { label: 'Invited',  color: '#FDBA2D', dot: 'bg-[#FDBA2D]' },
};

const ACTION_COLORS: Record<string, string> = {
  add: '#10B981',
  remove: '#EF4444',
  update: '#3B82F6',
  invite: '#FDBA2D',
};

const MOCK_CHANNELS = [
  { id: 'ch-1', name: 'TechVision Pro', color: '#3B82F6' },
  { id: 'ch-2', name: 'FitLife Academy', color: '#10B981' },
  { id: 'ch-3', name: 'Crypto Daily', color: '#FDBA2D' },
  { id: 'ch-4', name: 'Art Studio NG', color: '#8B5CF6' },
  { id: 'ch-5', name: 'EduTech Masters', color: '#EF4444' },
];

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#FDBA2D', '#EF4444', '#EC4899', '#06B6D4', '#F97316'];

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function pickColorForEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function Avatar({ name, color, size = 36, status }: { name: string; color: string; size?: number; status?: Status }) {
  const initials = getInitials(name);
  const statusInfo = status ? STATUS_CONFIG[status] : null;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-bold text-white"
        style={{ backgroundColor: color, fontSize: size * 0.38 }}
      >
        {initials}
      </div>
      {statusInfo && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#141414] ${statusInfo.dot}`}
          title={statusInfo.label}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-2">
      {children}
    </h3>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Role Permissions Table
   ═══════════════════════════════════════════ */
const PERMISSION_ROWS = [
  { feature: 'Dashboard', owner: true, admin: true, analyst: true, viewer: true },
  { feature: 'Analytics & Reports', owner: true, admin: true, analyst: true, viewer: false },
  { feature: 'SEO Tools', owner: true, admin: true, analyst: true, viewer: false },
  { feature: 'Channel Management', owner: true, admin: true, analyst: false, viewer: false },
  { feature: 'Content Tools (Script, Hook, Ideas)', owner: true, admin: true, analyst: false, viewer: false },
  { feature: 'Team Management', owner: true, admin: false, analyst: false, viewer: false },
  { feature: 'Billing & Plans', owner: true, admin: false, analyst: false, viewer: false },
];

function PermissionsTable() {
  return (
    <Card>
      <SectionHeader>
        <Shield className="w-3.5 h-3.5 text-[#FDBA2D]" />
        Role-Based Permissions
      </SectionHeader>
      <p className="text-[11px] text-[#555555] mt-1 mb-4">
        Each role has different levels of access across the platform tools and features.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1F1F1F]">
              <th className="text-left py-2.5 pr-4 text-[#A3A3A3] font-semibold">Feature</th>
              {(['owner', 'admin', 'analyst', 'viewer'] as const).map((role) => {
                const cfg = ROLE_CONFIG[role];
                return (
                  <th key={role} className="text-center py-2.5 px-2 min-w-[70px]">
                    <span className="flex items-center justify-center gap-1" style={{ color: cfg.color }}>
                      <cfg.icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_ROWS.map((row, i) => (
              <tr key={i} className="border-b border-[#1A1A1A] last:border-0 hover:bg-[rgba(253,186,45,0.02)] transition-colors">
                <td className="py-2.5 pr-4 text-[#FFFFFF]">{row.feature}</td>
                {(['owner', 'admin', 'analyst', 'viewer'] as const).map((role) => (
                  <td key={role} className="text-center py-2.5 px-2">
                    {row[role] ? (
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#666666] mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   Team Member Row
   ═══════════════════════════════════════════ */
function MemberRow({
  member,
  onRemove,
  onRoleChange,
}: {
  member: TeamMember;
  onRemove: () => void;
  onRoleChange: (role: Role) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = ROLE_CONFIG[member.role];
  const stCfg = STATUS_CONFIG[member.status];
  const isOwner = member.role === 'owner';

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#0D0D0D] transition-colors group">
      <Avatar name={member.name} color={member.color} status={member.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#FFFFFF] truncate">{member.name}</span>
          <RoleBadge role={member.role} />
          <span className="text-[10px] text-[#555555]">
            Joined {timeAgo(member.joinedAt)}
          </span>
        </div>
        <p className="text-[11px] text-[#666666] truncate mt-0.5">{member.email}</p>
        {member.channels.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className="text-[9px] text-[#555555] uppercase tracking-wider font-semibold">Channels:</span>
            {member.channels.map((chId) => {
              const ch = MOCK_CHANNELS.find((c) => c.id === chId);
              if (!ch) return null;
              return (
                <span
                  key={chId}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium text-white"
                  style={{ backgroundColor: `${ch.color}20` }}
                >
                  {ch.name}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded-md hover:bg-[#1F1F1F] text-[#666666] hover:text-[#FFFFFF] transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 z-50 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] shadow-xl py-1">
              {!isOwner && (
                <>
                  <div className="px-3 py-1.5 text-[9px] text-[#555555] uppercase tracking-wider font-bold">Change Role</div>
                  {(['admin', 'analyst', 'viewer'] as const).map((role) => {
                    const RCfg = ROLE_CONFIG[role];
                    const RIcon = RCfg.icon;
                    return (
                    <button
                      key={role}
                      onClick={() => { onRoleChange(role); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#0D0D0D] transition-colors"
                    >
                      <RIcon className="w-3.5 h-3.5" />
                      {RCfg.label}
                      <span className="text-[9px] text-[#555555] ml-auto">— {RCfg.desc}</span>
                    </button>
                    );
                  })}
                  <div className="border-t border-[#2A2A2A] my-1" />
                  <button
                    onClick={() => { onRemove(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#EF4444] hover:bg-[rgba(239,68,68,0.05)] transition-colors"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    Remove Member
                  </button>
                </>
              )}
              {isOwner && (
                <div className="px-3 py-2 text-xs text-[#555555]">Owner cannot be modified</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Channel Access Card
   ═══════════════════════════════════════════ */
function ChannelAccessCard({
  member,
  onToggle,
}: {
  member: TeamMember;
  onToggle: (channelId: string) => void;
}) {
  return (
    <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={member.name} color={member.color} size={28} />
        <div className="min-w-0">
          <span className="text-xs font-semibold text-[#FFFFFF] truncate block">{member.name}</span>
          <span className="text-[10px] text-[#555555]">{member.email}</span>
        </div>
        <RoleBadge role={member.role} />
      </div>
      <div className="space-y-2">
        {MOCK_CHANNELS.map((ch) => {
          const hasAccess = member.channels.includes(ch.id);
          return (
            <button
              key={ch.id}
              onClick={() => onToggle(ch.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md border transition-all hover:bg-[#0D0D0D]"
              style={{
                borderColor: hasAccess ? `${ch.color}40` : '#1A1A1A',
                backgroundColor: hasAccess ? `${ch.color}08` : undefined,
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: hasAccess ? ch.color : '#1A1A1A' }}
              />
              <span
                className="text-[11px] font-medium flex-1 text-left truncate transition-colors"
                style={{ color: hasAccess ? '#FFFFFF' : '#555555' }}
              >
                {ch.name}
              </span>
              {hasAccess ? (
                <ToggleRight className="w-4 h-4 flex-shrink-0" style={{ color: ch.color }} />
              ) : (
                <ToggleLeft className="w-4 h-4 flex-shrink-0 text-[#555555]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Activity Log Item
   ═══════════════════════════════════════════ */
function ActivityLogItem({ item }: { item: TeamActivity }) {
  const color = ACTION_COLORS[item.type] || '#A3A3A3';
  const ActionIcon = item.type === 'add' ? UserPlus
    : item.type === 'remove' ? UserMinus
    : item.type === 'invite' ? Send
    : Activity;

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-[#0D0D0D] transition-colors group">
      <div className="mt-0.5 p-1 rounded-md flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <ActionIcon className="w-3 h-3" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#FFFFFF] leading-relaxed">
          <span className="font-semibold">{item.user}</span>{' '}
          <span className="text-[#A3A3A3]">{item.action}</span>
        </p>
        <span className="text-[10px] text-[#555555] block mt-0.5">{timeAgo(item.time)}</span>
      </div>
      <div
        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: color }}
        title={item.type}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Pending Invite Row
   ═══════════════════════════════════════════ */
function PendingInviteRow({
  invite,
  onRevoke,
  onResend,
}: {
  invite: PendingInvite;
  onRevoke: () => void;
  onResend: () => void;
}) {
  const cfg = ROLE_CONFIG[invite.role];
  const expiresDays = Math.ceil((invite.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = expiresDays <= 0;

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-lg border border-dashed border-[#1F1F1F] hover:border-[#2A2A2A] transition-colors group">
      <div className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-[#FDBA2D]" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-[#FFFFFF] block truncate">{invite.email}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <RoleBadge role={invite.role} />
          <span className={`text-[10px] ${isExpired ? 'text-[#EF4444]' : 'text-[#555555]'}`}>
            {isExpired ? 'Expired' : `Expires in ${expiresDays}d`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isExpired && (
          <button
            onClick={onResend}
            className="p-1.5 rounded-md hover:bg-[#1F1F1F] text-[#666666] hover:text-[#FDBA2D] transition-colors"
            title="Resend invite"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onRevoke}
          className="p-1.5 rounded-md hover:bg-[rgba(239,68,68,0.1)] text-[#666666] hover:text-[#EF4444] transition-colors"
          title="Revoke invite"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main CollaborationTool
   ═══════════════════════════════════════════ */
export function CollaborationTool() {
  const {
    teamMembers, pendingInvites, teamActivityLog,
    addTeamMember, removeTeamMember, updateTeamMemberRole,
    toggleChannelAccess, addTeamActivity, inviteTeamMember, revokeInvite,
    agencyChannels, userName, userEmail,
  } = useNychIQStore();

  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState<'members' | 'permissions' | 'channels' | 'activity' | 'invites'>('members');

  /* ── Invite form state ── */
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('analyst');
  const [inviteRoleOpen, setInviteRoleOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  /* ── Add member form state ── */
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState<Role>('analyst');
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  /* ── Initialize with mock data on first load if empty ── */
  const initialized = React.useRef(false);
  useEffect(() => {
    if (!initialized.current && teamMembers.length === 0 && teamActivityLog.length === 0 && pendingInvites.length === 0) {
      initialized.current = true;
      // Add mock team members
      addTeamMember({
        name: 'Sarah Kim', email: 'sarah@agency.com', role: 'admin', status: 'active',
        color: '#3B82F6', channels: ['ch-1', 'ch-2'], joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      });
      addTeamMember({
        name: 'Mike Rodriguez', email: 'mike@agency.com', role: 'analyst', status: 'active',
        color: '#10B981', channels: ['ch-1', 'ch-3'], joinedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      });
      addTeamMember({
        name: 'Alex Thompson', email: 'alex@agency.com', role: 'viewer', status: 'inactive',
        color: '#FDBA2D', channels: ['ch-2'], joinedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      });
      // Add mock pending invite
      inviteTeamMember('newmember@agency.com', 'analyst');
      // Add mock activity
      addTeamActivity({ user: 'Sarah K.', action: 'assigned channel TechVision Pro to Mike R.', type: 'update' });
      setTimeout(() => {
        addTeamActivity({ user: 'You', action: 'invited newmember@agency.com as Analyst', type: 'invite' });
      }, 10);
      setTimeout(() => {
        addTeamActivity({ user: 'You', action: 'added Mike Rodriguez as Analyst', type: 'add' });
      }, 20);
    }
  }, []);

  /* ── Derived ── */
  const memberCount = teamMembers.length;
  const activeCount = teamMembers.filter((m) => m.status === 'active').length;
  const inviteCount = pendingInvites.length;

  /* ── Handlers ── */
  const handleInvite = useCallback(() => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'warning');
      return;
    }
    if (teamMembers.some((m) => m.email.toLowerCase() === email) || pendingInvites.some((i) => i.email.toLowerCase() === email)) {
      showToast('This email is already on the team or has a pending invite', 'warning');
      return;
    }
    inviteTeamMember(email, inviteRole);
    addTeamActivity({ user: 'You', action: `invited ${email} as ${ROLE_CONFIG[inviteRole].label}`, type: 'invite' });
    showToast(`Invite sent to ${email}`, 'success');
    setInviteEmail('');
  }, [inviteEmail, inviteRole, teamMembers, pendingInvites, inviteTeamMember, addTeamActivity]);

  const handleAddMember = useCallback(() => {
    const email = addEmail.trim().toLowerCase();
    const name = addName.trim();
    if (!name || !email || !email.includes('@')) {
      showToast('Please enter both name and valid email', 'warning');
      return;
    }
    if (teamMembers.some((m) => m.email.toLowerCase() === email)) {
      showToast('A member with this email already exists', 'warning');
      return;
    }
    addTeamMember({
      name, email, role: addRole, status: 'active',
      color: pickColorForEmail(email), channels: [], joinedAt: Date.now(),
    });
    addTeamActivity({ user: 'You', action: `added ${name} as ${ROLE_CONFIG[addRole].label}`, type: 'add' });
    showToast(`${name} added to the team`, 'success');
    setAddEmail('');
    setAddName('');
    setShowAddForm(false);
  }, [addEmail, addName, addRole, teamMembers, addTeamMember, addTeamActivity]);

  const handleRemove = useCallback((member: TeamMember) => {
    removeTeamMember(member.id);
    addTeamActivity({ user: 'You', action: `removed ${member.name} from the team`, type: 'remove' });
    showToast(`${member.name} has been removed`, 'info');
  }, [removeTeamMember, addTeamActivity]);

  const handleRoleChange = useCallback((id: string, role: Role) => {
    const member = teamMembers.find((m) => m.id === id);
    if (member) {
      updateTeamMemberRole(id, role);
      addTeamActivity({ user: 'You', action: `changed ${member.name}'s role to ${ROLE_CONFIG[role].label}`, type: 'update' });
      showToast(`${member.name} is now ${ROLE_CONFIG[role].label}`, 'success');
    }
  }, [teamMembers, updateTeamMemberRole, addTeamActivity]);

  const handleToggleChannel = useCallback((memberId: string, channelId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    const channel = MOCK_CHANNELS.find((c) => c.id === channelId);
    if (member && channel) {
      const isAdding = !member.channels.includes(channelId);
      toggleChannelAccess(memberId, channelId);
      addTeamActivity({
        user: 'You',
        action: `${isAdding ? 'granted' : 'revoked'} ${channel.name} access for ${member.name}`,
        type: 'update',
      });
      showToast(`${isAdding ? 'Granted' : 'Revoked'} ${channel.name} for ${member.name}`, 'success');
    }
  }, [teamMembers, toggleChannelAccess, addTeamActivity]);

  const handleCopyLink = useCallback(async () => {
    const link = `https://app.nychiq.com/invite?team=${encodeURIComponent(userEmail || 'agency')}&ref=team-collab`;
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopiedLink(true);
      showToast('Invite link copied to clipboard', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [userEmail]);

  const handleRevoke = useCallback((invite: PendingInvite) => {
    revokeInvite(invite.id);
    addTeamActivity({ user: 'You', action: `revoked invite for ${invite.email}`, type: 'remove' });
    showToast(`Invite revoked for ${invite.email}`, 'info');
  }, [revokeInvite, addTeamActivity]);

  const handleResend = useCallback((invite: PendingInvite) => {
    // Simulate resend by updating the invite (in real app this would call API)
    revokeInvite(invite.id);
    inviteTeamMember(invite.email, invite.role);
    showToast(`Invite resent to ${invite.email}`, 'success');
  }, [revokeInvite, inviteTeamMember]);

  /* ── Tabs ── */
  const tabs = [
    { id: 'members' as const, label: 'Team Members', icon: UsersRound, count: memberCount },
    { id: 'permissions' as const, label: 'Permissions', icon: Shield, count: null },
    { id: 'channels' as const, label: 'Channel Access', icon: ClipboardCheck, count: null },
    { id: 'activity' as const, label: 'Activity Log', icon: Activity, count: teamActivityLog.length },
    { id: 'invites' as const, label: 'Invites', icon: Mail, count: inviteCount },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ── HEADER ── */}
      <div className="rounded-lg bg-[#141414] border border-[#1F1F1F] p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]">
            <UsersRound className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#FFFFFF]">Team Collaboration</h1>
            <p className="text-xs text-[#A3A3A3]">Manage your agency team, roles, and channel access</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#1F1F1F] flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-xs text-[#A3A3A3]"><span className="text-[#FFFFFF] font-bold">{activeCount}</span> Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#666666]" />
            <span className="text-xs text-[#A3A3A3]"><span className="text-[#FFFFFF] font-bold">{memberCount - activeCount}</span> Inactive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FDBA2D]" />
            <span className="text-xs text-[#A3A3A3]"><span className="text-[#FFFFFF] font-bold">{inviteCount}</span> Pending Invites</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 p-1 rounded-lg bg-[#141414] border border-[#1F1F1F] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap flex-1 justify-center min-w-0 ${
              activeTab === tab.id
                ? 'text-[#FFFFFF] shadow-sm'
                : 'text-[#555555] hover:text-[#A3A3A3]'
            }`}
            style={activeTab === tab.id ? { backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6' } : undefined}
          >
            <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{tab.label}</span>
            {tab.count !== null && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                activeTab === tab.id ? 'bg-[#8B5CF6] text-white' : 'bg-[#1F1F1F] text-[#666666]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}

      {/* Team Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Add Member */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#2A2A2A] hover:border-[#8B5CF6] text-[#666666] hover:text-[#8B5CF6] transition-all text-xs font-medium group"
            >
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Add Team Member
            </button>
          ) : (
            <Card className="border-[#8B5CF6]/30">
              <SectionHeader>
                <UserPlus className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Add New Member
              </SectionHeader>
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Full name"
                    className="h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                  />
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="Email address"
                    className="h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Role selector */}
                  <div className="relative">
                    <button
                      onClick={() => setAddRoleOpen(!addRoleOpen)}
                      className="flex items-center gap-2 h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm hover:border-[#2A2A2A] transition-colors"
                    >
                      {(() => { const ARC = ROLE_CONFIG[addRole]; return <ARC.icon className="w-4 h-4" style={{ color: ARC.color }} />; })()}
                      <span className="text-[#FFFFFF]">{ROLE_CONFIG[addRole].label}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                    </button>
                    {addRoleOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setAddRoleOpen(false)} />
                        <div className="absolute top-full mt-1 left-0 w-52 z-50 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] shadow-xl py-1">
                          {(['admin', 'analyst', 'viewer'] as const).map((role) => {
                            const ARC2 = ROLE_CONFIG[role];
                            const ARCIcon2 = ARC2.icon;
                            return (
                            <button
                              key={role}
                              onClick={() => { setAddRole(role); setAddRoleOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors ${
                                addRole === role ? 'text-[#FFFFFF] bg-[#0D0D0D]' : 'text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]'
                              }`}
                            >
                              <ARCIcon2 className="w-4 h-4" style={{ color: ARC2.color }} />
                              <div className="text-left">
                                <span className="font-semibold block">{ARC2.label}</span>
                                <span className="text-[9px] text-[#555555]">{ARC2.desc}</span>
                              </div>
                            </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleAddMember}
                    className="h-10 px-5 rounded-md bg-[#8B5CF6] text-white text-sm font-bold hover:bg-[#7C3AED] transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Add Member
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setAddEmail(''); setAddName(''); }}
                    className="h-10 px-4 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] text-sm hover:text-[#FFFFFF] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <SectionHeader>
              <UsersRound className="w-3.5 h-3.5 text-[#FDBA2D]" />
              Team Members
            </SectionHeader>
            <div className="mt-3 divide-y divide-[#1A1A1A] max-h-[500px] overflow-y-auto">
              {teamMembers.length === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <UsersRound className="w-8 h-8 text-[#555555] mb-3" />
                  <p className="text-sm text-[#555555]">No team members yet</p>
                  <p className="text-[11px] text-[#444444] mt-1">Add members to start collaborating</p>
                </div>
              ) : (
                teamMembers.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    onRemove={() => handleRemove(member)}
                    onRoleChange={(role) => handleRoleChange(member.id, role)}
                  />
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <PermissionsTable />
      )}

      {/* Channel Access Tab */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <Card>
            <SectionHeader>
              <ClipboardCheck className="w-3.5 h-3.5 text-[#FDBA2D]" />
              Shared Channel Access
            </SectionHeader>
            <p className="text-[11px] text-[#555555] mt-1">
              Toggle channel access for each team member. Changes take effect immediately.
            </p>
          </Card>
          {teamMembers.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-10">
                <ClipboardCheck className="w-8 h-8 text-[#555555] mb-3" />
                <p className="text-sm text-[#555555]">No members to configure</p>
                <p className="text-[11px] text-[#444444] mt-1">Add team members first to manage their channel access</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teamMembers.map((member) => (
                <ChannelAccessCard
                  key={member.id}
                  member={member}
                  onToggle={(chId) => handleToggleChannel(member.id, chId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card>
          <div className="flex items-center justify-between">
            <SectionHeader>
              <Activity className="w-3.5 h-3.5 text-[#FDBA2D]" />
              Activity Log
            </SectionHeader>
            <div className="flex items-center gap-3 text-[10px] text-[#555555]">
              {Object.entries(ACTION_COLORS).map(([type, color]) => (
                <span key={type} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {type}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 divide-y divide-[#1A1A1A] max-h-[500px] overflow-y-auto">
            {teamActivityLog.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <Activity className="w-8 h-8 text-[#555555] mb-3" />
                <p className="text-sm text-[#555555]">No activity yet</p>
                <p className="text-[11px] text-[#444444] mt-1">Team actions will appear here</p>
              </div>
            ) : (
              teamActivityLog.map((item) => (
                <ActivityLogItem key={item.id} item={item} />
              ))
            )}
          </div>
        </Card>
      )}

      {/* Invites Tab */}
      {activeTab === 'invites' && (
        <div className="space-y-4">
          {/* Invite Form */}
          <Card>
            <SectionHeader>
              <Mail className="w-3.5 h-3.5 text-[#FDBA2D]" />
              Send Invite
            </SectionHeader>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="colleague@example.com"
                    className="w-full h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#555555] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
                  />
                </div>
                {/* Role dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setInviteRoleOpen(!inviteRoleOpen)}
                    className="flex items-center gap-2 h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-sm hover:border-[#2A2A2A] transition-colors"
                  >
                    {(() => { const IRC = ROLE_CONFIG[inviteRole]; return <IRC.icon className="w-4 h-4" style={{ color: IRC.color }} />; })()}
                    <span className="text-[#FFFFFF]">{ROLE_CONFIG[inviteRole].label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                  </button>
                  {inviteRoleOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setInviteRoleOpen(false)} />
                      <div className="absolute top-full mt-1 left-0 w-52 z-50 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] shadow-xl py-1">
                        {(['admin', 'analyst', 'viewer'] as const).map((role) => {
                          const IRC2 = ROLE_CONFIG[role];
                          const IRCIcon2 = IRC2.icon;
                          return (
                          <button
                            key={role}
                            onClick={() => { setInviteRole(role); setInviteRoleOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors ${
                              inviteRole === role ? 'text-[#FFFFFF] bg-[#0D0D0D]' : 'text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]'
                            }`}
                          >
                            <IRCIcon2 className="w-4 h-4" style={{ color: IRC2.color }} />
                            <div className="text-left">
                              <span className="font-semibold block">{IRC2.label}</span>
                              <span className="text-[9px] text-[#555555]">{IRC2.desc}</span>
                            </div>
                          </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleInvite}
                  className="h-10 px-5 rounded-md bg-[#FDBA2D] text-[#0D0D0D] text-sm font-bold hover:bg-[#C69320] transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Invite
                </button>
              </div>
            </div>
          </Card>

          {/* Copy Invite Link */}
          <Card>
            <SectionHeader>
              <Link2 className="w-3.5 h-3.5 text-[#FDBA2D]" />
              Share Invite Link
            </SectionHeader>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={`https://app.nychiq.com/invite?team=${encodeURIComponent(userEmail || 'agency')}&ref=team-collab`}
                className="flex-1 h-10 px-4 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs text-[#666666] font-mono focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="h-10 px-4 rounded-md bg-[#1A1A1A] border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#FFFFFF] hover:border-[#2A2A2A] transition-colors flex items-center gap-2 text-xs font-medium flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </Card>

          {/* Pending Invites */}
          <Card>
            <SectionHeader>
              <AlertCircle className="w-3.5 h-3.5 text-[#FDBA2D]" />
              Pending Invites
              <span className="ml-auto text-[10px] text-[#555555] font-normal normal-case tracking-normal">
                {inviteCount} pending
              </span>
            </SectionHeader>
            <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
              {pendingInvites.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <Mail className="w-8 h-8 text-[#555555] mb-3" />
                  <p className="text-sm text-[#555555]">No pending invites</p>
                  <p className="text-[11px] text-[#444444] mt-1">Invite team members using the form above</p>
                </div>
              ) : (
                pendingInvites.map((invite) => (
                  <PendingInviteRow
                    key={invite.id}
                    invite={invite}
                    onRevoke={() => handleRevoke(invite)}
                    onResend={() => handleResend(invite)}
                  />
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
