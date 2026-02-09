import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X } from 'lucide-react';
import { getRoleIconComponent } from '@/components/dashboard/RoleIconPicker';
import { getRoleColorClasses } from '@/components/dashboard/RoleColorPicker';
import {
  useResponsibilities,
  useUserResponsibilities,
  useAssignResponsibility,
  useRemoveResponsibility,
} from '@/hooks/useResponsibilities';
import { cn } from '@/lib/utils';

interface AssignResponsibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function AssignResponsibilityDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: AssignResponsibilityDialogProps) {
  const { data: allResponsibilities = [], isLoading: loadingAll } = useResponsibilities();
  const { data: userResponsibilities = [], isLoading: loadingUser } = useUserResponsibilities(userId);
  const assignMutation = useAssignResponsibility();
  const removeMutation = useRemoveResponsibility();

  const assignedIds = new Set(userResponsibilities.map(ur => ur.responsibility_id));

  const handleToggle = (responsibilityId: string) => {
    if (assignedIds.has(responsibilityId)) {
      removeMutation.mutate({ userId, responsibilityId });
    } else {
      assignMutation.mutate({ userId, responsibilityId });
    }
  };

  const isLoading = loadingAll || loadingUser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Responsibilities</DialogTitle>
          <DialogDescription>
            Assign or remove responsibilities for {userName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allResponsibilities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No responsibilities defined yet. Create some in Role Config → Responsibilities.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allResponsibilities.map(r => {
              const Icon = getRoleIconComponent(r.icon);
              const colorClasses = getRoleColorClasses(r.color);
              const isAssigned = assignedIds.has(r.id);
              const isPending = assignMutation.isPending || removeMutation.isPending;

              return (
                <button
                  key={r.id}
                  onClick={() => handleToggle(r.id)}
                  disabled={isPending}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                    isAssigned
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                  )}
                >
                  <div className={cn('flex items-center justify-center w-8 h-8 rounded-md', colorClasses.bg)}>
                    <Icon className={cn('h-4 w-4', colorClasses.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.display_name}</p>
                    {r.description && (
                      <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                    )}
                  </div>
                  {isAssigned ? (
                    <Badge variant="outline" className="text-xs gap-1 text-destructive border-destructive/30">
                      <X className="h-3 w-3" /> Remove
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/30">
                      <Plus className="h-3 w-3" /> Assign
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
