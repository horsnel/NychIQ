import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ── Types ── */
export type Plan = 'trial' | 'starter' | 'pro' | 'elite' | 'agency';
export type PageId = 'welcome' | 'login' | 'app' | 'privacy' | 'terms' | 'refund' | 'cookies' | 'about' | 'contact' | 'careers' | 'changelog' | 'ob-questions' | 'ob-audit' | 'ob-extension';

export interface NychIQState {
  /* Routing */
  currentPage: PageId;
  activeTool: string;
  prevPage: PageId;

  /* Auth */
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;

  /* Plan & Tokens */
  userPlan: Plan;
  tokenBalance: number;
  tokensEarned: number;
  signupTimestamp: number;

  /* Settings */
  workerUrl: string;
  region: string;
  referralCode: string;

  /* UI state */
  searchFilter: string;
  sidebarOpen: boolean;
  mobileNavTab: string;
  sakuOpen: boolean;
  sakuFullOpen: boolean;
  notifDrawerOpen: boolean;
  upgradeModalOpen: boolean;
  tokenModalOpen: boolean;
  commandBarOpen: boolean;

  /* Data */
  trendingVideos: any[];
  shorts: any[];

  /* ── Actions ── */
  setPage: (page: PageId) => void;
  setActiveTool: (tool: string) => void;
  login: (name: string, email: string) => void;
  logout: () => void;
  setUserPlan: (plan: Plan) => void;
  spendTokens: (action: string) => boolean;
  updateTokenDisplay: () => void;
  checkStagedTokens: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setWorkerUrl: (url: string) => void;
  setRegion: (region: string) => void;
  setReferralCode: (code: string) => void;
  setMobileNavTab: (tab: string) => void;
  setSakuOpen: (open: boolean) => void;
  setSakuFullOpen: (open: boolean) => void;
  setNotifDrawerOpen: (open: boolean) => void;
  setUpgradeModalOpen: (open: boolean) => void;
  setTokenModalOpen: (open: boolean) => void;
  setCommandBarOpen: (open: boolean) => void;
  setSearchFilter: (filter: string) => void;
  setTrendingVideos: (videos: any[]) => void;
  setShorts: (videos: any[]) => void;
  canAccess: (tool: string) => boolean;
}

/* ── Token costs per feature ── */
export const TOKEN_COSTS: Record<string, number> = {
  dashboard: 0, profile: 0, settings: 0, usage: 0, studio: 0, 'sovereign-vault': 0,
  viral: 1, saku: 1, rankings: 2, cpm: 2, keywords: 2, 'vph-tracker': 2,
  trending: 3, algorithm: 3, deepchat: 3, 'trend-alerts': 3, posttime: 5, shorts: 5, seo: 5, 'safe-check': 5, pulsecheck: 5, 'blueprint-ai': 5, 'social-channels': 5,
  ideas: 6, hook: 8, 'ab-test': 8, 'social-trends': 8, 'social-mentions': 8, niche: 8, search: 8, 'thumbnail-lab': 8, lume: 8, scriptflow: 8, arbitrage: 8, 'sponsorship-roi': 8,
  'social-comments': 10, competitor: 10, hooklab: 10, 'digital-scout': 10, 'ghost-tracker': 10, 'automation': 10, 'history-intel': 10,
  script: 12, 'outlier-scout': 12, 'niche-compare': 12, 'opportunity-heatmap': 12, 'monetization-roadmap': 12,
  audit: 20, strategy: 15, goffviral: 15, 'perf-forensics': 15, 'agency-dashboard': 20,
};

/* ── Plan access levels ── */
export const PLAN_ACCESS: Record<Plan, string[]> = {
  trial: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault'],
  starter: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'viral', 'rankings', 'shorts', 'studio'],
  pro: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'script', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation', 'lume', 'hooklab', 'pulsecheck', 'blueprint-ai', 'scriptflow', 'arbitrage', 'monetization-roadmap'],
  elite: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'keywords', 'script', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation', 'lume', 'hooklab', 'pulsecheck', 'blueprint-ai', 'scriptflow', 'arbitrage', 'monetization-roadmap', 'cpm', 'competitor', 'audit', 'perf-forensics', 'history-intel', 'safe-check', 'social-trends', 'social-mentions', 'social-comments', 'social-channels', 'niche-compare', 'ghost-tracker', 'digital-scout'],
  agency: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'keywords', 'script', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation', 'lume', 'hooklab', 'pulsecheck', 'blueprint-ai', 'scriptflow', 'arbitrage', 'monetization-roadmap', 'cpm', 'competitor', 'audit', 'perf-forensics', 'history-intel', 'safe-check', 'social-trends', 'social-mentions', 'social-comments', 'social-channels', 'niche-compare', 'ghost-tracker', 'digital-scout', 'strategy', 'goffviral', 'agency-dashboard', 'opportunity-heatmap'],
};

