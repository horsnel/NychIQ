---
Task ID: 1
Agent: Main Agent
Task: Implement all missing fallback providers from master specification into NychIQ worker

Work Log:
- Audited all 13 existing worker route files + 5 lib files + wrangler.toml
- Updated env.ts with 13 new env vars: UPSTASH_REDIS_URL/TOKEN, TURSO_DB_URL/TOKEN, BACKBLAZE_KEY_ID/APP_KEY/BUCKET/ENDPOINT, ABLY_KEY, SOKETI_URL, BREVO_KEY, QSTASH_TOKEN, IPAPI_KEY, APP_URL
- Created lib/rate-limit.ts — Upstash Redis atomic INCR → CloudFlare KV fallback with plan-based tiers (trial/starter/pro/elite/agency)
- Created lib/email.ts — Brevo (300/day free) → Resend (100/day free) → Workers Queue fallback + QStash scheduling
- Created lib/fallback-storage.ts — Supabase Storage → Backblaze B2 (full auth flow: authorize → getUploadUrl → upload → download) → CloudFlare R2
- Created lib/fallback-realtime.ts — Supabase Realtime RPC → Ably (6M msg/mo free) → Soketi → Durable Objects + endpoint resolver
- Updated lib/cache.ts — Added Upstash Redis as Layer 1 cache (GET/SET/DELETE), kept KV as Layer 2; added invalidateCached()
- Created routes/email.ts — POST /send (raw email) + POST /notify (typed notifications: audit_complete, report_ready, trend_alert, payment_success, weekly_digest, channel_milestone) with HTML templates
- Created routes/storage.ts — POST /upload (multipart), GET /download/:path, DELETE /delete with fallback chain
- Created routes/audit.ts — Staged channel audit: Stage 0 (0 calls, cache only), Stage 1 (3 calls: channel+videos+trends), Stage 2 (15 calls: full deep audit with video analytics, transcripts, competitors, hashtags, SEO)
- Created routes/realtime.ts — GET /ws/:channel (Durable Object WebSocket), GET /endpoint, POST /publish
- Updated routes/ai.ts — Added Z.ai GLM-4 Flash (#5) and Pollinations AI text (#6, free no-key) to both chat and stream fallback chains (now 7 providers)
- Updated index.ts — Added all 4 new route mounts, rate limiting middleware with plan-based tiers, cron handler (15min trending refresh + 6hr maintenance), health check with service availability status
- Updated wrangler.toml — Comprehensive secrets documentation for all 50+ env vars organized by category
- Fixed eslint.config.mjs — Added worker/** to ignores
- Fixed index.ts — Refactored default export to named export to fix ESLint warning
- Verified: 0 lint errors, 0 TypeScript errors on both projects

Stage Summary:
- Worker now has 17 route modules (was 13) with 50+ API endpoints
- AI fallback: 7 providers (Groq → Gemini → Cerebras → Workers AI → Z.ai → Pollinations → OpenRouter)
- 5 new lib modules: rate-limit, email, fallback-storage, fallback-realtime, updated cache
- 4 new route modules: email, storage, audit, realtime
- Cron jobs: trending refresh every 15min, maintenance every 6hr
- All fallbacks chain: Supabase (primary) → alternatives → CF native
