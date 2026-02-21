
-- ============================================================
-- SECURITY REMEDIATION: Fix Critical & High RLS Vulnerabilities
-- ============================================================

-- 1. CRITICAL: growth_forecasts — Drop permissive ALL policy, keep org-scoped SELECT
DROP POLICY IF EXISTS "Service role can manage growth forecasts" ON public.growth_forecasts;

-- Add proper org-scoped write policies for authenticated users
CREATE POLICY "Org admins can insert growth forecasts"
  ON public.growth_forecasts FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update growth forecasts"
  ON public.growth_forecasts FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete growth forecasts"
  ON public.growth_forecasts FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- 2. HIGH: chat_smart_actions — restrict INSERT from public to authenticated org members
DROP POLICY IF EXISTS "System can insert smart actions" ON public.chat_smart_actions;

CREATE POLICY "Authenticated can insert smart actions"
  ON public.chat_smart_actions FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- 3. HIGH: organization_benchmarks — system tables written by edge functions (service_role bypasses RLS)
-- Remove dangerous public-role policies; service_role doesn't need them
DROP POLICY IF EXISTS "System can insert benchmarks" ON public.organization_benchmarks;
DROP POLICY IF EXISTS "System can update benchmarks" ON public.organization_benchmarks;

-- 4. HIGH: organization_health_scores — same pattern
DROP POLICY IF EXISTS "System can insert health scores" ON public.organization_health_scores;
DROP POLICY IF EXISTS "System can update health scores" ON public.organization_health_scores;

-- 5. HIGH: client_email_preferences — RLS enabled but NO policies
CREATE POLICY "Org members can view email preferences"
  ON public.client_email_preferences FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage email preferences"
  ON public.client_email_preferences FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can update email preferences"
  ON public.client_email_preferences FOR UPDATE TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- 6. HIGH: email_send_log — RLS enabled but NO policies
CREATE POLICY "Org members can view email send log"
  ON public.email_send_log FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can insert email send log"
  ON public.email_send_log FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- 7. LOW: Fix update_updated_at_column missing search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
