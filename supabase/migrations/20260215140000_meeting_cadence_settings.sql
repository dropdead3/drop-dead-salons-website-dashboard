-- Meeting cadence settings: global default + per-staff overrides
-- A row with user_id IS NULL = org-wide default cadence
-- A row with a specific user_id = per-staff override

CREATE TABLE IF NOT EXISTS public.meeting_cadence_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cadence_days integer NOT NULL DEFAULT 14,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_org_user UNIQUE (organization_id, user_id)
);

-- Index for fast lookup by org
CREATE INDEX IF NOT EXISTS idx_meeting_cadence_org ON public.meeting_cadence_settings(organization_id);

-- Enable RLS
ALTER TABLE public.meeting_cadence_settings ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read cadence settings for their org
CREATE POLICY "Users can read cadence settings for their org"
  ON public.meeting_cadence_settings
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT ep.organization_id FROM public.employee_profiles ep WHERE ep.user_id = auth.uid()
    )
  );

-- Policy: managers/admins/super_admins can insert/update/delete
CREATE POLICY "Managers can manage cadence settings"
  ON public.meeting_cadence_settings
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT ep.organization_id FROM public.employee_profiles ep WHERE ep.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'manager', 'super_admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT ep.organization_id FROM public.employee_profiles ep WHERE ep.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'manager', 'super_admin')
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_meeting_cadence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meeting_cadence_updated_at
  BEFORE UPDATE ON public.meeting_cadence_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_meeting_cadence_updated_at();
