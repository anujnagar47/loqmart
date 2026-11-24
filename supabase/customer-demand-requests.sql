CREATE TABLE IF NOT EXISTS public.customer_demand_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_item TEXT NOT NULL CHECK (char_length(requested_item) BETWEEN 2 AND 140),
  category TEXT NOT NULL DEFAULT 'Other',
  state_code TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  contact TEXT,
  source TEXT NOT NULL DEFAULT 'homepage' CHECK (source IN ('welcome','search','footer','homepage')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS customer_demand_requests_created_at_idx ON public.customer_demand_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS customer_demand_requests_category_idx ON public.customer_demand_requests(category, state_code);
ALTER TABLE public.customer_demand_requests ENABLE ROW LEVEL SECURITY;
-- Access is server-only through the service-role key; no browser policies are created.
