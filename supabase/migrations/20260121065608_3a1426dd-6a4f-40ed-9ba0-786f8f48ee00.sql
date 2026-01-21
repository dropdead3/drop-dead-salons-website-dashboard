-- Add assignment_id column to program_resources for optional assignment-level linking
ALTER TABLE public.program_resources
ADD COLUMN assignment_id UUID REFERENCES public.weekly_assignments(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX idx_program_resources_assignment_id ON public.program_resources(assignment_id);
CREATE INDEX idx_program_resources_week_id ON public.program_resources(week_id);