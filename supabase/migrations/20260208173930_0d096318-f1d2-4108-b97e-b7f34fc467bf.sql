-- Add foreign key from chat_messages.sender_id to employee_profiles.user_id
-- This enables PostgREST joins for fetching sender information
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_sender_employee_fkey
FOREIGN KEY (sender_id) REFERENCES public.employee_profiles(user_id)
ON DELETE SET NULL;