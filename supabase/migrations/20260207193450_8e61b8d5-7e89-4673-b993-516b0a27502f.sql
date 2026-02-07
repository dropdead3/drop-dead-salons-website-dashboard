-- =============================================
-- PHASE 3: Training Quizzes, Daily Huddles, Points Economy
-- =============================================

-- 1. TRAINING QUIZZES
-- =============================================

-- Quiz definitions
CREATE TABLE public.training_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.training_videos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER DEFAULT 80,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.training_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB,
  correct_answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- User quiz attempts
CREATE TABLE public.training_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  passed BOOLEAN,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz policies
CREATE POLICY "Authenticated users can view quizzes"
ON public.training_quizzes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage quizzes"
ON public.training_quizzes FOR ALL TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can view quiz questions"
ON public.training_quiz_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage quiz questions"
ON public.training_quiz_questions FOR ALL TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can view own quiz attempts"
ON public.training_quiz_attempts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can create own quiz attempts"
ON public.training_quiz_attempts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2. DAILY HUDDLES
-- =============================================

CREATE TABLE public.daily_huddles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  huddle_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location_id TEXT,
  created_by UUID NOT NULL,
  focus_of_the_day TEXT,
  sales_goals JSONB,
  announcements TEXT,
  birthdays_celebrations TEXT,
  training_reminders TEXT,
  wins_from_yesterday TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(huddle_date, location_id)
);

CREATE TABLE public.huddle_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  huddle_id UUID REFERENCES public.daily_huddles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(huddle_id, user_id)
);

CREATE TABLE public.huddle_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_id TEXT,
  template_content JSONB,
  is_default BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_huddles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.huddle_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.huddle_templates ENABLE ROW LEVEL SECURITY;

-- Huddle policies
CREATE POLICY "Users can view published huddles"
ON public.daily_huddles FOR SELECT TO authenticated
USING (is_published = true OR public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can manage huddles"
ON public.daily_huddles FOR ALL TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can view own acknowledgments"
ON public.huddle_acknowledgments FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can create own acknowledgments"
ON public.huddle_acknowledgments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all templates"
ON public.huddle_templates FOR SELECT TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can manage templates"
ON public.huddle_templates FOR ALL TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- 3. POINTS ECONOMY
-- =============================================

CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL UNIQUE,
  points_awarded INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_daily INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT,
  quantity_available INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_id UUID REFERENCES public.rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Points ledger policies
CREATE POLICY "Users can view own points"
ON public.points_ledger FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_coach_or_admin(auth.uid()));

CREATE POLICY "System can insert points"
ON public.points_ledger FOR INSERT TO authenticated
WITH CHECK (true);

-- Points rules policies
CREATE POLICY "Anyone can view active rules"
ON public.points_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rules"
ON public.points_rules FOR ALL TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- Rewards catalog policies
CREATE POLICY "Anyone can view active rewards"
ON public.rewards_catalog FOR SELECT TO authenticated
USING (is_active = true OR public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can manage rewards"
ON public.rewards_catalog FOR ALL TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- Redemption policies
CREATE POLICY "Users can view own redemptions"
ON public.reward_redemptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Users can create own redemptions"
ON public.reward_redemptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update redemptions"
ON public.reward_redemptions FOR UPDATE TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- 4. DATABASE FUNCTIONS
-- =============================================

-- Function to get user's point balance
CREATE OR REPLACE FUNCTION public.get_user_points_balance(_user_id uuid)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.points_ledger
  WHERE user_id = _user_id
$$;

-- Function to award points with daily cap check
CREATE OR REPLACE FUNCTION public.award_points(
  _user_id uuid,
  _action_type text,
  _reference_id uuid DEFAULT NULL,
  _description text DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_today_count INTEGER;
  v_points_awarded INTEGER := 0;
BEGIN
  -- Get the rule for this action type
  SELECT * INTO v_rule FROM public.points_rules
  WHERE action_type = _action_type AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Check daily cap if applicable
  IF v_rule.max_daily IS NOT NULL THEN
    SELECT COUNT(*) INTO v_today_count
    FROM public.points_ledger
    WHERE user_id = _user_id
      AND action_type = _action_type
      AND created_at >= CURRENT_DATE;
    
    IF v_today_count >= v_rule.max_daily THEN
      RETURN 0;
    END IF;
  END IF;
  
  -- Award points
  INSERT INTO public.points_ledger (user_id, points, action_type, reference_id, description)
  VALUES (_user_id, v_rule.points_awarded, _action_type, _reference_id, COALESCE(_description, v_rule.description));
  
  v_points_awarded := v_rule.points_awarded;
  RETURN v_points_awarded;
END;
$$;

-- 5. SEED DEFAULT POINT RULES
-- =============================================

INSERT INTO public.points_rules (action_type, points_awarded, description, max_daily) VALUES
  ('training_complete', 10, 'Completed a training video', NULL),
  ('bell_ring', 25, 'Rang the bell for a win', 3),
  ('high_five_given', 5, 'Gave a high five', 10),
  ('high_five_received', 2, 'Received a high five', NULL),
  ('challenge_win', 100, 'Won a team challenge', NULL),
  ('shift_swap_complete', 15, 'Completed a shift swap', NULL),
  ('quiz_passed', 15, 'Passed a training quiz', NULL),
  ('streak_7_day', 50, 'Achieved 7-day activity streak', NULL),
  ('streak_30_day', 200, 'Achieved 30-day activity streak', NULL)
ON CONFLICT (action_type) DO NOTHING;

-- 6. INDEXES
-- =============================================

CREATE INDEX idx_points_ledger_user ON public.points_ledger(user_id);
CREATE INDEX idx_points_ledger_created ON public.points_ledger(created_at);
CREATE INDEX idx_daily_huddles_date ON public.daily_huddles(huddle_date);
CREATE INDEX idx_quiz_attempts_user ON public.training_quiz_attempts(user_id);
CREATE INDEX idx_redemptions_user ON public.reward_redemptions(user_id);
CREATE INDEX idx_redemptions_status ON public.reward_redemptions(status);