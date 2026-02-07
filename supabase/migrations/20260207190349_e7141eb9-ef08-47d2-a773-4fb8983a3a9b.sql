-- Team Challenges tables
CREATE TABLE public.team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'team', 'location')),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('bells', 'retail', 'new_clients', 'retention', 'training', 'tips')),
  goal_value NUMERIC,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  prize_description TEXT,
  created_by UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  rules JSONB DEFAULT '{}'
);

-- Challenge participants
CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.team_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  location_id TEXT,
  team_name TEXT,
  current_value NUMERIC DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Challenge progress history (for charts)
CREATE TABLE public.challenge_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.team_challenges(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.challenge_participants(id) ON DELETE CASCADE NOT NULL,
  value_at_snapshot NUMERIC NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_challenges
CREATE POLICY "Authenticated users can view active challenges"
ON public.team_challenges FOR SELECT
TO authenticated
USING (status IN ('active', 'completed'));

CREATE POLICY "Managers can view all challenges"
ON public.team_challenges FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can create challenges"
ON public.team_challenges FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can update challenges"
ON public.team_challenges FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Managers can delete challenges"
ON public.team_challenges FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- RLS Policies for challenge_participants
CREATE POLICY "Users can view challenge participants"
ON public.challenge_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can manage participants"
ON public.challenge_participants FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- RLS Policies for challenge_progress_snapshots
CREATE POLICY "Users can view progress snapshots"
ON public.challenge_progress_snapshots FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert snapshots"
ON public.challenge_progress_snapshots FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- Shift Swaps tables
CREATE TABLE public.shift_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  original_date DATE NOT NULL,
  original_start_time TIME NOT NULL,
  original_end_time TIME NOT NULL,
  location_id TEXT,
  swap_type TEXT NOT NULL CHECK (swap_type IN ('swap', 'cover', 'giveaway')),
  reason TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'pending_approval', 'approved', 'denied', 'cancelled', 'expired')),
  claimer_id UUID,
  claimer_date DATE,
  claimer_start_time TIME,
  claimer_end_time TIME,
  manager_id UUID,
  manager_notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE public.shift_swap_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES public.shift_swaps(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shift_swaps
CREATE POLICY "Users can view all swaps"
ON public.shift_swaps FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own swaps"
ON public.shift_swaps FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own swaps or claim swaps"
ON public.shift_swaps FOR UPDATE
TO authenticated
USING (
  requester_id = auth.uid() OR
  claimer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

CREATE POLICY "Users can delete their own swaps"
ON public.shift_swaps FOR DELETE
TO authenticated
USING (requester_id = auth.uid());

-- RLS Policies for shift_swap_messages
CREATE POLICY "Users can view swap messages"
ON public.shift_swap_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create messages"
ON public.shift_swap_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_team_challenges_status ON public.team_challenges(status);
CREATE INDEX idx_team_challenges_dates ON public.team_challenges(start_date, end_date);
CREATE INDEX idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX idx_shift_swaps_status ON public.shift_swaps(status);
CREATE INDEX idx_shift_swaps_date ON public.shift_swaps(original_date);
CREATE INDEX idx_shift_swaps_requester ON public.shift_swaps(requester_id);