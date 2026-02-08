import { useState, useMemo, useEffect } from 'react';
import { Hash, MapPin, Lock, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TeamMemberChatAccess, OrgChannel } from '@/hooks/team-chat/useTeamChatAccess';

interface ManageChannelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMemberChatAccess;
  orgChannels: OrgChannel[];
  onSave: (channelsToAdd: string[], channelsToRemove: string[]) => void;
}

function getChannelIcon(type: OrgChannel['type'], isSystem: boolean) {
  if (type === 'location') return MapPin;
  if (type === 'private') return Lock;
  if (isSystem) return Globe;
  return Hash;
}

export function ManageChannelsDialog({
  open,
  onOpenChange,
  member,
  orgChannels,
  onSave,
}: ManageChannelsDialogProps) {
  const displayName = member.displayName || member.fullName || member.email || 'Unknown';
  
  // Current channel IDs the member is in
  const currentChannelIds = useMemo(
    () => new Set(member.channels.map(c => c.id)),
    [member.channels]
  );

  // Track selected channels (initialize with current memberships)
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set(currentChannelIds));

  // Reset when member changes
  useEffect(() => {
    setSelectedChannels(new Set(currentChannelIds));
  }, [currentChannelIds]);

  // Group channels by type
  const groupedChannels = useMemo(() => {
    const groups: Record<string, OrgChannel[]> = {
      system: [],
      location: [],
      custom: [],
    };

    orgChannels.forEach(channel => {
      if (channel.isSystem) {
        groups.system.push(channel);
      } else if (channel.type === 'location') {
        groups.location.push(channel);
      } else {
        groups.custom.push(channel);
      }
    });

    return groups;
  }, [orgChannels]);

  const handleToggleChannel = (channelId: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const handleSave = () => {
    const channelsToAdd: string[] = [];
    const channelsToRemove: string[] = [];

    // Find channels to add
    selectedChannels.forEach(id => {
      if (!currentChannelIds.has(id)) {
        channelsToAdd.push(id);
      }
    });

    // Find channels to remove
    currentChannelIds.forEach(id => {
      if (!selectedChannels.has(id)) {
        channelsToRemove.push(id);
      }
    });

    onSave(channelsToAdd, channelsToRemove);
  };

  const hasChanges = useMemo(() => {
    if (selectedChannels.size !== currentChannelIds.size) return true;
    for (const id of selectedChannels) {
      if (!currentChannelIds.has(id)) return true;
    }
    return false;
  }, [selectedChannels, currentChannelIds]);

  const renderChannelGroup = (title: string, channels: OrgChannel[]) => {
    if (channels.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="space-y-1">
          {channels.map(channel => {
            const Icon = getChannelIcon(channel.type, channel.isSystem);
            const isChecked = selectedChannels.has(channel.id);

            return (
              <div
                key={channel.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={`channel-${channel.id}`}
                  checked={isChecked}
                  onCheckedChange={() => handleToggleChannel(channel.id)}
                />
                <Label
                  htmlFor={`channel-${channel.id}`}
                  className="flex-1 flex items-center gap-2 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">#{channel.name}</span>
                  {channel.description && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {channel.description}
                    </span>
                  )}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Channel Access</DialogTitle>
          <DialogDescription>{displayName}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            {renderChannelGroup('System Channels', groupedChannels.system)}
            {renderChannelGroup('Location Channels', groupedChannels.location)}
            {renderChannelGroup('Custom Channels', groupedChannels.custom)}

            {orgChannels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No channels available
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
