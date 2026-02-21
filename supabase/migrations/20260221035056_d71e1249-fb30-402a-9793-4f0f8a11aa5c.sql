
-- Add appointment_id and status columns to booking_addon_events
ALTER TABLE public.booking_addon_events
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.phorest_appointments(id),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted';

-- Add check constraint via trigger (immutable-safe)
CREATE OR REPLACE FUNCTION public.validate_booking_addon_event_status()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('accepted', 'declined', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be accepted, declined, or dismissed.', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_booking_addon_event_status
  BEFORE INSERT OR UPDATE ON public.booking_addon_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_addon_event_status();

-- Index for querying add-ons by appointment
CREATE INDEX IF NOT EXISTS idx_booking_addon_events_appointment
  ON public.booking_addon_events(appointment_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_booking_addon_events_status
  ON public.booking_addon_events(status);

-- Add linked_service_id to service_addons
ALTER TABLE public.service_addons
  ADD COLUMN IF NOT EXISTS linked_service_id TEXT;
