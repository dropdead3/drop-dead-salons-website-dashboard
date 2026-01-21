-- Add logo styling columns to program_configuration
ALTER TABLE public.program_configuration
ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 64,
ADD COLUMN IF NOT EXISTS logo_background_color TEXT DEFAULT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.program_configuration.logo_size IS 'Logo display height in pixels (40-120)';
COMMENT ON COLUMN public.program_configuration.logo_background_color IS 'Optional background color for logo container (hex format)';
