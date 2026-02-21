
-- A1: Rename dd_certified to extensions_certified
ALTER TABLE public.employee_profiles 
  RENAME COLUMN dd_certified TO extensions_certified;

-- A2: Neutralize business_name default
ALTER TABLE public.business_settings 
  ALTER COLUMN business_name SET DEFAULT 'My Business';
