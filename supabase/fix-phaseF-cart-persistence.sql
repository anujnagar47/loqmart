-- ================================================================
-- LoqMart Phase F: Server-side cart persistence
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
--
-- Re-introduces cart_items (dropped in fix-phase2-drop-unused-cart-tables.sql
-- when the cart was client-only) — now with variant awareness and no
-- separate `carts` wrapper table, since each user has exactly one
-- live cart (no multi-cart / saved-cart feature requested).
-- ================================================================

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- variant_id is nullable, and NULL <> NULL means a plain UNIQUE
    -- constraint on (user_id, product_id, variant_id) would let the
    -- same no-variant product be added as two separate rows — this
    -- generated column collapses NULL to a sentinel so the constraint
    -- actually enforces "one line per product+variant per user".
    variant_key UUID GENERATED ALWAYS AS (COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)) STORED,
    UNIQUE(user_id, product_id, variant_key)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
CREATE POLICY "Users can manage their own cart"
    ON cart_items FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── VERIFY ────────────────────────────────────────────────────────
SELECT 'cart_items' AS table_name, count(*) FROM cart_items;