/* ── Free tools (no token cost regardless of plan) ── */
const FREE_TOOLS = new Set(['dashboard', 'profile', 'settings', 'usage', 'studio', 'sovereign-vault']);

export const PLAN_PRICES: Record<Plan, { monthly: number; yearly: number }> = {
  trial: { monthly: 0, yearly: 0 },
  starter: { monthly: 5000, yearly: 50000 },
  pro: { monthly: 35000, yearly: 350000 },
  elite: { monthly: 70000, yearly: 700000 },
  agency: { monthly: 150000, yearly: 1500000 },
};

export const PLAN_TOKENS: Record<Plan, number> = {
  trial: 100,
  starter: 500,
  pro: 3500,
  elite: 999999, // Unlimited
  agency: 50000,
};

/* ── Tool metadata (label, icon name, category) ── */
export const TOOL_META: Record<string, { label: string; icon: string; category: string }> = {
  /* ── MAIN ── */
  dashboard:       { label: 'Dashboard',        icon: 'LayoutDashboard',  category: 'main' },
  trending:        { label: 'Trending',         icon: 'TrendingUp',       category: 'main' },
  search:          { label: 'Search',           icon: 'Search',           category: 'main' },
  rankings:        { label: 'Rankings',         icon: 'BarChart3',        category: 'main' },
  shorts:          { label: 'Shorts',           icon: 'Film',             category: 'main' },

  /* ── NYCHIQ STUDIO (Pre-Upload Suite) ── */
  studio:          { label: 'Studio Hub',       icon: 'Palette',          category: 'studio' },
  lume:            { label: 'Lume',             icon: 'Layers',           category: 'studio' },
  hooklab:         { label: 'HookLab',          icon: 'Activity',         category: 'studio' },
  pulsecheck:      { label: 'PulseCheck',       icon: 'Scan',             category: 'studio' },
  'blueprint-ai':  { label: 'Blueprint AI',     icon: 'Wrench',           category: 'studio' },
  scriptflow:      { label: 'ScriptFlow',       icon: 'ScrollText',       category: 'studio' },
  arbitrage:       { label: 'Arbitrage',        icon: 'Scale',            category: 'studio' },

  /* ── INTELLIGENCE ── */
  viral:           { label: 'Viral Predictor',  icon: 'Zap',              category: 'intelligence' },
  niche:           { label: 'Niche Spy',        icon: 'Crosshair',        category: 'intelligence' },
  algorithm:       { label: 'Algorithm',        icon: 'BrainCircuit',     category: 'intelligence' },
  cpm:             { label: 'CPM Estimator',    icon: 'DollarSign',       category: 'intelligence' },
  'niche-compare': { label: 'Niche Compare',    icon: 'Columns2',         category: 'intelligence' },
  'opportunity-heatmap': { label: 'Opp. Heatmap', icon: 'Grid3x3',       category: 'intelligence' },
  'monetization-roadmap': { label: 'Revenue Roadmap', icon: 'Target',    category: 'intelligence' },

  /* ── COMPETITOR ── */
  competitor:      { label: 'Track Channels',   icon: 'Users',            category: 'competitor' },
  strategy:        { label: 'Copy Strategy',    icon: 'Copy',             category: 'competitor' },
  'ghost-tracker': { label: 'Ghost Tracker',    icon: 'EyeOff',           category: 'competitor' },
  'digital-scout': { label: 'Product Scout',    icon: 'Package',          category: 'competitor' },

  /* ── AI TOOLS ── */
  seo:             { label: 'SEO Optimizer',    icon: 'SearchCode',       category: 'ai-tools' },
  hook:            { label: 'Hook Generator',   icon: 'Anchor',           category: 'ai-tools' },
  keywords:        { label: 'Keyword Explorer',  icon: 'Key',            category: 'ai-tools' },
  script:          { label: 'Script Writer',    icon: 'FileText',         category: 'ai-tools' },
  ideas:           { label: 'Video Ideas',      icon: 'Lightbulb',        category: 'ai-tools' },
  posttime:        { label: 'Best Post Time',   icon: 'Clock',            category: 'ai-tools' },
  audit:           { label: 'Channel Audit',    icon: 'ClipboardCheck',   category: 'ai-tools' },
  'ab-test':       { label: 'A/B Tester',       icon: 'GitCompare',       category: 'ai-tools' },
  'vph-tracker':   { label: 'VPH Tracker',      icon: 'Activity',         category: 'ai-tools' },
  'thumbnail-lab': { label: 'Thumbnail Lab',    icon: 'Image',            category: 'ai-tools' },
  'safe-check':    { label: 'Safe Check',       icon: 'ShieldCheck',      category: 'ai-tools' },
  'trend-alerts':  { label: 'Trend Alerts',     icon: 'BellRing',         category: 'ai-tools' },
  'outlier-scout': { label: 'Outlier Scout',    icon: 'Radar',            category: 'ai-tools' },
  'perf-forensics':{ label: 'Perf Forensics',   icon: 'Stethoscope',      category: 'ai-tools' },
  'automation':    { label: 'Automation Master', icon: 'Cpu',              category: 'ai-tools' },
  'sponsorship-roi': { label: 'Sponsorship ROI', icon: 'Handshake',        category: 'ai-tools' },
  'history-intel': { label: 'History Intel',    icon: 'History',          category: 'ai-tools' },

  /* ── SOCIAL INTEL ── */
  goffviral:        { label: 'GoffViral',        icon: 'Flame',            category: 'social' },
  'social-trends':  { label: 'Cross-Platform',   icon: 'Share2',           category: 'social' },
  'social-mentions':{ label: 'Channel Mentions', icon: 'AtSign',         category: 'social' },
  'social-comments':{ label: 'Comment Sentiment', icon: 'Heart',           category: 'social' },
  'social-channels':{ label: 'Channel Stats',    icon: 'BarChart2',       category: 'social' },

  /* ── AI ASSISTANTS ── */
  saku:            { label: 'Saku AI',          icon: 'Bot',              category: 'ai-assistants' },
  deepchat:        { label: 'Deep Chat AI',     icon: 'MessageSquare',    category: 'ai-assistants' },

  /* ── AGENCY ── */
  'agency-dashboard': { label: 'Agency Hub',     icon: 'Building2',        category: 'agency' },

  /* ── ACCOUNT ── */
  settings:        { label: 'Settings',         icon: 'Settings',         category: 'account' },
  usage:           { label: 'Token Usage',      icon: 'Coins',            category: 'account' },
  profile:         { label: 'Profile',          icon: 'User',             category: 'account' },
  'sovereign-vault': { label: 'Sovereign Vault', icon: 'Archive',         category: 'account' },
};

