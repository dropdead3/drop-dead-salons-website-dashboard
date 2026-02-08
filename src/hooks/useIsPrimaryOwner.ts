import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsPrimaryOwner() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-primary-owner', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('is_primary_owner')
        .eq('user_id', user.id)
        .single();
      
      if (error) return false;
      return data?.is_primary_owner ?? false;
    },
    enabled: !!user?.id,
  });
}
