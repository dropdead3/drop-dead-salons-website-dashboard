-- Feature 1: Import Templates table
CREATE TABLE IF NOT EXISTS public.platform_import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system TEXT NOT NULL, -- 'phorest', 'vagaro', 'salon_iris', 'csv'
  entity_type TEXT NOT NULL, -- 'clients', 'services', 'appointments', 'staff'
  field_mappings JSONB NOT NULL DEFAULT '[]',
  transformations JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_import_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for platform admins
CREATE POLICY "Platform admins can manage import templates"
ON public.platform_import_templates
FOR ALL TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_platform_import_templates_updated_at
  BEFORE UPDATE ON public.platform_import_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_import_templates_source_entity 
ON public.platform_import_templates(source_system, entity_type);

CREATE INDEX IF NOT EXISTS idx_import_templates_org 
ON public.platform_import_templates(organization_id);

-- Feature 5: Create testimonials table (doesn't exist yet)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for testimonials
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- RLS policies for testimonials
CREATE POLICY "Anyone can view visible testimonials"
ON public.testimonials
FOR SELECT
USING (is_visible = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Create indexes for testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order 
ON public.testimonials(display_order);

CREATE INDEX IF NOT EXISTS idx_testimonials_org 
ON public.testimonials(organization_id);

-- Add updated_at trigger
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();