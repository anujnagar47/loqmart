-- ================================================================
-- LoqMart: Fix missing triggers for new user auto-registration
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- ================================================================

-- Step 1: Backfill any auth users who don't have a public.users row yet
-- This fixes accounts like seller1@loqmart.com that were created but have no profile
INSERT INTO public.users (id, email, full_name, role, email_verified)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
    split_part(COALESCE(au.email, 'user@loqmart.in'), '@', 1)
  ),
  CASE
    WHEN au.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
    ELSE 'buyer'::user_role
  END,
  au.email_confirmed_at IS NOT NULL
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 2: Backfill loqcoin_balances for those users too
INSERT INTO public.loqcoin_balances (user_id, balance, lifetime_earned, lifetime_redeemed)
SELECT id, 0, 0, 0 FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Re-create the handle_new_user function and trigger
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
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'seller' THEN 'seller'::user_role
      WHEN NEW.raw_user_meta_data->>'role' = 'admin'  THEN 'admin'::user_role
      ELSE 'buyer'::user_role
    END,
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 4: Re-create the email verification trigger
CREATE OR REPLACE FUNCTION handle_user_email_verification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET email_verified = true, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_email_verification();

-- Step 5: Also grant service role INSERT on users (needed for trigger)
GRANT INSERT, UPDATE ON public.users TO service_role;
GRANT INSERT, UPDATE ON public.loqcoin_balances TO service_role;

-- Verify: show all users now in public.users
SELECT id, email, full_name, role, created_at FROM public.users ORDER BY created_at DESC;
