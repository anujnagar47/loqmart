-- Marketplace behavior telemetry, guest intent snapshots, and sponsored campaigns.
-- Apply once in the Supabase SQL editor after fix-phaseE-variants-qa-reviews.sql
-- and fix-phaseF-cart-persistence.sql, before enabling the matching app routes.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,
  session_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_view','product_view','product_click','quick_view','product_engagement','search_click','search_submit',
    'category_view','state_view','seller_view','add_to_cart','wishlist_add','wishlist_remove',
    'customization_inquiry'
  )),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL,
  state_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_product_type_idx ON public.analytics_events(product_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_visitor_idx ON public.analytics_events(visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON public.analytics_events(session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  session_id UUID PRIMARY KEY,
  visitor_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  state_code TEXT,
  pincode TEXT CHECK (pincode IS NULL OR pincode ~ '^[0-9]{6}$'),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS visitor_sessions_seen_idx ON public.visitor_sessions(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.visitor_intent_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.visitor_sessions(session_id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('cart','wishlist')),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  variant_key UUID GENERATED ALWAYS AS (COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)) STORED,
  UNIQUE(session_id, item_type, product_id, variant_key)
);
CREATE INDEX IF NOT EXISTS visitor_intent_user_idx ON public.visitor_intent_items(user_id, item_type);
CREATE INDEX IF NOT EXISTS visitor_intent_session_idx ON public.visitor_intent_items(session_id, item_type);

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS is_pro_seller BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('product','seller')),
  placement TEXT NOT NULL CHECK (placement IN ('home_hero','search_top','state_spotlight','product_partner')),
  target_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  target_seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  cta_label TEXT NOT NULL DEFAULT 'Explore now',
  destination_url TEXT,
  state_code TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active','scheduled','paused')) DEFAULT 'scheduled',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at),
  CHECK ((ad_type = 'product' AND target_product_id IS NOT NULL) OR (ad_type = 'seller' AND target_seller_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ad_campaigns_active_idx ON public.ad_campaigns(placement, status, starts_at, ends_at, priority DESC);

CREATE TABLE IF NOT EXISTS public.ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','click')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ad_events_campaign_idx ON public.ad_events(campaign_id, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_intent_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: only server routes using the service role may read/write these tables.
