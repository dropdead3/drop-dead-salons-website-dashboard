-- Create product_features table for AI demo feature matching
CREATE TABLE public.product_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  problem_keywords TEXT[] DEFAULT '{}',
  category TEXT,
  screenshot_url TEXT,
  demo_video_url TEXT,
  related_features TEXT[] DEFAULT '{}',
  is_highlighted BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_features ENABLE ROW LEVEL SECURITY;

-- Public read access (for demo page)
CREATE POLICY "Anyone can view active product features"
ON public.product_features
FOR SELECT
USING (is_active = true);

-- Platform admins can manage features
CREATE POLICY "Platform users can manage product features"
ON public.product_features
FOR ALL
TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_product_features_updated_at
BEFORE UPDATE ON public.product_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial feature data
INSERT INTO public.product_features (feature_key, name, tagline, description, problem_keywords, category, related_features, is_highlighted, display_order) VALUES
('command_center', 'Command Center', 'Your daily salon dashboard at a glance', 'The Command Center is your salon''s mission control. Get instant visibility into today''s appointments, team status, quick actions, and key metrics—all from one central hub. Start your day informed and in control.', ARRAY['dashboard', 'overview', 'stats', 'metrics', 'daily', 'home', 'main'], 'overview', ARRAY['analytics_hub', 'schedule'], true, 1),

('schedule', 'Schedule', 'Visual calendar for all appointments', 'Our intuitive scheduling system shows appointments in a beautiful calendar view. See who''s booked, identify gaps, and manage your day with drag-and-drop simplicity. Color-coded by stylist or service for instant clarity.', ARRAY['calendar', 'appointments', 'booking', 'schedule', 'time', 'availability', 'conflicts'], 'scheduling', ARRAY['command_center', 'team_directory'], true, 2),

('team_directory', 'Team Directory', 'Find and manage your team members', 'Access complete profiles for every team member. View schedules, specialties, contact info, and performance metrics. The single source of truth for your salon staff.', ARRAY['staff', 'employees', 'team', 'stylists', 'profiles', 'directory', 'find', 'search'], 'team', ARRAY['schedule', 'payroll_hub'], true, 3),

('client_directory', 'Client Directory', 'Know every client inside and out', 'Build lasting relationships with comprehensive client profiles. Track visit history, preferences, notes, and contact info. Never forget a regular''s favorite treatment again.', ARRAY['clients', 'customers', 'guest', 'profiles', 'history', 'preferences', 'loyalty', 'retention'], 'clients', ARRAY['schedule', 'analytics_hub'], true, 4),

('analytics_hub', 'Analytics Hub', 'Data-driven insights for smarter decisions', 'Transform raw data into actionable insights. Track revenue, analyze trends, compare periods, and identify growth opportunities. Beautiful charts make complex data easy to understand.', ARRAY['analytics', 'reports', 'metrics', 'revenue', 'performance', 'data', 'trends', 'growth', 'tracking'], 'analytics', ARRAY['payroll_hub', 'command_center'], true, 5),

('payroll_hub', 'Payroll Hub', 'Automate tips, commissions, and payroll', 'Say goodbye to spreadsheet nightmares. Configure unlimited commission tiers, track tips automatically, and generate accurate payroll in minutes. Works with Gusto and QuickBooks for seamless exports.', ARRAY['payroll', 'commission', 'tips', 'pay', 'wages', 'salary', 'compensation', 'gusto', 'quickbooks', 'calculate'], 'payroll', ARRAY['analytics_hub', 'team_directory'], true, 6),

('renter_hub', 'Renter Hub', 'Booth rental management made simple', 'Manage booth renters with dedicated contracts, rent tracking, and separate accounting. Handle mixed employment models (W2 + 1099) without the confusion.', ARRAY['booth', 'renter', 'rental', 'contract', '1099', 'independent', 'contractor', 'suite'], 'payroll', ARRAY['payroll_hub', 'team_directory'], false, 7),

('team_chat', 'Team Chat', 'Real-time communication for your salon', 'Keep your whole team connected with integrated messaging. Channels for locations, departments, or topics. Share updates, celebrate wins, and coordinate in real-time—all within the app.', ARRAY['chat', 'messaging', 'communication', 'announcements', 'team', 'notification', 'updates', 'slack'], 'communication', ARRAY['announcements', 'team_directory'], true, 8),

('announcements', 'Announcements', 'Broadcast important updates to your team', 'Ensure critical information reaches everyone. Pin important announcements, track who''s read them, and schedule future posts. No more "I didn''t see that" excuses.', ARRAY['announcements', 'broadcast', 'news', 'updates', 'communication', 'notify', 'pinned'], 'communication', ARRAY['team_chat', 'command_center'], false, 9),

('help_center', 'Help Center', 'Self-service knowledge base', 'Empower your team with instant answers. Build a searchable library of SOPs, training materials, and FAQs. Reduce repetitive questions and onboard new hires faster.', ARRAY['help', 'support', 'faq', 'knowledge', 'training', 'documentation', 'sop', 'procedures', 'onboarding'], 'training', ARRAY['training_hub', 'team_directory'], false, 10),

('training_hub', 'Training Hub', 'Develop your team with structured learning', 'Create training programs, track completion, and measure skill development. Upload videos, assign courses, and celebrate achievements. Build a culture of continuous improvement.', ARRAY['training', 'learning', 'development', 'courses', 'education', 'skills', 'certification', 'onboarding'], 'training', ARRAY['help_center', 'team_directory'], true, 11),

('access_permissions', 'Access & Permissions', 'Control who sees and does what', 'Fine-grained role-based access control. Create custom roles, set permissions per feature, and ensure sensitive data stays protected. Security without the complexity.', ARRAY['permissions', 'access', 'roles', 'security', 'admin', 'control', 'restrict', 'privacy'], 'admin', ARRAY['team_directory'], false, 12);