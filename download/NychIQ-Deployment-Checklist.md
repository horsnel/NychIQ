# NychIQ Deployment Checklist

## Pre-Deployment Summary

**Total bugs fixed this session:** 42 across 4 components
- Worker Backend: 15 bugs (4 critical, 6 high, 5 medium)
- Chrome Extension: 9 bugs (1 critical, 3 high, 3 medium, 2 low)
- Firefox Addon: 7 bugs (3 critical, 2 high, 2 medium)
- Frontend (Next.js): 9 bugs (2 critical, 5 high, 2 medium)

**Known remaining issues (low/non-blocking):**
- Dead code modules in Chrome extension (embeddings.js, proxy-rotator.js, chroma-client.js, indexeddb.js, content.legacy.js) — ~4000 lines unused
- YouTube home page has no content script (only watch/shorts/trending/studio)
- `next-intl` and `next-auth` packages unused (can be removed)
- Nitter instances unreliable since mid-2024

---

## 1. CloudFlare Worker Deployment

### 1.1 CloudFlare Resources (create if not existing)

- [ ] **KV Namespace** `CACHE` — ID: `da4935f64f674805a074eec42bd2ddb9`
- [ ] **D1 Database** `nychiq-db` — ID: `20a58f92-c403-488f-9312-a52d6c81036e`
  - [ ] Run D1 migrations (schema in `supabase-schema.sql`)
- [ ] **R2 Bucket** `nychiq-storage`
- [ ] **Vectorize Index** `nychiq-embeddings`
- [ ] **Queue** `nychiq-tasks`

### 1.2 Set Wrangler Secrets (run from `worker/` directory)

**FIRST 8 (required for core functionality):**
```bash
cd worker

wrangler secret put SUPABASE_URL
# Value: your Supabase project URL

wrangler secret put SUPABASE_SERVICE_KEY
# Value: your Supabase service role key

wrangler secret put PAYSTACK_SECRET
# Value: your Paystack live secret key

wrangler secret put GROQ_KEY_1
# Value: your first Groq API key

wrangler secret put GEMINI_KEY_1
# Value: your first Gemini API key

wrangler secret put YT_KEY_1
# Value: your first YouTube Data API v3 key

wrangler secret put BREVO_KEY
# Value: your Brevo (Sendinblue) API key

wrangler secret put OPENROUTER_KEY_1
# Value: your first OpenRouter API key
```

**Next priority (AI fallbacks + search):**
```bash
wrangler secret put GROQ_KEY_2 GROQ_KEY_3 GROQ_KEY_4
wrangler secret put GEMINI_KEY_2 GEMINI_KEY_3 GEMINI_KEY_4
wrangler secret put CEREBRAS_KEY_1 CEREBRAS_KEY_2
wrangler secret put OPENROUTER_KEY_2
wrangler secret put HF_TOKEN_1 HF_TOKEN_2
wrangler secret put ZAI_KEY_1 ZAI_KEY_2
wrangler secret put BRAVE_KEY_1 BRAVE_KEY_2
wrangler secret put TAVILY_KEY_1 TAVILY_KEY_2
wrangler secret put YT_KEY_2 YT_KEY_3 YT_KEY_4
```

**Social scraping:**
```bash
wrangler secret put SOCIAVAULT_KEY_1 SOCIAVAULT_KEY_2
wrangler secret put ENSEMBLE_KEY_1
wrangler secret put TIKHUB_KEY_1
```

**Email fallbacks + payments:**
```bash
wrangler secret put RESEND_KEY
wrangler secret put UPSTASH_REDIS_URL
wrangler secret put UPSTASH_REDIS_TOKEN
wrangler secret put TURSO_DB_URL
wrangler secret put TURSO_DB_TOKEN
wrangler secret put BACKBLAZE_KEY_ID
wrangler secret put BACKBLAZE_APP_KEY
wrangler secret put BACKBLAZE_BUCKET
wrangler secret put BACKBLAZE_ENDPOINT
wrangler secret put QSTASH_TOKEN
wrangler secret put LOCATIONIQ_KEY
wrangler secret put RADAR_KEY
wrangler secret put IPAPI_KEY
wrangler secret put TRENDTOK_KEY
wrangler secret put PENTOS_KEY
wrangler secret put HASHTAG_AI_KEY
wrangler secret put KEYWORDSEVERYWHERE_KEY
wrangler secret put ABLY_KEY
wrangler secret put SOKETI_URL
wrangler secret put SUPABASE_ANON_KEY
```

