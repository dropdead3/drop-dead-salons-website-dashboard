import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { TeamChatSettings, TeamChatSettingsUpdate } from '@/hooks/team-chat/useTeamChatSettings';

interface DisplaySettingsTabProps {
  settings: TeamChatSettings;
  onUpdate: (updates: TeamChatSettingsUpdate) => void;
}

const NAME_FORMAT_OPTIONS = [
  { value: 'full_name', label: 'Full name (e.g., John Smith)' },
  { value: 'display_name', label: 'Display name (if set, otherwise full name)' },
  { value: 'first_name', label: 'First name only (e.g., John)' },
];

export function DisplaySettingsTab({ settings, onUpdate }: DisplaySettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Name Display</h3>
        <div className="space-y-2">
          <Label>Display name format</Label>
          <Select
            value={settings.display_name_format}
            onValueChange={(value) =>
              onUpdate({ display_name_format: value as TeamChatSettings['display_name_format'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NAME_FORMAT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Profile Display</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show profile photos</Label>
              <p className="text-sm text-muted-foreground">
                Display user avatars next to messages
              </p>
            </div>
            <Switch
              checked={settings.show_profile_photos}
              onCheckedChange={(checked) => onUpdate({ show_profile_photos: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show role badges</Label>
              <p className="text-sm text-muted-foreground">
                Display role badges (Admin, Manager, etc.) next to names
              </p>
            </div>
            <Switch
              checked={settings.show_role_badges}
              onCheckedChange={(checked) => onUpdate({ show_role_badges: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show job title</Label>
              <p className="text-sm text-muted-foreground">
                Display job titles under names in messages
              </p>
            </div>
            <Switch
              checked={settings.show_job_title}
              onCheckedChange={(checked) => onUpdate({ show_job_title: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show location badge</Label>
              <p className="text-sm text-muted-foreground">
                Display the user's primary location next to their name
              </p>
            </div>
            <Switch
              checked={settings.show_location_badge}
              onCheckedChange={(checked) => onUpdate({ show_location_badge: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
