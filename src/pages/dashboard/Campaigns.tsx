import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Rocket, Target, CheckCircle2, Archive, ChevronRight, 
  Loader2, Calendar, Clock 
} from 'lucide-react';
import { useActionCampaigns, useUpdateCampaignStatus } from '@/hooks/useActionCampaigns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Rocket }> = {
  active: { label: 'Active', color: 'text-primary', icon: Rocket },
  completed: { label: 'Completed', color: 'text-chart-2', icon: CheckCircle2 },
  archived: { label: 'Archived', color: 'text-muted-foreground', icon: Archive },
};

export default function Campaigns() {
  const [filter, setFilter] = useState('all');
  const { data: campaigns, isLoading } = useActionCampaigns(filter);
  const updateStatus = useUpdateCampaignStatus();

  const campaignIds = campaigns?.map(c => c.id) || [];
  const { data: taskCounts } = useQuery({
    queryKey: ['campaign-task-counts', campaignIds],
    queryFn: async () => {
      if (campaignIds.length === 0) return {};
      const { data, error } = await supabase
        .from('action_campaign_tasks')
        .select('campaign_id, status')
        .in('campaign_id', campaignIds);
      if (error) throw error;
      const counts: Record<string, { total: number; done: number }> = {};
      (data || []).forEach((t) => {
        if (!counts[t.campaign_id]) counts[t.campaign_id] = { total: 0, done: 0 };
        counts[t.campaign_id].total++;
        if (t.status === 'done') counts[t.campaign_id].done++;
      });
      return counts;
    },
    enabled: campaignIds.length > 0,
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-display tracking-wide">CAMPAIGNS</h1>
            <p className="text-sm text-muted-foreground">Track and manage your action campaigns</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !campaigns?.length ? (
          <div className="text-center py-16 space-y-3">
            <Target className="w-10 h-10 mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm">No campaigns yet</p>
            <p className="text-xs text-muted-foreground/60">Campaigns are created from Zura AI insights via "Let's Implement"</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => {
              const counts = taskCounts?.[campaign.id] || { total: 0, done: 0 };
              const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
              const cfg = statusConfig[campaign.status] || statusConfig.active;
              const StatusIcon = cfg.icon;

              return (
                <Link key={campaign.id} to={`/dashboard/campaigns/${campaign.id}`}>
                  <Card className="relative overflow-hidden p-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                    
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusIcon className={cn('w-4 h-4 shrink-0', cfg.color)} />
                        <h3 className="font-medium text-sm truncate">{campaign.name}</h3>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {campaign.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{campaign.description}</p>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {counts.done}/{counts.total}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                      {campaign.goal_period && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {campaign.goal_period}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(campaign.created_at), 'MMM d')}
                      </span>
                    </div>

                    {progress === 100 && campaign.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 h-7 text-[11px] text-chart-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateStatus.mutate({ id: campaign.id, status: 'completed' });
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Complete
                      </Button>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
