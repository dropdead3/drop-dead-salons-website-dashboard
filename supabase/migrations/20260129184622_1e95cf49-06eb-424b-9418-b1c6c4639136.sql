-- =============================================
-- PHASE 1: SCHEMA NORMALIZATION
-- Create standalone tables with import tracking
-- =============================================

-- 1. CLIENTS TABLE (normalized from phorest_clients)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Core client info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  phone TEXT,
  -- Location association (TEXT to match locations.id)
  location_id TEXT REFERENCES public.locations(id),
  -- Stylist preference
  preferred_stylist_id UUID REFERENCES public.employee_profiles(user_id),
  -- Client status & flags
  is_vip BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  -- Metrics (calculated)
  total_spend NUMERIC(10,2) DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visit_date DATE,
  average_spend NUMERIC(10,2) DEFAULT 0,
  -- Import tracking
  external_id TEXT,
  import_source TEXT, -- 'phorest', 'mindbody', 'boulevard', 'vagaro', 'square', 'csv', 'manual'
  imported_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SERVICES TABLE (normalized from phorest_services)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Service info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  -- Pricing & duration
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2),
  -- Location (TEXT to match locations.id, NULL = available at all locations)
  location_id TEXT REFERENCES public.locations(id),
  -- Booking rules
  requires_qualification BOOLEAN DEFAULT false,
  allow_same_day_booking BOOLEAN DEFAULT true,
  lead_time_days INTEGER DEFAULT 0,
  same_day_restriction_reason TEXT,
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  -- Import tracking
  external_id TEXT,
  import_source TEXT,
  imported_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. APPOINTMENTS TABLE (normalized from phorest_appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Location (TEXT to match locations.id)
  location_id TEXT REFERENCES public.locations(id),
  -- Staff (direct reference to user)
  staff_user_id UUID REFERENCES public.employee_profiles(user_id),
  staff_name TEXT, -- Denormalized for display
  -- Client (direct reference)
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT, -- Denormalized for display
  client_email TEXT,
  client_phone TEXT,
  -- Service info
  service_id UUID REFERENCES public.services(id),
  service_name TEXT, -- Denormalized for display
  service_category TEXT,
  -- Scheduling
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER,
  -- Status: pending, confirmed, checked_in, in_progress, completed, cancelled, no_show
  status TEXT DEFAULT 'confirmed',
  -- Pricing
  original_price NUMERIC(10,2),
  total_price NUMERIC(10,2),
  tip_amount NUMERIC(10,2) DEFAULT 0,
  -- Checkout tracking
  rebooked_at_checkout BOOLEAN DEFAULT false,
  payment_method TEXT,
  -- Notes
  notes TEXT,
  client_notes TEXT,
  -- Import tracking
  external_id TEXT,
  import_source TEXT,
  imported_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. STAFF SERVICE QUALIFICATIONS (normalized from phorest_staff_services)
CREATE TABLE IF NOT EXISTS public.staff_service_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.employee_profiles(user_id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  -- Location-specific qualification (TEXT to match locations.id, NULL = qualified at all locations)
  location_id TEXT REFERENCES public.locations(id),
  -- Custom pricing override
  custom_price NUMERIC(10,2),
  -- Status
  is_active BOOLEAN DEFAULT true,
  -- Import tracking
  external_id TEXT,
  import_source TEXT,
  imported_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Unique constraint
  UNIQUE(user_id, service_id, location_id)
);

-- 5. CREATE INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_clients_location ON public.clients(location_id);
CREATE INDEX IF NOT EXISTS idx_clients_preferred_stylist ON public.clients(preferred_stylist_id);
CREATE INDEX IF NOT EXISTS idx_clients_external_id ON public.clients(external_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_services_location ON public.services(location_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_external_id ON public.services(external_id);

CREATE INDEX IF NOT EXISTS idx_appointments_location ON public.appointments(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON public.appointments(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_external_id ON public.appointments(external_id);

CREATE INDEX IF NOT EXISTS idx_staff_qualifications_user ON public.staff_service_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_service ON public.staff_service_qualifications(service_id);

-- 6. ENABLE RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_service_qualifications ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR CLIENTS
-- Admins/Managers/Receptionists can see all clients
CREATE POLICY "Admin roles can view all clients" ON public.clients
  FOR SELECT USING (public.can_view_all_clients(auth.uid()));

-- Stylists can see their assigned clients
CREATE POLICY "Stylists can view their clients" ON public.clients
  FOR SELECT USING (preferred_stylist_id = auth.uid());

-- Admin roles can manage clients
CREATE POLICY "Admin roles can manage clients" ON public.clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'super_admin', 'receptionist')
    )
  );

-- 8. RLS POLICIES FOR SERVICES
-- All authenticated users can view active services
CREATE POLICY "Authenticated users can view services" ON public.services
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin roles can manage services
CREATE POLICY "Admin roles can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'super_admin')
    )
  );

-- 9. RLS POLICIES FOR APPOINTMENTS
-- Admin roles can view all appointments
CREATE POLICY "Admin roles can view all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'super_admin', 'receptionist')
    )
  );

-- Stylists can view their own appointments
CREATE POLICY "Stylists can view own appointments" ON public.appointments
  FOR SELECT USING (staff_user_id = auth.uid());

-- Admin roles can manage all appointments
CREATE POLICY "Admin roles can manage appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'super_admin', 'receptionist')
    )
  );

-- 10. RLS POLICIES FOR STAFF QUALIFICATIONS
-- Authenticated users can view qualifications
CREATE POLICY "Authenticated users can view qualifications" ON public.staff_service_qualifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin roles can manage qualifications
CREATE POLICY "Admin roles can manage qualifications" ON public.staff_service_qualifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager', 'super_admin')
    )
  );

-- 11. UPDATE TRIGGERS
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();