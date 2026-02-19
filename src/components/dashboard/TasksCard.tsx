import React, { useMemo, useState } from 'react';
import { parseISO, startOfDay, addDays, isSameDay } from 'date-fns';
import { AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design-tokens';
import { TaskItem } from '@/components/dashboard/TaskItem';
import { AddTaskDialog } from '@/components/dashboard/AddTaskDialog';
import { EditTaskDialog } from '@/components/dashboard/EditTaskDialog';
import { TaskDetailDrilldown } from '@/components/dashboard/TaskDetailDrilldown';
import { CompletedTasksFilter, type CompletedFilters } from '@/components/dashboard/CompletedTasksFilter';
import { useTranslation } from 'react-i18next';
import { useFormatDate } from '@/hooks/useFormatDate';
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

interface TaskGroup {
  label: string;
  tasks: Task[];
  accent?: string;
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
  const { formatDate } = useFormatDate();
  const [showAllActive, setShowAllActive] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completedFilters, setCompletedFilters] = useState<CompletedFilters>({ search: '', priority: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = searchQuery.trim().length > 0;

  const activeTasks = useMemo(() => tasks.filter((t) => !t.is_completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.is_completed), [tasks]);

  const overdueCount = useMemo(
    () => {
      const today = startOfDay(new Date());
      return activeTasks.filter((t) => t.due_date && startOfDay(parseISO(t.due_date)) < today).length;
    },
    [activeTasks]
  );

  // Group active tasks by date
  const taskGroups = useMemo((): TaskGroup[] => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const tomorrowTasks: Task[] = [];
    const upcoming: Task[] = [];
    const noDate: Task[] = [];

    for (const task of activeTasks) {
      if (!task.due_date) {
        noDate.push(task);
      } else {
        const due = startOfDay(parseISO(task.due_date));
        if (due < today) overdue.push(task);
        else if (isSameDay(due, today)) todayTasks.push(task);
        else if (isSameDay(due, tomorrow)) tomorrowTasks.push(task);
        else upcoming.push(task);
      }
    }

    // Sort each group by priority desc
    const prioOrder = { high: 3, normal: 2, low: 1 };
    const sortByPrio = (a: Task, b: Task) => prioOrder[b.priority] - prioOrder[a.priority];
    overdue.sort(sortByPrio);
    todayTasks.sort(sortByPrio);
    tomorrowTasks.sort(sortByPrio);
    upcoming.sort((a, b) => {
      const dateDiff = parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime();
      return dateDiff !== 0 ? dateDiff : sortByPrio(a, b);
    });
    noDate.sort(sortByPrio);

    return [
      { label: 'Overdue', tasks: overdue, accent: 'text-destructive' },
      { label: 'Today', tasks: todayTasks },
      { label: 'Tomorrow', tasks: tomorrowTasks },
      { label: 'Upcoming', tasks: upcoming },
      { label: 'No Date', tasks: noDate },
    ].filter((g) => g.tasks.length > 0);
  }, [activeTasks]);

  // Total active task count for "show more"
  const totalActiveCount = activeTasks.length;

  // Search results across all tasks
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery, isSearching]);

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

  // Render a single task item with standard handlers
  const renderTask = (task: Task, isArchive = false) => (
    <TaskItem
      key={task.id}
      task={task}
      onToggle={(id, completed) => toggleTask.mutate({ id, is_completed: completed })}
      onDelete={(id) => deleteTask.mutate(id)}
      onEdit={isArchive ? undefined : (t) => onEditTask(t)}
      onView={(t) => onViewTask(t)}
      isReadOnly={isImpersonating}
      isArchiveView={isArchive}
    />
  );

  return (
    <>
      <Card className="relative overflow-hidden p-6 rounded-xl backdrop-blur-sm transition-all duration-300">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className={tokens.card.iconBox}>
              <CheckSquare className={tokens.card.icon} />
            </div>
            <h2 className={tokens.card.title}>{t('home.my_tasks')}</h2>
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

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-8 text-xs rounded-lg"
            autoCapitalize="off"
          />
          {isSearching && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isSearching ? (
          /* Search Results View */
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground font-display tracking-wide">
              {searchResults.length} RESULT{searchResults.length !== 1 ? 'S' : ''}
            </p>
            {searchResults.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {searchResults.map((task) => renderTask(task, task.is_completed))}
              </AnimatePresence>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-6">No tasks match your search</p>
            )}
          </div>
        ) : (
          /* Grouped Active Tasks View */
          <>
            <div className="space-y-4">
              {taskGroups.length > 0 ? (
                taskGroups.map((group) => {
                  const tasksToShow = showAllActive ? group.tasks : group.tasks;
                  return (
                    <div key={group.label}>
                      <p className={cn(
                        "text-[10px] font-display tracking-wide mb-2",
                        group.accent || "text-muted-foreground"
                      )}>
                        {group.label.toUpperCase()}
                      </p>
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {tasksToShow.map((task) => renderTask(task))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })
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
                        filteredCompleted.map((task) => renderTask(task, true))
                      ) : (
                        <p className="text-center text-xs text-muted-foreground py-3">No tasks match your filters</p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </>
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
