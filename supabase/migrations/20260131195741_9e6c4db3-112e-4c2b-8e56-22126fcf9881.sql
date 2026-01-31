-- =============================================
-- PHASE 1: Schema Extensions (Fixed)
-- =============================================

-- ===================
-- 1.9 RENTER ONBOARDING (create if not exists)
-- ===================

-- Create onboarding progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.renter_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES renter_onboarding_tasks(id) ON DELETE CASCADE,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  document_url TEXT,
  notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booth_renter_id, task_id)
);

ALTER TABLE public.renter_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Add columns to existing onboarding tasks table
ALTER TABLE public.renter_onboarding_tasks
ADD COLUMN IF NOT EXISTS task_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS document_required BOOLEAN DEFAULT false;

-- RLS for onboarding progress
DROP POLICY IF EXISTS "Renters can manage their onboarding" ON public.renter_onboarding_progress;
CREATE POLICY "Renters can manage their onboarding"
ON public.renter_onboarding_progress FOR ALL TO authenticated
USING (
  booth_renter_id IN (SELECT id FROM booth_renter_profiles WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
  OR public.is_platform_user(auth.uid())
);