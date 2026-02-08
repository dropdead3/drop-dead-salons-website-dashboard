-- Welcome DM rules table
CREATE TABLE public.team_chat_welcome_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  message_template TEXT NOT NULL,
  target_roles TEXT[],
  target_locations UUID[],
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, sender_user_id)
);

-- Enable RLS
ALTER TABLE public.team_chat_welcome_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for welcome rules
CREATE POLICY "Org admins can manage welcome rules"
ON public.team_chat_welcome_rules
FOR ALL
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Org members can view welcome rules"
ON public.team_chat_welcome_rules
FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

-- Welcome tracking to prevent duplicates
CREATE TABLE public.team_chat_welcome_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL,
  sender_user_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, recipient_user_id, sender_user_id)
);

-- Enable RLS
ALTER TABLE public.team_chat_welcome_sent ENABLE ROW LEVEL SECURITY;

-- RLS policies for welcome sent tracking
CREATE POLICY "Org admins can manage welcome sent"
ON public.team_chat_welcome_sent
FOR ALL
USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Users can view their own welcome messages"
ON public.team_chat_welcome_sent
FOR SELECT
USING (recipient_user_id = auth.uid() OR sender_user_id = auth.uid());

-- Add welcome_dms_enabled to team_chat_settings
ALTER TABLE public.team_chat_settings 
ADD COLUMN IF NOT EXISTS welcome_dms_enabled BOOLEAN DEFAULT false;

-- Create updated_at trigger for welcome rules
CREATE TRIGGER update_team_chat_welcome_rules_updated_at
BEFORE UPDATE ON public.team_chat_welcome_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();