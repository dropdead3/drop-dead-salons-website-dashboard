import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SectionNavItemProps {
  id: string;
  label: string;
  description: string;
  order: number;
  enabled: boolean;
  isActive: boolean;
  onSelect: () => void;
  onToggle: (enabled: boolean) => void;
}

export function SectionNavItem({
  id,
  label,
  description,
  order,
  enabled,
  isActive,
  onSelect,
  onToggle,
}: SectionNavItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 px-2 py-2 mx-2 rounded-lg cursor-pointer transition-all',
        isActive
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted/60 border border-transparent',
        isDragging && 'opacity-50 shadow-lg z-50',
        !enabled && 'opacity-50'
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            isActive && 'text-primary'
          )}>
            {label}
          </span>
          <Badge 
            variant="outline" 
            className="text-[9px] px-1 py-0 h-4 opacity-60"
          >
            {order}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground truncate hidden xl:block">
          {description}
        </p>
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {enabled ? (
          <Eye className="h-3.5 w-3.5 text-primary/70" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="scale-75"
        />
      </div>
    </div>
  );
}
