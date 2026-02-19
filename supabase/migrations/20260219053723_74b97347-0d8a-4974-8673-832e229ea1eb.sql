
-- Create platform_feedback table
CREATE TABLE IF NOT EXISTS public.platform_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('feature_request', 'bug_report')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  screenshot_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'submitted',
  submitted_by UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  browser_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_feedback ENABLE ROW LEVEL SECURITY;

-- Users can submit their own feedback
CREATE POLICY "Users can insert own feedback"
  ON public.platform_feedback FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.platform_feedback FOR SELECT
  USING (auth.uid() = submitted_by);

-- Platform admins can view all feedback
CREATE POLICY "Platform admins can view all feedback"
  ON public.platform_feedback FOR SELECT
  USING (public.is_platform_user(auth.uid()));

-- Platform admins can update feedback
CREATE POLICY "Platform admins can update feedback"
  ON public.platform_feedback FOR UPDATE
  USING (public.is_platform_user(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_platform_feedback_updated_at
  BEFORE UPDATE ON public.platform_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('platform-feedback', 'platform-feedback', true, 5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload feedback screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'platform-feedback');

CREATE POLICY "Anyone can view feedback screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'platform-feedback');
