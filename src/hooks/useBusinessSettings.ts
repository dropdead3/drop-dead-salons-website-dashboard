import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessSettings {
  id: string;
  business_name: string;
  legal_name: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  mailing_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  ein: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data as BusinessSettings;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}

export function useBusinessName() {
  const { data } = useBusinessSettings();
  return data?.business_name || 'Drop Dead';
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<BusinessSettings, 'id' | 'created_at' | 'updated_at'>>) => {
      // Get existing settings first
      const { data: existing } = await supabase
        .from('business_settings')
        .select('id')
        .single();

      if (!existing) {
        throw new Error('Business settings not found');
      }

      const { data, error } = await supabase
        .from('business_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as BusinessSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast.success('Business settings updated');
    },
    onError: (error) => {
      console.error('Failed to update business settings:', error);
      toast.error('Failed to update business settings');
    },
  });
}
