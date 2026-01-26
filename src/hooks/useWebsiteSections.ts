import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SectionConfig {
  enabled: boolean;
  order: number;
}

export interface HomepageSections {
  hero: SectionConfig;
  brand_statement: SectionConfig;
  testimonials: SectionConfig;
  services_preview: SectionConfig;
  popular_services: SectionConfig;
  gallery: SectionConfig;
  new_client: SectionConfig;
  stylists: SectionConfig;
  locations: SectionConfig;
  faq: SectionConfig;
  extensions: SectionConfig;
  brands: SectionConfig;
  drink_menu: SectionConfig;
}

export interface WebsiteSectionsConfig {
  homepage: HomepageSections;
}

// Section display names for the UI
export const SECTION_LABELS: Record<keyof HomepageSections, string> = {
  hero: 'Hero Section',
  brand_statement: 'Brand Statement',
  testimonials: 'Testimonials',
  services_preview: 'Services Preview',
  popular_services: 'Popular Services',
  gallery: 'Gallery',
  new_client: 'New Client CTA',
  stylists: 'Meet Our Stylists',
  locations: 'Locations',
  faq: 'FAQ',
  extensions: 'Extensions Spotlight',
  brands: 'Partner Brands',
  drink_menu: 'Drink Menu',
};

// Section descriptions
export const SECTION_DESCRIPTIONS: Record<keyof HomepageSections, string> = {
  hero: 'Main hero banner with rotating headlines and CTAs',
  brand_statement: 'Brand identity section with typewriter effect',
  testimonials: '5-star reviews carousel',
  services_preview: 'Overview of service categories',
  popular_services: 'Featured popular services',
  gallery: 'Before/after transformation gallery',
  new_client: 'New client conversion CTA with benefits',
  stylists: 'Team showcase with stylist cards',
  locations: 'Salon location information and maps',
  faq: 'Frequently asked questions accordion',
  extensions: 'Hand-tied extensions spotlight',
  brands: 'Partner brand logos',
  drink_menu: 'Complimentary drink menu',
};

const DEFAULT_SECTIONS: WebsiteSectionsConfig = {
  homepage: {
    hero: { enabled: true, order: 1 },
    brand_statement: { enabled: true, order: 2 },
    testimonials: { enabled: true, order: 3 },
    services_preview: { enabled: true, order: 4 },
    popular_services: { enabled: true, order: 5 },
    gallery: { enabled: true, order: 6 },
    new_client: { enabled: true, order: 7 },
    stylists: { enabled: true, order: 8 },
    locations: { enabled: true, order: 9 },
    faq: { enabled: true, order: 10 },
    extensions: { enabled: true, order: 11 },
    brands: { enabled: true, order: 12 },
    drink_menu: { enabled: true, order: 13 },
  },
};

export function useWebsiteSections() {
  return useQuery({
    queryKey: ['site-settings', 'website_sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', 'website_sections')
        .maybeSingle();

      if (error) throw error;
      
      if (!data?.value) return DEFAULT_SECTIONS;
      
      return data.value as unknown as WebsiteSectionsConfig;
    },
  });
}

export function useUpdateWebsiteSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: WebsiteSectionsConfig) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to update first
      const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .eq('id', 'website_sections')
        .maybeSingle();

      if (existingData) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            value: value as never,
            updated_by: user?.id 
          })
          .eq('id', 'website_sections');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ 
            id: 'website_sections',
            value: value as never,
            updated_by: user?.id 
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'website_sections'] });
    },
  });
}

// Helper to get ordered and enabled sections
export function getOrderedSections(config: WebsiteSectionsConfig | null | undefined) {
  if (!config) return Object.entries(DEFAULT_SECTIONS.homepage);
  
  return Object.entries(config.homepage)
    .sort(([, a], [, b]) => a.order - b.order);
}

// Helper to get only enabled sections in order
export function getEnabledSections(config: WebsiteSectionsConfig | null | undefined) {
  return getOrderedSections(config).filter(([, section]) => section.enabled);
}
