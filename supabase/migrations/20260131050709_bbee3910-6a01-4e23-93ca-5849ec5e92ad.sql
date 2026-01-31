-- Add website_url column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN website_url TEXT;