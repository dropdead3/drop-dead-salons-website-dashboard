-- =============================================
-- INTERNAL BOOKING ENGINE: Database Functions
-- =============================================

-- 1. GET STAFF AVAILABILITY for a specific date
CREATE OR REPLACE FUNCTION public.get_staff_availability(
  p_staff_user_id UUID,
  p_date DATE,
  p_location_id TEXT DEFAULT NULL,
  p_slot_duration_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(
  slot_start TIME,
  slot_end TIME,
  is_available BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_start TIME := '09:00:00'::TIME;
  v_day_end TIME := '21:00:00'::TIME;
  v_current_slot TIME;
BEGIN
  v_current_slot := v_day_start;
  
  WHILE v_current_slot < v_day_end LOOP
    slot_start := v_current_slot;
    slot_end := v_current_slot + (p_slot_duration_minutes || ' minutes')::INTERVAL;
    
    is_available := NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.staff_user_id = p_staff_user_id
        AND a.appointment_date = p_date
        AND a.status NOT IN ('cancelled', 'no_show')
        AND (a.start_time < slot_end AND a.end_time > v_current_slot)
        AND (p_location_id IS NULL OR a.location_id = p_location_id)
    );
    
    RETURN NEXT;
    v_current_slot := v_current_slot + (p_slot_duration_minutes || ' minutes')::INTERVAL;
  END LOOP;
END;
$$;

-- 2. CHECK BOOKING CONFLICTS
CREATE OR REPLACE FUNCTION public.check_booking_conflicts(
  p_staff_user_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_location_id TEXT DEFAULT NULL,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS TABLE(
  has_conflict BOOLEAN,
  conflict_type TEXT,
  conflict_appointment_id UUID,
  conflict_client_name TEXT,
  conflict_start_time TIME,
  conflict_end_time TIME
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as has_conflict,
    'STAFF_DOUBLE_BOOKING'::TEXT as conflict_type,
    a.id as conflict_appointment_id,
    a.client_name as conflict_client_name,
    a.start_time as conflict_start_time,
    a.end_time as conflict_end_time
  FROM public.appointments a
  WHERE a.staff_user_id = p_staff_user_id
    AND a.appointment_date = p_date
    AND a.status NOT IN ('cancelled', 'no_show')
    AND (p_exclude_appointment_id IS NULL OR a.id != p_exclude_appointment_id)
    AND (p_location_id IS NULL OR a.location_id = p_location_id)
    AND (a.start_time < p_end_time AND a.end_time > p_start_time);
    
  IF NOT FOUND THEN
    has_conflict := false;
    conflict_type := NULL;
    conflict_appointment_id := NULL;
    conflict_client_name := NULL;
    conflict_start_time := NULL;
    conflict_end_time := NULL;
    RETURN NEXT;
  END IF;
END;
$$;

-- 3. CREATE BOOKING (all required params first, then optional)
CREATE OR REPLACE FUNCTION public.create_booking(
  p_location_id TEXT,
  p_staff_user_id UUID,
  p_appointment_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_client_id UUID DEFAULT NULL,
  p_client_name TEXT DEFAULT NULL,
  p_client_email TEXT DEFAULT NULL,
  p_client_phone TEXT DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_service_name TEXT DEFAULT NULL,
  p_total_price NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  appointment_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict_check RECORD;
  v_new_appointment_id UUID;
  v_staff_name TEXT;
  v_service_category TEXT;
  v_duration_minutes INTEGER;
BEGIN
  SELECT * INTO v_conflict_check
  FROM public.check_booking_conflicts(p_staff_user_id, p_appointment_date, p_start_time, p_end_time, p_location_id)
  WHERE has_conflict = true
  LIMIT 1;
  
  IF v_conflict_check.has_conflict THEN
    success := false;
    appointment_id := NULL;
    error_message := 'Conflict with existing appointment for ' || 
                     COALESCE(v_conflict_check.conflict_client_name, 'another client') ||
                     ' at ' || v_conflict_check.conflict_start_time::TEXT;
    RETURN NEXT;
    RETURN;
  END IF;
  
  SELECT display_name INTO v_staff_name FROM public.employee_profiles WHERE user_id = p_staff_user_id;
  
  IF p_service_id IS NOT NULL THEN
    SELECT category, duration_minutes INTO v_service_category, v_duration_minutes FROM public.services WHERE id = p_service_id;
  END IF;
  
  IF v_duration_minutes IS NULL THEN
    v_duration_minutes := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60;
  END IF;
  
  INSERT INTO public.appointments (
    location_id, staff_user_id, staff_name, client_id, client_name, client_email, client_phone,
    service_id, service_name, service_category, appointment_date, start_time, end_time,
    duration_minutes, status, total_price, notes, import_source
  ) VALUES (
    p_location_id, p_staff_user_id, v_staff_name, p_client_id, p_client_name, p_client_email, p_client_phone,
    p_service_id, COALESCE(p_service_name, (SELECT name FROM public.services WHERE id = p_service_id)),
    v_service_category, p_appointment_date, p_start_time, p_end_time, v_duration_minutes,
    'confirmed', p_total_price, p_notes, 'manual'
  )
  RETURNING id INTO v_new_appointment_id;
  
  success := true;
  appointment_id := v_new_appointment_id;
  error_message := NULL;
  RETURN NEXT;
END;
$$;

-- 4. UPDATE BOOKING STATUS
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_appointment_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_tip_amount NUMERIC DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show') THEN
    success := false;
    error_message := 'Invalid status: ' || p_status;
    RETURN NEXT;
    RETURN;
  END IF;
  
  UPDATE public.appointments
  SET status = p_status, notes = COALESCE(p_notes, notes), tip_amount = COALESCE(p_tip_amount, tip_amount), updated_at = now()
  WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    success := false;
    error_message := 'Appointment not found';
    RETURN NEXT;
    RETURN;
  END IF;
  
  success := true;
  error_message := NULL;
  RETURN NEXT;
END;
$$;

-- 5. RESCHEDULE BOOKING
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_appointment_id UUID,
  p_new_date DATE,
  p_new_start_time TIME,
  p_new_end_time TIME,
  p_new_staff_user_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment RECORD;
  v_conflict_check RECORD;
  v_staff_to_check UUID;
BEGIN
  SELECT * INTO v_appointment FROM public.appointments WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    success := false;
    error_message := 'Appointment not found';
    RETURN NEXT;
    RETURN;
  END IF;
  
  v_staff_to_check := COALESCE(p_new_staff_user_id, v_appointment.staff_user_id);
  
  SELECT * INTO v_conflict_check
  FROM public.check_booking_conflicts(v_staff_to_check, p_new_date, p_new_start_time, p_new_end_time, v_appointment.location_id, p_appointment_id)
  WHERE has_conflict = true
  LIMIT 1;
  
  IF v_conflict_check.has_conflict THEN
    success := false;
    error_message := 'New time conflicts with appointment for ' || COALESCE(v_conflict_check.conflict_client_name, 'another client');
    RETURN NEXT;
    RETURN;
  END IF;
  
  UPDATE public.appointments
  SET appointment_date = p_new_date, start_time = p_new_start_time, end_time = p_new_end_time,
      staff_user_id = v_staff_to_check,
      staff_name = COALESCE((SELECT display_name FROM public.employee_profiles WHERE user_id = v_staff_to_check), staff_name),
      updated_at = now()
  WHERE id = p_appointment_id;
  
  success := true;
  error_message := NULL;
  RETURN NEXT;
END;
$$;