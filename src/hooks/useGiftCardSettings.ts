import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GiftCardSettings {
  id: string;
  organization_id: string;
  card_background_color: string;
  card_text_color: string;
  card_accent_color: string;
  card_logo_url: string | null;
  print_template: 'elegant' | 'modern' | 'minimal';
  include_qr_code: boolean;
  include_terms: boolean;
  terms_text: string | null;
  default_expiration_months: number;
  suggested_amounts: number[];
  created_at: string;
  updated_at: string;
}

export function useGiftCardSettings(organizationId?: string) {
  return useQuery({
    queryKey: ['gift-card-settings', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_card_settings' as any)
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      
      // Return defaults if no settings exist
      if (!data) {
        return {
          organization_id: organizationId,
          card_background_color: '#1a1a1a',
          card_text_color: '#ffffff',
          card_accent_color: '#d4af37',
          card_logo_url: null,
          print_template: 'elegant' as const,
          include_qr_code: true,
          include_terms: true,
          terms_text: 'Valid at all locations. No cash value. Cannot be replaced if lost or stolen.',
          default_expiration_months: 12,
          suggested_amounts: [25, 50, 100, 150, 200],
        } as GiftCardSettings;
      }
      
      return data as unknown as GiftCardSettings;
    },
    enabled: !!organizationId,
  });
}

export function useUpdateGiftCardSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      settings 
    }: { 
      organizationId: string; 
      settings: Partial<GiftCardSettings> 
    }) => {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('gift_card_settings' as any)
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('gift_card_settings' as any)
          .update({ ...settings, updated_at: new Date().toISOString() } as any)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('gift_card_settings' as any)
          .insert({ organization_id: organizationId, ...settings } as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gift-card-settings', variables.organizationId] });
      toast.success('Gift card design saved');
    },
    onError: (error) => {
      toast.error('Failed to save design: ' + error.message);
    },
  });
}
