-- =====================================================
-- Category 4: Team Collaboration Enhancements
-- =====================================================

-- 1. Unified Mentions Table
CREATE TABLE public.user_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  mentioned_by UUID,
  source_type TEXT NOT NULL, -- 'chat', 'account_note', 'task', 'announcement'
  source_id UUID NOT NULL,
  channel_id UUID, -- For chat mentions, references chat_channels
  source_context TEXT, -- Preview of the message (first 150 chars)
  read_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_mentions_user_unread ON public.user_mentions(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_user_mentions_source ON public.user_mentions(source_type, source_id);
CREATE INDEX idx_user_mentions_org ON public.user_mentions(organization_id);

ALTER TABLE public.user_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own mentions" ON public.user_mentions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users mark own mentions read" ON public.user_mentions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert mentions" ON public.user_mentions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Add mention notification preference
ALTER TABLE public.notification_preferences 
  ADD COLUMN IF NOT EXISTS mention_enabled BOOLEAN DEFAULT true;

-- 3. Team Calendar Events Table
CREATE TABLE public.team_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  location_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'meeting', 'training', 'time_off', 'holiday', 'special', 'reminder'
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'team', -- 'team', 'leadership', 'private'
  color TEXT,
  created_by UUID,
  attendees JSONB DEFAULT '[]',
  recurring_pattern JSONB,
  metadata JSONB DEFAULT '{}',
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_team_calendar_date ON public.team_calendar_events(organization_id, start_date, end_date);
CREATE INDEX idx_team_calendar_type ON public.team_calendar_events(organization_id, event_type);

ALTER TABLE public.team_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members view calendar" ON public.team_calendar_events
  FOR SELECT USING (
    organization_id = public.get_user_organization(auth.uid())
    AND (
      visibility = 'team'
      OR (visibility = 'leadership' AND public.is_coach_or_admin(auth.uid()))
      OR created_by = auth.uid()
      OR visibility = 'private' AND created_by = auth.uid()
    )
  );

CREATE POLICY "Managers insert calendar events" ON public.team_calendar_events
  FOR INSERT WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND public.is_coach_or_admin(auth.uid())
  );

CREATE POLICY "Managers update calendar events" ON public.team_calendar_events
  FOR UPDATE USING (
    organization_id = public.get_user_organization(auth.uid())
    AND public.is_coach_or_admin(auth.uid())
  );

CREATE POLICY "Managers delete calendar events" ON public.team_calendar_events
  FOR DELETE USING (
    organization_id = public.get_user_organization(auth.uid())
    AND public.is_coach_or_admin(auth.uid())
  );

-- 4. Time-Off Requests Table
CREATE TABLE public.time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  calendar_event_id UUID REFERENCES public.team_calendar_events(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL, -- 'vacation', 'sick', 'personal', 'other'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_time_off_requests_user ON public.time_off_requests(user_id, status);
CREATE INDEX idx_time_off_requests_org ON public.time_off_requests(organization_id, status);

ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own time off requests" ON public.time_off_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      organization_id = public.get_user_organization(auth.uid())
      AND public.is_coach_or_admin(auth.uid())
    )
  );

CREATE POLICY "Users create own time off requests" ON public.time_off_requests
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND organization_id = public.get_user_organization(auth.uid())
  );

CREATE POLICY "Users update own pending requests" ON public.time_off_requests
  FOR UPDATE USING (
    (user_id = auth.uid() AND status = 'pending')
    OR (
      organization_id = public.get_user_organization(auth.uid())
      AND public.is_coach_or_admin(auth.uid())
    )
  );

CREATE POLICY "Users delete own pending requests" ON public.time_off_requests
  FOR DELETE USING (user_id = auth.uid() AND status = 'pending');

-- 5. Add AI generation fields to daily_huddles
ALTER TABLE public.daily_huddles
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_sections JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS generation_source TEXT DEFAULT 'manual';

-- 6. Update trigger for team_calendar_events
CREATE TRIGGER update_team_calendar_events_updated_at
  BEFORE UPDATE ON public.team_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Enable realtime for mentions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_mentions;