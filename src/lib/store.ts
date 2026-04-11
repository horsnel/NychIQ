import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ── SSR-safe storage ── */
const ssrSafeStorage = typeof window !== 'undefined' ? window.localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};

/* ── Types ── */
export type Plan = 'trial' | 'starter' | 'pro' | 'elite' | 'agency';
export type PageId = 'welcome' | 'login' | 'app' | 'privacy' | 'terms' | 'refund' | 'cookies' | 'about' | 'blog' | 'contact' | 'careers' | 'changelog' | 'ob-questions' | 'ob-audit' | 'ob-extension';

export interface TokenTransaction {
  id: string;
  tool: string;
  tokens: number;
  time: number; // epoch ms
  type: 'spend' | 'earn' | 'reset' | 'bonus';
}

export interface NychIQState {
  /* Routing */
  currentPage: PageId;
  activeTool: string;
  prevPage: PageId;

  /* Auth */
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  onboardingCompleted: boolean;

  /* Plan & Tokens */
  userPlan: Plan;
  tokenBalance: number;
  tokensEarned: number;
  totalTokensSpent: number;
  signupTimestamp: number;
  lastResetDate: string; // 'YYYY-MM-DD' — tracks last monthly reset
  tokenHistory: TokenTransaction[];

  /* Token popup state */
  tokenWarningShown: boolean; // 20% warning shown this session
  tokenExhaustedPopupOpen: boolean; // 0% non-skippable popup

  /* Settings */
  workerUrl: string;
  region: string;
  detectedRegion: string | null;
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
  login: (name: string, email: string, skipOnboarding?: boolean) => void;
  logout: () => void;
  completeOnboarding: () => void;
  setUserPlan: (plan: Plan) => void;
  spendTokens: (action: string) => boolean;
  updateTokenDisplay: () => void;
  checkStagedTokens: () => void;
  checkMonthlyReset: () => void;
  checkTokenWarning: () => { showWarning: boolean; showExhausted: boolean };
  dismissTokenWarning: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setWorkerUrl: (url: string) => void;
  setRegion: (region: string) => void;
  setDetectedRegion: (region: string | null) => void;
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
  addTokenHistory: (entry: TokenTransaction) => void;
}

/* ── Token costs per feature ── */
export const TOKEN_COSTS: Record<string, number> = {
  dashboard: 0, profile: 0, settings: 0, usage: 0, studio: 0, 'sovereign-vault': 0, 'channel-assistant': 0,
  viral: 1, saku: 1, rankings: 2, cpm: 2, keywords: 2, 'vph-tracker': 2,
  trending: 3, algorithm: 3, deepchat: 3, 'trend-alerts': 3, posttime: 5, shorts: 5, seo: 5, 'safe-check': 5, pulsecheck: 5, 'blueprint-ai': 5, 'social-channels': 5,
  ideas: 6, hook: 8, 'ab-test': 8, 'social-trends': 8, 'social-mentions': 8, niche: 8, search: 8, 'thumbnail-lab': 8, lume: 8, scriptflow: 8, arbitrage: 8, 'sponsorship-roi': 8,
  'social-comments': 10, competitor: 10, hooklab: 10, 'digital-scout': 10, 'ghost-tracker': 10, 'automation': 10, 'history-intel': 10,
  script: 12, 'outlier-scout': 12, 'niche-compare': 12, 'opportunity-heatmap': 12, 'monetization-roadmap': 12,
  audit: 20, strategy: 15, goffviral: 15, 'perf-forensics': 15, 'agency-dashboard': 20,
};

