-- Add blocks_json column to store visual editor block state
ALTER TABLE public.email_templates
ADD COLUMN blocks_json JSONB DEFAULT NULL;

-- Add a comment to explain the column's purpose
COMMENT ON COLUMN public.email_templates.blocks_json IS 'Stores the visual editor blocks as JSON for round-trip editing';