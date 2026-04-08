# NychIQ — Complete Platform Rebuild Specification
**For AI Agent Rebuild — Everything needed to recreate from scratch**

---

## 1. PLATFORM IDENTITY

- **Name:** NychIQ
- **Tagline:** "YouTube Intelligence Platform"
- **Sub-tagline:** "Real-time viral scoring, competitor intelligence, AI content strategy and CPM tracking. Built for serious creators and agencies."
- **Target market:** Nigerian and African YouTube creators, agencies
- **Headquarters:** Lagos, Nigeria
- **Currency:** NGN (₦) primary, USD secondary
- **Domain:** nychiq.com
- **Stats to display:** 2.4M+ Videos Indexed, 94% Viral Accuracy, 3,200+ Active Creators, 13+ Intelligence Engines

---

## 2. TECH STACK

### Architecture
- **Single-file HTML app** — everything in one `.html` file (HTML + CSS + JS)
- **Deployed on:** Cloudflare Pages (no build step needed — upload direct)
- **Backend:** Cloudflare Worker at `WORKER_URL` (proxies all API calls)
- **No frameworks** — vanilla ES5 JavaScript, no npm, no React
- **Storage:** `localStorage` only (no database on client)

### API Stack (all routed through Cloudflare Worker)
| Service | Purpose | Endpoint |
|---|---|---|
| YouTube Data API v3 | Trending, search, channel stats, video data | `WORKER_URL/api/youtube` |
| Groq AI (llama-3.3-70b-versatile) | All AI text generation | `WORKER_URL/api/groq` |
| HuggingFace Inference | Sentiment, classification, thumbnail description | `WORKER_URL/api/hf` |
| SociaVault | Cross-platform social trends | `WORKER_URL/api/sociavault` |
| GoffViral-V1 | TikTok viral predictor (custom model) | `WORKER_URL/api/goffviral` |
| Paystack | Payment processing | paystack.com/pay/nychiq-[plan] |

### HuggingFace Models Used
- `cardiffnlp/twitter-roberta-base-sentiment-latest` — comment sentiment
- `facebook/bart-large-mnli` — title/niche classification (zero-shot)
- `Salesforce/blip-image-captioning-base` — thumbnail description

---

## 3. COLOR SYSTEM (CSS Variables)

```css
:root {
  /* Backgrounds */
  --bg:      #0A0A0A;   /* Main content bg */
  --bg2:     #111111;   /* Cards, secondary bg */
  --bg3:     #1A1A1A;   /* Tertiary, inputs */
  --sidebar: #070707;   /* Sidebar bg (darkest) */

  /* Borders */
  --border:  #222222;   /* Primary border */
  --border2: #2A2A2A;   /* Secondary border */

  /* Text */
  --text:    #E8E8E8;   /* Primary text */
  --text2:   #888888;   /* Secondary text */
  --muted:   #444444;   /* Muted/disabled text */

  /* Brand & Accent Colors */
  --accent:  #F5A623;   /* PRIMARY — Amber/Gold (buttons, highlights, brand) */
  --gold:    #F5A623;   /* Same as accent */
  --green:   #00C48C;   /* Success, live, viral high */
  --blue:    #4A9EFF;   /* Info, links, data */
  --purple:  #9B72CF;   /* AI features, Saku */
  --red:     #E05252;   /* Error, danger, alerts */

  /* Effects */
  --shadow:  0 4px 24px rgba(0,0,0,.95);
  --shine:   inset 0 1px 0 rgba(255,255,255,.04);
  --mono:    'Inter', sans-serif;
}
```

### Color Usage Rules
- **#F5A623 (Amber)** — CTAs, brand logo, token pills, active states, primary buttons
- **#00C48C (Green)** — Live indicators, viral badges, success, high scores
- **#4A9EFF (Blue)** — Info badges, links, data visualization
- **#9B72CF (Purple)** — AI features, Saku AI, Deep Chat
- **#E05252 (Red)** — Alerts, Elite+/Agency badges, danger zones
- **Background gradient** — `linear-gradient(135deg, rgba(245,166,35,.04), #0D0D0D)` for hero cards
- **#000000** — Page background outside app

---

## 4. TYPOGRAPHY

```css
/* Primary Font: Inter (Google Fonts) */
font-family: 'Inter', sans-serif;

/* Weights used: 400 (body), 600 (nav), 700 (labels), 800 (cards), 900 (headings/prices) */

/* Font Scale */
--text-xs:   9px;   /* Labels, badges */
--text-sm:   11px;  /* Nav items, meta */
--text-base: 13px;  /* Body, card text */
--text-md:   15px;  /* Subtitles */
--text-lg:   22px;  /* Stat values */
--text-xl:   32px;  /* Hero numbers */
--text-2xl:  50px+; /* Hero headline */

/* Letter spacing patterns */
/* Labels: letter-spacing: 1-2px + text-transform: uppercase */
/* Nav: letter-spacing: 0.3px */
/* Brand name: letter-spacing: 2px */
```

---

## 5. LAYOUT STRUCTURE

```
┌─────────────────────────────────────────────────┐
│                  pg-welcome                     │  Full landing page
├─────────────────────────────────────────────────┤
│                   pg-login                      │  Auth (Sign Up / Sign In)
├─────────────────────────────────────────────────┤
│  pg-app  (display:flex; height:100svh)          │
│  ┌─────────┬───────────────────────────────┐    │
│  │ SIDEBAR │  MAIN (flex:1)                │    │
│  │ 260px   │  ┌─────────────────────────┐  │    │
│  │ fixed   │  │ TOPBAR (52-56px height) │  │    │
│  │ #070707 │  ├─────────────────────────┤  │    │
│  │         │  │ CONTENT (#main div)     │  │    │
│  │         │  │ overflow-y:auto        │  │    │
│  │         │  │ flex:1; min-height:0   │  │    │
│  │         │  └─────────────────────────┘  │    │
│  └─────────┴───────────────────────────────┘    │
│  [MOBILE: bottom nav bar, sidebar slides in]    │
├─────────────────────────────────────────────────┤
│  pg-ob-questions / pg-ob-audit / pg-ob-extension│  Onboarding
├─────────────────────────────────────────────────┤
│  pg-privacy / pg-terms / pg-refund / pg-cookies │  Legal
├─────────────────────────────────────────────────┤
│  pg-about / pg-contact / pg-careers / pg-changelog │  Company
└─────────────────────────────────────────────────┘
```

