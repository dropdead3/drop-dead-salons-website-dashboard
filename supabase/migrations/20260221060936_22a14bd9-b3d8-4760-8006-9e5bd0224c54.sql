-- Add redo columns to phorest_appointments table (to match appointments table)
ALTER TABLE public.phorest_appointments
  ADD COLUMN IF NOT EXISTS is_redo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS redo_reason text,
  ADD COLUMN IF NOT EXISTS original_appointment_id uuid,
  ADD COLUMN IF NOT EXISTS redo_pricing_override numeric,
  ADD COLUMN IF NOT EXISTS redo_approved_by uuid,
  ADD COLUMN IF NOT EXISTS original_price numeric;

-- Add index for redo queries on phorest_appointments
CREATE INDEX IF NOT EXISTS idx_phorest_appointments_is_redo ON public.phorest_appointments(is_redo) WHERE is_redo = true;
CREATE INDEX IF NOT EXISTS idx_phorest_appointments_original_appointment_id ON public.phorest_appointments(original_appointment_id) WHERE original_appointment_id IS NOT NULL;