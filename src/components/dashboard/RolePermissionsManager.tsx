import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { usePermissionsByCategory, useRolePermissions, useToggleRolePermission } from '@/hooks/usePermissions';
import { useRoles } from '@/hooks/useRoles';
import type { Database } from '@/integrations/supabase/types';
import * as LucideIcons from 'lucide-react';
import { 
  Shield, 
  Lock,
  LayoutDashboard,
  TrendingUp,
  Calendar,
  FileText,
  Users,
  Settings,
  Sparkles,
  CircleDot,
} from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: LayoutDashboard,
  Growth: TrendingUp,
  Scheduling: Calendar,
  Housekeeping: FileText,
  Management: Users,
  Administration: Settings,
};

const categoryOrder = ['Dashboard', 'Growth', 'Scheduling', 'Housekeeping', 'Management', 'Administration'];

// Helper to get icon component from string name
const getIconComponent = (iconName: string | null): React.ComponentType<{ className?: string }> => {
  if (!iconName) return CircleDot;
  // Access lucide icons dynamically
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const Icon = icons[iconName];
  return Icon || CircleDot;
};

export function RolePermissionsManager() {
  const [selectedRole, setSelectedRole] = useState<string>('super_admin');
  const { data: permissionsByCategory, isLoading: permissionsLoading } = usePermissionsByCategory();
  const { data: rolePermissions, isLoading: rolePermissionsLoading } = useRolePermissions();
  const { data: dynamicRoles, isLoading: rolesLoading } = useRoles();
  const togglePermission = useToggleRolePermission();

  const isLoading = permissionsLoading || rolePermissionsLoading || rolesLoading;

  // Build roles list dynamically from database, with Super Admin always first
  const allRolesWithSuper = useMemo(() => {
    const superAdminRole = {
      id: 'super_admin',
      name: 'super_admin',
      display_name: 'Super Admin',
      icon: 'Sparkles',
      color: '#f59e0b', // amber
      is_active: true,
      description: 'Full system access',
      display_order: -1,
      category: 'leadership',
    };
    
    // Filter out any super_admin from database to avoid duplication (we use the hardcoded one above)
    const activeRoles = dynamicRoles?.filter(r => r.is_active && r.name !== 'super_admin') || [];
    return [superAdminRole, ...activeRoles];
  }, [dynamicRoles]);

  // Get total number of permissions for Super Admin (always has all)
  const totalPermissions = Object.values(permissionsByCategory || {}).flat().length;

  const hasPermission = (roleName: string, permissionId: string) => {
    // Super Admin always has all permissions
    if (roleName === 'super_admin') return true;
    return rolePermissions?.some(rp => rp.role === roleName && rp.permission_id === permissionId) ?? false;
  };

  const getPermissionCountForRole = (roleName: string) => {
    if (roleName === 'super_admin') return totalPermissions;
    return rolePermissions?.filter(rp => rp.role === roleName).length ?? 0;
  };

  const handleToggle = (permissionId: string, currentlyHas: boolean) => {
    // Super Admin permissions are locked (always all)
    if (selectedRole === 'super_admin') return;
    
    togglePermission.mutate({
      role: selectedRole as AppRole,
      permissionId,
      hasPermission: currentlyHas,
    });
  };

  // Get selected role data
  const selectedRoleData = allRolesWithSuper.find(r => r.name === selectedRole);
  const RoleIcon = selectedRoleData ? getIconComponent(selectedRoleData.icon) : Sparkles;

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
          Configure which permissions are granted to each role. Super Admin has all permissions (locked).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Role Tabs - Dynamic from database */}
        <Tabs value={selectedRole} onValueChange={setSelectedRole}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6 p-2 rounded-lg">
            {allRolesWithSuper.map(role => {
              const Icon = getIconComponent(role.icon);
              const isSuperAdmin = role.name === 'super_admin';
              return (
                <TabsTrigger 
                  key={role.name} 
                  value={role.name}
                  className={cn(
                    "flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5",
                    isSuperAdmin && "data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-orange-100 dark:data-[state=active]:from-amber-900/40 dark:data-[state=active]:to-orange-900/40"
                  )}
                  style={!isSuperAdmin && role.color ? { 
                    '--role-color': role.color,
                  } as React.CSSProperties : undefined}
                >
                  <span 
                    className="w-3.5 h-3.5 flex items-center justify-center"
                    style={!isSuperAdmin && role.color ? { color: role.color } : isSuperAdmin ? { color: '#d97706' } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="hidden sm:inline">{role.display_name}</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-1 text-[10px] px-1.5 py-0",
                      isSuperAdmin && "bg-amber-200/50 text-amber-800 dark:bg-amber-800/30 dark:text-amber-300"
                    )}
                  >
                    {getPermissionCountForRole(role.name)}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {allRolesWithSuper.map(role => {
            const isSuperAdmin = role.name === 'super_admin';
            const CurrentRoleIcon = getIconComponent(role.icon);
            
            return (
              <TabsContent key={role.name} value={role.name} className="space-y-6">
                {/* Role Header */}
                <div 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border",
                    isSuperAdmin 
                      ? "bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 text-amber-900 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <span style={!isSuperAdmin && role.color ? { color: role.color } : undefined}>
                    <CurrentRoleIcon className="w-8 h-8" />
                  </span>
                  <div>
                    <h3 className={cn(
                      "font-display font-medium text-lg",
                      !isSuperAdmin && "text-foreground"
                    )}>
                      {role.display_name} Permissions
                    </h3>
                    <p className={cn(
                      "text-sm",
                      isSuperAdmin ? "opacity-80" : "text-muted-foreground"
                    )}>
                      {isSuperAdmin 
                        ? 'All permissions granted (locked) - Full system access'
                        : `${getPermissionCountForRole(role.name)} permissions granted`
                      }
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <Badge variant="outline" className="ml-auto gap-1 border-amber-400 text-amber-700 dark:border-amber-600 dark:text-amber-300">
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
                            {permissions.filter(p => hasPermission(role.name, p.id)).length}/{permissions.length}
                          </Badge>
                        </div>
                        <div className="divide-y">
                          {permissions.map(permission => {
                            const has = hasPermission(role.name, permission.id);
                            const isLocked = isSuperAdmin;

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
                                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                                          <Switch 
                                            checked={has} 
                                            disabled 
                                            className="data-[state=checked]:bg-amber-500"
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Super Admin always has all permissions
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
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
