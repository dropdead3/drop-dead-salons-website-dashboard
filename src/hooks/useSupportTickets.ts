import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TicketPriority = Database['public']['Enums']['ticket_priority'];
type TicketStatus = Database['public']['Enums']['ticket_status'];

interface SupportTicket {
  id: string;
  title: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
}

export function useSupportTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async (): Promise<SupportTicket[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select('id, title, description, priority, status, created_at, updated_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async (ticketData: CreateTicketData) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          created_by: user.id,
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority,
          status: 'open' as TicketStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Support ticket submitted successfully');
    },
    onError: (error) => {
      console.error('Failed to submit ticket:', error);
      toast.error('Failed to submit support ticket');
    },
  });

  const submitTicket = async (data: CreateTicketData): Promise<boolean> => {
    try {
      await submitMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  return {
    tickets,
    isLoading,
    isSubmitting: submitMutation.isPending,
    submitTicket,
  };
}
