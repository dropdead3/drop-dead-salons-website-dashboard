-- Add store_number column to locations table
ALTER TABLE public.locations 
ADD COLUMN store_number text;

-- Add comment for clarity
COMMENT ON COLUMN public.locations.store_number IS 'Unique store identifier (e.g., 001, NM-01)';