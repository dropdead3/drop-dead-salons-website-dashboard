-- =============================================
-- PHASE 1: Complete Schema Extensions
-- =============================================

-- ===================
-- 1.1 STATION MANAGEMENT
-- ===================

CREATE TABLE IF NOT EXISTS public.rental_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_number INTEGER,
  station_type TEXT DEFAULT 'chair' CHECK (station_type IN ('chair', 'booth', 'suite', 'room')),
  is_available BOOLEAN DEFAULT true,
  amenities TEXT[],
  monthly_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.station_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES rental_stations(id) ON DELETE CASCADE,
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  assigned_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(station_id, booth_renter_id, assigned_date)
);

ALTER TABLE public.rental_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_assignments ENABLE ROW LEVEL SECURITY;

-- ===================
-- 1.2 INSURANCE TRACKING
-- ===================

ALTER TABLE public.booth_renter_profiles 
ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_verified_by UUID,
ADD COLUMN IF NOT EXISTS insurance_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS insurance_document_url TEXT;

-- ===================
-- 1.3 SCHEDULED RENT CHANGES
-- ===================

CREATE TABLE IF NOT EXISTS public.scheduled_rent_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES booth_rental_contracts(id) ON DELETE CASCADE,
  current_rent_amount DECIMAL(10,2) NOT NULL,
  new_rent_amount DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  reason TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.scheduled_rent_changes ENABLE ROW LEVEL SECURITY;

-- ===================
-- 1.4 LATE FEE CONFIGURATION
-- ===================

CREATE TABLE IF NOT EXISTS public.rent_late_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grace_period_days INTEGER DEFAULT 5,
  late_fee_type TEXT DEFAULT 'flat' CHECK (late_fee_type IN ('flat', 'percentage', 'daily')),
  late_fee_amount DECIMAL(10,2) DEFAULT 25.00,
  late_fee_percentage DECIMAL(5,4),
  daily_fee_amount DECIMAL(10,2),
  max_late_fee DECIMAL(10,2),
  auto_apply BOOLEAN DEFAULT true,
  send_reminder_days INTEGER[] DEFAULT ARRAY[3, 1, 0],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.rent_late_fee_config ENABLE ROW LEVEL SECURITY;

-- ===================
-- 1.5 COMMISSION STATEMENTS
-- ===================

CREATE TABLE IF NOT EXISTS public.renter_commission_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_retail_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_service_revenue DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,4) NOT NULL,
  total_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  deduction_notes TEXT,
  net_payout DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,
  statement_pdf_url TEXT,
  line_items JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, booth_renter_id, period_start, period_end)
);

ALTER TABLE public.renter_commission_statements ENABLE ROW LEVEL SECURITY;

-- ===================
-- 1.6 RENTER PAYMENT METHODS
-- ===================

CREATE TABLE IF NOT EXISTS public.renter_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  autopay_enabled BOOLEAN DEFAULT false,
  autopay_days_before_due INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.renter_payment_methods ENABLE ROW LEVEL SECURITY;

-- ===================
-- 1.7 REFERRAL PROGRAM
-- ===================

CREATE TABLE IF NOT EXISTS public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  referrer_client_id UUID,
  referrer_user_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  campaign_name TEXT,
  reward_type TEXT DEFAULT 'credit' CHECK (reward_type IN ('voucher', 'credit', 'points', 'discount', 'free_service')),
  referrer_reward_value DECIMAL(10,2),
  referrer_reward_description TEXT,
  referee_reward_value DECIMAL(10,2),
  referee_reward_description TEXT,
  uses INTEGER DEFAULT 0,
  max_uses INTEGER,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  terms_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  referred_client_id UUID NOT NULL,
  first_appointment_id UUID,
  first_appointment_date DATE,
  first_appointment_value DECIMAL(10,2),
  referrer_rewarded BOOLEAN DEFAULT false,
  referrer_reward_issued_at TIMESTAMPTZ,
  referrer_reward_id UUID,
  referee_rewarded BOOLEAN DEFAULT false,
  referee_reward_issued_at TIMESTAMPTZ,
  referee_reward_id UUID,
  converted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

-- ===================
-- 1.8 PROMOTION EXTENSIONS
-- ===================

ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flash_sale_countdown_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS show_homepage_banner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banner_text TEXT,
ADD COLUMN IF NOT EXISTS banner_color TEXT;

CREATE TABLE IF NOT EXISTS public.promotion_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  variant_code TEXT,
  discount_value DECIMAL(10,2),
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  description TEXT,
  views INTEGER DEFAULT 0,
  redemptions INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  is_control BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promotion_variants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.promotion_redemptions 
ADD COLUMN IF NOT EXISTS variant_id UUID,
ADD COLUMN IF NOT EXISTS revenue_attributed DECIMAL(10,2);

-- ===================
-- 1.10 RLS POLICIES
-- ===================

-- Rental stations
DROP POLICY IF EXISTS "Users can view stations in their org" ON public.rental_stations;
CREATE POLICY "Users can view stations in their org"
ON public.rental_stations FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM employee_profiles WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
  )
  OR public.is_platform_user(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage stations" ON public.rental_stations;
CREATE POLICY "Admins can manage stations"
ON public.rental_stations FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.is_platform_user(auth.uid())
);

