import { cn } from '@/lib/utils';

interface NavBadgeProps {
  count: number;
  isActive?: boolean;
  className?: string;
}

export function NavBadge({ count, isActive = false, className }: NavBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className={cn(
      "inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-medium rounded-md border shadow-sm",
      isActive
        ? "bg-destructive text-destructive-foreground border-destructive"
        : "bg-red-950/60 text-red-300 border-red-500/40 shadow-[0_0_8px_rgba(220,38,38,0.15)]",
      className
    )}>
      {count > 9 ? '9+' : count}
    </span>
  );
}
