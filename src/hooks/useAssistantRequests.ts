import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SalonService {
  id: string;
  name: string;
  duration_minutes: number;
  category: string | null;
}

export interface AssistantRequest {
  id: string;
  stylist_id: string;
  assistant_id: string | null;
  service_id: string;
  client_name: string;
  request_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  created_at: string;
  salon_services?: SalonService;
  stylist_profile?: { full_name: string; display_name: string | null } | null;
  assistant_profile?: { full_name: string; display_name: string | null } | null;
}

export function useSalonServices() {
  return useQuery({
    queryKey: ['salon-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salon_services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as SalonService[];
    },
  });
}

export function useAssistantRequests(filter: 'stylist' | 'assistant' | 'all' = 'all') {
  const { user, roles } = useAuth();

  return useQuery({
    queryKey: ['assistant-requests', filter, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('assistant_requests')
        .select(`
          *,
          salon_services (id, name, duration_minutes, category)
        `)
        .order('request_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Filter based on role
      if (filter === 'stylist' && user) {
        query = query.eq('stylist_id', user.id);
      } else if (filter === 'assistant' && user) {
        query = query.eq('assistant_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Cast and return with type assertion
      return (data || []) as AssistantRequest[];
    },
    enabled: !!user,
  });
}

export function useCreateAssistantRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      service_id: string;
      client_name: string;
      request_date: string;
      start_time: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get service duration
      const { data: service, error: serviceError } = await supabase
        .from('salon_services')
        .select('duration_minutes')
        .eq('id', data.service_id)
        .single();

      if (serviceError) throw serviceError;

      // Calculate end time based on service duration
      const [hours, minutes] = data.start_time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + service.duration_minutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const end_time = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;

      // Create the request
      const { data: request, error: insertError } = await supabase
        .from('assistant_requests')
        .insert({
          stylist_id: user.id,
          service_id: data.service_id,
          client_name: data.client_name,
          request_date: data.request_date,
          start_time: `${data.start_time}:00`,
          end_time,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to auto-assign
      const { data: assignResult, error: assignError } = await supabase.functions.invoke('assign-assistant', {
        body: { request_id: request.id }
      });

      if (assignError) {
        console.error('Assignment error:', assignError);
        // Don't throw - request was created, assignment just failed
      }

      return { request, assignResult };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['assistant-requests'] });
      if (result.assignResult?.assigned) {
        toast.success(`Request submitted and assigned to ${result.assignResult.assistant_name || 'an assistant'}!`);
      } else {
        toast.success('Request submitted! Awaiting assistant assignment.');
      }
    },
    onError: (error) => {
      console.error('Failed to create request:', error);
      toast.error('Failed to submit request');
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'completed' | 'cancelled' }) => {
      const { error } = await supabase
        .from('assistant_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-requests'] });
      toast.success('Request updated');
    },
    onError: () => {
      toast.error('Failed to update request');
    },
  });
}