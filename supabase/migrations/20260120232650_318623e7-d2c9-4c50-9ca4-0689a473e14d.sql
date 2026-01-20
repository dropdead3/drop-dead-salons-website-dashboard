-- Create graduation requirements table
CREATE TABLE public.graduation_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create graduation submissions table (assistant uploads/requests)
CREATE TABLE public.graduation_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.graduation_requirements(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs_revision', 'rejected')),
  proof_url TEXT,
  assistant_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requirement_id, assistant_id)
);

-- Create graduation feedback table (coach notes on submissions)
CREATE TABLE public.graduation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.graduation_submissions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.graduation_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for graduation_requirements
CREATE POLICY "Anyone authenticated can view active requirements"
ON public.graduation_requirements
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage requirements"
ON public.graduation_requirements
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for graduation_submissions
CREATE POLICY "Users can view their own submissions"
ON public.graduation_submissions
FOR SELECT
USING (auth.uid() = assistant_id);

CREATE POLICY "Admins/managers can view all submissions"
ON public.graduation_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can create their own submissions"
ON public.graduation_submissions
FOR INSERT
WITH CHECK (auth.uid() = assistant_id);

CREATE POLICY "Users can update their own pending submissions"
ON public.graduation_submissions
FOR UPDATE
USING (auth.uid() = assistant_id AND status IN ('pending', 'needs_revision'));

CREATE POLICY "Admins/managers can update any submission"
ON public.graduation_submissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for graduation_feedback
CREATE POLICY "Users can view feedback on their submissions"
ON public.graduation_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.graduation_submissions gs 
    WHERE gs.id = submission_id AND gs.assistant_id = auth.uid()
  )
);

CREATE POLICY "Admins/managers can view all feedback"
ON public.graduation_feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins/managers can create feedback"
ON public.graduation_feedback
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Create indexes
CREATE INDEX idx_graduation_submissions_assistant ON public.graduation_submissions(assistant_id);
CREATE INDEX idx_graduation_submissions_requirement ON public.graduation_submissions(requirement_id);
CREATE INDEX idx_graduation_submissions_status ON public.graduation_submissions(status);
CREATE INDEX idx_graduation_feedback_submission ON public.graduation_feedback(submission_id);

-- Add triggers for updated_at
CREATE TRIGGER update_graduation_requirements_updated_at
BEFORE UPDATE ON public.graduation_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_graduation_submissions_updated_at
BEFORE UPDATE ON public.graduation_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default graduation requirements
INSERT INTO public.graduation_requirements (title, description, category, display_order) VALUES
('Extensions Certification', 'Complete Drop Dead Extensions certification program with passing score', 'certification', 1),
('Shampoo Bowl Etiquette Certification', 'Pass shampoo bowl etiquette assessment', 'certification', 2),
('Social Media Optimization Certification', 'Complete social media training and demonstrate proficiency', 'certification', 3),
('100 Assisted Services', 'Log 100 assisted services with stylists', 'experience', 4),
('10 Color Applications (Observed)', 'Complete 10 color applications under stylist supervision', 'experience', 5),
('10 Blowouts (Observed)', 'Complete 10 blowouts under stylist supervision', 'experience', 6),
('5 Haircuts (Observed)', 'Complete 5 haircuts under stylist supervision', 'experience', 7),
('Client Consultation Training', 'Complete client consultation module and pass assessment', 'training', 8),
('Product Knowledge Assessment', 'Pass product knowledge quiz with 90% or higher', 'training', 9),
('Manager Sign-Off', 'Final approval from salon manager for graduation', 'approval', 10);