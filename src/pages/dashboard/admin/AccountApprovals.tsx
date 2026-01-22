import { useState } from 'react';
import { GenerateTestAccountsButton } from '@/components/dashboard/GenerateTestAccountsButton';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  useAccountApprovals, 
  usePendingApprovals, 
  useApproveAccount, 
  useApproveAdminRole,
  useToggleSuperAdmin,
  useCanApproveAdmin 
} from '@/hooks/useAccountApproval';
import { useAllUsersWithRoles } from '@/hooks/useUserRoles';
import { format } from 'date-fns';
import { 
  Search, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  Crown,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountApprovals() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allAccounts, isLoading: loadingAll } = useAccountApprovals();
  const { data: pendingAccounts, isLoading: loadingPending } = usePendingApprovals();
  const { data: usersWithRoles } = useAllUsersWithRoles();
  const { data: canApproveAdmin } = useCanApproveAdmin();
  const approveAccount = useApproveAccount();
  const approveAdminRole = useApproveAdminRole();
  const toggleSuperAdmin = useToggleSuperAdmin();

  const getUserRoles = (userId: string) => {
    const user = usersWithRoles?.find(u => u.user_id === userId);
    return user?.roles || [];
  };

  const filteredAccounts = allAccounts?.filter(account => {
    const searchLower = searchQuery.toLowerCase();
    return (
      account.full_name?.toLowerCase().includes(searchLower) ||
      account.display_name?.toLowerCase().includes(searchLower) ||
      account.email?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = pendingAccounts?.length || 0;
  const approvedCount = allAccounts?.filter(a => a.is_approved).length || 0;
  const superAdminCount = allAccounts?.filter(a => a.is_super_admin).length || 0;

  const AccountCard = ({ account }: { account: typeof allAccounts extends (infer T)[] | undefined ? T : never }) => {
    const roles = getUserRoles(account.user_id);
    const hasAdminRole = roles.includes('admin');
    const needsAdminApproval = hasAdminRole && !account.admin_approved_by;

    return (
      <Card className={cn(
        "transition-all",
        !account.is_approved && "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
        needsAdminApproval && account.is_approved && "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={account.photo_url || undefined} />
              <AvatarFallback className="bg-muted text-lg">
                {account.full_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-medium truncate">
                  {account.display_name || account.full_name}
                </h3>
                {account.is_super_admin && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
                        <Crown className="w-3 h-3" />
                        Super Admin
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Can approve other admins
                    </TooltipContent>
                  </Tooltip>
                )}
                {account.is_approved ? (
                  <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Approved
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground truncate">{account.email}</p>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {roles.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>

              {needsAdminApproval && (
                <div className="flex items-center gap-1 mt-2 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Admin role needs approval from Super Admin</span>
                </div>
              )}

              {account.approved_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Approved {format(new Date(account.approved_at), 'MMM d, yyyy')}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 items-end">
              {/* Account Approval Toggle */}
              <div className="flex items-center gap-2">
                <Label htmlFor={`approve-${account.user_id}`} className="text-xs text-muted-foreground">
                  Approved
                </Label>
                <Switch
                  id={`approve-${account.user_id}`}
                  checked={account.is_approved}
                  onCheckedChange={(checked) => 
                    approveAccount.mutate({ userId: account.user_id, approve: checked })
                  }
                  disabled={approveAccount.isPending}
                />
              </div>

              {/* Admin Approval (only for users with admin role) */}
              {hasAdminRole && canApproveAdmin && (
                <div className="flex items-center gap-2">
                  <Label htmlFor={`admin-${account.user_id}`} className="text-xs text-muted-foreground">
                    Admin Approved
                  </Label>
                  <Switch
                    id={`admin-${account.user_id}`}
                    checked={!!account.admin_approved_by}
                    onCheckedChange={(checked) => 
                      approveAdminRole.mutate({ userId: account.user_id, approve: checked })
                    }
                    disabled={approveAdminRole.isPending}
                  />
                </div>
              )}

              {/* Super Admin Toggle (only visible to super admins) */}
              {canApproveAdmin && account.is_approved && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={account.is_super_admin ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "gap-1",
                        account.is_super_admin && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      )}
                    >
                      <Crown className="w-3 h-3" />
                      {account.is_super_admin ? 'Super Admin' : 'Grant Super Admin'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {account.is_super_admin ? 'Revoke Super Admin Status?' : 'Grant Super Admin Status?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {account.is_super_admin 
                          ? `${account.full_name} will no longer be able to approve other admin accounts.`
                          : `${account.full_name} will be able to approve other admin accounts and grant super admin status to others.`
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => toggleSuperAdmin.mutate({ 
                          userId: account.user_id, 
                          grant: !account.is_super_admin 
                        })}
                      >
                        {account.is_super_admin ? 'Revoke' : 'Grant'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display">Account Approvals</h1>
            <p className="text-muted-foreground">
              Manage account access and admin permissions
            </p>
          </div>
          <GenerateTestAccountsButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved Accounts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Crown className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{superAdminCount}</p>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Accounts</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              Pending
              {pendingCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {loadingAll ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAccounts?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No accounts found matching your search
                </CardContent>
              </Card>
            ) : (
              filteredAccounts?.map(account => (
                <AccountCard key={account.user_id} account={account} />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {loadingPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingAccounts?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className="text-muted-foreground">All accounts have been approved!</p>
                </CardContent>
              </Card>
            ) : (
              pendingAccounts?.map(account => (
                <AccountCard key={account.user_id} account={account} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permission Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Account Approval:</strong> Any admin can approve general account access.
            </p>
            <p>
              <strong className="text-foreground">Admin Role Approval:</strong> Only Super Admins can approve users for the Admin role.
            </p>
            <p>
              <strong className="text-foreground">Super Admin:</strong> Can approve admin roles and grant Super Admin status to others.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
