
-- Create website_themes table for full theme definitions
CREATE TABLE IF NOT EXISTS public.website_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  color_scheme TEXT NOT NULL DEFAULT 'cream',
  typography_preset JSONB NOT NULL DEFAULT '{}',
  layout_config JSONB NOT NULL DEFAULT '{}',
  default_sections JSONB NOT NULL DEFAULT '{}',
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_themes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view themes
CREATE POLICY "Authenticated users can view themes"
  ON public.website_themes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed built-in themes
INSERT INTO public.website_themes (id, name, description, color_scheme, typography_preset, layout_config, default_sections, is_builtin, is_available) VALUES
(
  'cream_classic',
  'Cream Classic',
  'Warm, elegant editorial design with full-width hero and stacked sections',
  'cream',
  '{"heading_font": "Termina", "body_font": "Aeonik Pro", "base_size": "16px"}',
  '{"hero_style": "full_width", "card_radius": "rounded-xl", "section_spacing": "standard", "hero_layout": "centered"}',
  '{}',
  true,
  true
),
(
  'rose_boutique',
  'Rose Boutique',
  'Soft feminine luxury with card-based layouts and delicate typography',
  'rose',
  '{"heading_font": "Termina", "body_font": "Aeonik Pro", "base_size": "16px"}',
  '{"hero_style": "split", "card_radius": "rounded-2xl", "section_spacing": "generous", "hero_layout": "split_left"}',
  '{}',
  true,
  true
),
(
  'sage_wellness',
  'Sage Wellness',
  'Calming spa aesthetic with open spacing and organic feel',
  'sage',
  '{"heading_font": "Termina", "body_font": "Aeonik Pro", "base_size": "16px"}',
  '{"hero_style": "minimal", "card_radius": "rounded-lg", "section_spacing": "spacious", "hero_layout": "centered"}',
  '{}',
  true,
  true
),
(
  'ocean_modern',
  'Ocean Modern',
  'Bold contemporary design with compact sections and strong contrast',
  'ocean',
  '{"heading_font": "Termina", "body_font": "Aeonik Pro", "base_size": "16px"}',
  '{"hero_style": "video", "card_radius": "rounded-lg", "section_spacing": "compact", "hero_layout": "centered"}',
  '{}',
  true,
  true
),
(
  'midnight',
  'Midnight',
  'Dark luxury editorial theme with gold accents',
  'midnight',
  '{"heading_font": "Termina", "body_font": "Aeonik Pro", "base_size": "16px"}',
  '{"hero_style": "full_width", "card_radius": "rounded-xl", "section_spacing": "standard", "hero_layout": "centered"}',
  '{}',
  true,
  false
),
(
  'terracotta',
  'Terracotta',
  'Earthy warmth with organic textures and natural tones',
  'terracotta',
  '{"heading_font": "Termina", "body_font": "Aeonik Pro", "base_size": "16px"}',
  '{"hero_style": "full_width", "card_radius": "rounded-2xl", "section_spacing": "generous", "hero_layout": "centered"}',
  '{}',
  true,
  false
);
