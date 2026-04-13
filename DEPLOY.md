# NychIQ — Deployment Setup Guide

## Architecture
```
┌─────────────────┐     ┌──────────────────────────┐
│  CloudFlare      │     │  CloudFlare Worker        │
│  Pages (Next.js  │────▶│  (Hono API)               │
│  Static Export)  │     │  - AI Chat (Groq/Gemini)  │
│                  │     │  - YouTube (Piped/Invidious)│
│  nychiq.com      │     │  - Auth (Supabase)        │
└─────────────────┘     │  - Search (Brave/DuckDuckGo)│
                        │  - Social (SociaVault/TikWM)│
                        └──────┬───────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌──────────┐    ┌───────────┐    ┌───────────┐
       │ Supabase │    │ CloudFlare│    │ External  │
       │ (Auth +  │    │ KV/D1/R2  │    │ APIs      │
       │  Postgres)│    │ Vectorize │    │ (Groq,    │
       └──────────┘    └───────────┘    │  Gemini,  │
                                        │  Brave)   │
                                        └───────────┘
```

## 1. CloudFlare Setup

### Create Resources
```bash
# Install Wrangler CLI
npm install -g wrangler
wrangler login

# Create KV Namespace
wrangler kv:namespace create CACHE
# → Put the ID in worker/wrangler.toml

# Create D1 Database
wrangler d1 create nychiq-db
# → Put the database_id in worker/wrangler.toml

# Create R2 Bucket
wrangler r2 bucket create nychiq-storage

# Create Vectorize Index
wrangler vectorize create nychiq-embeddings --dimensions=1024 --metric=cosine

# Create Queue
wrangler queues create nychiq-tasks
```

### Set Worker Secrets (one-time)
```bash
cd worker

# AI Keys
wrangler secret put GROQ_KEY_1
wrangler secret put GEMINI_KEY_1
wrangler secret put CEREBRAS_KEY_1
wrangler secret put OPENROUTER_KEY_1
wrangler secret put HF_TOKEN_1
wrangler secret put ZAI_KEY_1

# Search Keys
wrangler secret put BRAVE_KEY_1
wrangler secret put TAVILY_KEY_1

# Social Scraping
wrangler secret put SOCIAVAULT_KEY_1
wrangler secret put ENSEMBLE_KEY_1
wrangler secret put TIKHUB_KEY_1

# YouTube Data API v3
wrangler secret put YT_KEY_1
wrangler secret put YT_KEY_2

# Email
wrangler secret put RESEND_KEY

# Payments
wrangler secret put PAYSTACK_SECRET

# Supabase
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
```

### Add More Keys (Key Rotation)
For each provider, you can add up to 3 keys:
```bash
wrangler secret put GROQ_KEY_2
wrangler secret put GROQ_KEY_3
# Same pattern for GEMINI, CEREBRAS, OPENROUTER, etc.
```

## 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase-schema.sql` → **Run**
3. Enable **Google** and **GitHub** OAuth in **Authentication → Providers**
4. Copy your **Project URL** and **anon key** (service role key goes to Worker secrets)

## 3. GitHub Actions Setup

Add these secrets to your GitHub repo:
- `CLOUDFLARE_API_TOKEN` — from CloudFlare dashboard → My Profile → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` — from CloudFlare dashboard → Workers & Pages → right sidebar

## 4. Frontend Config

Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_WORKER_URL=https://nychiq-api.your-subdomain.workers.dev
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 5. Local Development

### Worker
```bash
cd worker
bun install
bun run dev
# → http://localhost:8787
```

### Frontend (proxies API to worker)
```bash
# In root
NEXT_PUBLIC_WORKER_URL=http://localhost:8787 bun run dev
# → http://localhost:3000
```

## 6. Deploy

Push to `main` → GitHub Actions auto-deploys both frontend (Pages) and worker.

Manual deploy:
```bash
# Worker
cd worker && wrangler deploy

# Frontend
bun run build && wrangler pages deploy out --project-name=nychiq-frontend
```

## API Keys to Get (One Session)

| Key | URL | Purpose |
|-----|-----|---------|
| GROQ_KEY | console.groq.com/keys | AI Chat (primary) |
| GEMINI_KEY | aistudio.google.com/apikey | AI Chat (F1) + Vision |
| CEREBRAS_KEY | cerebras.ai | AI Chat (F2) |
| OPENROUTER_KEY | openrouter.ai/keys | AI Chat (F4) |
| HF_TOKEN | huggingface.co/settings/tokens | Image Gen (F2) |
| ZAI_KEY | open.bigmodel.cn | Image Gen (F3) |
| BRAVE_KEY | api.search.brave.com | Web Search (primary) |
| TAVILY_KEY | tavily.com | Web Search (F1) |
| SERP_KEY | — | ~~Web Search~~ **REMOVED** — using DuckDuckGo HTML fallback |
| SOCIAVAULT_KEY | sociavault.com/signup | Social scraping (primary) |
| ENSEMBLE_KEY | ensembledata.com | Social scraping (F1) |
| TIKHUB_KEY | rapidapi.com (Tikhub) | Social scraping (F2) |
| YT_KEY | console.cloud.google.com | YouTube API v3 |
| RESEND_KEY | resend.com | Email |
| PAYSTACK_SECRET | paystack.com | Payments |
