-- Update existing 'assistant' role entries to 'operations_assistant' in user_roles
UPDATE public.user_roles SET role = 'operations_assistant' WHERE role = 'assistant';

-- Update existing 'assistant' role entries to 'operations_assistant' in dashboard_element_visibility
UPDATE public.dashboard_element_visibility SET role = 'operations_assistant' WHERE role = 'assistant';

-- Update existing 'assistant' role entries in staff_invitations
UPDATE public.staff_invitations SET role = 'operations_assistant' WHERE role = 'assistant';

-- Update handbooks visible_to_roles arrays
UPDATE public.handbooks 
SET visible_to_roles = array_replace(visible_to_roles, 'assistant'::app_role, 'operations_assistant'::app_role)
WHERE 'assistant' = ANY(visible_to_roles);

-- Update training_videos required_for_roles arrays  
UPDATE public.training_videos
SET required_for_roles = array_replace(required_for_roles, 'assistant'::app_role, 'operations_assistant'::app_role)
WHERE 'assistant' = ANY(required_for_roles);

-- Add visibility entries for new roles for all existing dashboard elements
INSERT INTO public.dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT DISTINCT element_key, element_name, element_category, 'stylist_assistant'::app_role, true
FROM public.dashboard_element_visibility
WHERE role = 'stylist'
ON CONFLICT DO NOTHING;

INSERT INTO public.dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT DISTINCT element_key, element_name, element_category, 'admin_assistant'::app_role, true
FROM public.dashboard_element_visibility
WHERE role = 'admin'
ON CONFLICT DO NOTHING;