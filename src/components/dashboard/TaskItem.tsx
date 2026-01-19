import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Task } from '@/hooks/useTasks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

const priorityIndicator = {
  low: 'bg-muted-foreground',
  normal: 'bg-blue-500',
  high: 'bg-orange-500',
};

export function TaskItem({ task, onToggle, onDelete, isReadOnly = false }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "flex items-start gap-3 group",
        isReadOnly && "opacity-75"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Checkbox
              checked={task.is_completed}
              onCheckedChange={(checked) => !isReadOnly && onToggle(task.id, checked as boolean)}
              className={cn("mt-0.5", isReadOnly && "cursor-not-allowed")}
              disabled={isReadOnly}
            />
          </div>
        </TooltipTrigger>
        {isReadOnly && (
          <TooltipContent side="top" className="text-xs">
            View-only mode
          </TooltipContent>
        )}
      </Tooltip>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={cn('w-1.5 h-1.5 rounded-full', priorityIndicator[task.priority])} />
          <span
            className={cn(
              'text-sm font-sans truncate',
              task.is_completed && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </span>
          {isReadOnly && (
            <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
        </div>
        {task.due_date && (
          <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">
            Due {format(new Date(task.due_date), 'MMM d')}
          </p>
        )}
      </div>
      {isHovered && !isReadOnly && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
