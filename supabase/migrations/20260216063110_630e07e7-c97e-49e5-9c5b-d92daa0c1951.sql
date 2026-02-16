
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS email_footer_text text,
  ADD COLUMN IF NOT EXISTS email_social_links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS email_show_attribution boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_button_radius text DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS email_header_style text DEFAULT 'centered';
