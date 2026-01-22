-- Add secondary logo (icon) columns to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS icon_light_url TEXT,
ADD COLUMN IF NOT EXISTS icon_dark_url TEXT;