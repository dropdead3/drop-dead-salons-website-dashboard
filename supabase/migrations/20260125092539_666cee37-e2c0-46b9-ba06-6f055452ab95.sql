-- Create inquiry source enum
CREATE TYPE public.inquiry_source AS ENUM (
  'website_form',
  'google_business',
  'facebook_lead',
  'instagram_lead',
  'phone_call',
  'walk_in',
  'referral',
  'other'
);

-- Create inquiry status enum
CREATE TYPE public.inquiry_status AS ENUM (
  'new',
  'contacted',
  'assigned',
  'consultation_booked',
  'converted',
  'lost'
);

-- Create salon_inquiries table
CREATE TABLE public.salon_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source inquiry_source NOT NULL DEFAULT 'website_form',
  source_detail TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_location TEXT,
  preferred_service TEXT,
  preferred_stylist TEXT,
  message TEXT,
  status inquiry_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.employee_profiles(user_id),
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES public.employee_profiles(user_id),
  response_time_seconds INTEGER,
  consultation_booked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  first_service_revenue NUMERIC(10,2),
  phorest_client_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inquiry activity log table
CREATE TABLE public.inquiry_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.salon_inquiries(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES public.employee_profiles(user_id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.salon_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for salon_inquiries
-- Managers and admins can view all inquiries
CREATE POLICY "Management can view all inquiries"
ON public.salon_inquiries FOR SELECT
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- Stylists can view inquiries assigned to them
CREATE POLICY "Stylists can view assigned inquiries"
ON public.salon_inquiries FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- Stylists can view unassigned inquiries for claiming
CREATE POLICY "Stylists can view unassigned inquiries"
ON public.salon_inquiries FOR SELECT
TO authenticated
USING (
  assigned_to IS NULL 
  AND status = 'new'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('stylist', 'stylist_assistant')
  )
);

-- Management can insert inquiries
CREATE POLICY "Management can insert inquiries"
ON public.salon_inquiries FOR INSERT
TO authenticated
WITH CHECK (public.is_coach_or_admin(auth.uid()));

-- Allow anonymous inserts for website forms
CREATE POLICY "Anyone can submit website inquiries"
ON public.salon_inquiries FOR INSERT
TO anon
WITH CHECK (source = 'website_form');

-- Allow authenticated users to insert (for website forms when logged in)
CREATE POLICY "Authenticated can submit inquiries"
ON public.salon_inquiries FOR INSERT
TO authenticated
WITH CHECK (true);

-- Management can update all inquiries
CREATE POLICY "Management can update all inquiries"
ON public.salon_inquiries FOR UPDATE
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- Stylists can update their assigned inquiries
CREATE POLICY "Stylists can update assigned inquiries"
ON public.salon_inquiries FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid());

-- Stylists can claim unassigned inquiries
CREATE POLICY "Stylists can claim unassigned inquiries"
ON public.salon_inquiries FOR UPDATE
TO authenticated
USING (
  assigned_to IS NULL 
  AND status = 'new'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('stylist', 'stylist_assistant')
  )
);

-- Management can delete inquiries
CREATE POLICY "Management can delete inquiries"
ON public.salon_inquiries FOR DELETE
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- RLS policies for inquiry_activity_log
CREATE POLICY "Management can view all activity"
ON public.inquiry_activity_log FOR SELECT
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can view activity for their inquiries"
ON public.inquiry_activity_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.salon_inquiries 
    WHERE id = inquiry_id 
    AND assigned_to = auth.uid()
  )
);

CREATE POLICY "Authenticated can insert activity"
ON public.inquiry_activity_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_salon_inquiries_updated_at
BEFORE UPDATE ON public.salon_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_salon_inquiries_status ON public.salon_inquiries(status);
CREATE INDEX idx_salon_inquiries_assigned_to ON public.salon_inquiries(assigned_to);
CREATE INDEX idx_salon_inquiries_source ON public.salon_inquiries(source);
CREATE INDEX idx_salon_inquiries_created_at ON public.salon_inquiries(created_at DESC);
CREATE INDEX idx_inquiry_activity_log_inquiry_id ON public.inquiry_activity_log(inquiry_id);