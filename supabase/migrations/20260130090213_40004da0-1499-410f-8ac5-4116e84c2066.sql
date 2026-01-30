-- Create account_notes table for organization-level notes
CREATE TABLE public.account_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '{"users": [], "roles": []}',
  is_internal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create account_note_mentions junction table
CREATE TABLE public.account_note_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.account_notes(id) ON DELETE CASCADE,
  mentioned_user_id UUID,
  mentioned_role TEXT,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_mention CHECK (
    (mentioned_user_id IS NOT NULL AND mentioned_role IS NULL) OR
    (mentioned_user_id IS NULL AND mentioned_role IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_account_notes_organization ON public.account_notes(organization_id);
CREATE INDEX idx_account_notes_author ON public.account_notes(author_id);
CREATE INDEX idx_account_note_mentions_note ON public.account_note_mentions(note_id);
CREATE INDEX idx_account_note_mentions_user ON public.account_note_mentions(mentioned_user_id);

-- Enable RLS
ALTER TABLE public.account_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_note_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_notes
CREATE POLICY "Platform users can view account notes"
ON public.account_notes FOR SELECT
TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can create account notes"
ON public.account_notes FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_user(auth.uid()) AND auth.uid() = author_id);

CREATE POLICY "Authors can delete own notes"
ON public.account_notes FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

CREATE POLICY "Authors can update own notes"
ON public.account_notes FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);

-- RLS Policies for account_note_mentions
CREATE POLICY "Platform users can view mentions"
ON public.account_note_mentions FOR SELECT
TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can create mentions"
ON public.account_note_mentions FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_user(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_account_notes_updated_at
BEFORE UPDATE ON public.account_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();