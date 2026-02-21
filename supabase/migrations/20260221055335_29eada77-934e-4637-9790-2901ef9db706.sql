
-- Add redo/adjustment columns to appointments table
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS is_redo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS redo_reason text,
  ADD COLUMN IF NOT EXISTS original_appointment_id uuid REFERENCES public.appointments(id),
  ADD COLUMN IF NOT EXISTS redo_pricing_override numeric,
  ADD COLUMN IF NOT EXISTS redo_approved_by uuid;

-- Index for analytics queries on redo appointments
CREATE INDEX IF NOT EXISTS idx_appointments_is_redo
  ON public.appointments(is_redo) WHERE is_redo = true;

-- Index for looking up redos by original appointment
CREATE INDEX IF NOT EXISTS idx_appointments_original_appointment_id
  ON public.appointments(original_appointment_id) WHERE original_appointment_id IS NOT NULL;
