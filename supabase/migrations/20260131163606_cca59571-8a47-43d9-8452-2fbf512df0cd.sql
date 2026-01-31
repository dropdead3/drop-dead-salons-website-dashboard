-- Loyalty Program Settings Table
CREATE TABLE public.loyalty_program_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  is_enabled BOOLEAN DEFAULT false,
  program_name TEXT DEFAULT 'Rewards Program',
  points_per_dollar DECIMAL(10,2) DEFAULT 1.0,
  service_multiplier DECIMAL(10,2) DEFAULT 1.0,
  product_multiplier DECIMAL(10,2) DEFAULT 1.0,
  points_to_dollar_ratio DECIMAL(10,4) DEFAULT 0.01,
  minimum_redemption_points INTEGER DEFAULT 100,
  points_expire BOOLEAN DEFAULT false,
  points_expiration_days INTEGER DEFAULT 365,
  bonus_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Loyalty Points Table
CREATE TABLE public.client_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES phorest_clients(id),
  current_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, client_id)
);

-- Points Transaction Ledger
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES phorest_clients(id),
  transaction_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Loyalty Tiers Configuration
CREATE TABLE public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  tier_name TEXT NOT NULL,
  tier_key TEXT NOT NULL,
  minimum_lifetime_points INTEGER NOT NULL DEFAULT 0,
  points_multiplier DECIMAL(10,2) DEFAULT 1.0,
  perks TEXT[],
  sort_order INTEGER DEFAULT 0,
  color TEXT DEFAULT '#cd7f32',
  icon TEXT DEFAULT 'star',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gift Card Design Settings
CREATE TABLE public.gift_card_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  card_background_color TEXT DEFAULT '#1a1a1a',
  card_text_color TEXT DEFAULT '#ffffff',
  card_accent_color TEXT DEFAULT '#d4af37',
  card_logo_url TEXT,
  print_template TEXT DEFAULT 'elegant',
  include_qr_code BOOLEAN DEFAULT true,
  include_terms BOOLEAN DEFAULT true,
  terms_text TEXT,
  default_expiration_months INTEGER DEFAULT 12,
  suggested_amounts INTEGER[] DEFAULT ARRAY[25, 50, 100, 150, 200],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Physical Card Orders
CREATE TABLE public.gift_card_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  quantity INTEGER NOT NULL,
  card_design TEXT NOT NULL,
  card_stock TEXT DEFAULT 'standard',
  custom_logo_url TEXT,
  custom_message TEXT,
  card_number_prefix TEXT,
  shipping_address JSONB NOT NULL,
  shipping_method TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'pending',
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  tracking_number TEXT,
  estimated_delivery DATE,
  ordered_by UUID NOT NULL REFERENCES auth.users(id),
  ordered_at TIMESTAMPTZ DEFAULT now(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT
);

-- Add new fields to gift_cards table
ALTER TABLE public.gift_cards ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'digital';
ALTER TABLE public.gift_cards ADD COLUMN IF NOT EXISTS design_template TEXT;
ALTER TABLE public.gift_cards ADD COLUMN IF NOT EXISTS custom_message TEXT;
ALTER TABLE public.gift_cards ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;
ALTER TABLE public.gift_cards ADD COLUMN IF NOT EXISTS physical_card_id TEXT;

-- Indexes
CREATE INDEX idx_loyalty_points_client ON client_loyalty_points(organization_id, client_id);
CREATE INDEX idx_points_transactions_client ON points_transactions(organization_id, client_id, created_at DESC);
CREATE INDEX idx_gift_card_orders_org ON gift_card_orders(organization_id, ordered_at DESC);

-- Enable RLS
ALTER TABLE public.loyalty_program_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_program_settings
CREATE POLICY "Org admins can manage loyalty settings" ON loyalty_program_settings
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'))
  );

CREATE POLICY "Staff can view loyalty settings" ON loyalty_program_settings
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

-- RLS Policies for client_loyalty_points
CREATE POLICY "Staff can view client points" ON client_loyalty_points
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage client points" ON client_loyalty_points
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- RLS Policies for points_transactions
CREATE POLICY "Staff can view points transactions" ON points_transactions
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Staff can create points transactions" ON points_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

-- RLS Policies for loyalty_tiers
CREATE POLICY "Staff can view tiers" ON loyalty_tiers
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage tiers" ON loyalty_tiers
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- RLS Policies for gift_card_settings
CREATE POLICY "Staff can view gift card settings" ON gift_card_settings
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage gift card settings" ON gift_card_settings
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_org(auth.uid(), organization_id) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- RLS Policies for gift_card_orders
CREATE POLICY "Staff can view gift card orders" ON gift_card_orders
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Staff can create orders" ON gift_card_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_belongs_to_org(auth.uid(), organization_id) AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'super_admin'))
  );

-- Add new permissions
INSERT INTO public.permissions (name, display_name, description, category)
VALUES 
  ('manage_loyalty_program', 'Manage Loyalty Program', 'Configure loyalty points rules and tiers', 'Operations'),
  ('manage_gift_card_design', 'Manage Gift Card Design', 'Customize gift card appearance and branding', 'Operations'),
  ('order_physical_cards', 'Order Physical Cards', 'Order custom printed gift cards', 'Operations')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT r.name::app_role, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('admin', 'manager', 'super_admin')
AND p.name IN ('manage_loyalty_program', 'manage_gift_card_design', 'order_physical_cards')
ON CONFLICT DO NOTHING;