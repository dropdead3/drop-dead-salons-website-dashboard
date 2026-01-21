-- Phase 1-4 Database Schema Updates

-- 1. Program Resources Table
CREATE TABLE IF NOT EXISTS public.program_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  week_id UUID REFERENCES public.program_weeks(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for program_resources
CREATE POLICY "Anyone authenticated can view active resources"
  ON public.program_resources FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Super admins can manage resources"
  ON public.program_resources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.employee_profiles 
    WHERE user_id = auth.uid() AND is_super_admin = true
  ));

-- 2. Program Achievements Table
CREATE TABLE IF NOT EXISTS public.program_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  badge_color TEXT NOT NULL DEFAULT 'primary',
  achievement_type TEXT NOT NULL, -- 'streak', 'milestone', 'special'
  threshold INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for program_achievements
CREATE POLICY "Anyone can view achievements"
  ON public.program_achievements FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage achievements"
  ON public.program_achievements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.employee_profiles 
    WHERE user_id = auth.uid() AND is_super_admin = true
  ));

-- 3. User Program Achievements Table
CREATE TABLE IF NOT EXISTS public.user_program_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES public.stylist_program_enrollment(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.program_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_program_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_program_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_program_achievements FOR SELECT
  USING (auth.uid() = user_id OR current_user_is_coach());

CREATE POLICY "System can insert achievements"
  ON public.user_program_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id OR current_user_is_coach());

-- 4. Add is_pinned to coach_notes
ALTER TABLE public.coach_notes 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- 5. Add program_reminders to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS program_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS streak_warning_enabled BOOLEAN NOT NULL DEFAULT true;

-- 6. Insert default achievements
INSERT INTO public.program_achievements (key, title, description, icon, badge_color, achievement_type, threshold) VALUES
  ('streak_7', 'Week Warrior', '7 day streak - Consistency is building', 'flame', 'orange', 'streak', 7),
  ('streak_21', 'Habit Builder', '21 day streak - Habits are forming', 'flame', 'yellow', 'streak', 21),
  ('streak_30', 'Monthly Master', '30 day streak - One month strong', 'flame', 'amber', 'streak', 30),
  ('week_1_complete', 'First Week Done', 'Completed Week 1 assignments', 'check-circle', 'green', 'milestone', 1),
  ('halfway', 'Halfway Hero', 'Reached Day 38 - More than halfway there', 'target', 'blue', 'milestone', 38),
  ('finisher', 'Client Engine Graduate', 'Completed all 75 days', 'trophy', 'gold', 'milestone', 75),
  ('perfect_week', 'Perfect Week', '100% completion on weekly assignments', 'star', 'purple', 'special', 1),
  ('comeback_kid', 'Comeback Kid', 'Completed program after a restart', 'rotate-ccw', 'teal', 'special', 1),
  ('bell_ringer', 'Bell Ringer', 'Rang the bell during the program', 'bell', 'primary', 'special', 1)
ON CONFLICT (key) DO NOTHING;

-- 7. Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_program_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_program_resources_updated_at ON public.program_resources;
CREATE TRIGGER update_program_resources_updated_at
  BEFORE UPDATE ON public.program_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_program_resources_updated_at();

-- 8. Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stylist_program_enrollment;