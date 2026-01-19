import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface ImpersonationLog {
  id: string;
  admin_user_id: string;
  action: 'start_role' | 'start_user' | 'end' | 'switch_role' | 'switch_user';
  target_role: string | null;
  target_user_id: string | null;
  target_user_name: string | null;
  session_id: string;
  created_at: string;
  metadata: Json | null;
}

export interface ImpersonationLogWithAdmin extends ImpersonationLog {
  admin_name?: string;
  admin_photo?: string;
}

// Fetch impersonation logs (super admins only)
export function useImpersonationLogs(limit = 50) {
  return useQuery({
    queryKey: ['impersonation-logs', limit],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('impersonation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch admin profiles for the logs
      const adminIds = [...new Set((logs || []).map(log => log.admin_user_id))];
      
      if (adminIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, photo_url')
        .in('user_id', adminIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      return (logs || []).map(log => ({
        ...log,
        admin_name: profileMap.get(log.admin_user_id)?.display_name || 
                    profileMap.get(log.admin_user_id)?.full_name || 'Unknown',
        admin_photo: profileMap.get(log.admin_user_id)?.photo_url,
      })) as ImpersonationLogWithAdmin[];
    },
  });
}

// Log an impersonation action
export function useLogImpersonation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      targetRole,
      targetUserId,
      targetUserName,
      sessionId,
      metadata,
    }: {
      action: ImpersonationLog['action'];
      targetRole?: string | null;
      targetUserId?: string | null;
      targetUserName?: string | null;
      sessionId?: string;
      metadata?: Json;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('impersonation_logs')
        .insert([{
          admin_user_id: user.id,
          action,
          target_role: targetRole ?? null,
          target_user_id: targetUserId ?? null,
          target_user_name: targetUserName ?? null,
          session_id: sessionId,
          metadata: metadata ?? null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impersonation-logs'] });
    },
  });
}
