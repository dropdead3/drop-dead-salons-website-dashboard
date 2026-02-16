
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS finishing_time_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_creation_time_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_time_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_new_client_consultation BOOLEAN NOT NULL DEFAULT false;
