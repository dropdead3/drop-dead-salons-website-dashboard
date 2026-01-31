-- Promotions Table: Core table for managing promotional campaigns
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  promo_code TEXT,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN (
    'percentage_discount',
    'fixed_discount',
    'bogo',
    'bundle',
    'new_client',
    'loyalty_bonus',
    'referral'
  )),
  discount_value DECIMAL(10,2),
  discount_max_amount DECIMAL(10,2),
  minimum_purchase DECIMAL(10,2) DEFAULT 0,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'services', 'products', 'specific')),
  applicable_service_ids UUID[],
  applicable_category TEXT[],
  excluded_service_ids UUID[],
  usage_limit INTEGER,
  usage_per_client INTEGER DEFAULT 1,
  current_usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN (
    'all', 'new_clients', 'existing_clients', 'loyalty_tier', 'specific_clients'
  )),
  target_loyalty_tiers TEXT[],
  target_client_ids UUID[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vouchers Table
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  voucher_type TEXT NOT NULL CHECK (voucher_type IN ('discount', 'free_service', 'credit', 'upgrade')),
  value DECIMAL(10,2),
  value_type TEXT DEFAULT 'fixed' CHECK (value_type IN ('fixed', 'percentage')),
  free_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  issued_to_client_id UUID REFERENCES phorest_clients(id) ON DELETE SET NULL,
  issued_to_email TEXT,
  issued_to_name TEXT,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_client_id UUID REFERENCES phorest_clients(id) ON DELETE SET NULL,
  redeemed_transaction_id TEXT,
  valid_from TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  issued_by UUID,
  issued_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT vouchers_code_org_unique UNIQUE (organization_id, code)
);

-- Promotional Services Table
CREATE TABLE public.promotional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  original_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  original_price DECIMAL(10,2),
  promotional_price DECIMAL(10,2),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_deactivate BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);

-- Promotion Redemptions Table
CREATE TABLE public.promotion_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  promo_code_used TEXT,
  client_id UUID REFERENCES phorest_clients(id) ON DELETE SET NULL,
  transaction_id TEXT,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  original_amount DECIMAL(10,2),
  discount_applied DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  items_discounted JSONB,
  location_id TEXT,
  staff_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Loyalty Analytics Daily Table
CREATE TABLE public.loyalty_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  points_expired INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  new_enrollments INTEGER DEFAULT 0,
  tier_upgrades INTEGER DEFAULT 0,
  loyalty_attributed_revenue DECIMAL(10,2) DEFAULT 0,
  redemption_value DECIMAL(10,2) DEFAULT 0,
  UNIQUE(organization_id, analytics_date)
);

-- Add sale_classification column
ALTER TABLE phorest_transaction_items 
ADD COLUMN IF NOT EXISTS sale_classification TEXT DEFAULT 'standard';

-- Create indexes
CREATE INDEX idx_promotions_org_active ON promotions(organization_id, is_active);
CREATE INDEX idx_promotions_expires_at ON promotions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_promotions_promo_code ON promotions(promo_code) WHERE promo_code IS NOT NULL;
CREATE INDEX idx_vouchers_org_code ON vouchers(organization_id, code);
CREATE INDEX idx_vouchers_expires_at ON vouchers(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_promotional_services_expires ON promotional_services(expires_at, auto_deactivate);
CREATE INDEX idx_promotion_redemptions_org ON promotion_redemptions(organization_id, transaction_date);
CREATE INDEX idx_loyalty_analytics_org_date ON loyalty_analytics_daily(organization_id, analytics_date);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS for promotions
CREATE POLICY "Users can view promotions in their organization" ON public.promotions FOR SELECT TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')))
WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')));

-- RLS for vouchers
CREATE POLICY "Users can view vouchers in their organization" ON public.vouchers FOR SELECT TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage vouchers" ON public.vouchers FOR ALL TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')))
WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')));

-- RLS for promotional_services
CREATE POLICY "Users can view promotional services" ON public.promotional_services FOR SELECT TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage promotional services" ON public.promotional_services FOR ALL TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')))
WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager')));

-- RLS for promotion_redemptions
CREATE POLICY "Users can view redemptions" ON public.promotion_redemptions FOR SELECT TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can create redemptions" ON public.promotion_redemptions FOR INSERT TO authenticated
WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

-- RLS for loyalty_analytics_daily
CREATE POLICY "Users can view loyalty analytics" ON public.loyalty_analytics_daily FOR SELECT TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "System can manage loyalty analytics" ON public.loyalty_analytics_daily FOR ALL TO authenticated
USING (public.user_belongs_to_org(auth.uid(), organization_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')))
WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();