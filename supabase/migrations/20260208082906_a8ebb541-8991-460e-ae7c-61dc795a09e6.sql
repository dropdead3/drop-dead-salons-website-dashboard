-- Create enum for channel types
CREATE TYPE public.chat_channel_type AS ENUM ('public', 'private', 'dm', 'group_dm', 'location');

-- Create enum for channel member roles
CREATE TYPE public.chat_member_role AS ENUM ('owner', 'admin', 'member');

-- Create enum for user status
CREATE TYPE public.chat_user_status_type AS ENUM ('available', 'busy', 'dnd', 'away');

-- Chat Channels table
CREATE TABLE public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type chat_channel_type NOT NULL DEFAULT 'public',
  location_id text REFERENCES public.locations(id) ON DELETE SET NULL,
  description text,
  icon text DEFAULT 'hash',
  is_archived boolean DEFAULT false,
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat Channel Members table
CREATE TABLE public.chat_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role chat_member_role NOT NULL DEFAULT 'member',
  is_muted boolean DEFAULT false,
  muted_until timestamptz,
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Chat Messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  content_html text,
  parent_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat Message Reactions table
CREATE TABLE public.chat_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Chat Attachments table
CREATE TABLE public.chat_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

-- Chat User Status table
CREATE TABLE public.chat_user_status (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status chat_user_status_type DEFAULT 'available',
  status_message text,
  status_expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Chat Pinned Messages table
CREATE TABLE public.chat_pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  pinned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pinned_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, message_id)
);

-- Indexes for performance
CREATE INDEX idx_chat_channels_org ON public.chat_channels(organization_id);
CREATE INDEX idx_chat_channels_type ON public.chat_channels(type);
CREATE INDEX idx_chat_channel_members_channel ON public.chat_channel_members(channel_id);
CREATE INDEX idx_chat_channel_members_user ON public.chat_channel_members(user_id);
CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_parent ON public.chat_messages(parent_message_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_message_reactions_message ON public.chat_message_reactions(message_id);
CREATE INDEX idx_chat_attachments_message ON public.chat_attachments(message_id);

-- Enable RLS on all tables
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check channel membership
CREATE OR REPLACE FUNCTION public.is_channel_member(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE user_id = _user_id AND channel_id = _channel_id
  )
$$;

-- Security definer function to check if user can access channel (member or public in same org)
CREATE OR REPLACE FUNCTION public.can_access_channel(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE user_id = _user_id AND channel_id = _channel_id
  )
  OR EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = _channel_id
    AND c.type = 'public'
    AND c.organization_id = public.get_user_organization(_user_id)
  )
$$;

-- RLS Policies for chat_channels
CREATE POLICY "Users can view channels they are members of or public channels in their org"
ON public.chat_channels FOR SELECT
USING (
  public.can_access_channel(auth.uid(), id)
  OR public.is_platform_user(auth.uid())
);

CREATE POLICY "Authenticated users can create channels in their org"
ON public.chat_channels FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization(auth.uid())
);

CREATE POLICY "Channel admins can update channels"
ON public.chat_channels FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR public.is_coach_or_admin(auth.uid())
);

-- RLS Policies for chat_channel_members
CREATE POLICY "Users can view members of channels they belong to"
ON public.chat_channel_members FOR SELECT
USING (
  public.is_channel_member(auth.uid(), channel_id)
  OR public.is_platform_user(auth.uid())
);

CREATE POLICY "Users can join public channels in their org"
ON public.chat_channel_members FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_channels c
    WHERE c.id = channel_id
    AND (c.type = 'public' OR c.type = 'location')
    AND c.organization_id = public.get_user_organization(auth.uid())
  )
);

CREATE POLICY "Channel admins can add members"
ON public.chat_channel_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channel_members existing
    WHERE existing.channel_id = chat_channel_members.channel_id
    AND existing.user_id = auth.uid()
    AND existing.role IN ('owner', 'admin')
  )
  OR public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Users can update their own membership settings"
ON public.chat_channel_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Channel admins can update memberships"
ON public.chat_channel_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_channel_members cm
    WHERE cm.channel_id = chat_channel_members.channel_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can leave channels"
ON public.chat_channel_members FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in channels they belong to"
ON public.chat_messages FOR SELECT
USING (
  public.is_channel_member(auth.uid(), channel_id)
  OR public.is_platform_user(auth.uid())
);

CREATE POLICY "Channel members can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_channel_member(auth.uid(), channel_id)
);

CREATE POLICY "Users can edit their own messages"
ON public.chat_messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.chat_messages FOR DELETE
USING (
  sender_id = auth.uid()
  OR public.is_coach_or_admin(auth.uid())
);

-- RLS Policies for chat_message_reactions
CREATE POLICY "Users can view reactions in channels they belong to"
ON public.chat_message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages m
    WHERE m.id = message_id
    AND public.is_channel_member(auth.uid(), m.channel_id)
  )
);

CREATE POLICY "Channel members can add reactions"
ON public.chat_message_reactions FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chat_messages m
    WHERE m.id = message_id
    AND public.is_channel_member(auth.uid(), m.channel_id)
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.chat_message_reactions FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for chat_attachments
CREATE POLICY "Users can view attachments in channels they belong to"
ON public.chat_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages m
    WHERE m.id = message_id
    AND public.is_channel_member(auth.uid(), m.channel_id)
  )
);

CREATE POLICY "Message senders can add attachments"
ON public.chat_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_messages m
    WHERE m.id = message_id AND m.sender_id = auth.uid()
  )
);

-- RLS Policies for chat_user_status
CREATE POLICY "Authenticated users can view status"
ON public.chat_user_status FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own status"
ON public.chat_user_status FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own status"
ON public.chat_user_status FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for chat_pinned_messages
CREATE POLICY "Users can view pinned messages in channels they belong to"
ON public.chat_pinned_messages FOR SELECT
USING (public.is_channel_member(auth.uid(), channel_id));

CREATE POLICY "Channel admins can pin messages"
ON public.chat_pinned_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = chat_pinned_messages.channel_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
  OR public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Channel admins can unpin messages"
ON public.chat_pinned_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = chat_pinned_messages.channel_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
  OR public.is_coach_or_admin(auth.uid())
);

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_user_status;

-- Updated at triggers
CREATE TRIGGER update_chat_channels_updated_at
BEFORE UPDATE ON public.chat_channels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_channel_members_updated_at
BEFORE UPDATE ON public.chat_channel_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_user_status_updated_at
BEFORE UPDATE ON public.chat_user_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();