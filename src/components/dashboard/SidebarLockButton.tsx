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
        "flex items-center gap-3 text-sm font-sans cursor-pointer",
        "transition-all duration-200 ease-out rounded-lg",
        isCollapsed 
          ? "px-2 py-2.5 justify-center mx-2" 
          : "px-3 py-2.5 mx-3",
        "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      <Lock className="w-4 h-4 shrink-0" />
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
