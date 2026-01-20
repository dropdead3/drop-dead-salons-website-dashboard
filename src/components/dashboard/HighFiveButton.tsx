import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighFiveUser {
  id: string;
  user_id: string;
  user_name?: string;
  user_photo?: string | null;
}

interface HighFiveButtonProps {
  count: number;
  hasHighFived: boolean;
  users: HighFiveUser[];
  onToggle: () => void;
  disabled?: boolean;
}

export function HighFiveButton({
  count,
  hasHighFived,
  users,
  onToggle,
  disabled = false,
}: HighFiveButtonProps) {
  return (
    <div className="flex items-center gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              disabled={disabled}
              className={cn(
                'h-8 px-2 gap-1.5 font-sans text-xs transition-colors',
                hasHighFived
                  ? 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Hand
                className={cn(
                  'w-4 h-4 transition-transform',
                  hasHighFived && 'scale-110'
                )}
                style={{
                  transform: hasHighFived ? 'rotate(-15deg)' : 'none',
                }}
              />
              {count > 0 && <span>{count}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{hasHighFived ? 'Remove high five' : 'Give a high five!'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {count > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex -space-x-1.5 hover:opacity-80 transition-opacity">
              {users.slice(0, 3).map((user) => (
                <Avatar key={user.id} className="h-5 w-5 border-2 border-background">
                  <AvatarImage src={user.user_photo || undefined} alt={user.user_name} />
                  <AvatarFallback className="text-[8px] bg-amber-100 text-amber-700">
                    {user.user_name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {count > 3 && (
                <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-[8px] font-medium">+{count - 3}</span>
                </div>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              High Fives ({count})
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-2 px-1 py-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={user.user_photo || undefined} alt={user.user_name} />
                    <AvatarFallback className="text-[8px] bg-amber-100 text-amber-700">
                      {user.user_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-sans truncate">{user.user_name}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
