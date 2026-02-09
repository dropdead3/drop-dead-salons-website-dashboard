import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PinValidationResult {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  is_super_admin: boolean;
  is_primary_owner: boolean;
}

/**
 * Kiosk-specific PIN validation hook that works without authenticated Supabase session.
 * Uses the organizationId from the location lookup (available in KioskProvider).
 */
export function useKioskValidatePin(organizationId: string | null) {
  return useMutation({
    mutationFn: async (pin: string): Promise<PinValidationResult | null> => {
      if (!organizationId) {
        throw new Error('No organization context');
      }

      const { data, error } = await supabase
        .rpc('validate_user_pin', {
          _organization_id: organizationId,
          _pin: pin,
        });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
  });
}

interface SaveSettingsParams {
  organizationId: string;
  locationId: string | null;
  settings: Record<string, unknown>;
  adminPin: string;
}

/**
 * Hook for saving kiosk settings via edge function with PIN authentication.
 * Bypasses RLS by using service role on the backend after PIN validation.
 */
export function useKioskSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, locationId, settings, adminPin }: SaveSettingsParams) => {
      const response = await supabase.functions.invoke('kiosk-settings', {
        body: {
          organization_id: organizationId,
          location_id: locationId,
          settings,
          admin_pin: adminPin,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to save settings');
      }

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      return data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate kiosk settings queries
      queryClient.invalidateQueries({ 
        queryKey: ['kiosk-settings', variables.organizationId] 
      });
      
      if (variables.locationId) {
        queryClient.invalidateQueries({ 
          queryKey: ['kiosk-settings-location', variables.locationId] 
        });
      }
      
      queryClient.invalidateQueries({
        queryKey: ['kiosk-settings-location'],
        exact: false,
      });
    },
  });
}
