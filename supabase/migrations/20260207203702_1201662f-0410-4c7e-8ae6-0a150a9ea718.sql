-- Create meeting_notes table
CREATE TABLE public.meeting_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.one_on_one_meetings(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  content TEXT NOT NULL,
  topic_category TEXT NOT NULL DEFAULT 'other',
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_topic_category CHECK (topic_category IN ('performance', 'goals', 'feedback', 'development', 'personal', 'other'))
);

-- Create accountability_items table
CREATE TABLE public.accountability_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.one_on_one_meetings(id) ON DELETE SET NULL,
  coach_id UUID NOT NULL,
  team_member_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  reminder_date DATE,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'))
);

-- Create meeting_reports table
CREATE TABLE public.meeting_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.one_on_one_meetings(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  team_member_id UUID NOT NULL,
  report_content TEXT NOT NULL,
  included_notes JSONB DEFAULT '[]'::jsonb,
  included_items JSONB DEFAULT '[]'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_reports ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_meeting_notes_updated_at
  BEFORE UPDATE ON public.meeting_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accountability_items_updated_at
  BEFORE UPDATE ON public.accountability_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for meeting_notes
-- Coaches can manage their own notes
CREATE POLICY "Coaches can view their own notes"
  ON public.meeting_notes FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Team members can view shared notes from their meetings"
  ON public.meeting_notes FOR SELECT
  USING (
    is_private = false 
    AND EXISTS (
      SELECT 1 FROM public.one_on_one_meetings m
      WHERE m.id = meeting_id 
      AND m.requester_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert notes"
  ON public.meeting_notes FOR INSERT
  WITH CHECK (coach_id = auth.uid() AND public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Coaches can update their own notes"
  ON public.meeting_notes FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own notes"
  ON public.meeting_notes FOR DELETE
  USING (coach_id = auth.uid());

-- RLS Policies for accountability_items
-- Coaches can see all items they created
CREATE POLICY "Coaches can view items they created"
  ON public.accountability_items FOR SELECT
  USING (coach_id = auth.uid());

-- Team members can see items assigned to them
CREATE POLICY "Team members can view their assigned items"
  ON public.accountability_items FOR SELECT
  USING (team_member_id = auth.uid());

CREATE POLICY "Coaches can insert items"
  ON public.accountability_items FOR INSERT
  WITH CHECK (coach_id = auth.uid() AND public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Coaches can update items they created"
  ON public.accountability_items FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Team members can update status and completion notes on their items
CREATE POLICY "Team members can update their item status"
  ON public.accountability_items FOR UPDATE
  USING (team_member_id = auth.uid())
  WITH CHECK (team_member_id = auth.uid());

CREATE POLICY "Coaches can delete items they created"
  ON public.accountability_items FOR DELETE
  USING (coach_id = auth.uid());

-- RLS Policies for meeting_reports
CREATE POLICY "Coaches can view reports they created"
  ON public.meeting_reports FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Team members can view reports sent to them"
  ON public.meeting_reports FOR SELECT
  USING (team_member_id = auth.uid());

CREATE POLICY "Coaches can insert reports"
  ON public.meeting_reports FOR INSERT
  WITH CHECK (coach_id = auth.uid() AND public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Coaches can update their reports"
  ON public.meeting_reports FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Team members can acknowledge reports
CREATE POLICY "Team members can acknowledge reports"
  ON public.meeting_reports FOR UPDATE
  USING (team_member_id = auth.uid())
  WITH CHECK (team_member_id = auth.uid());

-- Enable realtime for accountability_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.accountability_items;