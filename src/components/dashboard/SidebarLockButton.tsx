import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboardLock } from '@/contexts/DashboardLockContext';
import { useUserPinStatus } from '@/hooks/useUserPin';
import { cn } from '@/lib/utils';

interface SidebarLockButtonProps {
  isCollapsed?: boolean;
}

export function SidebarLockButton({ isCollapsed = false }: SidebarLockButtonProps) {
  const { lock } = useDashboardLock();
  const { data: pinStatus } = useUserPinStatus();

  // Always show lock button - anyone can lock for shared device security

  const handleLock = () => {
    lock();
  };

  const buttonContent = (
    <button
      onClick={handleLock}
      className={cn(
        "flex items-center gap-3 text-sm font-sans cursor-pointer w-full",
        "transition-all duration-200 ease-out rounded-md group",
        isCollapsed 
          ? "px-2 py-2 justify-center" 
          : "px-2.5 py-2",
        "text-muted-foreground hover:text-foreground hover:bg-background/80"
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-md transition-colors",
        "bg-muted/50 group-hover:bg-primary/10",
        "p-1.5"
      )}>
        <Lock className="w-3.5 h-3.5 shrink-0" />
      </div>
      {!isCollapsed && <span className="flex-1 text-left">Lock Dashboard</span>}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-sans">
          Lock Dashboard
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
}
