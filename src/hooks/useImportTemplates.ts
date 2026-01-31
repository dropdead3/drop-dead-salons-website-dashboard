import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FieldMapping {
  sourceField: string;
  targetColumn: string;
}

export interface Transformations {
  dateFormat?: string;
  phoneFormat?: string;
  normalizeNames?: boolean;
}

export interface ImportTemplate {
  id: string;
  source_system: string;
  entity_type: string;
  field_mappings: FieldMapping[];
  transformations: Transformations;
  is_default: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useImportTemplates(sourceSystem?: string, entityType?: string) {
  return useQuery({
    queryKey: ['import-templates', sourceSystem, entityType],
    queryFn: async () => {
      let query = supabase
        .from('platform_import_templates')
        .select('*')
        .order('source_system')
        .order('entity_type');

      if (sourceSystem) {
        query = query.eq('source_system', sourceSystem);
      }
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        field_mappings: (item.field_mappings || []) as unknown as FieldMapping[],
        transformations: (item.transformations || {}) as unknown as Transformations,
        organization_id: item.organization_id,
        created_by: item.created_by,
      })) as ImportTemplate[];
    },
  });
}

export function useImportTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['import-template', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('platform_import_templates')
        .select('*')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        field_mappings: (data.field_mappings || []) as unknown as FieldMapping[],
        transformations: (data.transformations || {}) as unknown as Transformations,
      } as ImportTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<ImportTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('platform_import_templates')
        .insert({
          ...template,
          field_mappings: template.field_mappings as unknown as never,
          transformations: template.transformations as unknown as never,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-templates'] });
      toast.success('Import template created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create template: ' + error.message);
    },
  });
}

export function useUpdateImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImportTemplate> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.field_mappings) {
        updateData.field_mappings = updates.field_mappings as unknown as never;
      }
      if (updates.transformations) {
        updateData.transformations = updates.transformations as unknown as never;
      }

      const { data, error } = await supabase
        .from('platform_import_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['import-templates'] });
      queryClient.invalidateQueries({ queryKey: ['import-template', data.id] });
      toast.success('Template updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update template: ' + error.message);
    },
  });
}

export function useDeleteImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_import_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-templates'] });
      toast.success('Template deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete template: ' + error.message);
    },
  });
}
