import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface ActionCampaign {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string | null;
  status: string;
  goal_period: string | null;
  source_plan_type: string | null;
  leadership_note: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  tasks?: ActionCampaignTask[];
}

export interface ActionCampaignTask {
  id: string;
  campaign_id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  goal_period?: string;
  source_plan_type?: string;
  leadership_note?: string;
  tasks: {
    title: string;
    description?: string;
    priority: string;
    due_date?: string;
    sort_order: number;
  }[];
}

export function useActionCampaigns(statusFilter?: string) {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();

  return useQuery({
    queryKey: ['action-campaigns', effectiveOrganization?.id, statusFilter],
    queryFn: async (): Promise<ActionCampaign[]> => {
      if (!effectiveOrganization?.id) return [];

      let query = supabase
        .from('action_campaigns')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ActionCampaign[];
    },
    enabled: !!user?.id && !!effectiveOrganization?.id,
  });
}

export function useActionCampaignWithTasks(campaignId: string | null) {
  return useQuery({
    queryKey: ['action-campaign', campaignId],
    queryFn: async (): Promise<ActionCampaign | null> => {
      if (!campaignId) return null;

      const [campaignRes, tasksRes] = await Promise.all([
        supabase.from('action_campaigns').select('*').eq('id', campaignId).single(),
        supabase.from('action_campaign_tasks').select('*').eq('campaign_id', campaignId).order('sort_order'),
      ]);

      if (campaignRes.error) throw campaignRes.error;
      return {
        ...(campaignRes.data as ActionCampaign),
        tasks: (tasksRes.data || []) as ActionCampaignTask[],
      };
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      if (!user?.id || !effectiveOrganization?.id) throw new Error('Not authenticated');

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('action_campaigns')
        .insert({
          organization_id: effectiveOrganization.id,
          created_by: user.id,
          name: input.name,
          description: input.description || null,
          goal_period: input.goal_period || null,
          source_plan_type: input.source_plan_type || null,
          leadership_note: input.leadership_note || null,
          status: 'active',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create tasks
      if (input.tasks.length > 0) {
        const tasks = input.tasks.map((t) => ({
          campaign_id: campaign.id,
          title: t.title,
          description: t.description || null,
          priority: t.priority,
          due_date: t.due_date || null,
          sort_order: t.sort_order,
        }));

        const { error: tasksError } = await supabase
          .from('action_campaign_tasks')
          .insert(tasks);

        if (tasksError) throw tasksError;
      }

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-campaigns'] });
      toast.success('Campaign created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed') updates.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('action_campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-campaigns'] });
    },
  });
}

export function useUpdateCampaignTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'done') updates.completed_at = new Date().toISOString();
      else updates.completed_at = null;

      const { error } = await supabase
        .from('action_campaign_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['action-campaign'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('action_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete campaign: ${error.message}`);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; leadership_note?: string }) => {
      const { error } = await supabase
        .from('action_campaigns')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['action-campaign'] });
    },
  });
}

export function useAddCampaignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { campaign_id: string; title: string; priority?: string; sort_order?: number }) => {
      const { error } = await supabase
        .from('action_campaign_tasks')
        .insert({
          campaign_id: input.campaign_id,
          title: input.title,
          priority: input.priority || 'medium',
          sort_order: input.sort_order || 0,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-campaign'] });
      toast.success('Task added');
    },
  });
}

export function useDeleteCampaignTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('action_campaign_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-campaign'] });
      toast.success('Task removed');
    },
  });
}

export function useReorderCampaignTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tasks: { id: string; sort_order: number }[]) => {
      const updates = tasks.map((t) =>
        supabase.from('action_campaign_tasks').update({ sort_order: t.sort_order }).eq('id', t.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-campaign'] });
    },
  });
}
