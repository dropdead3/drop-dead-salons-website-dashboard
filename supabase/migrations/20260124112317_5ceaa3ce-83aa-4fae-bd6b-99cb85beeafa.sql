-- Create build_tasks table for dynamic build tracking
CREATE TABLE public.build_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'blocked', 'complete')),
  category TEXT NOT NULL DEFAULT 'enhancement' CHECK (category IN ('api', 'enhancement', 'setup', 'integration')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  blocked_by TEXT,
  notes TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.build_tasks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view build tasks
CREATE POLICY "Authenticated users can view build tasks"
ON public.build_tasks
FOR SELECT
TO authenticated
USING (true);

-- Only admins with manage_settings can manage build tasks
CREATE POLICY "Admins can manage build tasks"
ON public.build_tasks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
    AND p.name = 'manage_settings'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
    AND p.name = 'manage_settings'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_build_tasks_updated_at
BEFORE UPDATE ON public.build_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial build tasks from current DashboardBuild.tsx
INSERT INTO public.build_tasks (task_key, title, description, status, category, priority, blocked_by, notes, sort_order) VALUES
-- Blocked Tasks
('vapid-keys', 'VAPID Keys for Push Notifications', 'Generate and configure VAPID public/private key pair for Web Push API authentication', 'blocked', 'setup', 'high', 'Need to generate keys and add as secrets', ARRAY['Generate keys using: npx web-push generate-vapid-keys', 'Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to project secrets', 'Push notification infrastructure is ready and waiting for keys'], 1),
('phorest-api', 'Phorest Booking Calendar Integration', 'Integrate Phorest API to pull real-time booking calendar data for conflict detection', 'blocked', 'api', 'high', 'Waiting for Phorest API keys', ARRAY['Will enable real-time calendar sync', 'Conflict detection with actual bookings', 'Auto-suggest available time slots for assistant requests'], 2),
('phorest-client-data', 'Phorest Client Data Sync', 'Pull client information from Phorest for enhanced request details', 'blocked', 'api', 'medium', 'Waiting for Phorest API keys', ARRAY['Client history and preferences', 'Service history for better assistant matching'], 3),

-- Pending Tasks
('location-gallery', 'Location Gallery Photos', 'Replace placeholder Unsplash images with actual salon photos for location cards', 'pending', 'setup', 'medium', NULL, ARRAY['LocationsSection.tsx uses placeholder images', 'Need photos for North Mesa, South Mesa, Gilbert, and Chandler', 'Recommended: 3-4 high-quality photos per location'], 4),
('sms-notifications', 'SMS Notifications via Twilio', 'Text message alerts for urgent assignments', 'pending', 'enhancement', 'medium', NULL, ARRAY['Requires Twilio API keys (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)'], 5),
('ai-suggestions', 'AI-Powered Assistant Suggestions', 'Smart recommendations based on workload, history, and availability', 'pending', 'enhancement', 'low', NULL, ARRAY['Can use Lovable AI gateway (no external API needed)'], 6),
('stylist-preferences', 'Stylist Preference Settings', 'Allow stylists to set and rank preferred assistants', 'pending', 'enhancement', 'medium', NULL, ARRAY['Would add preferred_assistants column to employee_profiles'], 7),
('weekly-reports', 'Weekly Performance Reports', 'Automated email summaries of assistant metrics to managers', 'pending', 'enhancement', 'low', NULL, ARRAY['Schedule via cron, use existing Resend integration'], 8),
('availability-blocking', 'Assistant Availability Blocking', 'Allow assistants to mark time slots as unavailable', 'pending', 'enhancement', 'medium', NULL, ARRAY['Would prevent assignments during blocked periods'], 9),

-- Complete Tasks
('response-tracking', 'Response Time Tracking', 'Automatic calculation of time between assignment and accept/decline', 'complete', 'enhancement', 'high', NULL, ARRAY['Database trigger calculates response_time_seconds automatically'], 10),
('manual-override', 'Admin Manual Override', 'Ability for admins to manually assign specific assistants', 'complete', 'enhancement', 'high', NULL, NULL, 11),
('performance-metrics', 'Assistant Performance Metrics', 'Reliability scores, acceptance rates, and average response times', 'complete', 'enhancement', 'high', NULL, NULL, 12),
('workload-viz', 'Workload Distribution Visualization', 'Charts showing assignment distribution across assistants', 'complete', 'enhancement', 'medium', NULL, NULL, 13),
('calendar-view', 'Calendar View with Conflict Detection', 'Monthly calendar showing all requests with overlap detection', 'complete', 'enhancement', 'high', NULL, ARRAY['Ready for Phorest integration to add real booking data'], 14),
('profile-history', 'Profile History Integration', 'Request history card on ViewProfile for assistants', 'complete', 'enhancement', 'medium', NULL, NULL, 15),
('email-notifications', 'Email Notifications for Accept/Decline', 'Stylists receive email when their request is accepted or declined', 'complete', 'enhancement', 'high', NULL, ARRAY['Uses Resend API - RESEND_API_KEY configured ✓'], 16),
('push-infrastructure', 'Push Notification Infrastructure', 'Service worker, subscription management, and edge function ready', 'complete', 'enhancement', 'high', NULL, ARRAY['Waiting on VAPID keys to activate'], 17),
('round-robin', 'Round-Robin Auto-Assignment', 'Automated fair distribution of requests across available assistants', 'complete', 'integration', 'high', NULL, ARRAY['assign-assistant edge function handles location-based filtering'], 18),
('reassignment', 'Decline & Reassignment Flow', 'Automatic reassignment when assistant declines, excluding them from that request', 'complete', 'integration', 'high', NULL, ARRAY['reassign-assistant edge function with declined_by tracking'], 19),
('expiry-cron', 'Response Deadline Enforcement', 'Cron job to auto-reassign requests that exceed response deadline', 'complete', 'integration', 'high', NULL, ARRAY['check-expired-assignments runs periodically'], 20),
('recurring-requests', 'Recurring Request Patterns', 'Support for daily, weekly, bi-weekly, and monthly recurring requests', 'complete', 'enhancement', 'medium', NULL, NULL, 21),
('feature-flags', 'Feature Flags System', 'Controlled feature rollouts with percentage rollouts and role-based access', 'complete', 'enhancement', 'high', NULL, ARRAY['Admin management UI at /dashboard/admin/feature-flags', 'Supports percentage rollouts and role-based toggles'], 22);