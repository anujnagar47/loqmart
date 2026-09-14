-- ================================================================
-- LoqMart: Phase 6 blog content backfill
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/azwrehborbnfkigsappg/sql
--
-- Context: src/app/blog/[slug]/page.tsx used to be entirely hardcoded
-- to two static articles, completely disconnected from the blog_posts
-- table your admin panel manages — any post created/edited via
-- /admin/blog was invisible on the actual public page. That page now
-- reads from blog_posts for real, but seed.sql's INSERT never
-- populated the `content` column (only title/excerpt/etc.), so every
-- seeded post currently has NULL body text. This backfills the two
-- posts that had full article bodies in the old hardcoded file, so
-- that content isn't lost. Every other seeded post will show its
-- excerpt only until an admin fills in `content` via /admin/blog.
--
-- Safe to re-run — it only ever sets `content`, and only for these two
-- slugs.
-- ================================================================

UPDATE public.blog_posts SET content =
'In the narrow lanes of Varanasi, time moves differently. The morning mist still carries the sound of wooden pit looms - rhythmic, ancient, unchanged for half a millennium. Ustad Hamid Ansari, 68, has been weaving since he was seven years old. His father taught him, as his grandfather taught his father.

The Banarasi silk saree is not merely clothing. It is a text - a conversation between designer, weaver, and silk - that takes anywhere from 15 days to six months to complete. The most elaborate sarees, featuring pure gold zari, take a family of four weavers working eight hours a day for six months to finish a single piece.

The zari work that defines Banarasi silk originally came from Persia, brought to India by artisans in the court of Akbar. Over centuries, Varanasi''s weavers absorbed the Persian floral motifs - the buta, the jaal, the meenakari - and transformed them into something distinctly Indian. Today, a GI (Geographical Indication) tag protects the name ''Banarasi silk'', ensuring that only sarees woven in the Varanasi district can legally carry the name.

The biggest threat to Banarasi silk is not time or taste - it is power loom imitations. Machine-made sarees that mimic the look of handwoven Banarasi at 10% of the price flood markets from Surat to Mumbai. For buyers who cannot tell the difference by touch, price becomes the deciding factor.

LoqMart''s verification process requires every Banarasi seller to submit their GSTIN, loom registration certificate, and pass a physical product audit. The Swadeshi Rank system further rewards sellers with high review scores, on-time delivery, and documented years in business. It is not a perfect system, but it is a beginning.

Ustad Ansari''s youngest son, Arshad, has started selling on LoqMart. Last month, he received an order from a customer in Bangalore who had discovered Banarasi silk through the state feed. ''When someone chooses to pay the real price for the real thing,'' Arshad says, ''it means they understand what they are buying. That understanding is everything.'''
WHERE slug = 'craft-of-banarasi-silk';

UPDATE public.blog_posts SET content =
'Blue pottery is perhaps the only craft in Jaipur that contains no clay from Rajasthan. The raw material - a mixture of quartz stone powder, powdered glass, Multani mitti, borax, and gum - was a trade secret brought by Central Asian craftsmen who followed the Mughal court into Rajputana.

The defining characteristic is the cobalt blue - derived from cobalt oxide imported from Persia - applied over a white semi-transparent glaze. Traditionally, the motifs were limited to floral patterns: the lotus, the chrysanthemum, hunting scenes drawn from Persian miniature paintings.

Ram Gopal Sharma, one of the craft''s master practitioners, learned blue pottery at age nine in a workshop in Jaipur''s Old City. Today he runs a workshop with twelve artisans and has received the National Award for Craftsmanship from the Government of India. He showed us, step by step, how a single tile is made: mixing, molding, drying, painting, glazing, and firing at exactly 850 degrees Celsius.

The GI tag came in 2016, but enforcement remains weak. Mass-produced pieces from Khurja and China appear in Jaipur''s tourist markets under the label ''Jaipur Blue Pottery''. The tell: true Blue Pottery is hand-painted and no two pieces are identical. The glaze is never perfectly smooth. The imperfection is the proof.'
WHERE slug = 'blue-pottery-jaipur';

-- ================================================================
-- Verify
-- ================================================================
SELECT slug, length(content) AS content_length FROM public.blog_posts
WHERE slug IN ('craft-of-banarasi-silk', 'blue-pottery-jaipur');
