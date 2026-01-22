-- Add category column to roles table
ALTER TABLE public.roles 
ADD COLUMN category text NOT NULL DEFAULT 'other';

-- Update existing roles with appropriate categories
UPDATE public.roles SET category = 'leadership' WHERE name IN ('super_admin', 'admin', 'manager', 'general_manager', 'assistant_manager');
UPDATE public.roles SET category = 'operations' WHERE name IN ('director_of_operations', 'operations_assistant', 'receptionist', 'front_desk');
UPDATE public.roles SET category = 'stylists' WHERE name IN ('stylist', 'stylist_assistant');

-- Create index for category queries
CREATE INDEX idx_roles_category ON public.roles(category);