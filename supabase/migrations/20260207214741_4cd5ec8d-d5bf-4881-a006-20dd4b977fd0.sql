-- Add is_internal flag to organizations table
ALTER TABLE public.organizations 
ADD COLUMN is_internal BOOLEAN NOT NULL DEFAULT false;

-- Mark Drop Dead Salons as internal (platform-owned)
UPDATE public.organizations 
SET is_internal = true 
WHERE id = 'fa23cd95-decf-436a-adba-4561b0ecc14d';

-- Add a comment for documentation
COMMENT ON COLUMN public.organizations.is_internal IS 
  'True for platform-owned organizations that should not be billed';