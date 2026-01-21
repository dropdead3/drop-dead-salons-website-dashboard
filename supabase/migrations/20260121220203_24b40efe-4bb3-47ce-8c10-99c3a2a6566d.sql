-- Create specialty_options table for admin-managed specialties
CREATE TABLE public.specialty_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.specialty_options ENABLE ROW LEVEL SECURITY;

-- Public read for frontend (active options only)
CREATE POLICY "Anyone can read active specialty options" 
ON public.specialty_options 
FOR SELECT 
USING (is_active = true);

-- Admin management policy
CREATE POLICY "Admins can manage specialty options" 
ON public.specialty_options 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'manager')
));

-- Seed with initial specialty options
INSERT INTO public.specialty_options (name, display_order) VALUES
  ('EXTENSIONS', 1),
  ('BLONDING', 2),
  ('BALAYAGE', 3),
  ('COLOR CORRECTION', 4),
  ('CREATIVE COLOR', 5),
  ('VIVIDS', 6),
  ('PRECISION CUTS', 7),
  ('STYLING', 8),
  ('BLOWOUTS', 9),
  ('LIVED-IN COLOR', 10);

-- Add trigger for updated_at
CREATE TRIGGER update_specialty_options_updated_at
BEFORE UPDATE ON public.specialty_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();