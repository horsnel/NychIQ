-- ═══════════════════════════════════════════════════════════════
-- NychIQ Supabase Schema v2
-- Updated with token spend tracking, monthly reset, and full audit
-- ═══════════════════════════════════════════════════════════════

-- ── Enable required extensions ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- 1. PROFILES TABLE (users)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Auth info
  email           TEXT NOT NULL,
  display_name    TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,

  -- Plan & Tokens
  plan            TEXT NOT NULL DEFAULT 'trial'
                  CHECK (plan IN ('trial', 'starter', 'pro', 'elite', 'agency')),
  token_balance   INTEGER NOT NULL DEFAULT 100,
  total_tokens_spent INTEGER NOT NULL DEFAULT 0,
  tokens_earned   INTEGER NOT NULL DEFAULT 0,

  -- Monthly reset tracking
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  signup_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Settings
  region          TEXT NOT NULL DEFAULT 'NG',
  referral_code   TEXT UNIQUE,
  referred_by     UUID REFERENCES public.profiles(id),
  worker_url      TEXT DEFAULT '',

  -- Metadata
  onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason      TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- ═══════════════════════════════════════════════════════════════
-- 2. TOKEN_TRANSACTIONS TABLE (spend/earn/reset history)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Transaction details
  tool            TEXT NOT NULL,                -- Which tool was used (e.g., 'trending', 'seo')
  tokens          INTEGER NOT NULL,             -- Number of tokens (positive for spend, negative for earn)
  txn_type        TEXT NOT NULL DEFAULT 'spend'
                  CHECK (txn_type IN ('spend', 'earn', 'reset', 'bonus', 'refund')),

  -- Context
  metadata        JSONB DEFAULT '{}',           -- Extra info (e.g., query, result count)

  -- Timestamp
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_txn_user ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_txn_profile ON public.token_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_token_txn_type ON public.token_transactions(txn_type);
CREATE INDEX IF NOT EXISTS idx_token_txn_created ON public.token_transactions(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 3. USAGE_SUMMARY TABLE (daily aggregation for analytics)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.usage_summary (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Summary fields
  total_spent     INTEGER NOT NULL DEFAULT 0,
  total_earned    INTEGER NOT NULL DEFAULT 0,
  tools_used      INTEGER NOT NULL DEFAULT 0,
  top_tool        TEXT DEFAULT '',
  top_category    TEXT DEFAULT '',

  -- Category breakdown (stored as JSONB)
  category_breakdown JSONB DEFAULT '{}',

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_summary_profile ON public.usage_summary(profile_id);
CREATE INDEX IF NOT EXISTS idx_usage_summary_date ON public.usage_summary(date DESC);

-- ═══════════════════════════════════════════════════════════════
-- 4. TRACKED_CHANNELS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tracked_channels (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id      TEXT NOT NULL,                -- YouTube channel ID
  channel_name    TEXT NOT NULL DEFAULT '',
  channel_handle  TEXT DEFAULT '',
  avatar_url      TEXT DEFAULT '',
  subscriber_count BIGINT DEFAULT 0,
  video_count     INTEGER DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT DEFAULT '',
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(profile_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_tracked_channels_profile ON public.tracked_channels(profile_id);

-- ═══════════════════════════════════════════════════════════════
-- 5. VIRAL_SCORES TABLE (cached viral predictions)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.viral_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id        TEXT NOT NULL,
  channel_id      TEXT DEFAULT '',
  title           TEXT DEFAULT '',
  thumbnail_url   TEXT DEFAULT '',
  viral_score     INTEGER NOT NULL DEFAULT 0 CHECK (viral_score >= 0 AND viral_score <= 100),
  views_predicted BIGINT DEFAULT 0,
  views_actual    BIGINT DEFAULT 0,
  niche           TEXT DEFAULT '',
  region          TEXT DEFAULT 'NG',
  scored_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  UNIQUE(video_id)
);

CREATE INDEX IF NOT EXISTS idx_viral_scores_score ON public.viral_scores(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_scores_expires ON public.viral_scores(expires_at);

-- ═══════════════════════════════════════════════════════════════
-- 6. NOTIFICATIONS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  notif_type      TEXT NOT NULL DEFAULT 'info'
                  CHECK (notif_type IN ('info', 'success', 'warning', 'error', 'system')),
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  action_url      TEXT DEFAULT '',               -- e.g., 'tool:trending' or 'link:https://...'
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_profile ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifs_unread ON public.notifications(profile_id, is_read) WHERE is_read = FALSE;

-- ═══════════════════════════════════════════════════════════════
-- 7. REFERRALS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code   TEXT NOT NULL,
  tokens_awarded  INTEGER NOT NULL DEFAULT 20,
  is_claimed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- ═══════════════════════════════════════════════════════════════
-- 8. SAVED_RESULTS TABLE (for sovereign vault, audits, etc.)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.saved_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool            TEXT NOT NULL,                -- Which tool generated this
  title           TEXT NOT NULL DEFAULT '',
  result_data     JSONB NOT NULL DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_saved_results_profile ON public.saved_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_saved_results_tool ON public.saved_results(profile_id, tool);

-- ═══════════════════════════════════════════════════════════════
-- 9. AUDIT_LOG TABLE (security and compliance)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,                -- e.g., 'login', 'spend_tokens', 'upgrade_plan', 'reset_password'
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_profile ON public.audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 10. SUBSCRIPTIONS TABLE (for payment tracking)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'elite', 'agency')),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  provider        TEXT NOT NULL DEFAULT 'manual'  -- 'flutterwave', 'paystack', 'manual'
                  CHECK (provider IN ('flutterwave', 'paystack', 'manual')),
  provider_ref    TEXT DEFAULT '',
  amount          INTEGER NOT NULL,              -- Amount in smallest currency unit (kobo)
  currency        TEXT NOT NULL DEFAULT 'NGN',
  billing_cycle   TEXT NOT NULL DEFAULT 'monthly'
                  CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(profile_id, status) WHERE status = 'active'
);

CREATE INDEX IF NOT EXISTS idx_subs_profile ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON public.subscriptions(status);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Token transactions: users can read their own
CREATE POLICY "Users can view own token transactions"
  ON public.token_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token transactions"
  ON public.token_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usage summary: users can read their own
CREATE POLICY "Users can view own usage summary"
  ON public.usage_summary FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Tracked channels: users can manage their own
CREATE POLICY "Users can view own tracked channels"
  ON public.tracked_channels FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can insert own tracked channels"
  ON public.tracked_channels FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can update own tracked channels"
  ON public.tracked_channels FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can delete own tracked channels"
  ON public.tracked_channels FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Viral scores: public read (trending), authenticated write
CREATE POLICY "Anyone can view viral scores"
  ON public.viral_scores FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert viral scores"
  ON public.viral_scores FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notifications: users can manage their own
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Referrals: users can read their own, insert new referrals
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Saved results: users can manage their own
CREATE POLICY "Users can view own saved results"
  ON public.saved_results FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can insert own saved results"
  ON public.saved_results FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can delete own saved results"
  ON public.saved_results FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Subscriptions: users can read their own
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_usage ON public.usage_summary;
CREATE TRIGGER set_updated_at_usage
  BEFORE UPDATE ON public.usage_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Auto-create profile on user signup ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Log token transactions and update profile balance ──
CREATE OR REPLACE FUNCTION public.record_token_spend()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile balance
  IF NEW.txn_type = 'spend' THEN
    UPDATE public.profiles
    SET token_balance = token_balance - NEW.tokens,
        total_tokens_spent = total_tokens_spent + NEW.tokens
    WHERE id = NEW.profile_id;
  ELSIF NEW.txn_type IN ('earn', 'reset', 'bonus', 'refund') THEN
    UPDATE public.profiles
    SET token_balance = token_balance + NEW.tokens,
        tokens_earned = tokens_earned + NEW.tokens
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_token_spend ON public.token_transactions;
CREATE TRIGGER on_token_spend
  AFTER INSERT ON public.token_transactions
  FOR EACH ROW EXECUTE FUNCTION public.record_token_spend();

-- ── Monthly token reset function (call via cron or scheduled edge function) ──
CREATE OR REPLACE FUNCTION public.monthly_token_reset()
RETURNS void AS $$
DECLARE
  plan_tokens INTEGER;
  reset_amount INTEGER;
BEGIN
  -- Only run on the 31st
  IF EXTRACT(DAY FROM CURRENT_DATE) != 31 THEN
    RETURN;
  END IF;

  FOR rec IN SELECT id, plan, last_reset_date FROM public.profiles WHERE plan != 'elite' LOOP
    -- Skip if already reset today
    IF rec.last_reset_date = CURRENT_DATE THEN
      CONTINUE;
    END IF;

    -- Determine reset amount by plan
    CASE rec.plan
      WHEN 'trial' THEN reset_amount := 100;
      WHEN 'starter' THEN reset_amount := 500;
      WHEN 'pro' THEN reset_amount := 3500;
      WHEN 'agency' THEN reset_amount := 50000;
      ELSE reset_amount := 100;
    END CASE;

    -- Update balance
    UPDATE public.profiles
    SET token_balance = reset_amount,
        last_reset_date = CURRENT_DATE
    WHERE id = rec.id;

    -- Log the reset transaction
    INSERT INTO public.token_transactions (profile_id, user_id, tool, tokens, txn_type)
    SELECT rec.id, user_id, 'Monthly Reset', reset_amount, 'reset'
    FROM public.profiles WHERE id = rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Get token usage stats for a user ──
CREATE OR REPLACE FUNCTION public.get_user_token_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  profile_rec RECORD;
  spend_count INTEGER;
  week_spent INTEGER;
  month_spent INTEGER;
  top_tool TEXT;
BEGIN
  SELECT * INTO profile_rec FROM public.profiles WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO spend_count
  FROM public.token_transactions
  WHERE user_id = p_user_id AND txn_type = 'spend';

  SELECT COALESCE(SUM(tokens), 0) INTO week_spent
  FROM public.token_transactions
  WHERE user_id = p_user_id AND txn_type = 'spend'
    AND created_at >= NOW() - INTERVAL '7 days';

  SELECT COALESCE(SUM(tokens), 0) INTO month_spent
  FROM public.token_transactions
  WHERE user_id = p_user_id AND txn_type = 'spend'
    AND created_at >= NOW() - INTERVAL '30 days';

  SELECT tool INTO top_tool
  FROM public.token_transactions
  WHERE user_id = p_user_id AND txn_type = 'spend'
  GROUP BY tool ORDER BY SUM(tokens) DESC LIMIT 1;

  RETURN jsonb_build_object(
    'plan', profile_rec.plan,
    'token_balance', profile_rec.token_balance,
    'total_spent', profile_rec.total_tokens_spent,
    'tokens_earned', profile_rec.tokens_earned,
    'last_reset', profile_rec.last_reset_date,
    'total_transactions', spend_count,
    'week_spent', week_spent,
    'month_spent', month_spent,
    'top_tool', COALESCE(top_tool, 'none')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
