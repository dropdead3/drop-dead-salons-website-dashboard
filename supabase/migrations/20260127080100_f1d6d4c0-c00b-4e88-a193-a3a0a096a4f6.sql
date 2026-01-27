-- Create service_communication_flows table
CREATE TABLE public.service_communication_flows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid NOT NULL REFERENCES public.phorest_services(id) ON DELETE CASCADE,
    trigger_type text NOT NULL CHECK (trigger_type IN ('booking_confirmed', 'reminder_24h', 'reminder_2h', 'follow_up_24h', 'follow_up_7d')),
    email_template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
    sms_template_id uuid REFERENCES public.sms_templates(id) ON DELETE SET NULL,
    timing_offset_minutes integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (service_id, trigger_type)
);

-- Enable Row Level Security
ALTER TABLE public.service_communication_flows ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read flows
CREATE POLICY "Allow read for authenticated" ON public.service_communication_flows
    FOR SELECT TO authenticated USING (true);

-- Allow admins to insert flows
CREATE POLICY "Allow admin insert" ON public.service_communication_flows
    FOR INSERT TO authenticated
    WITH CHECK (public.is_coach_or_admin(auth.uid()));

-- Allow admins to update flows
CREATE POLICY "Allow admin update" ON public.service_communication_flows
    FOR UPDATE TO authenticated
    USING (public.is_coach_or_admin(auth.uid()));

-- Allow admins to delete flows
CREATE POLICY "Allow admin delete" ON public.service_communication_flows
    FOR DELETE TO authenticated
    USING (public.is_coach_or_admin(auth.uid()));

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_service_communication_flows_updated_at
    BEFORE UPDATE ON public.service_communication_flows
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.service_communication_flows IS 'Configuration for automated email/SMS communication flows per service';
COMMENT ON COLUMN public.service_communication_flows.trigger_type IS 'Event type: booking_confirmed, reminder_24h, reminder_2h, follow_up_24h, follow_up_7d';
COMMENT ON COLUMN public.service_communication_flows.timing_offset_minutes IS 'Minutes offset from trigger (negative = before, positive = after)';