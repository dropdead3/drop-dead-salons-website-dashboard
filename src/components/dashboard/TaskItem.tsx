import { useState, useCallback } from 'react';
import { parseISO, startOfDay, differenceInCalendarDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Lock, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatDate } from '@/hooks/useFormatDate';
import type { Task } from '@/hooks/useTasks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  onView?: (task: Task) => void;
  isReadOnly?: boolean;
  isArchiveView?: boolean;
}

const priorityIndicator = {
  low: 'bg-muted-foreground',
  normal: 'bg-blue-500',
  high: 'bg-orange-500',
};

export function TaskItem({ task, onToggle, onDelete, onEdit, onView, isReadOnly = false, isArchiveView = false }: TaskItemProps) {
  const { formatDate } = useFormatDate();
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleToggle = useCallback((id: string, completed: boolean) => {
    if (completed && !task.is_completed) {
      setIsCompleting(true);
      setTimeout(() => {
        onToggle(id, completed);
      }, 400);
    } else {
      onToggle(id, completed);
    }
  }, [onToggle, task.is_completed]);

  const today = startOfDay(new Date());
  const dueLocal = task.due_date ? startOfDay(parseISO(task.due_date)) : null;
  const isOverdue = !!dueLocal && !task.is_completed && dueLocal < today;
  const daysOverdue = isOverdue ? differenceInCalendarDays(today, dueLocal!) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 1, height: 'auto' }}
      animate={isCompleting ? { opacity: 0, height: 0, marginBottom: 0 } : { opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          "flex items-start gap-3 group",
          isReadOnly && "opacity-75",
          isOverdue && !isArchiveView && "border-l-2 border-destructive pl-2",
          isArchiveView && "opacity-60"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={(checked) => !isReadOnly && handleToggle(task.id, checked as boolean)}
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
        <div
          className={cn("flex-1 min-w-0", onView && "cursor-pointer")}
          onClick={() => onView?.(task)}
        >
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
          {task.due_date && !isArchiveView && (() => {
            return (
              <p className={cn("text-xs mt-0.5 ml-3.5", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                {isOverdue ? `${daysOverdue}d overdue · ` : 'Due '}{formatDate(parseISO(task.due_date), 'MMM d')}
              </p>
            );
          })()}
          {isArchiveView && task.completed_at && (
            <p className="text-xs mt-0.5 ml-3.5 text-muted-foreground">
              Completed {formatDate(parseISO(task.completed_at), 'MMM d')}
            </p>
          )}
        </div>
        {isHovered && !isReadOnly && (
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(task)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
