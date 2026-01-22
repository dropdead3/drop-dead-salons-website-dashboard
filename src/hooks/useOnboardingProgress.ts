import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveUserId } from './useEffectiveUser';
import { useViewAs } from '@/contexts/ViewAsContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface OnboardingProgress {
  percentage: number;
  isComplete: boolean;
  tasksCompleted: number;
  tasksTotal: number;
  handbooksCompleted: number;
  handbooksTotal: number;
  hasBusinessCard: boolean;
  hasHeadshot: boolean;
  isLoading: boolean;
}

export function useOnboardingProgress(): OnboardingProgress {
  const { roles: actualRoles } = useAuth();
  const { isViewingAsUser, viewAsRole } = useViewAs();
  const effectiveUserId = useEffectiveUserId();

  // Fetch user roles for the effective user
  const { data: effectiveRoles = [] } = useQuery({
    queryKey: ['onboarding-effective-roles', effectiveUserId, isViewingAsUser],
    queryFn: async () => {
      if (!effectiveUserId) return actualRoles;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', effectiveUserId);

      if (error) return actualRoles;
      return data?.map(r => r.role) || actualRoles;
    },
    enabled: !!effectiveUserId,
  });

  const roles = isViewingAsUser ? effectiveRoles : (viewAsRole ? [viewAsRole] : actualRoles);

  // Fetch onboarding tasks visible to user's roles
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['onboarding-tasks', roles],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_tasks')
        .select('id, visible_to_roles')
        .eq('is_active', true);

      if (error) throw error;
      
      // Filter to tasks visible to user's roles
      return (data || []).filter(task => 
        task.visible_to_roles?.some((role: AppRole) => roles.includes(role))
      );
    },
    enabled: roles.length > 0,
  });

  // Fetch user's task completions
  const { data: completionsData, isLoading: completionsLoading } = useQuery({
    queryKey: ['onboarding-completions', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase
        .from('onboarding_task_completions')
        .select('task_key')
        .eq('user_id', effectiveUserId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveUserId,
  });

  // Fetch handbooks visible to user's roles
  const { data: handbooksData, isLoading: handbooksLoading } = useQuery({
    queryKey: ['onboarding-handbooks', roles],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('handbooks')
        .select('id, visible_to_roles')
        .eq('is_active', true);

      if (error) throw error;
      
      // Filter to handbooks visible to user's roles
      return (data || []).filter(handbook => 
        handbook.visible_to_roles?.some((role: AppRole) => roles.includes(role))
      );
    },
    enabled: roles.length > 0,
  });

  // Fetch user's handbook acknowledgments
  const { data: acknowledgementsData, isLoading: ackLoading } = useQuery({
    queryKey: ['onboarding-acknowledgements', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase
        .from('handbook_acknowledgments')
        .select('handbook_id')
        .eq('user_id', effectiveUserId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveUserId,
  });

  // Fetch business card request
  const { data: businessCardData, isLoading: bcLoading } = useQuery({
    queryKey: ['onboarding-business-card', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      
      const { data, error } = await supabase
        .from('business_card_requests')
        .select('id')
        .eq('user_id', effectiveUserId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!effectiveUserId,
  });

  // Fetch headshot request
  const { data: headshotData, isLoading: hsLoading } = useQuery({
    queryKey: ['onboarding-headshot', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      
      const { data, error } = await supabase
        .from('headshot_requests')
        .select('id')
        .eq('user_id', effectiveUserId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!effectiveUserId,
  });

  const isLoading = tasksLoading || completionsLoading || handbooksLoading || ackLoading || bcLoading || hsLoading;

  // Calculate progress
  const tasks = tasksData || [];
  const completions = completionsData || [];
  const handbooks = handbooksData || [];
  const acknowledgements = acknowledgementsData || [];

  const completedTaskIds = new Set(completions.map(c => c.task_key));
  const acknowledgedHandbookIds = new Set(acknowledgements.map(a => a.handbook_id));

  const tasksCompleted = tasks.filter(t => completedTaskIds.has(t.id)).length;
  const tasksTotal = tasks.length;
  const handbooksCompleted = handbooks.filter(h => acknowledgedHandbookIds.has(h.id)).length;
  const handbooksTotal = handbooks.length;
  const hasBusinessCard = !!businessCardData;
  const hasHeadshot = !!headshotData;

  // Calculate percentages
  const tasksProgress = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 100;
  const handbooksProgress = handbooksTotal > 0 ? (handbooksCompleted / handbooksTotal) * 100 : 100;
  const businessCardProgress = hasBusinessCard ? 100 : 0;
  const headshotProgress = hasHeadshot ? 100 : 0;

  const percentage = Math.round((tasksProgress + handbooksProgress + businessCardProgress + headshotProgress) / 4);
  const isComplete = percentage >= 100;

  return {
    percentage,
    isComplete,
    tasksCompleted,
    tasksTotal,
    handbooksCompleted,
    handbooksTotal,
    hasBusinessCard,
    hasHeadshot,
    isLoading,
  };
}
