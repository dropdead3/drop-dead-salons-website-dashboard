
-- Create time_entries table for clock-in/clock-out tracking
CREATE TABLE public.time_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  duration_minutes numeric,
  break_minutes numeric DEFAULT 0,
  location_id text,
  notes text,
  source text DEFAULT 'manual',
  payroll_synced boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_time_entries_user_active ON public.time_entries (user_id) WHERE clock_out IS NULL;
CREATE INDEX idx_time_entries_org ON public.time_entries (organization_id);
CREATE INDEX idx_time_entries_user_date ON public.time_entries (user_id, clock_in);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own entries
CREATE POLICY "Users can view own time entries"
  ON public.time_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Admins/managers can read all entries in their org
CREATE POLICY "Admins can view org time entries"
  ON public.time_entries FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
    AND public.is_coach_or_admin(auth.uid())
  );

-- Users can insert their own entries
CREATE POLICY "Users can clock in"
  ON public.time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries (for clock-out)
CREATE POLICY "Users can update own time entries"
  ON public.time_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to auto-calculate duration on clock-out
CREATE OR REPLACE FUNCTION public.calculate_time_entry_duration()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL AND (OLD.clock_out IS NULL OR OLD.clock_out IS DISTINCT FROM NEW.clock_out) THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60.0;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_time_entry_duration_trigger
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_time_entry_duration();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
