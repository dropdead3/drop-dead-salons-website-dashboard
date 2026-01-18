-- Create function to ensure super admins have admin role
CREATE OR REPLACE FUNCTION public.ensure_super_admin_has_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- When is_super_admin is set to true, ensure admin role exists
    IF NEW.is_super_admin = true AND (OLD.is_super_admin IS NULL OR OLD.is_super_admin = false) THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on employee_profiles
CREATE TRIGGER ensure_super_admin_role_trigger
    AFTER INSERT OR UPDATE OF is_super_admin ON public.employee_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_super_admin_has_role();