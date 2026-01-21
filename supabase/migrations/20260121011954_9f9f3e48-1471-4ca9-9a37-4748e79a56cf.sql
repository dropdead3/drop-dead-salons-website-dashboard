-- Drop the existing update policy
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Admins can update announcements" 
ON public.announcements 
FOR UPDATE 
USING (is_coach_or_admin(auth.uid()))
WITH CHECK (is_coach_or_admin(auth.uid()));