-- Add sidebar_layout column to business_settings for storing custom navigation order
ALTER TABLE business_settings 
ADD COLUMN IF NOT EXISTS sidebar_layout jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN business_settings.sidebar_layout IS 'Stores custom sidebar section and link ordering. Structure: { sectionOrder: string[], linkOrder: { [sectionId]: string[] } }';