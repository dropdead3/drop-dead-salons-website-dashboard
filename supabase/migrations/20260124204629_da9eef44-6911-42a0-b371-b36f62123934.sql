-- Add default tax rate to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN default_tax_rate NUMERIC DEFAULT 0.08;

-- Set initial value based on current hardcoded rate
UPDATE public.business_settings SET default_tax_rate = 0.08 WHERE default_tax_rate IS NULL;

-- Add location-specific tax rate override to locations
ALTER TABLE public.locations 
ADD COLUMN tax_rate NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.locations.tax_rate IS 
'Location-specific tax rate override. If NULL, uses default from business_settings.';