-- Create staff invitations table
CREATE TABLE public.staff_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role app_role NOT NULL,
  invited_by UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, status) -- Prevent duplicate pending invites for same email
);

-- Create index for faster lookups
CREATE INDEX idx_staff_invitations_email ON public.staff_invitations(email);
CREATE INDEX idx_staff_invitations_token ON public.staff_invitations(token);
CREATE INDEX idx_staff_invitations_status ON public.staff_invitations(status);

-- Enable RLS
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Admins and managers can view all invitations
CREATE POLICY "Admins and managers can view invitations"
ON public.staff_invitations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Admins and managers can create invitations
CREATE POLICY "Admins and managers can create invitations"
ON public.staff_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  AND invited_by = auth.uid()
);

-- Admins and managers can update invitations (cancel them)
CREATE POLICY "Admins and managers can update invitations"
ON public.staff_invitations
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Allow anyone to read invitation by token (for signup verification)
CREATE POLICY "Anyone can read invitation by token"
ON public.staff_invitations
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_staff_invitations_updated_at
BEFORE UPDATE ON public.staff_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();