-- Create function to calculate preferred stylists based on appointment history
CREATE OR REPLACE FUNCTION public.calculate_preferred_stylists()
RETURNS TABLE(client_id uuid, preferred_user_id uuid, appointment_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH client_stylist_counts AS (
    SELECT 
      c.id as client_id,
      sm.user_id as stylist_user_id,
      COUNT(*) as appointment_count,
      ROW_NUMBER() OVER (
        PARTITION BY c.id 
        ORDER BY COUNT(*) DESC, MAX(a.appointment_date) DESC
      ) as rn
    FROM phorest_clients c
    INNER JOIN phorest_appointments a 
      ON c.phorest_client_id = a.phorest_client_id
    INNER JOIN phorest_staff_mapping sm 
      ON a.phorest_staff_id = sm.phorest_staff_id
    WHERE a.phorest_client_id IS NOT NULL
      AND sm.user_id IS NOT NULL
    GROUP BY c.id, sm.user_id
  )
  SELECT 
    client_id,
    stylist_user_id as preferred_user_id,
    appointment_count
  FROM client_stylist_counts
  WHERE rn = 1
$$;

-- Create function to update preferred_stylist_id based on calculation
CREATE OR REPLACE FUNCTION public.update_preferred_stylists()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  UPDATE phorest_clients c
  SET preferred_stylist_id = cps.preferred_user_id
  FROM (SELECT * FROM calculate_preferred_stylists()) cps
  WHERE c.id = cps.client_id
    AND (c.preferred_stylist_id IS NULL OR c.preferred_stylist_id != cps.preferred_user_id);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;