### Key CSS Layout Rules
```css
/* Page routing */
.pg { display: none !important; }
.pg.show { display: block !important; }
#pg-app.show { display: flex !important; height: 100svh !important; overflow: hidden !important; }

/* App layout */
.layout { display: flex; min-height: 100svh; height: 100svh; }
.sidebar { width: 260px; background: #070707; border-right: 1px solid #1E1E1E; position: fixed; top: 0; left: 0; bottom: 0; }
.main { margin-left: 260px; flex: 1; display: flex; flex-direction: column; height: 100svh; overflow-y: hidden; }
.topbar { height: 56px; background: #0A0A0A; border-bottom: 1px solid #1E1E1E; display: flex; align-items: center; padding: 0 12px; gap: 8px; }
.content { padding: 20px 24px; flex: 1; background: #0A0A0A; min-height: 0; overflow-y: auto; overflow-x: hidden; }

/* Mobile overrides at max-width:640px */
/* - Sidebar: position:fixed, transform:translateX(-100%), slides in on open */
/* - Main: margin-left:0 */
/* - Content: height:calc(100svh - 52px), padding-bottom:80px */
/* - Topbar: 52px height, search bar hidden, chips hidden */
/* - Bottom nav: position:fixed, bottom:0, height:56px, 6-column grid */
/* - Desktop: bottom nav display:none */
```

---

## 6. COMPONENT LIBRARY

### Cards
```css
.card { background: #111111; border: 1px solid #1E1E1E; border-radius: 8px; padding: 18px; }
.card-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #E8E8E8; letter-spacing: 0.5px; text-transform: uppercase; }

/* Stat Card */
.stat-card { background: #0D0D0D; border: 1px solid #1E1E1E; border-top: 2px solid var(--sc, var(--accent)); border-radius: 8px; padding: 16px; }
.stat-value { font-family: Inter; font-size: 24px; font-weight: 900; color: var(--text); }
.stat-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-change { font-size: 11px; color: var(--text2); margin-top: 4px; }
```

### Buttons
```css
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 2px; font-size: 12px; font-weight: 700; cursor: pointer; }
.btn-accent { background: #F5A623; color: #000; font-weight: 800; border: none; text-transform: uppercase; letter-spacing: 1px; }
.btn-gold { background: #F5A623; color: #000; font-weight: 800; border: none; }
.btn-outline { background: transparent; border: 1px solid #2A2A2A; color: #888; }
/* Primary hero buttons */
.wn-btn-p { background: #F5A623; color: #000; font-weight: 800; border-radius: 8px; padding: 13px 26px; }
.wn-btn-s { background: transparent; border: 1px solid #2A2A2A; color: #aaa; border-radius: 8px; }
```

### Inputs
```css
.inp { width: 100%; background: #1A1A1A; border: 1px solid #222; border-radius: 4px; padding: 11px 14px; font-size: 13px; color: #E8E8E8; font-family: Inter; outline: none; }
.inp:focus { border-color: #F5A623; }
/* Mobile: font-size: 16px to prevent iOS zoom */
```

### Chips / Filter Pills
```css
.chip { padding: 4px 10px; border-radius: 1px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,.04); border: 1px solid #222; color: #666; cursor: pointer; }
.chip.active { background: #F5A623; color: #000; border-color: #F5A623; }
```

### Result/AI Output Cards
```css
.res { background: #0D0D0D; border: 1px solid #1E1E1E; border-radius: 8px; padding: 14px; margin-top: 10px; }
.res-lbl { font-size: 10px; font-weight: 800; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.res-val { font-size: 13px; color: #888; line-height: 1.7; }
```

### Icon Badges (used in card titles)
```css
.ib { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ib-red    { background: rgba(255,59,59,.12);    color: #FF4444; }
.ib-gold   { background: rgba(245,166,35,.12);   color: #F5A623; }
.ib-green  { background: rgba(0,196,140,.12);    color: #00C48C; }
.ib-blue   { background: rgba(74,158,255,.12);   color: #4A9EFF; }
.ib-purple { background: rgba(155,114,207,.12);  color: #9B72CF; }
.ib-muted  { background: rgba(255,255,255,.04);  color: #666; }
```

### Live Indicator
```html
<div class="live-ind">
  <div class="ldot" style="width:6px;height:6px;border-radius:50%;background:#00C48C;animation:blink 1.5s infinite"></div>
  <span class="ltxt" style="font-size:10px;font-weight:700;color:#00C48C">LIVE</span>
</div>
```

### Toast Notifications
```javascript
// showToast(message, type)
// Appears at bottom center, auto-dismisses after 3s
// border-color: var(--accent) for info, var(--red) for error
```

### Spinner
```html
<div class="spinner"></div>
/* CSS: border: 2px solid var(--border); border-top-color: var(--accent); animation: spin .7s linear infinite; */
```

### Grids
```css
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.g4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
.stats-row { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; }
.vgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap: 10px; }
/* Mobile: all grids → 1fr (except stats-row → 1fr 1fr) */
```

---

## 7. SIDEBAR NAVIGATION

**Width:** 260px fixed, `#070707` background, right border `1px solid #1E1E1E`

### Structure
```
[NYCHIQ Logo] ← brand header, links to goPage('welcome')
[Sidebar plan label] ← e.g. "★ Elite Plan"

=== OVERVIEW ===
- Dashboard        (dashboard)    FREE
- Trending         (trending)     FREE
- Search           (search)       FREE  [search bar with filters]
- Rankings         (rankings)     PRO+
- Shorts Intel     (shorts)       PRO+
- Saku AI          (saku)         FREE  [purple AI badge]
- Studio           (studio)       PRO+

=== INTELLIGENCE ===
- Viral Score      (viral)        PRO+
- Niche Spy        (niche)        PRO+
- Algorithm Monitor(algorithm)    PRO+
- CPM Estimator    (cpm)          ELITE+
- Competitor Tracker(competitors) ELITE+

=== AI TOOLS ===
- SEO Optimizer    (seo)          PRO+
- Hook Generator   (hook)         PRO+
- Keyword Explorer (keywords)     ELITE+
- Script Writer    (script)       PRO+
- Video Ideas      (ideas)        PRO+
- Best Post Time   (posttime)     FREE
- Channel Audit    (audit)        ELITE+
- A/B Tester       (ab-test)      PRO+  [NEW badge]
- VPH Tracker      (vph-tracker)  PRO+  [NEW badge]
- Thumbnail Lab    (thumbnail-lab)PRO+  [NEW badge]
- Safe Check       (safe-check)   ELITE+[NEW badge]
- Trend Alerts     (trend-alerts) FREE  [NEW badge]
- Outlier Scout    (outlier-scout)PRO+  [NEW badge]
- Perf Forensics   (perf-forensics)ELITE+[ELITE+ badge]
- Automation Master(automation)   PRO+  [NEW badge]
- Sponsorship ROI  (sponsor-calc) FREE  [NEW badge]
- History Intel    (history-intel)ELITE+[NEW badge]
- Copy Strategy    (strategy)     AGENCY ONLY

=== SOCIAL INTEL ===
- GoffViral TikTok (goffviral)    AGENCY ONLY
- Cross-Platform   (social-trends)ELITE+
- Channel Mentions (social-mentions)ELITE+
- Comment Sentiment(social-comments)ELITE+
- Channel Stats    (social-channels)ELITE+
- Deep Chat AI     (deepchat)     FREE

=== ACCOUNT ===
- Agency Dashboard (agency)       AGENCY ONLY
- Settings         (settings)     FREE
- Token Usage      (usage)        FREE
```

