-- Create chat_smart_actions table for AI-detected actionable requests
CREATE TABLE public.chat_smart_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  
  -- AI Detection
  action_type TEXT NOT NULL CHECK (action_type IN ('client_handoff', 'assistant_request', 'shift_cover', 'availability_check', 'product_request')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  detected_intent TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_note TEXT,
  
  -- Linking to actual actions
  linked_action_type TEXT,
  linked_action_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '4 hours')
);

-- Create indexes for efficient querying
CREATE INDEX idx_chat_smart_actions_org ON public.chat_smart_actions(organization_id);
CREATE INDEX idx_chat_smart_actions_target ON public.chat_smart_actions(target_user_id, status);
CREATE INDEX idx_chat_smart_actions_message ON public.chat_smart_actions(message_id);
CREATE INDEX idx_chat_smart_actions_pending ON public.chat_smart_actions(target_user_id) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.chat_smart_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own pending actions"
  ON public.chat_smart_actions
  FOR SELECT
  USING (target_user_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "Users can update actions targeted at them"
  ON public.chat_smart_actions
  FOR UPDATE
  USING (target_user_id = auth.uid());

CREATE POLICY "System can insert smart actions"
  ON public.chat_smart_actions
  FOR INSERT
  WITH CHECK (true);

-- Add smart action settings to team_chat_settings
ALTER TABLE public.team_chat_settings
  ADD COLUMN IF NOT EXISTS smart_actions_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS smart_action_types TEXT[] DEFAULT ARRAY['client_handoff', 'assistant_request', 'shift_cover', 'availability_check'],
  ADD COLUMN IF NOT EXISTS smart_action_expiry_hours INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS smart_action_require_approval BOOLEAN DEFAULT false;

-- Enable realtime for smart actions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_smart_actions;