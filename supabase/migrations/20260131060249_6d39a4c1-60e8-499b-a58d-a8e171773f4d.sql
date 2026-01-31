-- Add import_job_id to enable precise rollback on all importable tables
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES public.import_jobs(id);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES public.import_jobs(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES public.import_jobs(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES public.import_jobs(id);
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES public.import_jobs(id);
ALTER TABLE public.imported_staff ADD COLUMN IF NOT EXISTS import_job_id UUID REFERENCES public.import_jobs(id);

-- Add rollback tracking columns to import_jobs
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS rolled_back_at TIMESTAMPTZ;
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS rolled_back_by UUID REFERENCES auth.users(id);
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS is_dry_run BOOLEAN DEFAULT false;

-- Create indexes for efficient rollback queries
CREATE INDEX IF NOT EXISTS idx_clients_import_job ON public.clients(import_job_id);
CREATE INDEX IF NOT EXISTS idx_services_import_job ON public.services(import_job_id);
CREATE INDEX IF NOT EXISTS idx_appointments_import_job ON public.appointments(import_job_id);
CREATE INDEX IF NOT EXISTS idx_products_import_job ON public.products(import_job_id);
CREATE INDEX IF NOT EXISTS idx_locations_import_job ON public.locations(import_job_id);
CREATE INDEX IF NOT EXISTS idx_imported_staff_import_job ON public.imported_staff(import_job_id);