-- ================================================================
-- LoqMart Phase E: Product Variants, Q&A, and Review Photos
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- ================================================================

-- ── 1. product_variants ────────────────────────────────────────────
-- A flat, one-dimensional variant list per product (e.g. "Small",
-- "Red - M", "500g"). price/mrp/image_url are nullable overrides —
-- null means "inherit from the parent product". stock is tracked
-- per-variant once a product has any variants.
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(100),
    price DECIMAL(10,2),
    mrp DECIMAL(10,2),
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view variants of approved products" ON product_variants;
CREATE POLICY "Anyone can view variants of approved products"
    ON product_variants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_variants.product_id
            AND products.approval_status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Sellers can manage variants of their own products" ON product_variants;
CREATE POLICY "Sellers can manage variants of their own products"
    ON product_variants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products
            JOIN sellers ON sellers.id = products.seller_id
            WHERE products.id = product_variants.product_id
            AND sellers.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all variants" ON product_variants;
CREATE POLICY "Admins can manage all variants"
    ON product_variants FOR ALL
    USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Order items need to remember which variant was purchased (and a
-- name snapshot, since a variant can later be renamed or deleted —
-- mirrors how order_items.price already snapshots price at purchase
-- time rather than joining live product data).
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100);

-- ── 2. product_questions / product_answers (Q&A) ───────────────────
CREATE TABLE IF NOT EXISTS product_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_questions_product_id ON product_questions(product_id);

CREATE TABLE IF NOT EXISTS product_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_seller BOOLEAN DEFAULT FALSE,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_answers_question_id ON product_answers(question_id);

ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view questions on approved products" ON product_questions;
CREATE POLICY "Anyone can view questions on approved products"
    ON product_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_questions.product_id
            AND products.approval_status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Authenticated users can ask questions" ON product_questions;
CREATE POLICY "Authenticated users can ask questions"
    ON product_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own questions" ON product_questions;
CREATE POLICY "Users can delete their own questions"
    ON product_questions FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view answers" ON product_answers;
CREATE POLICY "Anyone can view answers"
    ON product_answers FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can answer questions" ON product_answers;
CREATE POLICY "Authenticated users can answer questions"
    ON product_answers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own answers" ON product_answers;
CREATE POLICY "Users can delete their own answers"
    ON product_answers FOR DELETE
    USING (auth.uid() = user_id);

-- ── 3. review-images storage bucket ────────────────────────────────
-- Bucket name: review-images | Public: YES | 8MB max
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images', 'review-images', true,
  8388608,   -- 8 MB
  ARRAY['image/jpeg','image/png','image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS "review-images public read" ON storage.objects;
CREATE POLICY "review-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-images');

DROP POLICY IF EXISTS "authenticated users can upload review images" ON storage.objects;
CREATE POLICY "authenticated users can upload review images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "users can delete their own review images" ON storage.objects;
CREATE POLICY "users can delete their own review images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── VERIFY ────────────────────────────────────────────────────────
SELECT 'product_variants' AS table_name, count(*) FROM product_variants
UNION ALL
SELECT 'product_questions', count(*) FROM product_questions
UNION ALL
SELECT 'product_answers', count(*) FROM product_answers;
