import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AppointmentNote {
  id: string;
  phorest_appointment_id: string;
  author_id: string;
  note: string;
  is_private: boolean;
  created_at: string;
  author?: {
    display_name: string | null;
    full_name: string;
    photo_url: string | null;
  };
}

export function useAppointmentNotes(appointmentId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['appointment-notes', appointmentId],
    enabled: !!appointmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_notes')
        .select(`
          *,
          author:employee_profiles!appointment_notes_author_id_fkey(
            display_name,
            full_name,
            photo_url
          )
        `)
        .eq('phorest_appointment_id', appointmentId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AppointmentNote[];
    },
  });

  const addNote = useMutation({
    mutationFn: async ({ note, isPrivate = false }: { note: string; isPrivate?: boolean }) => {
      if (!appointmentId || !user?.id) throw new Error('Missing required data');
      
      const { data, error } = await supabase
        .from('appointment_notes')
        .insert({
          phorest_appointment_id: appointmentId,
          author_id: user.id,
          note,
          is_private: isPrivate,
        })
        .select(`
          *,
          author:employee_profiles!appointment_notes_author_id_fkey(
            display_name,
            full_name,
            photo_url
          )
        `)
        .single();
      
      if (error) throw error;
      return data as AppointmentNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-notes', appointmentId] });
      toast.success('Note added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add note', { description: error.message });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('appointment_notes')
        .delete()
        .eq('id', noteId)
        .eq('author_id', user!.id); // Can only delete own notes
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-notes', appointmentId] });
      toast.success('Note deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete note', { description: error.message });
    },
  });

  return {
    notes,
    isLoading,
    addNote: addNote.mutate,
    deleteNote: deleteNote.mutate,
    isAdding: addNote.isPending,
  };
}
