import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SortableSidebarSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  children: React.ReactNode;
  isDragEnabled?: boolean;
}

export function SortableSidebarSection({
  id,
  title,
  icon,
  isOpen,
  onToggle,
  onAddClick,
  showAddButton,
  children,
  isDragEnabled = true,
}: SortableSidebarSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50 z-50')}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <div className="group flex items-center justify-between px-2">
          <div className="flex items-center gap-1">
            {isDragEnabled && (
              <button
                {...attributes}
                {...listeners}
                className="p-0.5 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity touch-none"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {icon}
              {title}
            </CollapsibleTrigger>
          </div>
          {showAddButton && onAddClick && (
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onAddClick}>
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        <CollapsibleContent className="mt-1 space-y-0.5">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
