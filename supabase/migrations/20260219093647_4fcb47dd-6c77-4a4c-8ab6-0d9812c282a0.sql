
-- Create calendar feed tokens table
CREATE TABLE IF NOT EXISTS public.calendar_feed_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT public.generate_secure_token(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_feed_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view own feed tokens"
  ON public.calendar_feed_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tokens
CREATE POLICY "Users can create own feed tokens"
  ON public.calendar_feed_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own feed tokens"
  ON public.calendar_feed_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own feed tokens"
  ON public.calendar_feed_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_calendar_feed_tokens_updated_at
  BEFORE UPDATE ON public.calendar_feed_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index on token for fast lookups from edge function
CREATE INDEX IF NOT EXISTS idx_calendar_feed_tokens_token
  ON public.calendar_feed_tokens(token);

-- Index on user_id
CREATE INDEX IF NOT EXISTS idx_calendar_feed_tokens_user_id
  ON public.calendar_feed_tokens(user_id);
