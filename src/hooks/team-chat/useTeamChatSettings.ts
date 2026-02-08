import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export interface TeamChatSettings {
  id: string;
  organization_id: string;
  // Channel permissions
  channel_create_public: 'super_admin' | 'admin' | 'manager' | 'anyone';
  channel_create_private: 'super_admin' | 'admin' | 'manager' | 'anyone';
  channel_archive_permission: 'admin' | 'channel_owner' | 'anyone';
  default_channels: string[];
  // Display settings
  display_name_format: 'full_name' | 'display_name' | 'first_name';
  show_profile_photos: boolean;
  show_role_badges: boolean;
  show_job_title: boolean;
  show_location_badge: boolean;
  // Messaging permissions
  mention_everyone_permission: 'admin' | 'manager' | 'anyone';
  pin_message_permission: 'admin' | 'channel_admin' | 'anyone';
  delete_others_messages: 'admin' | 'channel_admin';
  message_retention_days: number | null;
  allow_file_attachments: boolean;
  max_file_size_mb: number;
  // Notification defaults
  default_notification_setting: 'all' | 'mentions' | 'nothing';
  allow_dnd_override: boolean;
  created_at: string;
  updated_at: string;
}

export type TeamChatSettingsUpdate = Partial<Omit<TeamChatSettings, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;

const DEFAULT_SETTINGS: Omit<TeamChatSettings, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
  channel_create_public: 'admin',
  channel_create_private: 'admin',
  channel_archive_permission: 'admin',
  default_channels: ['general', 'company-wide'],
  display_name_format: 'display_name',
  show_profile_photos: true,
  show_role_badges: true,
  show_job_title: false,
  show_location_badge: false,
  mention_everyone_permission: 'admin',
  pin_message_permission: 'channel_admin',
  delete_others_messages: 'admin',
  message_retention_days: null,
  allow_file_attachments: true,
  max_file_size_mb: 25,
  default_notification_setting: 'all',
  allow_dnd_override: false,
};

export function useTeamChatSettings() {
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['team-chat-settings', effectiveOrganization?.id],
    queryFn: async () => {
      if (!effectiveOrganization?.id) return null;

      const { data, error } = await supabase
        .from('team_chat_settings')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .maybeSingle();

      if (error) throw error;

      // Return settings with defaults applied for any missing values
      if (data) {
        return {
          ...DEFAULT_SETTINGS,
          ...data,
        } as TeamChatSettings;
      }

      // Return null if no settings exist yet (will use defaults in UI)
      return null;
    },
    enabled: !!effectiveOrganization?.id,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: TeamChatSettingsUpdate) => {
      if (!effectiveOrganization?.id) {
        throw new Error('No organization context');
      }

      // Upsert settings - create if not exists, update if exists
      const { data, error } = await supabase
        .from('team_chat_settings')
        .upsert({
          organization_id: effectiveOrganization.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-chat-settings'] });
      toast.success('Settings saved');
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      toast.error('Failed to save settings');
    },
  });

  // Get effective settings (with defaults)
  const effectiveSettings = settings || {
    ...DEFAULT_SETTINGS,
    id: '',
    organization_id: effectiveOrganization?.id || '',
    created_at: '',
    updated_at: '',
  } as TeamChatSettings;

  return {
    settings: effectiveSettings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
}
