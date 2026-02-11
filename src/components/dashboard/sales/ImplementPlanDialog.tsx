import { useState, useEffect } from 'react';
import {
  Rocket,
  ListChecks,
  MessageSquare,
  Copy,
  Loader2,
  Check,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ZuraAvatar } from '@/components/ui/ZuraAvatar';
import { ShareToDMDialog } from './ShareToDMDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ImplementPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planTitle: string;
  planContent: string;
  goalPeriod?: string;
}

interface ActionStep {
  title: string;
  description: string;
  dueDays: number;
}

/** Extract structured action items from markdown content */
function extractActions(content: string): ActionStep[] {
  const steps: ActionStep[] = [];
  let match;

  // Strategy 1: **Title:** description
  const boldColonPattern = /\*\*([^*]+?):\*\*\s*([^\n]*)/g;
  while ((match = boldColonPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const description = match[2].trim();
    if (title.length > 3 && title.length < 120) {
      steps.push({ title, description, dueDays: 0 });
    }
  }

  // Strategy 2: **Title** followed by description (no colon)
  if (steps.length === 0) {
    const boldPattern = /\*\*([^*]{4,100})\*\*[:\s]*([^\n*]*)/g;
    while ((match = boldPattern.exec(content)) !== null) {
      const title = match[1].trim().replace(/^[\d.)\-]+\s*/, '');
      const description = match[2].trim();
      if (title.length > 3 && !title.toLowerCase().includes('action') && !title.toLowerCase().includes('plan')) {
        steps.push({ title, description, dueDays: 0 });
      }
    }
  }

  // Strategy 3: Numbered list items (1. Title or 1) Title)
  if (steps.length === 0) {
    const numberedPattern = /^\s*\d+[.)]\s+(.+)/gm;
    while ((match = numberedPattern.exec(content)) !== null) {
      const raw = match[1].trim().replace(/\*+/g, '').replace(/[:\.]$/, '');
      if (raw.length > 3 && raw.length < 120) {
        steps.push({ title: raw, description: '', dueDays: 0 });
      }
    }
  }

  // Strategy 4: Markdown headers ### Title
  if (steps.length === 0) {
    const headerPattern = /^#{2,4}\s+(.+)/gm;
    while ((match = headerPattern.exec(content)) !== null) {
      const title = match[1].trim().replace(/\*+/g, '');
      if (title.length > 3 && title.length < 120) {
        steps.push({ title, description: '', dueDays: 0 });
      }
    }
  }

  // Strategy 5: Bullet list with substantive content
  if (steps.length === 0) {
    const bulletPattern = /^[\s]*[-•]\s+(.{5,120})/gm;
    while ((match = bulletPattern.exec(content)) !== null) {
      const title = match[1].trim().replace(/\*+/g, '');
      steps.push({ title, description: '', dueDays: 0 });
    }
  }

  // Assign due days based on position
  const result = steps.slice(0, 8);
  result.forEach((step, i) => {
    step.dueDays = i < 2 ? 2 : i < 4 ? 5 : 7;
  });

  return result;
}

