-- ============================================================
-- LoqMart Survey & Referral System
-- Run in Supabase SQL Editor
-- ============================================================

-- Survey responses table
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email               TEXT        NOT NULL,
  name                TEXT        NOT NULL,
  city_state          TEXT        NOT NULL,
  q1_frequency        TEXT        NOT NULL,
  q2_origin           TEXT        NOT NULL,
  q3_amazon           TEXT        NOT NULL,
  q4_choose_local     TEXT        NOT NULL,
  q5_preference       TEXT        NOT NULL,
  q6_premium          TEXT,
  q7_categories       TEXT[]      DEFAULT ARRAY[]::TEXT[],
  referral_code       TEXT        UNIQUE NOT NULL,
  referred_by         TEXT,
  referral_count      INTEGER     DEFAULT 0,
  milestones_reached  TEXT[]      DEFAULT ARRAY[]::TEXT[],
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_email_unique    ON public.survey_responses(lower(email));
CREATE INDEX        IF NOT EXISTS idx_survey_referral_code   ON public.survey_responses(referral_code);
CREATE INDEX        IF NOT EXISTS idx_survey_referred_by     ON public.survey_responses(referred_by);
CREATE INDEX        IF NOT EXISTS idx_survey_created_at      ON public.survey_responses(created_at DESC);

-- Discount codes earned through survey participation
CREATE TABLE IF NOT EXISTS public.survey_discount_codes (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_response_id  UUID        REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  email               TEXT        NOT NULL,
  code                TEXT        UNIQUE NOT NULL,
  description         TEXT        NOT NULL,
  discount_percent    INTEGER     DEFAULT 0,
  free_delivery       BOOLEAN     DEFAULT FALSE,
  free_order          BOOLEAN     DEFAULT FALSE,
  milestone           TEXT        NOT NULL,
  is_used             BOOLEAN     DEFAULT FALSE,
  used_at             TIMESTAMPTZ,
  used_by_order_id    UUID,
  expires_at          TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_code     ON public.survey_discount_codes(upper(code));
CREATE INDEX IF NOT EXISTS idx_discount_email    ON public.survey_discount_codes(lower(email));
CREATE INDEX IF NOT EXISTS idx_discount_response ON public.survey_discount_codes(survey_response_id);
CREATE INDEX IF NOT EXISTS idx_discount_is_used  ON public.survey_discount_codes(is_used);

-- ─── Row Level Security ────────────────────────────────────────

ALTER TABLE public.survey_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "survey_anon_insert"     ON public.survey_responses;
DROP POLICY IF EXISTS "survey_auth_select_own" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_service_all"     ON public.survey_responses;
DROP POLICY IF EXISTS "discount_service_all"   ON public.survey_discount_codes;

-- Anyone (including unauthenticated) can submit the survey
CREATE POLICY "survey_anon_insert" ON public.survey_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can read their own survey by email (for referral lookup page)
CREATE POLICY "survey_auth_select_own" ON public.survey_responses
  FOR SELECT TO authenticated
  USING (email = lower(current_setting('request.jwt.claims', true)::json->>'email'));

-- Service role has unrestricted access for all API operations
CREATE POLICY "survey_service_all" ON public.survey_responses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "discount_service_all" ON public.survey_discount_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── updated_at trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_survey_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_survey_updated_at ON public.survey_responses;
CREATE TRIGGER trg_survey_updated_at
  BEFORE UPDATE ON public.survey_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_survey_updated_at();
