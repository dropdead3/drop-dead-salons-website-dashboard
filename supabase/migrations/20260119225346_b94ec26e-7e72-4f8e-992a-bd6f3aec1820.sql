-- Create custom email themes table
CREATE TABLE public.email_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  header_bg TEXT NOT NULL DEFAULT '#1a1a1a',
  header_text TEXT NOT NULL DEFAULT '#f5f0e8',
  body_bg TEXT NOT NULL DEFAULT '#f5f0e8',
  body_text TEXT NOT NULL DEFAULT '#1a1a1a',
  button_bg TEXT NOT NULL DEFAULT '#1a1a1a',
  button_text TEXT NOT NULL DEFAULT '#f5f0e8',
  accent_color TEXT NOT NULL DEFAULT '#d4c5b0',
  divider_color TEXT NOT NULL DEFAULT '#d4c5b0',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_themes ENABLE ROW LEVEL SECURITY;

-- Policies for email themes - admins and managers can manage themes
CREATE POLICY "Authenticated users can view email themes" 
ON public.email_themes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and managers can create email themes" 
ON public.email_themes 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can update email themes" 
ON public.email_themes 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can delete email themes" 
ON public.email_themes 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_email_themes_updated_at
BEFORE UPDATE ON public.email_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();