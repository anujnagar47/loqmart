-- ================================================================
-- LoqMart: Phase 2 core-e-commerce audit-findings fix
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- Safe to re-run (uses DROP-then-CREATE throughout).
-- ================================================================

-- ----------------------------------------------------------------
-- F08. payments has no RLS at all today — no ALTER TABLE ... ENABLE
-- ROW LEVEL SECURITY and no policies exist for it anywhere in the
-- schema. It holds Razorpay payment IDs, signatures, and amounts.
-- The app writes to it only via the service-role client (which
-- bypasses RLS), so this closes the table for any other access path.
-- ----------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can view own payments" ON public.payments;
CREATE POLICY "Buyers can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sellers can view payments for their orders" ON public.payments;
CREATE POLICY "Sellers can view payments for their orders" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.sellers s ON s.id = o.seller_id
      WHERE o.id = payments.order_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage all payments" ON public.payments;
CREATE POLICY "Admins manage all payments" ON public.payments
  FOR ALL USING (public.is_admin_or_subadmin());

-- ================================================================
-- Verify
-- ================================================================
SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.payments'::regclass;