-- Station assignments
DROP POLICY IF EXISTS "Users can view station assignments" ON public.station_assignments;
CREATE POLICY "Users can view station assignments"
ON public.station_assignments FOR SELECT TO authenticated
USING (
  station_id IN (SELECT id FROM rental_stations WHERE organization_id IN (
    SELECT organization_id FROM employee_profiles WHERE user_id = auth.uid()
    UNION SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
  ))
  OR public.is_platform_user(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage station assignments" ON public.station_assignments;
CREATE POLICY "Admins can manage station assignments"
ON public.station_assignments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.is_platform_user(auth.uid())
);

-- Scheduled rent changes
DROP POLICY IF EXISTS "Admins can manage rent changes" ON public.scheduled_rent_changes;
CREATE POLICY "Admins can manage rent changes"
ON public.scheduled_rent_changes FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.is_platform_user(auth.uid())
);

DROP POLICY IF EXISTS "Renters can view their rent changes" ON public.scheduled_rent_changes;
CREATE POLICY "Renters can view their rent changes"
ON public.scheduled_rent_changes FOR SELECT TO authenticated
USING (
  contract_id IN (
    SELECT brc.id FROM booth_rental_contracts brc
    JOIN booth_renter_profiles brp ON brc.booth_renter_id = brp.id
    WHERE brp.user_id = auth.uid()
  )
);

-- Late fee config
DROP POLICY IF EXISTS "Admins can manage late fee config" ON public.rent_late_fee_config;
CREATE POLICY "Admins can manage late fee config"
ON public.rent_late_fee_config FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.is_platform_user(auth.uid())
);

-- Commission statements
DROP POLICY IF EXISTS "Admins can manage commission statements" ON public.renter_commission_statements;
CREATE POLICY "Admins can manage commission statements"
ON public.renter_commission_statements FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.is_platform_user(auth.uid())
);

DROP POLICY IF EXISTS "Renters can view their statements" ON public.renter_commission_statements;
CREATE POLICY "Renters can view their statements"
ON public.renter_commission_statements FOR SELECT TO authenticated
USING (
  booth_renter_id IN (SELECT id FROM booth_renter_profiles WHERE user_id = auth.uid())
);

-- Payment methods
DROP POLICY IF EXISTS "Renters can manage payment methods" ON public.renter_payment_methods;
CREATE POLICY "Renters can manage payment methods"
ON public.renter_payment_methods FOR ALL TO authenticated
USING (
  booth_renter_id IN (SELECT id FROM booth_renter_profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.is_platform_user(auth.uid())
);

-- Referral links
DROP POLICY IF EXISTS "Users can view referral links" ON public.referral_links;
CREATE POLICY "Users can view referral links"
ON public.referral_links FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM employee_profiles WHERE user_id = auth.uid()
    UNION SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
  )
  OR public.is_platform_user(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage referral links" ON public.referral_links;
CREATE POLICY "Admins can manage referral links"
ON public.referral_links FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_platform_user(auth.uid())
);

-- Referral conversions
DROP POLICY IF EXISTS "Users can view referral conversions" ON public.referral_conversions;
CREATE POLICY "Users can view referral conversions"
ON public.referral_conversions FOR SELECT TO authenticated
USING (
  referral_link_id IN (SELECT id FROM referral_links WHERE organization_id IN (
    SELECT organization_id FROM employee_profiles WHERE user_id = auth.uid()
    UNION SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
  ))
  OR public.is_platform_user(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage referral conversions" ON public.referral_conversions;
CREATE POLICY "Admins can manage referral conversions"
ON public.referral_conversions FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.is_platform_user(auth.uid())
);

-- Promotion variants
DROP POLICY IF EXISTS "Users can view promotion variants" ON public.promotion_variants;
CREATE POLICY "Users can view promotion variants"
ON public.promotion_variants FOR SELECT TO authenticated
USING (
  promotion_id IN (SELECT id FROM promotions WHERE organization_id IN (
    SELECT organization_id FROM employee_profiles WHERE user_id = auth.uid()
    UNION SELECT organization_id FROM organization_admins WHERE user_id = auth.uid()
  ))
  OR public.is_platform_user(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage promotion variants" ON public.promotion_variants;
CREATE POLICY "Admins can manage promotion variants"
ON public.promotion_variants FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_platform_user(auth.uid())
);

-- ===================
-- 1.11 INDEXES
-- ===================

CREATE INDEX IF NOT EXISTS idx_rental_stations_org_location ON rental_stations(organization_id, location_id);
CREATE INDEX IF NOT EXISTS idx_station_assignments_active ON station_assignments(station_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_rent_changes_pending ON scheduled_rent_changes(effective_date, applied) WHERE applied = false;
CREATE INDEX IF NOT EXISTS idx_commission_statements_period ON renter_commission_statements(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_org_active ON referral_links(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_variants_promo ON promotion_variants(promotion_id);
CREATE INDEX IF NOT EXISTS idx_renter_payment_methods_renter ON renter_payment_methods(booth_renter_id);
CREATE INDEX IF NOT EXISTS idx_booth_renter_insurance_expiry ON booth_renter_profiles(insurance_expiry_date) WHERE insurance_expiry_date IS NOT NULL;

-- ===================
-- 1.12 TRIGGERS
-- ===================

DROP TRIGGER IF EXISTS update_rental_stations_updated_at ON rental_stations;
CREATE TRIGGER update_rental_stations_updated_at
BEFORE UPDATE ON rental_stations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rent_late_fee_config_updated_at ON rent_late_fee_config;
CREATE TRIGGER update_rent_late_fee_config_updated_at
BEFORE UPDATE ON rent_late_fee_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_renter_payment_methods_updated_at ON renter_payment_methods;
CREATE TRIGGER update_renter_payment_methods_updated_at
BEFORE UPDATE ON renter_payment_methods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();