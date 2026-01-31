-- =============================================
-- TRANSACTIONS, REFUNDS, AND STORE CREDIT SYSTEM
-- =============================================

-- 1. Client Balances Table - Tracks salon credits and gift card balances
CREATE TABLE public.client_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.phorest_clients(id) ON DELETE CASCADE,
  salon_credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (salon_credit_balance >= 0),
  gift_card_balance DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (gift_card_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, client_id)
);

-- 2. Balance Transactions Table - Audit log for all credit/gift card changes
CREATE TABLE public.balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.phorest_clients(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit_issue', 'credit_redemption', 'giftcard_issue', 'giftcard_redemption', 'refund_to_credit', 'refund_to_giftcard', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  balance_type TEXT NOT NULL CHECK (balance_type IN ('salon_credit', 'gift_card')),
  reference_transaction_id TEXT,
  notes TEXT,
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Refund Records Table - Tracks all refund requests and status
CREATE TABLE public.refund_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.phorest_clients(id) ON DELETE SET NULL,
  original_transaction_id TEXT NOT NULL,
  original_transaction_date DATE NOT NULL,
  original_item_name TEXT,
  refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount > 0),
  refund_type TEXT NOT NULL CHECK (refund_type IN ('original_payment', 'salon_credit', 'gift_card')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  reason TEXT,
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Gift Cards Table - For tracking issued gift cards
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  initial_amount DECIMAL(10,2) NOT NULL CHECK (initial_amount > 0),
  current_balance DECIMAL(10,2) NOT NULL CHECK (current_balance >= 0),
  assigned_client_id UUID REFERENCES public.phorest_clients(id) ON DELETE SET NULL,
  purchaser_name TEXT,
  purchaser_email TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- Enable RLS on all tables
ALTER TABLE public.client_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Client Balances Policies
CREATE POLICY "Staff can view client balances" ON public.client_balances
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

CREATE POLICY "Staff can insert client balances" ON public.client_balances
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

CREATE POLICY "Staff can update client balances" ON public.client_balances
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

-- Balance Transactions Policies
CREATE POLICY "Staff can view balance transactions" ON public.balance_transactions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

CREATE POLICY "Staff can insert balance transactions" ON public.balance_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

-- Refund Records Policies
CREATE POLICY "Staff can view refund records" ON public.refund_records
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

CREATE POLICY "Staff can insert refund records" ON public.refund_records
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

CREATE POLICY "Staff can update refund records" ON public.refund_records
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin')
  );

-- Gift Cards Policies
CREATE POLICY "Staff can view gift cards" ON public.gift_cards
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

CREATE POLICY "Staff can insert gift cards" ON public.gift_cards
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Staff can update gift cards" ON public.gift_cards
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin')
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at for client_balances
CREATE TRIGGER update_client_balances_updated_at
  BEFORE UPDATE ON public.client_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- NEW PERMISSIONS
-- =============================================

INSERT INTO public.permissions (name, display_name, description, category) VALUES
  ('view_transactions', 'View Transactions', 'View transaction history and client purchase records', 'finances'),
  ('process_client_refunds', 'Process Client Refunds', 'Issue refunds to clients via credits, gift cards, or original payment', 'finances'),
  ('manage_store_credits', 'Manage Store Credits', 'Issue and adjust salon credit balances for clients', 'finances'),
  ('manage_gift_cards', 'Manage Gift Cards', 'Create, view, and manage gift cards', 'finances')
ON CONFLICT (name) DO NOTHING;

-- Grant default permissions to admin and receptionist roles
INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'admin', id, NULL FROM public.permissions WHERE name IN ('view_transactions', 'process_client_refunds', 'manage_store_credits', 'manage_gift_cards')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'manager', id, NULL FROM public.permissions WHERE name IN ('view_transactions', 'process_client_refunds', 'manage_store_credits', 'manage_gift_cards')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'super_admin', id, NULL FROM public.permissions WHERE name IN ('view_transactions', 'process_client_refunds', 'manage_store_credits', 'manage_gift_cards')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'receptionist', id, NULL FROM public.permissions WHERE name IN ('view_transactions')
ON CONFLICT DO NOTHING;

-- =============================================
-- HELPER FUNCTION: Get or create client balance
-- =============================================

CREATE OR REPLACE FUNCTION public.get_or_create_client_balance(
  p_organization_id UUID,
  p_client_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_id UUID;
BEGIN
  SELECT id INTO v_balance_id
  FROM public.client_balances
  WHERE organization_id = p_organization_id AND client_id = p_client_id;
  
  IF v_balance_id IS NULL THEN
    INSERT INTO public.client_balances (organization_id, client_id)
    VALUES (p_organization_id, p_client_id)
    RETURNING id INTO v_balance_id;
  END IF;
  
  RETURN v_balance_id;
END;
$$;

-- =============================================
-- HELPER FUNCTION: Add to client balance
-- =============================================

CREATE OR REPLACE FUNCTION public.add_to_client_balance(
  p_organization_id UUID,
  p_client_id UUID,
  p_amount DECIMAL(10,2),
  p_balance_type TEXT,
  p_transaction_type TEXT,
  p_reference_transaction_id TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_issued_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Ensure balance record exists
  v_balance_id := public.get_or_create_client_balance(p_organization_id, p_client_id);
  
  -- Update the appropriate balance
  IF p_balance_type = 'salon_credit' THEN
    UPDATE public.client_balances
    SET salon_credit_balance = salon_credit_balance + p_amount,
        updated_at = now()
    WHERE id = v_balance_id;
  ELSIF p_balance_type = 'gift_card' THEN
    UPDATE public.client_balances
    SET gift_card_balance = gift_card_balance + p_amount,
        updated_at = now()
    WHERE id = v_balance_id;
  END IF;
  
  -- Log the transaction
  INSERT INTO public.balance_transactions (
    organization_id, client_id, transaction_type, amount, balance_type,
    reference_transaction_id, notes, issued_by
  ) VALUES (
    p_organization_id, p_client_id, p_transaction_type, p_amount, p_balance_type,
    p_reference_transaction_id, p_notes, COALESCE(p_issued_by, auth.uid())
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;