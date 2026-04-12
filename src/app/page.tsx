'use client';

import React from 'react';
import { useNychIQStore, TOOL_META } from '@/lib/store';
import { Sidebar } from '@/components/nychiq/sidebar';
import { Topbar } from '@/components/nychiq/topbar';
import { MobileNav } from '@/components/nychiq/mobile-nav';
import { TokenPill } from '@/components/nychiq/token-pill';
import { UpgradeModal } from '@/components/nychiq/upgrade-modal';
import { TokenModal, TokenExhaustedOverlay } from '@/components/nychiq/token-modal';
import { NotificationDrawer } from '@/components/nychiq/notification-drawer';
import { CommandBar } from '@/components/nychiq/command-bar';
import { SakuPanel } from '@/components/nychiq/saku-panel';
import { SakuDailyPopup } from '@/components/nychiq/saku-daily-popup';
import { SakuFullPage } from '@/components/nychiq/saku-full-page';
import { WelcomePage } from '@/components/nychiq/welcome-page';
import { LoginPage } from '@/components/nychiq/login-page';
import { LegalPage } from '@/components/nychiq/legal-page';
import { CompanyPage } from '@/components/nychiq/company-page';
import { OnboardingQuestions } from '@/components/nychiq/onboarding-questions';
import { OnboardingAudit } from '@/components/nychiq/onboarding-audit';
import { OnboardingExtension } from '@/components/nychiq/onboarding-extension';
import { SakuGuide } from '@/components/nychiq/saku-guide';
import { DashboardTool } from '@/components/nychiq/dashboard-tool';
import { TrendingTool } from '@/components/nychiq/trending-tool';
import { SearchTool } from '@/components/nychiq/search-tool';
import { RankingsTool } from '@/components/nychiq/rankings-tool';
import { ShortsTool } from '@/components/nychiq/shorts-tool';
import { ViralTool } from '@/components/nychiq/viral-tool';
import { NicheTool } from '@/components/nychiq/niche-tool';
import { AlgorithmTool } from '@/components/nychiq/algorithm-tool';
import { CPMTool } from '@/components/nychiq/cpm-tool';
import { CompetitorsTool } from '@/components/nychiq/competitors-tool';
import { SEOTool } from '@/components/nychiq/seo-tool';
import { HookTool } from '@/components/nychiq/hook-tool';
import { KeywordsTool } from '@/components/nychiq/keywords-tool';
import { ScriptTool } from '@/components/nychiq/script-tool';
import { IdeasTool } from '@/components/nychiq/ideas-tool';
import { PostTimeTool } from '@/components/nychiq/posttime-tool';
import { AuditTool } from '@/components/nychiq/audit-tool';
import { ABTestTool } from '@/components/nychiq/ab-test-tool';
import { VPHTrackerTool } from '@/components/nychiq/vph-tracker-tool';
import { ThumbnailLabTool } from '@/components/nychiq/thumbnail-lab-tool';
import { SafeCheckTool } from '@/components/nychiq/safe-check-tool';
import { TrendAlertsTool } from '@/components/nychiq/trend-alerts-tool';
import { OutlierScoutTool } from '@/components/nychiq/outlier-scout-tool';
import { PerfForensicsTool } from '@/components/nychiq/perf-forensics-tool';
import { AutomationTool } from '@/components/nychiq/automation-tool';
import { SponsorshipTool } from '@/components/nychiq/sponsorship-tool';
import { HistoryIntelTool } from '@/components/nychiq/history-intel-tool';
import { StrategyTool } from '@/components/nychiq/strategy-tool';
import { SettingsTool } from '@/components/nychiq/settings-tool';
import { ProfileTool } from '@/components/nychiq/profile-tool';
import { UsageTool } from '@/components/nychiq/usage-tool';
import { StudioTool } from '@/components/nychiq/studio-tool';
import { DeepChatTool } from '@/components/nychiq/deepchat-tool';
import { SocialTrendsTool } from '@/components/nychiq/social-trends-tool';
import { SocialMentionsTool } from '@/components/nychiq/social-mentions-tool';
import { SocialCommentsTool } from '@/components/nychiq/social-comments-tool';
import { SocialChannelsTool } from '@/components/nychiq/social-channels-tool';
import { GoffViralTool } from '@/components/nychiq/goffviral-tool';
import { AgencyDashboardTool } from '@/components/nychiq/agency-tool';
import { DigitalScoutTool } from '@/components/nychiq/digital-scout-tool';
import { SovereignVaultTool } from '@/components/nychiq/sovereign-vault-tool';
import { NicheCompareTool } from '@/components/nychiq/niche-compare-tool';
import { OpportunityHeatmapTool } from '@/components/nychiq/opportunity-heatmap-tool';
import { MonetizationRoadmapTool } from '@/components/nychiq/monetization-roadmap-tool';
import { GhostTrackerTool } from '@/components/nychiq/ghost-tracker-tool';
import { BlueprintAITool } from '@/components/nychiq/blueprint-ai-tool';
import { NextUploaderTool } from '@/components/nychiq/next-uploader-tool';
import { ScriptFlowTool } from '@/components/nychiq/scriptflow-tool';
import { ArbitrageTool } from '@/components/nychiq/arbitrage-tool';
import { LumeTool } from '@/components/nychiq/lume-tool';
import { HookLabTool } from '@/components/nychiq/hooklab-tool';
import { PulseCheckTool } from '@/components/nychiq/pulsecheck-tool';
import { ChannelAssistantTool } from '@/components/nychiq/channel-assistant-tool';
import { MyChannelTool } from '@/components/nychiq/my-channel-tool';
import { AutoUploaderTool } from '@/components/nychiq/auto-uploader-tool';
import { CollaborationTool } from '@/components/nychiq/collaboration-tool';
import { ScheduledReportsTool } from '@/components/nychiq/scheduled-reports-tool';
import { VideoBatchTool } from '@/components/nychiq/video-batch-tool';
import { PlanGate } from '@/components/nychiq/plan-gate';
import { initAudio } from '@/lib/sounds';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Bot } from 'lucide-react';

