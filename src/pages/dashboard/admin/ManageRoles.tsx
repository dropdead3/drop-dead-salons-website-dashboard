import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, User, Shield } from 'lucide-react';
import { useAllUsersWithRoles, useToggleUserRole, ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/hooks/useUserRoles';
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
  const { data: users = [], isLoading } = useAllUsersWithRoles();
  const toggleRole = useToggleUserRole();

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const handleToggleRole = (userId: string, role: AppRole, hasRole: boolean) => {
    toggleRole.mutate({ userId, role, hasRole });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-medium mb-2 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Manage Roles
          </h1>
          <p className="text-muted-foreground">
            Assign and manage user roles across your team.
          </p>
        </div>

        {/* Role Legend */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_ROLES.map(role => (
                <div key={role} className="flex items-start gap-2">
                  <Badge variant="outline" className={cn("text-xs shrink-0", roleColors[role])}>
                    {ROLE_LABELS[role]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
            {filteredUsers.map(user => (
              <Card key={user.user_id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.photo_url || undefined} alt={user.full_name} />
                      <AvatarFallback className="bg-muted">
                        {user.full_name?.charAt(0) || <User className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">
                        {user.display_name || user.full_name}
                      </h3>
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
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {ALL_ROLES.map(role => {
                      const hasRole = user.roles.includes(role);
                      return (
                        <div key={role} className="flex items-center justify-between gap-2">
                          <label 
                            htmlFor={`${user.user_id}-${role}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {ROLE_LABELS[role]}
                          </label>
                          <Switch
                            id={`${user.user_id}-${role}`}
                            checked={hasRole}
                            onCheckedChange={() => handleToggleRole(user.user_id, role, hasRole)}
                            disabled={toggleRole.isPending}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
