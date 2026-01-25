-- Add hiring capacity fields to locations table
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS stylist_capacity integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS assistant_ratio numeric(3,2) DEFAULT 0.5;

-- Add comment for documentation
COMMENT ON COLUMN public.locations.stylist_capacity IS 'Target number of stylists for this location';
COMMENT ON COLUMN public.locations.assistant_ratio IS 'Number of assistant stylists needed per stylist (e.g., 0.5 = 1 assistant per 2 stylists)';