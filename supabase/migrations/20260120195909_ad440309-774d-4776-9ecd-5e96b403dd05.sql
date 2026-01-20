-- Add DELETE policy for ring_the_bell_entries
-- Users can delete their own entries, coaches can delete any
CREATE POLICY "Users can delete own entries or coaches can delete any"
ON public.ring_the_bell_entries
FOR DELETE
USING (auth.uid() = user_id OR current_user_is_coach());