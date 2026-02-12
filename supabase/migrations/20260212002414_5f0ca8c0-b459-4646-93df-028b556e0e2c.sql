
-- Action Campaigns table
CREATE TABLE public.action_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  goal_period TEXT,
  source_plan_type TEXT,
  leadership_note TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Action Campaign Tasks table
CREATE TABLE public.action_campaign_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.action_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done')),
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.action_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_campaign_tasks ENABLE ROW LEVEL SECURITY;

-- RLS: Campaigns visible to org members
CREATE POLICY "Org members can view campaigns"
  ON public.action_campaigns FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create campaigns"
  ON public.action_campaigns FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins and creators can update campaigns"
  ON public.action_campaigns FOR UPDATE
  USING (
    auth.uid() = created_by
    OR public.is_org_admin(auth.uid(), organization_id)
  );

CREATE POLICY "Org admins and creators can delete campaigns"
  ON public.action_campaigns FOR DELETE
  USING (
    auth.uid() = created_by
    OR public.is_org_admin(auth.uid(), organization_id)
  );

-- RLS for tasks: inherit from campaign
CREATE POLICY "Org members can view campaign tasks"
  ON public.action_campaign_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.action_campaigns c
    WHERE c.id = campaign_id
    AND public.is_org_member(auth.uid(), c.organization_id)
  ));

CREATE POLICY "Org members can create campaign tasks"
  ON public.action_campaign_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.action_campaigns c
    WHERE c.id = campaign_id
    AND public.is_org_member(auth.uid(), c.organization_id)
  ));

CREATE POLICY "Org members can update campaign tasks"
  ON public.action_campaign_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.action_campaigns c
    WHERE c.id = campaign_id
    AND public.is_org_member(auth.uid(), c.organization_id)
  ));

CREATE POLICY "Org members can delete campaign tasks"
  ON public.action_campaign_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.action_campaigns c
    WHERE c.id = campaign_id
    AND (auth.uid() = c.created_by OR public.is_org_admin(auth.uid(), c.organization_id))
  ));

-- Indexes
CREATE INDEX idx_action_campaigns_org ON public.action_campaigns(organization_id);
CREATE INDEX idx_action_campaigns_status ON public.action_campaigns(status);
CREATE INDEX idx_action_campaign_tasks_campaign ON public.action_campaign_tasks(campaign_id);

-- Updated_at triggers
CREATE TRIGGER update_action_campaigns_updated_at
  BEFORE UPDATE ON public.action_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_campaign_tasks_updated_at
  BEFORE UPDATE ON public.action_campaign_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for campaign task updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_campaign_tasks;
