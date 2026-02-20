import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ServiceAddon } from './useServiceAddons';

export interface AddonAssignment {
  id: string;
  organization_id: string;
  addon_id: string;
  target_type: 'category' | 'service';
  target_category_id: string | null;
  target_service_id: string | null;
  display_order: number;
  created_at: string;
  /** Joined from service_addons */
  addon?: ServiceAddon;
}

/** Fetch all addon assignments for an org, joining the addon details */
export function useAddonAssignments(organizationId?: string) {
  return useQuery({
    queryKey: ['addon-assignments', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_addon_assignments')
        .select('*, addon:service_addons(*)')
        .eq('organization_id', organizationId!)
        .order('display_order');
      if (error) throw error;
      return (data as any[]).map(row => ({
        ...row,
        addon: row.addon as ServiceAddon,
      })) as AddonAssignment[];
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Build lookup maps from assignments for the booking wizard */
export function useAddonAssignmentMaps(organizationId?: string) {
  const { data: assignments = [], ...rest } = useAddonAssignments(organizationId);

  // Map: categoryId → ServiceAddon[]
  const byCategoryId: Record<string, ServiceAddon[]> = {};
  // Map: serviceId → ServiceAddon[]
  const byServiceId: Record<string, ServiceAddon[]> = {};

  assignments.forEach(a => {
    if (!a.addon || !a.addon.is_active) return;
    if (a.target_type === 'category' && a.target_category_id) {
      if (!byCategoryId[a.target_category_id]) byCategoryId[a.target_category_id] = [];
      byCategoryId[a.target_category_id].push(a.addon);
    }
    if (a.target_type === 'service' && a.target_service_id) {
      if (!byServiceId[a.target_service_id]) byServiceId[a.target_service_id] = [];
      byServiceId[a.target_service_id].push(a.addon);
    }
  });

  return { byCategoryId, byServiceId, assignments, ...rest };
}

export function useCreateAddonAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      organization_id: string;
      addon_id: string;
      target_type: 'category' | 'service';
      target_category_id?: string | null;
      target_service_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('service_addon_assignments')
        .insert(payload)
        .select('*, addon:service_addons(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['addon-assignments', v.organization_id] });
      toast.success('Add-on assigned');
    },
    onError: (err: Error) => toast.error('Failed to assign: ' + err.message),
  });
}

export function useDeleteAddonAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from('service_addon_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { organizationId };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['addon-assignments', r.organizationId] });
      toast.success('Assignment removed');
    },
    onError: (err: Error) => toast.error('Failed to remove: ' + err.message),
  });
}
