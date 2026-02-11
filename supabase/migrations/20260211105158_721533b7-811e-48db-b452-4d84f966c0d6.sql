-- Add processing mode to payroll settings
-- 'manual' = admin must submit payroll themselves
-- 'automatic' = payroll runs automatically via connected provider (Gusto/QB)
ALTER TABLE public.organization_payroll_settings
ADD COLUMN IF NOT EXISTS processing_mode text NOT NULL DEFAULT 'manual'
CHECK (processing_mode IN ('manual', 'automatic'));

-- Add optional scheduled run time for automatic payroll
ALTER TABLE public.organization_payroll_settings
ADD COLUMN IF NOT EXISTS auto_run_days_before_check integer NOT NULL DEFAULT 2;

COMMENT ON COLUMN public.organization_payroll_settings.processing_mode IS 'manual = admin submits, automatic = provider runs payroll automatically';
COMMENT ON COLUMN public.organization_payroll_settings.auto_run_days_before_check IS 'For automatic mode: how many days before check date payroll is scheduled to run';