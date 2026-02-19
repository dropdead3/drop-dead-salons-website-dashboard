import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Built-in section types (have dedicated editor components)
export const BUILTIN_SECTION_TYPES = [
  'hero', 'brand_statement', 'testimonials', 'services_preview',
  'popular_services', 'gallery', 'new_client', 'stylists',
  'locations', 'faq', 'extensions', 'brands', 'drink_menu',
] as const;

export type BuiltinSectionType = typeof BUILTIN_SECTION_TYPES[number];

// Custom section types users can add
export const CUSTOM_SECTION_TYPES = [
  'rich_text', 'image_text', 'video', 'custom_cta', 'spacer',
] as const;

export type CustomSectionType = typeof CUSTOM_SECTION_TYPES[number];

export type SectionType = BuiltinSectionType | CustomSectionType;

export interface SectionConfig {
  id: string;
  type: SectionType;
  label: string;
  description: string;
  enabled: boolean;
  order: number;
  deletable: boolean;
}

export interface WebsiteSectionsConfig {
  homepage: SectionConfig[];
}

// Labels for custom section type picker
export const CUSTOM_TYPE_INFO: Record<CustomSectionType, { label: string; description: string }> = {
  rich_text: { label: 'Rich Text Block', description: 'Heading and body text with alignment controls' },
  image_text: { label: 'Image + Text', description: 'Side-by-side image and text layout with CTA' },
  video: { label: 'Video Embed', description: 'YouTube or Vimeo embedded video section' },
  custom_cta: { label: 'Call to Action', description: 'Banner with heading, text, and button' },
  spacer: { label: 'Spacer / Divider', description: 'Visual spacing or divider line' },
};

// Section display names for built-in sections
export const SECTION_LABELS: Record<BuiltinSectionType, string> = {
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

// Section descriptions for built-in sections
export const SECTION_DESCRIPTIONS: Record<BuiltinSectionType, string> = {
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

// Legacy record format for migration
interface LegacyHomepageSections {
  [key: string]: { enabled: boolean; order: number };
}

interface LegacyWebsiteSectionsConfig {
  homepage: LegacyHomepageSections;
}

// Default sections in new array format
const DEFAULT_SECTIONS: WebsiteSectionsConfig = {
  homepage: BUILTIN_SECTION_TYPES.map((type, index) => ({
    id: type,
    type,
    label: SECTION_LABELS[type],
    description: SECTION_DESCRIPTIONS[type],
    enabled: true,
    order: index + 1,
    deletable: false,
  })),
};

// Migrate old record format to new array format
function migrateFromRecord(legacy: LegacyWebsiteSectionsConfig): WebsiteSectionsConfig {
  const entries = Object.entries(legacy.homepage);
  return {
    homepage: entries
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key, config]) => {
        const builtinType = key as BuiltinSectionType;
        const isBuiltin = BUILTIN_SECTION_TYPES.includes(builtinType);
        return {
          id: key,
          type: isBuiltin ? builtinType : (key as SectionType),
          label: isBuiltin ? SECTION_LABELS[builtinType] : key,
          description: isBuiltin ? SECTION_DESCRIPTIONS[builtinType] : '',
          enabled: config.enabled,
          order: config.order,
          deletable: !isBuiltin,
        };
      }),
  };
}

function isLegacyFormat(data: unknown): data is LegacyWebsiteSectionsConfig {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (!d.homepage || typeof d.homepage !== 'object') return false;
  return !Array.isArray(d.homepage);
}

export function useWebsiteSections() {
  const queryClient = useQueryClient();

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

      // Auto-migrate legacy record format
      if (isLegacyFormat(data.value)) {
        const migrated = migrateFromRecord(data.value as LegacyWebsiteSectionsConfig);
        // Save migrated format back (fire-and-forget)
        const { data: { user } } = await supabase.auth.getUser();
        supabase
          .from('site_settings')
          .update({ value: migrated as never, updated_by: user?.id })
          .eq('id', 'website_sections')
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['site-settings', 'website_sections'] });
          });
        return migrated;
      }

      return data.value as unknown as WebsiteSectionsConfig;
    },
  });
}

export function useUpdateWebsiteSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: WebsiteSectionsConfig) => {
      const { data: { user } } = await supabase.auth.getUser();

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
            updated_by: user?.id,
          })
          .eq('id', 'website_sections');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({
            id: 'website_sections',
            value: value as never,
            updated_by: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', 'website_sections'] });
    },
  });
}

// Helper to get ordered sections
export function getOrderedSections(config: WebsiteSectionsConfig | null | undefined): SectionConfig[] {
  if (!config) return DEFAULT_SECTIONS.homepage;
  return [...config.homepage].sort((a, b) => a.order - b.order);
}

// Helper to get only enabled sections in order
export function getEnabledSections(config: WebsiteSectionsConfig | null | undefined): SectionConfig[] {
  return getOrderedSections(config).filter(s => s.enabled);
}

// Check if a section type is built-in
export function isBuiltinSection(type: string): type is BuiltinSectionType {
  return BUILTIN_SECTION_TYPES.includes(type as BuiltinSectionType);
}

// Generate a unique ID for custom sections
export function generateSectionId(): string {
  return `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
