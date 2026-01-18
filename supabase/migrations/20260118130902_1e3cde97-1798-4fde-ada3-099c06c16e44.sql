-- Create table for 1:1 meeting bookings
CREATE TABLE public.one_on_one_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  meeting_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  meeting_type TEXT DEFAULT 'coaching' CHECK (meeting_type IN ('coaching', 'check_in', 'feedback', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.one_on_one_meetings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own meeting requests
CREATE POLICY "Users can view their own meetings"
ON public.one_on_one_meetings
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id OR 
  auth.uid() = coach_id OR
  public.is_coach_or_admin(auth.uid())
);

-- Policy: Users can create their own meeting requests
CREATE POLICY "Users can create their own meetings"
ON public.one_on_one_meetings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- Policy: Coaches can update meetings assigned to them
CREATE POLICY "Coaches can update meetings"
ON public.one_on_one_meetings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = coach_id OR
  public.is_coach_or_admin(auth.uid())
);

-- Policy: Users can cancel their own meetings
CREATE POLICY "Users can update their own meetings"
ON public.one_on_one_meetings
FOR UPDATE
TO authenticated
USING (auth.uid() = requester_id);

-- Create trigger for updated_at
CREATE TRIGGER update_one_on_one_meetings_updated_at
BEFORE UPDATE ON public.one_on_one_meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();