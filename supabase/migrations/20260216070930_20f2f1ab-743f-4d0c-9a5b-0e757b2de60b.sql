
-- Fix 1: Drop the overly restrictive FOR ALL policy on service_email_queue
-- that blocks even the SELECT policy from working for admins
DROP POLICY IF EXISTS "Service role manages email queue" ON public.service_email_queue;

-- Fix 2: Add error_message column if missing (for tracking skip reasons)
-- Already exists from original migration, no action needed.
