-- ================================================================
-- LoqMart: Phase 4 admin-authority audit-findings fix
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- Safe to re-run (uses DROP-then-CREATE throughout).
--
-- F11 (sub_admin self-promotion) and F12 (state_scope enforcement)
-- are pure application-code fixes — nothing to run here for those.
-- ================================================================

-- ----------------------------------------------------------------
-- F24. seller_approvals, product_approvals, swadeshi_rank_history
-- have no RLS enabled at all today. These are written only by the
-- service-role client (admin routes / triggers), so this closes them
-- to any other access path and lets a seller see their own record.
--
-- (`carts` is the fourth table from this finding — it's handled by
-- fix-phase2-drop-unused-cart-tables.sql instead, since the app
-- doesn't use it at all. Run that file too if you haven't.)
-- ----------------------------------------------------------------
ALTER TABLE public.seller_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view own approval records" ON public.seller_approvals;
CREATE POLICY "Sellers can view own approval records" ON public.seller_approvals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_approvals.seller_id AND s.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage seller approvals" ON public.seller_approvals;
CREATE POLICY "Admins manage seller approvals" ON public.seller_approvals
  FOR ALL USING (public.is_admin_or_subadmin());

ALTER TABLE public.product_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view own product approval records" ON public.product_approvals;
CREATE POLICY "Sellers can view own product approval records" ON public.product_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.sellers s ON s.id = p.seller_id
      WHERE p.id = product_approvals.product_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage product approvals" ON public.product_approvals;
CREATE POLICY "Admins manage product approvals" ON public.product_approvals
  FOR ALL USING (public.is_admin_or_subadmin());

ALTER TABLE public.swadeshi_rank_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view own rank history" ON public.swadeshi_rank_history;
CREATE POLICY "Sellers can view own rank history" ON public.swadeshi_rank_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = swadeshi_rank_history.seller_id AND s.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage rank history" ON public.swadeshi_rank_history;
CREATE POLICY "Admins manage rank history" ON public.swadeshi_rank_history
  FOR ALL USING (public.is_admin_or_subadmin());

-- ================================================================
-- Verify
-- ================================================================
SELECT relname, relrowsecurity FROM pg_class
WHERE relname IN ('seller_approvals', 'product_approvals', 'swadeshi_rank_history') AND relnamespace = 'public'::regnamespace;
