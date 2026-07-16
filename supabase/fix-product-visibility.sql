-- ================================================================
-- FIX: Full user visibility — products, orders, addresses, coins, notifications
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
-- ================================================================

-- ── PRODUCTS ──────────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.products TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view approved products" ON public.products;
CREATE POLICY "Anyone can view approved products"
  ON public.products FOR SELECT USING (approval_status = 'approved');

-- ── SELLERS ───────────────────────────────────────────────────────
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.sellers TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view approved sellers" ON public.sellers;
CREATE POLICY "Anyone can view approved sellers"
  ON public.sellers FOR SELECT USING (approval_status = 'approved');

-- ── CATEGORIES ────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.categories TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT USING (is_active = true);

-- ── REVIEWS ───────────────────────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated users can submit reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── BLOG POSTS ────────────────────────────────────────────────────
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.blog_posts TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT USING (is_published = true);

-- ── ORDERS (user sees own orders) ─────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.orders TO authenticated;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── ORDER ITEMS ───────────────────────────────────────────────────
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.order_items TO authenticated;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );

-- ── ADDRESSES ─────────────────────────────────────────────────────
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- ── LOQCOIN BALANCES ──────────────────────────────────────────────
ALTER TABLE public.loqcoin_balances ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.loqcoin_balances TO authenticated;

DROP POLICY IF EXISTS "Users can view own coin balance" ON public.loqcoin_balances;
CREATE POLICY "Users can view own coin balance"
  ON public.loqcoin_balances FOR SELECT USING (auth.uid() = user_id);

-- ── LOQCOIN LEDGER ────────────────────────────────────────────────
ALTER TABLE public.loqcoin_ledger ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.loqcoin_ledger TO authenticated;

DROP POLICY IF EXISTS "Users can view own coin ledger" ON public.loqcoin_ledger;
CREATE POLICY "Users can view own coin ledger"
  ON public.loqcoin_ledger FOR SELECT USING (auth.uid() = user_id);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark notifications read" ON public.notifications;
CREATE POLICY "Users can mark notifications read"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── USERS (own profile) ───────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.users TO authenticated;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- ── MESSAGES (chat) ───────────────────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.messages TO authenticated;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- ── WISHLIST (if table exists) ────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wishlists') THEN
    EXECUTE 'ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists';
    EXECUTE 'CREATE POLICY "Users can manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ── VERIFY ────────────────────────────────────────────────────────
SELECT
  schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products','orders','order_items','addresses','users','notifications','loqcoin_balances')
ORDER BY tablename, policyname;
