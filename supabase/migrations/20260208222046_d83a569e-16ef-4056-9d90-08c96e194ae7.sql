-- =============================================
-- Chat Sections: Allow super admins to create custom sections
-- =============================================
CREATE TABLE public.chat_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_chat_sections_org ON public.chat_sections(organization_id);

-- Enable RLS
ALTER TABLE public.chat_sections ENABLE ROW LEVEL SECURITY;

-- Policy: All org members can view sections
CREATE POLICY "Org members can view chat sections"
  ON public.chat_sections FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Policy: Super admins and primary owners can manage sections
CREATE POLICY "Super admins can manage chat sections"
  ON public.chat_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_profiles
      WHERE user_id = auth.uid()
      AND organization_id = chat_sections.organization_id
      AND (is_super_admin = true OR is_primary_owner = true)
    )
  );

-- =============================================
-- Add section_id to channels for grouping
-- =============================================
ALTER TABLE public.chat_channels
  ADD COLUMN section_id UUID REFERENCES public.chat_sections(id) ON DELETE SET NULL;

CREATE INDEX idx_chat_channels_section ON public.chat_channels(section_id);

-- =============================================
-- Chat Permissions: Granular control over chat features
-- =============================================
CREATE TABLE public.chat_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  role app_role NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, permission_key, role)
);

-- Index for efficient lookups
CREATE INDEX idx_chat_permissions_org ON public.chat_permissions(organization_id);
CREATE INDEX idx_chat_permissions_lookup ON public.chat_permissions(organization_id, permission_key, role);

-- Enable RLS
ALTER TABLE public.chat_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Org members can view permissions
CREATE POLICY "Org members can view chat permissions"
  ON public.chat_permissions FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Policy: Super admins can manage permissions
CREATE POLICY "Super admins can manage chat permissions"
  ON public.chat_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_profiles
      WHERE user_id = auth.uid()
      AND organization_id = chat_permissions.organization_id
      AND (is_super_admin = true OR is_primary_owner = true)
    )
  );

-- =============================================
-- User Chat Layout Preferences (per-user ordering)
-- =============================================
-- Add chat_layout JSONB to user_preferences if the table exists
-- This stores: { sections_order: [], channels_order: { [sectionId]: [] }, collapsed_sections: [] }
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_preferences' AND column_name = 'chat_layout') THEN
      ALTER TABLE public.user_preferences ADD COLUMN chat_layout JSONB DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- =============================================
-- Helper function: Check if user has chat permission
-- =============================================
CREATE OR REPLACE FUNCTION public.has_chat_permission(_user_id UUID, _org_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Primary owners and super admins always have all permissions
  SELECT 
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.employee_profiles
        WHERE user_id = _user_id
        AND organization_id = _org_id
        AND (is_primary_owner = true OR is_super_admin = true)
      ) THEN true
      -- Check role-based permissions
      ELSE EXISTS (
        SELECT 1 
        FROM public.chat_permissions cp
        JOIN public.user_roles ur ON ur.role = cp.role
        WHERE cp.organization_id = _org_id
        AND cp.permission_key = _permission_key
        AND ur.user_id = _user_id
        AND cp.is_allowed = true
      )
    END
$$;

-- Trigger for updated_at on chat_sections
CREATE TRIGGER update_chat_sections_updated_at
  BEFORE UPDATE ON public.chat_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on chat_permissions
CREATE TRIGGER update_chat_permissions_updated_at
  BEFORE UPDATE ON public.chat_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();