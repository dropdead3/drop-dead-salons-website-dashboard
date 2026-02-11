
-- Table to persist saved recovery plans with optional reminders
CREATE TABLE public.saved_recovery_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  goal_period TEXT NOT NULL DEFAULT 'monthly',
  target_revenue NUMERIC,
  current_revenue NUMERIC,
  shortfall NUMERIC,
  reminder_date TIMESTAMPTZ,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_recovery_plans ENABLE ROW LEVEL SECURITY;

-- Users can only see their own plans
CREATE POLICY "Users can view own recovery plans"
  ON public.saved_recovery_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recovery plans"
  ON public.saved_recovery_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recovery plans"
  ON public.saved_recovery_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recovery plans"
  ON public.saved_recovery_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_recovery_plans_updated_at
  BEFORE UPDATE ON public.saved_recovery_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
