-- Create stylist_levels table as the single source of truth
CREATE TABLE public.stylist_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  client_label TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stylist_levels ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active levels
CREATE POLICY "Anyone authenticated can view levels"
ON public.stylist_levels
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Admins/managers can manage levels
CREATE POLICY "Admins can manage levels"
ON public.stylist_levels
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Add trigger for updated_at
CREATE TRIGGER update_stylist_levels_updated_at
BEFORE UPDATE ON public.stylist_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default levels matching servicePricing.ts
INSERT INTO public.stylist_levels (slug, label, client_label, description, display_order) VALUES
('new-talent', 'New Talent', 'Level 1', 'Rising talent building their craft', 1),
('emerging', 'Emerging Artist', 'Level 2', 'Skilled stylist with proven expertise', 2),
('lead', 'Lead Artist', 'Level 3', 'Master artist & senior specialist', 3),
('senior', 'Senior Artist', 'Level 4', 'Elite specialist & industry leader', 4),
('signature', 'Signature Artist', 'Level 5', 'Signature artist with distinguished reputation', 5),
('icon', 'Icon Artist', 'Level 6', 'Icon-level artist at the pinnacle of the craft', 6);