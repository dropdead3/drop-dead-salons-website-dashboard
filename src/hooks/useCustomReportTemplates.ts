import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ReportConfig } from '@/lib/reportMetrics';
import type { Json } from '@/integrations/supabase/types';

export interface CustomReportTemplate {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  created_by: string | null;
  is_shared: boolean | null;
  config: ReportConfig;
  created_at: string | null;
  updated_at: string | null;
}

export function useCustomReportTemplates() {
  return useQuery({
    queryKey: ['custom-report-templates'],
    queryFn: async (): Promise<CustomReportTemplate[]> => {
      const { data, error } = await supabase
        .from('custom_report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        config: row.config as unknown as ReportConfig,
      }));
    },
  });
}

export function useCreateReportTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      config: ReportConfig;
      is_shared?: boolean;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get organization from employee profile
      const { data: profile } = await supabase
        .from('employee_profiles')
        .select('organization_id')
        .eq('user_id', user.user.id)
        .single();

      const { data, error } = await supabase
        .from('custom_report_templates')
        .insert({
          name: template.name,
          description: template.description || null,
          config: template.config as unknown as Json,
          is_shared: template.is_shared ?? false,
          created_by: user.user.id,
          organization_id: profile?.organization_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-report-templates'] });
      toast({
        title: 'Template saved',
        description: 'Your report template has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateReportTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string;
      config?: ReportConfig;
      is_shared?: boolean;
    }) => {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.config !== undefined) updateData.config = updates.config as unknown as Json;
      if (updates.is_shared !== undefined) updateData.is_shared = updates.is_shared;

      const { data, error } = await supabase
        .from('custom_report_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-report-templates'] });
      toast({
        title: 'Template updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteReportTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_report_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-report-templates'] });
      toast({
        title: 'Template deleted',
        description: 'The report template has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRecordTemplateUsage() {
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase.from('report_template_usage').insert({
        template_id: templateId,
        used_by: user.user.id,
      });
    },
  });
}
