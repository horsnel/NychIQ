/**
 * NychIQ Worker — Environment bindings
 * All secrets are set via `wrangler secret put KEY_NAME`
 * Non-secrets are in wrangler.toml [vars]
 */

export interface Env {
  // ── CloudFlare Bindings ──
  CACHE: KVNamespace;
  DB: D1Database;
  STORAGE: R2Bucket;
  VECTORS: VectorizeIndex;
  TASK_QUEUE: Queue<unknown>;
  AI: Ai; // Workers AI — inference for embeddings, vision, translation, image gen
  ASSETS: Fetcher; // Static assets from [site] config

  // ── AI Keys (rotated: _1 through _4) ──
  GROQ_KEY_1?: string;
  GROQ_KEY_2?: string;
  GROQ_KEY_3?: string;
  GROQ_KEY_4?: string;
  GEMINI_KEY_1?: string;
  GEMINI_KEY_2?: string;
  GEMINI_KEY_3?: string;
  GEMINI_KEY_4?: string;
  CEREBRAS_KEY_1?: string;
  CEREBRAS_KEY_2?: string;
  OPENROUTER_KEY_1?: string;
  OPENROUTER_KEY_2?: string;
  HF_TOKEN_1?: string;
  HF_TOKEN_2?: string;
  ZAI_KEY_1?: string;
  ZAI_KEY_2?: string;

  // ── Search Keys ──
  BRAVE_KEY_1?: string;
  BRAVE_KEY_2?: string;
  TAVILY_KEY_1?: string;
  TAVILY_KEY_2?: string;

  // ── Social Scraping ──
  SOCIAVAULT_KEY_1?: string;
  SOCIAVAULT_KEY_2?: string;
  ENSEMBLE_KEY_1?: string;
  TIKHUB_KEY_1?: string;

  // ── YouTube Data API v3 (rotated keys) ──
  YT_KEY_1?: string;
  YT_KEY_2?: string;

  // ── Email ──
  RESEND_KEY?: string;
  BREVO_KEY?: string;

  // ── Payments ──
  PAYSTACK_SECRET?: string;

  // ── Supabase (PRIMARY) ──
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;

  // ── Upstash Redis (fallback cache/rate-limit) ──
  UPSTASH_REDIS_URL?: string;
  UPSTASH_REDIS_TOKEN?: string;

  // ── Turso (fallback database) ──
  TURSO_DB_URL?: string;
  TURSO_DB_TOKEN?: string;

  // ── Backblaze B2 (fallback storage) ──
  BACKBLAZE_KEY_ID?: string;
  BACKBLAZE_APP_KEY?: string;
  BACKBLAZE_BUCKET?: string;
  BACKBLAZE_ENDPOINT?: string;

  // ── Realtime Fallbacks ──
  ABLY_KEY?: string;
  SOKETI_URL?: string;

  // ── Scheduled Tasks ──
  QSTASH_TOKEN?: string;

  // ── Geocoding / Maps ──
  LOCATIONIQ_KEY?: string;
  RADAR_KEY?: string;

  // ── Trending / Hashtag Research ──
  TRENDTOK_KEY?: string;
  PENTOS_KEY?: string;
  HASHTAG_AI_KEY?: string;
  KEYWORDSEVERYWHERE_KEY?: string;

  // ── Geolocation (ipapi.co fallback) ──
  IPAPI_KEY?: string;

  // ── App ──
  ENVIRONMENT: string;
  CORS_ORIGINS?: string;
  APP_URL?: string;
}
