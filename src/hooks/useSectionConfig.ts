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
      
      return data.value as unknown as T;
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
}

export interface BrandStatementConfig {
  eyebrow: string;
  rotating_words: string[];
  headline_prefix: string;
  headline_suffix: string;
  paragraphs: string[];
}

export interface TestimonialsConfig {
  eyebrow: string;
  headline: string;
  google_review_url: string;
  link_text: string;
}

export interface NewClientConfig {
  headline_prefix: string;
  rotating_words: string[];
  description: string;
  benefits: string[];
  cta_text: string;
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
}

export interface FAQConfig {
  rotating_words: string[];
  intro_paragraphs: string[];
  cta_primary_text: string;
  cta_secondary_text: string;
}

export interface BrandsConfig {
  intro_text: string;
}

export interface DrinkMenuConfig {
  eyebrow: string;
  eyebrow_highlight: string;
  eyebrow_suffix: string;
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
};

export const DEFAULT_TESTIMONIALS: TestimonialsConfig = {
  eyebrow: "Check out 100's of",
  headline: "Our happy 5-star reviews",
  google_review_url: "https://g.page/r/YOUR_GOOGLE_REVIEW_LINK",
  link_text: "Leave a review",
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
};

export const DEFAULT_FAQ: FAQConfig = {
  rotating_words: ["Asked", "Answered"],
  intro_paragraphs: [
    "At Drop Dead Hair Studio, it's simple—Death to Bad Hair is more than a motto; it's our mission.",
    "We're here to deliver bold transformations and flawless results with every visit."
  ],
  cta_primary_text: "See All FAQ's",
  cta_secondary_text: "Salon Policies",
};

export const DEFAULT_BRANDS: BrandsConfig = {
  intro_text: "Our favorite brands we love to use in the salon",
};

export const DEFAULT_DRINK_MENU: DrinkMenuConfig = {
  eyebrow: "Drinks on us. We have an exclusive menu of",
  eyebrow_highlight: "complimentary",
  eyebrow_suffix: "options for your appointment.",
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
