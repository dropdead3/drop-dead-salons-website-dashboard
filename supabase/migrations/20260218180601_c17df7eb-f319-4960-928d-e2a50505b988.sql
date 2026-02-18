ALTER TABLE public.stylist_personal_goals
  ADD COLUMN retail_monthly_target NUMERIC DEFAULT 0 NOT NULL,
  ADD COLUMN retail_weekly_target NUMERIC DEFAULT 0 NOT NULL;