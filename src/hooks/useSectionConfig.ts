import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Generic hook for section configurations
function useSectionConfig<T>(sectionId: string, defaultValue: T) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['site-settings', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('id', sectionId)
        .maybeSingle();

      if (error) throw error;
      if (!data?.value) return defaultValue;
      
      // Merge with defaults to handle new fields
      return { ...defaultValue, ...(data.value as object) } as T;
    },
  });

  const mutation = useMutation({
    mutationFn: async (value: T) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to update first
      const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .eq('id', sectionId)
        .maybeSingle();

      if (existingData) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            value: value as never,
            updated_by: user?.id 
          })
          .eq('id', sectionId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ 
            id: sectionId,
            value: value as never,
            updated_by: user?.id 
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', sectionId] });
    },
  });

  return {
    data: query.data ?? defaultValue,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    update: mutation.mutateAsync,
    error: query.error || mutation.error,
  };
}

// ============================================
// Section Types
// ============================================

export interface HeroConfig {
  eyebrow: string;
  rotating_words: string[];
  subheadline_line1: string;
  subheadline_line2: string;
  cta_new_client: string;
  cta_returning_client: string;
  consultation_note_line1: string;
  consultation_note_line2: string;
  // New advanced options
  animation_start_delay: number;
  word_rotation_interval: number;
  cta_new_client_url: string;
  cta_returning_client_url: string;
  scroll_indicator_text: string;
  show_scroll_indicator: boolean;
}

export interface BrandStatementConfig {
  eyebrow: string;
  rotating_words: string[];
  headline_prefix: string;
  headline_suffix: string;
  paragraphs: string[];
  // New advanced options
  typewriter_speed: number;
  typewriter_pause: number;
  show_typewriter_cursor: boolean;
}

export interface TestimonialsConfig {
  eyebrow: string;
  headline: string;
  google_review_url: string;
  link_text: string;
  // New advanced options
  verified_badge_text: string;
  scroll_animation_duration: number;
  show_star_ratings: boolean;
  max_visible_testimonials: number;
}

export interface NewClientConfig {
  headline_prefix: string;
  rotating_words: string[];
  description: string;
  benefits: string[];
  cta_text: string;
  // New advanced options
  cta_url: string;
  show_benefits_icons: boolean;
}

export interface ExtensionsFeature {
  icon: string;
  title: string;
  description: string;
}

export interface ExtensionsConfig {
  badge_text: string;
  eyebrow: string;
  headline_line1: string;
  headline_line2: string;
  description: string;
  features: ExtensionsFeature[];
  cta_primary: string;
  cta_secondary: string;
  education_link_text: string;
  // New advanced options
  cta_primary_url: string;
  cta_secondary_url: string;
  education_link_url: string;
  floating_badge_text: string;
  floating_badge_description: string;
}

export interface FAQConfig {
  rotating_words: string[];
  intro_paragraphs: string[];
  cta_primary_text: string;
  cta_secondary_text: string;
  // New advanced options
  search_placeholder: string;
  show_search_bar: boolean;
  cta_primary_url: string;
  cta_secondary_url: string;
}

export interface Brand {
  id: string;
  name: string;
  display_text: string;
  logo_url?: string;
}

export interface BrandsConfig {
  intro_text: string;
  // New advanced options
  brands: Brand[];
  marquee_speed: number;
  show_intro_text: boolean;
}

export interface Drink {
  id: string;
  name: string;
  image_url: string;
  ingredients: string;
}

export interface DrinkMenuConfig {
  eyebrow: string;
  eyebrow_highlight: string;
  eyebrow_suffix: string;
  // New advanced options
  drinks: Drink[];
  carousel_speed: number;
  hover_slowdown_factor: number;
}

export interface FooterCTAConfig {
  eyebrow: string;
  headline_line1: string;
  headline_line2: string;
  description: string;
  cta_text: string;
  cta_url: string;
  show_phone_numbers: boolean;
}