/* ── Side-effects wrapper (hooks must be inside a component) ── */
function AppEffects() {
  React.useEffect(() => {
    const handler = () => { initAudio(); document.removeEventListener('click', handler); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  React.useEffect(() => {
    if (useNychIQStore.getState().isLoggedIn) {
      useNychIQStore.getState().checkMonthlyReset();
    }
  }, []);

  return null;
}

/* ── Generic tool placeholder ── */
function ToolPlaceholder() {
  const { activeTool } = useNychIQStore();
  const meta = TOOL_META[activeTool];
  const label = meta?.label ?? activeTool;
  const tokenBalance = useNychIQStore((s) => s.tokenBalance);
  const userPlan = useNychIQStore((s) => s.userPlan);

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in-up">
      <Card className="nychiq-card max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(253,186,45,0.1)] border border-[rgba(253,186,45,0.2)] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-[#FDBA2D]" />
          </div>
          <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">{label}</h2>
          <p className="text-sm text-[#A3A3A3] mb-4">
            This tool is ready to use. The full interface will be built in an upcoming task.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-[#444444]">
            <span>Tokens: {tokenBalance}</span>
            <span>·</span>
            <span>Plan: {userPlan}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Tool router (renders the right tool based on activeTool) ── */
function ToolRouter() {
  const { activeTool, canAccess } = useNychIQStore();

  // Check plan access before rendering any tool
  if (!canAccess(activeTool)) {
    const label = TOOL_META[activeTool]?.label ?? activeTool;
    return <PlanGate toolId={activeTool} toolLabel={label} />;
  }

  switch (activeTool) {
    case 'dashboard':
      return <DashboardTool />;
    case 'my-channel':
      return <MyChannelTool />;
    case 'trending':
      return <TrendingTool />;
    case 'search':
      return <SearchTool />;
    case 'rankings':
      return <RankingsTool />;
    case 'shorts':
      return <ShortsTool />;
    case 'viral':
      return <ViralTool />;
    case 'niche':
      return <NicheTool />;
    case 'algorithm':
      return <AlgorithmTool />;
    case 'cpm':
      return <CPMTool />;
    case 'competitor':
      return <CompetitorsTool />;
    case 'seo':
      return <SEOTool />;
    case 'hook':
      return <HookTool />;
    case 'keywords':
      return <KeywordsTool />;
    case 'script':
      return <ScriptTool />;
    case 'ideas':
      return <IdeasTool />;
    case 'posttime':
      return <PostTimeTool />;
    case 'audit':
      return <AuditTool />;
    case 'ab-test':
      return <ABTestTool />;
    case 'vph-tracker':
      return <VPHTrackerTool />;
    case 'thumbnail-lab':
      return <ThumbnailLabTool />;
    case 'safe-check':
      return <SafeCheckTool />;
    case 'trend-alerts':
      return <TrendAlertsTool />;
    case 'outlier-scout':
      return <OutlierScoutTool />;
    case 'perf-forensics':
      return <PerfForensicsTool />;
    case 'automation':
      return <AutomationTool />;
    case 'sponsorship-roi':
      return <SponsorshipTool />;
    case 'history-intel':
      return <HistoryIntelTool />;
    case 'strategy':
      return <StrategyTool />;
    case 'settings':
      return <SettingsTool />;
    case 'profile':
      return <ProfileTool />;
    case 'usage':
      return <UsageTool />;
    case 'studio':
      return <StudioTool />;
    case 'deepchat':
      return <DeepChatTool />;
    case 'social-trends':
      return <SocialTrendsTool />;
    case 'social-mentions':
      return <SocialMentionsTool />;
    case 'social-comments':
      return <SocialCommentsTool />;
    case 'social-channels':
      return <SocialChannelsTool />;
    case 'goffviral':
      return <GoffViralTool />;
    case 'agency-dashboard':
      return <AgencyDashboardTool />;
    case 'blueprint-ai':
      return <BlueprintAITool />;
    case 'next-uploader':
      return <NextUploaderTool />;
    case 'scriptflow':
      return <ScriptFlowTool />;
    case 'arbitrage':
      return <ArbitrageTool />;
    case 'lume':
      return <LumeTool />;
    case 'hooklab':
      return <HookLabTool />;
    case 'pulsecheck':
      return <PulseCheckTool />;
    case 'niche-compare':
      return <NicheCompareTool />;
    case 'opportunity-heatmap':
      return <OpportunityHeatmapTool />;
    case 'monetization-roadmap':
      return <MonetizationRoadmapTool />;
    case 'digital-scout':
      return <DigitalScoutTool />;
    case 'ghost-tracker':
      return <GhostTrackerTool />;
    case 'sovereign-vault':
      return <SovereignVaultTool />;
    case 'saku':
      return <SakuFullPage />;
    case 'channel-assistant':
      return <ChannelAssistantTool />;
    case 'auto-uploader':
      return <AutoUploaderTool />;
    case 'team-collab':
      return <CollaborationTool />;
    case 'scheduled-reports':
      return <ScheduledReportsTool />;
    case 'video-batch':
      return <VideoBatchTool />;
    default:
      return <ToolPlaceholder />;
  }
}

/* ── App shell (sidebar + topbar + content) ── */
function AppShell() {
  const { sakuOpen, sakuFullOpen, setSakuOpen, isLoggedIn } = useNychIQStore();

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar />

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6 overflow-y-auto">
          <ToolRouter />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Saku Virtual Guide overlay */}
      <SakuGuide />

      {/* Saku floating trigger button */}
      {isLoggedIn && !sakuOpen && !sakuFullOpen && (
        <button
          onClick={() => setSakuOpen(true)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#FDBA2D] flex items-center justify-center shadow-lg shadow-[rgba(253,186,45,0.25)] hover:scale-110 transition-transform animate-saku-glow"
          aria-label="Open Saku AI"
        >
          <Bot className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Saku floating panel */}
      <SakuPanel />

      {/* Saku full-page overlay */}
      <SakuFullPage />

      {/* Saku daily popup */}
      <SakuDailyPopup />

      {/* Modals & overlays */}
      <UpgradeModal />
      <TokenModal />
      <TokenExhaustedOverlay />
      <NotificationDrawer />
      <CommandBar />
    </div>
  );
}

/* ── Main app router ── */
export default function NychIQApp() {
  const { currentPage, isLoggedIn } = useNychIQStore();

  // If user is logged in but somehow on welcome/login page (e.g. stale state), redirect to app
  const effectivePage = (isLoggedIn && (currentPage === 'welcome' || currentPage === 'login'))
    ? 'app'
    : currentPage;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#FFFFFF]">
      <AppEffects />
      {effectivePage === 'welcome' && <WelcomePage />}
      {effectivePage === 'login' && <LoginPage />}
      {effectivePage === 'app' && <AppShell />}
      {effectivePage === 'privacy' && <LegalPage type="privacy" />}
      {effectivePage === 'terms' && <LegalPage type="terms" />}
      {effectivePage === 'refund' && <LegalPage type="refund" />}
      {effectivePage === 'cookies' && <LegalPage type="cookies" />}
      {effectivePage === 'about' && <CompanyPage type="about" />}
      {effectivePage === 'contact' && <CompanyPage type="contact" />}
      {effectivePage === 'careers' && <CompanyPage type="careers" />}
      {effectivePage === 'changelog' && <CompanyPage type="changelog" />}
      {effectivePage === 'blog' && <CompanyPage type="blog" />}
      {effectivePage === 'ob-questions' && <OnboardingQuestions />}
      {effectivePage === 'ob-audit' && <OnboardingAudit />}
      {effectivePage === 'ob-extension' && <OnboardingExtension />}
    </div>
  );
}
