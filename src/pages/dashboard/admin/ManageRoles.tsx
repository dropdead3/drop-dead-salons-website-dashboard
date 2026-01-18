import { useState } from 'react';
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
import { Loader2, Search, User, Shield, Crown, AlertTriangle, Lock, ArrowRight } from 'lucide-react';
import { useAllUsersWithRoles, useToggleUserRole, ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/hooks/useUserRoles';
import { useCanApproveAdmin, useAccountApprovals, useToggleSuperAdmin } from '@/hooks/useAccountApproval';
import { RoleHistoryPanel } from '@/components/dashboard/RoleHistoryPanel';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  stylist: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  receptionist: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  assistant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
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

  const handleToggleRole = (userId: string, role: AppRole, hasRole: boolean) => {
    toggleRole.mutate({ userId, role, hasRole });
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
            Manage Roles
          </h1>
          <p className="text-muted-foreground">
            Assign and manage user roles across your team.
          </p>
        </div>

        {/* Admin Role Warning */}
        {!canApproveAdmin && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Limited Permissions:</strong> Only Full Access Admins can assign or remove the Admin role. 
              Contact your account owner to request Full Access Admin status.
            </AlertDescription>
          </Alert>
        )}

        {/* Role Legend */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Full Access Admin - Special status */}
              <div className="flex items-start gap-2">
                <Badge className="bg-gradient-to-r from-amber-200 via-orange-100 to-amber-200 text-amber-900 border-amber-300 text-xs shrink-0 gap-1">
                  <Crown className="w-3 h-3" />
                  Full Access Admin
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Super user with ability to approve admin roles
                </span>
              </div>
              {ALL_ROLES.map(role => (
                <div key={role} className="flex items-start gap-2">
                  <Badge variant="outline" className={cn("text-xs shrink-0", roleColors[role])}>
                    {ROLE_LABELS[role]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role]}
                    {role === 'admin' && !canApproveAdmin && (
                      <span className="text-amber-600 dark:text-amber-400 ml-1">(Full Access Admin required)</span>
                    )}
                  </span>
                </div>
              ))}
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
          <Button asChild variant="outline" className="gap-2">
            <Link to="/dashboard/admin/approvals">
              Account Approvals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
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
                                  Full Access Admin
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
                            {user.roles.map(role => (
                              <Badge 
                                key={role} 
                                variant="outline" 
                                className={cn("text-xs", roleColors[role])}
                              >
                                {ROLE_LABELS[role]}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Toggles */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-x-8 gap-y-3">
                      {/* Full Access Admin Toggle - Only visible to super admins */}
                      {canApproveAdmin && (
                        <div className="flex items-center gap-2">
                          <label 
                            htmlFor={`${user.user_id}-super-admin`}
                            className="text-sm font-medium cursor-pointer flex items-center gap-1"
                          >
                            <Crown className="w-3 h-3 text-amber-600" />
                            Full Access Admin
                          </label>
                          <Switch
                            id={`${user.user_id}-super-admin`}
                            checked={isSuperAdmin || false}
                            onCheckedChange={() => handleToggleSuperAdmin(user.user_id, user.display_name || user.full_name, isSuperAdmin || false)}
                            disabled={toggleSuperAdmin.isPending}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-400 data-[state=checked]:to-orange-400"
                          />
                        </div>
                      )}
                      
                      {/* Regular Role Toggles */}
                      {ALL_ROLES.map(role => {
                        const hasRole = user.roles.includes(role);
                        const isAdminRole = role === 'admin';
                        const isLocked = isAdminRole && !canApproveAdmin;
                        
                        return (
                          <div key={role} className="flex items-center gap-2">
                            <label 
                              htmlFor={`${user.user_id}-${role}`}
                              className={cn(
                                "text-sm font-medium",
                                isLocked ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"
                              )}
                            >
                              {ROLE_LABELS[role]}
                            </label>
                            {isLocked && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="w-3 h-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>Full Access Admin required</TooltipContent>
                              </Tooltip>
                            )}
                            <Switch
                              id={`${user.user_id}-${role}`}
                              checked={hasRole}
                              onCheckedChange={() => handleToggleRole(user.user_id, role, hasRole)}
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
      </div>

      {/* Full Access Admin Confirmation Dialog */}
      <AlertDialog open={!!superAdminConfirm} onOpenChange={() => setSuperAdminConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              {superAdminConfirm?.isSuperAdmin ? 'Revoke' : 'Grant'} Full Access Admin
            </AlertDialogTitle>
            <AlertDialogDescription>
              {superAdminConfirm?.isSuperAdmin ? (
                <>
                  Are you sure you want to <strong>revoke</strong> Full Access Admin status from{' '}
                  <strong>{superAdminConfirm?.userName}</strong>? They will no longer be able to 
                  assign or remove Admin roles.
                </>
              ) : (
                <>
                  Are you sure you want to <strong>grant</strong> Full Access Admin status to{' '}
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
