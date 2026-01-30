-- Assign platform_owner role to the primary account
INSERT INTO public.platform_roles (user_id, role, granted_by)
SELECT 
  id as user_id,
  'platform_owner' as role,
  id as granted_by
FROM auth.users
WHERE email = 'eric@dropdeadhair.com';