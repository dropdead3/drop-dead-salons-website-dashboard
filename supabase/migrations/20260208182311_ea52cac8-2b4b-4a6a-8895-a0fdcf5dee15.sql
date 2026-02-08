-- Create team_chat_settings table for organization-level chat configuration
CREATE TABLE public.team_chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Channel permissions
  channel_create_public TEXT DEFAULT 'admin' CHECK (channel_create_public IN ('super_admin', 'admin', 'manager', 'anyone')),
  channel_create_private TEXT DEFAULT 'admin' CHECK (channel_create_private IN ('super_admin', 'admin', 'manager', 'anyone')),
  channel_archive_permission TEXT DEFAULT 'admin' CHECK (channel_archive_permission IN ('admin', 'channel_owner', 'anyone')),
  default_channels TEXT[] DEFAULT ARRAY['general', 'company-wide'],
  
  -- Display settings
  display_name_format TEXT DEFAULT 'display_name' CHECK (display_name_format IN ('full_name', 'display_name', 'first_name')),
  show_profile_photos BOOLEAN DEFAULT true,
  show_role_badges BOOLEAN DEFAULT true,
  show_job_title BOOLEAN DEFAULT false,
  show_location_badge BOOLEAN DEFAULT false,
  
  -- Messaging permissions
  mention_everyone_permission TEXT DEFAULT 'admin' CHECK (mention_everyone_permission IN ('admin', 'manager', 'anyone')),
  pin_message_permission TEXT DEFAULT 'channel_admin' CHECK (pin_message_permission IN ('admin', 'channel_admin', 'anyone')),
  delete_others_messages TEXT DEFAULT 'admin' CHECK (delete_others_messages IN ('admin', 'channel_admin')),
  message_retention_days INTEGER DEFAULT NULL,
  allow_file_attachments BOOLEAN DEFAULT true,
  max_file_size_mb INTEGER DEFAULT 25,
  
  -- Notification defaults
  default_notification_setting TEXT DEFAULT 'all' CHECK (default_notification_setting IN ('all', 'mentions', 'nothing')),
  allow_dnd_override BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create team_chat_role_auto_join table for role-based channel auto-join rules
CREATE TABLE public.team_chat_role_auto_join (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organization_id, role, channel_id)
);

-- Enable RLS on both tables
ALTER TABLE public.team_chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_chat_role_auto_join ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_chat_settings
-- Super admins can manage settings for their organization
CREATE POLICY "Super admins can manage chat settings"
ON public.team_chat_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employee_profiles ep
    WHERE ep.user_id = auth.uid()
    AND ep.organization_id = team_chat_settings.organization_id
    AND ep.is_super_admin = true
  )
);

-- All org members can view settings
CREATE POLICY "Org members can view chat settings"
ON public.team_chat_settings
FOR SELECT
USING (
  public.is_org_member(auth.uid(), organization_id)
);

-- RLS policies for team_chat_role_auto_join
-- Super admins can manage auto-join rules
CREATE POLICY "Super admins can manage auto-join rules"
ON public.team_chat_role_auto_join
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employee_profiles ep
    WHERE ep.user_id = auth.uid()
    AND ep.organization_id = team_chat_role_auto_join.organization_id
    AND ep.is_super_admin = true
  )
);

-- All org members can view auto-join rules
CREATE POLICY "Org members can view auto-join rules"
ON public.team_chat_role_auto_join
FOR SELECT
USING (
  public.is_org_member(auth.uid(), organization_id)
);

-- Create updated_at trigger for team_chat_settings
CREATE TRIGGER update_team_chat_settings_updated_at
BEFORE UPDATE ON public.team_chat_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();