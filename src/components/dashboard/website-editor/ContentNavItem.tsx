import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentNavItemProps {
  label: string;
  description?: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: () => void;
}

export function ContentNavItem({
  label,
  description,
  icon: Icon,
  isActive,
  onSelect,
}: ContentNavItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-all text-left',
        isActive
          ? 'bg-primary/10 border border-primary/20 shadow-sm'
          : 'hover:bg-muted/60 border border-transparent'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 p-1.5 rounded-md',
        isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-sm font-medium truncate block',
          isActive && 'text-primary'
        )}>
          {label}
        </span>
        {description && (
          <p className="text-[10px] text-muted-foreground truncate hidden xl:block">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}
