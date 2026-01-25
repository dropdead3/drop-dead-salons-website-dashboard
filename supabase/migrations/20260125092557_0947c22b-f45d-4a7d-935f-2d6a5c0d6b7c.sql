-- Drop the overly permissive INSERT policies
DROP POLICY IF EXISTS "Authenticated can submit inquiries" ON public.salon_inquiries;

-- Create more restrictive INSERT policy for authenticated users
-- Only allow inserts where the user is either:
-- 1. Management (can insert any lead)
-- 2. A stylist/assistant (can submit leads they encounter)
CREATE POLICY "Authenticated can submit inquiries"
ON public.salon_inquiries FOR INSERT
TO authenticated
WITH CHECK (
  public.is_coach_or_admin(auth.uid()) 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('stylist', 'stylist_assistant')
  )
  OR source = 'website_form'
);