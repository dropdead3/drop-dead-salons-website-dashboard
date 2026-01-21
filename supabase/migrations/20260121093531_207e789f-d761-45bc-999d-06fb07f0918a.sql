-- Add welcome page content fields to program_configuration
ALTER TABLE public.program_configuration
ADD COLUMN welcome_headline TEXT DEFAULT 'BUILD YOUR CLIENT ENGINE',
ADD COLUMN welcome_subheadline TEXT DEFAULT '75 days of focused execution. No shortcuts. No excuses. Transform your book and build a business that runs on autopilot.',
ADD COLUMN welcome_cta_text TEXT DEFAULT 'I''M READY — START DAY 1';