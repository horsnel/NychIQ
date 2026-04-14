'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNychIQStore } from '@/lib/store';
import { copyToClipboard, getInitials } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import {
  Settings,
  User,
  Mail,
  Globe,
  Bell,
  Trash2,
  LogOut,
  Copy,
  Check,
  Save,
  AlertTriangle,
  Info,
  Gift,
  Share2,
  Users,
  Coins,
  MapPin,
} from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';

const REGIONS = [
  { code: 'NG', label: 'Nigeria' },
  { code: 'GH', label: 'Ghana' },
  { code: 'KE', label: 'Kenya' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'TZ', label: 'Tanzania' },
  { code: 'EG', label: 'Egypt' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IN', label: 'India' },
  { code: 'CA', label: 'Canada' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'BR', label: 'Brazil' },
  { code: 'AU', label: 'Australia' },
  { code: 'JP', label: 'Japan' },
];

/* ── Toggle Switch ── */
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-[#FFFFFF]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBA2D]/50 ${
          checked ? 'bg-[#FDBA2D]' : 'bg-[#1a1a1a]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/* ── Section Card ── */
function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">{icon}</div>
        <h3 className="text-sm font-bold text-[#FFFFFF]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function SettingsTool() {
  const {
    userName,
    userEmail,
    region,
    referralCode,
    detectedRegion,
    setRegion,
    setReferralCode,
    logout,
  } = useNychIQStore();

  // Geolocation hook for auto-detected location
  const geo = useGeolocation();

  /* Local form state */
  const [displayName, setDisplayName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [selectedRegion, setSelectedRegion] = useState(region);
  const [saved, setSaved] = useState(false);

  /* Notification toggles (local state only) */
  const [viralSpikeAlerts, setViralSpikeAlerts] = useState(true);
  const [competitorUploads, setCompetitorUploads] = useState(false);
  const [sakuDailyInsights, setSakuDailyInsights] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  /* Referral */
  const [refCode, setRefCode] = useState(referralCode || '');
  const [copiedRef, setCopiedRef] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [referralApplied, setReferralApplied] = useState(false);

  /* Danger zone */
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  /* Generate referral code on mount if empty — use username prefix if available */
  useEffect(() => {
    if (!refCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      if (userName) {
        // Derive from username: take first 3 chars, uppercase, strip non-alpha
        const prefix = userName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
        code = prefix;
        while (code.length < 8) code += chars[Math.floor(Math.random() * chars.length)];
      } else {
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
      }
      setRefCode(code);
      setReferralCode(code);
    }
  }, [refCode, setReferralCode, userName]);

  /* Sync store values when they change externally */
  useEffect(() => { setDisplayName(userName); }, [userName]);
  useEffect(() => { setEmail(userEmail); }, [userEmail]);
  useEffect(() => { setSelectedRegion(region); }, [region]);
  useEffect(() => { setRefCode(referralCode); }, [referralCode]);

  /* Save handler */
  const handleSave = useCallback(() => {
    setRegion(selectedRegion);
    // Note: userName and userEmail changes would go through a proper API
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [selectedRegion, setRegion]);

  /* Copy referral link */
  const referralLink = `https://nychiq.com/?ref=${refCode}`;

  const handleCopyRef = async () => {
    const ok = await copyToClipboard(referralLink);
    if (ok) {
      setCopiedRef(true);
      showToast('Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  /* Check if referral already applied */
  useEffect(() => {
    const applied = localStorage.getItem('nychiq_applied_referral');
    if (applied) {
      setReferralApplied(true);
      setReferralInput(applied);
    }
  }, []);

  /* Apply referral code */
  const handleApplyReferral = () => {
    if (!referralInput.trim()) {
      showToast('Please enter a referral code', 'warning');
      return;
    }
    if (referralApplied) {
      showToast('Referral code already applied', 'warning');
      return;
    }
    if (referralInput.trim().toUpperCase() === refCode.toUpperCase()) {
      showToast('You cannot use your own referral code', 'error');
      return;
    }
    localStorage.setItem('nychiq_applied_referral', referralInput.trim().toUpperCase());
    setReferralApplied(true);
    // Add 20 tokens to user's balance
    const store = useNychIQStore.getState();
    useNychIQStore.setState({ tokenBalance: (store.tokenBalance || 0) + 20 });
    showToast('Referral code applied! +20 tokens added', 'success');
  };

  /* Share via social options */
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareUrl = `https://nychiq.com/?ref=${refCode}`;
  const shareText = `Sign up for NychIQ using my referral code ${refCode} and we both get +20 free tokens!`;

  const socialShares = [
    { name: 'Twitter', color: '#FFFFFF', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` },
    { name: 'WhatsApp', color: '#888888', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` },
    { name: 'Telegram', color: '#888888', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { name: 'Facebook', color: '#888888', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: 'Email', color: '#FDBA2D', url: `mailto:?subject=${encodeURIComponent('Join me on NychIQ')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}` },
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareRef = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on NychIQ',
          text: shareText,
          url: referralLink,
        });
      } catch {
        // User cancelled or share failed — show share menu
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  /* Clear local data */
  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  /* Sign out */
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(253,186,45,0.1)]">
              <Settings className="w-5 h-5 text-[#FDBA2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">Settings</h2>
              <p className="text-xs text-[#a0a0a0] mt-0.5">Manage your account, preferences, and integrations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Account Section ── */}
      <SectionCard
        title="Account"
        icon={<User className="w-4 h-4 text-[#FDBA2D]" />}
      >
        {/* Live preview avatar */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-[#0a0a0a] border border-[#1A1A1A]">
          <div className="w-12 h-12 rounded-full bg-[#FDBA2D] flex items-center justify-center text-[#0a0a0a] text-lg font-bold shrink-0">
            {getInitials(displayName)}
          </div>
          <div>
            <p className="text-sm font-medium text-[#FFFFFF]">{displayName || 'Your Name'}</p>
            <p className="text-xs text-[#666666]">{email || 'your@email.com'}</p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" /> Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full h-10 px-4 rounded-md bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full h-10 px-4 rounded-md bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors"
            />
          </div>

          {/* Auto-detected location indicator */}
          {(geo.detectedRegion || detectedRegion) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[rgba(255,255,255,0.06)] border border-[#888888]/20 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#888888] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#888888]" />
              </span>
              <MapPin className="w-3.5 h-3.5 text-[#888888]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-[#888888]/70 uppercase tracking-wider">Auto-detected from your browser</span>
                <span className="text-xs font-semibold text-[#888888]">
                  {geo.countryName || detectedRegion}
                </span>
              </div>
            </div>
          )}

          {/* Default Region */}
          <div>
            <label className="text-xs font-medium text-[#a0a0a0] mb-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Default Region
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A] text-sm text-[#FFFFFF] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors appearance-none cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label} ({r.code})
                </option>
              ))}
            </select>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 h-10 rounded-lg bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </SectionCard>

      {/* ── Notifications Section ── */}
      <SectionCard
        title="Notifications"
        icon={<Bell className="w-4 h-4 text-[#FDBA2D]" />}
      >
        <div className="divide-y divide-[#1A1A1A]">
          <ToggleSwitch
            checked={viralSpikeAlerts}
            onChange={setViralSpikeAlerts}
            label="Viral Spike Alerts"
          />
          <ToggleSwitch
            checked={competitorUploads}
            onChange={setCompetitorUploads}
            label="Competitor Uploads"
          />
          <ToggleSwitch
            checked={sakuDailyInsights}
            onChange={setSakuDailyInsights}
            label="Saku Daily Insights"
          />
          <ToggleSwitch
            checked={emailNotifications}
            onChange={setEmailNotifications}
            label="Email Notifications"
          />
        </div>
      </SectionCard>

      {/* ── Referral Program Section ── */}
      <SectionCard
        title="Referral Program"
        icon={<Gift className="w-4 h-4 text-[#FDBA2D]" />}
      >
        <div className="space-y-3">
          <p className="text-sm text-[#a0a0a0]">
            Share your referral code and earn bonus tokens for every friend who signs up.
          </p>

          {/* Referral Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A]">
              <div className="p-1.5 rounded-md bg-[rgba(255,255,255,0.06)]">
                <Users className="w-4 h-4 text-[#888888]" />
              </div>
              <div>
                <p className="text-xs text-[#666666]">Referrals</p>
                <p className="text-sm font-bold text-[#FFFFFF]">0</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A]">
              <div className="p-1.5 rounded-md bg-[rgba(253,186,45,0.1)]">
                <Coins className="w-4 h-4 text-[#FDBA2D]" />
              </div>
              <div>
                <p className="text-xs text-[#666666]">Tokens Earned</p>
                <p className="text-sm font-bold text-[#FFFFFF]">0</p>
              </div>
            </div>
          </div>

          {/* Referral Code + Actions */}
          <div className="p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A]">
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1">Your Referral Code</p>
            <p className="text-lg font-bold text-[#FDBA2D] tracking-widest mb-3">{refCode}</p>
            <div className="relative flex items-center gap-2">
              <button
                onClick={handleCopyRef}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#FDBA2D] text-[#0a0a0a] text-sm font-bold hover:bg-[#C69320] transition-colors"
              >
                {copiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedRef ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleShareRef}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[rgba(255,255,255,0.06)] text-[#a0a0a0] text-sm font-medium hover:border-[#1a1a1a] hover:text-[#FFFFFF] transition-colors"
                title="Share referral link"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              {/* Social share dropdown */}
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f0f0f] border border-[rgba(255,255,255,0.06)] rounded-lg shadow-xl z-50 py-1 animate-fade-in-up">
                  <button
                    onClick={() => { handleCopyRef(); setShowShareMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                  {socialShares.map((social) => (
                    <button
                      key={social.name}
                      onClick={() => handleSocialShare(social.url)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#a0a0a0] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
                    >
                      <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: `${social.color}20`, color: social.color }}>
                        {social.name[0]}
                      </span>
                      <span>{social.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[rgba(253,186,45,0.06)] border border-[rgba(255,255,255,0.06)]">
            <Gift className="w-4 h-4 text-[#FDBA2D] shrink-0" />
            <p className="text-xs text-[#FDBA2D]">
              You and your friend both get <span className="font-bold">+20 tokens</span> when they sign up!
            </p>
          </div>

          {/* Enter a referral code */}
          <div className="p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A]">
            <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1">Have a referral code?</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                disabled={referralApplied}
                className="flex-1 h-10 px-4 rounded-md bg-[#0f0f0f] border border-[#1A1A1A] text-sm text-[#FFFFFF] placeholder:text-[#666666] focus:outline-none focus:border-[#FDBA2D]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-mono"
              />
              <button
                onClick={handleApplyReferral}
                disabled={referralApplied || !referralInput.trim()}
                className="px-4 py-2.5 rounded-md bg-[#888888] text-[#0a0a0a] text-sm font-bold hover:bg-[#00B37D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {referralApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
            {referralApplied && (
              <p className="text-[11px] text-[#888888] mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Referral code applied successfully
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Danger Zone Section ── */}
      <div className="rounded-lg bg-[#0f0f0f] border border-[#888888]/30 p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)]">
            <AlertTriangle className="w-4 h-4 text-[#888888]" />
          </div>
          <h3 className="text-sm font-bold text-[#888888]">Danger Zone</h3>
        </div>
        <div className="space-y-3">
          {/* Clear Data */}
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-between p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[#888888]/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-[#888888]" />
                <div className="text-left">
                  <p className="text-sm text-[#FFFFFF]">Clear All Local Data</p>
                  <p className="text-[10px] text-[#666666]">Remove all cached data from this browser</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-md bg-[rgba(255,255,255,0.06)] border border-[#888888]/30">
              <p className="text-sm text-[#FFFFFF] mb-3">Are you sure? This will clear all your local settings and data.</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 rounded-md bg-[#888888] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Yes, Clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-md bg-[#1A1A1A] text-[#a0a0a0] text-sm font-medium hover:text-[#FFFFFF] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sign Out */}
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-between p-3 rounded-md bg-[#0a0a0a] border border-[#1A1A1A] hover:border-[#888888]/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-[#888888]" />
                <div className="text-left">
                  <p className="text-sm text-[#FFFFFF]">Sign Out</p>
                  <p className="text-[10px] text-[#666666]">Log out of your account</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-md bg-[rgba(255,255,255,0.06)] border border-[#888888]/30">
              <p className="text-sm text-[#FFFFFF] mb-3">Are you sure you want to sign out?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md bg-[#888888] text-white text-sm font-medium hover:bg-[#D04242] transition-colors inline-flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Yes, Sign Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-md bg-[#1A1A1A] text-[#a0a0a0] text-sm font-medium hover:text-[#FFFFFF] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
