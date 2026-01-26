-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  src TEXT NOT NULL,
  alt TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create gallery_transformations table
CREATE TABLE public.gallery_transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  before_image TEXT NOT NULL,
  after_image TEXT NOT NULL,
  before_label TEXT DEFAULT 'Before',
  after_label TEXT DEFAULT 'After',
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_transformations ENABLE ROW LEVEL SECURITY;

-- RLS policies for gallery_images (public read, admin write)
CREATE POLICY "Anyone can view visible gallery images"
  ON public.gallery_images FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can manage gallery images"
  ON public.gallery_images FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS policies for gallery_transformations (public read, admin write)
CREATE POLICY "Anyone can view visible gallery transformations"
  ON public.gallery_transformations FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can manage gallery transformations"
  ON public.gallery_transformations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Triggers for updated_at
CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gallery_transformations_updated_at
  BEFORE UPDATE ON public.gallery_transformations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();