### 1.3 Deploy Worker
```bash
cd worker
wrangler deploy
```

Worker URL: `https://nychiq-api.a5b0ea0a8f1511ea5f37e45c5d60e1a1.workers.dev`

---

## 2. Frontend Deployment (CloudFlare Pages)

### 2.1 Build
```bash
# From project root
bun run build
# Output goes to /out directory
```

### 2.2 Deploy
- Option A: **CloudFlare Pages with Workers** — The wrangler.toml `[site]` config serves static assets from `../out`
  - Run `wrangler deploy` from the worker directory after building
- Option B: **Separate Pages project** pointing to `nychiq.pages.dev`
  - Connect GitHub repo or use `wrangler pages deploy out`

### 2.3 Verify
- [ ] `https://nychiq.pages.dev` loads the app
- [ ] Login/signup flow works
- [ ] AI chat (DeepChat/Saku) connects to worker API
- [ ] All tool pages render without errors

---

## 3. Chrome Extension (MV3)

### 3.1 Build
```bash
# Extension files are in public/extension/
# No build step required — it's plain JS
```

### 3.2 Load for Testing
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `public/extension/` directory
5. Verify extension loads without errors

### 3.3 Chrome Web Store Submission
- [ ] Create developer account ($5 one-time fee)
- [ ] Prepare store listing (icon 128x128, screenshots, description)
- [ ] Zip the `public/extension/` directory
- [ ] Submit for review

### 3.4 Verify After Install
- [ ] Popup opens and shows stats
- [ ] Extension scrapes YouTube watch pages
- [ ] Badge updates with viral count
- [ ] Settings toggles work
- [ ] Sync to API works

---

## 4. Firefox Addon (MV3)

### 4.1 Build
```bash
cd public/extension
bash scripts/build-extension.sh --firefox
# Output: dist/nychiq-extension-firefox.zip
```

### 4.2 Test Locally
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.firefox.json` (or the dist zip)
4. Verify:
  - [ ] CORS handler installs correctly
  - [ ] Background scripts load in order
  - [ ] Content scripts inject on YouTube/Twitter/TikTok
  - [ ] AI Worker (Transformers.js) loads from CDN

### 4.3 AMO Submission
- [ ] Create AMO developer account (free)
- [ ] Prepare listing materials
- [ ] Submit `dist/nychiq-extension-firefox.zip`
- [ ] **Note:** `webRequestBlocking` permission may require justification

---

## 5. Post-Deployment Verification

### 5.1 Health Check
```bash
curl https://nychiq-api.a5b0ea0a8f1511ea5f37e45c5d60e1a1.workers.dev/
# Should return: { "status": "ok", "service": "NychIQ API", ... }
```

### 5.2 API Endpoints
```bash
# Auth
curl -X POST https://nychiq-api.../api/auth/signup -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"testpass123"}'

# AI
curl -X POST https://nychiq-api.../api/ai/chat -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{"messages":[{"role":"user","content":"Hello"}]}'

# YouTube
curl https://nychiq-api.../api/youtube/trending?region=NG
```

### 5.3 Cron Jobs (verify in CloudFlare Dashboard)
- [ ] `*/15 * * * *` — Trending cache refresh
- [ ] `0 */6 * * *` — Deep refresh + maintenance
- [ ] `0 6 * * *` — Morning trending discovery
- [ ] `0 9,12,15 * * *` — Metadata backfill
- [ ] `0 18 * * *` — Batch AI optimization
- [ ] `0 1 * * *` — Nightly archive

---

## 6. Environment Variables Already Set

These are in `wrangler.toml [vars]` — no action needed:
- `ENVIRONMENT = "production"`
- `APP_URL = "https://nychiq.pages.dev"`
- `CORS_ORIGINS = "https://nychiq.com,https://app.nychiq.com,https://nychiq.pages.dev"`

---

## 7. Key Architecture Notes

- **Worker serves dual role**: API backend + static asset server (via `[site]` config)
- **Extensions don't need CORS**: They use `host_permissions` for API access
- **Firefox uses Web Worker** instead of Chrome's offscreen document for AI inference
- **CORS in Firefox** handled via `webRequest` onHeadersReceived listener
- **Rate limiting** applies to all routes except webhooks (auth routes now rate-limited)
- **Payments** via Paystack only — metadata keys now consistent (camelCase `userId`)
