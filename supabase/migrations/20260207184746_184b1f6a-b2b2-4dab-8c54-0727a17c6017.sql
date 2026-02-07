-- Create individual training assignments table
CREATE TABLE public.training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.training_videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  due_date TIMESTAMPTZ,
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own assignments"
ON public.training_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all assignments"
ON public.training_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can insert assignments"
ON public.training_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can update assignments"
ON public.training_assignments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can delete assignments"
ON public.training_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);