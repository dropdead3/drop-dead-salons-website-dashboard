
-- Add archive columns to services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add archive columns to service_category_colors table
ALTER TABLE public.service_category_colors
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for filtering archived items efficiently
CREATE INDEX IF NOT EXISTS idx_services_is_archived ON public.services(is_archived);
CREATE INDEX IF NOT EXISTS idx_service_category_colors_is_archived ON public.service_category_colors(is_archived);