export function ImplementPlanDialog({
  open,
  onOpenChange,
  planTitle,
  planContent,
  goalPeriod,
}: ImplementPlanDialogProps) {
  const { user } = useAuth();

  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [leadershipNote, setLeadershipNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);

  // Distribution options
  const [createTasks, setCreateTasks] = useState(true);
  const [shareDM, setShareDM] = useState(false);
  const [copyClipboard, setCopyClipboard] = useState(false);

  // DM sharing sub-dialog
  const [dmDialogOpen, setDmDialogOpen] = useState(false);

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Step selection
  const [selectedSteps, setSelectedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (idx: number) => {
    setSelectedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const allSelected = steps.length > 0 && selectedSteps.size === steps.length;

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const extracted = extractActions(planContent);
      setSteps(extracted);
      setSelectedSteps(new Set(extracted.map((_, i) => i)));
      setLeadershipNote('');
      setNoteOpen(false);
      setCreateTasks(true);
      setShareDM(false);
      setCopyClipboard(false);
      setExecuted(false);
      setResults([]);
    }
    onOpenChange(isOpen);
  };

  // Auto-close after success
  useEffect(() => {
    if (executed) {
      const timer = setTimeout(() => handleOpenChange(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [executed]);

  const activeSteps = steps.filter((_, i) => selectedSteps.has(i));

  const formatPlanForClipboard = () => {
    let text = `📋 ${planTitle}\n`;
    if (goalPeriod) text += `Period: ${goalPeriod}\n`;
    text += '\n--- Action Steps ---\n\n';

    activeSteps.forEach((step, i) => {
      text += `${i + 1}. ${step.title}`;
      text += ` (due ${format(addDays(new Date(), step.dueDays), 'MMM d')})`;
      text += '\n';
      if (step.description) text += `   ${step.description}\n`;
    });

    if (leadershipNote) {
      text += `\n--- Leadership Notes ---\n${leadershipNote}\n`;
    }

    return text;
  };

  const formatPlanForDM = () => {
    let md = `**📋 ${planTitle}**\n\n`;
    activeSteps.forEach((step, i) => {
      md += `**${i + 1}. ${step.title}**`;
      md += ` (due ${format(addDays(new Date(), step.dueDays), 'MMM d')})`;
      md += '\n';
      if (step.description) md += `${step.description}\n`;
    });
    if (leadershipNote) {
      md += `\n---\n_Leadership Notes:_ ${leadershipNote}`;
    }
    return md;
  };

  const handleActivate = async () => {
    if (!user?.id) return;
    setExecuting(true);
    const actionResults: string[] = [];

    try {
      if (createTasks) {
        const tasks = activeSteps
          .filter((s) => s.title.trim())
          .map((step) => ({
            user_id: user.id,
            title: step.title,
            description: `From recovery plan: ${planTitle}${step.description ? `\n${step.description}` : ''}`,
            due_date: addDays(new Date(), step.dueDays).toISOString(),
            priority: 'high',
            source: 'ai_recovery_plan',
          }));

        if (tasks.length > 0) {
          const { error } = await supabase.from('tasks').insert(tasks);
          if (error) throw error;
          actionResults.push(`${tasks.length} tasks created`);
        }
      }

      if (copyClipboard) {
        await navigator.clipboard.writeText(formatPlanForClipboard());
        actionResults.push('Copied to clipboard');
      }

      if (shareDM) {
        setDmDialogOpen(true);
        actionResults.push('DM sharing opened');
      }

      setResults(actionResults);
      setExecuted(true);

      if (actionResults.length > 0) {
        toast.success(`Plan activated: ${actionResults.join(', ')}`);
      }
    } catch (err) {
      console.error('Execute plan error:', err);
      toast.error('Failed to activate plan');
    } finally {
      setExecuting(false);
    }
  };

  const hasValidSteps = activeSteps.some((s) => s.title.trim());
  const hasDistribution = createTasks || shareDM || copyClipboard;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] flex flex-col"
          overlayClassName="backdrop-blur-sm bg-black/60"
        >
          {/* Header */}
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ZuraAvatar size="sm" />
              Let's Implement
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {executed
                ? 'Plan activated!'
                : 'Approve Zura\'s plan and route it to your team'}
            </p>
          </DialogHeader>

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            {executed ? (
              /* Success state */
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <p className="font-medium">Plan Activated</p>
                  <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    {results.map((r, i) => (
                      <p key={i}>✓ {r}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {/* Plan title context */}
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/20">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">
                    {planTitle}
                  </p>
                </div>

                {/* Selectable action steps */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Action Steps
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSteps(
                          allSelected
                            ? new Set()
                            : new Set(steps.map((_, i) => i))
                        )
                      }
                      className="text-[11px] text-primary hover:underline"
                    >
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step, i) => {
                      const selected = selectedSteps.has(i);
                      return (
                        <label
                          key={i}
                          className={cn(
                            'flex gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
                            selected
                              ? 'border-border/30 bg-card/50'
                              : 'border-border/20 bg-muted/20 opacity-60'
                          )}
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleStep(i)}
                            className="mt-0.5"
                          />
                          <span className="text-xs font-mono text-muted-foreground pt-0.5 w-5 shrink-0 text-right">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">
                              {step.title}
                            </p>
                            {step.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {step.description}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground/60 mt-1">
                              Due {format(addDays(new Date(), step.dueDays), 'MMM d')}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Leadership note - collapsible */}
                <Collapsible open={noteOpen} onOpenChange={setNoteOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform',
                          noteOpen && 'rotate-180'
                        )}
                      />
                      {noteOpen ? 'Leadership note' : '+ Add leadership note'}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <Textarea
                      value={leadershipNote}
                      onChange={(e) => setLeadershipNote(e.target.value)}
                      placeholder="Add context for your team..."
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Distribution options */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <p className="text-xs font-medium text-muted-foreground">
                    Route This Plan
                  </p>

                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 hover:border-border/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={createTasks}
                      onCheckedChange={(v) => setCreateTasks(!!v)}
                    />
                    <ListChecks className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm">Add to my tasks</span>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 hover:border-border/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={shareDM}
                      onCheckedChange={(v) => setShareDM(!!v)}
                    />
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm">Share with team via DM</span>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 hover:border-border/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={copyClipboard}
                      onCheckedChange={(v) => setCopyClipboard(!!v)}
                    />
                    <Copy className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm">Copy formatted plan</span>
                  </label>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className="shrink-0 gap-2 sm:gap-2">
            {executed ? null : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleActivate}
                  disabled={!hasValidSteps || !hasDistribution || executing}
                  className="gap-1.5"
                >
                  {executing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  Activate Plan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareToDMDialog
        open={dmDialogOpen}
        onOpenChange={setDmDialogOpen}
        planTitle={planTitle}
        planContent={formatPlanForDM()}
      />
    </>
  );
}
