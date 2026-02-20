import { useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUserStatus } from '@/hooks/team-chat/useUserStatus';
import type { Database } from '@/integrations/supabase/types';

type UserStatusType = Database['public']['Enums']['chat_user_status_type'];

const STATUS_OPTIONS: { value: UserStatusType; label: string; color: string; emoji: string }[] = [
  { value: 'available', label: 'Available', color: 'bg-emerald-500', emoji: '🟢' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500', emoji: '🟡' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500', emoji: '🔴' },
  { value: 'dnd', label: 'Do Not Disturb', color: 'bg-red-600', emoji: '⛔' },
];

interface UserStatusPickerProps {
  trigger: React.ReactNode;
}

export function UserStatusPicker({ trigger }: UserStatusPickerProps) {
  const { myStatus, updateStatus, isUpdating } = useUserStatus();
  const [statusMessage, setStatusMessage] = useState(myStatus?.status_message || '');
  const [open, setOpen] = useState(false);

  const currentStatus = myStatus?.status || 'available';
  const currentOption = STATUS_OPTIONS.find((s) => s.value === currentStatus) || STATUS_OPTIONS[0];

  const handleStatusChange = (status: UserStatusType) => {
    updateStatus({ status, statusMessage: statusMessage || undefined });
  };

  const handleMessageSave = () => {
    updateStatus({ status: currentStatus, statusMessage: statusMessage || undefined });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Set your status</div>
          
          <div className="space-y-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={isUpdating}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
                  'hover:bg-accent transition-colors',
                  currentStatus === option.value && 'bg-accent'
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', option.color)} />
                <span className="flex-1 text-left">{option.label}</span>
                {currentStatus === option.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground mb-2">Status message</div>
            <div className="flex gap-2">
              <Input
                placeholder="What's your status?"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                className="text-sm"
              />
              <Button size={tokens.button.inline} onClick={handleMessageSave} disabled={isUpdating}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function StatusDot({ status, className }: { status: UserStatusType | 'offline'; className?: string }) {
  const colorMap: Record<string, string> = {
    available: 'bg-emerald-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    dnd: 'bg-red-600',
    offline: 'bg-gray-400',
  };

  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
        colorMap[status] || colorMap.offline,
        className
      )}
    />
  );
}
