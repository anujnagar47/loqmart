-- Additive schema for the public product inquiry flow.
-- Apply once in the SQL editor of the Supabase project used by this deployment.
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) <= 254),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 8 AND 20),
  city_state text NOT NULL CHECK (char_length(city_state) BETWEEN 2 AND 120),
  note text CHECK (note IS NULL OR char_length(note) <= 1000),
  product_ids uuid[] NOT NULL CHECK (cardinality(product_ids) BETWEEN 1 AND 20),
  product_options jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON public.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_email_idx ON public.inquiries (email);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inquiries FROM anon, authenticated;
GRANT ALL ON public.inquiries TO service_role;
