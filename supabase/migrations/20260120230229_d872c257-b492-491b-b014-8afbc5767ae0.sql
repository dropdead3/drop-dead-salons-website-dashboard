-- Create job applications table to store all incoming applications
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  instagram TEXT,
  -- Application details
  experience TEXT NOT NULL,
  client_book TEXT NOT NULL,
  specialties TEXT NOT NULL,
  why_drop_dead TEXT NOT NULL,
  message TEXT,
  -- Source tracking
  source TEXT DEFAULT 'website',
  source_detail TEXT,
  -- Pipeline management
  pipeline_stage TEXT NOT NULL DEFAULT 'new',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_starred BOOLEAN DEFAULT false,
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  -- Soft delete
  is_archived BOOLEAN DEFAULT false
);

-- Create notes table for applicant notes
CREATE TABLE public.job_application_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pipeline stages table for customizable stages
CREATE TABLE public.recruiting_pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6b7280',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pipeline stages
INSERT INTO public.recruiting_pipeline_stages (name, slug, color, display_order) VALUES
  ('New', 'new', '#6366f1', 0),
  ('Reviewing', 'reviewing', '#f59e0b', 1),
  ('Phone Screen', 'phone-screen', '#3b82f6', 2),
  ('Interview', 'interview', '#8b5cf6', 3),
  ('Trial Day', 'trial-day', '#ec4899', 4),
  ('Offer', 'offer', '#10b981', 5),
  ('Hired', 'hired', '#22c55e', 6),
  ('Rejected', 'rejected', '#ef4444', 7),
  ('Not Interested', 'not-interested', '#9ca3af', 8);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiting_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_applications
CREATE POLICY "Admins and managers can view all applications"
  ON public.job_applications
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Anyone can insert applications (public form)"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and managers can update applications"
  ON public.job_applications
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete applications"
  ON public.job_applications
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for job_application_notes
CREATE POLICY "Admins and managers can view notes"
  ON public.job_application_notes
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can create notes"
  ON public.job_application_notes
  FOR INSERT
  WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) AND auth.uid() = author_id);

CREATE POLICY "Authors can update their own notes"
  ON public.job_application_notes
  FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own notes"
  ON public.job_application_notes
  FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for recruiting_pipeline_stages
CREATE POLICY "Anyone can view active pipeline stages"
  ON public.recruiting_pipeline_stages
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pipeline stages"
  ON public.recruiting_pipeline_stages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for job_applications
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for job_application_notes
CREATE TRIGGER update_job_application_notes_updated_at
  BEFORE UPDATE ON public.job_application_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_job_applications_stage ON public.job_applications(pipeline_stage);
CREATE INDEX idx_job_applications_created ON public.job_applications(created_at DESC);
CREATE INDEX idx_job_applications_starred ON public.job_applications(is_starred) WHERE is_starred = true;
CREATE INDEX idx_job_application_notes_app ON public.job_application_notes(application_id);