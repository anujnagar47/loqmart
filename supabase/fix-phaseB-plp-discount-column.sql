-- ================================================================
-- LoqMart: Phase B PLP rebuild — real discount column
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
--
-- The product listing page needs a real "Discount %" filter and a
-- "Best Discount" sort. Postgres/PostgREST can't filter or sort on a
-- ratio computed from two other columns (mrp, price) without either an
-- RPC or a real column, so this adds a generated column that Postgres
-- keeps in sync automatically — never written to directly, always
-- derived from mrp/price. Also useful later for a real "Deals" section.
--
-- Safe to re-run (IF NOT EXISTS throughout).
-- ================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent INTEGER
  GENERATED ALWAYS AS (
    CASE
      WHEN mrp IS NOT NULL AND mrp > 0 AND mrp > price
        THEN ROUND(((mrp - price) / mrp) * 100)
      ELSE 0
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_discount_percent ON public.products(discount_percent);

-- ================================================================
-- Verify
-- ================================================================
SELECT slug, price, mrp, discount_percent FROM public.products
WHERE mrp IS NOT NULL ORDER BY discount_percent DESC LIMIT 10;
