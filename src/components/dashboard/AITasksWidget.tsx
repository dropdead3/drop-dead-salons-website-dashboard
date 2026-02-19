import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Brain } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';

export function AITasksWidget() {
  const { tasks, toggleTask } = useTasks();

  // Filter to only AI-sourced incomplete tasks
  const aiTasks = tasks.filter(
    (t: any) => t.source === 'ai_insights' && !t.is_completed
  );

  return (
    <Card className={tokens.kpi.tile}>
      <div className="flex items-center gap-2 mb-3">
        <div className={tokens.card.iconBox}>
          <Brain className={tokens.card.icon} />
        </div>
        <h3 className={tokens.kpi.label}>AI SUGGESTED TASKS</h3>
      </div>
      {aiTasks.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No pending AI tasks</p>
      ) : (
        <div className="space-y-2">
          {aiTasks.map((task: any) => (
            <div key={task.id} className="flex items-start gap-2.5">
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={(checked) => toggleTask.mutate({ id: task.id, is_completed: checked as boolean })}
                className="mt-0.5"
              />
              <span className={cn(
                'text-sm leading-snug',
                task.is_completed && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
