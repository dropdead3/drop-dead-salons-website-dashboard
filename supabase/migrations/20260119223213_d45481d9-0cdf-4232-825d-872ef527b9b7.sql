
-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  description TEXT,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read templates
CREATE POLICY "Authenticated users can read email templates"
ON public.email_templates
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (template_key, name, subject, html_body, description, variables) VALUES
(
  'birthday_reminder',
  'Birthday Reminder',
  '🎂 Birthday Reminder: {{count}} upcoming birthday{{plural}} on {{date}}',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Upcoming Birthday Reminder</h1>
  </div>
  <div style="background: #fdf2f8; padding: 24px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      The following team member{{plural}} {{hasHave}} a birthday coming up on <strong>{{date}}</strong>:
    </p>
    <ul style="list-style: none; padding: 0; margin: 0 0 24px 0;">
      {{birthdayList}}
    </ul>
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      Don''t forget to wish them a happy birthday! 🎈
    </p>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
    This is an automated reminder from Drop Dead Gorgeous.
  </p>
</div>',
  'Sent to leadership team before team member birthdays',
  ARRAY['count', 'plural', 'date', 'hasHave', 'birthdayList']
),
(
  'handbook_reminder',
  'Handbook Acknowledgment Reminder',
  '📚 Action Required: Please Review {{handbook_title}}',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📚 Handbook Review Required</h1>
  </div>
  <div style="background: #eff6ff; padding: 24px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      Hi {{employee_name}},
    </p>
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      Please review and acknowledge the following handbook: <strong>{{handbook_title}}</strong>
    </p>
    <a href="{{dashboard_url}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
      View Handbook
    </a>
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
      Thank you for your attention to this matter.
    </p>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
    This is an automated reminder from Drop Dead Gorgeous.
  </p>
</div>',
  'Sent to employees who need to acknowledge handbooks',
  ARRAY['employee_name', 'handbook_title', 'dashboard_url']
),
(
  'daily_program_reminder',
  'Daily Program Reminder',
  '✨ Your Daily Tasks for Day {{day_number}}',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✨ Day {{day_number}} Tasks</h1>
  </div>
  <div style="background: #ecfdf5; padding: 24px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      Hi {{employee_name}},
    </p>
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      It''s Day {{day_number}} of your program! Log in to complete your daily tasks and keep your streak going.
    </p>
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      🔥 Current streak: <strong>{{streak_count}} days</strong>
    </p>
    <a href="{{dashboard_url}}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
      Complete Today''s Tasks
    </a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
    This is an automated reminder from Drop Dead Gorgeous.
  </p>
</div>',
  'Daily reminder for stylists enrolled in the program',
  ARRAY['employee_name', 'day_number', 'streak_count', 'dashboard_url']
),
(
  'welcome_email',
  'Welcome Email',
  '🎉 Welcome to Drop Dead Gorgeous!',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Welcome to the Team!</h1>
  </div>
  <div style="background: #fff7ed; padding: 24px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      Hi {{employee_name}},
    </p>
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      Welcome to Drop Dead Gorgeous! We''re thrilled to have you join our team.
    </p>
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      Your account has been created. Please log in to complete your profile and review any required handbooks.
    </p>
    <a href="{{dashboard_url}}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
      Get Started
    </a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
    This is an automated message from Drop Dead Gorgeous.
  </p>
</div>',
  'Sent to new team members when their account is created',
  ARRAY['employee_name', 'dashboard_url']
),
(
  'strike_notification',
  'Strike Notification',
  '⚠️ New Strike Recorded',
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Strike Notification</h1>
  </div>
  <div style="background: #fef2f2; padding: 24px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
      A new strike has been recorded for <strong>{{employee_name}}</strong>.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tr><td style="padding: 8px 0; color: #6b7280;">Type:</td><td style="padding: 8px 0; font-weight: 500;">{{strike_type}}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">Severity:</td><td style="padding: 8px 0; font-weight: 500;">{{severity}}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">Title:</td><td style="padding: 8px 0; font-weight: 500;">{{title}}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">Date:</td><td style="padding: 8px 0; font-weight: 500;">{{incident_date}}</td></tr>
    </table>
    <a href="{{dashboard_url}}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
      View Details
    </a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
    This is an automated notification from Drop Dead Gorgeous.
  </p>
</div>',
  'Sent to leadership when a new strike is recorded',
  ARRAY['employee_name', 'strike_type', 'severity', 'title', 'incident_date', 'dashboard_url']
);
