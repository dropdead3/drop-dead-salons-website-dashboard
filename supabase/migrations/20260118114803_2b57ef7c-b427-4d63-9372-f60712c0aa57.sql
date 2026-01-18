-- Create handbook acknowledgments table
CREATE TABLE public.handbook_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    handbook_id UUID NOT NULL REFERENCES public.handbooks(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, handbook_id)
);

-- Enable RLS
ALTER TABLE public.handbook_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Users can view their own acknowledgments
CREATE POLICY "Users can view own acknowledgments"
ON public.handbook_acknowledgments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own acknowledgments
CREATE POLICY "Users can acknowledge handbooks"
ON public.handbook_acknowledgments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Coaches can view all acknowledgments for team oversight
CREATE POLICY "Coaches can view all acknowledgments"
ON public.handbook_acknowledgments
FOR SELECT
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));