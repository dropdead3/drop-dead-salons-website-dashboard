-- Create table for business card requests
CREATE TABLE public.business_card_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  design_style TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.business_card_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own business card requests"
ON public.business_card_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create their own business card requests"
ON public.business_card_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all business card requests"
ON public.business_card_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Admins can update requests
CREATE POLICY "Admins can update business card requests"
ON public.business_card_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Create table for onboarding task completions
CREATE TABLE public.onboarding_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_key TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_key)
);

-- Enable RLS
ALTER TABLE public.onboarding_task_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view their own task completions"
ON public.onboarding_task_completions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert their own task completions"
ON public.onboarding_task_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own completions (to uncheck)
CREATE POLICY "Users can delete their own task completions"
ON public.onboarding_task_completions
FOR DELETE
USING (auth.uid() = user_id);