import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquarePlus, Pencil, Trash2, Plus, GripVertical, Send } from 'lucide-react';
import { useWelcomeDMRules, WELCOME_TEMPLATE_VARIABLES } from '@/hooks/team-chat/useWelcomeDMRules';
import type { TeamChatSettings, TeamChatSettingsUpdate } from '@/hooks/team-chat/useTeamChatSettings';
import { WelcomeSenderDialog } from './WelcomeSenderDialog';
import type { WelcomeRule } from '@/hooks/team-chat/useWelcomeDMRules';
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

interface WelcomeDMsTabProps {
  settings: TeamChatSettings;
  onUpdate: (updates: TeamChatSettingsUpdate) => void;
}

export function WelcomeDMsTab({ settings, onUpdate }: WelcomeDMsTabProps) {
  const { rules, isLoading, deleteRule, isDeleting } = useWelcomeDMRules();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WelcomeRule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const welcomeEnabled = (settings as any).welcome_dms_enabled ?? false;

  const handleEdit = (rule: WelcomeRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRule(null);
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteRule(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const getRoleDisplay = (roles: string[] | null) => {
    if (!roles || roles.length === 0) return 'All roles';
    return roles.join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
        <MessageSquarePlus className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">Auto Welcome DMs</h3>
          <p className="text-sm text-muted-foreground">
            Automatically send personalized welcome messages to new team members from designated people.
          </p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable Welcome DMs</Label>
          <p className="text-sm text-muted-foreground">
            New members receive automatic DMs when their account is approved
          </p>
        </div>
        <Switch
          checked={welcomeEnabled}
          onCheckedChange={(checked) => onUpdate({ welcome_dms_enabled: checked } as any)}
        />
      </div>

      {welcomeEnabled && (
        <>
          {/* Welcome Senders List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium">Welcome Senders</h3>
                <p className="text-xs text-muted-foreground">
                  New members will receive DMs from these people
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add Sender
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : rules.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Send className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No welcome senders configured yet
                  </p>
                  <Button variant="link" size="sm" onClick={handleAdd}>
                    Add your first welcome sender
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="cursor-grab text-muted-foreground hover:text-foreground">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={rule.sender?.photo_url || undefined} />
                          <AvatarFallback>
                            {(rule.sender?.display_name || rule.sender?.full_name || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {rule.sender?.display_name || rule.sender?.full_name || 'Unknown'}
                            </span>
                            {!rule.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            "{rule.message_template}"
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {getRoleDisplay(rule.target_roles)}
                            </Badge>
                            {rule.delay_minutes > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {rule.delay_minutes < 60
                                  ? `${rule.delay_minutes}m delay`
                                  : `${Math.round(rule.delay_minutes / 60)}h delay`}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Template Variables Reference */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Available Variables</h4>
            <div className="flex flex-wrap gap-2">
              {WELCOME_TEMPLATE_VARIABLES.map((v) => (
                <Badge key={v.key} variant="secondary" className="font-mono text-xs">
                  {v.key}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use these in your message template to personalize the welcome message
            </p>
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <WelcomeSenderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editingRule={editingRule}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove welcome sender?</AlertDialogTitle>
            <AlertDialogDescription>
              This person will no longer send automatic welcome DMs to new team members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
