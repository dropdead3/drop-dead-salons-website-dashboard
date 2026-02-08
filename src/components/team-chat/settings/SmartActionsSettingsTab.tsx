import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { TeamChatSettings, TeamChatSettingsUpdate } from '@/hooks/team-chat/useTeamChatSettings';
import { Sparkles, Clock, Shield } from 'lucide-react';

interface SmartActionsSettingsTabProps {
  settings: TeamChatSettings;
  onUpdate: (updates: TeamChatSettingsUpdate) => void;
}

const ACTION_TYPES = [
  { value: 'client_handoff', label: 'Client Handoff', description: 'Detect requests to take over clients' },
  { value: 'assistant_request', label: 'Assistant Requests', description: 'Detect requests for service assistance' },
  { value: 'shift_cover', label: 'Shift Cover', description: 'Detect shift coverage requests' },
  { value: 'availability_check', label: 'Availability Checks', description: 'Detect availability inquiries' },
];

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '4', label: '4 hours' },
  { value: '8', label: '8 hours' },
  { value: '24', label: '24 hours' },
];

export function SmartActionsSettingsTab({ settings, onUpdate }: SmartActionsSettingsTabProps) {
  const smartActionsEnabled = (settings as any).smart_actions_enabled ?? true;
  const smartActionTypes = (settings as any).smart_action_types ?? ['client_handoff', 'assistant_request', 'shift_cover', 'availability_check'];
  const smartActionExpiryHours = (settings as any).smart_action_expiry_hours ?? 4;
  const smartActionRequireApproval = (settings as any).smart_action_require_approval ?? false;

  const handleActionTypeToggle = (actionType: string, checked: boolean) => {
    const newTypes = checked
      ? [...smartActionTypes, actionType]
      : smartActionTypes.filter((t: string) => t !== actionType);
    onUpdate({ smart_action_types: newTypes } as any);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">AI Smart Actions</h3>
          <p className="text-sm text-muted-foreground">
            Automatically detect actionable requests in chat messages and show one-click action toasts to recipients.
          </p>
        </div>
      </div>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable Smart Actions</Label>
          <p className="text-sm text-muted-foreground">
            Use AI to detect and suggest actions from chat messages
          </p>
        </div>
        <Switch
          checked={smartActionsEnabled}
          onCheckedChange={(checked) => onUpdate({ smart_actions_enabled: checked } as any)}
        />
      </div>

      {smartActionsEnabled && (
        <>
          {/* Action Types */}
          <div>
            <h3 className="text-sm font-medium mb-3">Detect These Action Types</h3>
            <div className="space-y-3">
              {ACTION_TYPES.map((type) => (
                <div key={type.value} className="flex items-start gap-3">
                  <Checkbox
                    id={type.value}
                    checked={smartActionTypes.includes(type.value)}
                    onCheckedChange={(checked) => handleActionTypeToggle(type.value, !!checked)}
                  />
                  <div className="grid gap-1">
                    <Label htmlFor={type.value} className="cursor-pointer">
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label>Action Expiry Time</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              How long action toasts remain active before auto-expiring
            </p>
            <Select
              value={String(smartActionExpiryHours)}
              onValueChange={(value) => onUpdate({ smart_action_expiry_hours: parseInt(value) } as any)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manager Approval */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <Label>Require Manager Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Actions require manager approval before taking effect
                </p>
              </div>
            </div>
            <Switch
              checked={smartActionRequireApproval}
              onCheckedChange={(checked) => onUpdate({ smart_action_require_approval: checked } as any)}
            />
          </div>
        </>
      )}
    </div>
  );
}
