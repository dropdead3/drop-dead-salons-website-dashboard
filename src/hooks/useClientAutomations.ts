import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import type { Json } from '@/integrations/supabase/types';

export interface ClientAutomationRule {
  id: string;
  organization_id: string;
  rule_name: string;
  rule_type: 'post_visit_thanks' | 'rebooking_reminder' | 'win_back' | 'birthday' | 'custom';
  trigger_days: number;
  email_template_id: string | null;
  sms_template_id: string | null;
  is_active: boolean;
  conditions: Record<string, unknown>;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationLogEntry {
  id: string;
  rule_id: string;
  client_id: string | null;
  phorest_client_id: string | null;
  sent_at: string;
  channel: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked' | 'bounced';
  metadata: Record<string, unknown>;
  error_message: string | null;
}

export function useClientAutomationRules() {
  const { effectiveOrganization } = useOrganizationContext();

  return useQuery({
    queryKey: ['client-automation-rules', effectiveOrganization?.id],
    queryFn: async (): Promise<ClientAutomationRule[]> => {
      if (!effectiveOrganization?.id) return [];

      const { data, error } = await supabase
        .from('client_automation_rules')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      return (data || []) as ClientAutomationRule[];
    },
    enabled: !!effectiveOrganization?.id,
  });
}

export function useCreateAutomationRule() {
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: {
      rule_name: string;
      rule_type: string;
      trigger_days: number;
      email_template_id?: string | null;
      sms_template_id?: string | null;
      is_active?: boolean;
      conditions?: Json;
      priority?: number;
    }) => {
      if (!effectiveOrganization?.id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('client_automation_rules')
        .insert([{
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          trigger_days: rule.trigger_days,
          email_template_id: rule.email_template_id || null,
          sms_template_id: rule.sms_template_id || null,
          is_active: rule.is_active ?? true,
          conditions: (rule.conditions || {}) as Json,
          priority: rule.priority || 0,
          organization_id: effectiveOrganization.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-automation-rules'] });
    },
  });
}

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      rule_name?: string;
      rule_type?: string;
      trigger_days?: number;
      email_template_id?: string | null;
      sms_template_id?: string | null;
      is_active?: boolean;
      conditions?: Record<string, unknown>;
      priority?: number;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.rule_name !== undefined) updateData.rule_name = updates.rule_name;
      if (updates.rule_type !== undefined) updateData.rule_type = updates.rule_type;
      if (updates.trigger_days !== undefined) updateData.trigger_days = updates.trigger_days;
      if (updates.email_template_id !== undefined) updateData.email_template_id = updates.email_template_id;
      if (updates.sms_template_id !== undefined) updateData.sms_template_id = updates.sms_template_id;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.priority !== undefined) updateData.priority = updates.priority;

      const { data, error } = await supabase
        .from('client_automation_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-automation-rules'] });
    },
  });
}

export function useDeleteAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('client_automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-automation-rules'] });
    },
  });
}

export function useAutomationLog(ruleId?: string, days = 7) {
  const { effectiveOrganization } = useOrganizationContext();

  return useQuery({
    queryKey: ['automation-log', effectiveOrganization?.id, ruleId, days],
    queryFn: async (): Promise<AutomationLogEntry[]> => {
      if (!effectiveOrganization?.id) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('client_automation_log')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .gte('sent_at', startDate.toISOString())
        .order('sent_at', { ascending: false })
        .limit(100);

      if (ruleId) {
        query = query.eq('rule_id', ruleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AutomationLogEntry[];
    },
    enabled: !!effectiveOrganization?.id,
  });
}

export function useRunAutomations() {
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dryRun?: boolean): Promise<unknown> => {
      if (!effectiveOrganization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('process-client-automations', {
        body: {
          organizationId: effectiveOrganization.id,
          dryRun: dryRun ?? false,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-log'] });
    },
  });
}

export const ruleTypeLabels: Record<string, string> = {
  post_visit_thanks: 'Post-Visit Thank You',
  rebooking_reminder: 'Rebooking Reminder',
  win_back: 'Win-Back Campaign',
  birthday: 'Birthday Message',
  custom: 'Custom Automation',
};

export const ruleTypeDescriptions: Record<string, string> = {
  post_visit_thanks: 'Send a thank-you message after their appointment',
  rebooking_reminder: 'Remind clients to book their next appointment',
  win_back: 'Re-engage clients who haven\'t visited recently',
  birthday: 'Celebrate their special day with a message',
  custom: 'Custom automation with your own rules',
};
