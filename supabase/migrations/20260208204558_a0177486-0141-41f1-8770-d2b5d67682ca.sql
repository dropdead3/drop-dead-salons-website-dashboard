-- Add sender_role column to welcome rules
ALTER TABLE public.team_chat_welcome_rules 
ADD COLUMN sender_role TEXT NOT NULL DEFAULT 'manager';

-- Drop old unique constraint on sender_user_id
ALTER TABLE public.team_chat_welcome_rules 
DROP CONSTRAINT IF EXISTS team_chat_welcome_rules_organization_id_sender_user_id_key;

-- Add new unique constraint on sender_role
ALTER TABLE public.team_chat_welcome_rules
ADD CONSTRAINT team_chat_welcome_rules_org_role_unique 
UNIQUE(organization_id, sender_role);

-- Drop the old sender_user_id column
ALTER TABLE public.team_chat_welcome_rules 
DROP COLUMN IF EXISTS sender_user_id;