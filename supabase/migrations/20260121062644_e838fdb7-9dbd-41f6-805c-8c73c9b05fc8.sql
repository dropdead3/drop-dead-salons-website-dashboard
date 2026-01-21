-- Create program_weeks table for weekly themes and objectives
CREATE TABLE public.program_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  start_day INTEGER NOT NULL,
  end_day INTEGER NOT NULL,
  video_url TEXT,
  resources_json JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_assignments table for unique tasks per week
CREATE TABLE public.weekly_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'task',
  proof_type TEXT NOT NULL DEFAULT 'none',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_assignment_completions table for tracking user progress
CREATE TABLE public.weekly_assignment_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.stylist_program_enrollment(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.weekly_assignments(id) ON DELETE CASCADE,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, assignment_id)
);

-- Enable RLS
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_assignment_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for program_weeks
CREATE POLICY "Authenticated users can view active weeks"
  ON public.program_weeks
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Super admins can manage weeks"
  ON public.program_weeks
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.user_id = auth.uid()
    AND employee_profiles.is_super_admin = true
  ));

-- RLS policies for weekly_assignments
CREATE POLICY "Authenticated users can view active assignments"
  ON public.weekly_assignments
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Super admins can manage assignments"
  ON public.weekly_assignments
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.user_id = auth.uid()
    AND employee_profiles.is_super_admin = true
  ));

-- RLS policies for weekly_assignment_completions
CREATE POLICY "Users can view own completions"
  ON public.weekly_assignment_completions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM stylist_program_enrollment spe
    WHERE spe.id = weekly_assignment_completions.enrollment_id
    AND (spe.user_id = auth.uid() OR current_user_is_coach())
  ));

CREATE POLICY "Users can insert own completions"
  ON public.weekly_assignment_completions
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM stylist_program_enrollment spe
    WHERE spe.id = weekly_assignment_completions.enrollment_id
    AND spe.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own completions"
  ON public.weekly_assignment_completions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM stylist_program_enrollment spe
    WHERE spe.id = weekly_assignment_completions.enrollment_id
    AND (spe.user_id = auth.uid() OR current_user_is_coach())
  ));

-- Add update triggers
CREATE TRIGGER update_program_weeks_updated_at
  BEFORE UPDATE ON public.program_weeks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_assignments_updated_at
  BEFORE UPDATE ON public.weekly_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_assignment_completions_updated_at
  BEFORE UPDATE ON public.weekly_assignment_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default weeks (11 weeks for 75 days)
INSERT INTO public.program_weeks (week_number, title, description, objective, start_day, end_day, display_order) VALUES
(1, 'Foundation Building', 'Set up your content pillars and define your ideal client avatar. This week is about laying the groundwork for everything that follows.', 'Complete your client avatar document and identify 3 content pillars', 1, 7, 1),
(2, 'Content Creation Basics', 'Master the fundamentals of storytelling and carousel creation. Learn what makes content resonate with your ideal clients.', 'Create your first content batch using proven frameworks', 8, 14, 2),
(3, 'DM Mastery', 'Perfect your direct message strategy. Learn how to start conversations that convert without being salesy.', 'Develop your signature DM scripts and practice conversations', 15, 21, 3),
(4, 'Lead Generation', 'Build your outreach strategy and create systems for consistent lead flow.', 'Implement your daily outreach routine and track results', 22, 28, 4),
(5, 'Client Retention', 'Focus on keeping clients coming back. Build follow-up systems and rebooking strategies.', 'Create your retention playbook with automated touchpoints', 29, 35, 5),
(6, 'Referral Engine', 'Turn happy clients into your best marketers. Design referral incentives and perfect your ask scripts.', 'Launch your referral program and get your first referral', 36, 42, 6),
(7, 'Advanced Content', 'Level up with Reels strategy, trending audio, and algorithm optimization.', 'Create 3 Reels using trending formats', 43, 49, 7),
(8, 'Conversion Optimization', 'Improve your booking flow and reduce no-shows. Fine-tune the client journey.', 'Audit and improve your booking-to-appointment flow', 50, 56, 8),
(9, 'Pricing & Value', 'Position yourself as premium. Master upselling and value communication.', 'Review and optimize your pricing strategy', 57, 63, 9),
(10, 'Systems & Automation', 'Streamline repetitive tasks and free up time for high-value activities.', 'Automate at least 3 recurring tasks in your business', 64, 70, 10),
(11, 'Momentum & Growth', 'Scale what''s working and plan your next 90 days. Celebrate your transformation!', 'Create your 90-day growth roadmap', 71, 75, 11);

-- Insert sample weekly assignments for Week 1
INSERT INTO public.weekly_assignments (week_id, title, description, assignment_type, proof_type, display_order, is_required) VALUES
((SELECT id FROM public.program_weeks WHERE week_number = 1), 'Complete Client Avatar Worksheet', 'Download and fill out the client avatar worksheet. Be as specific as possible about your ideal client''s demographics, pain points, and desires.', 'worksheet', 'file', 1, true),
((SELECT id FROM public.program_weeks WHERE week_number = 1), 'Watch Foundation Training Video', 'Watch the 30-minute foundation training video that covers the core principles of the Client Engine system.', 'video', 'none', 2, true),
((SELECT id FROM public.program_weeks WHERE week_number = 1), 'Identify Your 3 Content Pillars', 'Based on your client avatar, define 3 content pillars that will guide all your content creation. These should align with your ideal client''s interests and your expertise.', 'task', 'text', 3, true),
((SELECT id FROM public.program_weeks WHERE week_number = 1), 'Audit Your Current Instagram Bio', 'Review your current bio and identify what needs to change to attract your ideal client. Note specific improvements to make.', 'task', 'screenshot', 4, false);

-- Insert sample weekly assignments for Week 2
INSERT INTO public.weekly_assignments (week_id, title, description, assignment_type, proof_type, display_order, is_required) VALUES
((SELECT id FROM public.program_weeks WHERE week_number = 2), 'Create Content Calendar Template', 'Set up your content calendar using the provided template. Plan out at least 2 weeks of content.', 'worksheet', 'file', 1, true),
((SELECT id FROM public.program_weeks WHERE week_number = 2), 'Create Your First Carousel Post', 'Using the carousel framework from training, create your first educational carousel about one of your content pillars.', 'task', 'screenshot', 2, true),
((SELECT id FROM public.program_weeks WHERE week_number = 2), 'Write 5 Story Hooks', 'Practice writing compelling story hooks using the formulas provided. Save these for future use.', 'task', 'text', 3, true);