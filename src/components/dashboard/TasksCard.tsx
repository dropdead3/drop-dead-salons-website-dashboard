import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/components/dashboard/TaskItem';
import { AddTaskDialog } from '@/components/dashboard/AddTaskDialog';
import { EditTaskDialog } from '@/components/dashboard/EditTaskDialog';
import { TaskDetailDrilldown } from '@/components/dashboard/TaskDetailDrilldown';
import { CompletedTasksFilter, type CompletedFilters } from '@/components/dashboard/CompletedTasksFilter';
import { useTranslation } from 'react-i18next';
import type { Task } from '@/hooks/useTasks';

interface TasksCardProps {
  tasks: Task[];
  createTask: any;
  toggleTask: any;
  deleteTask: any;
  updateTask: any;
  isImpersonating: boolean;
  editingTask: Task | null;
  onEditTask: (task: Task | null) => void;
  viewingTask: Task | null;
  onViewTask: (task: Task | null) => void;
}

export function TasksCard({
  tasks,
  createTask,
  toggleTask,
  deleteTask,
  updateTask,
  isImpersonating,
  editingTask,
  onEditTask,
  viewingTask,
  onViewTask,
}: TasksCardProps) {
  const { t } = useTranslation('dashboard');
  const [showAllActive, setShowAllActive] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completedFilters, setCompletedFilters] = useState<CompletedFilters>({ search: '', priority: 'all' });

  const activeTasks = useMemo(() => tasks.filter((t) => !t.is_completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.is_completed), [tasks]);

  const overdueCount = useMemo(
    () => activeTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date(new Date().toDateString())).length,
    [activeTasks]
  );

  // Sort: overdue first, then by priority
  const sortedActive = useMemo(() => {
    const now = new Date(new Date().toDateString());
    return [...activeTasks].sort((a, b) => {
      const aOverdue = a.due_date && new Date(a.due_date) < now ? 1 : 0;
      const bOverdue = b.due_date && new Date(b.due_date) < now ? 1 : 0;
      if (bOverdue !== aOverdue) return bOverdue - aOverdue;
      const prioOrder = { high: 3, normal: 2, low: 1 };
      return prioOrder[b.priority] - prioOrder[a.priority];
    });
  }, [activeTasks]);

  const displayedActive = showAllActive ? sortedActive : sortedActive.slice(0, 5);
  const hasMoreActive = sortedActive.length > 5;

  const filteredCompleted = useMemo(() => {
    let list = completedTasks;
    if (completedFilters.search) {
      const q = completedFilters.search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (completedFilters.priority !== 'all') {
      list = list.filter((t) => t.priority === completedFilters.priority);
    }
    return list;
  }, [completedTasks, completedFilters]);

  return (
    <>
      <Card className="relative overflow-hidden p-6 rounded-xl backdrop-blur-sm transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xs tracking-[0.15em]">{t('home.my_tasks')}</h2>
            {activeTasks.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {activeTasks.length} active{overdueCount > 0 && <span className="text-destructive">, {overdueCount} overdue</span>}
              </span>
            )}
            {isImpersonating && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {t('home.view_only')}
              </span>
            )}
          </div>
          <AddTaskDialog
            onAdd={(task) => createTask.mutate(task)}
            isPending={createTask.isPending}
            isReadOnly={isImpersonating}
          />
        </div>

        {/* Active Tasks */}
        <div className="space-y-3">
          {sortedActive.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {displayedActive.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={(id, completed) => toggleTask.mutate({ id, is_completed: completed })}
                  onDelete={(id) => deleteTask.mutate(id)}
                  onEdit={(t) => onEditTask(t)}
                  onView={(t) => onViewTask(t)}
                  isReadOnly={isImpersonating}
                />
              ))}
            </AnimatePresence>
          ) : completedTasks.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground">
              <CheckSquare className="w-6 h-6 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-display">{t('home.no_tasks')}</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                {isImpersonating ? t('home.impersonating_no_tasks') : t('home.add_first_task')}
              </p>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-4">All tasks completed 🎉</p>
          )}
        </div>

        {/* View All toggle */}
        {hasMoreActive && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-muted-foreground gap-1"
            onClick={() => setShowAllActive(!showAllActive)}
          >
            {showAllActive ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>{sortedActive.length - 5} more tasks <ChevronDown className="w-3 h-3" /></>
            )}
          </Button>
        )}

        {/* Completed Section */}
        {completedTasks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground gap-1.5"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide' : 'Show'} completed ({completedTasks.length})
              {showCompleted ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>

            {showCompleted && (
              <div className="mt-2 space-y-3">
                {completedTasks.length > 3 && (
                  <CompletedTasksFilter filters={completedFilters} onChange={setCompletedFilters} />
                )}
                <AnimatePresence mode="popLayout">
                  {filteredCompleted.length > 0 ? (
                    filteredCompleted.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={(id, completed) => toggleTask.mutate({ id, is_completed: completed })}
                        onDelete={(id) => deleteTask.mutate(id)}
                        onView={(t) => onViewTask(t)}
                        isReadOnly={isImpersonating}
                        isArchiveView
                      />
                    ))
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-3">No tasks match your filters</p>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </Card>

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => !open && onEditTask(null)}
        onSave={(id, updates) => updateTask.mutate({ id, updates })}
        isPending={updateTask.isPending}
      />
      <TaskDetailDrilldown
        task={viewingTask}
        open={!!viewingTask}
        onOpenChange={(open) => !open && onViewTask(null)}
        onToggle={(id, completed) => toggleTask.mutate({ id, is_completed: completed })}
        onEdit={(t) => { onViewTask(null); onEditTask(t); }}
        onDelete={(id) => deleteTask.mutate(id)}
        onUpdateNotes={(id, notes) => updateTask.mutate({ id, updates: { notes } })}
        isReadOnly={isImpersonating}
        isNotesSaving={updateTask.isPending}
      />
    </>
  );
}
