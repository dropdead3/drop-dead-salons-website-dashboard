-- Create table for detailed transaction items from CSV export
CREATE TABLE public.phorest_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL,
  phorest_staff_id TEXT,
  stylist_user_id UUID REFERENCES public.employee_profiles(user_id) ON DELETE SET NULL,
  phorest_client_id TEXT,
  client_name TEXT,
  location_id TEXT,
  branch_name TEXT,
  transaction_date DATE NOT NULL,
  item_type TEXT NOT NULL, -- 'service', 'product', 'voucher', 'package'
  item_name TEXT NOT NULL,
  item_category TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2),
  discount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(transaction_id, item_name, item_type)
);

-- Enable RLS
ALTER TABLE public.phorest_transaction_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins and managers can view all, others see their own
CREATE POLICY "Leadership can view all transaction items"
ON public.phorest_transaction_items FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Staff can view their own transaction items"
ON public.phorest_transaction_items FOR SELECT
USING (stylist_user_id = auth.uid());

-- Indexes for common queries
CREATE INDEX idx_transaction_items_date ON public.phorest_transaction_items(transaction_date);
CREATE INDEX idx_transaction_items_staff ON public.phorest_transaction_items(phorest_staff_id);
CREATE INDEX idx_transaction_items_type ON public.phorest_transaction_items(item_type);
CREATE INDEX idx_transaction_items_location ON public.phorest_transaction_items(location_id);

-- Add enhanced columns to sync log for debugging
ALTER TABLE public.phorest_sync_log 
ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
ADD COLUMN IF NOT EXISTS response_sample TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;