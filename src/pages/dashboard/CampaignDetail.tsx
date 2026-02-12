import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Rocket, CheckCircle2, Archive, Loader2, 
  MessageSquare, Hash, Share2, Copy, Calendar, Clock,
  Circle, PlayCircle,
} from 'lucide-react';
import {
  useActionCampaignWithTasks,
  useUpdateCampaignStatus,
  useUpdateCampaignTaskStatus,
} from '@/hooks/useActionCampaigns';
import { ShareToDMDialog } from '@/components/dashboard/sales/ShareToDMDialog';
import { ShareToChannelDialog } from '@/components/dashboard/campaigns/ShareToChannelDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const taskStatusIcon: Record<string, typeof Circle> = {
  not_started: Circle,
  in_progress: PlayCircle,
  done: CheckCircle2,
};

const taskStatusColor: Record<string, string> = {
  not_started: 'text-muted-foreground',
  in_progress: 'text-primary',
  done: 'text-chart-2',
};

const priorityColor: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
  low: 'bg-muted text-muted-foreground border-border',
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useActionCampaignWithTasks(id || null);
  const updateStatus = useUpdateCampaignStatus();
  const updateTaskStatus = useUpdateCampaignTaskStatus();

  const [dmOpen, setDmOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">Campaign not found</div>
      </DashboardLayout>
    );
  }

  const tasks = campaign.tasks || [];
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const formatForShare = () => {
    let text = `📋 **${campaign.name}**\n\n`;
    tasks.forEach((t, i) => {
      const icon = t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔄' : '⬜';
      text += `${icon} ${i + 1}. ${t.title}`;
      if (t.due_date) text += ` (due ${format(new Date(t.due_date), 'MMM d')})`;
      text += '\n';
    });
    if (campaign.leadership_note) {
      text += `\n---\n_Note:_ ${campaign.leadership_note}`;
    }
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatForShare().replace(/\*\*/g, ''));
    toast.success('Copied to clipboard');
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/campaigns')}
            className="mt-1 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="w-4 h-4 text-primary shrink-0" />
              <h1 className="text-xl md:text-2xl font-display tracking-wide truncate">
                {campaign.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[11px] capitalize">
                {campaign.status}
              </Badge>
              {campaign.goal_period && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {campaign.goal_period}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        {/* Progress + Actions */}
        <Card className="p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{doneCount}/{tasks.length} complete</span>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy} title="Copy">
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDmOpen(true)} title="Share via DM">
                <MessageSquare className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setChannelOpen(true)} title="Post to channel">
                <Hash className="w-3.5 h-3.5" />
              </Button>
              {campaign.status === 'active' && progress === 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-chart-2 text-xs"
                  onClick={() => updateStatus.mutate({ id: campaign.id, status: 'completed' })}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Mark Complete
                </Button>
              )}
              {campaign.status === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  onClick={() => updateStatus.mutate({ id: campaign.id, status: 'archived' })}
                >
                  <Archive className="w-3.5 h-3.5 mr-1" />
                  Archive
                </Button>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>

        {/* Leadership note */}
        {campaign.leadership_note && (
          <Card className="p-4 rounded-2xl border-primary/10 bg-primary/5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Leadership Note</p>
            <p className="text-sm">{campaign.leadership_note}</p>
          </Card>
        )}

        {/* Tasks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-oat" />
            <h2 className="font-display text-xs tracking-[0.15em]">ACTION STEPS</h2>
          </div>

          {tasks.map((task, i) => {
            const Icon = taskStatusIcon[task.status] || Circle;
            return (
              <Card
                key={task.id}
                className={cn(
                  'p-4 rounded-xl shadow-sm transition-all',
                  task.status === 'done' && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      const next = task.status === 'not_started' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'not_started';
                      updateTaskStatus.mutate({ id: task.id, status: next });
                    }}
                    className="mt-0.5 shrink-0"
                  >
                    <Icon className={cn('w-5 h-5', taskStatusColor[task.status])} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium',
                        task.status === 'done' && 'line-through text-muted-foreground'
                      )}>
                        {task.title}
                      </span>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', priorityColor[task.priority])}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                    )}
                    {task.due_date && (
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        Due {format(new Date(task.due_date), 'MMM d')}
                      </p>
                    )}
                  </div>
                  <Select
                    value={task.status}
                    onValueChange={(v) => updateTaskStatus.mutate({ id: task.id, status: v })}
                  >
                    <SelectTrigger className="w-[120px] h-7 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Share Dialogs */}
      <ShareToDMDialog
        open={dmOpen}
        onOpenChange={setDmOpen}
        planTitle={campaign.name}
        planContent={formatForShare()}
      />
      <ShareToChannelDialog
        open={channelOpen}
        onOpenChange={setChannelOpen}
        campaignName={campaign.name}
        content={formatForShare()}
      />
    </DashboardLayout>
  );
}
