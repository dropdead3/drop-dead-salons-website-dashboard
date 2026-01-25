-- Create marketing_campaigns table for budget/spend tracking
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  utm_campaign TEXT NOT NULL UNIQUE,
  platform TEXT,
  budget NUMERIC(10,2),
  spend_to_date NUMERIC(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for marketing_campaigns
CREATE POLICY "Admins can manage campaigns"
  ON public.marketing_campaigns
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Authenticated can view campaigns"
  ON public.marketing_campaigns
  FOR SELECT
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add marketing analytics permission
INSERT INTO public.permissions (name, display_name, description, category)
VALUES (
  'view_marketing_analytics', 
  'View Marketing Analytics', 
  'Access marketing campaign performance and ROI metrics', 
  'Management'
);

-- Grant to appropriate roles by default
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM permissions WHERE name = 'view_marketing_analytics'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM permissions WHERE name = 'view_marketing_analytics'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM permissions WHERE name = 'view_marketing_analytics'
ON CONFLICT DO NOTHING;