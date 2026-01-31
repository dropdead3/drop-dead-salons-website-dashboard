import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from './useProducts';

interface LookupResult {
  product: Product | null;
  matches: Product[];
  matchType: 'barcode' | 'sku' | 'name' | 'none';
}

export function useProductLookup() {
  return useMutation({
    mutationFn: async (query: string): Promise<LookupResult> => {
      const trimmedQuery = query.trim();
      
      if (!trimmedQuery) {
        return { product: null, matches: [], matchType: 'none' };
      }

      // Try exact barcode match first (most common for scanners)
      let { data: barcodeMatch } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', trimmedQuery)
        .eq('is_active', true)
        .maybeSingle();

      if (barcodeMatch) {
        return { 
          product: barcodeMatch as Product, 
          matches: [barcodeMatch as Product], 
          matchType: 'barcode' 
        };
      }

      // Try exact SKU match (case-insensitive)
      let { data: skuMatch } = await supabase
        .from('products')
        .select('*')
        .ilike('sku', trimmedQuery)
        .eq('is_active', true)
        .maybeSingle();

      if (skuMatch) {
        return { 
          product: skuMatch as Product, 
          matches: [skuMatch as Product], 
          matchType: 'sku' 
        };
      }

      // Fuzzy name search
      const { data: nameMatches } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${trimmedQuery}%`)
        .eq('is_active', true)
        .order('name')
        .limit(10);

      if (nameMatches && nameMatches.length > 0) {
        return { 
          product: nameMatches.length === 1 ? nameMatches[0] as Product : null,
          matches: nameMatches as Product[], 
          matchType: 'name' 
        };
      }

      return { product: null, matches: [], matchType: 'none' };
    },
  });
}
