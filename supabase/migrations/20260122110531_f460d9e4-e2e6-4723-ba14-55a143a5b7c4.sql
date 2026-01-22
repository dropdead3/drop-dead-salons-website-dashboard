-- Create phorest_staff_mapping table to link Phorest staff IDs to dashboard users
CREATE TABLE public.phorest_staff_mapping (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.employee_profiles(user_id) ON DELETE CASCADE,
    phorest_staff_id TEXT NOT NULL UNIQUE,
    phorest_staff_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create phorest_performance_metrics table for weekly performance data
CREATE TABLE public.phorest_performance_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.employee_profiles(user_id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    new_clients INTEGER NOT NULL DEFAULT 0,
    retention_rate DECIMAL(5,2) DEFAULT 0,
    retail_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
    extension_clients INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    service_count INTEGER NOT NULL DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    rebooking_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, week_start)
);

-- Create phorest_appointments table for real-time appointment data
CREATE TABLE public.phorest_appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phorest_id TEXT NOT NULL UNIQUE,
    stylist_user_id UUID REFERENCES public.employee_profiles(user_id) ON DELETE SET NULL,
    phorest_staff_id TEXT,
    client_name TEXT,
    client_phone TEXT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    service_name TEXT,
    service_category TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
    notes TEXT,
    total_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phorest_clients table for client profiles and insights
CREATE TABLE public.phorest_clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phorest_client_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    visit_count INTEGER NOT NULL DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    first_visit TIMESTAMP WITH TIME ZONE,
    preferred_stylist_id UUID REFERENCES public.employee_profiles(user_id) ON DELETE SET NULL,
    preferred_services TEXT[],
    total_spend DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_vip BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create phorest_sync_log table to track sync operations
CREATE TABLE public.phorest_sync_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    records_synced INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'running',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX idx_phorest_appointments_date ON public.phorest_appointments(appointment_date);
CREATE INDEX idx_phorest_appointments_stylist ON public.phorest_appointments(stylist_user_id);
CREATE INDEX idx_phorest_appointments_status ON public.phorest_appointments(status);
CREATE INDEX idx_phorest_performance_week ON public.phorest_performance_metrics(week_start);
CREATE INDEX idx_phorest_performance_user ON public.phorest_performance_metrics(user_id);
CREATE INDEX idx_phorest_clients_last_visit ON public.phorest_clients(last_visit);
CREATE INDEX idx_phorest_sync_log_type_status ON public.phorest_sync_log(sync_type, status);

-- Enable RLS on all tables
ALTER TABLE public.phorest_staff_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phorest_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phorest_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phorest_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phorest_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phorest_staff_mapping
CREATE POLICY "Admins can manage staff mappings"
ON public.phorest_staff_mapping
FOR ALL
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can view their own mapping"
ON public.phorest_staff_mapping
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for phorest_performance_metrics
CREATE POLICY "Admins can manage performance metrics"
ON public.phorest_performance_metrics
FOR ALL
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can view their own metrics"
ON public.phorest_performance_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "All authenticated users can view metrics for leaderboard"
ON public.phorest_performance_metrics
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for phorest_appointments
CREATE POLICY "Admins can manage appointments"
ON public.phorest_appointments
FOR ALL
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can view their own appointments"
ON public.phorest_appointments
FOR SELECT
USING (auth.uid() = stylist_user_id);

CREATE POLICY "Authenticated users can view appointments for scheduling"
ON public.phorest_appointments
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for phorest_clients
CREATE POLICY "Admins can manage clients"
ON public.phorest_clients
FOR ALL
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Stylists can view clients they serve"
ON public.phorest_clients
FOR SELECT
USING (auth.uid() = preferred_stylist_id OR auth.uid() IS NOT NULL);

-- RLS Policies for phorest_sync_log
CREATE POLICY "Admins can manage sync logs"
ON public.phorest_sync_log
FOR ALL
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can view sync status"
ON public.phorest_sync_log
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at columns
CREATE TRIGGER update_phorest_staff_mapping_updated_at
BEFORE UPDATE ON public.phorest_staff_mapping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phorest_performance_metrics_updated_at
BEFORE UPDATE ON public.phorest_performance_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phorest_appointments_updated_at
BEFORE UPDATE ON public.phorest_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phorest_clients_updated_at
BEFORE UPDATE ON public.phorest_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.phorest_performance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.phorest_appointments;