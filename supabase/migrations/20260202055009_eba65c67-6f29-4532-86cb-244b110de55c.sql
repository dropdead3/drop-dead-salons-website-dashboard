-- Add ban-related columns to phorest_clients
ALTER TABLE phorest_clients
ADD COLUMN is_banned boolean DEFAULT false,
ADD COLUMN ban_reason text,
ADD COLUMN banned_at timestamp with time zone,
ADD COLUMN banned_by uuid;

-- Create index for efficient filtering
CREATE INDEX idx_phorest_clients_is_banned ON phorest_clients(is_banned) WHERE is_banned = true;