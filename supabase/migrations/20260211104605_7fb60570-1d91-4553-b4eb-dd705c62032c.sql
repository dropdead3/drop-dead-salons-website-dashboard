
-- Add payroll_deadline_enabled to notification_preferences
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS payroll_deadline_enabled boolean NOT NULL DEFAULT true;
