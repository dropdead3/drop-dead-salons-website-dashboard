-- Create junction table for staff-to-service qualifications
CREATE TABLE public.phorest_staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phorest_staff_id TEXT NOT NULL,
  phorest_service_id TEXT NOT NULL,
  phorest_branch_id TEXT NOT NULL,
  -- Optional: staff-specific pricing/duration overrides from Phorest
  custom_price NUMERIC(10,2),
  custom_duration_minutes INTEGER,
  is_qualified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phorest_staff_id, phorest_service_id, phorest_branch_id)
);

-- Index for filtering stylists by service
CREATE INDEX idx_staff_services_service ON public.phorest_staff_services(phorest_service_id);
CREATE INDEX idx_staff_services_staff ON public.phorest_staff_services(phorest_staff_id);
CREATE INDEX idx_staff_services_branch ON public.phorest_staff_services(phorest_branch_id);

-- Enable RLS (admin-only access since this is synced data)
ALTER TABLE public.phorest_staff_services ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read qualifications (needed for booking UI)
CREATE POLICY "Authenticated users can view staff service qualifications"
ON public.phorest_staff_services
FOR SELECT
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_phorest_staff_services_updated_at
BEFORE UPDATE ON public.phorest_staff_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();