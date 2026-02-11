import { useState, useMemo } from 'react';
import {
  Rocket,
  ArrowLeft,
  ArrowRight,
  Plus,
  ListChecks,
  MessageSquare,
  Hash,
  Copy,
  Loader2,
  Check,
  Sparkles,
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
import { PlanStepEditor, type PlanStep } from './PlanStepEditor';
import { ShareToDMDialog } from './ShareToDMDialog';
import { useTeamMembers } from '@/hooks/team-chat/useTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ImplementPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planTitle: string;
  planContent: string;
  goalPeriod?: string;
}

/** Extract structured action items from markdown content */
function extractStructuredActions(content: string): PlanStep[] {
  const steps: PlanStep[] = [];
  // Match **Bold Title:** followed by description text
  const pattern = /\*\*([^*]+?):\*\*\s*([^\n*]*)/g;
  let match;
  let idx = 0;

  while ((match = pattern.exec(content)) !== null) {
    const title = match[1].trim();
    const description = match[2].trim();
    if (title.length > 5 && title.length < 100) {
      steps.push({
        id: `step-${idx++}`,
        title,
        description,
        ownerId: undefined,
        ownerName: undefined,
        dueDays: idx <= 2 ? 2 : idx <= 4 ? 5 : 7,
        notes: '',
      });
    }
  }

  // Fallback: try numbered list items
  if (steps.length === 0) {
    const numberedPattern = /^\d+\.\s+\*?\*?([^*\n]+)\*?\*?/gm;
    while ((match = numberedPattern.exec(content)) !== null) {
      const title = match[1].trim().replace(/[:\.]$/, '');
      if (title.length > 5 && title.length < 100) {
        steps.push({
          id: `step-${idx++}`,
          title,
          description: '',
          ownerId: undefined,
          ownerName: undefined,
          dueDays: idx <= 2 ? 2 : 5,
          notes: '',
        });
      }
    }
  }

  return steps.slice(0, 8);
}

