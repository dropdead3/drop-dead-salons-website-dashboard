-- Create table for location-specific work schedules
CREATE TABLE public.employee_location_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    location_id TEXT NOT NULL,
    work_days TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, location_id)
);

-- Enable RLS
ALTER TABLE public.employee_location_schedules ENABLE ROW LEVEL SECURITY;

-- Users can view their own schedules
CREATE POLICY "Users can view own schedules"
ON public.employee_location_schedules
FOR SELECT
USING (auth.uid() = user_id);

-- Leadership can view all schedules at their locations
CREATE POLICY "Leadership can view location schedules"
ON public.employee_location_schedules
FOR SELECT
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
);

-- Users can update their own schedules
CREATE POLICY "Users can update own schedules"
ON public.employee_location_schedules
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own schedules
CREATE POLICY "Users can insert own schedules"
ON public.employee_location_schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create table for schedule change requests
CREATE TABLE public.schedule_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    location_id TEXT NOT NULL,
    current_days TEXT[] DEFAULT '{}',
    requested_days TEXT[] NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_change_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.schedule_change_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Leadership can view all requests
CREATE POLICY "Leadership can view all requests"
ON public.schedule_change_requests
FOR SELECT
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
);

-- Users can create requests
CREATE POLICY "Users can create requests"
ON public.schedule_change_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Leadership can update requests (approve/deny)
CREATE POLICY "Leadership can update requests"
ON public.schedule_change_requests
FOR UPDATE
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
);

-- Add trigger for updated_at
CREATE TRIGGER update_employee_location_schedules_updated_at
BEFORE UPDATE ON public.employee_location_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_change_requests_updated_at
BEFORE UPDATE ON public.schedule_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();