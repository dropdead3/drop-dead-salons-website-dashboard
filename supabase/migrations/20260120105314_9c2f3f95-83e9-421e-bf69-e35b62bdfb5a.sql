-- Create table to store weekly leaderboard snapshots
CREATE TABLE public.leaderboard_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  overall_rank INTEGER NOT NULL,
  overall_score NUMERIC(5,2) NOT NULL,
  new_clients_rank INTEGER,
  new_clients_value INTEGER,
  retention_rank INTEGER,
  retention_value NUMERIC(5,2),
  retail_rank INTEGER,
  retail_value NUMERIC(10,2),
  extensions_rank INTEGER,
  extensions_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.leaderboard_history ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all history (leaderboard is public within team)
CREATE POLICY "Authenticated users can view leaderboard history"
ON public.leaderboard_history
FOR SELECT
TO authenticated
USING (true);

-- Only admins/managers can insert history snapshots
CREATE POLICY "Admins can manage leaderboard history"
ON public.leaderboard_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Create index for efficient queries
CREATE INDEX idx_leaderboard_history_user_week ON public.leaderboard_history(user_id, week_start DESC);
CREATE INDEX idx_leaderboard_history_week ON public.leaderboard_history(week_start DESC);