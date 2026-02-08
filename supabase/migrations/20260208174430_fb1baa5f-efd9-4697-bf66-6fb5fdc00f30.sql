-- Add foreign key to enable PostgREST joins from chat_channel_members to employee_profiles
ALTER TABLE public.chat_channel_members
ADD CONSTRAINT chat_channel_members_employee_fkey
FOREIGN KEY (user_id) REFERENCES public.employee_profiles(user_id)
ON DELETE CASCADE;