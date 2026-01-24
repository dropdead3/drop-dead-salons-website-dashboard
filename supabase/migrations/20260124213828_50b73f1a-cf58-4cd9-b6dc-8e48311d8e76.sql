-- Fix overly permissive RLS policy for email_digest_log
DROP POLICY IF EXISTS "System can insert digest logs" ON public.email_digest_log;

-- Only allow inserts for authenticated users (edge functions use service role)
CREATE POLICY "Authenticated can insert digest logs" ON public.email_digest_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);