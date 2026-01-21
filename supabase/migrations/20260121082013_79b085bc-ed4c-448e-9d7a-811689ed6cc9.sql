-- Add logo_url column to program_configuration
ALTER TABLE public.program_configuration
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.program_configuration.logo_url IS 'Custom logo URL for the program, stored in Supabase Storage';
