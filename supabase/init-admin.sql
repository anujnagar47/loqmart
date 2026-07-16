-- LoqMart Admin Initialization SQL
-- Run this in Supabase SQL Editor to create admin user

-- 1. Insert admin user record
INSERT INTO users (id, email, full_name, role, email_verified, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin@loqmart.com',
  'Admin',
  'admin',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@loqmart.com')
RETURNING id as admin_id;

-- Note: Admin login credentials must be set in Supabase Auth:
-- Email: admin@loqmart.com
-- Password: loqmart123

-- The admin role gives full access to:
-- - Approve/reject sellers
-- - Approve/reject products
-- - View all orders and analytics
-- - Manage users

-- After running this SQL, go to:
-- Supabase Dashboard > Authentication > Users > Invite user
-- Or use Admin API to create the auth user with password