-- Create business_settings table for storing business configuration
CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'Drop Dead',
  legal_name text,
  logo_url text,
  secondary_logo_url text,
  mailing_address text,
  city text,
  state text,
  zip text,
  ein text,
  phone text,
  email text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read business settings
CREATE POLICY "Anyone can view business settings"
ON public.business_settings
FOR SELECT
USING (true);

-- Only admins can update business settings
CREATE POLICY "Admins can update business settings"
ON public.business_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert business settings
CREATE POLICY "Admins can insert business settings"
ON public.business_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default business settings
INSERT INTO public.business_settings (business_name, legal_name)
VALUES ('Drop Dead', 'Drop Dead Gorgeous LLC');

-- Add trigger for updated_at
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();