-- ================================================================
-- LoqMart: Supabase Storage Bucket Setup
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- ================================================================
-- NOTE: Buckets must also be created via the Supabase Dashboard UI
-- or via the Storage API. This script only sets the RLS policies.
-- Go to: Storage > New Bucket (for each bucket below)

-- ── 1. product-images ─────────────────────────────────────────────
-- Bucket name: product-images | Public: YES | 10MB max
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 'product-images', true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

-- ── 2. seller-assets ──────────────────────────────────────────────
-- Bucket name: seller-assets | Public: YES | 5MB max (logos/banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seller-assets', 'seller-assets', true,
  5242880,   -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

-- ── 3. seller-documents ───────────────────────────────────────────
-- Bucket name: seller-documents | Public: NO | 15MB max (KYC documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seller-documents', 'seller-documents', false,
  15728640,
  ARRAY['image/jpeg','image/png','application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg','image/png','application/pdf'];

-- ── 4. blog-images ────────────────────────────────────────────────
-- Bucket name: blog-images | Public: YES | 8MB max
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images', 'blog-images', true,
  8388608,   -- 8 MB
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

-- ── 5. user-avatars ───────────────────────────────────────────────
-- Bucket name: user-avatars | Public: YES | 2MB max
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars', 'user-avatars', true,
  2097152,   -- 2 MB
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];


-- ── STORAGE RLS POLICIES ──────────────────────────────────────────

-- product-images: anyone can read, sellers can upload
DROP POLICY IF EXISTS "product-images public read" ON storage.objects;
CREATE POLICY "product-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

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

-- seller-assets: anyone can read, sellers can upload
DROP POLICY IF EXISTS "seller-assets public read" ON storage.objects;
CREATE POLICY "seller-assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'seller-assets');

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

-- seller-documents: admins read all, sellers can upload their own
DROP POLICY IF EXISTS "admins can view seller documents" ON storage.objects;
CREATE POLICY "admins can view seller documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'seller-documents'
    AND public.is_admin_or_subadmin()
  );

DROP POLICY IF EXISTS "sellers upload own documents" ON storage.objects;
CREATE POLICY "sellers upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'seller-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- blog-images: anyone can read, admins can upload
DROP POLICY IF EXISTS "blog-images public read" ON storage.objects;
CREATE POLICY "blog-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "admins can upload blog images" ON storage.objects;
CREATE POLICY "admins can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.is_admin_or_subadmin()
  );

DROP POLICY IF EXISTS "admins can update blog images" ON storage.objects;
CREATE POLICY "admins can update blog images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'blog-images'
    AND public.is_admin_or_subadmin()
  );

-- user-avatars: anyone can read, owner can upload
DROP POLICY IF EXISTS "user-avatars public read" ON storage.objects;
CREATE POLICY "user-avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "users can upload own avatar" ON storage.objects;
CREATE POLICY "users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "users can update own avatar" ON storage.objects;
CREATE POLICY "users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── VERIFY ────────────────────────────────────────────────────────
SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY name;
