'use client';

import React from 'react';
import { useNychIQStore, TOOL_META } from '@/lib/store';
import { Sidebar } from '@/components/nychiq/sidebar';
import { Topbar } from '@/components/nychiq/topbar';
import { MobileNav } from '@/components/nychiq/mobile-nav';
import { TokenPill } from '@/components/nychiq/token-pill';
import { UpgradeModal } from '@/components/nychiq/upgrade-modal';
import { TokenModal } from '@/components/nychiq/token-modal';
import { NotificationDrawer } from '@/components/nychiq/notification-drawer';
import { CommandBar } from '@/components/nychiq/command-bar';
import { SakuPanel } from '@/components/nychiq/saku-panel';
import { SakuFullPage } from '@/components/nychiq/saku-full-page';
import { WelcomePage } from '@/components/nychiq/welcome-page';
import { LoginPage } from '@/components/nychiq/login-page';
import { LegalPage } from '@/components/nychiq/legal-page';
import { CompanyPage } from '@/components/nychiq/company-page';
import { OnboardingQuestions } from '@/components/nychiq/onboarding-questions';
import { OnboardingAudit } from '@/components/nychiq/onboarding-audit';
import { OnboardingExtension } from '@/components/nychiq/onboarding-extension';
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

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
          <div className="w-14 h-14 rounded-2xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-[#F5A623]" />
          </div>
          <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">{label}</h2>
          <p className="text-sm text-[#888888] mb-4">
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
  const { activeTool } = useNychIQStore();

  switch (activeTool) {
    case 'dashboard':
      return <DashboardTool />;
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
    default:
      return <ToolPlaceholder />;
  }
}

/* ── App shell (sidebar + topbar + content) ── */
function AppShell() {
  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
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

      {/* Saku floating panel */}
      <SakuPanel />

      {/* Saku full-page overlay */}
      <SakuFullPage />

      {/* Modals & overlays */}
      <UpgradeModal />
      <TokenModal />
      <NotificationDrawer />
      <CommandBar />
    </div>
  );
}

/* ── Main app router ── */
export default function NychIQApp() {
  const { currentPage } = useNychIQStore();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8E8E8]">
      {currentPage === 'welcome' && <WelcomePage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'app' && <AppShell />}
      {currentPage === 'privacy' && <LegalPage type="privacy" />}
      {currentPage === 'terms' && <LegalPage type="terms" />}
      {currentPage === 'refund' && <LegalPage type="refund" />}
      {currentPage === 'cookies' && <LegalPage type="cookies" />}
      {currentPage === 'about' && <CompanyPage type="about" />}
      {currentPage === 'contact' && <CompanyPage type="contact" />}
      {currentPage === 'careers' && <CompanyPage type="careers" />}
      {currentPage === 'changelog' && <CompanyPage type="changelog" />}
      {currentPage === 'ob-questions' && <OnboardingQuestions />}
      {currentPage === 'ob-audit' && <OnboardingAudit />}
      {currentPage === 'ob-extension' && <OnboardingExtension />}
    </div>
  );
}
