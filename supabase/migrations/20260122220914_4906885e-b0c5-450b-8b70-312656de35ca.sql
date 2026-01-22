-- Create storage bucket for business logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for business logos
CREATE POLICY "Anyone can view business logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

CREATE POLICY "Admins can upload business logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-logos' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR EXISTS (
      SELECT 1 FROM public.employee_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  )
);

CREATE POLICY "Admins can update business logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-logos' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR EXISTS (
      SELECT 1 FROM public.employee_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  )
);

CREATE POLICY "Admins can delete business logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-logos' 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR EXISTS (
      SELECT 1 FROM public.employee_profiles 
      WHERE user_id = auth.uid() 
      AND is_super_admin = true
    )
  )
);

-- Rename existing columns to be clearer (light mode logos)
-- Add new columns for dark mode logos
ALTER TABLE public.business_settings 
  RENAME COLUMN logo_url TO logo_light_url;

ALTER TABLE public.business_settings 
  RENAME COLUMN secondary_logo_url TO logo_dark_url;