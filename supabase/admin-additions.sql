-- =========================================================
-- LoqMart Admin Additions SQL
-- Run this in Supabase SQL Editor (safe to run multiple times)
-- =========================================================

-- 1. Add state_scope column to users (for state-wise sub-admins)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state_scope VARCHAR(5);

-- 2. Make categories.mode nullable so admin can create general categories
ALTER TABLE public.categories ALTER COLUMN mode DROP NOT NULL;

-- 3. Add is_suspended flag to users (for account management)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- 4. Add gst_number column alias (the schema uses 'gstin', add gst_number as computed alias)
--    Actually just ensure the column exists under both names via a view or just use gstin in code.
--    (Code has been updated to use 'gstin' - no DB change needed)

-- =========================================================
-- ADMIN RLS POLICIES (service role bypasses these, but add for completeness)
-- =========================================================

-- Allow admins to read ALL users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- Allow admins to update all users
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Allow admins to delete non-admin users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    AND role != 'admin'
  );

-- Allow admins to read ALL sellers
DROP POLICY IF EXISTS "Admins can view all sellers" ON public.sellers;
CREATE POLICY "Admins can view all sellers" ON public.sellers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- Allow admins to update sellers (approve/reject/rank)
DROP POLICY IF EXISTS "Admins can manage all sellers" ON public.sellers;
CREATE POLICY "Admins can manage all sellers" ON public.sellers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- Sellers can view their own profile
DROP POLICY IF EXISTS "Sellers can view own profile" ON public.sellers;
CREATE POLICY "Sellers can view own profile" ON public.sellers
  FOR SELECT USING (user_id = auth.uid());

-- Allow admins to manage orders
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- Allow admins to manage products
DROP POLICY IF EXISTS "Admins can manage all products v2" ON public.products;
CREATE POLICY "Admins can manage all products v2" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- Allow admins to manage categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- Allow admins to manage coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Allow admins to manage notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- =========================================================
-- EXTEND user_role ENUM to include sub_admin
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction/DO block in PostgreSQL.
-- This statement must be run standalone (which Supabase SQL Editor does by default).
-- =========================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sub_admin';

-- =========================================================
-- BLOG POSTS: ensure table exists with correct columns
-- =========================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  state TEXT,
  state_code TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  read_time TEXT NOT NULL DEFAULT '5 min',
  author TEXT NOT NULL DEFAULT 'LoqMart Editorial',
  content TEXT,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug        ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published   ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_state_code  ON public.blog_posts(state_code);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage all blog posts" ON public.blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','sub_admin'))
  );

-- =========================================================
-- SELLER PAYOUTS table (for Finance section)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.seller_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.sellers(id),
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage payouts" ON public.seller_payouts;
CREATE POLICY "Admins can manage payouts" ON public.seller_payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS "Sellers can view own payouts" ON public.seller_payouts;
CREATE POLICY "Sellers can view own payouts" ON public.seller_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_payouts.seller_id AND s.user_id = auth.uid())
  );

-- =========================================================
-- INDEXES for admin queries
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_users_role       ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email      ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_sellers_status   ON public.sellers(approval_status);
CREATE INDEX IF NOT EXISTS idx_sellers_state    ON public.sellers(state);
CREATE INDEX IF NOT EXISTS idx_products_status  ON public.products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_orders_status    ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment   ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON public.orders(created_at DESC);
