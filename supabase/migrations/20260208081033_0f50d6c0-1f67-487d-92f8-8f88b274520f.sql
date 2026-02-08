-- Add new columns to rewards_catalog for enhanced functionality
ALTER TABLE public.rewards_catalog 
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'gift',
ADD COLUMN IF NOT EXISTS start_date timestamptz,
ADD COLUMN IF NOT EXISTS end_date timestamptz,
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create index for organization-based queries
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_org 
ON public.rewards_catalog(organization_id);

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view rewards for their organization" ON public.rewards_catalog;
DROP POLICY IF EXISTS "Admins can manage rewards for their organization" ON public.rewards_catalog;

-- Add RLS policy for organization isolation (SELECT)
CREATE POLICY "Users can view rewards for their organization"
ON public.rewards_catalog FOR SELECT
USING (
  organization_id IS NULL 
  OR organization_id = (SELECT public.get_user_organization(auth.uid()))
);

-- Add RLS policy for admin management (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage rewards for their organization"
ON public.rewards_catalog FOR ALL
USING (
  public.is_coach_or_admin(auth.uid())
)
WITH CHECK (
  public.is_coach_or_admin(auth.uid())
);