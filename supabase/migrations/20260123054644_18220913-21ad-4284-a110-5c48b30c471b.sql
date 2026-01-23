-- Create calendar_theme_settings table
CREATE TABLE public.calendar_theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Header/Banner colors
  header_bg_color TEXT NOT NULL DEFAULT '#1f2937',
  header_text_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- Days row (weekday labels)
  days_row_bg_color TEXT NOT NULL DEFAULT '#f3f4f6',
  days_row_text_color TEXT NOT NULL DEFAULT '#6b7280',
  
  -- Today highlight
  today_highlight_color TEXT NOT NULL DEFAULT '#8b5cf6',
  today_badge_bg_color TEXT NOT NULL DEFAULT '#1f2937',
  today_badge_text_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- Cell styling
  cell_border_color TEXT NOT NULL DEFAULT '#e5e7eb',
  cell_border_style TEXT NOT NULL DEFAULT 'solid',
  cell_border_width INTEGER NOT NULL DEFAULT 1,
  
  -- Grid lines
  hour_line_color TEXT NOT NULL DEFAULT '#d1d5db',
  half_hour_line_color TEXT NOT NULL DEFAULT '#e5e7eb',
  quarter_hour_line_color TEXT NOT NULL DEFAULT '#f3f4f6',
  
  -- Current time indicator
  current_time_color TEXT NOT NULL DEFAULT '#ef4444',
  
  -- General background
  calendar_bg_color TEXT NOT NULL DEFAULT '#ffffff',
  outside_month_bg_color TEXT NOT NULL DEFAULT '#f9fafb',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_theme_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own theme settings"
  ON public.calendar_theme_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own theme settings"
  ON public.calendar_theme_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own theme settings"
  ON public.calendar_theme_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_calendar_theme_settings_updated_at
  BEFORE UPDATE ON public.calendar_theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();