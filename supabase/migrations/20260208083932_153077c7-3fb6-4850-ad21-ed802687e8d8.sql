-- Add unique constraint for upsert support on chat_channel_members
ALTER TABLE public.chat_channel_members
ADD CONSTRAINT chat_channel_members_channel_user_unique 
UNIQUE (channel_id, user_id);