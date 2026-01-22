-- Allow multiple Phorest staff mappings per user (one per branch)
-- First drop the unique constraint on user_id
ALTER TABLE public.phorest_staff_mapping DROP CONSTRAINT IF EXISTS phorest_staff_mapping_user_id_fkey;
ALTER TABLE public.phorest_staff_mapping DROP CONSTRAINT IF EXISTS phorest_staff_mapping_user_id_key;

-- Add branch tracking column
ALTER TABLE public.phorest_staff_mapping 
ADD COLUMN IF NOT EXISTS phorest_branch_id text,
ADD COLUMN IF NOT EXISTS phorest_branch_name text;

-- Re-add the foreign key without unique constraint
ALTER TABLE public.phorest_staff_mapping
ADD CONSTRAINT phorest_staff_mapping_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.employee_profiles(user_id) ON DELETE CASCADE;

-- Add unique constraint on user_id + phorest_staff_id combination instead
ALTER TABLE public.phorest_staff_mapping
ADD CONSTRAINT phorest_staff_mapping_user_branch_unique 
UNIQUE (user_id, phorest_staff_id);