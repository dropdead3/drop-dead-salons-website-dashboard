import { useChatPermissions, CHAT_PERMISSION_KEYS, type ChatPermissionKey } from '@/hooks/team-chat/useChatPermissions';
import { useRoles } from '@/hooks/useRoles';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield } from 'lucide-react';

interface ChatPermissionsTabProps {
  embedded?: boolean; // When true, renders without Card wrapper (for Access Hub)
}

const PERMISSION_LABELS: Record<ChatPermissionKey, { label: string; description: string }> = {
  [CHAT_PERMISSION_KEYS.CREATE_CHANNEL]: {
    label: 'Create Channels',
    description: 'Can create new public or private channels',
  },
  [CHAT_PERMISSION_KEYS.CREATE_SECTION]: {
    label: 'Create Sections',
    description: 'Can create new channel sections to organize the sidebar',
  },
  [CHAT_PERMISSION_KEYS.DELETE_CHANNEL]: {
    label: 'Delete Channels',
    description: 'Can permanently delete channels with no message history',
  },
  [CHAT_PERMISSION_KEYS.ARCHIVE_CHANNEL]: {
    label: 'Archive Channels',
    description: 'Can archive channels to hide them from the sidebar',
  },
  [CHAT_PERMISSION_KEYS.MANAGE_MEMBERS]: {
    label: 'Manage Members',
    description: 'Can add or remove members from channels',
  },
  [CHAT_PERMISSION_KEYS.PIN_MESSAGES]: {
    label: 'Pin Messages',
    description: 'Can pin important messages in channels',
  },
  [CHAT_PERMISSION_KEYS.DELETE_ANY_MESSAGE]: {
    label: 'Delete Any Message',
    description: 'Can delete any message in channels they have access to',
  },
};

export function ChatPermissionsTab({ embedded = false }: ChatPermissionsTabProps) {
  const { permissions, hasPermission, updatePermission, isLoading, isUpdating } = useChatPermissions();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  // Filter out super_admin as they always have all permissions
  const editableRoles = roles.filter(r => r.name !== 'super_admin');

  const handleToggle = (permissionKey: string, role: string, currentValue: boolean) => {
    updatePermission({
      permission_key: permissionKey,
      role,
      is_allowed: !currentValue,
    });
  };

  if (isLoading || rolesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Note about super admins */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Crown className="h-4 w-4 text-warning" />
        <span>Super Admins and Account Owners always have full permissions</span>
      </div>

      {/* Permission Matrix */}
      <div className="space-y-4">
        {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => (
          <div key={key} className="space-y-3 border rounded-lg p-4">
            <div>
              <h4 className="font-medium">{label}</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {editableRoles.map((role) => {
                const isAllowed = hasPermission(key, role.name);
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {role.name === 'admin' && (
                        <Shield className="h-3 w-3 text-primary shrink-0" />
                      )}
                      <Label
                        htmlFor={`${key}-${role.name}`}
                        className="text-sm font-normal truncate cursor-pointer"
                      >
                        {role.display_name || role.name}
                      </Label>
                    </div>
                    <Switch
                      id={`${key}-${role.name}`}
                      checked={isAllowed}
                      onCheckedChange={() => handleToggle(key, role.name, isAllowed)}
                      disabled={isUpdating}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Chat Permissions
        </CardTitle>
        <CardDescription>
          Control which roles can perform specific actions in Team Chat
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
