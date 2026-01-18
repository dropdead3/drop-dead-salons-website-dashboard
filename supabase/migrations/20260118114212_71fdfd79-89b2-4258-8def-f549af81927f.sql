-- Drop and recreate the handle_new_user function to NOT auto-assign roles
-- Roles will now be assigned from the sign-up form instead

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create employee profile
    INSERT INTO public.employee_profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    
    -- If a role was provided in metadata, assign it; otherwise do NOT auto-assign
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
    END IF;
    
    RETURN NEW;
END;
$$;