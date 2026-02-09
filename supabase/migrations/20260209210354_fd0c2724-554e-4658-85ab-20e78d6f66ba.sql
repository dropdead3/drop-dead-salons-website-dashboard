
-- Create responsibilities table
CREATE TABLE public.responsibilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Star',
  color TEXT NOT NULL DEFAULT 'blue',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create responsibility_assets table
CREATE TABLE public.responsibility_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  responsibility_id UUID NOT NULL REFERENCES public.responsibilities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'link',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_responsibilities junction table
CREATE TABLE public.user_responsibilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responsibility_id UUID NOT NULL REFERENCES public.responsibilities(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, responsibility_id)
);

-- Enable RLS
ALTER TABLE public.responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsibility_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responsibilities ENABLE ROW LEVEL SECURITY;

-- Responsibilities policies
CREATE POLICY "Authenticated users can view active responsibilities"
  ON public.responsibilities FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins and managers can manage responsibilities"
  ON public.responsibilities FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- Responsibility assets policies
CREATE POLICY "Authenticated users can view responsibility assets"
  ON public.responsibility_assets FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage responsibility assets"
  ON public.responsibility_assets FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- User responsibilities policies
CREATE POLICY "Users can view all assignments in their org"
  ON public.user_responsibilities FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage user responsibility assignments"
  ON public.user_responsibilities FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  );

-- Auto-update updated_at trigger for responsibilities
CREATE TRIGGER update_responsibilities_updated_at
  BEFORE UPDATE ON public.responsibilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
