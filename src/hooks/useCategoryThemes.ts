import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getContrastingTextColor } from './useServiceCategoryColors';

export interface ServiceCategoryTheme {
  id: string;
  name: string;
  description: string | null;
  colors: Record<string, string>;
  is_default: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all themes
export function useServiceCategoryThemes() {
  return useQuery({
    queryKey: ['service-category-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_category_themes' as any)
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return (data || []) as unknown as ServiceCategoryTheme[];
    },
  });
}

// Apply a theme to all categories
export function useApplyCategoryTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (theme: ServiceCategoryTheme) => {
      // Get all existing categories
      const { data: categories, error: fetchError } = await supabase
        .from('service_category_colors')
        .select('id, category_name');
      
      if (fetchError) throw fetchError;
      if (!categories) return;

      // Update each category with the theme color
      const updates = categories.map(async (category) => {
        const colorHex = theme.colors[category.category_name];
        if (!colorHex) return; // Skip if theme doesn't have this category

        const isGradient = colorHex.startsWith('gradient:');
        const textColorHex = isGradient ? '#1f2937' : getContrastingTextColor(colorHex);

        return supabase
          .from('service_category_colors')
          .update({
            color_hex: colorHex,
            text_color_hex: textColorHex,
            updated_at: new Date().toISOString(),
          })
          .eq('id', category.id);
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-category-colors'] });
    },
  });
}

// Save current colors as a custom theme
export function useSaveAsCustomTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      // Get current category colors
      const { data: categories, error: fetchError } = await supabase
        .from('service_category_colors')
        .select('category_name, color_hex');
      
      if (fetchError) throw fetchError;
      if (!categories) throw new Error('No categories found');

      // Build colors object
      const colors: Record<string, string> = {};
      categories.forEach((cat) => {
        colors[cat.category_name] = cat.color_hex;
      });

      // Insert new theme
      const { error: insertError } = await supabase
        .from('service_category_themes' as any)
        .insert({
          name,
          description: description || null,
          colors,
          is_custom: true,
          is_default: false,
        });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-category-themes'] });
    },
  });
}

// Delete a custom theme
export function useDeleteCategoryTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase
        .from('service_category_themes' as any)
        .delete()
        .eq('id', themeId)
        .eq('is_custom', true); // Only allow deleting custom themes
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-category-themes'] });
    },
  });
}
