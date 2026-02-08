import { useState } from 'react';
import { Users, Crown, Shield, UserMinus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { useChannelMembers } from '@/hooks/team-chat/useChannelMembers';
import { useTeamMembers } from '@/hooks/team-chat/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Loader2, MoreHorizontal, UserPlus } from 'lucide-react';

interface ChannelMembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelMembersSheet({ open, onOpenChange }: ChannelMembersSheetProps) {
  const { user } = useAuth();
  const { activeChannel } = useTeamChatContext();
  const { members, isLoading, addMember, removeMember, updateRole, isAdmin } = useChannelMembers(activeChannel?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const { members: teamMembers } = useTeamMembers(searchQuery);

  // Filter out existing members
  const availableMembers = teamMembers.filter(
    (tm) => !members.some((m) => m.userId === tm.userId)
  );

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="h-3 w-3 text-yellow-500" />;
    if (role === 'admin') return <Shield className="h-3 w-3 text-blue-500" />;
    return null;
  };

  if (!activeChannel) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Channel Members ({members.length})
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddMember(!showAddMember)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          )}

          {showAddMember && (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {availableMembers.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableMembers.slice(0, 5).map((member) => {
                    const name = member.displayName || member.fullName || 'Unknown';
                    return (
                      <button
                        key={member.userId}
                        onClick={() => {
                          addMember({ userId: member.userId });
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.photoUrl || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1">
                {members.map((member) => {
                  const name = member.profile.displayName || member.profile.fullName || 'Unknown';
                  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  const isMe = member.userId === user?.id;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.profile.photoUrl || undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{name}</span>
                          {getRoleIcon(member.role)}
                          {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                      </div>

                      {isAdmin && !isMe && member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role !== 'admin' && (
                              <DropdownMenuItem onClick={() => updateRole({ userId: member.userId, role: 'admin' })}>
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {member.role === 'admin' && (
                              <DropdownMenuItem onClick={() => updateRole({ userId: member.userId, role: 'member' })}>
                                Remove Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => removeMember(member.userId)}
                              className="text-destructive"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from channel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
