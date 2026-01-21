-- Create site_settings table for global configuration
CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default setting for homepage stylists
INSERT INTO public.site_settings (id, value) 
VALUES ('homepage_stylists', '{"show_sample_cards": false}');

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read for frontend
CREATE POLICY "Anyone can read site_settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Admin/manager update policy
CREATE POLICY "Admins can update site_settings" 
ON public.site_settings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'manager')
));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();