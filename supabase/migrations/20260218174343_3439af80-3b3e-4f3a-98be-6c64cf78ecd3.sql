
-- Retail Sales Goals table (monthly revenue + attachment rate targets per location)
CREATE TABLE public.retail_sales_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT DEFAULT NULL,
  target_revenue NUMERIC NOT NULL DEFAULT 0,
  target_attachment_rate NUMERIC DEFAULT NULL,
  goal_period TEXT NOT NULL DEFAULT 'monthly' CHECK (goal_period IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, location_id, goal_period, period_start)
);

ALTER TABLE public.retail_sales_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view retail goals"
  ON public.retail_sales_goals FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage retail goals"
  ON public.retail_sales_goals FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Retail Commission Config table
CREATE TABLE public.retail_commission_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  commission_type TEXT NOT NULL DEFAULT 'flat_rate' CHECK (commission_type IN ('flat_rate', 'tiered', 'per_employee')),
  default_rate NUMERIC NOT NULL DEFAULT 0,
  tiers JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.retail_commission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view commission config"
  ON public.retail_commission_config FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage commission config"
  ON public.retail_commission_config FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Per-employee commission overrides
CREATE TABLE public.retail_commission_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES public.retail_commission_config(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  override_rate NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(config_id, user_id)
);

ALTER TABLE public.retail_commission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view overrides"
  ON public.retail_commission_overrides FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage overrides"
  ON public.retail_commission_overrides FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Inventory reorder queue
CREATE TABLE public.inventory_reorder_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  suggested_quantity INTEGER NOT NULL DEFAULT 0,
  reason TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'dismissed')),
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, product_id, status)
);

ALTER TABLE public.inventory_reorder_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view reorder queue"
  ON public.inventory_reorder_queue FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage reorder queue"
  ON public.inventory_reorder_queue FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Triggers for updated_at
CREATE TRIGGER update_retail_sales_goals_updated_at
  BEFORE UPDATE ON public.retail_sales_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retail_commission_config_updated_at
  BEFORE UPDATE ON public.retail_commission_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retail_commission_overrides_updated_at
  BEFORE UPDATE ON public.retail_commission_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_reorder_queue_updated_at
  BEFORE UPDATE ON public.inventory_reorder_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
