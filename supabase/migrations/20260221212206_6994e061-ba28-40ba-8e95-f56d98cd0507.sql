
-- ============================================================
-- Phase 1A: Enhance clients table with merge + placeholder fields
-- ============================================================

-- Add merge-related columns
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS merged_into_client_id UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS merged_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_normalized TEXT,
  ADD COLUMN IF NOT EXISTS phone_normalized TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS client_since DATE,
  ADD COLUMN IF NOT EXISTS reminder_email_opt_in BOOLEAN,
  ADD COLUMN IF NOT EXISTS reminder_sms_opt_in BOOLEAN,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS phorest_client_id TEXT;

-- Indexes for duplicate detection
CREATE INDEX IF NOT EXISTS idx_clients_email_normalized ON public.clients(email_normalized) WHERE email_normalized IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_clients_phone_normalized ON public.clients(phone_normalized) WHERE phone_normalized IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_merged_into ON public.clients(merged_into_client_id) WHERE merged_into_client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON public.clients(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_phorest_id ON public.clients(phorest_client_id) WHERE phorest_client_id IS NOT NULL;

-- ============================================================
-- Phase 1B: Create client_merge_log table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.client_merge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  primary_client_id UUID NOT NULL REFERENCES public.clients(id),
  secondary_client_ids UUID[] NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  field_resolutions JSONB NOT NULL DEFAULT '{}',
  before_snapshots JSONB NOT NULL DEFAULT '{}',
  reparenting_counts JSONB NOT NULL DEFAULT '{}',
  is_undone BOOLEAN NOT NULL DEFAULT false,
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES auth.users(id),
  undo_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_merge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view merge logs"
  ON public.client_merge_log FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert merge logs"
  ON public.client_merge_log FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update merge logs"
  ON public.client_merge_log FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX IF NOT EXISTS idx_merge_log_org ON public.client_merge_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_merge_log_primary ON public.client_merge_log(primary_client_id);

-- ============================================================
-- Phase 1C: Add client_merge permission
-- ============================================================

INSERT INTO public.permissions (name, display_name, category, description)
VALUES ('client_merge', 'Merge Clients', 'clients', 'Allows merging duplicate client profiles')
ON CONFLICT (name) DO NOTHING;

-- Grant to admin/super_admin/manager by default
INSERT INTO public.role_permissions (role, permission_id)
SELECT r.role, p.id
FROM (VALUES ('admin'::app_role), ('super_admin'::app_role), ('manager'::app_role)) AS r(role)
CROSS JOIN public.permissions p
WHERE p.name = 'client_merge'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Phase 1D: Normalization trigger on clients
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_client_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalize email: lowercase + trim
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    NEW.email_normalized := lower(trim(NEW.email));
  ELSE
    NEW.email_normalized := NULL;
  END IF;

  -- Normalize phone: strip non-digits, ensure +1 prefix for US
  IF NEW.mobile IS NOT NULL AND NEW.mobile != '' THEN
    NEW.phone_normalized := regexp_replace(NEW.mobile, '[^0-9+]', '', 'g');
    -- If 10 digits, prepend +1
    IF length(NEW.phone_normalized) = 10 AND left(NEW.phone_normalized, 1) != '+' THEN
      NEW.phone_normalized := '+1' || NEW.phone_normalized;
    ELSIF length(NEW.phone_normalized) = 11 AND left(NEW.phone_normalized, 1) = '1' THEN
      NEW.phone_normalized := '+' || NEW.phone_normalized;
    END IF;
  ELSIF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone_normalized := regexp_replace(NEW.phone, '[^0-9+]', '', 'g');
    IF length(NEW.phone_normalized) = 10 AND left(NEW.phone_normalized, 1) != '+' THEN
      NEW.phone_normalized := '+1' || NEW.phone_normalized;
    ELSIF length(NEW.phone_normalized) = 11 AND left(NEW.phone_normalized, 1) = '1' THEN
      NEW.phone_normalized := '+' || NEW.phone_normalized;
    END IF;
  ELSE
    NEW.phone_normalized := NULL;
  END IF;

  -- Set placeholder flag: no email AND no phone
  NEW.is_placeholder := (NEW.email_normalized IS NULL AND NEW.phone_normalized IS NULL);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_client_identity
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_client_identity();

-- ============================================================
-- Phase 1E: Duplicate check function
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_duplicate_clients(
  p_organization_id UUID,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_exclude_client_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  mobile TEXT,
  last_visit_date DATE,
  total_spend NUMERIC,
  match_type TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_norm TEXT;
  v_phone_norm TEXT;
BEGIN
  -- Normalize inputs
  IF p_email IS NOT NULL AND p_email != '' THEN
    v_email_norm := lower(trim(p_email));
  END IF;

  IF p_phone IS NOT NULL AND p_phone != '' THEN
    v_phone_norm := regexp_replace(p_phone, '[^0-9+]', '', 'g');
    IF length(v_phone_norm) = 10 AND left(v_phone_norm, 1) != '+' THEN
      v_phone_norm := '+1' || v_phone_norm;
    ELSIF length(v_phone_norm) = 11 AND left(v_phone_norm, 1) = '1' THEN
      v_phone_norm := '+' || v_phone_norm;
    END IF;
  END IF;

  RETURN QUERY
  SELECT DISTINCT c.id, c.first_name, c.last_name, c.email, c.mobile,
         c.last_visit_date, c.total_spend,
         CASE
           WHEN v_email_norm IS NOT NULL AND c.email_normalized = v_email_norm THEN 'email'
           WHEN v_phone_norm IS NOT NULL AND c.phone_normalized = v_phone_norm THEN 'phone'
           ELSE 'unknown'
         END AS match_type
  FROM public.clients c
  WHERE c.organization_id = p_organization_id
    AND c.status = 'active'
    AND (p_exclude_client_id IS NULL OR c.id != p_exclude_client_id)
    AND (
      (v_email_norm IS NOT NULL AND c.email_normalized = v_email_norm)
      OR
      (v_phone_norm IS NOT NULL AND c.phone_normalized = v_phone_norm)
    );
END;
$$;
