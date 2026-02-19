
-- Add assist duration tracking to appointment_assistants
ALTER TABLE public.appointment_assistants 
ADD COLUMN IF NOT EXISTS assist_duration_minutes integer;

-- Add comment for clarity
COMMENT ON COLUMN public.appointment_assistants.assist_duration_minutes IS 'Optional duration the assistant was present. NULL means full appointment duration assumed.';

-- Create a trigger to prevent self-assignment (assistant = lead stylist)
CREATE OR REPLACE FUNCTION public.prevent_self_assistant_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_stylist_user_id UUID;
BEGIN
  -- Look up the lead stylist for this appointment in phorest_appointments
  SELECT stylist_user_id INTO v_stylist_user_id
  FROM public.phorest_appointments
  WHERE id = NEW.appointment_id;

  -- If the assistant is the same as the lead stylist, reject
  IF v_stylist_user_id IS NOT NULL AND v_stylist_user_id = NEW.assistant_user_id THEN
    RAISE EXCEPTION 'Cannot assign the lead stylist as their own assistant';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_self_assistant
BEFORE INSERT ON public.appointment_assistants
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_assistant_assignment();
