-- ================================================================
-- LoqMart: Phase 1 critical-audit-findings fix
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- Safe to re-run (uses IF NOT EXISTS / DROP-then-CREATE throughout).
-- ================================================================

-- ----------------------------------------------------------------
-- F01a. Close the self-role-escalation hole on public.users.
-- "Users can update their own profile" has USING (auth.uid()=id) and
-- NO WITH CHECK, so Postgres reuses USING for the new row too — any
-- authenticated user can currently PATCH their own role/is_suspended/
-- state_scope straight through the anon-key client. Lock those three
-- columns with a BEFORE UPDATE trigger instead of a WITH CHECK
-- subquery, to avoid the same self-referential-policy recursion this
-- schema already hit once (see fix-rls-recursion.sql).
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Server-side service-role client (checkout, admin routes, webhooks) is trusted.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- An authenticated admin/sub_admin acting through the session client may
  -- change these fields on ANY row (this function is SECURITY DEFINER so
  -- calling is_admin_or_subadmin() here does not recurse).
  IF public.is_admin_or_subadmin() THEN
    RETURN NEW;
  END IF;
  -- Anyone else (a user updating their own row): privilege fields are frozen.
  NEW.role         := OLD.role;
  NEW.is_suspended := OLD.is_suspended;
  NEW.state_scope  := OLD.state_scope;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_privilege_escalation ON public.users;
CREATE TRIGGER trg_prevent_self_privilege_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_privilege_escalation();

-- ----------------------------------------------------------------
-- F01b. handle_new_user() currently sets role straight from
-- raw_user_meta_data->>'role' at signup — anyone can currently sign up
-- with options.data.role = 'admin' (or 'seller') and get that role
-- immediately, bypassing both admin creation and the seller-approval
-- workflow entirely. Every account must start as 'buyer'; seller
-- status is granted only by /api/admin/sellers/[id]/approve, and admin
-- only by another admin via /api/admin/users.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      split_part(COALESCE(NEW.email, 'user@loqmart.in'), '@', 1)
    ),
    NEW.phone,
    'buyer'::user_role,
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email          = EXCLUDED.email,
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    updated_at     = NOW();

  INSERT INTO public.loqcoin_balances (user_id, balance, lifetime_earned, lifetime_redeemed)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
-- (trigger on_auth_user_created already points at this function — no need to recreate it)

-- ----------------------------------------------------------------
-- F07. return_requests has buyer/seller SELECT policies but no policy
-- letting a buyer actually create their own return request.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Buyers can create own return requests" ON public.return_requests;
CREATE POLICY "Buyers can create own return requests" ON public.return_requests
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- ----------------------------------------------------------------
-- F05. Contact form has nowhere to write to today — table + admin-only
-- read policy. Inserts happen via the API route's service-role client
-- (after basic server-side validation), so no public INSERT policy is
-- needed or granted here.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  phone      VARCHAR(20),
  subject    VARCHAR(255),
  message    TEXT NOT NULL,
  status     VARCHAR(20) DEFAULT 'new', -- new | read | responded
  user_id    UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages
  FOR ALL USING (public.is_admin_or_subadmin());

-- ----------------------------------------------------------------
-- F06. Grievance form — same shape, plus a persisted, unique ticket
-- number (the old page fabricated one client-side and threw it away).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grievances (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number  VARCHAR(32) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(20),
  order_id       UUID REFERENCES public.orders(id),
  category       VARCHAR(50) NOT NULL, -- product_quality | delivery | payment | seller_conduct | other
  description    TEXT NOT NULL,
  status         VARCHAR(20) DEFAULT 'open', -- open | in_review | resolved | closed
  user_id        UUID REFERENCES public.users(id),
  resolved_by    UUID REFERENCES public.users(id),
  resolved_at    TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grievances_created ON public.grievances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON public.grievances(status);

ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage grievances" ON public.grievances;
CREATE POLICY "Admins can manage grievances" ON public.grievances
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Users can view own grievances" ON public.grievances;
CREATE POLICY "Users can view own grievances" ON public.grievances
  FOR SELECT USING (auth.uid() = user_id);

-- ================================================================
-- Verify: confirm the trigger is attached and the new tables exist.
-- ================================================================
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.users'::regclass AND NOT tgisinternal;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('contact_messages','grievances');
