-- Create staff_strikes table for write-ups, complaints, red flags, issues
CREATE TABLE public.staff_strikes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_by UUID NOT NULL,
  strike_type TEXT NOT NULL CHECK (strike_type IN ('write_up', 'complaint', 'red_flag', 'warning', 'issue', 'other')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.staff_strikes ENABLE ROW LEVEL SECURITY;

-- Only admins can view staff strikes
CREATE POLICY "Admins can view all staff strikes"
ON public.staff_strikes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can create staff strikes
CREATE POLICY "Admins can create staff strikes"
ON public.staff_strikes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can update staff strikes
CREATE POLICY "Admins can update staff strikes"
ON public.staff_strikes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only admins can delete staff strikes
CREATE POLICY "Admins can delete staff strikes"
ON public.staff_strikes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_staff_strikes_updated_at
BEFORE UPDATE ON public.staff_strikes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups by user
CREATE INDEX idx_staff_strikes_user_id ON public.staff_strikes(user_id);
CREATE INDEX idx_staff_strikes_created_at ON public.staff_strikes(created_at DESC);