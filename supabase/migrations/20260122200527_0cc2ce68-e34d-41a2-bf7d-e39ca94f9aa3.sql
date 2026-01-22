-- Fix overly permissive RLS policies on Phorest tables
-- These were allowing any authenticated user to see all data

-- 1. Drop the overly permissive policies on phorest_clients
DROP POLICY IF EXISTS "Stylists can view clients they serve" ON public.phorest_clients;

-- Create proper restrictive policy: stylists only see clients where they are the preferred stylist
CREATE POLICY "Stylists can view their own clients"
ON public.phorest_clients
FOR SELECT
USING (auth.uid() = preferred_stylist_id);

-- 2. Drop the overly permissive policy on phorest_appointments
DROP POLICY IF EXISTS "Authenticated users can view appointments for scheduling" ON public.phorest_appointments;

-- Appointments should only be visible to the assigned stylist (admins already have their policy)
-- Note: "Users can view their own appointments" policy already exists and is correct

-- 3. Drop the overly permissive policy on phorest_performance_metrics
DROP POLICY IF EXISTS "All authenticated users can view metrics for leaderboard" ON public.phorest_performance_metrics;

-- For leaderboard, we need a different approach - create a view or use a secure function
-- For now, let's create a policy that allows viewing metrics but only aggregated/limited fields
-- Actually, leaderboards need to show rankings, so we'll allow SELECT but the app will control what's displayed
-- Let's create a more specific policy that still allows leaderboard but through proper channels

-- Create a function to check if user has permission to view leaderboard
CREATE OR REPLACE FUNCTION public.can_view_leaderboard(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_profiles
    WHERE user_id = _user_id
      AND is_approved = true
  )
$$;

-- Leaderboard policy - only approved employees can see performance metrics for ranking purposes
CREATE POLICY "Approved employees can view metrics for leaderboard"
ON public.phorest_performance_metrics
FOR SELECT
USING (public.can_view_leaderboard(auth.uid()));