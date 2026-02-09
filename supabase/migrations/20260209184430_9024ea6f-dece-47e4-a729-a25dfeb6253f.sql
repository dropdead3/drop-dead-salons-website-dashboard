
-- Create platform_incidents table
CREATE TABLE public.platform_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved')),
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  link_text text,
  link_url text,
  is_auto_created boolean NOT NULL DEFAULT false,
  created_by uuid,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_incidents ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (they need to see the banner)
CREATE POLICY "Authenticated users can view incidents"
  ON public.platform_incidents FOR SELECT
  TO authenticated
  USING (true);

-- Only platform admins can insert
CREATE POLICY "Platform admins can create incidents"
  ON public.platform_incidents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_user(auth.uid()));

-- Only platform admins can update
CREATE POLICY "Platform admins can update incidents"
  ON public.platform_incidents FOR UPDATE
  TO authenticated
  USING (public.is_platform_user(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_platform_incidents_updated_at
  BEFORE UPDATE ON public.platform_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_incidents;
