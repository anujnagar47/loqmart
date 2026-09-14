-- ================================================================
-- LoqMart: Seller registration — Amazon-Seller-Central-standard fields
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- Safe to re-run (uses ADD COLUMN IF NOT EXISTS throughout).
--
-- The seller registration form previously collected only business
-- name/owner/address/PAN/GSTIN/bank details. Bringing it up to the
-- standard a marketplace seller onboarding flow (business type,
-- storefront name, identity proof, category intent, named bank
-- account holder) needs these additional columns.
-- ================================================================

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS business_type VARCHAR(30);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS store_name VARCHAR(255);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS id_proof_type VARCHAR(30);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS id_proof_number VARCHAR(50);
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS intended_categories TEXT[];

COMMENT ON COLUMN public.sellers.business_type IS 'individual | proprietorship | partnership | llp | private_ltd | public_ltd';
COMMENT ON COLUMN public.sellers.store_name IS 'Public-facing storefront name shown to buyers — distinct from the legal business_name.';
COMMENT ON COLUMN public.sellers.id_proof_type IS 'aadhaar | passport | voter_id | driving_license';
COMMENT ON COLUMN public.sellers.intended_categories IS 'Category names the seller declared an intent to sell in at registration time.';

-- ================================================================
-- Verify
-- ================================================================
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sellers'
  AND column_name IN ('business_type', 'store_name', 'date_of_birth', 'id_proof_type', 'id_proof_number', 'intended_categories', 'bank_account_name')
ORDER BY column_name;
