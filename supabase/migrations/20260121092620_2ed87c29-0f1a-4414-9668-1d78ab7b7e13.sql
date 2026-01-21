-- Create program_outcomes table for storing the 4 outcome cards
CREATE TABLE public.program_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT 'sparkles',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.program_outcomes ENABLE ROW LEVEL SECURITY;

-- Create policies for viewing (everyone can view active outcomes)
CREATE POLICY "Anyone can view active outcomes" 
ON public.program_outcomes 
FOR SELECT 
USING (is_active = true);

-- Create policy for admins to manage outcomes
CREATE POLICY "Admins can manage outcomes" 
ON public.program_outcomes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.employee_profiles 
    WHERE employee_profiles.user_id = auth.uid() 
    AND employee_profiles.is_super_admin = true
  )
);

-- Insert default outcome cards
INSERT INTO public.program_outcomes (icon, title, description, display_order) VALUES
('sparkles', 'Consistent Content Creation', 'Build the habit of daily content that attracts your ideal clients', 1),
('trending-up', 'Increased Bookings', 'Convert more leads into paying clients with proven follow-up systems', 2),
('users', 'Stronger Client Relationships', 'Master communication that builds loyalty and referrals', 3),
('award', 'Professional Growth', 'Develop discipline and skills that set you apart in the industry', 4);

-- Create trigger for updating timestamps
CREATE TRIGGER update_program_outcomes_updated_at
BEFORE UPDATE ON public.program_outcomes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();