export function ImplementPlanDialog({
  open,
  onOpenChange,
  planTitle,
  planContent,
  goalPeriod,
}: ImplementPlanDialogProps) {
  const { user } = useAuth();
  const { members } = useTeamMembers('', 'all', 'all' as any);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>(() =>
    extractStructuredActions(planContent)
  );
  const [leadershipNotes, setLeadershipNotes] = useState('');

  // Distribution options
  const [createTasks, setCreateTasks] = useState(true);
  const [shareDM, setShareDM] = useState(false);
  const [postChannel, setPostChannel] = useState(false);
  const [copyClipboard, setCopyClipboard] = useState(false);

  // DM sharing sub-dialog
  const [dmDialogOpen, setDmDialogOpen] = useState(false);

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Reset state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPlanSteps(extractStructuredActions(planContent));
      setCurrentStep(1);
      setLeadershipNotes('');
      setCreateTasks(true);
      setShareDM(false);
      setPostChannel(false);
      setCopyClipboard(false);
      setExecuted(false);
      setResults([]);
    }
    onOpenChange(open);
  };

  const updateStep = (index: number, updated: PlanStep) => {
    setPlanSteps((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const removeStep = (index: number) => {
    setPlanSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStep = (from: number, to: number) => {
    setPlanSteps((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const addStep = () => {
    setPlanSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        title: '',
        description: '',
        ownerId: undefined,
        ownerName: undefined,
        dueDays: 3,
        notes: '',
      },
    ]);
  };

  const formatPlanForClipboard = () => {
    let text = `📋 ${planTitle}\n`;
    if (goalPeriod) text += `Period: ${goalPeriod}\n`;
    text += '\n--- Action Steps ---\n\n';

    planSteps.forEach((step, i) => {
      text += `${i + 1}. ${step.title}`;
      if (step.ownerName) text += ` → ${step.ownerName}`;
      if (step.dueDays) text += ` (due ${format(addDays(new Date(), step.dueDays), 'MMM d')})`;
      text += '\n';
      if (step.notes) text += `   Notes: ${step.notes}\n`;
    });

    if (leadershipNotes) {
      text += `\n--- Leadership Notes ---\n${leadershipNotes}\n`;
    }

    return text;
  };

  const formatPlanForDM = () => {
    let md = `**📋 ${planTitle}**\n\n`;
    planSteps.forEach((step, i) => {
      md += `**${i + 1}. ${step.title}**`;
      if (step.ownerName) md += ` → _${step.ownerName}_`;
      if (step.dueDays) md += ` (due ${format(addDays(new Date(), step.dueDays), 'MMM d')})`;
      md += '\n';
      if (step.description) md += `${step.description}\n`;
    });
    if (leadershipNotes) {
      md += `\n---\n_Leadership Notes:_ ${leadershipNotes}`;
    }
    return md;
  };

  const handleExecute = async () => {
    if (!user?.id) return;
    setExecuting(true);
    const actionResults: string[] = [];

    try {
      // 1. Create tasks
      if (createTasks) {
        const tasks = planSteps
          .filter((s) => s.title.trim())
          .map((step) => ({
            user_id: user.id,
            title: step.title,
            description: `From recovery plan: ${planTitle}${step.ownerName ? ` — Assigned to: ${step.ownerName}` : ''}${step.notes ? `\n${step.notes}` : ''}`,
            due_date: step.dueDays
              ? addDays(new Date(), step.dueDays).toISOString()
              : null,
            priority: 'high',
            source: 'ai_recovery_plan',
          }));

        if (tasks.length > 0) {
          const { error } = await supabase.from('tasks').insert(tasks);
          if (error) throw error;
          actionResults.push(`${tasks.length} tasks created`);
        }
      }

      // 2. Copy to clipboard
      if (copyClipboard) {
        await navigator.clipboard.writeText(formatPlanForClipboard());
        actionResults.push('Copied to clipboard');
      }

      // 3. DM sharing handled via sub-dialog after execute
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
      toast.error('Failed to execute plan');
    } finally {
      setExecuting(false);
    }
  };

  const hasValidSteps = planSteps.some((s) => s.title.trim());
  const hasDistribution = createTasks || shareDM || postChannel || copyClipboard;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] flex flex-col"
          overlayClassName="backdrop-blur-sm bg-black/60"
        >
          {/* Header */}
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <ZuraAvatar size="sm" />
                Let's Implement
              </DialogTitle>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    currentStep >= 1 ? 'bg-primary' : 'bg-muted'
                  )}
                />
                <span
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    currentStep >= 2 ? 'bg-primary' : 'bg-muted'
                  )}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStep === 1
                ? 'Review and customize the action steps from Zura\'s plan'
                : executed
                ? 'Plan activated!'
                : 'Choose how to distribute and activate this plan'}
            </p>
          </DialogHeader>

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            {currentStep === 1 ? (
              <div className="space-y-3 pb-4">
                {/* Plan title context */}
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/20">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">
                    {planTitle}
                  </p>
                </div>

                {/* Steps */}
                {planSteps.map((step, i) => (
                  <PlanStepEditor
                    key={step.id}
                    step={step}
                    index={i}
                    total={planSteps.length}
                    members={members}
                    onUpdate={(s) => updateStep(i, s)}
                    onRemove={() => removeStep(i)}
                    onMoveUp={() => moveStep(i, i - 1)}
                    onMoveDown={() => moveStep(i, i + 1)}
                  />
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                  className="w-full gap-1.5 text-xs border-dashed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Step
                </Button>

                {/* Leadership Notes */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Leadership Notes (shared with plan)
                  </label>
                  <Textarea
                    value={leadershipNotes}
                    onChange={(e) => setLeadershipNotes(e.target.value)}
                    placeholder="Add context for your team about priorities, timing, or approach..."
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            ) : executed ? (
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
              /* Step 2: Distribution */
              <div className="space-y-4 pb-4">
                <div className="text-xs font-medium text-muted-foreground">
                  {planSteps.filter((s) => s.title.trim()).length} steps ready —
                  choose how to activate:
                </div>

                {/* Distribution options */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border/60 cursor-pointer transition-colors">
                  <Checkbox
                    checked={createTasks}
                    onCheckedChange={(v) => setCreateTasks(!!v)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Create my task list</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Saves all steps to your Tasks with owners & due dates
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border/60 cursor-pointer transition-colors">
                  <Checkbox
                    checked={shareDM}
                    onCheckedChange={(v) => setShareDM(!!v)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Share with team via DM</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Pick recipients and send the formatted plan + assignments
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:border-border/60 cursor-pointer transition-colors">
                  <Checkbox
                    checked={copyClipboard}
                    onCheckedChange={(v) => setCopyClipboard(!!v)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Copy formatted plan</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Copy to clipboard with assignments for external sharing
                    </p>
                  </div>
                </label>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className="shrink-0 gap-2 sm:gap-2">
            {currentStep === 1 ? (
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
                  onClick={() => setCurrentStep(2)}
                  disabled={!hasValidSteps}
                  className="gap-1.5"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : executed ? (
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecute}
                  disabled={!hasDistribution || executing}
                  className="gap-1.5"
                >
                  {executing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  Execute Plan
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DM sub-dialog for sharing */}
      <ShareToDMDialog
        open={dmDialogOpen}
        onOpenChange={setDmDialogOpen}
        planTitle={planTitle}
        planContent={formatPlanForDM()}
      />
    </>
  );
}
