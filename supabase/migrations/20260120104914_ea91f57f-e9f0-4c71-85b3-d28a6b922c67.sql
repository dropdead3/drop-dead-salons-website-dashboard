-- Create table for leaderboard score weights configuration
CREATE TABLE public.leaderboard_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  new_clients_weight numeric NOT NULL DEFAULT 0.30,
  retention_weight numeric NOT NULL DEFAULT 0.25,
  retail_weight numeric NOT NULL DEFAULT 0.20,
  extensions_weight numeric NOT NULL DEFAULT 0.25,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.leaderboard_weights ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read weights
CREATE POLICY "Authenticated users can view weights"
ON public.leaderboard_weights
FOR SELECT
TO authenticated
USING (true);

-- Only admins can update weights
CREATE POLICY "Admins can update weights"
ON public.leaderboard_weights
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can insert weights
CREATE POLICY "Admins can insert weights"
ON public.leaderboard_weights
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default weights
INSERT INTO public.leaderboard_weights (new_clients_weight, retention_weight, retail_weight, extensions_weight)
VALUES (0.30, 0.25, 0.20, 0.25);

-- Add comment
COMMENT ON TABLE public.leaderboard_weights IS 'Configurable weights for the leaderboard overall score algorithm';