/* ── Plan access levels ── */
export const PLAN_ACCESS: Record<Plan, string[]> = {
  trial: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'channel-assistant'],
  starter: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'viral', 'rankings', 'shorts', 'studio', 'channel-assistant'],
  pro: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'script', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation', 'lume', 'hooklab', 'pulsecheck', 'blueprint-ai', 'scriptflow', 'arbitrage', 'monetization-roadmap', 'channel-assistant'],
  elite: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'keywords', 'script', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation', 'lume', 'hooklab', 'pulsecheck', 'blueprint-ai', 'scriptflow', 'arbitrage', 'monetization-roadmap', 'cpm', 'competitor', 'audit', 'perf-forensics', 'history-intel', 'safe-check', 'social-trends', 'social-mentions', 'social-comments', 'social-channels', 'niche-compare', 'ghost-tracker', 'digital-scout', 'channel-assistant'],
  agency: ['dashboard', 'trending', 'search', 'posttime', 'trend-alerts', 'saku', 'deepchat', 'sponsorship-roi', 'profile', 'settings', 'usage', 'sovereign-vault', 'viral', 'rankings', 'shorts', 'studio', 'niche', 'algorithm', 'seo', 'hook', 'ideas', 'keywords', 'script', 'ab-test', 'vph-tracker', 'thumbnail-lab', 'outlier-scout', 'automation', 'lume', 'hooklab', 'pulsecheck', 'blueprint-ai', 'scriptflow', 'arbitrage', 'monetization-roadmap', 'cpm', 'competitor', 'audit', 'perf-forensics', 'history-intel', 'safe-check', 'social-trends', 'social-mentions', 'social-comments', 'social-channels', 'niche-compare', 'ghost-tracker', 'digital-scout', 'strategy', 'goffviral', 'agency-dashboard', 'opportunity-heatmap', 'channel-assistant'],
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

/* ── Helper: today's date as YYYY-MM-DD ── */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── Helper: check if today is the 31st ── */
function isMonthlyResetDay(): boolean {
  return new Date().getDate() === 31;
}

