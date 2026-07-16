-- =================================================================================
-- LOQMART COMPREHENSIVE SEED DATA
-- Run this in your Supabase SQL Editor AFTER running schema.sql
--
-- NOTE: Seller & Admin users below have fixed UUIDs in public.users.
-- For RLS to work for those accounts you must also create matching
-- auth.users entries:
--   1. Sign up via /auth with the same email.
--   2. The handle_new_user trigger will auto-create public.users.
--   3. Then run the role-upgrade block at the bottom to set role = 'admin'/'seller'.
--
-- Buyers: They self-register via /auth — NO seed buyer accounts.
-- =================================================================================

-- 1. SEED SELLERS (public.users entries for seller accounts)
--    These are placeholder rows; actual auth comes from Supabase Auth signup.
INSERT INTO users (id, email, full_name, phone, role)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'rajasthan.handicrafts@loqmart.in', 'Ramesh Kumar', '+919876500001', 'seller'),
  ('aaaaaaaa-0001-0001-0001-000000000002', 'kashmir.artisans@loqmart.in',       'Ahmad Mir',    '+919876500002', 'seller'),
  ('aaaaaaaa-0001-0001-0001-000000000003', 'tamilnadu.textiles@loqmart.in',     'Lakshmi Venkatesh', '+919876500003', 'seller'),
  ('aaaaaaaa-0001-0001-0001-000000000004', 'odisha.handicrafts@loqmart.in',     'Prafulla Das', '+919876500004', 'seller'),
  ('aaaaaaaa-0001-0001-0001-000000000005', 'kerala.spices@loqmart.in',          'Suresh Nair',  '+919876500005', 'seller'),
  ('aaaaaaaa-0001-0001-0001-000000000006', 'bihar.madhubani@loqmart.in',        'Kavita Devi',  '+919876500006', 'seller')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED SELLER PROFILES
INSERT INTO sellers (id, user_id, business_name, owner_name, description, city, state_code, pincode, gstin, pan, approval_status, swadeshi_rank, swadeshi_score)
VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001',
   'aaaaaaaa-0001-0001-0001-000000000001',
   'Rajasthan Handicrafts Co.',
   'Ramesh Kumar',
   'Family of master craftsmen from Jaipur with 40+ years heritage. Each piece individually handcrafted using traditional techniques passed down through generations. Specialists in Blue Pottery, Block Printing, and Brassware.',
   'Jaipur', 'RJ', '302001', '08ABCDE1234F1Z5', 'ABCDE1234F', 'approved', 95, 95.2),

  ('bbbbbbbb-0001-0001-0001-000000000002',
   'aaaaaaaa-0001-0001-0001-000000000002',
   'Kashmir Artisans Collective',
   'Ahmad Mir',
   'Third-generation Pashmina weavers from Srinagar. Our shawls use authentic Ladakhi Changthangi wool handspun in traditional looms. Each piece carries a GI certification.',
   'Srinagar', 'JK', '190001', '01FGHIJ5678K2Z6', 'FGHIJ5678K', 'approved', 92, 92.1),

  ('bbbbbbbb-0001-0001-0001-000000000003',
   'aaaaaaaa-0001-0001-0001-000000000003',
   'Tamil Nadu Textiles',
   'Lakshmi Venkatesh',
   'Kanchipuram silk weavers carrying a 400-year tradition. Our sarees use pure mulberry silk with zari borders. We work directly with master weavers and ensure fair wages.',
   'Kanchipuram', 'TN', '631502', '33KLMNO9012L3Z7', 'KLMNO9012L', 'approved', 88, 88.4),

  ('bbbbbbbb-0001-0001-0001-000000000004',
   'aaaaaaaa-0001-0001-0001-000000000004',
   'Odisha Handicrafts',
   'Prafulla Das',
   'Pattachitra painters and Dhokra metal casters from Raghurajpur heritage village. Each artwork is a narrative of mythology and nature, painted on canvas treated with natural chalk and gum.',
   'Bhubaneswar', 'OR', '751001', '21PQRST3456M4Z8', 'PQRST3456M', 'approved', 94, 94.7),

  ('bbbbbbbb-0001-0001-0001-000000000005',
   'aaaaaaaa-0001-0001-0001-000000000005',
   'Kerala Spice Garden',
   'Suresh Nair',
   'Certified organic spice growers from Idukki district. We grow, process, and pack single-origin spices without artificial additives. FSSAI certified, export quality.',
   'Munnar', 'KL', '685612', '32UVWXY7890N5Z9', 'UVWXY7890N', 'approved', 87, 87.3),

  ('bbbbbbbb-0001-0001-0001-000000000006',
   'aaaaaaaa-0001-0001-0001-000000000006',
   'Bihar Madhubani Arts',
   'Kavita Devi',
   'National Award winning Madhubani artists from Mithila. Our paintings use natural pigments from turmeric, sindoor, and plant extracts on handmade paper and canvas.',
   'Darbhanga', 'BR', '846001', '10ABCXY2345P6Z0', 'ABCXY2345P', 'approved', 91, 91.6)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED LOQCOIN BALANCES for sellers
