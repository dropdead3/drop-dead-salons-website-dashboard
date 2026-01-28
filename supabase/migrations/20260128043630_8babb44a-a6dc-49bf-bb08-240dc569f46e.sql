-- Add rebooked_at_checkout column to track client rebookings at checkout
ALTER TABLE public.phorest_appointments 
ADD COLUMN IF NOT EXISTS rebooked_at_checkout BOOLEAN DEFAULT false;