/* ── Helper: generate unique ID ── */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

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
  'channel-assistant': { label: 'Channel Assistant', icon: 'Sliders',     category: 'ai-assistants' },

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
      onboardingCompleted: false,

      // Plan & Tokens
      userPlan: 'trial' as Plan,
      tokenBalance: 100,
      tokensEarned: 0,
      totalTokensSpent: 0,
      signupTimestamp: Date.now(),
      lastResetDate: todayStr(),
      tokenHistory: [],

      // Token popup state
      tokenWarningShown: false,
      tokenExhaustedPopupOpen: false,

      // Settings
      workerUrl: '',
      region: 'US',
      detectedRegion: null,
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
          // Show exhausted popup — non-skippable
          set({ tokenExhaustedPopupOpen: true });
          return;
        }
        set({ activeTool: tool, mobileNavTab: tool });
        // On mobile, close sidebar
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          set({ sidebarOpen: false });
        }
      },

      login: (name: string, email: string, skipOnboarding: boolean = false) => {
        set({
          isLoggedIn: true,
          userName: name,
          userEmail: email,
          currentPage: (get().onboardingCompleted || skipOnboarding) ? 'app' as PageId : 'ob-questions' as PageId,
          signupTimestamp: Date.now(),
        });
        // Check for staged token releases
        get().checkStagedTokens();
        // Check monthly reset on login
        get().checkMonthlyReset();
      },

      completeOnboarding: () => {
        set({ onboardingCompleted: true, currentPage: 'app' as PageId });
      },

      logout: () => {
        set({
          isLoggedIn: false,
          userName: '',
          userEmail: '',
          currentPage: 'welcome' as PageId,
          activeTool: 'dashboard',
          tokenBalance: 100,
          tokensEarned: 0,
          totalTokensSpent: 0,
          userPlan: 'trial' as Plan,
          tokenHistory: [],
          tokenWarningShown: false,
          tokenExhaustedPopupOpen: false,
        });
      },

      setUserPlan: (plan: Plan) => {
        set({ userPlan: plan, tokenBalance: PLAN_TOKENS[plan] });
        // Log plan change as bonus tokens
        get().addTokenHistory({
          id: uid(),
          tool: `Plan: ${plan}`,
          tokens: PLAN_TOKENS[plan],
          time: Date.now(),
          type: 'bonus',
        });
      },

      spendTokens: (action: string): boolean => {
        const state = get();
        const cost = TOKEN_COSTS[action] ?? 0;
        if (cost === 0 || FREE_TOOLS.has(action)) return true;
        if (state.tokenBalance < cost) {
          // Show exhausted popup — non-skippable
          set({ tokenExhaustedPopupOpen: true });
          return false;
        }

        // Deduct tokens
        const newBalance = state.tokenBalance - cost;
        const newTotalSpent = state.totalTokensSpent + cost;

        // Record in history
        const entry: TokenTransaction = {
          id: uid(),
          tool: action,
          tokens: cost,
          time: Date.now(),
          type: 'spend',
        };

        set({
          tokenBalance: newBalance,
          totalTokensSpent: newTotalSpent,
          tokenHistory: [entry, ...state.tokenHistory].slice(0, 200), // Keep last 200
        });

        // Check if we should show 20% warning
        const maxTokens = PLAN_TOKENS[state.userPlan];
        if (maxTokens > 0) {
          const threshold = Math.floor(maxTokens * 0.2);
          if (newBalance <= threshold && newBalance > 0 && !state.tokenWarningShown) {
            // Show warning popup (skippable)
            set({ tokenModalOpen: true, tokenWarningShown: true });
          }
          // If tokens just hit 0
          if (newBalance <= 0) {
            set({ tokenExhaustedPopupOpen: true });
          }
        }

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

      checkMonthlyReset: () => {
        const state = get();
        const today = todayStr();
        const lastReset = state.lastResetDate;

        // Free tokens reset only on the 31st of every month
        if (isMonthlyResetDay() && lastReset !== today) {
          const planTokens = PLAN_TOKENS[state.userPlan];
          // For trial plan, reset to 100 free tokens
          // For paid plans, add a monthly top-up
          let resetAmount = 100;
          if (state.userPlan === 'starter') resetAmount = 500;
          else if (state.userPlan === 'pro') resetAmount = 3500;
          else if (state.userPlan === 'agency') resetAmount = 50000;
          // Elite is unlimited, no reset needed but update date
          if (state.userPlan === 'elite') {
            set({ lastResetDate: today });
            return;
          }

          const entry: TokenTransaction = {
            id: uid(),
            tool: 'Monthly Reset',
            tokens: resetAmount,
            time: Date.now(),
            type: 'reset',
          };

          set({
            tokenBalance: resetAmount,
            lastResetDate: today,
            tokenWarningShown: false, // Reset warning so it can show again
            tokenHistory: [entry, ...state.tokenHistory].slice(0, 200),
          });
        }
      },

      checkTokenWarning: (): { showWarning: boolean; showExhausted: boolean } => {
        const state = get();
        const maxTokens = PLAN_TOKENS[state.userPlan];
        if (maxTokens <= 0 || state.userPlan === 'elite') {
          return { showWarning: false, showExhausted: false };
        }
        const threshold = Math.floor(maxTokens * 0.2);
        return {
          showWarning: state.tokenBalance <= threshold && state.tokenBalance > 0,
          showExhausted: state.tokenBalance <= 0,
        };
      },

      dismissTokenWarning: () => {
        set({ tokenModalOpen: false, tokenWarningShown: true });
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      setWorkerUrl: (url: string) => set({ workerUrl: url }),
      setRegion: (region: string) => set({ region }),
      setDetectedRegion: (region: string | null) => set({ detectedRegion: region }),
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

      addTokenHistory: (entry: TokenTransaction) => {
        set((s) => ({
          tokenHistory: [entry, ...s.tokenHistory].slice(0, 200),
        }));
      },
    }),
    {
      name: 'nychiq-store',
      storage: ssrSafeStorage,
      partialize: (state) => ({
        currentPage: state.currentPage,
        activeTool: state.activeTool,
        isLoggedIn: state.isLoggedIn,
        userName: state.userName,
        userEmail: state.userEmail,
        onboardingCompleted: state.onboardingCompleted,
        userPlan: state.userPlan,
        tokenBalance: state.tokenBalance,
        tokensEarned: state.tokensEarned,
        totalTokensSpent: state.totalTokensSpent,
        signupTimestamp: state.signupTimestamp,
        lastResetDate: state.lastResetDate,
        tokenHistory: state.tokenHistory,
        workerUrl: state.workerUrl,
        region: state.region,
        detectedRegion: state.detectedRegion,
        referralCode: state.referralCode,
        searchFilter: state.searchFilter,
      }),
    }
  )
);
