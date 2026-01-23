-- Create table for service category colors
CREATE TABLE public.service_category_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  color_hex TEXT NOT NULL DEFAULT '#22c55e',
  text_color_hex TEXT NOT NULL DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_category_colors ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view colors
CREATE POLICY "Authenticated users can view service colors"
ON public.service_category_colors
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow admins/managers to manage colors
CREATE POLICY "Admins can manage service colors"
ON public.service_category_colors
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin', 'manager')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_service_category_colors_updated_at
BEFORE UPDATE ON public.service_category_colors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default colors for common service categories
INSERT INTO public.service_category_colors (category_name, color_hex, text_color_hex) VALUES
  ('Extensions', '#22c55e', '#ffffff'),
  ('Blonding', '#facc15', '#1f2937'),
  ('Color', '#f472b6', '#ffffff'),
  ('Haircuts', '#60a5fa', '#ffffff'),
  ('Styling', '#a78bfa', '#ffffff'),
  ('Treatments', '#2dd4bf', '#ffffff'),
  ('New Client Consultation', '#d4a574', '#1f2937'),
  ('Break', '#4b5563', '#ffffff'),
  ('Block', '#374151', '#ffffff')
ON CONFLICT (category_name) DO NOTHING;