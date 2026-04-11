---
Task ID: 4
Agent: Main Agent
Task: Fix Blog Page, Channel Assistant Popup, Channel Avatar, Branding Consistency

Work Log:
- Read worklog.md and all relevant source files to understand project architecture
- Fixed 4 critical bugs/features across 8 files

## TASK 1: Fix Blog Page
- Added `'blog'` to `PageId` type union in `src/lib/store.ts`
- Added `blog` entry to `PAGE_CONFIG` in `src/components/nychiq/company-page.tsx`
- Created `BLOG_POSTS` data array with 6 mock blog posts (Growth Tips, Algorithm Updates, Creator Stories, Product News)
- Added `BlogSection` component with featured post card, 2-column grid, and newsletter subscribe CTA
- Each blog card shows category tag, date, title, excerpt, read time, and "Read" arrow link
- Cards show toast "Blog post coming soon" on click via sonner
- Added `{effectivePage === 'blog' && <CompanyPage type="blog" />}` routing in `src/app/page.tsx`
- Changed welcome-page.tsx Blog link from `page: 'about'` to `page: 'blog'`

## TASK 2: Post-Install Channel Assistant Popup
- Added `showChannelPopup` state to `onboarding-extension.tsx`
- "Go to Dashboard" and "Skip extension" buttons now trigger popup instead of immediately completing onboarding
- Created animated modal overlay with PartyPopper icon, "Personalize Your AI Assistant" title, feature pills
- "Customize Now" calls completeOnboarding() + setActiveTool('channel-assistant') + setPage('app')
- "Skip, Go to Dashboard" calls completeOnboarding() normally
- Styled with #FDBA2D accent color, semi-transparent backdrop, rounded-2xl card
- Also fixed logo to use standard NychIQ play-button SVG pattern (replaced gradient Sparkles icon)

## TASK 3: Channel Avatar on Dashboard Top Nav
- In `onboarding-audit.tsx`, saves channel profile to localStorage when audit report is shown:
  ```ts
  localStorage.setItem('nychiq_channel_profile', JSON.stringify({ name, url, avatarColor: '#FDBA2D' }));
  ```
- In `topbar.tsx`:
  - Added lazy `useState` to read channel profile from localStorage
  - Added "My Channel" dropdown item with Sliders icon that navigates to channel-assistant
  - Avatar shows channel initial with gold background + ring-2 gold ring if profile exists
  - Falls back to gradient with user initial if no profile
  - Title attribute shows channel name

## TASK 4: NychIQ Branding Consistency Audit & Fix

Audited all pages/components for NychIQ logo consistency:

### Files Verified (Already Correct):
- `sidebar.tsx` ✅ - Standard logo with play SVG
- `welcome-page.tsx` ✅ - Standard logo in hero and footer
- `login-page.tsx` ✅ - Standard logo
- `company-page.tsx` ✅ - Standard logo in top bar (w-5 h-5, tracking-[1.5px])

### Files Fixed:
1. **`legal-page.tsx`** — Had `Sparkles` icon instead of play-button SVG. Fixed to use standard logo pattern.
2. **`onboarding-questions.tsx`** — Had gradient circle + Sparkles icon. Fixed to use standard logo pattern.
3. **`onboarding-audit.tsx`** — Had gradient circle + Sparkles icon. Fixed to use standard logo pattern. Also added channel profile localStorage save.
4. **`onboarding-extension.tsx`** — Had gradient circle + Sparkles icon. Fixed to use standard logo pattern. Also added popup and button logic.

### Files Verified (No Logo Needed):
- `notification-drawer.tsx` ✅ — Notification drawer, no logo needed
- `token-modal.tsx` ✅ — Modal with Coins icon header, no logo needed
- `upgrade-modal.tsx` ✅ — Modal with gradient title, no logo needed
- `saku-daily-popup.tsx` ✅ — Saku AI popup, no logo needed
- `saku-panel.tsx` ✅ — Saku AI chat panel, no logo needed
- `saku-full-page.tsx` ✅ — Saku AI full page, no logo needed
- `mobile-nav.tsx` ✅ — Tab icons only, no logo needed
- `dashboard-tool.tsx` ✅ — Inside AppShell, sidebar handles branding

All lint checks pass with 0 errors.

Stage Summary:
- Key files modified: store.ts, page.tsx, company-page.tsx, welcome-page.tsx, onboarding-extension.tsx, onboarding-audit.tsx, onboarding-questions.tsx, legal-page.tsx, topbar.tsx
- Blog page now fully functional with 6 mock posts, featured card layout, newsletter CTA
- Channel Assistant popup shows after onboarding completion with smooth animation
- Topbar avatar now shows channel profile photo initial with gold ring
- All 4 onboarding/legal pages now use consistent NychIQ logo
