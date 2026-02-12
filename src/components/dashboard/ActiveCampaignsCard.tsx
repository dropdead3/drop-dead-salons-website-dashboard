import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, ChevronRight, CheckCircle2, Archive, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActionCampaigns, useUpdateCampaignStatus } from '@/hooks/useActionCampaigns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function ActiveCampaignsCard() {
  const { data: campaigns, isLoading } = useActionCampaigns('active');
  const updateStatus = useUpdateCampaignStatus();

  // Fetch task counts for active campaigns
  const campaignIds = useMemo(() => campaigns?.map(c => c.id) || [], [campaigns]);

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

  if (isLoading) return null;
  if (!campaigns || campaigns.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-oat" />
          <h2 className="font-display text-xs tracking-[0.15em]">ACTIVE CAMPAIGNS</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {campaigns.length} active
        </span>
      </div>
      <div className="space-y-3">
        {campaigns.slice(0, 3).map((campaign) => {
          const counts = taskCounts?.[campaign.id] || { total: 0, done: 0 };
          const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

          return (
            <Card
              key={campaign.id}
              className="relative overflow-hidden p-4 rounded-2xl shadow-md backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="w-3.5 h-3.5 text-primary shrink-0" />
                    <h3 className="text-sm font-medium truncate">{campaign.name}</h3>
                  </div>
                  {campaign.goal_period && (
                    <p className="text-[11px] text-muted-foreground mb-2">
                      {campaign.goal_period} • Created {format(new Date(campaign.created_at), 'MMM d')}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {counts.done}/{counts.total}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {progress === 100 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateStatus.mutate({ id: campaign.id, status: 'completed' })}
                      title="Mark complete"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-chart-2" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
