-- Create achievements definition table
CREATE TABLE public.leaderboard_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  badge_color TEXT NOT NULL DEFAULT 'primary',
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements tracking table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.leaderboard_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.leaderboard_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can view achievements
CREATE POLICY "Anyone can view achievements"
ON public.leaderboard_achievements
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage achievements
CREATE POLICY "Admins can manage achievements"
ON public.leaderboard_achievements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Users can view all earned achievements
CREATE POLICY "Anyone can view earned achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (true);

-- System/admins can grant achievements
CREATE POLICY "Admins can grant achievements"
ON public.user_achievements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Create indexes
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON public.user_achievements(achievement_id);

-- Insert default achievements
INSERT INTO public.leaderboard_achievements (key, name, description, icon, badge_color, category, requirement_type, requirement_value) VALUES
('first_place', 'Top of the Charts', 'Reached #1 on the overall leaderboard', 'crown', 'amber', 'ranking', 'rank_achieved', 1),
('three_week_streak', 'Unstoppable', '3-week streak at #1 position', 'flame', 'orange', 'streak', 'weeks_at_rank', 3),
('five_week_streak', 'Legendary', '5-week streak at #1 position', 'star', 'purple', 'streak', 'weeks_at_rank', 5),
('most_improved', 'Rising Star', 'Most improved ranking this month', 'trending-up', 'emerald', 'improvement', 'most_improved', 1),
('consistent_top3', 'Elite Performer', 'Stayed in top 3 for 4 consecutive weeks', 'award', 'blue', 'consistency', 'weeks_in_top', 4),
('new_client_champion', 'Client Magnet', 'Led in new clients for 3+ weeks', 'users', 'pink', 'category', 'weeks_leading_category', 3),
('retention_master', 'Loyalty Builder', 'Achieved 95%+ retention rate', 'heart', 'rose', 'metric', 'retention_threshold', 95),
('retail_rockstar', 'Sales Superstar', 'Led retail sales for a month', 'shopping-bag', 'teal', 'category', 'weeks_leading_category', 4),
('extension_expert', 'Extension Excellence', 'Top extension provider for 3+ weeks', 'sparkles', 'violet', 'category', 'weeks_leading_category', 3),
('perfect_score', 'Perfection', 'Achieved 90+ overall score', 'zap', 'yellow', 'metric', 'score_threshold', 90);