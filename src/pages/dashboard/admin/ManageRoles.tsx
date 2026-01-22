import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Search, User, Shield, Crown, AlertTriangle, Lock, ArrowRight, Users, Key, UserPlus, Settings2 } from 'lucide-react';
import { useAllUsersWithRoles, useToggleUserRole } from '@/hooks/useUserRoles';
import { useRoles } from '@/hooks/useRoles';
import { getRoleColorClasses } from '@/components/dashboard/RoleColorPicker';
import { useCanApproveAdmin, useAccountApprovals, useToggleSuperAdmin } from '@/hooks/useAccountApproval';
import { RoleHistoryPanel } from '@/components/dashboard/RoleHistoryPanel';
import { RolePermissionsManager } from '@/components/dashboard/RolePermissionsManager';
import { RoleEditor } from '@/components/dashboard/RoleEditor';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

// Dynamic color classes based on role color from database
const getRoleBorderBgClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    red: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10',
    purple: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/10',
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10',
    green: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10',
    cyan: 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/10',
    orange: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10',
    yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/10',
    pink: 'border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/10',
    gray: 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/10',
  };
  return colorMap[color] || colorMap.gray;
};

const getRoleTextClasses = (color: string) => {
  const colorMap: Record<string, string> = {
    red: 'text-red-700 dark:text-red-400',
    purple: 'text-purple-700 dark:text-purple-400',
    blue: 'text-blue-700 dark:text-blue-400',
    green: 'text-green-700 dark:text-green-400',
    cyan: 'text-cyan-700 dark:text-cyan-400',
    orange: 'text-orange-700 dark:text-orange-400',
    yellow: 'text-yellow-700 dark:text-yellow-400',
    pink: 'text-pink-700 dark:text-pink-400',
    gray: 'text-gray-700 dark:text-gray-400',
  };
  return colorMap[color] || colorMap.gray;
};