INSERT INTO loqcoin_balances (user_id, balance, lifetime_earned, lifetime_redeemed)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 0, 0, 0),
  ('aaaaaaaa-0001-0001-0001-000000000002', 0, 0, 0),
  ('aaaaaaaa-0001-0001-0001-000000000003', 0, 0, 0),
  ('aaaaaaaa-0001-0001-0001-000000000004', 0, 0, 0),
  ('aaaaaaaa-0001-0001-0001-000000000005', 0, 0, 0),
  ('aaaaaaaa-0001-0001-0001-000000000006', 0, 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- 4. SEED CATEGORIES (12 handmade + 4 machine-made)
INSERT INTO categories (id, name, slug, description, image_url, icon, mode, sort_order)
VALUES
  ('cccccccc-0001-0001-0001-000000000001', 'Garments',    'garments',    'Handwoven textiles and authentic Indian apparel.',           'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=300&fit=crop', '👗', 'handmade', 1),
  ('cccccccc-0001-0001-0001-000000000002', 'Accessories', 'accessories', 'Handcrafted jewellery, bags, and traditional accessories.',  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop', '💍', 'handmade', 2),
  ('cccccccc-0001-0001-0001-000000000003', 'Beauty',      'beauty',      'Natural, ayurvedic, and organic beauty products.',          'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&h=300&fit=crop', '✨', 'handmade', 3),
  ('cccccccc-0001-0001-0001-000000000004', 'Home Linen',  'home-linen',  'Premium block-printed bedsheets and textiles.',             'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&h=300&fit=crop', '🛏', 'handmade', 4),
  ('cccccccc-0001-0001-0001-000000000005', 'Home Decor',  'home-decor',  'Artisanal pottery, brassware, and traditional decor.',      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop', '🏺', 'handmade', 5),
  ('cccccccc-0001-0001-0001-000000000006', 'Art & Craft', 'art-craft',   'Original folk paintings, Madhubani, and Warli art.',        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop', '🎨', 'handmade', 6),
  ('cccccccc-0001-0001-0001-000000000007', 'Baby',        'baby',        'Organic cotton clothing and safe wooden toys.',             'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop', '🧸', 'handmade', 7),
  ('cccccccc-0001-0001-0001-000000000008', 'Ayurvedic',   'ayurvedic',   'Traditional Indian medicine and herbal supplements.',       'https://images.unsplash.com/photo-1611072965851-e5f59a9f1b88?w=400&h=300&fit=crop', '🌿', 'handmade', 8),
  ('cccccccc-0001-0001-0001-000000000009', 'Toys',        'toys',        'Channapatna wooden toys and handmade dolls.',               'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop', '🪀', 'handmade', 9),
  ('cccccccc-0001-0001-0001-000000000010', 'Study',       'study',       'Handmade paper notebooks and traditional stationery.',      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop', '📚', 'handmade', 10),
  ('cccccccc-0001-0001-0001-000000000011', 'Food & Spices','food-spices', 'Organic spices, pickles, and artisanal Indian foods.',     'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop', '🌶️', 'handmade', 11),
  ('cccccccc-0001-0001-0001-000000000012', 'Wellness',    'wellness',    'Handmade soaps, oils, and wellness products.',              'https://images.unsplash.com/photo-1540558932700-8ae91ead3c4f?w=400&h=300&fit=crop', '🧘', 'handmade', 12),
  ('cccccccc-0001-0001-0001-000000000013', 'Sports',      'sports',      'Locally manufactured sports equipment (Jalandhar/Meerut).', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop', '🏏', 'machine_made', 13),
  ('cccccccc-0001-0001-0001-000000000014', 'Electronics', 'electronics', 'Consumer electronics assembled and made in India.',         'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop', '💡', 'machine_made', 14),
  ('cccccccc-0001-0001-0001-000000000015', 'Kitchenware', 'kitchenware', 'Indian-made stainless steel and copper utensils.',          'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&h=300&fit=crop', '🍳', 'machine_made', 15),
  ('cccccccc-0001-0001-0001-000000000016', 'Furniture',   'furniture',   'Solid wood and engineered furniture made in India.',        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop', '🪑', 'machine_made', 16)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED PRODUCTS (rich catalogue across sellers and categories)
INSERT INTO products (id, seller_id, category_id, name, slug, description, price, mrp, stock, unit, images, mode, state_code, approval_status, tags, rating, review_count, sold_count, is_featured)
VALUES
  -- Rajasthan Handicrafts
  ('dddddddd-0001-0001-0001-000000000001',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'cccccccc-0001-0001-0001-000000000005',
   'Blue Pottery Vase – Hand-Painted Floral',
   'blue-pottery-vase-floral',
   'Classic blue pottery from Jaipur made using the traditional quartz-based technique (no clay). Each vase is individually wheel-thrown and painted by master potters. GI-tagged craft.',
   2499, 3299, 14, 'piece',
   ARRAY['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=700&fit=crop'],
   'handmade', 'RJ', 'approved',
   ARRAY['pottery','blue','jaipur','gi-tagged','home-decor'], 4.7, 112, 203, true),

  ('dddddddd-0001-0001-0001-000000000002',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'cccccccc-0001-0001-0001-000000000001',
   'Dabu Mud-Resist Block Printed Saree',
   'dabu-block-print-saree',
   'Traditional block printed saree using natural indigo dyes and Dabu mud-resist technique from Akola village. The print is stamped by hand using carved wooden blocks on fine cotton.',
   1899, 2499, 9, 'piece',
   ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=700&fit=crop'],
   'handmade', 'RJ', 'approved',
   ARRAY['saree','block-print','cotton','natural-dye'], 4.8, 167, 312, true),

  ('dddddddd-0001-0001-0001-000000000003',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'cccccccc-0001-0001-0001-000000000005',
   'Brass Diya Set – Temple Collection',
   'brass-diya-temple-set',
   'Premium brass diyas handcrafted by hereditary brass workers in Moradabad. Lacquer-finished to prevent tarnishing. Set of 5 in graduated sizes with peacock engravings.',
   1199, 1599, 28, 'set',
   ARRAY['https://images.unsplash.com/photo-1617627143233-46296d4d24f0?w=600&h=700&fit=crop'],
   'handmade', 'UP', 'approved',
   ARRAY['brass','diya','festival','moradabad'], 4.9, 234, 561, true),

  ('dddddddd-0001-0001-0001-000000000004',
   'bbbbbbbb-0001-0001-0001-000000000001',
   'cccccccc-0001-0001-0001-000000000002',
   'Handstitched Mojari Juttis – Rajasthani',
   'mojari-juttis-rajasthani',
   'Authentic handstitched leather footwear from Punjab and Rajasthan. Upper made from genuine buffalo leather, embroidered with zari thread. Each pair takes 2 days to complete.',
   1499, 1999, 22, 'pair',
   ARRAY['https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=600&h=700&fit=crop'],
   'handmade', 'RJ', 'approved',
   ARRAY['leather','footwear','mojari','embroidered'], 4.5, 78, 134, false),

  -- Kashmir Artisans
  ('dddddddd-0001-0001-0001-000000000005',
   'bbbbbbbb-0001-0001-0001-000000000002',
   'cccccccc-0001-0001-0001-000000000001',
   'Pure Pashmina Shawl – Sozni Embroidery',
   'pashmina-shawl-sozni',
   'Authentic 100% Pashmina from Ladakhi Changthangi goats, handwoven in Srinagar. Features traditional Sozni needle embroidery taking 3–6 months to complete. GI certified.',
   8999, 13999, 6, 'piece',
   ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=700&fit=crop'],
   'handmade', 'JK', 'approved',
   ARRAY['pashmina','kashmir','gi-certified','luxury','shawl'], 5.0, 45, 67, true),

  ('dddddddd-0001-0001-0001-000000000006',
   'bbbbbbbb-0001-0001-0001-000000000002',
   'cccccccc-0001-0001-0001-000000000002',
   'Kashmiri Paper Mache Box – Floral',
   'kashmiri-paper-mache-box',
   'Handcrafted paper mache jewellery box from Srinagar. Each box is layered from paper pulp, shaped, sun-dried, and painted with 24 coats of lacquer and intricate floral motifs.',
   1799, 2499, 18, 'piece',
   ARRAY['https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600&h=700&fit=crop'],
   'handmade', 'JK', 'approved',
   ARRAY['paper-mache','kashmir','lacquer','jewellery-box'], 4.6, 56, 89, false),

  -- Tamil Nadu Textiles
  ('dddddddd-0001-0001-0001-000000000007',
   'bbbbbbbb-0001-0001-0001-000000000003',
   'cccccccc-0001-0001-0001-000000000001',
   'Kanchipuram Pure Silk Saree – Gold Zari',
   'kanchipuram-silk-saree-gold-zari',
   'Authentic Kanchipuram silk saree with pure zari (real gold thread) border and pallu. Made on traditional pit-looms by master weavers. Silk Mark India certified.',
   14999, 19999, 5, 'piece',
   ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=700&fit=crop'],
   'handmade', 'TN', 'approved',
   ARRAY['silk','kanchipuram','saree','gold-zari','silk-mark'], 4.9, 89, 112, true),

  ('dddddddd-0001-0001-0001-000000000008',
   'bbbbbbbb-0001-0001-0001-000000000003',
   'cccccccc-0001-0001-0001-000000000004',
   'Chettinad Cotton Bedsheet – Woven Checks',
   'chettinad-cotton-bedsheet',
   'Traditional handwoven Chettinad cotton bedsheet in iconic colour-block woven checks. Made on pit looms in Karaikudi. 100% cotton, pre-washed for softness. King size.',
   2299, 2999, 34, 'piece',
   ARRAY['https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&h=700&fit=crop'],
   'handmade', 'TN', 'approved',
   ARRAY['cotton','bedsheet','chettinad','handwoven'], 4.7, 143, 278, false),

  -- Odisha Handicrafts
  ('dddddddd-0001-0001-0001-000000000009',
   'bbbbbbbb-0001-0001-0001-000000000004',
   'cccccccc-0001-0001-0001-000000000006',
   'Pattachitra Painting – Gita Govinda',
   'pattachitra-gita-govinda',
   'Original Pattachitra painting on cloth canvas from Raghurajpur heritage village. Depicts scenes from Gita Govinda using natural pigments: lamp black, conch shell white, turmeric yellow. Signed by master artist.',
   4999, 7499, 3, 'piece',
   ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop'],
   'handmade', 'OR', 'approved',
   ARRAY['pattachitra','odisha','folk-art','natural-pigments','collectible'], 5.0, 23, 31, true),

  ('dddddddd-0001-0001-0001-000000000010',
   'bbbbbbbb-0001-0001-0001-000000000004',
   'cccccccc-0001-0001-0001-000000000005',
   'Dhokra Tribal Elephant – Lost Wax Cast',
   'dhokra-tribal-elephant',
   'Solid Dhokra metal elephant cast using the 4000-year-old lost-wax (cire perdue) technique by tribal artisans. Non-ferrous alloy with bronze-like finish. Each piece unique.',
   3299, 4499, 11, 'piece',
   ARRAY['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=700&fit=crop'],
   'handmade', 'OR', 'approved',
   ARRAY['dhokra','metal-craft','tribal','lost-wax'], 4.8, 67, 98, false),

  -- Kerala Spice Garden
  ('dddddddd-0001-0001-0001-000000000011',
   'bbbbbbbb-0001-0001-0001-000000000005',
   'cccccccc-0001-0001-0001-000000000011',
   'Idukki Black Pepper – Single Origin',
   'idukki-black-pepper-single-origin',
   'Bold, aromatic black pepper from high-altitude Idukki farms. Hand-harvested at peak ripeness, sun-dried for 7 days. FSSAI certified. No blending, no artificial processing. 250g.',
   549, 699, 87, '250g',
   ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=700&fit=crop'],
   'handmade', 'KL', 'approved',
   ARRAY['spice','pepper','organic','idukki','single-origin'], 4.9, 312, 745, true),

  ('dddddddd-0001-0001-0001-000000000012',
   'bbbbbbbb-0001-0001-0001-000000000005',
   'cccccccc-0001-0001-0001-000000000011',
   'Kerala Masala Gift Box – 8 Spice Set',
   'kerala-masala-gift-box',
   'Curated box of 8 premium Kerala spices: Malabar pepper, Cardamom, Cloves, Cinnamon, Turmeric, Coriander, Dry Ginger, Nutmeg. Organic-certified, perfect for gifting.',
   1299, 1699, 45, 'box',
   ARRAY['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=700&fit=crop'],
   'handmade', 'KL', 'approved',
   ARRAY['spice','gift','kerala','organic','masala'], 4.8, 189, 423, true),

  -- Bihar Madhubani Arts
  ('dddddddd-0001-0001-0001-000000000013',
   'bbbbbbbb-0001-0001-0001-000000000006',
   'cccccccc-0001-0001-0001-000000000006',
   'Madhubani Painting – Tree of Life',
   'madhubani-tree-of-life',
   'Original Madhubani painting on handmade Mithila paper using natural colours made from flowers, leaves, and minerals. UNESCO recognised tradition. Signed by National Award winner Kavita Devi.',
   3499, 4999, 4, 'piece',
   ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop'],
   'handmade', 'BR', 'approved',
   ARRAY['madhubani','folk-art','bihar','mithila','natural-colours'], 5.0, 34, 42, true),

  ('dddddddd-0001-0001-0001-000000000014',
   'bbbbbbbb-0001-0001-0001-000000000006',
   'cccccccc-0001-0001-0001-000000000010',
   'Mithila Handmade Paper Notebook – A5',
   'mithila-handmade-paper-notebook',
   'A5 notebook made from recycled paper pulp processed using traditional Mithila papermaking. Cover features printed Madhubani motifs. 120 pages, acid-free, suitable for sketching and journaling.',
   399, 549, 156, 'piece',
   ARRAY['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=700&fit=crop'],
   'handmade', 'BR', 'approved',
   ARRAY['notebook','handmade-paper','stationery','mithila'], 4.6, 98, 267, false)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED BLOG POSTS (editorial content managed from admin)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  state TEXT,
  state_code TEXT,
  category TEXT NOT NULL,
  read_time TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO blog_posts (slug, title, excerpt, image_url, state, state_code, category, read_time, author, is_published, view_count)
VALUES
  ('craft-of-banarasi-silk',
   'The 500-Year Legacy of Banarasi Silk Weaving',
   'In the narrow lanes of Varanasi, master weavers carry forward a tradition older than the Mughal Empire. Meet the families who have kept this art alive for 22 generations.',
   'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=500&fit=crop',
   'Uttar Pradesh', 'UP', 'Crafts', '8 min read', 'Meera Iyer', true, 3241),

  ('blue-pottery-jaipur',
   'Blue Pottery: How Jaipur''s Persian Secret Became a GI Tag',
   'Brought by Mughal artisans, refined by Rajput kings, and now protected by a Geographical Indication tag — the extraordinary journey of Jaipur Blue Pottery.',
   'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=500&fit=crop',
   'Rajasthan', 'RJ', 'Heritage', '6 min read', 'Arjun Sharma', true, 2187),

  ('phulkari-embroidery-punjab',
   'Phulkari: Punjab''s Garden of Thread',
   'Every Phulkari dupatta tells the story of the woman who made it — from wedding dowries to harvest celebrations. How this endangered art is finding new life among urban designers.',
   'https://images.unsplash.com/photo-1617627143233-46296d4d24f0?w=800&h=500&fit=crop',
   'Punjab', 'PB', 'Textiles', '5 min read', 'Simranpreet Kaur', true, 1654),

  ('madhubani-paintings-bihar',
   'Madhubani: When Bihar''s Walls Became UNESCO Heritage',
   'Born from a 1934 earthquake relief effort, Madhubani art went from village walls to international galleries. The women of Mithila who painted their way to independence.',
   'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=500&fit=crop',
   'Bihar', 'BR', 'Art', '7 min read', 'Priya Devi', true, 2893),

  ('pashmina-truth',
   'The Real Story of Pashmina: From Ladakh Goat to Your Wardrobe',
   'Only 150g of fibre from a single Changthangi goat. Months of hand-spinning and weaving. A GI tag under siege from machine-made fakes. How to know if your Pashmina is real.',
   'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=500&fit=crop',
   'Jammu & Kashmir', 'JK', 'Textiles', '10 min read', 'Tanvir Ahmad', true, 4512),

  ('kerala-spice-trade',
   'Kerala''s Spice Coast: The Route That Changed the World',
   'The same pepper that drew Vasco da Gama to India now grows on certified organic farms in Idukki. How Kerala spice farmers are reclaiming their story and their profits.',
   'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=500&fit=crop',
   'Kerala', 'KL', 'Food', '6 min read', 'Ananya Krishnan', true, 1987),

  ('dhokra-tribal-art',
   'Dhokra: 4000 Years of Lost-Wax Metal Casting',
   'The Dhokra Damar tribes of Odisha and West Bengal have practised lost-wax casting since the Indus Valley Civilisation. Meet the last families keeping this ancient technology alive.',
   'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=500&fit=crop',
   'Odisha', 'OR', 'Crafts', '9 min read', 'Subhash Pattnaik', true, 1342),

  ('channapatna-wooden-toys',
   'Channapatna: Why Karnataka''s Toy Town Was Called the Toy City of India',
   'Tipu Sultan brought Persian craftsmen. Their lacquered wooden toys have delighted children for 200 years. Today, the town battles plastic imports — and is winning.',
   'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=500&fit=crop',
   'Karnataka', 'KA', 'Crafts', '7 min read', 'Ravi Kumar', true, 876)
ON CONFLICT (slug) DO NOTHING;

-- 7. SEED COUPONS (editable from admin dashboard)
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, valid_from, valid_until, is_active)
VALUES
  ('WELCOME15', 'Welcome discount for first-time buyers', 'percentage', 15, 500, 300, 1000,
   NOW(), NOW() + INTERVAL '1 year', true),
  ('HANDMADE10', '10% off all handmade products', 'percentage', 10, 300, 200, NULL,
   NOW(), NOW() + INTERVAL '6 months', true),
  ('FLAT200',   'Flat ₹200 off on orders above ₹1500', 'fixed', 200, 1500, 200, 500,
   NOW(), NOW() + INTERVAL '3 months', true),
  ('ARTISAN20', '20% off for Heritage Craft category', 'percentage', 20, 1000, 500, 200,
   NOW(), NOW() + INTERVAL '2 months', true),
  ('DIWALI25',  'Diwali special – 25% off site-wide', 'percentage', 25, 999, 750, 2000,
   NOW(), NOW() + INTERVAL '30 days', false)
ON CONFLICT (code) DO NOTHING;

-- =============================================================
-- ROLE UPGRADE (run AFTER signing up admin via /auth)
-- Replace <your-admin-uuid> with your actual Supabase auth UID.
-- =============================================================
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
-- =============================================================
