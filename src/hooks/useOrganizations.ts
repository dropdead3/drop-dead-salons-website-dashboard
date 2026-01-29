import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define types locally since the DB types haven't synced yet
export interface Organization {
  id: string;
  name: string;
  legal_name: string | null;
  slug: string;
  status: 'pending' | 'active' | 'suspended' | 'churned';
  onboarding_stage: 'new' | 'importing' | 'training' | 'live';
  subscription_tier: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  source_software: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  activated_at: string | null;
  updated_at: string;
}

export interface OrganizationInsert {
  name: string;
  slug: string;
  legal_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  source_software?: string | null;
  subscription_tier?: string;
  logo_url?: string | null;
  settings?: Record<string, unknown>;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations' as never)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Organization[];
    },
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('organizations' as never)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as Organization;
    },
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (org: OrganizationInsert) => {
      const { data, error } = await supabase
        .from('organizations' as never)
        .insert(org as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create organization', {
        description: error.message,
      });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Organization> & { id: string }) => {
      const { data, error } = await supabase
        .from('organizations' as never)
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Organization;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', data.id] });
      toast.success('Organization updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update organization', {
        description: error.message,
      });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations' as never)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete organization', {
        description: error.message,
      });
    },
  });
}

export interface OrganizationWithStats extends Organization {
  locationCount: number;
  adminCount: number;
  importCount: number;
  completedImports: number;
}

export function useOrganizationWithStats(id: string | undefined) {
  return useQuery({
    queryKey: ['organization-stats', id],
    queryFn: async (): Promise<OrganizationWithStats | null> => {
      if (!id) return null;

      const { data: orgData, error: orgError } = await supabase
        .from('organizations' as never)
        .select('*')
        .eq('id', id)
        .single();

      if (orgError) throw orgError;

      const org = orgData as unknown as Organization;

      // Return with placeholder counts - these will work once types sync
      return {
        ...org,
        locationCount: 0,
        adminCount: 0,
        importCount: 0,
        completedImports: 0,
      };
    },
    enabled: !!id,
  });
}
