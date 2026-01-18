import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Task } from '@/hooks/useTasks';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

const priorityIndicator = {
  low: 'bg-muted-foreground',
  normal: 'bg-blue-500',
  high: 'bg-orange-500',
};

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-start gap-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Checkbox
        checked={task.is_completed}
        onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
        className="mt-0.5"
      />
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
        </div>
        {task.due_date && (
          <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">
            Due {format(new Date(task.due_date), 'MMM d')}
          </p>
        )}
      </div>
      {isHovered && (
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