export default function ManageRoles() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [superAdminConfirm, setSuperAdminConfirm] = useState<{
    userId: string;
    userName: string;
    isSuperAdmin: boolean;
  } | null>(null);
  const { data: users = [], isLoading } = useAllUsersWithRoles();
  const { data: accounts } = useAccountApprovals();
  const { data: canApproveAdmin } = useCanApproveAdmin();
  const { data: roles = [] } = useRoles();
  const toggleRole = useToggleUserRole();
  const toggleSuperAdmin = useToggleSuperAdmin();

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const getAccountInfo = (userId: string) => {
    return accounts?.find(a => a.user_id === userId);
  };

  // Calculate role statistics dynamically based on roles from database
  const roleStats = useMemo(() => {
    const stats: Record<string, number> = {
      total: users.length,
      super_admin: 0,
    };

    // Initialize counts for all active roles
    roles.forEach(role => {
      stats[role.name] = 0;
    });

    users.forEach(user => {
      const accountInfo = getAccountInfo(user.user_id);
      if (accountInfo?.is_super_admin) {
        stats.super_admin++;
      } else {
        user.roles.forEach(role => {
          if (stats[role] !== undefined) {
            stats[role]++;
          }
        });
      }
    });

    return stats;
  }, [users, accounts, roles]);

  // Helper to get role info
  const getRoleInfo = (roleName: string) => roles.find(r => r.name === roleName);

  const handleToggleRole = (userId: string, role: string, hasRole: boolean) => {
    toggleRole.mutate({ userId, role: role as AppRole, hasRole });
  };

  const handleToggleSuperAdmin = (userId: string, userName: string, isSuperAdmin: boolean) => {
    setSuperAdminConfirm({ userId, userName, isSuperAdmin });
  };

  const confirmSuperAdminToggle = () => {
    if (superAdminConfirm) {
      toggleSuperAdmin.mutate({ userId: superAdminConfirm.userId, grant: !superAdminConfirm.isSuperAdmin });
      setSuperAdminConfirm(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-medium mb-2 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Manage Users & Roles
          </h1>
          <p className="text-muted-foreground">
            Assign and manage user roles across your team.
          </p>
        </div>

        {/* Role Statistics Overview - dynamic from database */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Card className="bg-muted/30 min-w-[100px]">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-display font-medium">{roleStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          {roles.map(role => {
            const isSuperAdminRole = role.name === 'super_admin';
            return (
              <Card 
                key={role.name} 
                className={cn(
                  "border min-w-[100px]",
                  isSuperAdminRole 
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800"
                    : getRoleBorderBgClasses(role.color)
                )}
              >
                <CardContent className="p-4 text-center">
                  <p className={cn(
                    "text-2xl font-display font-medium",
                    isSuperAdminRole ? "text-amber-700 dark:text-amber-400" : getRoleTextClasses(role.color)
                  )}>
                    {isSuperAdminRole ? roleStats.super_admin : (roleStats[role.name] || 0)}
                  </p>
                  <p className={cn(
                    "text-xs flex items-center justify-center gap-1",
                    isSuperAdminRole ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"
                  )}>
                    {isSuperAdminRole && <Crown className="w-3 h-3" />}
                    {role.display_name}{!isSuperAdminRole && 's'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Admin Role Warning */}
        {!canApproveAdmin && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Limited Permissions:</strong> Only Super Admins can assign or remove the Admin role. 
              Contact your account owner to request Super Admin status.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs: User Roles vs Role Permissions vs Manage Roles */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              User Roles
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Key className="w-4 h-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Manage Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Role Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Role Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roles.map(role => {
                    const colorClasses = getRoleColorClasses(role.color);
                    const isSuperAdminRole = role.name === 'super_admin';
                    return (
                      <div key={role.name} className="flex items-start gap-2">
                        <Badge 
                          variant={isSuperAdminRole ? "default" : "outline"} 
                          className={cn(
                            "text-xs shrink-0",
                            isSuperAdminRole 
                              ? "bg-gradient-to-r from-amber-200 via-orange-100 to-amber-200 text-amber-900 border-amber-300 gap-1" 
                              : cn(colorClasses.bg, colorClasses.text)
                          )}
                        >
                          {isSuperAdminRole && <Crown className="w-3 h-3" />}
                          {role.display_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {role.description || 'No description'}
                          {role.name === 'admin' && !canApproveAdmin && (
                            <span className="text-amber-600 dark:text-amber-400 ml-1">(Super Admin required)</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/dashboard/admin/invitations">
                <UserPlus className="w-4 h-4" />
                Invite Staff Member
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/dashboard/admin/approvals">
                Account Approvals
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No users found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map(user => {
              const accountInfo = getAccountInfo(user.user_id);
              const isSuperAdmin = accountInfo?.is_super_admin;
              const isApproved = accountInfo?.is_approved;
              const hasAdminApproval = !!accountInfo?.admin_approved_by;
              
              return (
                <Card key={user.user_id} className={cn(
                  !isApproved && "opacity-60"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.photo_url || undefined} alt={user.full_name} />
                        <AvatarFallback className="bg-muted">
                          {user.full_name?.charAt(0) || <User className="w-5 h-5" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">
                            {user.display_name || user.full_name}
                          </h3>
                          {isSuperAdmin && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge className="bg-gradient-to-r from-amber-200 via-orange-100 to-amber-200 text-amber-900 gap-1 text-xs border border-amber-300">
                                  <Crown className="w-3 h-3" />
                                  Super Admin
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Can approve admin roles</TooltipContent>
                            </Tooltip>
                          )}
                          {!isApproved && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              Pending Approval
                            </Badge>
                          )}
                        </div>
                        {user.email && (
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        )}
                        
                        {/* Current Roles */}
                        {user.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.roles.map(roleName => {
                              const roleInfo = getRoleInfo(roleName);
                              const colorClasses = roleInfo ? getRoleColorClasses(roleInfo.color) : getRoleColorClasses('gray');
                              return (
                                <Badge 
                                  key={roleName} 
                                  variant="outline" 
                                  className={cn("text-xs", colorClasses.bg, colorClasses.text)}
                                >
                                  {roleInfo?.display_name || roleName}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Toggles - ordered by sort_order from database */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-x-8 gap-y-3">
                      {roles.map(role => {
                        const isSuperAdminRole = role.name === 'super_admin';
                        
                        // Super Admin role - special handling
                        if (isSuperAdminRole) {
                          // Only show super admin toggle for super admins or those who can approve admins
                          if (!isSuperAdmin && !canApproveAdmin) return null;
                          
                          return (
                            <div key={role.name} className="flex items-center gap-2">
                              <label 
                                htmlFor={`${user.user_id}-super-admin`}
                                className={cn(
                                  "text-sm font-medium flex items-center gap-1",
                                  isSuperAdmin && !canApproveAdmin ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"
                                )}
                              >
                                <Crown className="w-3 h-3 text-amber-600" />
                                {role.display_name}
                              </label>
                              {isSuperAdmin && !canApproveAdmin && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="w-3 h-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>Inherent to Super Admin status</TooltipContent>
                                </Tooltip>
                              )}
                              <Switch
                                id={`${user.user_id}-super-admin`}
                                checked={isSuperAdmin || false}
                                onCheckedChange={() => handleToggleSuperAdmin(user.user_id, user.display_name || user.full_name, isSuperAdmin || false)}
                                disabled={toggleSuperAdmin.isPending || !canApproveAdmin}
                                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-400 data-[state=checked]:to-orange-400"
                              />
                            </div>
                          );
                        }
                        
                        // Regular roles
                        const hasRole = user.roles.includes(role.name as AppRole);
                        const isAdminRole = role.name === 'admin';
                        const isLockedByPermission = isAdminRole && !canApproveAdmin;
                        const isLockedBySuperAdmin = isSuperAdmin; // Lock all roles when user is super admin
                        const isLocked = isLockedByPermission || isLockedBySuperAdmin;
                        
                        return (
                          <div key={role.name} className="flex items-center gap-2">
                            <label 
                              htmlFor={`${user.user_id}-${role.name}`}
                              className={cn(
                                "text-sm font-medium",
                                isLocked ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"
                              )}
                            >
                              {role.display_name}
                            </label>
                            {isLockedByPermission && !isLockedBySuperAdmin && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="w-3 h-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>Super Admin required</TooltipContent>
                              </Tooltip>
                            )}
                            {isLockedBySuperAdmin && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="w-3 h-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>Super Admins have full access</TooltipContent>
                              </Tooltip>
                            )}
                            <Switch
                              id={`${user.user_id}-${role.name}`}
                              checked={isLockedBySuperAdmin ? false : hasRole}
                              onCheckedChange={() => handleToggleRole(user.user_id, role.name, hasRole)}
                              disabled={toggleRole.isPending || isLocked}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Role History */}
                    <div className="mt-3">
                      <RoleHistoryPanel 
                        userId={user.user_id} 
                        isOpen={expandedHistory === user.user_id}
                        onToggle={() => setExpandedHistory(
                          expandedHistory === user.user_id ? null : user.user_id
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
          </TabsContent>

          <TabsContent value="permissions">
            <RolePermissionsManager />
          </TabsContent>

          <TabsContent value="manage">
            <RoleEditor />
          </TabsContent>
        </Tabs>
      </div>

      {/* Full Access Admin Confirmation Dialog */}
      <AlertDialog open={!!superAdminConfirm} onOpenChange={() => setSuperAdminConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              {superAdminConfirm?.isSuperAdmin ? 'Revoke' : 'Grant'} Super Admin
            </AlertDialogTitle>
            <AlertDialogDescription>
              {superAdminConfirm?.isSuperAdmin ? (
                <>
                  Are you sure you want to <strong>revoke</strong> Super Admin status from{' '}
                  <strong>{superAdminConfirm?.userName}</strong>? They will no longer be able to 
                  assign or remove Admin roles.
                </>
              ) : (
                <>
                  Are you sure you want to <strong>grant</strong> Super Admin status to{' '}
                  <strong>{superAdminConfirm?.userName}</strong>? They will be able to assign and 
                  remove Admin roles for all users.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuperAdminToggle}
              className={cn(
                superAdminConfirm?.isSuperAdmin 
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
              )}
            >
              {superAdminConfirm?.isSuperAdmin ? 'Revoke Access' : 'Grant Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
