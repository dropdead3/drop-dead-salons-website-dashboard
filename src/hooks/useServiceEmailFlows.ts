import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

// ============= Types =============

export interface ServiceEmailFlow {
  id: string;
  organization_id: string;
  service_id: string | null;
  service_category: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  steps?: ServiceEmailFlowStep[];
  service?: { id: string; name: string; category: string } | null;
}

export interface ServiceEmailFlowStep {
  id: string;
  flow_id: string;
  step_order: number;
  timing_type: 'before_appointment' | 'after_appointment';
  timing_value: number; // hours
  subject: string;
  html_body: string;
  email_template_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  overrides?: ServiceEmailFlowStepOverride[];
}

export interface ServiceEmailFlowStepOverride {
  id: string;
  step_id: string;
  location_id: string;
  subject: string | null;
  html_body: string | null;
  created_at: string;
}

export interface AppointmentReminderConfig {
  id: string;
  organization_id: string;
  reminder_type: string;
  is_active: boolean;
  subject: string;
  html_body: string;
  created_at: string;
  updated_at: string;
  overrides?: AppointmentReminderOverride[];
}

export interface AppointmentReminderOverride {
  id: string;
  config_id: string;
  location_id: string;
  subject: string | null;
  html_body: string | null;
  created_at: string;
}

// ============= Hooks: Service Email Flows =============

export function useServiceEmailFlows() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['service-email-flows', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('service_email_flows')
        .select('*, service:services(id, name, category)')
        .eq('organization_id', orgId)
        .order('name');

      if (error) throw error;
      return data as ServiceEmailFlow[];
    },
    enabled: !!orgId,
  });
}

export function useServiceEmailFlow(flowId: string | null) {
  return useQuery({
    queryKey: ['service-email-flow', flowId],
    queryFn: async () => {
      if (!flowId) return null;
      const { data, error } = await supabase
        .from('service_email_flows')
        .select('*, service:services(id, name, category)')
        .eq('id', flowId)
        .single();

      if (error) throw error;
      return data as ServiceEmailFlow;
    },
    enabled: !!flowId,
  });
}

export function useServiceEmailFlowSteps(flowId: string | null) {
  return useQuery({
    queryKey: ['service-email-flow-steps', flowId],
    queryFn: async () => {
      if (!flowId) return [];
      const { data, error } = await supabase
        .from('service_email_flow_steps')
        .select('*')
        .eq('flow_id', flowId)
        .order('step_order');

      if (error) throw error;
      return data as ServiceEmailFlowStep[];
    },
    enabled: !!flowId,
  });
}

export function useServiceEmailFlowsCount() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['service-email-flows-count', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count, error } = await supabase
        .from('service_email_flows')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!orgId,
  });
}

// ============= Mutations =============

export function useCreateServiceEmailFlow() {
  const queryClient = useQueryClient();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (flow: {
      name: string;
      description?: string;
      service_id?: string | null;
      service_category?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('service_email_flows')
        .insert({
          ...flow,
          organization_id: effectiveOrganization!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-email-flows'] });
      queryClient.invalidateQueries({ queryKey: ['service-email-flows-count'] });
      toast.success('Flow created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateServiceEmailFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ServiceEmailFlow> }) => {
      const { data, error } = await supabase
        .from('service_email_flows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-email-flows'] });
      queryClient.invalidateQueries({ queryKey: ['service-email-flow'] });
      queryClient.invalidateQueries({ queryKey: ['service-email-flows-count'] });
      toast.success('Flow updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteServiceEmailFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_email_flows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-email-flows'] });
      queryClient.invalidateQueries({ queryKey: ['service-email-flows-count'] });
      toast.success('Flow deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============= Steps Mutations =============

export function useCreateFlowStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (step: {
      flow_id: string;
      step_order: number;
      timing_type: string;
      timing_value: number;
      subject: string;
      html_body: string;
    }) => {
      const { data, error } = await supabase
        .from('service_email_flow_steps')
        .insert(step)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['service-email-flow-steps', vars.flow_id] });
      toast.success('Step added');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateFlowStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, flowId, updates }: { id: string; flowId: string; updates: Partial<ServiceEmailFlowStep> }) => {
      const { data, error } = await supabase
        .from('service_email_flow_steps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, flowId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-email-flow-steps', data.flowId] });
      toast.success('Step updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFlowStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, flowId }: { id: string; flowId: string }) => {
      const { error } = await supabase.from('service_email_flow_steps').delete().eq('id', id);
      if (error) throw error;
      return flowId;
    },
    onSuccess: (flowId) => {
      queryClient.invalidateQueries({ queryKey: ['service-email-flow-steps', flowId] });
      toast.success('Step removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============= Appointment Reminders =============

export function useAppointmentRemindersConfig() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['appointment-reminders-config', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('appointment_reminders_config')
        .select('*')
        .eq('organization_id', orgId)
        .order('reminder_type');

      if (error) throw error;
      return data as AppointmentReminderConfig[];
    },
    enabled: !!orgId,
  });
}

export function useUpsertReminderConfig() {
  const queryClient = useQueryClient();
  const { effectiveOrganization } = useOrganizationContext();

  return useMutation({
    mutationFn: async (config: {
      reminder_type: string;
      is_active: boolean;
      subject: string;
      html_body: string;
    }) => {
      const orgId = effectiveOrganization!.id;
      
      // Check existing
      const { data: existing } = await supabase
        .from('appointment_reminders_config')
        .select('id')
        .eq('organization_id', orgId)
        .eq('reminder_type', config.reminder_type)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('appointment_reminders_config')
          .update(config)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('appointment_reminders_config')
          .insert({ ...config, organization_id: orgId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-reminders-config'] });
      toast.success('Reminder config saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
