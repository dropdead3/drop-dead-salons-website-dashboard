-- Add custom_theme column to user_preferences for storing color overrides
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS custom_theme JSONB DEFAULT NULL;

-- Add a comment explaining the structure
COMMENT ON COLUMN public.user_preferences.custom_theme IS 'Stores custom CSS variable overrides as HSL values, e.g. {"background": "40 30% 96%", "primary": "350 60% 55%"}';