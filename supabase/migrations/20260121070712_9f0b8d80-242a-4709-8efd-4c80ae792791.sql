-- Add forgive me credits tracking to enrollment
ALTER TABLE public.stylist_program_enrollment
ADD COLUMN forgive_credits_remaining integer NOT NULL DEFAULT 2,
ADD COLUMN forgive_credits_used integer NOT NULL DEFAULT 0,
ADD COLUMN last_credit_used_at timestamp with time zone;

-- Create pause requests table
CREATE TABLE public.program_pause_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.stylist_program_enrollment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  requested_duration_days INTEGER NOT NULL DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, denied
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewer_notes TEXT,
  pause_start_date DATE,
  pause_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_pause_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own pause requests
CREATE POLICY "Users can view own pause requests"
ON public.program_pause_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own pause requests
CREATE POLICY "Users can create own pause requests"
ON public.program_pause_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Leadership (admin/manager) can view all pause requests
CREATE POLICY "Leadership can view all pause requests"
ON public.program_pause_requests
FOR SELECT
USING (public.is_coach_or_admin(auth.uid()));

-- Leadership can update pause requests (approve/deny)
CREATE POLICY "Leadership can update pause requests"
ON public.program_pause_requests
FOR UPDATE
USING (public.is_coach_or_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_pause_requests_updated_at
BEFORE UPDATE ON public.program_pause_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();