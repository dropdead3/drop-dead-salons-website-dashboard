-- Add show_on_website column to locations table
-- This separates "operational status" (is_active) from "website visibility" (show_on_website)
ALTER TABLE public.locations ADD COLUMN show_on_website boolean NOT NULL DEFAULT true;

-- Add a comment for clarity
COMMENT ON COLUMN public.locations.show_on_website IS 'Controls whether this location appears on the public website';