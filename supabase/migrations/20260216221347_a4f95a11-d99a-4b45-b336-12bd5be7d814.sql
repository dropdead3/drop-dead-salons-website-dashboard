ALTER TABLE organization_kiosk_settings
  ADD COLUMN IF NOT EXISTS enable_self_booking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS self_booking_allow_future boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS self_booking_show_stylists boolean DEFAULT true;