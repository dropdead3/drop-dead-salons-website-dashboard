-- Add custom_landing_page column to user_preferences for custom login landing page
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS custom_landing_page TEXT;