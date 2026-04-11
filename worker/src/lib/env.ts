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
  REALTIME: DurableObjectNamespace;
  TASK_QUEUE: Queue<unknown>;

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
  SERP_KEY_1?: string;

  // ── Social Scraping ──
  SOCIAVAULT_KEY_1?: string;
  SOCIAVAULT_KEY_2?: string;
  ENSEMBLE_KEY_1?: string;
  TIKHUB_KEY_1?: string;

  // ── YouTube Data API v3 (rotated 4 keys) ──
  YT_KEY_1?: string;
  YT_KEY_2?: string;
  YT_KEY_3?: string;
  YT_KEY_4?: string;

  // ── Email ──
  RESEND_KEY?: string;

  // ── Payments ──
  PAYSTACK_SECRET?: string;

  // ── Supabase ──
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;

  // ── App ──
  ENVIRONMENT: string;
  CORS_ORIGINS?: string;
}
