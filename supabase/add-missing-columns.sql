-- LoqMart: Add missing columns
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql

-- sellers: contact and status fields
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS trust_score DECIMAL(4,2) DEFAULT 0;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- orders: shipping address (JSONB), discount, and tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('sellers','orders')
  AND column_name IN ('phone','trust_score','is_suspended','shipping_address','discount_amount','tracking_number')
ORDER BY table_name, column_name;
