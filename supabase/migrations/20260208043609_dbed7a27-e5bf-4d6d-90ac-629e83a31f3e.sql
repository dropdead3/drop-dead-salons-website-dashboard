-- Organization feature configuration with state preservation
CREATE TABLE public.organization_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    feature_key TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    last_known_config JSONB DEFAULT '{}',
    disabled_at TIMESTAMPTZ,
    enabled_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, feature_key)
);

-- Feature definitions (platform-managed catalog)
CREATE TABLE public.feature_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    icon_name TEXT,
    is_core BOOLEAN DEFAULT false,
    requires_features TEXT[],
    default_enabled BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed feature catalog
INSERT INTO public.feature_catalog (feature_key, feature_name, description, category, icon_name, is_core, display_order) VALUES
-- Core (cannot be disabled)
('command_center', 'Command Center', 'Central dashboard with quick actions and overview', 'core', 'LayoutDashboard', true, 1),
('schedule', 'Schedule', 'Appointment calendar and booking management', 'core', 'CalendarDays', true, 2),
('team_directory', 'Team Directory', 'Staff profiles and contact information', 'core', 'Users', true, 3),

-- Team Development
('training', 'Training Hub', 'Video library and course management', 'team_development', 'Video', false, 10),
('onboarding', 'Onboarding', 'New hire task checklists and progress tracking', 'team_development', 'ClipboardList', false, 11),
('graduation_tracker', 'Graduation Tracker', 'Assistant advancement and milestone tracking', 'team_development', 'GraduationCap', false, 12),
('client_engine_program', 'Client Engine Program', 'New-client building program with weekly goals', 'team_development', 'Target', false, 13),
('team_challenges', 'Team Challenges', 'Gamified competitions and leaderboards', 'team_development', 'Trophy', false, 14),

-- Operations
('shift_swaps', 'Shift Swaps', 'Staff shift exchange marketplace', 'operations', 'ArrowLeftRight', false, 20),
('assistant_requests', 'Assistant Requests', 'Stylist-to-assistant help requests', 'operations', 'HandHelping', false, 21),
('day_rate', 'Day Rate Rentals', 'Chair rental bookings and pricing', 'operations', 'Armchair', false, 22),
('strikes', 'Staff Strikes', 'Disciplinary tracking and warnings', 'operations', 'AlertTriangle', false, 23),

-- Analytics
('sales_analytics', 'Sales Analytics', 'Revenue tracking and sales reports', 'analytics', 'DollarSign', false, 30),
('operations_analytics', 'Operations Analytics', 'Staffing and productivity metrics', 'analytics', 'BarChart3', false, 31),
('marketing_analytics', 'Marketing Analytics', 'Campaign performance and ROI tracking', 'analytics', 'TrendingUp', false, 32),
('program_analytics', 'Program Analytics', 'Client Engine and training metrics', 'analytics', 'Target', false, 33),

-- Client Experience
('feedback_hub', 'Feedback Hub', 'Client surveys, NPS, and review routing', 'client_experience', 'MessageSquare', false, 40),
('reengagement', 'Re-engagement', 'Win-back campaigns for inactive clients', 'client_experience', 'UserCheck', false, 41),
('loyalty_program', 'Loyalty & Rewards', 'Points, tiers, and reward redemption', 'client_experience', 'Gift', false, 42),
('gift_cards', 'Gift Cards', 'Digital gift card issuance and tracking', 'client_experience', 'CreditCard', false, 43),

-- Communications
('email_templates', 'Email Templates', 'Customizable email communications', 'communications', 'Mail', false, 50),
('sms_templates', 'SMS Templates', 'Text message templates and automation', 'communications', 'MessageSquare', false, 51),
('announcements', 'Announcements', 'Team-wide communications and notifications', 'communications', 'Bell', false, 52),

-- Recruiting
('lead_management', 'Lead Management', 'Potential hire tracking and follow-up', 'recruiting', 'UserPlus', false, 60),
('recruiting_pipeline', 'Recruiting Pipeline', 'Interview stages and hiring funnel', 'recruiting', 'Briefcase', false, 61),

-- Financial
('payroll', 'Payroll Hub', 'Commission calculations and pay runs', 'financial', 'DollarSign', false, 70),
('booth_renters', 'Booth Renters', 'Renter management and rent collection', 'financial', 'Store', false, 71),

-- Website
('website_editor', 'Website Editor', 'Public website content management', 'website', 'Globe', false, 80);

-- Enable RLS
ALTER TABLE public.organization_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_features
CREATE POLICY "Org members can view their features"
ON public.organization_features FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Super admins can manage org features"
ON public.organization_features FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.employee_profiles ep
        WHERE ep.user_id = auth.uid()
        AND ep.organization_id = organization_features.organization_id
        AND ep.is_super_admin = true
    )
    OR public.is_platform_user(auth.uid())
);

-- RLS Policies for feature_catalog
CREATE POLICY "Anyone can view feature catalog"
ON public.feature_catalog FOR SELECT
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_organization_features_updated_at
BEFORE UPDATE ON public.organization_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();