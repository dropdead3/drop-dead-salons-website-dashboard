-- =============================================
-- KIOSK CLIENT CHECK-IN SYSTEM
-- Phase 1: Foundation Tables and Infrastructure
-- =============================================

-- Organization Kiosk Settings (per-org, with optional per-location overrides)
CREATE TABLE public.organization_kiosk_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
  
  -- Branding
  logo_url TEXT,
  background_image_url TEXT,
  background_color TEXT DEFAULT '#000000',
  accent_color TEXT DEFAULT '#8B5CF6',
  text_color TEXT DEFAULT '#FFFFFF',
  
  -- Theme
  theme_mode TEXT DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light', 'auto')),
  font_family TEXT DEFAULT 'system',
  button_style TEXT DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'pill', 'square')),
  
  -- Content
  welcome_title TEXT DEFAULT 'Welcome',
  welcome_subtitle TEXT,
  check_in_prompt TEXT DEFAULT 'Please enter your phone number to check in',
  success_message TEXT DEFAULT 'You are checked in! Your stylist has been notified.',
  
  -- Behavior
  idle_timeout_seconds INTEGER DEFAULT 60,
  enable_walk_ins BOOLEAN DEFAULT true,
  require_confirmation_tap BOOLEAN DEFAULT true,
  show_wait_time_estimate BOOLEAN DEFAULT true,
  show_stylist_photo BOOLEAN DEFAULT true,
  enable_feedback_prompt BOOLEAN DEFAULT false,
  require_form_signing BOOLEAN DEFAULT true,
  
  -- Media
  idle_slideshow_images TEXT[] DEFAULT '{}',
  idle_video_url TEXT,
  
  -- Security
  exit_pin TEXT DEFAULT '1234',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one default per org, one override per org+location
  UNIQUE (organization_id, location_id)
);

-- Kiosk Devices for session management
CREATE TABLE public.kiosk_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
  device_name TEXT NOT NULL,
  device_token TEXT UNIQUE NOT NULL DEFAULT public.generate_secure_token(),
  is_active BOOLEAN DEFAULT true,
  last_heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Appointment Check-ins tracking
CREATE TABLE public.appointment_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  phorest_appointment_id TEXT,
  client_id UUID,
  phorest_client_id TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
  
  -- Check-in details
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_in_method TEXT NOT NULL CHECK (check_in_method IN ('kiosk', 'receptionist', 'walk_in', 'online')),
  kiosk_device_id UUID REFERENCES public.kiosk_devices(id) ON DELETE SET NULL,
  kiosk_session_id UUID,
  
  -- Stylist notification tracking
  stylist_user_id UUID,
  stylist_notified_at TIMESTAMPTZ,
  notification_status TEXT DEFAULT 'pending',
  
  -- Form signing
  forms_required BOOLEAN DEFAULT false,
  forms_completed BOOLEAN DEFAULT false,
  forms_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Walk-in Queue for clients without appointments
CREATE TABLE public.walk_in_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
  
  -- Client info (might not be in system)
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  phorest_client_id TEXT,
  
  -- Service request
  service_category TEXT,
  service_notes TEXT,
  
  -- Queue management
  queue_position INTEGER,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'assigned', 'in_service', 'completed', 'cancelled', 'no_show')),
  assigned_stylist_id UUID,
  estimated_wait_minutes INTEGER,
  
  -- Timestamps
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  service_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kiosk Analytics for session tracking
CREATE TABLE public.kiosk_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
  kiosk_device_id UUID REFERENCES public.kiosk_devices(id) ON DELETE SET NULL,
  
  -- Session tracking
  session_id UUID NOT NULL,
  session_started_at TIMESTAMPTZ NOT NULL,
  session_ended_at TIMESTAMPTZ,
  session_completed BOOLEAN DEFAULT false,
  
  -- Check-in details
  client_id TEXT,
  appointment_id UUID,
  check_in_method TEXT CHECK (check_in_method IN ('phone', 'name', 'qr', 'code')),
  is_walk_in BOOLEAN DEFAULT false,
  
  -- Timing metrics
  lookup_duration_seconds INTEGER,
  confirmation_duration_seconds INTEGER,
  form_signing_duration_seconds INTEGER,
  total_duration_seconds INTEGER,
  
  -- Issues
  lookup_attempts INTEGER DEFAULT 1,
  error_occurred BOOLEAN DEFAULT false,
  error_type TEXT,
  abandoned_at_step TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_kiosk_settings_org ON public.organization_kiosk_settings(organization_id);