### Nav Item CSS
```css
.nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 14px; cursor: pointer; font-size: 11px; font-weight: 600; color: #666; transition: all .15s; border-left: 2px solid transparent; }
.nav-item:hover { background: rgba(255,255,255,.04); color: #E8E8E8; border-left-color: #333; }
.nav-item.active { background: rgba(245,166,35,.08); color: #F5A623; border-left: 2px solid #F5A623; }
.nav-item.locked { opacity: 0.5; }
.nav-label { font-size: 9px; font-weight: 800; color: #333; letter-spacing: 2px; text-transform: uppercase; padding: 16px 14px 6px; }
.nav-section { border-top: 1px solid #1E1E1E; padding-top: 4px; margin-top: 4px; }
/* Nav badge (NEW, PRO+, etc) */
.nb { font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 10px; margin-left: auto; }
```

---

## 8. TOPBAR

**Height:** 56px (desktop), 52px (mobile)
**Background:** `#0A0A0A`
**Border-bottom:** `1px solid #1E1E1E`

### Elements (left → right)
1. **Hamburger** — `toggleSidebar()` — 3 lines SVG — 34px circle
2. **Page Title** — `id="pgTitle"` — font-size:10px, font-weight:700, letter-spacing:1px
3. **Search Bar** — real input + filter dropdown (All/Videos/Shorts/Channels) + GO button — calls `doTopbarSearch()`
   - Hidden on mobile (display:none at ≤640px)
4. **Filter Chips** — All/Videos/Shorts/Channels — hidden on mobile
5. **Token Pill** — `id="token-pill"` — ⚡ icon + token count + " Tokens" label — amber gradient background — `showTokenModal()` onclick
6. **Country Selector** — flag + code + dropdown — `toggleCountryMenu()` — hidden on mobile
7. **Notification Bell** — `toggleNotifDrawer()` — notification dot indicator
8. **Refresh Button** — `refreshAll()` — circular, hidden by default, shown on live-data pages
9. **User Avatar** — circle with initials — `toggleUserMenu()` — opens dropdown with: Profile, Settings, Token Usage, Sign Out

### User Dropdown CSS
```css
.user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: #111; border: 1px solid #222; border-radius: 10px; padding: 6px; width: 200px; z-index: 999; }
.udrop-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; font-size: 13px; font-weight: 600; color: #888; cursor: pointer; border-radius: 6px; }
.udrop-item:hover { background: rgba(255,255,255,.04); color: #E8E8E8; }
```

---

## 9. BOTTOM MOBILE NAV BAR

**Only shows on mobile (≤640px)**
**Position:** fixed, bottom:0, height:56px, 6-column grid, z-index:200

### 6 Tabs
1. **Home** → `dashboard` — grid icon
2. **Trending** → `trending` — fire icon
3. **Search** → `search` — search icon
4. **Spy** → `competitors` — eye icon
5. **Social** → `social-trends` — trending up icon
6. **Profile** → `profile` (calls `renderProfile()`) — user icon

```css
.btab { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 5px 2px; font-size: 8px; font-weight: 600; color: rgba(255,255,255,.5); }
.btab.active { color: #F5A623; }
.btab-dot { width: 4px; height: 4px; border-radius: 50%; background: #F5A623; display: none; }
.btab.active .btab-dot { display: block; }
```

---

## 10. TOKEN / MONETIZATION SYSTEM

### Token Economics (₦10 per token)
```
Starter  — ₦15,000/month — 500 tokens
Pro      — ₦35,000/month — 3,500 tokens
Elite    — ₦70,000/month — Unlimited (soft cap 50K)
Agency   — ₦150,000/month — 20,000 tokens + team pooling
Free Trial — 100 tokens (staged: 20 now + 30 on Day 1 + 50 on Day 3)
```

### Top-Up Packs
- ₦5,000 = 500 tokens
- ₦20,000 = 2,200 tokens (+10% bonus)
- ₦50,000 = 6,000 tokens (+20% bonus)

### Token Costs Per Feature
```javascript
// FREE
dashboard:0, profile:0, settings:0, usage:0, studio:0

// 1-2 tokens (₦10-20)
viral:1, saku:1, rankings:2, cpm:2, keywords:2

// 3-5 tokens (₦30-50)
trending:3, algorithm:3, deepchat:3, saku3x:3, seo:5, posttime:5, shorts:5

// 6-10 tokens (₦60-100)
ideas:6, hook:8, thumbnail:8, 'ab-test':8, crossplatform:8, niche:8
search:8, sentiment:10, competitor:10, 'thumbnail-lab':8, 'trend-alerts':3

// 12-20 tokens (₦120-200)
script:12, 'outlier-scout':12, 'history-intel':10, audit:20
strategy:15, goffviral:15, 'perf-forensics':15, agency:20
'automation':10, 'sponsorship-roi':8, 'safe-check':5, 'vph-tracker':2
```

### Key Token Functions
```javascript
spendTokens(action)       // Deducts tokens, returns false if insufficient, opens modal
updateTokenDisplay()      // Syncs pill, modal, count display
showTokenModal(outOfTokens) // Shows token modal
checkStagedTokens()       // Runs on boot — releases staged free tokens
TOKEN_BALANCE             // Global var, loaded from localStorage
```

### Staged Release Logic
```javascript
// On signup: 20 tokens immediately
// After 24 hours: +30 tokens (total 50)
// After 72 hours: +50 tokens (total 100)
localStorage.setItem('nychiq-signup-ts', Date.now());
localStorage.setItem('nychiq-tokens-total-earned', '20');
```

---

## 11. ALL FEATURE PAGES (42 total)

