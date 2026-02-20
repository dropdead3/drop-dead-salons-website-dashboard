
ALTER TABLE public.phorest_appointments
  ADD COLUMN IF NOT EXISTS recurrence_rule JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurrence_group_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurrence_index INTEGER DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_phorest_appointments_recurrence_group
  ON public.phorest_appointments (recurrence_group_id)
  WHERE recurrence_group_id IS NOT NULL;
