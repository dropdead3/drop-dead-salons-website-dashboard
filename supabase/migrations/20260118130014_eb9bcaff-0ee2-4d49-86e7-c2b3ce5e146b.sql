-- Create services table for service-based durations
CREATE TABLE public.salon_services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assistant requests table
CREATE TABLE public.assistant_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    stylist_id UUID NOT NULL,
    assistant_id UUID,
    service_id UUID NOT NULL REFERENCES public.salon_services(id),
    client_name TEXT NOT NULL,
    request_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assistant availability for round-robin tracking
CREATE TABLE public.assistant_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assistant_id UUID NOT NULL,
    last_assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    total_assignments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salon_services (viewable by all authenticated, editable by admins)
CREATE POLICY "Services viewable by authenticated users"
ON public.salon_services FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage services"
ON public.salon_services FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assistant_requests
CREATE POLICY "Stylists can view their own requests"
ON public.assistant_requests FOR SELECT TO authenticated
USING (
    stylist_id = auth.uid() 
    OR assistant_id = auth.uid()
    OR public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Stylists can create requests"
ON public.assistant_requests FOR INSERT TO authenticated
WITH CHECK (
    stylist_id = auth.uid() 
    AND public.has_role(auth.uid(), 'stylist')
);

CREATE POLICY "Stylists can update their own pending requests"
ON public.assistant_requests FOR UPDATE TO authenticated
USING (
    (stylist_id = auth.uid() AND status = 'pending')
    OR assistant_id = auth.uid()
    OR public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Stylists can cancel their own requests"
ON public.assistant_requests FOR DELETE TO authenticated
USING (
    stylist_id = auth.uid() AND status = 'pending'
);

-- RLS Policies for assistant_assignments
CREATE POLICY "Assignments viewable by admins and assistants"
ON public.assistant_assignments FOR SELECT TO authenticated
USING (
    assistant_id = auth.uid() 
    OR public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "System can manage assignments"
ON public.assistant_assignments FOR ALL TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- Update triggers
CREATE TRIGGER update_salon_services_updated_at
BEFORE UPDATE ON public.salon_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistant_requests_updated_at
BEFORE UPDATE ON public.assistant_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.salon_services (name, duration_minutes, category) VALUES
('Blowout', 30, 'Styling'),
('Color Application', 45, 'Color'),
('Foil Highlights', 60, 'Color'),
('Balayage', 90, 'Color'),
('Extensions Install', 120, 'Extensions'),
('Extensions Maintenance', 60, 'Extensions'),
('Deep Conditioning', 20, 'Treatment'),
('Shampoo & Style', 30, 'Styling');