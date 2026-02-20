ALTER TABLE public.organization_payroll_settings
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_days_before integer[] DEFAULT '{3,1,0}',
  ADD COLUMN IF NOT EXISTS reminder_channels jsonb DEFAULT '{"email": true, "push": true, "sms_on_missed": true}';