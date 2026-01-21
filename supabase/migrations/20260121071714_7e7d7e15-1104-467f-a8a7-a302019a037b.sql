-- Add grace period configuration to program_configuration
ALTER TABLE public.program_configuration
ADD COLUMN IF NOT EXISTS grace_period_hours integer NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS life_happens_passes_total integer NOT NULL DEFAULT 2;

-- Create pass usage history table
CREATE TABLE public.pass_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.stylist_program_enrollment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  day_missed INTEGER NOT NULL,
  current_day_at_use INTEGER NOT NULL,
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID,
  restore_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pass_usage_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own pass history
CREATE POLICY "Users can view own pass history"
ON public.pass_usage_history
FOR SELECT
USING (auth.uid() = user_id);

-- Leadership can view all pass history (admin or manager)
CREATE POLICY "Leadership can view all pass history"
ON public.pass_usage_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Users can insert their own pass usage
CREATE POLICY "Users can insert own pass history"
ON public.pass_usage_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Leadership can update (for restores)
CREATE POLICY "Leadership can update pass history"
ON public.pass_usage_history
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Add indexes for faster lookups
CREATE INDEX idx_pass_usage_enrollment ON public.pass_usage_history(enrollment_id);
CREATE INDEX idx_pass_usage_user ON public.pass_usage_history(user_id);