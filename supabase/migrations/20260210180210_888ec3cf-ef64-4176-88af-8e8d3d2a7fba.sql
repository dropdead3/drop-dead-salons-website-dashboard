
-- Add insights email preference columns to notification_preferences
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS insights_email_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insights_email_frequency text NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS insights_email_last_sent timestamptz,
  ADD COLUMN IF NOT EXISTS insights_email_next_at timestamptz;
