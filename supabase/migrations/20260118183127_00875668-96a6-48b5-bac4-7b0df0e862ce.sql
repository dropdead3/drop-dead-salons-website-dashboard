-- Add approval fields to employee_profiles
ALTER TABLE public.employee_profiles
ADD COLUMN is_approved boolean DEFAULT false,
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN is_super_admin boolean DEFAULT false,
ADD COLUMN admin_approved_by uuid REFERENCES auth.users(id),
ADD COLUMN admin_approved_at timestamp with time zone;

-- Create index for faster queries on approval status
CREATE INDEX idx_employee_profiles_is_approved ON public.employee_profiles(is_approved);
CREATE INDEX idx_employee_profiles_is_super_admin ON public.employee_profiles(is_super_admin);

-- Create a function to check if a user can approve admin roles
CREATE OR REPLACE FUNCTION public.can_approve_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_profiles ep
    JOIN public.user_roles ur ON ur.user_id = ep.user_id
    WHERE ep.user_id = _user_id
      AND ep.is_super_admin = true
      AND ep.is_approved = true
      AND ur.role = 'admin'
  )
$$;

-- Update RLS policy for user_roles to enforce admin approval
-- First drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Coaches can view all roles" ON public.user_roles;

-- Recreate with approval checks
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Coaches can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can insert non-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  AND (role != 'admin' OR public.can_approve_admin_role(auth.uid()))
);

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND (role != 'admin' OR public.can_approve_admin_role(auth.uid()))
);

-- Create account_approval_logs table for audit trail
CREATE TABLE public.account_approval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'approved', 'revoked', 'admin_approved', 'admin_revoked', 'super_admin_granted', 'super_admin_revoked'
  performed_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on approval logs
ALTER TABLE public.account_approval_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view approval logs"
ON public.account_approval_logs
FOR SELECT
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can insert approval logs"
ON public.account_approval_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));