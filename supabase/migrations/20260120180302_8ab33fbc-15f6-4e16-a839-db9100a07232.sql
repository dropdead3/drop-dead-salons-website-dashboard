-- Create website analytics cache table
CREATE TABLE public.website_analytics_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  visitors INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  avg_session_duration NUMERIC(10,2) DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins/managers to view analytics
CREATE POLICY "Admins and managers can view analytics"
ON public.website_analytics_cache
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Create index for date queries
CREATE INDEX idx_website_analytics_date ON public.website_analytics_cache(date DESC);