
-- Add custom_duration_minutes to staff_service_qualifications
-- This allows per-stylist duration overrides alongside the existing custom_price column
ALTER TABLE public.staff_service_qualifications
ADD COLUMN IF NOT EXISTS custom_duration_minutes INTEGER NULL;
