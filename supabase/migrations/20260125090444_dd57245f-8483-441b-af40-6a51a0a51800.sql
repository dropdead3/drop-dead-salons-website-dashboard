-- Drop the overly permissive policy and create a proper one
DROP POLICY IF EXISTS "Service role can manage staffing history" ON staffing_history;

-- Only admins/managers can insert/update staffing history
CREATE POLICY "Admins can manage staffing history"
ON staffing_history FOR ALL TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));