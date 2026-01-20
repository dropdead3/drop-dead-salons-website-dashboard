-- Add ring_the_bell permission to all remaining staff roles
INSERT INTO role_permissions (role, permission_id)
SELECT role, '405ddf49-4b83-48ff-87cc-6733a9c53aad'
FROM unnest(ARRAY['receptionist', 'assistant', 'stylist_assistant', 'admin_assistant', 'operations_assistant']::app_role[]) AS role
ON CONFLICT (role, permission_id) DO NOTHING;

-- Drop existing SELECT policy and create one that allows all authenticated users to view all entries
DROP POLICY IF EXISTS "Users can view their own entries" ON ring_the_bell_entries;
DROP POLICY IF EXISTS "Users can view all entries" ON ring_the_bell_entries;

CREATE POLICY "All staff can view all entries"
ON ring_the_bell_entries
FOR SELECT
TO authenticated
USING (true);