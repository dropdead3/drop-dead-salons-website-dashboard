-- Create headshot requests table
CREATE TABLE public.headshot_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_date DATE,
  scheduled_time TEXT,
  scheduled_location TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.headshot_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own headshot requests"
ON public.headshot_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create their own headshot requests"
ON public.headshot_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins and managers can view all requests
CREATE POLICY "Admins can view all headshot requests"
ON public.headshot_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Admins and managers can update requests
CREATE POLICY "Admins can update headshot requests"
ON public.headshot_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Create trigger for updated_at
CREATE TRIGGER update_headshot_requests_updated_at
BEFORE UPDATE ON public.headshot_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();