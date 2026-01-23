import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceCategoryColor {
  id: string;
  category_name: string;
  color_hex: string;
  text_color_hex: string;
  created_at: string;
  updated_at: string;
}

// Calculate contrasting text color based on background luminance
export function getContrastingTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance using sRGB formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, white text for dark backgrounds
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

// Generate 2-letter abbreviation from category name
export function getCategoryAbbreviation(categoryName: string): string {
  const words = categoryName.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return categoryName.slice(0, 2).toUpperCase();
}

// Fetch all category colors from database
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

// Update a single category color
export function useUpdateCategoryColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      categoryId, 
      colorHex 
    }: { 
      categoryId: string; 
      colorHex: string;
    }) => {
      const textColorHex = getContrastingTextColor(colorHex);
      
      const { error } = await supabase
        .from('service_category_colors')
        .update({ 
          color_hex: colorHex,
          text_color_hex: textColorHex,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-category-colors'] });
    },
  });
}

// Sync new categories from phorest_services table
export function useSyncServiceCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get unique categories from phorest_services
      const { data: services, error: servicesError } = await supabase
        .from('phorest_services')
        .select('category')
        .eq('is_active', true);
      
      if (servicesError) throw servicesError;
      
      // Get existing categories
      const { data: existingColors, error: colorsError } = await supabase
        .from('service_category_colors')
        .select('category_name');
      
      if (colorsError) throw colorsError;
      
      const existingNames = new Set(existingColors?.map(c => c.category_name) || []);
      const uniqueCategories = [...new Set(services?.map(s => s.category).filter(Boolean) || [])];
      
      // Find new categories that need to be added
      const newCategories = uniqueCategories.filter(cat => cat && !existingNames.has(cat));
      
      if (newCategories.length > 0) {
        // Default color palette for new categories
        const defaultColors = [
          '#60a5fa', '#f472b6', '#facc15', '#10b981', '#a78bfa',
          '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#8b5cf6',
        ];
        
        const newRecords = newCategories.map((categoryName, index) => {
          const colorHex = defaultColors[index % defaultColors.length];
          return {
            category_name: categoryName,
            color_hex: colorHex,
            text_color_hex: getContrastingTextColor(colorHex),
          };
        });
        
        const { error: insertError } = await supabase
          .from('service_category_colors')
          .insert(newRecords);
        
        if (insertError) throw insertError;
      }
      
      return { added: newCategories.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-category-colors'] });
    },
  });
}

// Helper hook to get colors as a map for easy lookup
export function useServiceCategoryColorsMap() {
  const { data: colors, ...rest } = useServiceCategoryColors();
  
  const colorMap = colors?.reduce((acc, color) => {
    acc[color.category_name.toLowerCase()] = {
      bg: color.color_hex,
      text: color.text_color_hex,
      abbr: getCategoryAbbreviation(color.category_name),
    };
    return acc;
  }, {} as Record<string, { bg: string; text: string; abbr: string }>) || {};
  
  return { colorMap, colors, ...rest };
}
