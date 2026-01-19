-- Add highlighted_services column to employee_profiles
ALTER TABLE public.employee_profiles 
ADD COLUMN IF NOT EXISTS highlighted_services TEXT[] DEFAULT '{}'::text[];

-- Add a comment explaining the column
COMMENT ON COLUMN public.employee_profiles.highlighted_services IS 'Top 3 services that stylists want to highlight on their stylist card on the homepage';