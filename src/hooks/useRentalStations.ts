import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RentalStation {
  id: string;
  organization_id: string;
  location_id: string;
  station_name: string;
  station_number: number | null;
  station_type: 'chair' | 'booth' | 'suite' | 'room';
  is_available: boolean;
  amenities: string[] | null;
  monthly_rate: number | null;
  weekly_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  current_assignment?: StationAssignment | null;
}

export interface StationAssignment {
  id: string;
  station_id: string;
  booth_renter_id: string;
  assigned_date: string;
  end_date: string | null;
  is_active: boolean;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  renter_name?: string;
  renter_business_name?: string;
}

export interface CreateStationData {
  organization_id: string;
  location_id: string;
  station_name: string;
  station_number?: number;
  station_type?: 'chair' | 'booth' | 'suite' | 'room';
  monthly_rate?: number;
  weekly_rate?: number;
  amenities?: string[];
  notes?: string;
}

export interface AssignStationData {
  station_id: string;
  booth_renter_id: string;
  assigned_date?: string;
  end_date?: string;
  notes?: string;
}

export function useRentalStations(organizationId: string | undefined, locationId?: string) {
  return useQuery({
    queryKey: ['rental-stations', organizationId, locationId],
    queryFn: async () => {
      let query = supabase
        .from('rental_stations' as any)
        .select('*')
        .eq('organization_id', organizationId!)
        .order('station_number', { ascending: true });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data: stations, error } = await query;
      if (error) throw error;

      // Fetch active assignments
      const stationIds = (stations || []).map((s: any) => s.id);
      const { data: assignments } = await supabase
        .from('station_assignments' as any)
        .select('*')
        .in('station_id', stationIds)
        .eq('is_active', true);

      // Fetch renter names
      const renterIds = [...new Set((assignments || []).map((a: any) => a.booth_renter_id))];
      const { data: renterProfiles } = await supabase
        .from('booth_renter_profiles' as any)
        .select('id, business_name, user_id')
        .in('id', renterIds);

      const userIds = (renterProfiles || []).map((p: any) => p.user_id);
      const { data: empProfiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name')
        .in('user_id', userIds);

      const empMap = new Map((empProfiles || []).map(e => [e.user_id, e]));
      const renterMap = new Map((renterProfiles || []).map((p: any) => {
        const emp = empMap.get(p.user_id);
        return [p.id, { business_name: p.business_name, name: emp?.display_name || emp?.full_name }];
      }));

      const assignmentMap = new Map((assignments || []).map((a: any) => {
        const renter = renterMap.get(a.booth_renter_id);
        return [a.station_id, { ...a, renter_name: renter?.name, renter_business_name: renter?.business_name }];
      }));

      return (stations || []).map((station: any) => ({
        ...station,
        current_assignment: assignmentMap.get(station.id) || null,
      })) as RentalStation[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStationData) => {
      const { data: station, error } = await supabase
        .from('rental_stations' as any)
        .insert(data as any)
        .select()
        .single();

      if (error) throw error;
      return station;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-stations'] });
      toast.success('Station created');
    },
    onError: (error) => {
      toast.error('Failed to create station', { description: error.message });
    },
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RentalStation> & { id: string }) => {
      const { data: station, error } = await supabase
        .from('rental_stations' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return station;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-stations'] });
      toast.success('Station updated');
    },
    onError: (error) => {
      toast.error('Failed to update station', { description: error.message });
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stationId: string) => {
      const { error } = await supabase
        .from('rental_stations' as any)
        .delete()
        .eq('id', stationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-stations'] });
      toast.success('Station deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete station', { description: error.message });
    },
  });
}

export function useAssignStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignStationData) => {
      // End any existing active assignment
      await supabase
        .from('station_assignments' as any)
        .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] } as any)
        .eq('station_id', data.station_id)
        .eq('is_active', true);

      // Create new assignment
      const { data: assignment, error } = await supabase
        .from('station_assignments' as any)
        .insert({
          ...data,
          assigned_date: data.assigned_date || new Date().toISOString().split('T')[0],
          is_active: true,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Update station availability
      await supabase
        .from('rental_stations' as any)
        .update({ is_available: false } as any)
        .eq('id', data.station_id);

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-stations'] });
      queryClient.invalidateQueries({ queryKey: ['station-assignments'] });
      toast.success('Station assigned');
    },
    onError: (error) => {
      toast.error('Failed to assign station', { description: error.message });
    },
  });
}

export function useUnassignStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stationId: string) => {
      // End active assignment
      await supabase
        .from('station_assignments' as any)
        .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] } as any)
        .eq('station_id', stationId)
        .eq('is_active', true);

      // Update station availability
      await supabase
        .from('rental_stations' as any)
        .update({ is_available: true } as any)
        .eq('id', stationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-stations'] });
      queryClient.invalidateQueries({ queryKey: ['station-assignments'] });
      toast.success('Station unassigned');
    },
    onError: (error) => {
      toast.error('Failed to unassign station', { description: error.message });
    },
  });
}

export function useStationAssignmentHistory(stationId: string | undefined) {
  return useQuery({
    queryKey: ['station-assignment-history', stationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_assignments' as any)
        .select('*')
        .eq('station_id', stationId!)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      return (data as unknown) as StationAssignment[];
    },
    enabled: !!stationId,
  });
}
