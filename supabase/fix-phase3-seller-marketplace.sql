-- ================================================================
-- LoqMart: Phase 3 seller-marketplace audit-findings fix
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- Safe to re-run (uses DROP-then-CREATE throughout).
-- ================================================================

-- ----------------------------------------------------------------
-- F09. product-images / seller-assets storage policies check only
-- "caller is some seller", never that the object path belongs to
-- THIS seller — unlike seller-documents/user-avatars, which correctly
-- scope by (storage.foldername(name))[1]. Any seller can currently
-- overwrite or delete another seller's uploaded images.
--
-- The app uploads product images to `${sellers.id}/...` (see
-- handleImageUpload in src/app/seller/dashboard/page.tsx), so the
-- folder check below compares against the caller's own seller id,
-- not auth.uid() directly.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "sellers can upload product images" ON storage.objects;
CREATE POLICY "sellers can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (SELECT id::text FROM public.sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sellers can update own product images" ON storage.objects;
CREATE POLICY "sellers can update own product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (SELECT id::text FROM public.sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sellers can delete own product images" ON storage.objects;
CREATE POLICY "sellers can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (SELECT id::text FROM public.sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sellers can upload seller assets" ON storage.objects;
CREATE POLICY "sellers can upload seller assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'seller-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (SELECT id::text FROM public.sellers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sellers can update own assets" ON storage.objects;
CREATE POLICY "sellers can update own assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'seller-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (SELECT id::text FROM public.sellers WHERE user_id = auth.uid())
  );

-- seller-assets had no DELETE policy at all (oversight, same family as
-- the gap above) — adding one now, scoped the same way.
DROP POLICY IF EXISTS "sellers can delete own assets" ON storage.objects;
CREATE POLICY "sellers can delete own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'seller-assets'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (SELECT id::text FROM public.sellers WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------
-- F21. Sellers' ALL policy on products scopes ownership (seller_id
-- must be theirs) but not columns — a seller calling the client SDK
-- directly could self-approve a pending product, mark it featured, or
-- inflate rating/sold_count, bypassing the admin review workflow.
-- Lock those columns to their existing values unless the caller is
-- admin/sub_admin or the service-role client (checkout/reviews/admin
-- routes all write these columns legitimately server-side).
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_seller_column_tampering()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF public.is_admin_or_subadmin() THEN
    RETURN NEW;
  END IF;
  NEW.approval_status := OLD.approval_status;
  NEW.is_featured      := OLD.is_featured;
  NEW.rating            := OLD.rating;
  NEW.review_count       := OLD.review_count;
  NEW.sold_count          := OLD.sold_count;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_seller_column_tampering ON public.products;
CREATE TRIGGER trg_prevent_seller_column_tampering
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.prevent_seller_column_tampering();

-- ----------------------------------------------------------------
-- F22. Two INSERT policies exist on reviews today, from two different
-- migration files, and Postgres OR's them together — so even though
-- schema.sql's original policy required is_verified = true (itself
-- weak, since is_verified was client-settable), fix-product-visibility
-- .sql later added a second policy with NO check beyond auth.uid() =
-- user_id, which makes the first one's restriction meaningless. Any
-- authenticated user can currently insert a review for any product
-- without having purchased it, if calling the client SDK directly
-- rather than the app's own /api/products/[slug]/reviews route (which
-- does check this correctly, and remains the only path the UI uses).
-- Drop both by their real names and replace with one correct policy.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create reviews for purchased items" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
CREATE POLICY "Verified buyers can review purchased products" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.product_id = reviews.product_id
        AND o.user_id = auth.uid()
        AND o.payment_status = 'paid'
    )
  );

-- ================================================================
-- Verify
-- ================================================================
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.products'::regclass AND NOT tgisinternal;
SELECT polname FROM pg_policy WHERE polrelid = 'public.reviews'::regclass;
