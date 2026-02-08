import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface WelcomeRule {
  id: string;
  organization_id: string;
  sender_role: AppRole;
  message_template: string;
  target_roles: string[] | null;
  target_locations: string[] | null;
  delay_minutes: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WelcomeRuleInput {
  sender_role: AppRole;
  message_template: string;
  target_roles?: string[] | null;
  target_locations?: string[] | null;
  delay_minutes?: number;
  is_active?: boolean;
  sort_order?: number;
}

export function useWelcomeDMRules() {
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  const { data: rules, isLoading, error } = useQuery({
    queryKey: ['welcome-dm-rules', effectiveOrganization?.id],
    queryFn: async (): Promise<WelcomeRule[]> => {
      if (!effectiveOrganization?.id) return [];

      const { data, error } = await supabase
        .from('team_chat_welcome_rules')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as WelcomeRule[];
    },
    enabled: !!effectiveOrganization?.id,
  });

  const addRuleMutation = useMutation({
    mutationFn: async (input: WelcomeRuleInput) => {
      if (!effectiveOrganization?.id) throw new Error('No organization');

      // Get next sort order
      const maxOrder = Math.max(0, ...(rules?.map(r => r.sort_order) || [0]));

      const { data, error } = await supabase
        .from('team_chat_welcome_rules')
        .insert({
          organization_id: effectiveOrganization.id,
          sender_role: input.sender_role,
          message_template: input.message_template,
          target_roles: input.target_roles || null,
          target_locations: input.target_locations || null,
          delay_minutes: input.delay_minutes ?? 0,
          is_active: input.is_active ?? true,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcome-dm-rules'] });
      toast.success('Welcome sender added');
    },
    onError: (error: any) => {
      console.error('Failed to add welcome rule:', error);
      if (error.code === '23505') {
        toast.error('This role is already configured as a welcome sender');
      } else {
        toast.error('Failed to add welcome sender');
      }
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WelcomeRuleInput> }) => {
      const { data, error } = await supabase
        .from('team_chat_welcome_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcome-dm-rules'] });
      toast.success('Welcome rule updated');
    },
    onError: (error) => {
      console.error('Failed to update welcome rule:', error);
      toast.error('Failed to update');
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_chat_welcome_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcome-dm-rules'] });
      toast.success('Welcome sender removed');
    },
    onError: (error) => {
      console.error('Failed to delete welcome rule:', error);
      toast.error('Failed to remove');
    },
  });

  const reorderRulesMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Update each rule with its new sort_order
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('team_chat_welcome_rules')
          .update({ sort_order: index, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcome-dm-rules'] });
    },
    onError: (error) => {
      console.error('Failed to reorder rules:', error);
      toast.error('Failed to reorder');
    },
  });

  return {
    rules: rules || [],
    isLoading,
    error,
    addRule: addRuleMutation.mutate,
    updateRule: updateRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    reorderRules: reorderRulesMutation.mutate,
    isAdding: addRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
  };
}

// Template variable replacements
export const WELCOME_TEMPLATE_VARIABLES = [
  { key: '[new_member_name]', label: 'New Member Name', description: "The new hire's display name" },
  { key: '[sender_name]', label: 'Sender Name', description: 'Sender display name' },
  { key: '[role]', label: 'Role', description: "New member's role" },
  { key: '[location_name]', label: 'Location', description: 'Assigned location name' },
];

export function replaceTemplateVariables(
  template: string,
  variables: {
    new_member_name?: string;
    sender_name?: string;
    role?: string;
    location_name?: string;
  }
): string {
  let result = template;
  if (variables.new_member_name) {
    result = result.replace(/\[new_member_name\]/g, variables.new_member_name);
  }
  if (variables.sender_name) {
    result = result.replace(/\[sender_name\]/g, variables.sender_name);
  }
  if (variables.role) {
    result = result.replace(/\[role\]/g, variables.role);
  }
  if (variables.location_name) {
    result = result.replace(/\[location_name\]/g, variables.location_name);
  }
  return result;
}
