
ALTER TABLE public.service_category_colors
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows with sequential order based on alphabetical name
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY category_name) as rn
  FROM public.service_category_colors
)
UPDATE public.service_category_colors c
SET display_order = o.rn
FROM ordered o WHERE c.id = o.id;
