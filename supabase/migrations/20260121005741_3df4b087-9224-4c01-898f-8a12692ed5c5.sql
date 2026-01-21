-- Add optional hyperlink fields to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS link_label TEXT;