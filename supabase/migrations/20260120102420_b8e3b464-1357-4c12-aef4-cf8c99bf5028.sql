-- Create table for configurable onboarding tasks
CREATE TABLE public.onboarding_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  visible_to_roles public.app_role[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active tasks
CREATE POLICY "Users can view active onboarding tasks"
ON public.onboarding_tasks
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can manage all tasks
CREATE POLICY "Admins can manage onboarding tasks"
ON public.onboarding_tasks
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Create trigger for updated_at
CREATE TRIGGER update_onboarding_tasks_updated_at
BEFORE UPDATE ON public.onboarding_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default onboarding tasks for common roles
INSERT INTO public.onboarding_tasks (title, description, visible_to_roles, display_order) VALUES
('Complete your profile information', 'Fill out all required fields in your profile', ARRAY['stylist', 'assistant', 'receptionist', 'stylist_assistant', 'admin_assistant', 'operations_assistant']::public.app_role[], 1),
('Upload a professional photo', 'Add a high-quality headshot to your profile', ARRAY['stylist', 'assistant', 'receptionist', 'stylist_assistant', 'admin_assistant', 'operations_assistant']::public.app_role[], 2),
('Set your work schedule', 'Configure your availability for each location', ARRAY['stylist', 'assistant', 'receptionist', 'stylist_assistant']::public.app_role[], 3),
('Review company policies', 'Read through all company policies and guidelines', ARRAY['stylist', 'assistant', 'receptionist', 'stylist_assistant', 'admin_assistant', 'operations_assistant']::public.app_role[], 4),
('Set up direct deposit', 'Submit your banking information for payroll', ARRAY['stylist', 'assistant', 'receptionist', 'stylist_assistant', 'admin_assistant', 'operations_assistant']::public.app_role[], 5),
('Complete initial training videos', 'Watch all required training content', ARRAY['stylist', 'assistant', 'receptionist', 'stylist_assistant']::public.app_role[], 6),
('Review admin procedures', 'Learn the administrative workflows', ARRAY['admin_assistant', 'operations_assistant']::public.app_role[], 7),
('Learn the booking system', 'Get familiar with appointment management', ARRAY['receptionist', 'admin_assistant']::public.app_role[], 8);