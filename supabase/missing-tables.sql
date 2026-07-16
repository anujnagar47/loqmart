-- ================================================================
-- LoqMart Missing Tables & Schema Extensions
-- Run in Supabase SQL Editor after schema.sql + admin-additions.sql
-- ================================================================

-- 1. Commission Settings (configurable platform fees)
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope VARCHAR(20) NOT NULL DEFAULT 'global',   -- 'global' | 'category' | 'seller'
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,        -- percentage
  gateway_rate DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  changed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (scope, category_id, seller_id)
);

-- Seed global default if not exists
INSERT INTO public.commission_settings (scope, rate, gateway_rate, notes)
VALUES ('global', 5.00, 2.00, 'Default global platform fee')
ON CONFLICT DO NOTHING;

-- Per-category defaults (matching README)
-- Garments: 5%, Art & Craft: 3%, Electronics: 7%, Baby: 5%, Ayurvedic: 5%
-- Will be inserted via admin panel

-- 2. Settlements table
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  period_start DATE,
  period_end DATE,
  gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  gateway_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  penalty_deduction DECIMAL(10,2) DEFAULT 0,
  net_payable DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',  -- pending | processing | paid | held | disputed
  hold_reason TEXT,
  bank_reference VARCHAR(100),
  paid_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_seller_id ON public.settlements(seller_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_created ON public.settlements(created_at DESC);

-- 3. Return Requests
CREATE TABLE IF NOT EXISTS public.return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id),
  order_item_id UUID REFERENCES public.order_items(id),
  buyer_id UUID REFERENCES public.users(id),
  seller_id UUID REFERENCES public.sellers(id),
  reason VARCHAR(50) NOT NULL,   -- damaged | wrong_product | not_as_described
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending',  -- pending | seller_accepted | seller_disputed | admin_review | resolved_buyer | resolved_seller | closed
  resolution_notes TEXT,
  refund_amount DECIMAL(10,2),
  refund_processed BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES public.users(id),  -- sub-admin assigned
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_seller_id ON public.return_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.return_requests(status);
CREATE INDEX IF NOT EXISTS idx_returns_created ON public.return_requests(created_at DESC);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own return requests" ON public.return_requests
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view returns for their orders" ON public.return_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = return_requests.seller_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all returns" ON public.return_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- 4. Penalties
CREATE TABLE IF NOT EXISTS public.penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- wrong_product | non_fulfillment | fake_review | gstin_expired | counterfeit | custom
  reason TEXT NOT NULL,
  amount_held DECIMAL(10,2) DEFAULT 0,
  trust_score_impact INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',  -- active | resolved | appealed | waived
  issued_by UUID REFERENCES public.users(id),
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  related_order_id UUID REFERENCES public.orders(id),
  related_return_id UUID REFERENCES public.return_requests(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penalties_seller_id ON public.penalties(seller_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON public.penalties(status);
CREATE INDEX IF NOT EXISTS idx_penalties_created ON public.penalties(created_at DESC);

ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own penalties" ON public.penalties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = penalties.seller_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all penalties" ON public.penalties
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- 5. Admin Logs (full audit trail)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.users(id),
  action VARCHAR(100) NOT NULL,      -- e.g. 'seller.approve', 'product.reject', 'user.delete'
  target_type VARCHAR(50),           -- 'seller' | 'product' | 'order' | 'user' | 'penalty' etc.
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read admin logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- 6. Seller Documents
CREATE TABLE IF NOT EXISTS public.seller_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  doc_type VARCHAR(50) NOT NULL,  -- gstin_cert | address_proof | owner_id | bank_proof | made_in_india_declaration | fssai
  file_url TEXT NOT NULL,
  file_name TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected | expired
  expiry_date DATE,
  renewal_requested_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seller_docs_seller_id ON public.seller_documents(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_docs_status ON public.seller_documents(status);
CREATE INDEX IF NOT EXISTS idx_seller_docs_expiry ON public.seller_documents(expiry_date);

ALTER TABLE public.seller_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own documents" ON public.seller_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_documents.seller_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all documents" ON public.seller_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- 7. Abuse flags on reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES public.users(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- 8. Commission Settings RLS
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commission settings" ON public.commission_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Anyone can view commission settings" ON public.commission_settings
  FOR SELECT USING (true);

-- 9. Settlements RLS
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own settlements" ON public.settlements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = settlements.seller_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all settlements" ON public.settlements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- 10. Add trust_score and last_rank_calculated to sellers
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS last_rank_calculated TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS return_ratio DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS document_status VARCHAR(20) DEFAULT 'pending';

-- 11. Add rejection_reason to orders (for force-cancelled orders)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.users(id);

-- 12. Useful views for admin
CREATE OR REPLACE VIEW public.admin_seller_overview AS
SELECT
  s.id,
  s.business_name,
  s.owner_name,
  s.state,
  s.state_code,
  s.gstin,
  s.approval_status,
  s.swadeshi_rank,
  s.swadeshi_score,
  s.total_orders,
  s.total_earnings,
  s.is_suspended,
  s.document_status,
  s.created_at,
  u.email AS owner_email,
  (SELECT COUNT(*) FROM public.products p WHERE p.seller_id = s.id AND p.approval_status = 'approved') AS active_products,
  (SELECT COUNT(*) FROM public.penalties pen WHERE pen.seller_id = s.id AND pen.status = 'active') AS active_penalties,
  (SELECT COUNT(*) FROM public.return_requests rr WHERE rr.seller_id = s.id AND rr.status IN ('pending','seller_disputed')) AS open_returns
FROM public.sellers s
JOIN public.users u ON u.id = s.user_id;
