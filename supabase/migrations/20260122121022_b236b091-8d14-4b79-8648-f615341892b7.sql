-- Create table for individual sales transactions
CREATE TABLE public.phorest_sales_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phorest_transaction_id TEXT NOT NULL,
  stylist_user_id UUID REFERENCES public.employee_profiles(user_id),
  phorest_staff_id TEXT,
  location_id TEXT,
  branch_name TEXT,
  transaction_date DATE NOT NULL,
  transaction_time TIME,
  client_name TEXT,
  client_phone TEXT,
  item_type TEXT NOT NULL, -- 'service', 'product', 'voucher', 'course'
  item_name TEXT NOT NULL,
  item_category TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2),
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(phorest_transaction_id, item_name)
);

-- Create table for daily sales summaries
CREATE TABLE public.phorest_daily_sales_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.employee_profiles(user_id),
  location_id TEXT,
  branch_name TEXT,
  summary_date DATE NOT NULL,
  total_services INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  service_revenue NUMERIC(10,2) DEFAULT 0,
  product_revenue NUMERIC(10,2) DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  average_ticket NUMERIC(10,2) DEFAULT 0,
  total_discounts NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, location_id, summary_date)
);

-- Enable RLS
ALTER TABLE public.phorest_sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phorest_daily_sales_summary ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions - admins/managers can see all, stylists see their own
CREATE POLICY "Admins can view all transactions"
ON public.phorest_sales_transactions FOR SELECT
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Stylists can view own transactions"
ON public.phorest_sales_transactions FOR SELECT
USING (auth.uid() = stylist_user_id);

-- RLS policies for summaries
CREATE POLICY "Admins can view all summaries"
ON public.phorest_daily_sales_summary FOR SELECT
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Stylists can view own summaries"
ON public.phorest_daily_sales_summary FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_phorest_transactions_date ON public.phorest_sales_transactions(transaction_date);
CREATE INDEX idx_phorest_transactions_stylist ON public.phorest_sales_transactions(stylist_user_id);
CREATE INDEX idx_phorest_transactions_type ON public.phorest_sales_transactions(item_type);
CREATE INDEX idx_phorest_summary_date ON public.phorest_daily_sales_summary(summary_date);
CREATE INDEX idx_phorest_summary_user ON public.phorest_daily_sales_summary(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_phorest_transactions_updated_at
BEFORE UPDATE ON public.phorest_sales_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phorest_summary_updated_at
BEFORE UPDATE ON public.phorest_daily_sales_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();