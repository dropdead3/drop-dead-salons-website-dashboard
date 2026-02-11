-- Drop the foreign key constraint that prevents storing raw Phorest client IDs
-- phorest_client_id is used as an analytics grouping key, not a relational FK
ALTER TABLE public.phorest_appointments 
DROP CONSTRAINT IF EXISTS phorest_appointments_phorest_client_id_fkey;