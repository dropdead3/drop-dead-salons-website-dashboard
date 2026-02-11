import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFavoriteOrganizations() {
  return useQuery({
    queryKey: ['platform-favorite-organizations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('platform_favorite_organizations' as any)
        .select('organization_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data as any[]).map((d: any) => d.organization_id as string);
    },
  });
}

export function useToggleFavoriteOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, isFavorited }: { organizationId: string; isFavorited: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from('platform_favorite_organizations' as any)
          .delete()
          .eq('user_id', user.id)
          .eq('organization_id', organizationId);
        if (error) throw error;
      } else {
        // Add favorite
        const { error } = await supabase
          .from('platform_favorite_organizations' as any)
          .insert({ user_id: user.id, organization_id: organizationId });
        if (error) throw error;
      }
    },
    onMutate: async ({ organizationId, isFavorited }) => {
      await queryClient.cancelQueries({ queryKey: ['platform-favorite-organizations'] });
      const previous = queryClient.getQueryData<string[]>(['platform-favorite-organizations']) || [];

      queryClient.setQueryData<string[]>(
        ['platform-favorite-organizations'],
        isFavorited
          ? previous.filter((id) => id !== organizationId)
          : [...previous, organizationId]
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['platform-favorite-organizations'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-favorite-organizations'] });
    },
  });
}
