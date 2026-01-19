import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveUserContext } from '@/hooks/useEffectiveUser';
import { toast } from 'sonner';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  completed_at: string | null;
}

/**
 * Fetches and manages tasks for the effective user.
 * When a super admin is impersonating a user, this shows that user's tasks.
 */
export function useTasks() {
  const { user } = useAuth();
  const { effectiveUserId, actualUserId, isImpersonating } = useEffectiveUserContext();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks', effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', effectiveUserId!)
        .order('is_completed', { ascending: true })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!effectiveUserId,
  });

  // Create task - always uses actual user ID (not impersonated)
  const createTask = useMutation({
    mutationFn: async (task: { title: string; description?: string; due_date?: string; priority?: 'low' | 'normal' | 'high' }) => {
      // When impersonating, don't allow task creation
      if (isImpersonating) {
        throw new Error('Cannot create tasks while impersonating');
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: actualUserId!,
          title: task.title,
          description: task.description || null,
          due_date: task.due_date || null,
          priority: task.priority || 'normal',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
    },
    onError: (error: Error) => {
      if (error.message === 'Cannot create tasks while impersonating') {
        toast.error('View-only mode', { description: 'Cannot create tasks while impersonating' });
      } else {
        toast.error('Failed to create task');
      }
    },
  });

  // Toggle task - prevented during impersonation
  const toggleTask = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      if (isImpersonating) {
        throw new Error('Cannot modify tasks while impersonating');
      }
      
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      if (error.message === 'Cannot modify tasks while impersonating') {
        toast.error('View-only mode', { description: 'Cannot modify tasks while impersonating' });
      } else {
        toast.error('Failed to update task');
      }
    },
  });

  // Delete task - prevented during impersonation
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      if (isImpersonating) {
        throw new Error('Cannot delete tasks while impersonating');
      }
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (error: Error) => {
      if (error.message === 'Cannot delete tasks while impersonating') {
        toast.error('View-only mode', { description: 'Cannot delete tasks while impersonating' });
      } else {
        toast.error('Failed to delete task');
      }
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    isImpersonating,
    createTask,
    toggleTask,
    deleteTask,
  };
}
