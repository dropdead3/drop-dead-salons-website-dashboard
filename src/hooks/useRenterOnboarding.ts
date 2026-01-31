import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RenterOnboardingTask {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  task_type: 'action' | 'document' | 'form' | 'acknowledgment';
  required: boolean;
  display_order: number;
  is_active: boolean;
  link_url: string | null;
  form_template_id: string | null;
  document_template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RenterOnboardingCompletion {
  id: string;
  booth_renter_id: string;
  task_id: string;
  completed_at: string;
  completed_data: Record<string, unknown> | null;
}

export interface RenterOnboardingProgress {
  task: RenterOnboardingTask;
  completed: boolean;
  completed_at: string | null;
}

export function useRenterOnboardingTasks(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['renter-onboarding-tasks', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('renter_onboarding_tasks' as any)
        .select('*')
        .eq('organization_id', organizationId!)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data as any[]) as RenterOnboardingTask[];
    },
    enabled: !!organizationId,
  });
}

export function useRenterOnboardingProgress(boothRenterId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['renter-onboarding-progress', boothRenterId],
    queryFn: async () => {
      // Get all tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('renter_onboarding_tasks' as any)
        .select('*')
        .eq('organization_id', organizationId!)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Get completions for this renter
      const { data: completions, error: completionsError } = await supabase
        .from('renter_onboarding_completions' as any)
        .select('*')
        .eq('booth_renter_id', boothRenterId!);

      if (completionsError) throw completionsError;

      const completionMap = new Map(((completions as any[]) || []).map((c: any) => [c.task_id, c]));

      return ((tasks as any[]) || []).map((task: any) => ({
        task,
        completed: completionMap.has(task.id),
        completed_at: completionMap.get(task.id)?.completed_at || null,
      })) as RenterOnboardingProgress[];
    },
    enabled: !!boothRenterId && !!organizationId,
  });
}

export function useCompleteOnboardingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boothRenterId, taskId, data }: { 
      boothRenterId: string; 
      taskId: string; 
      data?: Record<string, unknown>;
    }) => {
      const { data: completion, error } = await supabase
        .from('renter_onboarding_completions' as any)
        .insert({
          booth_renter_id: boothRenterId,
          task_id: taskId,
          completed_data: data || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return completion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['renter-onboarding-progress', variables.boothRenterId] });
      toast.success('Task completed');
    },
    onError: (error) => {
      toast.error('Failed to complete task', { description: error.message });
    },
  });
}

export function useUncompleteOnboardingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boothRenterId, taskId }: { boothRenterId: string; taskId: string }) => {
      const { error } = await supabase
        .from('renter_onboarding_completions' as any)
        .delete()
        .eq('booth_renter_id', boothRenterId)
        .eq('task_id', taskId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['renter-onboarding-progress', variables.boothRenterId] });
      toast.success('Task uncompleted');
    },
    onError: (error) => {
      toast.error('Failed to uncomplete task', { description: error.message });
    },
  });
}

export function useCreateOnboardingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<RenterOnboardingTask, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: task, error } = await supabase
        .from('renter_onboarding_tasks' as any)
        .insert(data as any)
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['renter-onboarding-tasks', variables.organization_id] });
      toast.success('Onboarding task created');
    },
    onError: (error) => {
      toast.error('Failed to create task', { description: error.message });
    },
  });
}

export function useUpdateOnboardingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RenterOnboardingTask> & { id: string }) => {
      const { data: task, error } = await supabase
        .from('renter_onboarding_tasks' as any)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renter-onboarding-tasks'] });
      toast.success('Onboarding task updated');
    },
    onError: (error) => {
      toast.error('Failed to update task', { description: error.message });
    },
  });
}

export function useDeleteOnboardingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('renter_onboarding_tasks' as any)
        .update({ is_active: false } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renter-onboarding-tasks'] });
      toast.success('Onboarding task removed');
    },
    onError: (error) => {
      toast.error('Failed to remove task', { description: error.message });
    },
  });
}

// Default onboarding tasks for new organizations
export const DEFAULT_RENTER_ONBOARDING_TASKS = [
  { title: 'Sign Booth Rental Agreement', description: 'Sign the official rental contract', task_type: 'document' as const, required: true, display_order: 0 },
  { title: 'Submit W-9 Form', description: 'Provide tax identification information', task_type: 'document' as const, required: true, display_order: 1 },
  { title: 'Provide Proof of Liability Insurance', description: 'Upload current liability insurance certificate', task_type: 'document' as const, required: true, display_order: 2 },
  { title: 'Read & Acknowledge Salon Policies', description: 'Review and accept salon rules and procedures', task_type: 'acknowledgment' as const, required: true, display_order: 3 },
  { title: 'Complete Payment Setup', description: 'Add payment method for rent payments', task_type: 'action' as const, required: true, display_order: 4 },
  { title: 'Key/Access Card Assignment', description: 'Receive keys and access credentials', task_type: 'action' as const, required: true, display_order: 5 },
];
