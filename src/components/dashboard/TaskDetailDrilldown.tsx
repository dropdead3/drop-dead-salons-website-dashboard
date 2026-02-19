import { useState, useEffect } from 'react';
import { format, parseISO, isPast, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar, Clock, CheckCircle2, Sparkles, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DRILLDOWN_DIALOG_CONTENT_CLASS, DRILLDOWN_OVERLAY_CLASS } from './drilldownDialogStyles';
import type { Task } from '@/hooks/useTasks';

interface TaskDetailDrilldownProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  isReadOnly?: boolean;
  isNotesSaving?: boolean;
}

const priorityConfig = {
  low: { label: 'Low', class: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', class: 'bg-blue-500/10 text-blue-500' },
  high: { label: 'High', class: 'bg-orange-500/10 text-orange-500' },
};

export function TaskDetailDrilldown({
  task,
  open,
  onOpenChange,
  onToggle,
  onEdit,
  onDelete,
  onUpdateNotes,
  isReadOnly = false,
  isNotesSaving = false,
}: TaskDetailDrilldownProps) {
  const [localNotes, setLocalNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalNotes(task.notes || '');
      setNotesDirty(false);
    }
  }, [task]);

  if (!task) return null;

  const isOverdue = task.due_date && !task.is_completed && isPast(startOfDay(parseISO(task.due_date)));
  const priority = priorityConfig[task.priority];

  const handleSaveNotes = () => {
    onUpdateNotes(task.id, localNotes);
    setNotesDirty(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DRILLDOWN_DIALOG_CONTENT_CLASS} overlayClassName={DRILLDOWN_OVERLAY_CLASS}>
        {/* Header */}
        <div className="p-5 pb-4 border-b border-border/50">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.is_completed}
              onCheckedChange={(checked) => !isReadOnly && onToggle(task.id, checked as boolean)}
              className="mt-1"
              disabled={isReadOnly}
            />
            <div className="flex-1 min-w-0">
              <DialogHeader>
                <DialogTitle className={cn(
                  "font-display text-base text-left",
                  task.is_completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0", priority.class)}>
                  {priority.label}
                </Badge>
                {task.is_completed && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-0 bg-green-500/10 text-green-500">
                    Completed
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-0 bg-destructive/10 text-destructive">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Description
              </p>
              <p className="text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Notes</p>
            <Textarea
              value={localNotes}
              onChange={(e) => { setLocalNotes(e.target.value); setNotesDirty(true); }}
              placeholder={isReadOnly ? 'No notes' : 'Add notes...'}
              rows={3}
              disabled={isReadOnly}
              className="text-sm"
            />
            {notesDirty && !isReadOnly && (
              <div className="flex justify-end mt-2">
                <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={isNotesSaving}>
                  {isNotesSaving ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Created</p>
              <p className="font-medium">{format(parseISO(task.created_at), 'MMM d, yyyy')}</p>
            </div>
            <div className="space-y-0.5">
              <p className={cn("text-xs flex items-center gap-1", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                <Calendar className="w-3 h-3" /> Due
              </p>
              <p className={cn("font-medium", isOverdue && "text-destructive")}>
                {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</p>
              <p className="font-medium">
                {task.completed_at ? format(parseISO(task.completed_at), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> Source</p>
              <p className="font-medium capitalize">{(task as any).source === 'ai_insights' ? 'AI Insights' : 'Manual'}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {!isReadOnly && (
          <div className="p-4 pt-3 border-t border-border/50 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => { onOpenChange(false); onEdit(task); }}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => { onDelete(task.id); onOpenChange(false); }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
