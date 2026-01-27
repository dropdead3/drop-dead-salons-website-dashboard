-- Create SMS templates table
CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  message_body text NOT NULL,
  description text,
  variables text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read templates
CREATE POLICY "Allow read for authenticated" ON public.sms_templates
  FOR SELECT TO authenticated USING (true);

-- Allow admins to insert templates
CREATE POLICY "Allow admin insert" ON public.sms_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coach_or_admin(auth.uid()));

-- Allow admins to update templates
CREATE POLICY "Allow admin update" ON public.sms_templates
  FOR UPDATE TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));

-- Allow admins to delete templates
CREATE POLICY "Allow admin delete" ON public.sms_templates
  FOR DELETE TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default templates
INSERT INTO public.sms_templates (template_key, name, message_body, description, variables) VALUES
('appointment_reminder', 'Appointment Reminder', 'Hi {{first_name}}, reminder: your appointment at {{location_name}} is {{appointment_date}} at {{appointment_time}}. Reply STOP to opt out.', 'Sent 24 hours before appointment', ARRAY['first_name', 'location_name', 'appointment_date', 'appointment_time']),
('appointment_confirmation', 'Booking Confirmation', 'Hi {{first_name}}! Your appointment at Drop Dead Gorgeous is confirmed for {{appointment_date}} at {{appointment_time}}. See you soon!', 'Sent immediately after booking', ARRAY['first_name', 'appointment_date', 'appointment_time']),
('appointment_cancelled', 'Cancellation Notice', 'Hi {{first_name}}, your appointment on {{appointment_date}} has been cancelled. Please call us to reschedule.', 'Sent when appointment is cancelled', ARRAY['first_name', 'appointment_date']),
('running_late', 'Running Late', 'Hi {{first_name}}, we''re running a few minutes behind. Your stylist will be with you shortly. Thank you for your patience!', 'Sent manually when running behind', ARRAY['first_name']);