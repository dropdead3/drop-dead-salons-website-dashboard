import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceCategoryColor {
  id: string;
  category_name: string;
  color_hex: string;
  text_color_hex: string;
  created_at: string;
  updated_at: string;
}

export function useServiceCategoryColors() {
  return useQuery({
    queryKey: ['service-category-colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_category_colors')
        .select('*')
        .order('category_name');
      
      if (error) throw error;
      return data as ServiceCategoryColor[];
    },
  });
}

export function useUpdateServiceCategoryColor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, color_hex, text_color_hex }: { id: string; color_hex: string; text_color_hex: string }) => {
      const { error } = await supabase
        .from('service_category_colors')
        .update({ color_hex, text_color_hex })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-category-colors'] });
      toast.success('Color updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update color', { description: error.message });
    },
  });
}

export function useCreateServiceCategoryColor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ category_name, color_hex, text_color_hex }: { category_name: string; color_hex: string; text_color_hex: string }) => {
      const { error } = await supabase
        .from('service_category_colors')
        .insert({ category_name, color_hex, text_color_hex });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-category-colors'] });
      toast.success('Category color added');
    },
    onError: (error: Error) => {
      toast.error('Failed to add category', { description: error.message });
    },
  });
}

export function useDeleteServiceCategoryColor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_category_colors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-category-colors'] });
      toast.success('Category color removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove category', { description: error.message });
    },
  });
}

// Helper to get color for a service category
export function getServiceColor(colors: ServiceCategoryColor[] | undefined, category: string | null): { bg: string; text: string } {
  if (!colors || !category) return { bg: '#22c55e', text: '#ffffff' };
  
  const match = colors.find(c => 
    category.toLowerCase().includes(c.category_name.toLowerCase()) ||
    c.category_name.toLowerCase().includes(category.toLowerCase())
  );
  
  return match 
    ? { bg: match.color_hex, text: match.text_color_hex }
    : { bg: '#22c55e', text: '#ffffff' };
}
