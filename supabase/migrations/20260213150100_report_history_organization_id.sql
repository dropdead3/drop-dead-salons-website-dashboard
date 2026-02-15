-- Add organization_id to report_history for multi-tenant report history
-- RLS will scope visibility by organization

ALTER TABLE public.report_history
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Backfill from employee_profiles for existing rows
UPDATE public.report_history rh
SET organization_id = ep.organization_id
FROM public.employee_profiles ep
WHERE rh.generated_by = ep.user_id
  AND rh.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_report_history_organization_id
ON public.report_history(organization_id);

-- Drop existing RLS policies so we can replace with org-scoped ones
DROP POLICY IF EXISTS "Users can view own reports" ON public.report_history;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.report_history;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.report_history;

-- SELECT: users see reports for their org, or legacy rows (no org) if they generated or are admin/manager
CREATE POLICY "Users can view org reports or own"
  ON public.report_history FOR SELECT
  TO authenticated
  USING (
    (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
    OR (organization_id IS NULL AND (
      generated_by = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'manager')
    ))
  );

-- INSERT: user can only insert with their own generated_by and org they belong to
CREATE POLICY "Users can create reports for their org"
  ON public.report_history FOR INSERT
  TO authenticated
  WITH CHECK (
    generated_by = auth.uid()
    AND (organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id))
  );

-- DELETE: org admins/managers can delete reports for their org; legacy rows by admin/manager
CREATE POLICY "Admins can delete org reports"
  ON public.report_history FOR DELETE
  TO authenticated
  USING (
    (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
    OR (organization_id IS NULL AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'manager')
    ))
  );