### Core Intelligence
| Page Key | Function | Title | Plan | Token Cost |
|---|---|---|---|---|
| `dashboard` | `pgDashboard()` | Dashboard | FREE | 0 |
| `trending` | `pgTrending()` | Trending | FREE | 3 |
| `search` | `pgSearch()` | Search | FREE | 8 |
| `rankings` | `pgRankings()` | Rankings | PRO+ | 2 |
| `shorts` | `pgShorts()` | Shorts Intel | PRO+ | 5 |
| `viral` | `pgViral()` | Viral Score | PRO+ | 1 |
| `niche` | `pgNiche()` | Niche Spy | PRO+ | 8 |
| `algorithm` | `pgAlgorithm()` | Algorithm Monitor | PRO+ | 3 |
| `cpm` | `pgCPM()` | CPM Estimator | ELITE+ | 2 |
| `competitors` | `pgCompetitors()` | Competitor Tracker | ELITE+ | 10 |

### AI Tools
| Page Key | Function | Title | Plan | Token Cost |
|---|---|---|---|---|
| `seo` | `pgSEO()` | SEO Optimizer | PRO+ | 5 |
| `hook` | `pgHook()` | Hook Generator | PRO+ | 8 |
| `keywords` | `pgKeywords()` | Keyword Explorer | ELITE+ | 2 |
| `script` | `pgScript()` | Script Writer | PRO+ | 12 |
| `ideas` | `pgIdeas()` | Video Ideas | PRO+ | 6 |
| `posttime` | `pgPostTime()` | Best Post Time | FREE | 5 |
| `audit` | `pgAudit()` | Channel Audit | ELITE+ | 20 |
| `strategy` | `pgStrategy()` | Copy Strategy | AGENCY | 15 |
| `ab-test` | `pgABTest()` | A/B Tester | PRO+ | 8 |
| `vph-tracker` | `pgVPHTracker()` | VPH Tracker | PRO+ | 2 |
| `thumbnail-lab` | `pgThumbnailLab()` | Thumbnail Lab | PRO+ | 8 |
| `safe-check` | `pgSafeCheck()` | Safe Content Checker | ELITE+ | 5 |
| `trend-alerts` | `pgTrendAlerts()` | Trend Alerts | FREE | 3 |
| `outlier-scout` | `pgOutlierScout()` | Outlier Scout | PRO+ | 12 |
| `perf-forensics` | `pgPerfForensics()` | Performance Forensics | ELITE+ | 15 |
| `sponsor-calc` | `pgSponsorCalc()` | Sponsorship ROI | FREE | 8 |
| `automation` | `pgAutomation()` | Automation Master | PRO+ | 10 |
| `history-intel` | `pgHistoryIntel()` | History Intel | ELITE+ | 10 |

### Social Intel (SociaVault powered)
| Page Key | Function | Title | Plan |
|---|---|---|---|
| `social-trends` | `pgSocialTrends()` | Cross-Platform Trends | ELITE+ |
| `social-mentions` | `pgSocialMentions()` | Channel Mentions | ELITE+ |
| `social-comments` | `pgSocialComments()` | Comment Sentiment | ELITE+ |
| `social-channels` | `pgSocialChannels()` | Channel Stats | ELITE+ |

### Premium / Special
| Page Key | Function | Title | Plan |
|---|---|---|---|
| `deepchat` | `pgDeepChat()` | Deep Chat AI | FREE |
| `goffviral` | `pgGoffviral()` | GoffViral TikTok Predictor | AGENCY |
| `studio` | `pgStudio()` | Nychiq Studio | PRO+ |
| `agency` | `pgAgency()` | Agency Dashboard | AGENCY |
| `saku` | (inline) | Saku AI Panel | FREE |
| `usage` | `pgUsage()` | Token Usage | FREE |
| `settings` | `pgSettings()` | Settings | FREE |
| `profile` | `renderProfile()` | Profile | FREE |

---

## 12. FEATURE DESCRIPTIONS (for welcome page cards)

### Core Modules
1. **Command Center** (Dashboard) — Real-time stats, viral scores, trending grid, live activity feed in one view. Tag: `ALL PLANS`
2. **Trending Engine** — Live trending data by region, category, and time. 9 regions. Tag: `LIVE DATA`
3. **Viral Predictor** — Proprietary algorithm scores every video 1-99 using velocity, engagement, recency. Tag: `PROPRIETARY`
4. **Niche Spy** — AI scans thousands of niches to surface untapped sub-niches with high view potential. Tag: `AI POWERED`
5. **CPM Estimator** — Real CPM rates across 8 major niches (Finance, AI/Tech, Health, Education, Gaming, Food, Fitness, Business) with revenue calculator. Tag: `REVENUE DATA`
6. **Competitor Tracker** — Track any channel, pull live stats, get AI strategy analysis to find weaknesses. Tag: `ELITE+`
7. **Rankings** — Top 10 video and shorts leaderboard sorted by viral score, views, engagement. Tag: `PRO+`
8. **Shorts Intel** — Trending YouTube Shorts with viral scores. Tag: `PRO+`
9. **Algorithm Monitor** — AI-powered signal tracker. Know what the algorithm rewards this week. Tag: `ELITE+`
10. **SEO Optimizer** — AI generates optimized titles, descriptions, tags, hashtags, thumbnail concepts. Tag: `AI POWERED`
11. **Hook Generator** — AI writes first 30 seconds: shocking stat, FOMO, value tease, CTA. 3 hook styles. Tag: `NEW`
12. **Copy Strategy** — Extract exact title formula, thumbnail style, posting strategy from any channel. Tag: `AGENCY+`
13. **Universal Search** — Search any video, channel, or keyword. Filter by type. Viral scores on every result. Tag: `ALL PLANS`
14. **A/B Title & Thumbnail Tester** — Test 2 concepts head-to-head. AI predicts CTR winner. Tag: `NEW · PRO+`
15. **VPH Tracker** — Hour-by-hour velocity charts. Spot viral content in first 6 hours. Tag: `NEW · PRO+`
16. **Safe Content Checker** — Scan scripts/titles for demonetization-risk keywords. Tag: `NEW · ELITE+`
17. **Trend Alerts** — Set keyword triggers, get notifications when topics spike 500%+. Tag: `NEW · ALL PLANS`

### AI Tools
18. **Keyword Explorer** — Search volume, competition score, keyword opportunities with YouTube context
19. **Script Writer** — Full video script with sections: Hook, Intro, Body, CTA, Outro
20. **Video Ideas** — 10 high-potential ideas based on your niche, with viral score prediction
21. **Best Post Time** — Optimal upload schedule based on niche + region (heatmap included)
22. **Channel Audit** — Full health check: health score 0-100, SEO gaps, action plan
23. **Outlier Scout** — Finds videos from small channels (<1K subs) that got 100K+ views. Replicable viral formats
24. **Performance Forensics** — Diagnose why any video underperformed. CTR failure, retention, algorithm signals
25. **Sponsorship ROI** — Calculate exact what to charge for brand deals. Live rate calculator + AI market analysis
26. **Automation Master** — Cash cow channel strategy. High-CPM niches + low-competition topics for faceless channels
27. **Thumbnail Lab** — CTR score 0-100, color psychology, text readability, improvements
28. **History Intel** — Track thumbnail evolution, title A/B testing patterns, upload time optimization
29. **Trend Alerts** — Keyword-triggered notifications when topics spike in your niche

