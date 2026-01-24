-- Create changelog_entries table
CREATE TABLE public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT,
  entry_type TEXT NOT NULL DEFAULT 'update',
  status TEXT NOT NULL DEFAULT 'draft',
  is_major BOOLEAN DEFAULT false,
  target_roles TEXT[] DEFAULT '{}',
  release_date DATE,
  scheduled_publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT false,
  send_as_announcement BOOLEAN DEFAULT false,
  send_as_notification BOOLEAN DEFAULT true,
  author_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);

-- Create changelog_reads table
CREATE TABLE public.changelog_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changelog_id UUID NOT NULL REFERENCES changelog_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(changelog_id, user_id)
);

-- Create feature_requests table
CREATE TABLE public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'submitted',
  priority TEXT DEFAULT 'medium',
  submitted_by UUID NOT NULL,
  linked_changelog_id UUID REFERENCES changelog_entries(id),
  admin_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create feature_request_votes table
CREATE TABLE public.feature_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_request_id, user_id)
);

-- Create changelog_votes table (for voting on Coming Soon items)
CREATE TABLE public.changelog_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changelog_id UUID NOT NULL REFERENCES changelog_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(changelog_id, user_id)
);

-- Create email_digest_log table
CREATE TABLE public.email_digest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  digest_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  entries_included UUID[] NOT NULL
);

-- Add changelog digest columns to notification_preferences
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS changelog_digest_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS changelog_digest_frequency TEXT DEFAULT 'weekly';

-- Enable RLS on all tables
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelog_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_digest_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for changelog_entries
CREATE POLICY "Leadership can manage changelog" ON public.changelog_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "Published entries visible to all authenticated" ON public.changelog_entries
  FOR SELECT USING (
    status = 'published' AND auth.uid() IS NOT NULL
  );

-- RLS policies for changelog_reads
CREATE POLICY "Users can manage own reads" ON public.changelog_reads
  FOR ALL USING (user_id = auth.uid());

-- RLS policies for feature_requests
CREATE POLICY "Users can view all feature requests" ON public.feature_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create feature requests" ON public.feature_requests
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update own requests" ON public.feature_requests
  FOR UPDATE USING (
    auth.uid() = submitted_by OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "Leadership can delete requests" ON public.feature_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

-- RLS policies for feature_request_votes
CREATE POLICY "Users can manage own votes" ON public.feature_request_votes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view all votes" ON public.feature_request_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for changelog_votes
CREATE POLICY "Users can manage own changelog votes" ON public.changelog_votes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view all changelog votes" ON public.changelog_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS policies for email_digest_log
CREATE POLICY "Users can view own digest logs" ON public.email_digest_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert digest logs" ON public.email_digest_log
  FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_changelog_entries_updated_at
  BEFORE UPDATE ON public.changelog_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();