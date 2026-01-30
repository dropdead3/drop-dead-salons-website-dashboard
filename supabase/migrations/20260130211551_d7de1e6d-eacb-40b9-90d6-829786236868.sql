-- Create platform invitations table for email invites
CREATE TABLE IF NOT EXISTS public.platform_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_admin', 'platform_support', 'platform_developer')),
  invited_by UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_platform_invitations_email ON public.platform_invitations(email);
CREATE INDEX IF NOT EXISTS idx_platform_invitations_token ON public.platform_invitations(token);
CREATE INDEX IF NOT EXISTS idx_platform_invitations_status ON public.platform_invitations(status);

-- Enable RLS
ALTER TABLE public.platform_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform team members
CREATE POLICY "Platform team can view invitations"
  ON public.platform_invitations FOR SELECT
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can create invitations"
  ON public.platform_invitations FOR INSERT
  WITH CHECK (
    public.has_platform_role(auth.uid(), 'platform_owner') OR
    public.has_platform_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Platform admins can update invitations"
  ON public.platform_invitations FOR UPDATE
  USING (
    public.has_platform_role(auth.uid(), 'platform_owner') OR
    public.has_platform_role(auth.uid(), 'platform_admin')
  );

-- Allow anyone to read invitation by token (for signup flow)
CREATE POLICY "Anyone can read invitation by token"
  ON public.platform_invitations FOR SELECT
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_platform_invitations_updated_at
  BEFORE UPDATE ON public.platform_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();