### Social Intel
30. **Cross-Platform Trends** — TikTok, Twitter/X, Instagram, YouTube trends before they blow up (SociaVault)
31. **Channel Mentions** — Find who's talking about any YouTube channel across platforms
32. **Comment Sentiment** — Sentiment breakdown (% positive/neutral/negative), content requests, pain points
33. **Channel Stats** — Deep analytics beyond YouTube API: engagement rate, growth trends, estimated revenue

### Special
34. **Deep Chat AI** — Load any YouTube video → AI analyzes full stats, comments, channel baseline, thumbnail
35. **GoffViral** — TikTok viral predictor using custom Goffviral-V1 model (trained on 19,084 viral videos, 98.9% accuracy)
36. **Nychiq Studio** — Connect your channel → overview, video manager, SEO scoring, upload checklist, pre-upload analyzer
37. **Agency Dashboard** — Multi-channel management, client tracking, auto video generator (agency plan)
38. **Saku AI** — YouTube intelligence chatbot (panel + full-page modes, 2.0 and 3X deep modes)

---

## 13. PAGES / ROUTING SYSTEM

### Page Navigation Function
```javascript
function goPage(p) {
  // Hides all .pg elements, shows pg-{p}
  // Special handling: pg-app calls nav() to render current tool
  // legalPages = ['privacy','terms','refund','cookies','about','contact','careers','changelog']
  // These don't update _prevPage so goBack() works
}

function nav(p) {
  // Renders feature page inside .content (#main div)
  // Checks plan access → shows planGateHTML if locked
  // Updates sidebar active state, mobile tab active state
  // Updates page title in topbar
  // Calls pgXxx() render function
}
```

### Page Flow
```
Landing (pg-welcome) 
  → [Start free trial / Get started] → pg-login
  → [Create Account] → startOnboarding() → pg-ob-questions
  → [Continue] → pg-ob-audit (free channel audit)
  → [Let's go] → pg-ob-extension (install Chrome extension)
  → [Skip / Install] → pg-app → nav('dashboard')

pg-app → nav(page) renders all tools inline in .content div
```

### All .pg Pages
1. `pg-welcome` — Landing page (starts with class="pg show")
2. `pg-login` — Auth (Sign Up / Sign In tabs)
3. `pg-app` — Main app shell
4. `pg-privacy` — Privacy Policy
5. `pg-terms` — Terms of Service
6. `pg-refund` — Refund Policy
7. `pg-cookies` — Cookie Policy
8. `pg-ob-questions` — Onboarding step 1 (attribution)
9. `pg-ob-audit` — Onboarding step 2 (free channel audit)
10. `pg-ob-extension` — Onboarding step 3 (Chrome extension)
11. `pg-about` — About page
12. `pg-contact` — Contact page
13. `pg-careers` — Careers page
14. `pg-changelog` — Changelog page

---

## 14. OVERLAYS & MODALS

### Upgrade Modal (`upgradeModal`)
- Position: fixed, full screen overlay
- Shows plan cards: Starter ₦15K, Pro ₦35K, Elite ₦70K, Agency ₦150K
- Active plan highlighted with amber border
- `proceedUpgrade()` → opens Paystack link

### Token Modal (`token-modal-overlay`)
- Shows current token balance with progress bar
- Options: Upgrade plan, Invite friend (+20 tokens)
- Triggered by: low balance, clicking token pill

### Video 3-Dots Menu (`videoMenu`)
- Position: fixed, near tap position
- Options: Open on YouTube, Copy Title, Copy URL, Copy Description, Generate SEO, Analyse with Deep Chat AI

### Command Bar (`cmd-bar-overlay`)
- Trigger: Ctrl+K / Cmd+K (or mobile search bar click)
- 20 quick actions mapped to page navigation
- Filters in real-time as you type
- `execCmdItem()` runs the action

### Notification Drawer (`notifDrawer`)
- Slides from right side
- Notification types: viral, saku, competitor, system
- `markAllRead()`, click to navigate to relevant page

### Info Modal (`infoModal`)
- Bottom sheet style (slides up)
- Content types: about, contact, careers, changelog

### Saku AI Panel (`sakuPanel`)
- Slides from bottom-right
- Basic chat with 5 suggestion chips
- Token cost: 1 per message (Saku 2.0), 3 per message (Saku 3X)

### Saku Full Page (`sakuFullPage`)
- Full-screen overlay (Kimi-style)
- Left sidebar: quick modes (Career Coach, Script Doctor, etc.)
- Right: full chat history
- 2 modes: Saku 2.0 (1 token), Saku 3X deep mode (3 tokens)

---

## 15. AI API PATTERNS

### YouTube API Fetch
```javascript
function ytFetch(endpoint, params, callback) {
  // POST to WORKER_URL/api/youtube
  // Body: { endpoint, params }
  // Response: YouTube API JSON
}
// Usage examples:
ytFetch('videos', { part:'snippet,statistics', chart:'mostPopular', regionCode:'NG', maxResults:20 }, cb)
ytFetch('search', { part:'snippet', q:'query', type:'video', order:'viewCount', maxResults:20 }, cb)
ytFetch('channels', { part:'snippet,statistics', forHandle:'channelName' }, cb)
ytFetch('commentThreads', { part:'snippet', videoId:'xxxxx', maxResults:60 }, cb)
```

### Groq AI Fetch
```javascript
function askAI(prompt, systemPrompt, callback) {
  // POST to WORKER_URL/api/groq
  // Model: llama-3.3-70b-versatile
  // max_tokens: 900, temperature: 0.7
  // Returns: callback(err, responseText)
}

function askAIStream(messages, onToken, onDone) {
  // Streaming version for Deep Chat and Saku Full Page
  // onToken(token, fullText) called on each chunk
  // onDone(finalText) called on completion
}
```

### HuggingFace Fetch
```javascript
function hfInfer(model, inputs, callback) {
  // POST to WORKER_URL/api/hf
  // Auto-retries if model is loading (sleeps 9s)
}
```

### Helper Functions
```javascript
function viralScore(videoObject)    // Returns 1-99 viral score
function fmtV(number)               // Formats: 1.2M, 45K, 1.2B
function timeAgo(dateString)        // Returns: "2h ago", "3d ago"
function safeGet(obj, keysArray)    // Safe nested property access
function sanitizeText(str)          // Escapes HTML entities
function debounce(fn, delay)        // Debounce wrapper
function g(id)                      // document.getElementById shorthand
```

