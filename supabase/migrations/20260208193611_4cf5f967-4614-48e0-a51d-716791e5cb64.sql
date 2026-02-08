-- Create table for tracking AI agent actions
CREATE TABLE public.ai_agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE SET NULL,
  message_id UUID, -- Reference to chat_messages if stored
  action_type TEXT NOT NULL,
  action_params JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'executed', 'failed')),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour')
);

-- Enable RLS
ALTER TABLE public.ai_agent_actions ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI actions
CREATE POLICY "Users can view own AI actions"
ON public.ai_agent_actions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own AI actions
CREATE POLICY "Users can create own AI actions"
ON public.ai_agent_actions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI actions
CREATE POLICY "Users can update own AI actions"
ON public.ai_agent_actions
FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for querying by user and status
CREATE INDEX idx_ai_agent_actions_user_status ON public.ai_agent_actions(user_id, status);
CREATE INDEX idx_ai_agent_actions_organization ON public.ai_agent_actions(organization_id);

-- Add realtime for ai_agent_actions
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agent_actions;