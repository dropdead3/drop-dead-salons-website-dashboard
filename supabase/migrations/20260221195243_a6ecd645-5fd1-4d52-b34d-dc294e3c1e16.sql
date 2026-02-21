
-- ============================================================
-- RLS HARDENING: Fix overly permissive policies
-- ============================================================

-- 1. growth_forecasts: SELECT should be authenticated, not public
DROP POLICY IF EXISTS "Org members can view growth forecasts" ON public.growth_forecasts;
CREATE POLICY "Org members can view growth forecasts"
  ON public.growth_forecasts FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

-- 2. platform_notifications: INSERT should be restricted to admins/platform users
DROP POLICY IF EXISTS "System can insert notifications" ON public.platform_notifications;
CREATE POLICY "Admins and platform can insert notifications"
  ON public.platform_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    is_platform_user(auth.uid())
    OR is_coach_or_admin(auth.uid())
  );

-- 3. points_ledger: INSERT should NOT be open to all authenticated users
-- Points are awarded via the award_points() SECURITY DEFINER function
DROP POLICY IF EXISTS "System can insert points" ON public.points_ledger;
CREATE POLICY "Platform or admin can insert points"
  ON public.points_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    is_platform_user(auth.uid())
    OR is_coach_or_admin(auth.uid())
  );

-- 4. system_health_status: ALL should be restricted to platform users
DROP POLICY IF EXISTS "System can update health status" ON public.system_health_status;
CREATE POLICY "Platform users can manage health status"
  ON public.system_health_status FOR ALL
  TO authenticated
  USING (is_platform_user(auth.uid()))
  WITH CHECK (is_platform_user(auth.uid()));

-- 5. edge_function_logs: INSERT should be scoped
DROP POLICY IF EXISTS "System can insert function logs" ON public.edge_function_logs;
CREATE POLICY "Authenticated can insert scoped function logs"
  ON public.edge_function_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    is_platform_user(auth.uid())
    OR (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  );

-- 6. inquiry_activity_log: INSERT should be scoped to authenticated with user check
DROP POLICY IF EXISTS "Authenticated can insert activity" ON public.inquiry_activity_log;
CREATE POLICY "Authenticated users can insert own activity"
  ON public.inquiry_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = performed_by);

-- 7. kiosk_analytics: public INSERT - scope to require organization_id
DROP POLICY IF EXISTS "Kiosk can insert analytics" ON public.kiosk_analytics;
CREATE POLICY "Kiosk can insert analytics with org scope"
  ON public.kiosk_analytics FOR INSERT
  TO public
  WITH CHECK (organization_id IS NOT NULL);

-- 8. kiosk_devices: anon INSERT - scope to require organization_id
DROP POLICY IF EXISTS "Kiosk can self-register device" ON public.kiosk_devices;
CREATE POLICY "Kiosk can self-register with org scope"
  ON public.kiosk_devices FOR INSERT
  TO anon
  WITH CHECK (organization_id IS NOT NULL);

-- 9. kiosk_devices: anon UPDATE - scope to device_token match
DROP POLICY IF EXISTS "Kiosk can update own heartbeat" ON public.kiosk_devices;
CREATE POLICY "Kiosk can update own device by token"
  ON public.kiosk_devices FOR UPDATE
  TO anon
  USING (device_token IS NOT NULL)
  WITH CHECK (device_token IS NOT NULL);
