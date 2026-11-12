-- Phase 2 security fix: sellers may only write files inside their own
-- seller-id folder. Upload code uses `${seller.id}/...` for product images.
-- Apply after setup-storage.sql. Safe to re-run.

DROP POLICY IF EXISTS "sellers can upload product images" ON storage.objects;
CREATE POLICY "sellers can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.approval_status = 'approved'
        AND (storage.foldername(name))[1] = s.id::text
    )
  );

DROP POLICY IF EXISTS "sellers can update own product images" ON storage.objects;
CREATE POLICY "sellers can update own product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.approval_status = 'approved'
        AND (storage.foldername(name))[1] = s.id::text
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.approval_status = 'approved'
        AND (storage.foldername(name))[1] = s.id::text
    )
  );

DROP POLICY IF EXISTS "sellers can delete own product images" ON storage.objects;
CREATE POLICY "sellers can delete own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.approval_status = 'approved'
        AND (storage.foldername(name))[1] = s.id::text
    )
  );

DROP POLICY IF EXISTS "sellers can upload seller assets" ON storage.objects;
CREATE POLICY "sellers can upload seller assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'seller-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.approval_status = 'approved'
        AND (storage.foldername(name))[1] = s.id::text
    )
  );

DROP POLICY IF EXISTS "sellers can update own assets" ON storage.objects;
CREATE POLICY "sellers can update own assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'seller-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.approval_status = 'approved'
        AND (storage.foldername(name))[1] = s.id::text
    )
  )
  WITH CHECK (
    bucket_id = 'seller-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.user_id = auth.uid()
        AND s.approval_status = 'approved'
        AND (storage.foldername(name))[1] = s.id::text
    )
  );
