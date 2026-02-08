-- Add is_hidden column for per-user DM archiving
ALTER TABLE public.chat_channel_members
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Create function to auto-unarchive DM when new message is sent
CREATE OR REPLACE FUNCTION public.auto_unhide_dm_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  channel_type TEXT;
BEGIN
  -- Check if this is a DM channel
  SELECT type INTO channel_type
  FROM public.chat_channels
  WHERE id = NEW.channel_id;
  
  -- If it's a DM, unhide for all members
  IF channel_type = 'dm' OR channel_type = 'group_dm' THEN
    UPDATE public.chat_channel_members
    SET is_hidden = false
    WHERE channel_id = NEW.channel_id
      AND is_hidden = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-unhide on new message
DROP TRIGGER IF EXISTS unhide_dm_on_new_message ON public.chat_messages;
CREATE TRIGGER unhide_dm_on_new_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_unhide_dm_on_message();