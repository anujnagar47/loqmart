-- ================================================================
-- LoqMart: F28 — drop the unused carts / cart_items tables
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
--
-- The cart has always been client-only (Zustand + localStorage) —
-- confirmed via a repo-wide search: no route or component anywhere
-- queries `carts` or `cart_items`. These tables have sat empty and
-- unreferenced since the schema was created. Dropping them removes
-- dead, previously-unprotected surface area (cart_items had RLS
-- enabled with no policies — effectively unreachable, but still
-- worth removing rather than leaving inert) and stops the docs from
-- implying server-side cart support that doesn't exist.
--
-- Safe to run: both tables are confirmed empty and unused. If you'd
-- rather keep them for a future server-cart-sync feature, skip this
-- file — nothing else in Phase 1/2 depends on them being gone.
-- ================================================================

DROP TABLE IF EXISTS public.cart_items;
DROP TABLE IF EXISTS public.carts;

-- ================================================================
-- Verify: should return 0 rows.
-- ================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('carts', 'cart_items');
