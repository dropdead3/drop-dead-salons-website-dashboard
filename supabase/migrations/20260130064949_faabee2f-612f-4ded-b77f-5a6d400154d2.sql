-- Add business_type column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN business_type TEXT DEFAULT 'salon';

-- Add check constraint for valid business types
ALTER TABLE public.organizations
ADD CONSTRAINT organizations_business_type_check 
CHECK (business_type IN ('salon', 'spa', 'esthetics', 'barbershop', 'med_spa', 'wellness', 'other'));