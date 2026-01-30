-- Add platform_branding entry to site_settings
INSERT INTO site_settings (id, value)
VALUES ('platform_branding', '{
  "primary_logo_url": null,
  "secondary_logo_url": null,
  "theme_colors": {},
  "typography": {}
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for platform owners to update platform branding
-- First, drop if exists to avoid conflicts
DROP POLICY IF EXISTS "Platform owners can update platform branding" ON site_settings;

CREATE POLICY "Platform owners can update platform branding"
ON site_settings
FOR UPDATE
USING (
  id = 'platform_branding' AND
  public.has_platform_role(auth.uid(), 'platform_owner')
)
WITH CHECK (
  id = 'platform_branding' AND
  public.has_platform_role(auth.uid(), 'platform_owner')
);