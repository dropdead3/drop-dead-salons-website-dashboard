import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface ScheduledReport {
  id: string;
  organization_id: string | null;
  template_id: string | null;
  report_type: string | null;
  name: string;
  schedule_type: string;
  schedule_config: {
    dayOfWeek?: number;
    dayOfMonth?: number;
    timeUtc?: string;
    timezone?: string;
  };
  recipients: { email: string; userId?: string; name?: string }[];
  format: string | null;
  filters: Record<string, any>;
  is_active: boolean | null;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string | null;
  created_at: string | null;
}

export interface ScheduledReportRun {
  id: string;
  scheduled_report_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  file_url: string | null;
  recipient_count: number | null;
  error_message: string | null;
}

export function useScheduledReports() {
  return useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: async (): Promise<ScheduledReport[]> => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        schedule_config: (row.schedule_config || {}) as ScheduledReport['schedule_config'],
        recipients: (row.recipients || []) as ScheduledReport['recipients'],
        filters: (row.filters || {}) as Record<string, any>,
      }));
    },
  });
}

export function useScheduledReportRuns(reportId?: string) {
  return useQuery({
    queryKey: ['scheduled-report-runs', reportId],
    queryFn: async (): Promise<ScheduledReportRun[]> => {
      let query = supabase
        .from('scheduled_report_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (reportId) {
        query = query.eq('scheduled_report_id', reportId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });
}

export function useCreateScheduledReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (report: {
      name: string;
      template_id?: string;
      report_type?: string;
      schedule_type: string;
      schedule_config?: ScheduledReport['schedule_config'];
      recipients: ScheduledReport['recipients'];
      format?: string;
      filters?: Record<string, any>;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get organization from employee profile
      const { data: profile } = await supabase
        .from('employee_profiles')
        .select('organization_id')
        .eq('user_id', user.user.id)
        .single();

      // Calculate initial next_run_at
      const nextRunAt = calculateNextRunTime(report.schedule_type, report.schedule_config);

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          name: report.name,
          template_id: report.template_id || null,
          report_type: report.report_type || null,
          schedule_type: report.schedule_type,
          schedule_config: (report.schedule_config || {}) as unknown as Json,
          recipients: report.recipients as unknown as Json,
          format: report.format || 'pdf',
          filters: (report.filters || {}) as unknown as Json,
          is_active: true,
          next_run_at: nextRunAt,
          created_by: user.user.id,
          organization_id: profile?.organization_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: 'Report scheduled',
        description: 'Your report has been scheduled successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error scheduling report',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      schedule_type?: string;
      schedule_config?: ScheduledReport['schedule_config'];
      recipients?: ScheduledReport['recipients'];
      format?: string;
      filters?: Record<string, any>;
      is_active?: boolean;
    }) => {
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.schedule_type !== undefined) updateData.schedule_type = updates.schedule_type;
      if (updates.schedule_config !== undefined) updateData.schedule_config = updates.schedule_config as unknown as Json;
      if (updates.recipients !== undefined) updateData.recipients = updates.recipients as unknown as Json;
      if (updates.format !== undefined) updateData.format = updates.format;
      if (updates.filters !== undefined) updateData.filters = updates.filters as unknown as Json;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      // Recalculate next_run_at if schedule changed
      if (updates.schedule_type || updates.schedule_config) {
        updateData.next_run_at = calculateNextRunTime(
          updates.schedule_type || 'daily',
          updates.schedule_config
        );
      }

      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: 'Schedule updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating schedule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast({
        title: 'Schedule deleted',
        description: 'The scheduled report has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting schedule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

function calculateNextRunTime(
  scheduleType: string,
  config?: ScheduledReport['schedule_config']
): string {
  const now = new Date();
  const next = new Date(now);

  switch (scheduleType) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      if (config?.dayOfWeek !== undefined) {
        const currentDay = next.getDay();
        const daysUntil = (config.dayOfWeek - currentDay + 7) % 7 || 7;
        next.setDate(now.getDate() + daysUntil);
      }
      break;
    case 'monthly':
    case 'first_of_month':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      break;
    case 'last_of_month':
      next.setMonth(next.getMonth() + 2);
      next.setDate(0);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  if (config?.timeUtc) {
    const [hours, minutes] = config.timeUtc.split(':');
    next.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else {
    next.setUTCHours(9, 0, 0, 0);
  }

  return next.toISOString();
}
