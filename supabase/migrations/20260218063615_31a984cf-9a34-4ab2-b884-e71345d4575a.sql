ALTER TABLE public.services
ADD COLUMN cost NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN public.services.cost IS 'Cost to deliver this service (product, supplies, etc.)';