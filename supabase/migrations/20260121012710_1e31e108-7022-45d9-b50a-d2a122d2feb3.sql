-- Add policy for admins to view ALL announcements (including inactive)
CREATE POLICY "Admins can view all announcements" 
ON public.announcements 
FOR SELECT 
TO authenticated
USING (is_coach_or_admin(auth.uid()));