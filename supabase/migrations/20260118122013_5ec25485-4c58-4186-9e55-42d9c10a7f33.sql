-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  author_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active announcements
CREATE POLICY "All staff can view active announcements"
ON public.announcements
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Only admins/managers can create announcements
CREATE POLICY "Admins can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (public.is_coach_or_admin(auth.uid()));

-- Only admins/managers can update announcements
CREATE POLICY "Admins can update announcements"
ON public.announcements
FOR UPDATE
USING (public.is_coach_or_admin(auth.uid()));

-- Only admins/managers can delete announcements
CREATE POLICY "Admins can delete announcements"
ON public.announcements
FOR DELETE
USING (public.is_coach_or_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create announcement reads table to track who has seen what
CREATE TABLE public.announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own reads
CREATE POLICY "Users can view own reads"
ON public.announcement_reads
FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark announcements as read
CREATE POLICY "Users can mark as read"
ON public.announcement_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;