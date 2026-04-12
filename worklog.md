# NychIQ — Work Log

---
Task ID: 1
Agent: Main
Task: Deploy without credentials + debug all 4 components

Work Log:
- Verified worker can deploy without secrets (all rotateKey() return undefined gracefully)
- Added missing `[ai]` binding to wrangler.toml (Workers AI)
- Added `APP_URL` and `CORS_ORIGINS` to `[vars]`
- Launched parallel debug of Frontend, Worker, Chrome Extension, Firefox Extension
- Frontend: Clean — API uses relative `/api` URLs, zustand is SSR-safe, Prisma installed, no hardcoded secrets
- Worker: Found and fixed 7 bugs (1 critical, 5 high, 1 medium)
- Chrome Extension: Found and fixed 6 bugs (3 critical, 2 high, 1 medium)
- Firefox Extension: Found and fixed 4 bugs (2 high, 2 medium)

Stage Summary:
- **16 bugs fixed** across Worker, Chrome Extension, Firefox Extension
- 0 frontend bugs found (clean)
- All fixes applied in-place, no new files created
- Worker ready for `npx wrangler deploy` without any secrets set

---
## Bug Fix Details

### Worker (7 fixes)
| # | Severity | File | Fix |
|---|----------|------|-----|
| W-01 | 🔴 CRITICAL | `wrangler.toml` + `index.ts` | Added `[[queues.consumers]]` + `queue()` export handler |
| W-02 | 🟠 HIGH | `youtube.ts:150` | `commentCount: v.subCountText` → `v.commentCount` |
| W-03 | 🟠 HIGH | `nightlyArchive.ts:22-26` | `CREATE TABLE LIKE` → explicit column definitions |
| W-04 | 🟠 HIGH | `aiOptimization.ts:138` | Removed `(parsed.analyses || [])[0]` fallback |
| W-05 | 🟡 MEDIUM | `images.ts:24` | Removed unused `[w, h]` variables |
| W-06 | 🟡 MEDIUM | `nightlyArchive.ts:150` | Removed `VACUUM` (D1 is managed) |
| W-08 | 🟡 MEDIUM | `ai.ts:407` | `(c.env as any).AI` → `c.env.AI` |

### Chrome Extension (6 fixes)
| # | Severity | File | Fix |
|---|----------|------|-----|
| C-01 | 🔴 CRITICAL | `sentiment-analysis.js` | Added `initPipeline()` auto-init before ML inference |
| C-02 | 🔴 CRITICAL | `transformers-client.js` | `runInference()` now attempts auto-init instead of returning null |
| C-03 | 🔴 CRITICAL | `transformers-client.js` + `offscreen.js` | Added 200ms delay after offscreen creation + `TRANSFORMERS_PING` handler |
| C-04 | 🟠 HIGH | `auth-bridge.js:84` | `atob()` → `Uint8Array` + `TextDecoder` for Unicode JWTs |
| C-05 | 🟠 HIGH | `background.js:148` | REINJECT only on `connected`/`deepScraping` changes |
| C-07 | 🟡 MEDIUM | `transformers-client.js` | Added `self.addEventListener('suspend')` to reset on SW hibernation |

### Firefox Extension (4 fixes)
| # | Severity | File | Fix |
|---|----------|------|-----|
| F-H2 | 🟠 HIGH | `cors-handler.js:49-66` | Removed `onBeforeSendHeaders` (caused duplicate Origin headers) + auto-install IIFE |
| F-H3 | 🟠 HIGH | `browser-polyfill.js:61-68` | `executeScript` returns `[{frameId, result}]` matching Chrome shape; `insertCSS` only passes file OR code |
| F-M1 | 🟡 MEDIUM | `ai-worker.js` + `transformers-client.firefox.js` | Added `WORKER_READY` handshake signal replacing fragile 100ms setTimeout |
| F-M2+M3 | 🟡 MEDIUM | `build-extension.sh` | POSIX-compatible sed replacement + excluded `content.legacy.js` from Firefox build |

---
Task ID: fix-chrome
Agent: fix-chrome
Task: Fix 9 critical/high/medium/low bugs in NychIQ Chrome Extension (MV3)

Work Log:
- Read all target files and all 6 content scripts to understand cross-references
- Applied 9 bug fixes across 8 files

