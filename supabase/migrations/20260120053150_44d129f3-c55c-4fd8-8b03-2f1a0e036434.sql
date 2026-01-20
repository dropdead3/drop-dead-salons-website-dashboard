-- Create email_variables table for dynamic variable management
CREATE TABLE public.email_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  example TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_variables ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active variables
CREATE POLICY "Authenticated users can read variables" 
  ON public.email_variables FOR SELECT 
  TO authenticated 
  USING (is_active = true);

-- Admins can manage all variables
CREATE POLICY "Admins can insert variables" 
  ON public.email_variables FOR INSERT 
  TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update variables" 
  ON public.email_variables FOR UPDATE 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete variables" 
  ON public.email_variables FOR DELETE 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_email_variables_updated_at
  BEFORE UPDATE ON public.email_variables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with existing variables
INSERT INTO public.email_variables (variable_key, category, description, example) VALUES
  -- Recipient category
  ('recipient_name', 'Recipient', 'Full name of email recipient', 'Sarah Johnson'),
  ('recipient_first_name', 'Recipient', 'First name only', 'Sarah'),
  ('recipient_email', 'Recipient', 'Email address', 'sarah@example.com'),
  ('recipient_phone', 'Recipient', 'Phone number', '(555) 123-4567'),
  ('recipient_role', 'Recipient', 'User role in organization', 'Stylist'),
  ('recipient_location', 'Recipient', 'Assigned location name', 'Downtown Studio'),
  ('recipient_hire_date', 'Recipient', 'Date of hire', 'March 15, 2023'),
  ('recipient_tenure', 'Recipient', 'Length of employment', '2 years'),
  ('recipient_birthday', 'Recipient', 'Birthday date', 'July 4'),
  ('recipient_level', 'Recipient', 'Stylist level/tier', 'Senior Stylist'),
  ('recipient_bio', 'Recipient', 'Profile bio text', 'Specializing in balayage...'),
  ('recipient_instagram', 'Recipient', 'Instagram handle', '@sarahstyles'),
  ('recipient_tiktok', 'Recipient', 'TikTok handle', '@sarahstyles'),
  ('recipient_specialties', 'Recipient', 'List of specialties', 'Balayage, Color Correction'),
  ('recipient_photo_url', 'Recipient', 'Profile photo URL', 'https://...'),
  -- Dates category
  ('current_date', 'Dates', 'Today''s date formatted', 'January 20, 2026'),
  ('current_year', 'Dates', 'Current year', '2026'),
  ('current_month', 'Dates', 'Current month name', 'January'),
  ('current_day', 'Dates', 'Day of month', '20'),
  ('current_weekday', 'Dates', 'Day of week', 'Monday'),
  ('tomorrow_date', 'Dates', 'Tomorrow''s date', 'January 21, 2026'),
  ('next_week_date', 'Dates', 'Date one week from now', 'January 27, 2026'),
  ('next_month_date', 'Dates', 'Date one month from now', 'February 20, 2026'),
  ('deadline_date', 'Dates', 'Specific deadline date', 'January 31, 2026'),
  ('expiration_date', 'Dates', 'Expiration/end date', 'December 31, 2026'),
  -- Company category
  ('company_name', 'Company', 'Business name', 'Drop Dead Gorgeous'),
  ('company_phone', 'Company', 'Main phone number', '(555) 000-0000'),
  ('company_email', 'Company', 'Main email address', 'hello@dropdeadsalon.com'),
  ('company_website', 'Company', 'Website URL', 'https://dropdeadsalon.com'),
  ('company_address', 'Company', 'Full address', '123 Main St, City, ST 12345'),
  ('company_instagram', 'Company', 'Instagram handle', '@dropdeadsalon'),
  ('company_tiktok', 'Company', 'TikTok handle', '@dropdeadsalon'),
  ('company_facebook', 'Company', 'Facebook page URL', 'facebook.com/dropdeadsalon'),
  ('company_logo_url', 'Company', 'Logo image URL', 'https://...'),
  ('company_tagline', 'Company', 'Brand tagline', 'Where Style Meets Art'),
  -- Locations category
  ('location_name', 'Locations', 'Specific location name', 'Downtown Studio'),
  ('location_address', 'Locations', 'Location street address', '123 Main St'),
  ('location_city', 'Locations', 'Location city', 'Austin'),
  ('location_phone', 'Locations', 'Location phone number', '(555) 123-4567'),
  ('location_hours', 'Locations', 'Operating hours', 'Mon-Sat 9am-7pm'),
  ('location_booking_url', 'Locations', 'Booking link for location', 'https://book.dropdeadsalon.com/downtown'),
  ('location_maps_url', 'Locations', 'Google Maps link', 'https://maps.google.com/...'),
  ('location_manager', 'Locations', 'Location manager name', 'Ashley Smith'),
  -- Scheduling category
  ('appointment_date', 'Scheduling', 'Appointment date', 'January 25, 2026'),
  ('appointment_time', 'Scheduling', 'Appointment time', '2:00 PM'),
  ('appointment_duration', 'Scheduling', 'Service duration', '2 hours'),
  ('appointment_service', 'Scheduling', 'Service being performed', 'Full Balayage'),
  ('appointment_stylist', 'Scheduling', 'Assigned stylist name', 'Sarah Johnson'),
  ('appointment_price', 'Scheduling', 'Service price', '$250'),
  ('meeting_date', 'Scheduling', 'Meeting date', 'January 22, 2026'),
  ('meeting_time', 'Scheduling', 'Meeting time', '10:00 AM'),
  ('meeting_duration', 'Scheduling', 'Meeting length', '30 minutes'),
  ('meeting_type', 'Scheduling', 'Type of meeting', 'One-on-One'),
  ('meeting_location', 'Scheduling', 'Meeting location/room', 'Conference Room A'),
  ('meeting_link', 'Scheduling', 'Video call link', 'https://zoom.us/...'),
  ('shift_start', 'Scheduling', 'Shift start time', '9:00 AM'),
  ('shift_end', 'Scheduling', 'Shift end time', '5:00 PM'),
  ('schedule_week', 'Scheduling', 'Week schedule summary', 'Mon, Wed, Fri'),
  -- Program category
  ('program_name', 'Program', 'Program/challenge name', '75 Day Challenge'),
  ('program_day', 'Program', 'Current day number', 'Day 15'),
  ('program_progress', 'Program', 'Progress percentage', '20%'),
  ('program_streak', 'Program', 'Current streak count', '7 days'),
  ('program_start_date', 'Program', 'Program start date', 'January 1, 2026'),
  ('program_end_date', 'Program', 'Expected end date', 'March 16, 2026'),
  ('program_status', 'Program', 'Current status', 'Active'),
  ('program_coach', 'Program', 'Assigned coach name', 'Jessica Taylor'),
  ('program_tasks_today', 'Program', 'Today''s tasks list', 'Post 1 Reel, Log Metrics'),
  ('program_week_number', 'Program', 'Current week number', 'Week 3'),
  ('program_completion_rate', 'Program', 'Overall completion rate', '85%'),
  -- Metrics category
  ('metrics_reach', 'Metrics', 'Social media reach', '5,432'),
  ('metrics_engagement', 'Metrics', 'Engagement rate', '4.2%'),
  ('metrics_followers', 'Metrics', 'Follower count', '12,500'),
  ('metrics_leads', 'Metrics', 'Total leads generated', '23'),
  ('metrics_bookings', 'Metrics', 'Total bookings', '18'),
  ('metrics_revenue', 'Metrics', 'Revenue amount', '$4,250'),
  ('metrics_consults', 'Metrics', 'Consultations completed', '8'),
  ('metrics_posts', 'Metrics', 'Posts published', '12'),
  ('metrics_reels', 'Metrics', 'Reels published', '4'),
  ('metrics_stories', 'Metrics', 'Stories published', '28'),
  ('metrics_dms', 'Metrics', 'DMs received', '45'),
  ('metrics_profile_visits', 'Metrics', 'Profile visits', '892'),
  -- Training category
  ('training_title', 'Training', 'Training/video title', 'Color Correction Basics'),
  ('training_category', 'Training', 'Training category', 'Technical Skills'),
  ('training_duration', 'Training', 'Video duration', '15 minutes'),
  ('training_progress', 'Training', 'Watch progress', '75%'),
  ('training_due_date', 'Training', 'Completion due date', 'January 31, 2026'),
  ('training_instructor', 'Training', 'Instructor name', 'Master Colorist Amy'),
  ('training_link', 'Training', 'Direct link to training', 'https://...'),
  ('handbook_title', 'Training', 'Handbook title', 'Employee Handbook 2026'),
  ('handbook_version', 'Training', 'Handbook version', 'v2.1'),
  ('handbook_link', 'Training', 'Link to handbook', 'https://...'),
  ('handbook_deadline', 'Training', 'Acknowledgment deadline', 'February 1, 2026'),
  -- Notifications category
  ('notification_type', 'Notifications', 'Type of notification', 'Reminder'),
  ('notification_title', 'Notifications', 'Notification headline', 'Task Due Soon'),
  ('notification_message', 'Notifications', 'Notification body', 'Your daily check-in is due...'),
  ('notification_action_url', 'Notifications', 'Action button URL', 'https://...'),
  ('notification_action_text', 'Notifications', 'Action button text', 'Complete Now'),
  ('announcement_title', 'Notifications', 'Announcement headline', 'Team Meeting Friday'),
  ('announcement_content', 'Notifications', 'Announcement body', 'Join us for...'),
  ('announcement_author', 'Notifications', 'Announcement author', 'Management Team'),
  ('announcement_date', 'Notifications', 'Announcement date', 'January 18, 2026'),
  -- Birthdays category
  ('birthday_name', 'Birthdays', 'Person''s name', 'Sarah Johnson'),
  ('birthday_date', 'Birthdays', 'Birthday date', 'January 25'),
  ('birthday_age', 'Birthdays', 'Age (if known)', '28'),
  ('birthday_message', 'Birthdays', 'Custom birthday message', 'Wishing you an amazing day!'),
  ('birthday_countdown', 'Birthdays', 'Days until birthday', '5 days'),
  ('birthday_team_list', 'Birthdays', 'List of upcoming birthdays', 'Sarah (Jan 25), Mike (Jan 28)'),
  -- Anniversaries category
  ('anniversary_name', 'Anniversaries', 'Person''s name', 'Sarah Johnson'),
  ('anniversary_date', 'Anniversaries', 'Work anniversary date', 'January 20'),
  ('anniversary_years', 'Anniversaries', 'Years with company', '3'),
  ('anniversary_message', 'Anniversaries', 'Custom message', 'Thank you for 3 amazing years!'),
  ('anniversary_team_list', 'Anniversaries', 'Upcoming anniversaries', 'Sarah (3 yrs), Mike (1 yr)'),
  -- Strikes category
  ('strike_title', 'Strikes', 'Strike/incident title', 'Late Arrival'),
  ('strike_type', 'Strikes', 'Type of strike', 'Attendance'),
  ('strike_date', 'Strikes', 'Incident date', 'January 15, 2026'),
  ('strike_description', 'Strikes', 'Strike description', 'Arrived 30 minutes late...'),
  ('strike_severity', 'Strikes', 'Severity level', 'Warning'),
  ('strike_count', 'Strikes', 'Total strike count', '2'),
  ('strike_resolution', 'Strikes', 'Resolution notes', 'Discussed and resolved...'),
  -- Wins category
  ('win_service', 'Wins', 'Service that was booked', 'Full Balayage + Extensions'),
  ('win_amount', 'Wins', 'Revenue from the win', '$850'),
  ('win_lead_source', 'Wins', 'How lead was acquired', 'Instagram'),
  ('win_client_name', 'Wins', 'New client name', 'Jennifer'),
  ('win_date', 'Wins', 'Date of the win', 'January 20, 2026'),
  ('win_notes', 'Wins', 'Additional notes', 'Referred by existing client'),
  -- Links category
  ('dashboard_link', 'Links', 'Link to dashboard', 'https://...'),
  ('profile_link', 'Links', 'Link to user profile', 'https://...'),
  ('booking_link', 'Links', 'Booking system link', 'https://...'),
  ('training_portal_link', 'Links', 'Training portal link', 'https://...'),
  ('handbook_portal_link', 'Links', 'Handbook portal link', 'https://...'),
  ('schedule_link', 'Links', 'Schedule view link', 'https://...'),
  ('leaderboard_link', 'Links', 'Leaderboard link', 'https://...'),
  ('support_link', 'Links', 'Support/help link', 'https://...'),
  ('unsubscribe_link', 'Links', 'Unsubscribe link', 'https://...');