export interface LocationsSectionConfig {
  section_eyebrow: string;
  section_title: string;
  card_cta_primary_text: string;
  card_cta_secondary_text: string;
  show_tap_hint: boolean;
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_HERO: HeroConfig = {
  eyebrow: "Hair • Color • Artistry",
  rotating_words: ["Salon", "Extensions", "Salon", "Blonding", "Salon", "Color", "Salon", "Results"],
  subheadline_line1: "Where technical talent meets artistry.",
  subheadline_line2: "We believe in more than just the status quo.",
  cta_new_client: "I am a new client",
  cta_returning_client: "I am a returning client",
  consultation_note_line1: "New clients begin with a $15 consultation",
  consultation_note_line2: "Returning clients are free to book their known services",
  // New defaults
  animation_start_delay: 4,
  word_rotation_interval: 5.5,
  cta_new_client_url: "",
  cta_returning_client_url: "/booking",
  scroll_indicator_text: "Scroll",
  show_scroll_indicator: true,
};

export const DEFAULT_BRAND_STATEMENT: BrandStatementConfig = {
  eyebrow: "Drop Dead is",
  rotating_words: ["Average", "Boring", "Mother's", "Standard", "Typical", "Basic", "Ordinary"],
  headline_prefix: "Not Your",
  headline_suffix: "Salon",
  paragraphs: [
    "Located in the heart of Mesa and Gilbert, Arizona, Drop Dead Salon has become the Phoenix Valley's destination for transformative hair experiences.",
    "Experience an extensive range of innovative treatments meticulously crafted by our artist-led team."
  ],
  // New defaults
  typewriter_speed: 100,
  typewriter_pause: 2,
  show_typewriter_cursor: true,
};

export const DEFAULT_TESTIMONIALS: TestimonialsConfig = {
  eyebrow: "Check out 100's of",
  headline: "Our happy 5-star reviews",
  google_review_url: "https://g.page/r/YOUR_GOOGLE_REVIEW_LINK",
  link_text: "Leave a review",
  // New defaults
  verified_badge_text: "Verified Customer",
  scroll_animation_duration: 60,
  show_star_ratings: true,
  max_visible_testimonials: 20,
};

export const DEFAULT_NEW_CLIENT: NewClientConfig = {
  headline_prefix: "New Clients",
  rotating_words: ["Start Here", "Wanted", "Are The Best"],
  description: "Let's get you matched to a stylist right for you.",
  benefits: [
    "Complimentary Drinks & Snacks",
    "Fun & Friendly Staff",
    "No Judgement, All Are Welcome"
  ],
  cta_text: "Let's Get Started",
  // New defaults
  cta_url: "",
  show_benefits_icons: true,
};

export const DEFAULT_EXTENSIONS: ExtensionsConfig = {
  badge_text: "OUR SIGNATURE",
  eyebrow: "Get the most comfortable extensions with the",
  headline_line1: "Drop Dead",
  headline_line2: "Method",
  description: "The most versatile and comfortable hidden beaded row method available.",
  features: [
    { icon: "Star", title: "Hidden & Seamless", description: "Invisible beaded rows that lay completely flat" },
    { icon: "Award", title: "Maximum Comfort", description: "No tension, no damage" },
    { icon: "MapPin", title: "Nationwide Education", description: "We train salons across the country" },
  ],
  cta_primary: "Book Extension Consult",
  cta_secondary: "Learn More",
  education_link_text: "Are you a stylist wanting to learn our method?",
  // New defaults
  cta_primary_url: "",
  cta_secondary_url: "/extensions",
  education_link_url: "/education",
  floating_badge_text: "Change Your Look Instantly",
  floating_badge_description: "Premium extensions that blend seamlessly",
};

export const DEFAULT_FAQ: FAQConfig = {
  rotating_words: ["Asked", "Answered"],
  intro_paragraphs: [
    "At Drop Dead Hair Studio, it's simple—Death to Bad Hair is more than a motto; it's our mission.",
    "We're here to deliver bold transformations and flawless results with every visit."
  ],
  cta_primary_text: "See All FAQ's",
  cta_secondary_text: "Salon Policies",
  // New defaults
  search_placeholder: "Search questions...",
  show_search_bar: true,
  cta_primary_url: "/faq",
  cta_secondary_url: "/policies",
};

export const DEFAULT_BRANDS: BrandsConfig = {
  intro_text: "Our favorite brands we love to use in the salon",
  // New defaults
  brands: [
    { id: '1', name: "Kevin Murphy", display_text: "KEVIN.MURPHY" },
    { id: '2', name: "AIIR", display_text: "AIIR" },
    { id: '3', name: "Nutrafol", display_text: "NUTRAFOL" },
    { id: '4', name: "Drop Dead Professional", display_text: "DROP DEAD PROFESSIONAL" },
    { id: '5', name: "Danger Jones", display_text: "DANGER JONES" },
  ],
  marquee_speed: 40,
  show_intro_text: true,
};

export const DEFAULT_DRINK_MENU: DrinkMenuConfig = {
  eyebrow: "Drinks on us. We have an exclusive menu of",
  eyebrow_highlight: "complimentary",
  eyebrow_suffix: "options for your appointment.",
  // New defaults
  drinks: [],
  carousel_speed: 30,
  hover_slowdown_factor: 0.1,
};

export const DEFAULT_FOOTER_CTA: FooterCTAConfig = {
  eyebrow: "Ready for Something Different?",
  headline_line1: "Book Your",
  headline_line2: "Consult",
  description: "Every great transformation begins with a conversation. Let's plan yours.",
  cta_text: "Book consult",
  cta_url: "/booking",
  show_phone_numbers: true,
};

export const DEFAULT_LOCATIONS_SECTION: LocationsSectionConfig = {
  section_eyebrow: "Find Us",
  section_title: "Our Locations",
  card_cta_primary_text: "Book consult",
  card_cta_secondary_text: "Check out the stylists",
  show_tap_hint: true,
};

// ============================================
// Typed Hooks
// ============================================

export function useHeroConfig() {
  return useSectionConfig<HeroConfig>('section_hero', DEFAULT_HERO);
}

export function useBrandStatementConfig() {
  return useSectionConfig<BrandStatementConfig>('section_brand_statement', DEFAULT_BRAND_STATEMENT);
}

export function useTestimonialsConfig() {
  return useSectionConfig<TestimonialsConfig>('section_testimonials', DEFAULT_TESTIMONIALS);
}

export function useNewClientConfig() {
  return useSectionConfig<NewClientConfig>('section_new_client', DEFAULT_NEW_CLIENT);
}

export function useExtensionsConfig() {
  return useSectionConfig<ExtensionsConfig>('section_extensions', DEFAULT_EXTENSIONS);
}

export function useFAQConfig() {
  return useSectionConfig<FAQConfig>('section_faq', DEFAULT_FAQ);
}

export function useBrandsConfig() {
  return useSectionConfig<BrandsConfig>('section_brands', DEFAULT_BRANDS);
}

export function useDrinkMenuConfig() {
  return useSectionConfig<DrinkMenuConfig>('section_drink_menu', DEFAULT_DRINK_MENU);
}

export function useFooterCTAConfig() {
  return useSectionConfig<FooterCTAConfig>('section_footer_cta', DEFAULT_FOOTER_CTA);
}

export function useLocationsSectionConfig() {
  return useSectionConfig<LocationsSectionConfig>('section_locations', DEFAULT_LOCATIONS_SECTION);
}
