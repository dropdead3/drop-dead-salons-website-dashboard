import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Eye, User } from 'lucide-react';
import { ROLE_LABELS } from '@/hooks/useUserRoles';
import { useLeadershipMembers } from '@/hooks/team-chat/useLeadershipMembers';
import { useWelcomeDMRules, WELCOME_TEMPLATE_VARIABLES, replaceTemplateVariables } from '@/hooks/team-chat/useWelcomeDMRules';
import type { WelcomeRule } from '@/hooks/team-chat/useWelcomeDMRules';

interface WelcomeSenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule: WelcomeRule | null;
}

const ROLE_OPTIONS = [
  { value: 'stylist', label: 'Stylist' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

const DELAY_OPTIONS = [
  { value: 0, label: 'Immediately' },
  { value: 60, label: '1 hour' },
  { value: 240, label: '4 hours' },
  { value: 1440, label: '24 hours' },
];

const DEFAULT_MESSAGE = "Welcome to the team, [new_member_name]! 👋 My name is [sender_name], and I'm here to help you get started. Feel free to message me anytime with questions!";

export function WelcomeSenderDialog({ open, onOpenChange, editingRule }: WelcomeSenderDialogProps) {
  const { members, isLoading: loadingMembers } = useLeadershipMembers();
  const { rules, addRule, updateRule, isAdding, isUpdating } = useWelcomeDMRules();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_MESSAGE);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Filter out already configured senders (unless editing that sender)
  const configuredSenderIds = rules.map(r => r.sender_user_id);
  const availableMembers = members.filter(m => 
    !configuredSenderIds.includes(m.user_id) || editingRule?.sender_user_id === m.user_id
  );

  const filteredMembers = availableMembers.filter(m =>
    m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  // Reset form when dialog opens/closes or editing rule changes
  useEffect(() => {
    if (open) {
      if (editingRule) {
        setSelectedUserId(editingRule.sender_user_id);
        setMessageTemplate(editingRule.message_template);
        setTargetRoles(editingRule.target_roles || []);
        setDelayMinutes(editingRule.delay_minutes);
        setIsActive(editingRule.is_active);
      } else {
        setSelectedUserId(null);
        setMessageTemplate(DEFAULT_MESSAGE);
        setTargetRoles([]);
        setDelayMinutes(0);
        setIsActive(true);
      }
      setSearchQuery('');
      setShowPreview(false);
    }
  }, [open, editingRule]);

  const selectedMember = members.find(m => m.user_id === selectedUserId);

  const handleRoleToggle = (role: string, checked: boolean) => {
    setTargetRoles(prev =>
      checked ? [...prev, role] : prev.filter(r => r !== role)
    );
  };

  const insertVariable = (variable: string) => {
    setMessageTemplate(prev => prev + variable);
  };

  const handleSubmit = () => {
    if (!selectedUserId || !messageTemplate.trim()) return;

    const input = {
      sender_user_id: selectedUserId,
      message_template: messageTemplate.trim(),
      target_roles: targetRoles.length > 0 ? targetRoles : null,
      delay_minutes: delayMinutes,
      is_active: isActive,
    };

    if (editingRule) {
      updateRule({ id: editingRule.id, updates: input });
    } else {
      addRule(input);
    }

    onOpenChange(false);
  };

  const previewMessage = replaceTemplateVariables(messageTemplate, {
    new_member_name: 'Jordan Smith',
    sender_name: selectedMember?.display_name?.split(' ')[0] || 'Sender',
    role: 'Stylist',
    location_name: 'Downtown Salon',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? 'Edit Welcome Sender' : 'Add Welcome Sender'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-2">
            {/* Sender Selection */}
            {!editingRule && (
              <div className="space-y-3">
                <Label>Select Sender</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {loadingMembers ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchQuery ? 'No matching members' : 'No available senders'}
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <button
                        key={member.user_id}
                        type="button"
                        onClick={() => setSelectedUserId(member.user_id)}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors ${
                          selectedUserId === member.user_id ? 'bg-primary/10' : ''
                        } ${member.isCurrentUser ? 'border-l-2 border-primary' : ''}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.photo_url || undefined} />
                          <AvatarFallback>{member.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-1.5">
                            {member.display_name}
                            {member.isCurrentUser && (
                              <span className="text-xs text-muted-foreground">(You)</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] || member.role}
                        </span>
                        {selectedUserId === member.user_id && (
                          <Badge variant="secondary" className="text-xs">Selected</Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Selected Sender Display (when editing) */}
            {editingRule && selectedMember && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedMember.photo_url || undefined} />
                  <AvatarFallback>{selectedMember.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedMember.display_name}</div>
                  <div className="text-sm text-muted-foreground capitalize">{selectedMember.role}</div>
                </div>
              </div>
            )}

            {/* Message Template */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Message Template</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
              
              {showPreview ? (
                <div className="p-3 bg-muted rounded-md text-sm">
                  {previewMessage}
                </div>
              ) : (
                <>
                  <Textarea
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    placeholder="Write your welcome message..."
                    rows={4}
                  />
                  <div className="flex flex-wrap gap-1">
                    {WELCOME_TEMPLATE_VARIABLES.map((v) => (
                      <Button
                        key={v.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs font-mono"
                        onClick={() => insertVariable(v.key)}
                      >
                        {v.key}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Target Roles */}
            <div className="space-y-2">
              <Label>Send to (leave empty for all roles)</Label>
              <div className="flex flex-wrap gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <div key={role.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={targetRoles.includes(role.value)}
                      onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}
                    />
                    <Label htmlFor={`role-${role.value}`} className="text-sm font-normal cursor-pointer">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Delay */}
            <div className="space-y-2">
              <Label>Send Delay</Label>
              <div className="flex flex-wrap gap-2">
                {DELAY_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={delayMinutes === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDelayMinutes(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Disable to pause this welcome message
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId || !messageTemplate.trim() || isAdding || isUpdating}
          >
            {editingRule ? 'Save Changes' : 'Add Sender'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
