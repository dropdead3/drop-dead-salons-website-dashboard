-- Add sort_order column for drag-and-drop reordering of pinned announcements
ALTER TABLE public.announcements 
ADD COLUMN sort_order integer DEFAULT 0;

-- Set initial sort order based on created_at for existing pinned announcements
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.announcements
  WHERE is_pinned = true
)
UPDATE public.announcements a
SET sort_order = r.rn
FROM ranked r
WHERE a.id = r.id;

-- Create index for efficient sorting
CREATE INDEX idx_announcements_sort_order ON public.announcements(sort_order);