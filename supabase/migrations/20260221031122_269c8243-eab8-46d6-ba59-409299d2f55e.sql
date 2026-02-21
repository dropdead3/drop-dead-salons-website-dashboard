
CREATE TABLE IF NOT EXISTS public.booking_addon_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_user_id uuid NOT NULL,
  addon_id uuid NOT NULL REFERENCES public.service_addons(id),
  addon_name text NOT NULL,
  addon_price numeric NOT NULL DEFAULT 0,
  addon_cost numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_addon_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read addon events"
  ON public.booking_addon_events FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Authenticated users can insert addon events"
  ON public.booking_addon_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_booking_addon_events_org_date
  ON public.booking_addon_events (organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_booking_addon_events_staff
  ON public.booking_addon_events (staff_user_id, created_at);
