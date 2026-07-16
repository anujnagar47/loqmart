-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Seeds / updates category images and demo product images
-- Safe to run multiple times (uses ON CONFLICT DO UPDATE)
-- ============================================================

-- 1. UPDATE CATEGORY IMAGES
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=400&fit=crop' WHERE slug = 'garments';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=400&fit=crop' WHERE slug = 'accessories';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&h=400&fit=crop' WHERE slug = 'beauty';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&h=400&fit=crop' WHERE slug = 'home-linen';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop' WHERE slug = 'home-decor';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop' WHERE slug = 'art-craft';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop' WHERE slug = 'baby';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1611072965851-e5f59a9f1b88?w=600&h=400&fit=crop' WHERE slug = 'ayurvedic';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=400&fit=crop' WHERE slug = 'toys';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop' WHERE slug = 'study';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=400&fit=crop' WHERE slug = 'food-spices';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1540558932700-8ae91ead3c4f?w=600&h=400&fit=crop' WHERE slug = 'wellness';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop' WHERE slug = 'sports';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop' WHERE slug = 'electronics';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=400&fit=crop' WHERE slug = 'kitchenware';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop' WHERE slug = 'furniture';

-- 2. If categories don't exist yet, insert them all
INSERT INTO categories (id, name, slug, description, image_url, icon, mode, sort_order) VALUES
  ('cccccccc-0001-0001-0001-000000000001', 'Garments',     'garments',     'Handwoven textiles and authentic Indian apparel.',           'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=400&fit=crop', '👗', 'handmade',    1),
  ('cccccccc-0001-0001-0001-000000000002', 'Accessories',  'accessories',  'Handcrafted jewellery, bags, and traditional accessories.',  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=400&fit=crop', '💍', 'handmade',    2),
  ('cccccccc-0001-0001-0001-000000000003', 'Beauty',       'beauty',       'Natural, ayurvedic, and organic beauty products.',          'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&h=400&fit=crop', '✨', 'handmade',    3),
  ('cccccccc-0001-0001-0001-000000000004', 'Home Linen',   'home-linen',   'Premium block-printed bedsheets and textiles.',             'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&h=400&fit=crop', '🛏', 'handmade',    4),
  ('cccccccc-0001-0001-0001-000000000005', 'Home Decor',   'home-decor',   'Artisanal pottery, brassware, and traditional decor.',      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop', '🏺', 'handmade',    5),
  ('cccccccc-0001-0001-0001-000000000006', 'Art & Craft',  'art-craft',    'Original folk paintings, Madhubani, and Warli art.',        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop', '🎨', 'handmade',    6),
  ('cccccccc-0001-0001-0001-000000000007', 'Baby',         'baby',         'Organic cotton clothing and safe wooden toys.',             'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop', '🧸', 'handmade',    7),
  ('cccccccc-0001-0001-0001-000000000008', 'Ayurvedic',    'ayurvedic',    'Traditional Indian medicine and herbal supplements.',       'https://images.unsplash.com/photo-1611072965851-e5f59a9f1b88?w=600&h=400&fit=crop', '🌿', 'handmade',    8),
  ('cccccccc-0001-0001-0001-000000000009', 'Toys',         'toys',         'Channapatna wooden toys and handmade dolls.',               'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=400&fit=crop', '🪀', 'handmade',    9),
  ('cccccccc-0001-0001-0001-000000000010', 'Study',        'study',        'Handmade paper notebooks and traditional stationery.',      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop', '📚', 'handmade',   10),
  ('cccccccc-0001-0001-0001-000000000011', 'Food & Spices','food-spices',  'Organic spices, pickles, and artisanal Indian foods.',      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=400&fit=crop', '🌶️','handmade',   11),
  ('cccccccc-0001-0001-0001-000000000012', 'Wellness',     'wellness',     'Handmade soaps, oils, and wellness products.',              'https://images.unsplash.com/photo-1540558932700-8ae91ead3c4f?w=600&h=400&fit=crop', '🧘', 'handmade',   12),
  ('cccccccc-0001-0001-0001-000000000013', 'Sports',       'sports',       'Locally manufactured sports equipment.',                   'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop', '🏏', 'machine_made',13),
  ('cccccccc-0001-0001-0001-000000000014', 'Electronics',  'electronics',  'Consumer electronics assembled and made in India.',         'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop', '💡', 'machine_made',14),
  ('cccccccc-0001-0001-0001-000000000015', 'Kitchenware',  'kitchenware',  'Indian-made stainless steel and copper utensils.',          'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=400&fit=crop', '🍳', 'machine_made',15),
  ('cccccccc-0001-0001-0001-000000000016', 'Furniture',    'furniture',    'Solid wood furniture made in India.',                       'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop', '🪑', 'machine_made',16)
ON CONFLICT (id) DO UPDATE SET
  image_url  = EXCLUDED.image_url,
  name       = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- 3. UPDATE products that have no images (empty array or null)
-- Adds a relevant placeholder based on category
UPDATE products p
SET images = ARRAY[
  CASE c.slug
    WHEN 'garments'    THEN 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=700&fit=crop'
    WHEN 'accessories' THEN 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=700&fit=crop'
    WHEN 'beauty'      THEN 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&h=700&fit=crop'
    WHEN 'home-linen'  THEN 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&h=700&fit=crop'
    WHEN 'home-decor'  THEN 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=700&fit=crop'
    WHEN 'art-craft'   THEN 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop'
    WHEN 'food-spices' THEN 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=700&fit=crop'
    WHEN 'ayurvedic'   THEN 'https://images.unsplash.com/photo-1611072965851-e5f59a9f1b88?w=600&h=700&fit=crop'
    WHEN 'wellness'    THEN 'https://images.unsplash.com/photo-1540558932700-8ae91ead3c4f?w=600&h=700&fit=crop'
    WHEN 'toys'        THEN 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=700&fit=crop'
    WHEN 'baby'        THEN 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=700&fit=crop'
    WHEN 'kitchenware' THEN 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=700&fit=crop'
    WHEN 'electronics' THEN 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=700&fit=crop'
    WHEN 'sports'      THEN 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=700&fit=crop'
    WHEN 'furniture'   THEN 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=700&fit=crop'
    ELSE                    'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=600&h=700&fit=crop'
  END
]
FROM categories c
WHERE p.category_id = c.id
  AND (p.images IS NULL OR array_length(p.images, 1) IS NULL OR array_length(p.images, 1) = 0);

-- Done. Categories now have images. Products without images got category-appropriate placeholders.
SELECT 'Categories with images: ' || count(*)::text FROM categories WHERE image_url IS NOT NULL;
SELECT 'Products with images: '   || count(*)::text FROM products  WHERE array_length(images, 1) > 0;