CREATE INDEX idx_kiosk_settings_location ON public.organization_kiosk_settings(location_id);
CREATE INDEX idx_kiosk_devices_org ON public.kiosk_devices(organization_id);
CREATE INDEX idx_kiosk_devices_token ON public.kiosk_devices(device_token);
CREATE INDEX idx_appointment_checkins_date ON public.appointment_check_ins(checked_in_at);
CREATE INDEX idx_appointment_checkins_appt ON public.appointment_check_ins(appointment_id);
CREATE INDEX idx_walk_in_queue_location ON public.walk_in_queue(location_id, status);
CREATE INDEX idx_kiosk_analytics_org_date ON public.kiosk_analytics(organization_id, created_at);
CREATE INDEX idx_kiosk_analytics_session ON public.kiosk_analytics(session_id);

-- Enable RLS on all tables
ALTER TABLE public.organization_kiosk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_in_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_kiosk_settings
CREATE POLICY "Org members can view kiosk settings" ON public.organization_kiosk_settings
  FOR SELECT USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

CREATE POLICY "Org admins can manage kiosk settings" ON public.organization_kiosk_settings
  FOR ALL USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

-- RLS Policies for kiosk_devices
CREATE POLICY "Org members can view kiosk devices" ON public.kiosk_devices
  FOR SELECT USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

CREATE POLICY "Org admins can manage kiosk devices" ON public.kiosk_devices
  FOR ALL USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

-- RLS Policies for appointment_check_ins
CREATE POLICY "Org members can view check-ins" ON public.appointment_check_ins
  FOR SELECT USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

CREATE POLICY "Org members can create check-ins" ON public.appointment_check_ins
  FOR INSERT WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

CREATE POLICY "Org admins can manage check-ins" ON public.appointment_check_ins
  FOR ALL USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

-- RLS Policies for walk_in_queue
CREATE POLICY "Org members can view walk-in queue" ON public.walk_in_queue
  FOR SELECT USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

CREATE POLICY "Org members can manage walk-in queue" ON public.walk_in_queue
  FOR ALL USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

-- RLS Policies for kiosk_analytics
CREATE POLICY "Org members can view analytics" ON public.kiosk_analytics
  FOR SELECT USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.is_platform_user(auth.uid())
  );

CREATE POLICY "Kiosk can insert analytics" ON public.kiosk_analytics
  FOR INSERT WITH CHECK (true);

-- Update trigger for updated_at columns
CREATE TRIGGER update_kiosk_settings_updated_at
  BEFORE UPDATE ON public.organization_kiosk_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kiosk_devices_updated_at
  BEFORE UPDATE ON public.kiosk_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_walk_in_queue_updated_at
  BEFORE UPDATE ON public.walk_in_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for kiosk assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kiosk-assets', 'kiosk-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kiosk assets
CREATE POLICY "Kiosk assets are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'kiosk-assets');

CREATE POLICY "Org admins can upload kiosk assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kiosk-assets' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Org admins can update kiosk assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'kiosk-assets' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Org admins can delete kiosk assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'kiosk-assets' 
    AND auth.uid() IS NOT NULL
  );

-- Function to get kiosk settings (with location fallback to org default)
CREATE OR REPLACE FUNCTION public.get_kiosk_settings(p_organization_id UUID, p_location_id TEXT DEFAULT NULL)
RETURNS public.organization_kiosk_settings
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.organization_kiosk_settings;
BEGIN
  -- Try location-specific settings first
  IF p_location_id IS NOT NULL THEN
    SELECT * INTO v_settings
    FROM public.organization_kiosk_settings
    WHERE organization_id = p_organization_id
      AND location_id = p_location_id;
    
    IF FOUND THEN
      RETURN v_settings;
    END IF;
  END IF;
  
  -- Fall back to org-level settings (location_id IS NULL)
  SELECT * INTO v_settings
  FROM public.organization_kiosk_settings
  WHERE organization_id = p_organization_id
    AND location_id IS NULL;
  
  RETURN v_settings;
END;
$$;