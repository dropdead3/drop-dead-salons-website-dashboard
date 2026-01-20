-- Drop and recreate UPDATE policy to allow users to update their own entries
DROP POLICY IF EXISTS "Coaches can update entries" ON public.ring_the_bell_entries;

CREATE POLICY "Users can update own entries or coaches can update any"
ON public.ring_the_bell_entries
FOR UPDATE
USING (auth.uid() = user_id OR current_user_is_coach())
WITH CHECK (auth.uid() = user_id OR current_user_is_coach());