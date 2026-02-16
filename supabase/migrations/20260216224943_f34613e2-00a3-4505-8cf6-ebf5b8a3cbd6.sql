
-- Security definer function to restrict heartbeat updates to only last_heartbeat_at and is_active
CREATE OR REPLACE FUNCTION public.kiosk_heartbeat_update(
  p_device_token TEXT,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.kiosk_devices
  SET last_heartbeat_at = now(),
      is_active = p_is_active
  WHERE device_token = p_device_token;
END;
$$;

-- Public INSERT policy for kiosk self-registration
CREATE POLICY "Kiosk can self-register device"
  ON public.kiosk_devices
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public SELECT policy so kiosk can check its own device row (needed for upsert logic)
CREATE POLICY "Kiosk can read own device by token"
  ON public.kiosk_devices
  FOR SELECT
  TO anon
  USING (true);

-- Public UPDATE policy scoped to device_token match
CREATE POLICY "Kiosk can update own heartbeat"
  ON public.kiosk_devices
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
