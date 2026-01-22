-- Fix role display names to match their intended purposes
UPDATE public.roles SET display_name = 'Admin Assistant' WHERE name = 'admin_assistant';
UPDATE public.roles SET display_name = 'Admin' WHERE name = 'admin';
UPDATE public.roles SET display_name = 'Manager' WHERE name = 'manager';