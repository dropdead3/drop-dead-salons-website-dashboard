-- Schedule daily leaderboard updates at 6:00 PM UTC (end of business day in most US time zones)
SELECT cron.schedule(
  'update-sales-leaderboard-daily',
  '0 18 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://vciqmwzgfjxtzagaxgnh.supabase.co/functions/v1/update-sales-leaderboard',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjaXFtd3pnZmp4dHphZ2F4Z25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTU5MjEsImV4cCI6MjA4NDI5MTkyMX0.agRGhYJ9hkdpX1US0DFjmsWlhZeIPfFZEhatrXgqUYA"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Create table for stylist personal goals
CREATE TABLE IF NOT EXISTS public.stylist_personal_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_target NUMERIC(10,2) NOT NULL DEFAULT 0,
  weekly_target NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.stylist_personal_goals ENABLE ROW LEVEL SECURITY;

-- Users can view and edit their own goals
CREATE POLICY "Users can view their own goals" 
  ON public.stylist_personal_goals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
  ON public.stylist_personal_goals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
  ON public.stylist_personal_goals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Admins can view all goals
CREATE POLICY "Admins can view all goals"
  ON public.stylist_personal_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employee_profiles 
      WHERE employee_profiles.user_id = auth.uid() 
      AND employee_profiles.is_super_admin = true
    )
  );

-- Create table for commission tiers
CREATE TABLE IF NOT EXISTS public.commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL,
  min_revenue NUMERIC(10,2) NOT NULL,
  max_revenue NUMERIC(10,2),
  commission_rate NUMERIC(5,4) NOT NULL, -- e.g., 0.4000 for 40%
  applies_to TEXT NOT NULL DEFAULT 'all', -- 'all', 'services', 'products'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can view tiers
CREATE POLICY "Everyone can view commission tiers"
  ON public.commission_tiers
  FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage commission tiers"
  ON public.commission_tiers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employee_profiles 
      WHERE employee_profiles.user_id = auth.uid() 
      AND employee_profiles.is_super_admin = true
    )
  );

-- Insert default commission tiers
INSERT INTO public.commission_tiers (tier_name, min_revenue, max_revenue, commission_rate, applies_to) VALUES
  ('Base', 0, 5000, 0.35, 'services'),
  ('Standard', 5000.01, 10000, 0.40, 'services'),
  ('High Performer', 10000.01, 15000, 0.45, 'services'),
  ('Top Tier', 15000.01, NULL, 0.50, 'services'),
  ('Product Commission', 0, NULL, 0.10, 'products')
ON CONFLICT DO NOTHING;