### Chrome Extension Bug Fixes (9 fixes)
| # | Severity | File | Fix |
|---|----------|------|-----|
| #1 | 🔴 CRITICAL | `manifest.json` | Added bare `"https://nychiq.com/*"` before wildcard `"https://*.nychiq.com/*"` in host_permissions |
| #2 | 🟠 HIGH | `utils.js` | Removed all 12 `export` keywords from function declarations; added `utils.js` to all 6 content_scripts entries in manifest.json |
| #3 | 🟠 HIGH | `sync-manager.js:89-127` | Converted `analyzedIds` array to `Set` for O(1) dedup lookup in hot loop; converted back to array for storage |
| #5 | 🟠 HIGH | `token-cache.js:31-37` | `fetchBalance()` now resets `pendingDecrement: 0` when caching server balance, properly reconciling optimistic decrements |
| #6 | 🟡 MEDIUM | `sync-manager.js:38-39` | Removed dead `self.addEventListener('online', ...)` and `navigator.onLine` guard (always true in SW); kept setTimeout forceSync |
| #12 | 🟡 MEDIUM | `offscreen.js:26` | Added `.catch(err => sendResponse({ ok: false, error: err.message }))` to TRANSFORMERS_DISPOSE handler |
| #13 | 🟡 MEDIUM | `popup.js` | Added `chrome.runtime.lastError` check at top of all 4 sendMessage callbacks (GET_STATS, SYNC_NOW, EXPORT_DATA, CLEAR_DATA) |
| #18 | 🟢 LOW | `manifest.json` | Removed `"offscreen.html"` from `web_accessible_resources` (unneeded exposure) |
| #22 | 🟢 LOW | All 6 content scripts | Added `if (window.__nychiq_initialized) return; window.__nychiq_initialized = true;` double-execution guard at top of each IIFE |

Stage Summary:
- **9 bugs fixed** (1 critical, 3 high, 3 medium, 2 low)
- Files modified: `manifest.json`, `utils.js`, `sync-manager.js`, `token-cache.js`, `offscreen.js`, `popup.js`, and all 6 content script files
- All fixes applied in-place, no new files created

---
Task ID: fix-firefox
Agent: Bug-Fix Agent
Task: Fix critical and high-severity Firefox extension bugs (F-01, F-03, F-04, F-06, F-07, F-10)

Work Log:
- F-01 (CRITICAL): Added auto-invocation IIFE to `cors-handler.js` — `installCORSHandler()` now runs automatically when loaded as a background script via the manifest scripts array
- F-02 (CRITICAL): No code change needed — F-01 fix eliminates the need for bootstrap-firefox.js dead code path
- F-03 (CRITICAL): Updated build-extension.sh patch section — changed grep pattern to `installCORSHandler`, updated comment to reflect that cors-handler.js auto-installs via manifest scripts order
- F-04 (HIGH): Added `https://unpkg.com` to CSP `script-src` in manifest.firefox.json, allowing fallback CDN scripts
- F-06 (HIGH): Restricted `web_accessible_resources` from `<all_urls>` with `["icons/*", "src/ai/ai-worker.js"]` to only `["icons/*"]` scoped to 8 specific domain match patterns
- F-07 (MEDIUM): Removed empty `"gecko_android": {}` from `browser_specific_settings` in manifest.firefox.json
- F-10 (MEDIUM): Guarded `chrome.storage.local.get` and `.set` polyfills against non-Promise returns with `typeof result.then === 'function'` check

Stage Summary:
- **6 bugs fixed** across 4 files in the Firefox extension
- All fixes applied in-place, no new files created
- manifest.firefox.json validated as valid JSON after edits

---
Task ID: fix-frontend
Agent: fix-frontend
Task: Fix 9 critical/high/medium frontend bugs

Work Log:
- Read all target files, verified each bug condition, applied fixes in-place
- BUG #1: Removed duplicate `<SakuFullPage />` from AppShell overlay area in `page.tsx` (kept only the one in ToolRouter case 'saku')
- BUG #2: Changed `role: 'assistant'` → `role: 'system'` for the system prompt message in `saku-full-page.tsx:123`
- BUG #3: Added `@config "../../tailwind.config.ts";` directive after `@import "tailwindcss";` in `globals.css` to load tailwindcss-animate plugin in v4. Confirmed `tw-animate-css` v1.3.5 installed and `tailwindcss-animate` in tailwind.config.ts plugins.
- BUG #4: Added missing `#` prefix: `border-[E05252]/30` → `border-[#E05252]/30` in `dashboard-tool.tsx:53`
- BUG #5: Added `relative` to parent div: `className="flex items-center gap-2"` → `className="relative flex items-center gap-2"` for the share dropdown container in `settings-tool.tsx:432`
- BUG #6: Changed useEffect dependency `[state]` → `[]` in `use-toast.ts:185` to prevent listener accumulation on every state update
- BUG #7: Replaced `--font-mono: var(--font-geist-mono);` with system mono font stack `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace` in `globals.css:10`
- BUG #8: Removed Radix `<Toaster />` import and JSX usage from `layout.tsx`, kept only `<SonnerToaster />` (the app uses showToast() which goes through Sonner)
- BUG #9: Rewrote `db.ts` with DATABASE_URL guard — PrismaClient only instantiated when DATABASE_URL exists, log only enabled in development, added `isDbAvailable()` helper

