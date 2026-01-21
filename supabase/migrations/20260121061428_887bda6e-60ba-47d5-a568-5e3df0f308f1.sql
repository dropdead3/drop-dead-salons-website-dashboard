-- Create program configuration table
CREATE TABLE public.program_configuration (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    program_name text NOT NULL DEFAULT 'Client Engine',
    total_days integer NOT NULL DEFAULT 75,
    weekly_wins_interval integer NOT NULL DEFAULT 7,
    require_proof_upload boolean NOT NULL DEFAULT true,
    require_metrics_logging boolean NOT NULL DEFAULT true,
    allow_manual_restart boolean NOT NULL DEFAULT true,
    auto_restart_on_miss boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create program daily tasks table
CREATE TABLE public.program_daily_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_key text NOT NULL UNIQUE,
    label text NOT NULL,
    description text,
    display_order integer NOT NULL DEFAULT 0,
    is_required boolean NOT NULL DEFAULT true,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create program rules table
CREATE TABLE public.program_rules (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_number integer NOT NULL,
    rule_text text NOT NULL,
    is_emphasized boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.program_configuration (program_name, total_days, weekly_wins_interval)
VALUES ('Client Engine', 75, 7);

-- Insert default daily tasks
INSERT INTO public.program_daily_tasks (task_key, label, description, display_order) VALUES
    ('content_posted', 'Post content (reel, story, or carousel)', 'Share valuable content with your audience daily', 1),
    ('dms_responded', 'Respond to all DMs within 2 hours', 'Quick response time is key to conversion', 2),
    ('follow_ups', 'Follow up with 3 potential clients', 'Consistent outreach builds your pipeline', 3),
    ('metrics_logged', 'Log your daily metrics', 'Track your progress and identify patterns', 4);

-- Insert default rules
INSERT INTO public.program_rules (rule_number, rule_text, is_emphasized, display_order) VALUES
    (1, 'Complete all daily tasks', false, 1),
    (2, 'Upload proof of work', false, 2),
    (3, 'Log your metrics', false, 3),
    (4, 'Submit Weekly Wins every 7 days', false, 4),
    (5, 'Miss one day = restart', true, 5);

-- Enable RLS
ALTER TABLE public.program_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for program_configuration
CREATE POLICY "Anyone authenticated can view program configuration"
ON public.program_configuration FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage program configuration"
ON public.program_configuration FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.user_id = auth.uid()
    AND employee_profiles.is_super_admin = true
));

-- RLS policies for program_daily_tasks
CREATE POLICY "Anyone authenticated can view daily tasks"
ON public.program_daily_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage daily tasks"
ON public.program_daily_tasks FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.user_id = auth.uid()
    AND employee_profiles.is_super_admin = true
));

-- RLS policies for program_rules
CREATE POLICY "Anyone authenticated can view program rules"
ON public.program_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage program rules"
ON public.program_rules FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.user_id = auth.uid()
    AND employee_profiles.is_super_admin = true
));

-- Create update timestamp triggers
CREATE TRIGGER update_program_configuration_updated_at
    BEFORE UPDATE ON public.program_configuration
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_daily_tasks_updated_at
    BEFORE UPDATE ON public.program_daily_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_rules_updated_at
    BEFORE UPDATE ON public.program_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();