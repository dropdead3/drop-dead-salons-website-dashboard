-- Add unique constraint on (organization_id, name, type) for system channels
-- This prevents duplicate channels from being created due to race conditions
CREATE UNIQUE INDEX IF NOT EXISTS chat_channels_org_name_type_unique 
ON chat_channels (organization_id, name, type) 
WHERE is_system = true;