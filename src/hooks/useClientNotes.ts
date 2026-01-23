import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ClientNote {
  id: string;
  client_id: string;
  user_id: string;
  note: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string | null;
    full_name: string;
    photo_url: string | null;
  };
}

export function useClientNotes(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('client_notes')
        .select(`
          *,
          employee_profiles!client_notes_user_id_fkey(
            display_name,
            full_name,
            photo_url
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((note: any) => ({
        ...note,
        author: note.employee_profiles,
      })) as ClientNote[];
    },
    enabled: !!clientId && !!user,
  });
}

export function useAddClientNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ clientId, note, isPrivate }: { clientId: string; note: string; isPrivate: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('client_notes')
        .insert({
          client_id: clientId,
          user_id: user.id,
          note,
          is_private: isPrivate,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', variables.clientId] });
      toast.success('Note added');
    },
    onError: (error) => {
      toast.error('Failed to add note: ' + error.message);
    },
  });
}

export function useDeleteClientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, clientId }: { noteId: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return { clientId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', data.clientId] });
      toast.success('Note deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete note: ' + error.message);
    },
  });
}
