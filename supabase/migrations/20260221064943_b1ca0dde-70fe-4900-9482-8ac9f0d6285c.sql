
CREATE OR REPLACE FUNCTION public.create_break_request(
  p_user_id uuid,
  p_organization_id uuid,
  p_start_date date,
  p_end_date date,
  p_start_time time without time zone DEFAULT NULL::time without time zone,
  p_end_time time without time zone DEFAULT NULL::time without time zone,
  p_is_full_day boolean DEFAULT true,
  p_reason text DEFAULT 'break'::text,
  p_notes text DEFAULT NULL::text,
  p_blocks_online_booking boolean DEFAULT true,
  p_block_mode text DEFAULT 'Block'::text
)
 RETURNS TABLE(request_id uuid, status text, appointment_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_requires_approval BOOLEAN;
  v_status TEXT;
  v_request_id UUID;
  v_appointment_id UUID;
  v_caller_id UUID;
  v_staff_name TEXT;
  v_location_id TEXT;
  v_effective_block_mode TEXT;
BEGIN
  v_caller_id := auth.uid();
  
  -- Validate block_mode
  v_effective_block_mode := CASE 
    WHEN p_block_mode IN ('Break', 'Block') THEN p_block_mode
    ELSE 'Block'
  END;
  
  -- Verify caller is either the target user or an admin/manager
  IF v_caller_id != p_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = v_caller_id
      AND role IN ('admin', 'manager', 'super_admin')
    ) AND NOT EXISTS (
      SELECT 1 FROM public.employee_profiles
      WHERE user_id = v_caller_id
      AND is_super_admin = true
    ) THEN
      RAISE EXCEPTION 'Only admins/managers can create breaks for other users';
    END IF;
  END IF;

  -- Check org approval setting
  SELECT time_off_requires_approval INTO v_requires_approval
  FROM public.organizations WHERE id = p_organization_id;

  v_status := CASE WHEN v_requires_approval THEN 'pending' ELSE 'approved' END;

  -- Insert time off request
  INSERT INTO public.time_off_requests (
    user_id, organization_id, start_date, end_date, start_time, end_time,
    is_full_day, reason, notes, status, blocks_online_booking
  ) VALUES (
    p_user_id, p_organization_id, p_start_date, p_end_date, p_start_time, p_end_time,
    p_is_full_day, p_reason, p_notes, v_status, p_blocks_online_booking
  )
  RETURNING id INTO v_request_id;

  -- If auto-approved, create blocking appointment
  IF v_status = 'approved' AND NOT p_is_full_day AND p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
    SELECT display_name INTO v_staff_name FROM public.employee_profiles WHERE user_id = p_user_id;
    SELECT location_id INTO v_location_id FROM public.employee_profiles WHERE user_id = p_user_id;

    INSERT INTO public.appointments (
      organization_id, location_id, staff_user_id, staff_name,
      appointment_date, start_time, end_time,
      duration_minutes, service_category, service_name,
      status, import_source, notes
    ) VALUES (
      p_organization_id, v_location_id, p_user_id, v_staff_name,
      p_start_date, p_start_time, p_end_time,
      EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60,
      v_effective_block_mode, INITCAP(p_reason),
      'confirmed', 'time_off', p_notes
    )
    RETURNING id INTO v_appointment_id;
  END IF;

  request_id := v_request_id;
  status := v_status;
  appointment_id := v_appointment_id;
  RETURN NEXT;
END;
$function$;
