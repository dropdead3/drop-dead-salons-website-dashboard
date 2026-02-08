import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useChatChannels } from '@/hooks/team-chat/useChatChannels';
import type { TeamChatSettings, TeamChatSettingsUpdate } from '@/hooks/team-chat/useTeamChatSettings';

interface ChannelPermissionsTabProps {
  settings: TeamChatSettings;
  onUpdate: (updates: TeamChatSettingsUpdate) => void;
}

const PERMISSION_OPTIONS = [
  { value: 'super_admin', label: 'Super Admins only' },
  { value: 'admin', label: 'Admins and above' },
  { value: 'manager', label: 'Managers and above' },
  { value: 'anyone', label: 'Anyone' },
];

const ARCHIVE_PERMISSION_OPTIONS = [
  { value: 'admin', label: 'Admins only' },
  { value: 'channel_owner', label: 'Channel owners' },
  { value: 'anyone', label: 'Anyone' },
];

export function ChannelPermissionsTab({ settings, onUpdate }: ChannelPermissionsTabProps) {
  const { channels } = useChatChannels();

  // Filter to only show public/system channels for default channel selection
  const selectableChannels = channels.filter(
    (c) => c.type === 'public' && !c.is_archived
  );

  const handleDefaultChannelToggle = (channelName: string, checked: boolean) => {
    const currentDefaults = settings.default_channels || [];
    const newDefaults = checked
      ? [...currentDefaults, channelName]
      : currentDefaults.filter((name) => name !== channelName);
    onUpdate({ default_channels: newDefaults });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Channel Creation</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Who can create public channels?</Label>
            <Select
              value={settings.channel_create_public}
              onValueChange={(value) =>
                onUpdate({ channel_create_public: value as TeamChatSettings['channel_create_public'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Who can create private channels?</Label>
            <Select
              value={settings.channel_create_private}
              onValueChange={(value) =>
                onUpdate({ channel_create_private: value as TeamChatSettings['channel_create_private'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Who can archive channels?</Label>
            <Select
              value={settings.channel_archive_permission}
              onValueChange={(value) =>
                onUpdate({ channel_archive_permission: value as TeamChatSettings['channel_archive_permission'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARCHIVE_PERMISSION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Default Channels for New Members</h3>
        <p className="text-sm text-muted-foreground mb-4">
          New team members will automatically join these channels
        </p>
        <div className="space-y-2">
          {selectableChannels.map((channel) => (
            <div key={channel.id} className="flex items-center space-x-2">
              <Checkbox
                id={`default-${channel.id}`}
                checked={settings.default_channels?.includes(channel.name) ?? false}
                onCheckedChange={(checked) =>
                  handleDefaultChannelToggle(channel.name, checked === true)
                }
              />
              <Label htmlFor={`default-${channel.id}`} className="font-normal cursor-pointer">
                #{channel.name}
              </Label>
            </div>
          ))}
          {selectableChannels.length === 0 && (
            <p className="text-sm text-muted-foreground">No public channels available</p>
          )}
        </div>
      </div>
    </div>
  );
}
