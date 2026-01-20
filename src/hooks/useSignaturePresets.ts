import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface SignatureConfig {
  showImage?: boolean;
  imageUrl: string;
  imageSize?: number;
  imageShape?: 'circle' | 'square';
  layout: 'horizontal-left' | 'horizontal-right' | 'stacked';
  name: string;
  title: string;
  showPhone?: boolean;
  phone?: string;
  showEmail?: boolean;
  email?: string;
  indent?: number;
  nameColor?: string;
  titleColor?: string;
  contactColor?: string;
}

export interface SignaturePreset {
  id: string;
  name: string;
  config: SignatureConfig;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export const useSignaturePresets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['signature-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signature_presets')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as unknown as SignaturePreset[];
    },
    enabled: !!user,
  });

  const createPreset = useMutation({
    mutationFn: async ({ name, config }: { name: string; config: SignatureConfig }) => {
      const { data, error } = await supabase
        .from('signature_presets')
        .insert([{
          name,
          config: config as unknown as Json,
          created_by: user?.id || '',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-presets'] });
      toast.success('Signature preset saved');
    },
    onError: (error) => {
      toast.error('Failed to save preset: ' + error.message);
    },
  });

  const updatePreset = useMutation({
    mutationFn: async ({ id, name, config }: { id: string; name: string; config: SignatureConfig }) => {
      const { data, error } = await supabase
        .from('signature_presets')
        .update({
          name,
          config: config as unknown as Json,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-presets'] });
      toast.success('Signature preset updated');
    },
    onError: (error) => {
      toast.error('Failed to update preset: ' + error.message);
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('signature_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature-presets'] });
      toast.success('Signature preset deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete preset: ' + error.message);
    },
  });

  return {
    presets,
    isLoading,
    createPreset,
    updatePreset,
    deletePreset,
  };
};
