-- ================================================================
-- FIX: Infinite RLS recursion on users table
-- Run this in Supabase SQL Editor FIRST before anything else
--
-- Root cause: users table policies did EXISTS(SELECT FROM users)
-- which caused infinite recursion when any other table's admin
-- policy tried to check if the current user is an admin.
-- ================================================================

-- 1. Create a SECURITY DEFINER function to check admin/sub-admin status.
--    SECURITY DEFINER bypasses RLS so it won't recurse.
CREATE OR REPLACE FUNCTION public.is_admin_or_subadmin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'sub_admin')
  );
$$;

-- 2. Drop the self-referential users table policies and replace with fixed versions.
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin_or_subadmin()
  );

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (public.is_admin_or_subadmin() AND role != 'admin');

-- 3. Also allow users to read their own record (needed for account page).
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 4. Optional: update other tables' admin policies to use the function too.
--    (Not strictly required after fixing users table, but improves clarity)

DROP POLICY IF EXISTS "Admins can manage all sellers" ON public.sellers;
CREATE POLICY "Admins can manage all sellers" ON public.sellers
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins can manage all products v2" ON public.products;
CREATE POLICY "Admins can manage all products v2" ON public.products
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage all blog posts" ON public.blog_posts
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins manage all returns" ON public.return_requests;
CREATE POLICY "Admins manage all returns" ON public.return_requests
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins manage all penalties" ON public.penalties;
CREATE POLICY "Admins manage all penalties" ON public.penalties
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins manage all settlements" ON public.settlements;
CREATE POLICY "Admins manage all settlements" ON public.settlements
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Admins manage commission settings" ON public.commission_settings;
CREATE POLICY "Admins manage commission settings" ON public.commission_settings
  FOR ALL USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "Only admins can read admin logs" ON public.admin_logs;
CREATE POLICY "Only admins can read admin logs" ON public.admin_logs
  FOR SELECT USING (public.is_admin_or_subadmin());

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_admin_or_subadmin()
  );
