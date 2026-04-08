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
  setTrendingVideos: (videos: any[]) => void;
  setShorts: (videos: any[]) => void;
  canAccess: (tool: string) => boolean;
}

/* ── Token costs per feature ── */
export const TOKEN_COSTS: Record<string, number> = {
  dashboard: 0, profile: 0, settings: 0, usage: 0, studio: 0,
  viral: 1, saku: 1, rankings: 2, cpm: 2, keywords: 2,
  trending: 3, algorithm: 3, deepchat: 3, saku3x: 3, seo: 5, posttime: 5, shorts: 5,
  ideas: 6, hook: 8, 'ab-test': 8, crossplatform: 8, niche: 8, search: 8, 'thumbnail-lab': 8,
  sentiment: 10, competitor: 10, 'trend-alerts': 3,
  script: 12, 'outlier-scout': 12, 'history-intel': 10, audit: 20,
  strategy: 15, goffviral: 15, 'perf-forensics': 15, agency: 20,
  'automation': 10, 'sponsorship-roi': 8, 'safe-check': 5, 'vph-tracker': 2,
};

/* ── Plan access levels ── */
const PLAN_ACCESS: Record<Plan, string[]> = {
  trial: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage'],
  starter: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'viral', 'rankings', 'shorts', 'studio'],
  pro: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'keywords', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation'],
  elite: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'keywords', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation', 'cpm', 'competitor', 'audit', 'perf-forensics', 'history-intel', 'safe-check', 'social-trends', 'social-mentions', 'social-comments', 'social-channels'],
  agency: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'keywords', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation', 'cpm', 'competitor', 'audit', 'perf-forensics', 'history-intel', 'safe-check', 'social-trends', 'social-mentions', 'social-comments', 'social-channels', 'strategy', 'goffviral', 'agency-dashboard'],
};

/* ── Free tools (no token cost regardless of plan) ── */
const FREE_TOOLS = new Set(['dashboard', 'profile', 'settings', 'usage', 'studio']);

export const PLAN_PRICES: Record<Plan, { monthly: number; yearly: number }> = {
  trial: { monthly: 0, yearly: 0 },
  starter: { monthly: 19, yearly: 190 },
  pro: { monthly: 49, yearly: 490 },
  elite: { monthly: 99, yearly: 990 },
  agency: { monthly: 249, yearly: 2490 },
};

export const PLAN_TOKENS: Record<Plan, number> = {
  trial: 50,
  starter: 500,
  pro: 2500,
  elite: 10000,
  agency: 50000,
};

/* ── Tool metadata (label, icon name, category) ── */
export const TOOL_META: Record<string, { label: string; icon: string; category: string }> = {
  dashboard:       { label: 'Dashboard',        icon: 'LayoutDashboard',  category: 'main' },
  trending:        { label: 'Trending',         icon: 'TrendingUp',       category: 'main' },
  search:          { label: 'Search',           icon: 'Search',           category: 'main' },
  rankings:        { label: 'Rankings',         icon: 'BarChart3',        category: 'main' },
  shorts:          { label: 'Shorts',           icon: 'Film',             category: 'main' },
  saku:            { label: 'Saku AI',          icon: 'Bot',              category: 'studio' },
  studio:          { label: 'Studio',           icon: 'Palette',          category: 'studio' },
  deepchat:        { label: 'Deep Chat AI',     icon: 'MessageSquare',    category: 'studio' },
  'agency-dashboard': { label: 'Agency Dashboard', icon: 'Building2',    category: 'studio' },
  viral:           { label: 'Viral Predictor',  icon: 'Zap',              category: 'intelligence' },
  niche:           { label: 'Niche Spy',        icon: 'Crosshair',        category: 'intelligence' },
  algorithm:       { label: 'Algorithm',        icon: 'BrainCircuit',     category: 'intelligence' },
  cpm:             { label: 'CPM Estimator',    icon: 'DollarSign',       category: 'intelligence' },
  competitor:      { label: 'Track Channels',   icon: 'Users',            category: 'competitor' },
  strategy:        { label: 'Copy Strategy',    icon: 'Copy',             category: 'competitor' },
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
  goffviral:        { label: 'GoffViral',        icon: 'Flame',            category: 'social' },
  'social-trends':  { label: 'Cross-Platform',   icon: 'Share2',           category: 'social' },
  'social-mentions':{ label: 'Channel Mentions', icon: 'AtSign',         category: 'social' },
  'social-comments':{ label: 'Comment Sentiment', icon: 'Heart',           category: 'social' },
  'social-channels':{ label: 'Channel Stats',    icon: 'BarChart2',       category: 'social' },
  settings:        { label: 'Settings',         icon: 'Settings',         category: 'account' },
  usage:           { label: 'Token Usage',      icon: 'Coins',            category: 'account' },
  profile:         { label: 'Profile',          icon: 'User',             category: 'account' },
};

/* ── Sidebar category definitions ── */
export const SIDEBAR_SECTIONS = [
  { id: 'main', label: 'MAIN' },
  { id: 'studio', label: 'STUDIO & AI' },
  { id: 'intelligence', label: 'INTELLIGENCE' },
  { id: 'competitor', label: 'COMPETITOR' },
  { id: 'ai-tools', label: 'AI TOOLS' },
  { id: 'social', label: 'SOCIAL INTEL' },
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
      tokenBalance: 50,
      tokensEarned: 0,
      signupTimestamp: Date.now(),

      // Settings
      workerUrl: '',
      region: 'US',
      referralCode: '',

      // UI state
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
      },

      logout: () => {
        set({
          isLoggedIn: false,
          userName: '',
          userEmail: '',
          currentPage: 'welcome' as PageId,
          activeTool: 'dashboard',
          tokenBalance: 50,
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
        // Check for staged token refills (earned from referrals, etc.)
        const staged = localStorage.getItem('nychiq_staged_tokens');
        if (staged) {
          const amount = parseInt(staged, 10);
          if (!isNaN(amount) && amount > 0) {
            const state = get();
            set({ tokenBalance: state.tokenBalance + amount, tokensEarned: state.tokensEarned + amount });
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
      }),
    }
  )
);
