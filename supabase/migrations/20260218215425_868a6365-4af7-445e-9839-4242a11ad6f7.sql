
-- Add is_popular and website_description columns to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS website_description TEXT;

-- Add description column to service_category_colors table
ALTER TABLE public.service_category_colors ADD COLUMN IF NOT EXISTS description TEXT;
