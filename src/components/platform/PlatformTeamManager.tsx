import { useState } from 'react';
import { usePlatformTeam, useRemovePlatformRole, type PlatformRole } from '@/hooks/usePlatformRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { 
  Crown, 
  Shield, 
  Headphones, 
  Code, 
  MoreHorizontal, 
  Trash2,
  UserPlus,
  Loader2
} from 'lucide-react';
import { InvitePlatformUserDialog } from './InvitePlatformUserDialog';

const roleConfig: Record<PlatformRole, { label: string; icon: React.ElementType; color: string }> = {
  platform_owner: { label: 'Owner', icon: Crown, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  platform_admin: { label: 'Admin', icon: Shield, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  platform_support: { label: 'Support', icon: Headphones, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  platform_developer: { label: 'Developer', icon: Code, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

export function PlatformTeamManager() {
  const { user, hasPlatformRole } = useAuth();
  const { data: team, isLoading } = usePlatformTeam();
  const removeMutation = useRemovePlatformRole();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; role: PlatformRole; name: string } | null>(null);

  const canManageTeam = hasPlatformRole('platform_owner') || hasPlatformRole('platform_admin');

  const handleRemoveMember = async () => {
    if (!deleteConfirm) return;

    try {
      await removeMutation.mutateAsync({
        userId: deleteConfirm.userId,
        role: deleteConfirm.role,
      });
      toast({
        title: 'Member removed',
        description: `${deleteConfirm.name} has been removed from the platform team.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove team member.',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Platform Team</CardTitle>
            <CardDescription>
              Manage access for your development and support team
            </CardDescription>
          </div>
          {canManageTeam && (
            <Button onClick={() => setInviteOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Team Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {team && team.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  {canManageTeam && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((member) => {
                  const config = roleConfig[member.role];
                  const Icon = config.icon;
                  const isCurrentUser = member.user_id === user?.id;

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {getInitials(member.full_name, member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {member.full_name || 'Unknown'}
                              {isCurrentUser && (
                                <span className="text-muted-foreground ml-1">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${config.color}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(member.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      {canManageTeam && (
                        <TableCell>
                          {!isCurrentUser && member.role !== 'platform_owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteConfirm({
                                    userId: member.user_id,
                                    role: member.role,
                                    name: member.full_name || member.email || 'this member',
                                  })}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No platform team members yet.</p>
              {canManageTeam && (
                <Button
                  variant="link"
                  onClick={() => setInviteOpen(true)}
                  className="mt-2"
                >
                  Add your first team member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <InvitePlatformUserDialog 
        open={inviteOpen} 
        onOpenChange={setInviteOpen} 
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke platform access for {deleteConfirm?.name}. They will no longer be able to access the Platform Admin Hub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
