import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PhorestStaffMember {
  id: string;
  name: string;
  email?: string;
  branchId?: string;
  branchName?: string;
}

export interface PhorestBranch {
  id: string;
  name: string;
}

export interface PhorestConnectionStatus {
  connected: boolean;
  business?: {
    name: string;
    id: string;
  };
  staff_count?: number;
  staff_list?: PhorestStaffMember[];
  branch_list?: PhorestBranch[];
  error?: string;
}

export interface PhorestStaffMapping {
  id: string;
  user_id: string;
  phorest_staff_id: string;
  phorest_staff_name: string | null;
  phorest_branch_id: string | null;
  phorest_branch_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhorestSyncLog {
  id: string;
  sync_type: string;
  started_at: string;
  completed_at: string | null;
  records_synced: number;
  status: string;
  error_message: string | null;
}

export interface PhorestPerformanceMetrics {
  id: string;
  user_id: string;
  week_start: string;
  new_clients: number;
  retention_rate: number;
  retail_sales: number;
  extension_clients: number;
  total_revenue: number;
  service_count: number;
  average_ticket: number;
  rebooking_rate: number;
}

export function usePhorestConnection() {
  return useQuery({
    queryKey: ['phorest-connection'],
    queryFn: async (): Promise<PhorestConnectionStatus> => {
      const { data, error } = await supabase.functions.invoke('test-phorest-connection');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePhorestSyncLogs() {
  return useQuery({
    queryKey: ['phorest-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as PhorestSyncLog[];
    },
  });
}

export function usePhorestStaffMappings() {
  return useQuery({
    queryKey: ['phorest-staff-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_staff_mapping')
        .select(`
          *,
          employee_profiles:user_id (
            full_name,
            display_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUserPhorestMapping(userId: string | undefined) {
  return useQuery({
    queryKey: ['phorest-user-mapping', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('phorest_staff_mapping')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function usePhorestPerformanceMetrics(weekStart?: string) {
  return useQuery({
    queryKey: ['phorest-performance', weekStart],
    queryFn: async () => {
      let query = supabase
        .from('phorest_performance_metrics')
        .select(`
          *,
          employee_profiles:user_id (
            full_name,
            display_name,
            photo_url
          )
        `)
        .order('total_revenue', { ascending: false });

      if (weekStart) {
        query = query.eq('week_start', weekStart);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function usePhorestAppointments(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['phorest-appointments', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('phorest_appointments')
        .select(`
          *,
          employee_profiles:stylist_user_id (
            full_name,
            display_name
          )
        `)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (dateFrom) {
        query = query.gte('appointment_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('appointment_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!dateFrom || !!dateTo,
  });
}

export function useTriggerPhorestSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (syncType: 'staff' | 'appointments' | 'clients' | 'reports' | 'sales' | 'all') => {
      const { data, error } = await supabase.functions.invoke('sync-phorest-data', {
        body: { sync_type: syncType },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phorest-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['phorest-performance'] });
      queryClient.invalidateQueries({ queryKey: ['phorest-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['phorest-staff-mappings'] });
      
      toast({
        title: 'Sync completed',
        description: 'Phorest data has been synchronized.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync failed',
        description: error.message || 'Failed to sync Phorest data',
        variant: 'destructive',
      });
    },
  });
}

export function useCreateStaffMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mapping: { 
      user_id: string; 
      phorest_staff_id: string; 
      phorest_staff_name?: string;
      phorest_branch_id?: string;
      phorest_branch_name?: string;
    }) => {
      const { data, error } = await supabase
        .from('phorest_staff_mapping')
        .insert(mapping)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phorest-staff-mappings'] });
      toast({
        title: 'Mapping created',
        description: 'Staff member has been linked to Phorest.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create mapping',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteStaffMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mappingId: string) => {
      const { error } = await supabase
        .from('phorest_staff_mapping')
        .delete()
        .eq('id', mappingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phorest-staff-mappings'] });
      toast({
        title: 'Mapping removed',
        description: 'Staff mapping has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete mapping',
        variant: 'destructive',
      });
    },
  });
}

// Check for Phorest appointment conflicts for a given stylist, date, and time range
export function usePhorestConflicts(
  stylistUserId?: string,
  date?: string,
  startTime?: string,
  endTime?: string
) {
  return useQuery({
    queryKey: ['phorest-conflicts', stylistUserId, date, startTime, endTime],
    queryFn: async () => {
      if (!stylistUserId || !date || !startTime) return [];

      // Query for overlapping appointments
      const { data, error } = await supabase
        .from('phorest_appointments')
        .select('*')
        .eq('stylist_user_id', stylistUserId)
        .eq('appointment_date', date)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Filter for time overlaps
      const conflicts = (data || []).filter(apt => {
        const aptStart = apt.start_time;
        const aptEnd = apt.end_time;
        
        // Check if there's any overlap
        // Overlap exists if: startTime < aptEnd AND endTime > aptStart
        const requestEnd = endTime || startTime; // If no end time, assume 1 hour
        return startTime < aptEnd && requestEnd > aptStart;
      });

      return conflicts;
    },
    enabled: !!stylistUserId && !!date && !!startTime,
  });
}

// Get upcoming Phorest appointments for a stylist
export function useStylistPhorestAppointments(stylistUserId?: string, date?: string) {
  return useQuery({
    queryKey: ['phorest-stylist-appointments', stylistUserId, date],
    queryFn: async () => {
      if (!stylistUserId) return [];

      let query = supabase
        .from('phorest_appointments')
        .select('*')
        .eq('stylist_user_id', stylistUserId)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (date) {
        query = query.eq('appointment_date', date);
      } else {
        // Default to today onwards
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('appointment_date', today);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!stylistUserId,
  });
}