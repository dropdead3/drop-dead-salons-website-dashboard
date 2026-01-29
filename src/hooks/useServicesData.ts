import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Service {
  id: string;
  external_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
  price: number | null;
  is_active: boolean | null;
  requires_qualification: boolean | null;
  allow_same_day_booking: boolean | null;
  lead_time_days: number | null;
  location_id: string | null;
  import_source: string | null;
  imported_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Main services hook using the normalized services table
 * This replaces phorest_services queries
 */
export function useServicesData(locationId?: string) {
  return useQuery({
    queryKey: ['services-data', locationId],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Service[];
    },
  });
}

/**
 * Get services grouped by category
 */
export function useServicesByCategory(locationId?: string) {
  const { data: services, ...rest } = useServicesData(locationId);

  const grouped = services?.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return { data: grouped, services, ...rest };
}

/**
 * Get all services across all locations
 */
export function useAllServicesData() {
  return useQuery({
    queryKey: ['services-data-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data as Service[];
    },
  });
}

/**
 * Get all services grouped by category (deduped by name)
 */
export function useAllServicesByCategory() {
  const { data: services, ...rest } = useAllServicesData();

  const grouped = services?.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) acc[category] = [];
    
    // Check if we already have this service name in this category
    const existingService = acc[category].find(s => s.name === service.name);
    if (!existingService) {
      acc[category].push(service);
    }
    
    return acc;
  }, {} as Record<string, Service[]>);

  return { data: grouped, services, ...rest };
}

/**
 * Get a single service by ID
 */
export function useService(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();
      
      if (error) throw error;
      return data as Service;
    },
    enabled: !!serviceId,
  });
}

/**
 * Create a new service
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Partial<Service>) => {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: service.name!,
          description: service.description,
          category: service.category,
          duration_minutes: service.duration_minutes,
          price: service.price,
          is_active: service.is_active ?? true,
          requires_qualification: service.requires_qualification ?? false,
          allow_same_day_booking: service.allow_same_day_booking ?? true,
          lead_time_days: service.lead_time_days ?? 0,
          location_id: service.location_id,
          import_source: 'manual',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-data'] });
      toast.success('Service created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create service: ' + error.message);
    },
  });
}

/**
 * Update a service
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services-data'] });
      queryClient.invalidateQueries({ queryKey: ['service', data.id] });
      toast.success('Service updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update service: ' + error.message);
    },
  });
}

/**
 * Delete/deactivate a service
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-data'] });
      toast.success('Service deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete service: ' + error.message);
    },
  });
}

/**
 * Get which locations offer a specific service (by name)
 */
export function useServiceLocations(serviceName: string) {
  return useQuery({
    queryKey: ['service-locations', serviceName],
    queryFn: async () => {
      const { data: services, error } = await supabase
        .from('services')
        .select('location_id')
        .eq('is_active', true)
        .eq('name', serviceName);
      
      if (error) throw error;
      
      // Get unique location IDs
      const locationIds = [...new Set(services?.map(s => s.location_id).filter(Boolean) || [])];
      
      if (locationIds.length === 0) return [];
      
      // Get location details
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .in('id', locationIds);
      
      return locations || [];
    },
    enabled: !!serviceName,
  });
}

/**
 * Get service categories
 */
export function useServiceCategories(locationId?: string) {
  return useQuery({
    queryKey: ['service-categories', locationId],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Get unique categories
      const categories = [...new Set(data?.map(s => s.category).filter(Boolean) || [])];
      return categories.sort();
    },
  });
}
