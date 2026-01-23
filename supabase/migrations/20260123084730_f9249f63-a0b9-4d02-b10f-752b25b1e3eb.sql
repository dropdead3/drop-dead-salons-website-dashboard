-- Add foreign key from phorest_appointments.phorest_client_id to phorest_clients.phorest_client_id
-- First, ensure the FK doesn't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'phorest_appointments_phorest_client_id_fkey'
  ) THEN
    ALTER TABLE public.phorest_appointments
    ADD CONSTRAINT phorest_appointments_phorest_client_id_fkey
    FOREIGN KEY (phorest_client_id) REFERENCES public.phorest_clients(phorest_client_id);
  END IF;
END $$;