-- Create service_category_themes table
CREATE TABLE public.service_category_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  colors jsonb NOT NULL,
  is_default boolean DEFAULT false,
  is_custom boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_category_themes ENABLE ROW LEVEL SECURITY;

-- Anyone can read themes
CREATE POLICY "Public can view themes" 
  ON public.service_category_themes FOR SELECT USING (true);

-- Admins can manage themes
CREATE POLICY "Admins can manage themes"
  ON public.service_category_themes FOR ALL 
  USING (public.is_coach_or_admin(auth.uid()));

-- Insert default themes
INSERT INTO public.service_category_themes (name, description, colors, is_default) VALUES
(
  'Ocean Avenue',
  'Soft coastal palette with cream and blue tones',
  '{"Blonding": "#f5f5dc", "Color": "#fbcfe8", "Extensions": "#fbd5c4", "Extras": "#d1fae5", "Haircut": "#d4cfc4", "Styling": "#60A5FA", "New Client Consultation": "gradient:teal-lime", "Block": "#1a1a1a", "Break": "#2d2d2d"}'::jsonb,
  true
),
(
  'Rose Garden',
  'Warm pink and blush tones for a romantic feel',
  '{"Blonding": "#fce7f3", "Color": "#f9a8d4", "Extensions": "#F472B6", "Extras": "#fbcfe8", "Haircut": "#fde8d7", "Styling": "#EC4899", "New Client Consultation": "gradient:rose-gold", "Block": "#1a1a1a", "Break": "#2d2d2d"}'::jsonb,
  false
),
(
  'Midnight Luxe',
  'Dark, sophisticated palette for evening vibes',
  '{"Blonding": "#4a4a4a", "Color": "#c4b5fd", "Extensions": "#6b7280", "Extras": "#9ca3af", "Haircut": "#2d2d2d", "Styling": "#a7f3d0", "New Client Consultation": "gradient:ocean-blue", "Block": "#1a1a1a", "Break": "#1a1a1a"}'::jsonb,
  false
),
(
  'Neutral Elegance',
  'Clean creams and oats for timeless sophistication',
  '{"Blonding": "#f5f5dc", "Color": "#e8e4d9", "Extensions": "#d4cfc4", "Extras": "#c9c2b5", "Haircut": "#b8b0a2", "Styling": "#a39e93", "New Client Consultation": "gradient:champagne", "Block": "#1a1a1a", "Break": "#2d2d2d"}'::jsonb,
  false
),
(
  'Coastal Breeze',
  'Fresh blues and teals for a calming atmosphere',
  '{"Blonding": "#e0f2fe", "Color": "#bae6fd", "Extensions": "#7dd3fc", "Extras": "#d1fae5", "Haircut": "#60A5FA", "Styling": "#3B82F6", "New Client Consultation": "gradient:teal-lime", "Block": "#1a1a1a", "Break": "#2d2d2d"}'::jsonb,
  false
);

-- Create updated_at trigger
CREATE TRIGGER update_service_category_themes_updated_at
  BEFORE UPDATE ON public.service_category_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();