/* ── Sidebar category definitions ── */
export const SIDEBAR_SECTIONS = [
  { id: 'main', label: 'MAIN' },
  { id: 'studio', label: 'NYCHIQ STUDIO' },
  { id: 'intelligence', label: 'INTELLIGENCE' },
  { id: 'competitor', label: 'COMPETITOR' },
  { id: 'ai-tools', label: 'AI TOOLS' },
  { id: 'social', label: 'SOCIAL INTEL' },
  { id: 'ai-assistants', label: 'AI ASSISTANTS' },
  { id: 'agency', label: 'AGENCY' },
  { id: 'account', label: 'ACCOUNT' },
] as const;

/* ── Store ── */
export const useNychIQStore = create<NychIQState>()(
  persist(
    (set, get) => ({
      // Routing
      currentPage: 'welcome' as PageId,
      activeTool: 'dashboard',
      prevPage: 'welcome' as PageId,

      // Auth
      isLoggedIn: false,
      userName: '',
      userEmail: '',

      // Plan & Tokens
      userPlan: 'trial' as Plan,
      tokenBalance: 20,
      tokensEarned: 0,
      signupTimestamp: Date.now(),

      // Settings
      workerUrl: '',
      region: 'US',
      referralCode: '',

      // UI state
      searchFilter: 'All',
      sidebarOpen: false,
      mobileNavTab: 'dashboard',
      sakuOpen: false,
      sakuFullOpen: false,
      notifDrawerOpen: false,
      upgradeModalOpen: false,
      tokenModalOpen: false,
      commandBarOpen: false,

      // Data
      trendingVideos: [],
      shorts: [],

      // ── Actions ──

      setPage: (page: PageId) => {
        const prev = get().currentPage;
        set({ currentPage: page, prevPage: prev });
      },

      setActiveTool: (tool: string) => {
        const state = get();
        if (!state.canAccess(tool)) {
          set({ upgradeModalOpen: true });
          return;
        }
        const cost = TOKEN_COSTS[tool] ?? 0;
        if (cost > 0 && !FREE_TOOLS.has(tool) && state.tokenBalance < cost) {
          set({ tokenModalOpen: true });
          return;
        }
        set({ activeTool: tool, mobileNavTab: tool });
        // On mobile, close sidebar
        if (window.innerWidth < 1024) {
          set({ sidebarOpen: false });
        }
      },

      login: (name: string, email: string) => {
        set({
          isLoggedIn: true,
          userName: name,
          userEmail: email,
          currentPage: 'app' as PageId,
          signupTimestamp: Date.now(),
        });
        // Check for staged token releases
        get().checkStagedTokens();
      },

      logout: () => {
        set({
          isLoggedIn: false,
          userName: '',
          userEmail: '',
          currentPage: 'welcome' as PageId,
          activeTool: 'dashboard',
          tokenBalance: 20,
          tokensEarned: 0,
          userPlan: 'trial' as Plan,
        });
      },

      setUserPlan: (plan: Plan) => {
        set({ userPlan: plan, tokenBalance: PLAN_TOKENS[plan] });
      },

      spendTokens: (action: string): boolean => {
        const state = get();
        const cost = TOKEN_COSTS[action] ?? 0;
        if (cost === 0 || FREE_TOOLS.has(action)) return true;
        if (state.tokenBalance < cost) {
          set({ tokenModalOpen: true });
          return false;
        }
        set({ tokenBalance: state.tokenBalance - cost });
        return true;
      },

      updateTokenDisplay: () => {
        // Trigger re-render of token-related UI
        set((s) => ({ tokenBalance: s.tokenBalance }));
      },

      checkStagedTokens: () => {
        const state = get();
        const signupTs = state.signupTimestamp;
        if (!signupTs) return;
        const now = Date.now();
        const hours = (now - signupTs) / (1000 * 60 * 60);
        const earnedKey = 'nychiq_tokens_earned_stage';
        const earned = parseInt(localStorage.getItem(earnedKey) || '0', 10);

        let toAdd = 0;
        if (hours >= 72 && earned < 100) toAdd = 100 - earned;
        else if (hours >= 24 && earned < 50) toAdd = 50 - earned;
        else if (earned < 20) toAdd = 20 - earned;

        if (toAdd > 0) {
 set({ tokenBalance: get().tokenBalance + toAdd, tokensEarned: get().tokensEarned + toAdd });
          localStorage.setItem(earnedKey, String(earned + toAdd));
        }

        // Also check referral staged tokens
        const staged = localStorage.getItem('nychiq_staged_tokens');
        if (staged) {
          const amount = parseInt(staged, 10);
          if (!isNaN(amount) && amount > 0) {
            set({ tokenBalance: get().tokenBalance + amount, tokensEarned: get().tokensEarned + amount });
            localStorage.removeItem('nychiq_staged_tokens');
          }
        }
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      setWorkerUrl: (url: string) => set({ workerUrl: url }),
      setRegion: (region: string) => set({ region }),
      setReferralCode: (code: string) => set({ referralCode: code }),
      setMobileNavTab: (tab: string) => set({ mobileNavTab: tab }),
      setSakuOpen: (open: boolean) => set({ sakuOpen: open }),
      setSakuFullOpen: (open: boolean) => set({ sakuFullOpen: open }),
      setNotifDrawerOpen: (open: boolean) => set({ notifDrawerOpen: open }),
      setUpgradeModalOpen: (open: boolean) => set({ upgradeModalOpen: open }),
      setTokenModalOpen: (open: boolean) => set({ tokenModalOpen: open }),
      setCommandBarOpen: (open: boolean) => set({ commandBarOpen: open }),
      setSearchFilter: (filter: string) => set({ searchFilter: filter }),
      setTrendingVideos: (videos: any[]) => set({ trendingVideos: videos }),
      setShorts: (videos: any[]) => set({ shorts: videos }),

      canAccess: (tool: string): boolean => {
        const plan = get().userPlan;
        return PLAN_ACCESS[plan]?.includes(tool) ?? false;
      },
    }),
    {
      name: 'nychiq-store',
      partialize: (state) => ({
        currentPage: state.currentPage,
        activeTool: state.activeTool,
        isLoggedIn: state.isLoggedIn,
        userName: state.userName,
        userEmail: state.userEmail,
        userPlan: state.userPlan,
        tokenBalance: state.tokenBalance,
        tokensEarned: state.tokensEarned,
        signupTimestamp: state.signupTimestamp,
        workerUrl: state.workerUrl,
        region: state.region,
        referralCode: state.referralCode,
        searchFilter: state.searchFilter,
      }),
    }
  )
);
