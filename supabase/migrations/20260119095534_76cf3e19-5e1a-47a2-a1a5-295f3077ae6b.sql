-- Step 1: Add the new role values to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'stylist_assistant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_assistant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_assistant';