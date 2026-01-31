import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BoothRenterProfile {
  id: string;
  user_id: string;
  organization_id: string;
  business_name: string | null;
  business_license_number: string | null;
  license_state: string | null;
  ein_number: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  status: 'pending' | 'active' | 'inactive' | 'terminated';
  onboarding_complete: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  full_name?: string;
  display_name?: string;
  email?: string;
  photo_url?: string | null;
  active_contract?: {
    rent_amount: number;
    rent_frequency: string;
    due_day_of_month: number | null;
    due_day_of_week: number | null;
  } | null;
}

export interface CreateBoothRenterData {
  user_id: string;
  organization_id: string;
  business_name?: string;
  business_license_number?: string;
  license_state?: string;
  ein_number?: string;
  billing_email?: string;
  billing_phone?: string;
  billing_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  start_date?: string;
}

export function useBoothRenters(organizationId?: string) {
  return useQuery({
    queryKey: ['booth-renters', organizationId],
    queryFn: async () => {
      // Get booth renter profiles
      const { data: renters, error } = await supabase
        .from('booth_renter_profiles' as any)
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user IDs and fetch employee profiles
      const userIds = (renters || []).map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, email, photo_url')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      // Fetch active contracts for each renter
      const renterIds = (renters || []).map((r: any) => r.id);
      const { data: contracts } = await supabase
        .from('booth_rental_contracts' as any)
        .select('booth_renter_id, rent_amount, rent_frequency, due_day_of_month, due_day_of_week')
        .in('booth_renter_id', renterIds)
        .eq('status', 'active');

      const contractMap = new Map((contracts || []).map((c: any) => [c.booth_renter_id, c]));

      return (renters || []).map((renter: any) => {
        const profile = profileMap.get(renter.user_id);
        return {
          ...renter,
          full_name: profile?.full_name,
          display_name: profile?.display_name,
          email: profile?.email,
          photo_url: profile?.photo_url,
          active_contract: contractMap.get(renter.id) || null,
        };
      }) as BoothRenterProfile[];
    },
    enabled: !!organizationId,
  });
}

export function useBoothRenter(renterId: string | undefined) {
  return useQuery({
    queryKey: ['booth-renter', renterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booth_renter_profiles' as any)
        .select('*')
        .eq('id', renterId!)
        .single();

      if (error) throw error;

      // Fetch employee profile
      const { data: profile } = await supabase
        .from('employee_profiles')
        .select('full_name, display_name, email, photo_url')
        .eq('user_id', (data as any).user_id)
        .single();

      return {
        ...(data as any),
        full_name: profile?.full_name,
        display_name: profile?.display_name,
        email: profile?.email,
        photo_url: profile?.photo_url,
      } as BoothRenterProfile;
    },
    enabled: !!renterId,
  });
}

export function useCreateBoothRenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBoothRenterData) => {
      // First assign the booth_renter role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user_id, role: 'booth_renter' as any });

      if (roleError && roleError.code !== '23505') throw roleError;

      // Create the booth renter profile
      const { data: profile, error } = await supabase
        .from('booth_renter_profiles' as any)
        .insert({
          user_id: data.user_id,
          organization_id: data.organization_id,
          business_name: data.business_name,
          business_license_number: data.business_license_number,
          license_state: data.license_state,
          ein_number: data.ein_number,
          billing_email: data.billing_email,
          billing_phone: data.billing_phone,
          billing_address: data.billing_address,
          start_date: data.start_date,
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booth-renters'] });
      toast.success('Booth renter profile created');
    },
    onError: (error) => {
      toast.error('Failed to create booth renter', { description: error.message });
    },
  });
}

export function useUpdateBoothRenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<BoothRenterProfile> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('booth_renter_profiles' as any)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['booth-renters'] });
      queryClient.invalidateQueries({ queryKey: ['booth-renter', variables.id] });
      toast.success('Booth renter updated');
    },
    onError: (error) => {
      toast.error('Failed to update booth renter', { description: error.message });
    },
  });
}

export function useDeleteBoothRenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('booth_renter_profiles' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booth-renters'] });
      toast.success('Booth renter removed');
    },
    onError: (error) => {
      toast.error('Failed to remove booth renter', { description: error.message });
    },
  });
}
