import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePermissionsByCategory, useRolePermissions, useToggleRolePermission } from '@/hooks/usePermissions';
import { ROLE_LABELS } from '@/hooks/useUserRoles';
import type { Database } from '@/integrations/supabase/types';
import { 
  Shield, 
  Crown, 
  Scissors, 
  Headset, 
  HandHelping,
  Lock,
  LayoutDashboard,
  TrendingUp,
  Calendar,
  FileText,
  Users,
  Settings,
} from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

const ALL_ROLES: AppRole[] = ['admin', 'manager', 'stylist', 'receptionist', 'assistant'];

const roleIcons: Record<AppRole, React.ComponentType<{ className?: string }>> = {
  admin: Crown,
  manager: Shield,
  stylist: Scissors,
  receptionist: Headset,
  assistant: HandHelping,
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  stylist: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  receptionist: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  assistant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Growth: TrendingUp,
  Scheduling: Calendar,
  Housekeeping: FileText,
  Management: Users,
  Administration: Settings,
};

const categoryOrder = ['Dashboard', 'Growth', 'Scheduling', 'Housekeeping', 'Management', 'Administration'];

export function RolePermissionsManager() {
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');
  const { data: permissionsByCategory, isLoading: permissionsLoading } = usePermissionsByCategory();
  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useRolePermissions();
  const togglePermission = useToggleRolePermission();

  const isLoading = permissionsLoading || rolePermissionsLoading;

  const hasPermission = (role: AppRole, permissionId: string) => {
    return rolePermissions?.some(rp => rp.role === role && rp.permission_id === permissionId) ?? false;
  };

  const getPermissionCountForRole = (role: AppRole) => {
    return rolePermissions?.filter(rp => rp.role === role).length ?? 0;
  };

  const handleToggle = (permissionId: string, currentlyHas: boolean) => {
    // Admin role permissions are locked
    if (selectedRole === 'admin') return;
    
    togglePermission.mutate({
      role: selectedRole,
      permissionId,
      hasPermission: currentlyHas,
    });
  };

  const RoleIcon = roleIcons[selectedRole];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Role Permissions Matrix
        </CardTitle>
        <CardDescription>
          Configure which permissions are granted to each role. Admin permissions are locked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Role Tabs */}
        <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
          <TabsList className="grid grid-cols-5 mb-6">
            {ALL_ROLES.map(role => {
              const Icon = roleIcons[role];
              return (
                <TabsTrigger 
                  key={role} 
                  value={role}
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{ROLE_LABELS[role]}</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                    {getPermissionCountForRole(role)}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ALL_ROLES.map(role => (
            <TabsContent key={role} value={role} className="space-y-6">
              {/* Role Header */}
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-lg border",
                roleColors[role]
              )}>
                <RoleIcon className="w-8 h-8" />
                <div>
                  <h3 className="font-display font-medium text-lg">
                    {ROLE_LABELS[role]} Permissions
                  </h3>
                  <p className="text-sm opacity-80">
                    {role === 'admin' 
                      ? 'All permissions granted (locked)'
                      : `${getPermissionCountForRole(role)} permissions granted`
                    }
                  </p>
                </div>
                {role === 'admin' && (
                  <Badge variant="outline" className="ml-auto gap-1">
                    <Lock className="w-3 h-3" />
                    Locked
                  </Badge>
                )}
              </div>

              {/* Permission Categories */}
              <div className="space-y-4">
                {categoryOrder.map(category => {
                  const permissions = permissionsByCategory?.[category];
                  if (!permissions) return null;

                  const CategoryIcon = categoryIcons[category] || Settings;

                  return (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b">
                        <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-display font-medium text-sm">{category}</h4>
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          {permissions.filter(p => hasPermission(role, p.id)).length}/{permissions.length}
                        </Badge>
                      </div>
                      <div className="divide-y">
                        {permissions.map(permission => {
                          const has = hasPermission(role, permission.id);
                          const isLocked = role === 'admin';

                          return (
                            <div 
                              key={permission.id}
                              className={cn(
                                "flex items-center justify-between px-4 py-3 transition-colors",
                                has ? "bg-green-50/50 dark:bg-green-950/10" : "bg-background",
                                isLocked && "opacity-75"
                              )}
                            >
                              <div className="flex-1 min-w-0 mr-4">
                                <p className="font-medium text-sm">
                                  {permission.display_name}
                                </p>
                                {permission.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isLocked ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2">
                                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                        <Switch 
                                          checked={has} 
                                          disabled 
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Admin permissions cannot be modified
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Switch
                                    checked={has}
                                    onCheckedChange={() => handleToggle(permission.id, has)}
                                    disabled={togglePermission.isPending}
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