---

## 16. WELCOME / LANDING PAGE

### Nav Bar (`.wn` prefix CSS)
```
[NychIQ Logo] [Features] [Pricing] [Legal] [Live Demo] [Sign in] [Get started]
Mobile: [Logo] [Hamburger → dropdown]
```

### Hero Section (`.wn-hero`)
- **Desktop:** 2-column grid — left: headline + stats + CTAs, right: dashboard mockup
- **Mobile:** stacked — headline on top, mockup below CTAs
- **Headline:** "YouTube Intelligence Platform" (H1, font-weight:900)
  - Line 1: "YouTube" (white)
  - Line 2: "Intelligence" (color: #F5A623)  
  - Line 3: "Platform." (color: #777, font-weight:500)
- **Stats row:** 2.4M+ Videos Indexed | 94% Viral Accuracy | 3,200+ Active Creators
- **CTAs:** [Start free trial →] [▶ View live demo]

### Dashboard Mockup (`.wn-mock`)
```
┌─ [●●●] nychiq.com/dashboard ──── LIVE ─┐
│ > SCANNING 12 TRENDING VIDEOS...        │
│ > VIRAL SCORE: 94/99 ⚡                 │
│ > AI ANALYSIS READY                     │
│            [▶ Play Button]              │
├─────────────────────────────────────────┤
│  -- Trending | 94 Top Score | $22.40 CPM| 13 Engines │
└─────────────────────────────────────────┘
```
- Background: `#070707`, border: `1px solid #1E1E1E`
- Glow: `box-shadow: 0 0 60px rgba(245,166,35,.07)`
- Terminal font: `Courier New, monospace`
- Colors: amber for `>` prompts, green for values, blue for ready state

### Features Grid (`.wn-feat-grid`)
- 3-column grid (1-column on mobile)
- Each card: number label, icon badge, name, description, color tag
- Background alternating: `#0A0A0A` with hover `#0E0E0E`
- 17 modules listed

### Pricing Section (`.wn-price-grid`)
- 4-column grid (1-column mobile)
- PRO card highlighted with amber border + "MOST POPULAR" badge
- Plans: Starter ₦15K, Pro ₦35K, Elite ₦70K, Agency ₦150K

### Footer (`.wn-footer-inner`)
- 4-column grid: Brand | Product | Company | Legal
- **Product:** Features, Pricing, Live Demo, Changelog
- **Company:** About, Blog, Contact, Careers
- **Legal:** Privacy Policy, Terms of Service, Refund Policy, Cookie Policy
- All links functional via `goPage()` or `scrollFeat()`/`scrollPrice()`

---

## 17. ONBOARDING FLOW

### Step 1: pg-ob-questions
- Attribution question: How did you hear about us?
- 8 options: YouTube, Twitter/X, Instagram, TikTok, Friend, Google, Ads, Other
- Visual grid of icon buttons
- → `obGoStep2()` → pg-ob-audit

### Step 2: pg-ob-audit
- Free channel audit (3 sub-steps)
  1. Input: YouTube channel handle or URL
  2. Loading: animated steps (fetching stats, analyzing videos, comparing benchmarks, generating AI insights)
  3. Report: Health Score gauge (0-100), AI insights, stats pills
- Uses `obFetchAndReport()` → `ytFetch()` → `askAI()` → `obShowAuditReport()`
- → `obFinishOnboarding()` → pg-ob-extension

### Step 3: pg-ob-extension
- Chrome extension install prompt
- +10 daily tokens incentive
- 3-step install guide
- [Install Extension] or [Skip for now → dashboard]

---

## 18. SAKU AI SYSTEM

### Saku Panel (Floating)
- Trigger: Saku FAB button (amber circular, bottom-right)
- `toggleSaku()` — slides panel open/close
- 5 suggestion chips on open
- 1 token per message (Saku 2.0)
- `showSakuDailyPopup()` — shows daily insight popup 3s after login

### Saku Full Page (Overlay)
- Full-screen overlay with sidebar of quick modes
- Modes: Career Coach, Script Doctor, Competitor Dive, Content Calendar, Revenue Optimizer, Viral Hook Lab
- 2 AI modes toggle:
  - **Saku 2.0:** 1 token/msg, focused
  - **Saku 3X:** 3 tokens/msg, deep analysis
- Streaming responses via `askAIStream()`
- History preserved within session (`sakuFullHistory` array)

---

## 19. NYCHIQ STUDIO

**5 tabs:** Overview | Videos | SEO | Checklist | Pre-Upload

1. **Overview** — Channel profile, health score gauge, subscriber/view/video stats
2. **Videos** — Video manager with sortable list (views/likes/viral score), SEO fix button per video
3. **SEO** — SEO score per video (Title + Description + Tags = 100 points)
4. **Checklist** — 25-item pre-publish checklist across 5 categories (Title, Thumbnail, Description, Tags, First 24 Hours). Saves to localStorage.
5. **Pre-Upload Analyzer** — Drag & drop video file → algorithm score, viral estimate, AI strategy, transcript extraction via browser Speech Recognition API

---

## 20. GOFFVIRAL TIKTOK PREDICTOR

- Custom AI model: Goffviral-V1 Pro
- Trained on: 19,084 viral TikTok videos
- Claimed accuracy: 98.9%
- **Inputs:**
  - Views, Likes, Shares, Downloads, Followers
  - Video Length (slider 5-180s)
  - Posting Hour (slider 0-23)
  - Uses Trending Sound (checkbox)
  - Has Text Overlay (checkbox)
- **Output:** Viral probability %, verdict, strengths, weaknesses, action plan
- API: `WORKER_URL/api/goffviral/queue/join` → SSE streaming
- Fallback: Groq AI analysis if model offline

---

## 21. DEEP CHAT AI

- Load any YouTube video URL → full context extraction
- **Context built from:**
  - Video stats (views, likes, comments, duration, tags)
  - Channel baseline (last 15 videos avg)
  - Top 60 comments
  - HuggingFace enrichment: sentiment, title classification, niche classification, thumbnail description (BLIP)
- **System prompt:** Full JSON context packet injected into every message
- **Streaming:** `askAIStream()` with typing cursor animation
- **Suggestion chips:** 6 pre-built prompts (Why underperforming?, Rewrite title, Compare to channel avg, etc.)

---

## 22. CPM RATE TABLE

| Niche | CPM % | CPM Rate |
|---|---|---|
| Finance | 95% | $22.40 |
| AI / Tech | 82% | $18.20 |
| Fitness | 58% | $12.40 |
| Health | 67% | $14.80 |
| Business | 88% | $20.10 |
| Education | 51% | $11.40 |
| Food | 35% | $8.60 |
| Gaming | 19% | $4.20 |

---

## 23. NOTIFICATION SYSTEM

### Default Notifications (4 seeded)
1. **Viral Spike** — "AI Nigeria 2026" trending +5,000% — navigates to `trending`
2. **Saku Daily** — personalized monetization tips ready
3. **Competitor Alert** — MrBeast just uploaded — navigates to `competitors`
4. **System** — Viral Score Updated — navigates to `dashboard`

### Notification Drawer
- Right-side slide-in drawer
- `markAllRead()` — clears unread dots
- Red dot on bell icon when unread count > 0
- `updateNotifDot()` called on changes

---

## 24. SETTINGS PAGE

### Account Section
- Display Name (with live preview)
- Email Address
- Default Region (dropdown: NG, US, GB, IN, GH, KE)
- Save Changes button

### Notifications Section
- Viral Spike Alerts (toggle)
- Competitor Uploads (toggle)
- Saku Daily Insights (toggle)
- Email Notifications (toggle)

### API Keys Section
- **Cloudflare Worker URL** — primary config field
- Instructions: deploy nychiq-worker → paste URL here
- `saveWorkerUrl()` → saves to localStorage, updates `WORKER_URL` global

### Referral Program
- Unique referral code (generated, stored in localStorage)
- Invite friend → both get +20 tokens
- `copyReferralLink()` → clipboard

### Danger Zone
- Clear All Local Data button
- Sign Out button

---

## 25. PROFILE PAGE (renderProfile)

Rendered inline in `.content` div (not a .pg page)

### Sections
1. **Profile card** — initials avatar, name, plan badge, Edit Profile button, token progress bar
2. **Stats grid** — Status (Active), Plan, Token Usage (used), Balance (remaining)
3. **Action buttons** — UPGRADE PLAN, SIGN OUT
4. **Preferences** — Region display, Legal document links

---

## 26. COMMAND BAR (Ctrl+K)

### 20 Available Actions
| Icon | Label | Action |
|---|---|---|
| ⚡ | Go to Dashboard | `nav("dashboard")` |
| 🔥 | Trending Videos | `nav("trending")` |
| 🔍 | Search YouTube | `nav("search")` |
| 👁 | Competitor Tracker | `nav("competitors")` |
| 🎯 | Viral Score | `nav("viral")` |
| 🤖 | SEO Optimizer | `nav("seo")` |
| 🪝 | Hook Generator | `nav("hook")` |
| 📊 | CPM Estimator | `nav("cpm")` |
| 🧪 | A/B Tester | `nav("ab-test")` |
| 🔦 | Outlier Scout | `nav("outlier-scout")` |
| 🧬 | Performance Forensics | `nav("perf-forensics")` |
| 🛡 | Safe Content Checker | `nav("safe-check")` |
| 📅 | Trend Alerts | `nav("trend-alerts")` |
| 🎨 | Thumbnail Lab | `nav("thumbnail-lab")` |
| 💼 | Sponsorship Calculator | `nav("sponsor-calc")` |
| 📜 | Script Writer | `nav("script")` |
| 💡 | Video Ideas | `nav("ideas")` |
| ⚙️ | Settings | `nav("settings")` |
| 👤 | Profile | `nav("profile")` |
| 🚪 | Sign Out | `goPage("login")` |

---

## 27. LEGAL PAGES

All use consistent style:
- Nav with NYCHIQ logo + "← BACK" button (`goBack()`)
- `.legal-wrap` — max-width: 760px
- `.legal-eyebrow` — "// LEGAL"
- `.legal-h1` — page title
- `.legal-date` — "Last updated: March 10, 2026"
- `.legal-sh` — section headers (01 /, 02 /)
- `.legal-p` — paragraphs
- `.legal-ul` — bullet lists
- Footer with copyright + legal links

### 4 Legal Pages
1. **Privacy Policy** — Data collection, usage, YouTube API, retention, GDPR rights, contact
2. **Terms of Service** — Acceptance, service description, subscriptions, acceptable use, IP, liability
3. **Refund Policy** — 7-day money back, renewal non-refundable, cancellation, exceptions
4. **Cookie Policy** — Essential, preference, analytics cookies, third-party (Paystack), management

---

## 28. COMPANY PAGES

Same nav pattern as legal pages.

1. **About** (`pg-about`) — Mission, stats grid, why Nychiq, the team, CTA
2. **Contact** (`pg-contact`) — 4 contact cards: hello@, billing@, partnerships@, Twitter @nychiq
3. **Careers** (`pg-careers`) — 3 open roles (ML Engineer, Frontend, Growth Marketer), apply email
4. **Changelog** (`pg-changelog`) — Version history v7.x → v9.0 with feature lists

---

## 29. PLAN GATE SYSTEM

When user tries to access a locked feature:
```javascript
function planGateHTML(page) {
  // Shows padlock icon + plan name + price
  // "Upgrade to [Plan] plan ([price]/mo) and above"
  // [View Plans →] button → scrollPrice() on welcome page
  // [← Back to Dashboard] button
}
```

Plan hierarchy: `starter (1) < pro (2) < elite (3) < agency (4)`

---

## 30. VIDEO CARD SYSTEM

### Landscape Video Card (`.vcard`)
```javascript
function vCard(videoObject) {
  // thumbnail image + play overlay + duration badge + viral badge (if score 85+)
  // Title (clickable → openYT())
  // Channel name + view count
  // 3-dots menu → showVideoMenu()
}
```

### Shorts Card (`.scard`)
- Vertical aspect ratio thumbnail
- Viral fire badge if score ≥ 80
- Title + view count + time ago
- 3-dots menu

### Ranking Row (`.rrow`)
- Rank number (gold/silver/bronze colors for top 3)
- Thumbnail
- Title + channel + views + likes
- Viral score number

### Viral Score Row (`.virl`)
- Score badge (green ≥85, gold ≥70, red otherwise)
- Title + channel + views + time
- Thumbnail right

---

## 31. KEY ANIMATIONS & EFFECTS

```css
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes glowBar { /* amber glow pulse on CPM/score bars */ }
@keyframes slideUpSheet { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
```

- Sidebar overlay: `rgba(0,0,0,.5)` backdrop
- Modal overlays: `rgba(0,0,0,.85)` + `backdrop-filter:blur(6px)`
- Toast: slides up from bottom, fades out after 3s
- Dashboard mockup: `box-shadow: 0 0 60px rgba(245,166,35,.07)` glow
- Token pill: `linear-gradient(135deg, rgba(245,166,35,.15), rgba(245,166,35,.05))`

---

## 32. MOBILE OPTIMISATION RULES

**Breakpoint:** `@media(max-width:640px)`

### Critical Mobile Rules
```css
/* Topbar: 52px, search hidden, chips hidden */
.topbar { height:52px; padding:0 8px; gap:6px; }
.search-bar { display:none; }
.chips { display:none; }
.country-sel { display:none; }
.vc-label { display:none; }  /* "Tokens" label */
.page-title { max-width:80px; overflow:hidden; text-overflow:ellipsis; font-size:10px; }

/* Content fills viewport */
.content { 
  height: calc(100svh - 52px);
  padding: 12px 10px 80px;  /* 80px bottom = 56px nav + 24px buffer */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* All grids collapse to 1 column */
.g2,.g3,.g4 { grid-template-columns:1fr; }
.stats-row { grid-template-columns:1fr 1fr; }

/* irow stacks vertically */
.irow { flex-direction:column; gap:8px; }
.irow > * { width:100%; justify-content:center; }

/* Inputs: 16px prevents iOS zoom */
input,select,textarea { font-size:16px; }

/* Sidebar: slides in from left */
.sidebar { transform:translateX(-100%); transition:transform .25s ease; }
.sidebar.open { transform:translateX(0); }
.main { margin-left:0; }

/* Bottom nav: fixed 56px */
.btab-bar { display:flex; position:fixed; bottom:0; height:56px; background:#0A0A0A; border-top:1px solid #1E1E1E; }
.btab-inner { display:grid; grid-template-columns:repeat(6,1fr); }
```

---

## 33. LOCALSTORAGE KEYS

```javascript
'nychiq-tokens'           // current token balance (number)
'nychiq-tokens-earned'    // total tokens ever earned (number)
'nychiq-tokens-total-earned' // staged release tracker
'nychiq-signup-ts'        // signup timestamp for staged release
'nychiq-display-name'     // user's display name
'nychiq-plan'             // current plan: 'starter'|'pro'|'elite'|'agency'
'nychiq-WORKER_URL'       // Cloudflare Worker URL
'nychiq-country'          // selected country code (e.g., 'NG')
'nychiq-studio-channel'   // connected Studio channel handle
'nychiq-studio-chandata'  // cached channel JSON
'nychiq-onboarded'        // 'true' if onboarding complete
'nychiq-ext-installed'    // 'true' if Chrome extension installed
'nychiq-ref-code'         // referral code (e.g., 'NYC5X8K2')
'nychiq-checklist'        // JSON object of checklist item states
'nychiq-trend-alerts'     // JSON array of trend alert objects
'saku-popup-date'         // date of last Saku daily popup
```

---

## 34. DEPLOYMENT

### Cloudflare Pages
- Upload the single HTML file directly
- No build step needed
- Custom domain: nychiq.com

### Cloudflare Worker (required for all API calls)
- Endpoints it must expose:
  - `POST /api/youtube` → proxy to YouTube Data API v3
  - `POST /api/groq` → proxy to Groq API (llama-3.3-70b-versatile)
  - `POST /api/hf` → proxy to HuggingFace Inference API
  - `POST /api/sociavault` → proxy to SociaVault API
  - `POST /api/goffviral/*` → proxy to GoffViral Gradio Space

### Environment Variables (Worker secrets)
- `YOUTUBE_API_KEY` — YouTube Data API v3 key
- `GROQ_API_KEY` — Groq API key
- `HF_API_KEY` — HuggingFace API key
- `SV_API_KEY` — SociaVault API key

---

## 35. ANALYTICS

- **Analytics:** Umami (self-hosted, privacy-first)
- Script: `<script defer src="https://umami.nychiq.com/script.js" data-website-id="nychiq-analytics">`

---

## 36. PAYMENT (PAYSTACK)

```javascript
var links = {
  starter: 'https://paystack.com/pay/nychiq-starter',
  pro:     'https://paystack.com/pay/nychiq-pro',
  elite:   'https://paystack.com/pay/nychiq-elite',
  agency:  'https://paystack.com/pay/nychiq-agency'
};
// All open in new tab via window.open()
```

---

## 37. SOCIAL PROOF & MICROCOPY

### Dashboard upgrade banner text
> "Unlock Auto Video Generator + Channel Autopilot — Generate & upload videos while you sleep — 2,400+ creators earning $3K–$25K/month."

### Onboarding audit loading messages
1. "Fetching channel statistics"
2. "Analysing recent videos"
3. "Comparing to niche benchmarks"
4. "Generating AI insights"

### Saku daily insights (random rotation)
- "Finance content CPM is 23% higher this week..."
- "AI Automation Nigeria trending +340% this week..."
- "Post Tuesday & Thursday at 6PM WAT for 28% more views..."
- "Reply to comments within 2 hours — boosts performance 40%..."

### Plan gate copy
> "This feature is available on the [Plan] plan ([price]/mo) and above."

---

## 38. CRITICAL IMPLEMENTATION NOTES

1. **No closing </div> bug** — The `pg-welcome` div MUST be properly closed with `</div>` before `pg-login` div. Missing this makes ALL pages invisible because they nest inside welcome.

2. **JS string escaping** — All HTML strings built with JS (innerHTML =) must use escaped quotes. Never literal newlines inside string concatenations.

3. **Multiline prompts** — AI prompt strings must NOT span literal newlines in JS. Concatenate with `+` or use single line.

4. **Duplicate functions** — `scrollFeat`, `scrollPrice` etc. defined once in welcome `<script>` block, NOT in main script. The main script version must be removed.

5. **Mobile inputs** — All `input`, `select`, `textarea` must have `font-size:16px` on mobile to prevent iOS auto-zoom.

6. **SVG icons** — All icons are inline SVG with `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.

7. **viralScore() formula:**
   ```javascript
   var engRate = Math.min((likes + comments) / views, 0.15);
   var engScore = (engRate / 0.15) * 40;
   var velScore = Math.min((Math.log10(Math.max(views,1)) / Math.log10(10000000)) * 45, 45);
   var raw = Math.round(engScore + velScore + 10);
   return Math.min(99, Math.max(1, raw));
   ```

8. **Plan access check:**
   ```javascript
   var PLAN_RANK = { starter:1, pro:2, elite:3, agency:4 };
   function canAccess(page) {
     var required = PLAN_ACCESS[page];
     if (!required) return true;
     return (PLAN_RANK[USER_PLAN] || 0) >= (PLAN_RANK[required] || 0);
   }
   ```

9. **goPage vs nav** — `goPage(p)` switches between full `.pg` pages. `nav(p)` renders tool pages inside the `.content` div of `pg-app`. They serve different purposes.

10. **Demo mode** — `isDemoMode = true` limits access to only GoffViral page. `demoUsesLeft = 3` tracks demo predictions remaining.

