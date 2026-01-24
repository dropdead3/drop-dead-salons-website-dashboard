-- Add custom_typography column to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS custom_typography JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_preferences.custom_typography IS 'Stores custom typography settings (font sizes, weights, letter-spacing, line heights) as CSS variable overrides';