-- ================================================================
-- Commission Settings Database Schema Setup
-- ================================================================

-- Enable uuid-ossp extension if not already done
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the commission_settings table
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope VARCHAR(20) NOT NULL DEFAULT 'global',   -- 'global' | 'category' | 'seller'
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,        -- percentage
  gateway_rate DECIMAL(5,2) NOT NULL DEFAULT 2.00, -- payment gateway processing fee %
  min_order_value DECIMAL(10,2) DEFAULT 0.00,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  changed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent multiple rules of the same scope targeting the same entity
  -- NULLS NOT DISTINCT is required to handle category_id/seller_id null check correctly on UNIQUE constraints
  UNIQUE NULLS NOT DISTINCT (scope, category_id, seller_id)
);

-- Indexing for lookup performance
CREATE INDEX IF NOT EXISTS idx_commission_scope ON public.commission_settings(scope);
CREATE INDEX IF NOT EXISTS idx_commission_seller ON public.commission_settings(seller_id) WHERE scope = 'seller';
CREATE INDEX IF NOT EXISTS idx_commission_category ON public.commission_settings(category_id) WHERE scope = 'category';

-- Enable Row Level Security (RLS)
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflict
DROP POLICY IF EXISTS "Anyone can view commission settings" ON public.commission_settings;
DROP POLICY IF EXISTS "Admins manage commission settings" ON public.commission_settings;

-- Create view policy (Anyone can view the settings so that checkout or other services can compute fees)
CREATE POLICY "Anyone can view commission settings" ON public.commission_settings
  FOR SELECT USING (true);

-- Create manage policy (Only users with 'admin' role can create, update, or delete rules)
CREATE POLICY "Admins manage commission settings" ON public.commission_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Seed default global rate if not exists
INSERT INTO public.commission_settings (scope, rate, gateway_rate, notes)
VALUES ('global', 5.00, 2.00, 'Default global platform fee')
ON CONFLICT (scope, category_id, seller_id) DO NOTHING;