Stage Summary:
- **9 bugs fixed** across 8 files
- 2 CRITICAL, 5 HIGH, 2 MEDIUM severity
- All fixes applied in-place, no new files created

---
Task ID: fix-worker
Agent: fix-worker
Task: Fix 15 critical/high/medium Worker backend bugs (#1–#14, #16)

Work Log:
- BUG #1 (CRITICAL): Removed `X-User-Plan` header trust in rate limiter — clients could spoof plan header to bypass limits. Now always uses `RATE_LIMITS.trial`.
- BUG #2 (CRITICAL): Added missing `validSizes` array constant before its first usage in `images.ts:23` — was causing ReferenceError at runtime.
- BUG #3 (CRITICAL): Changed `vectorsDB.insert(` to `vectorsDB.upsert(` in `embeddings.ts:213` — CloudFlare Vectorize has no `insert()` method.
- BUG #4 (CRITICAL): Fixed queue email retry handler in `index.ts:237-239` — was calling non-existent `sendEmailFallback()`. Now correctly calls `sendEmail(env, body.payload || body)` matching the actual lib/email.ts signature.
- BUG #5 (HIGH): Changed `tx.metadata?.user_id` → `tx.metadata?.userId` in 2 places in `payments.ts` — the initialize endpoint sends camelCase `userId` in metadata, so verify and webhook must read it back as `userId`.
- BUG #6 (HIGH): Fixed all 4 occurrences of `data.error.message` in `auth.ts` — replaced with `typeof data.error === 'string' ? data.error : data.error?.message || 'Auth error'` to handle both string and object error shapes from Supabase/GoTrue.
- BUG #7 (HIGH): Removed `/api/auth` from rate-limit bypass in `index.ts:81` — auth routes were completely unrate-limited, enabling brute-force attacks. Now only webhook and health check skip rate limiting.
- BUG #8 (HIGH): Fixed signUp and signIn response parsing in `auth.ts` — now handles raw GoTrue responses with `access_token`/`refresh_token` top-level fields, with fallback to `data.session` and `data.user`.
- BUG #9 (HIGH): Removed broken `sendEmail()` call with empty `to: ''` in `audit.ts` — would silently fail or error. Commented out import and call with TODO to resolve user email from context.
- BUG #10 (HIGH): Merged duplicate `import { rotateKey }` and `import { geminiChat }` from `../lib/fallback` into single combined import in `translate.ts`.
- BUG #11 (HIGH): Changed `bucketType: 'allPrivate'` → `bucketType: 'all'` in `fallback-storage.ts:207` — B2 `b2_list_buckets` was filtering to only private buckets, missing public buckets.
- BUG #12 (MEDIUM): Changed Supabase realtime WebSocket URL to prefer `SUPABASE_ANON_KEY` over `SUPABASE_SERVICE_KEY` and removed `&channel=` query param in `fallback-realtime.ts:123` — was exposing service key to clients.
- BUG #13 (MEDIUM): Changed OpenRouter fallback model from `openai/clip-vision-large-patch14-336` (CLIP, not a chat model) to `google/gemini-2.0-flash-001` in `vision.ts:139`.
- BUG #14 (MEDIUM): Added `credentials: false` to dev-mode CORS fallback in `index.ts:62` — `origin: '*'` with `credentials: true` is invalid per spec and browsers reject it.
- BUG #16 (MEDIUM): Changed `TRANSCRIPT: -1` to `TRANSCRIPT: 604800` (7 days) in `cache.ts:21` — TTL of -1 caused permanent caching with no expiration.

Stage Summary:
- **15 bugs fixed** across 10 files in the Worker backend
- 4 CRITICAL, 6 HIGH, 5 MEDIUM severity
- All fixes applied in-place, no new files created
