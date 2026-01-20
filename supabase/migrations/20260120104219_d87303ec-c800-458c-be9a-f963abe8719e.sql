-- Add link_url column to onboarding_tasks table
ALTER TABLE public.onboarding_tasks 
ADD COLUMN link_url text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.onboarding_tasks.link_url IS 'Optional external URL that users can click to complete the task (e.g., registration page, app download)';