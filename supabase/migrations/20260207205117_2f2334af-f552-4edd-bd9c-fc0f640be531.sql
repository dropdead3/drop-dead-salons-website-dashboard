-- Create meeting_requests table for manager-initiated meeting requests
CREATE TABLE public.meeting_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL,
  team_member_id UUID NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'cancelled', 'expired')),
  linked_meeting_id UUID REFERENCES public.one_on_one_meetings(id) ON DELETE SET NULL,
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_requests;

-- RLS Policies

-- Managers can view their own requests
CREATE POLICY "Managers can view own requests"
ON public.meeting_requests
FOR SELECT
USING (manager_id = auth.uid());

-- Team members can view requests for them
CREATE POLICY "Team members can view their requests"
ON public.meeting_requests
FOR SELECT
USING (team_member_id = auth.uid());

-- Coaches/managers can create requests
CREATE POLICY "Coaches can create meeting requests"
ON public.meeting_requests
FOR INSERT
WITH CHECK (
  manager_id = auth.uid() 
  AND public.is_coach_or_admin(auth.uid())
);

-- Managers can update their own requests (cancel)
CREATE POLICY "Managers can update own requests"
ON public.meeting_requests
FOR UPDATE
USING (manager_id = auth.uid());

-- Team members can update requests for them (when scheduling)
CREATE POLICY "Team members can update their requests"
ON public.meeting_requests
FOR UPDATE
USING (team_member_id = auth.uid());

-- Managers can delete their own requests
CREATE POLICY "Managers can delete own requests"
ON public.meeting_requests
FOR DELETE
USING (manager_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_meeting_requests_updated_at
BEFORE UPDATE ON public.meeting_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();