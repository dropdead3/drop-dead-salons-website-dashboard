-- Safe follow-up migration for prior data assumptions.
-- Never modify already-shipped migration files; apply fixes in a new migration instead.

-- Ensure ring_the_bell permission is granted to remaining staff roles (lookup by name; id varies per database)
DO $$
DECLARE perm_id uuid;
BEGIN
  SELECT id INTO perm_id
  FROM public.permissions
  WHERE name = 'ring_the_bell'
  LIMIT 1;

  IF perm_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role, permission_id)
    SELECT role, perm_id
    FROM unnest(ARRAY[
      'receptionist',
      'assistant',
      'stylist_assistant',
      'admin_assistant',
      'operations_assistant'
    ]::app_role[]) AS role
    ON CONFLICT (role, permission_id) DO NOTHING;
  END IF;
END $$;

-- Delete the orphan "Haircuts" entry that doesn't match any synced service (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'service_category_colors'
  ) THEN
    DELETE FROM public.service_category_colors
    WHERE category_name = 'Haircuts';
  END IF;
END $$;

