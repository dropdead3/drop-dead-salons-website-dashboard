import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StaffingAlertSettings {
  percentage: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
}

const DEFAULT_SETTINGS: StaffingAlertSettings = {
  percentage: 70,
  email_enabled: true,
  in_app_enabled: true,
};

export function useStaffingAlertSettings() {
  return useQuery({
    queryKey: ['staffing-alert-settings'],
    queryFn: async (): Promise<StaffingAlertSettings> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'staffing_alert_threshold')
        .maybeSingle();

      if (error) {
        console.error('Error fetching staffing alert settings:', error);
        return DEFAULT_SETTINGS;
      }

      if (!data?.value) return DEFAULT_SETTINGS;

      const value = data.value as Record<string, unknown>;
      return {
        percentage: typeof value.percentage === 'number' ? value.percentage : DEFAULT_SETTINGS.percentage,
        email_enabled: typeof value.email_enabled === 'boolean' ? value.email_enabled : DEFAULT_SETTINGS.email_enabled,
        in_app_enabled: typeof value.in_app_enabled === 'boolean' ? value.in_app_enabled : DEFAULT_SETTINGS.in_app_enabled,
      };
    },
  });
}

export function useUpdateStaffingAlertSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: StaffingAlertSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          id: 'staffing_alert_threshold',
          value: settings as never,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffing-alert-settings'] });
      toast({
        title: 'Settings saved',
        description: 'Staffing alert settings have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save staffing alert settings.',
        variant: 'destructive',
      });
      console.error('Error updating staffing alert settings:', error);
    },
  });
}
