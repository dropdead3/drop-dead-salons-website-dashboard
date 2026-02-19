import { useMemo, useEffect } from 'react';
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandStatement } from "@/components/home/BrandStatement";
import { ExtensionsSection } from "@/components/home/ExtensionsSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { PopularServices } from "@/components/home/PopularServices";
import { NewClientSection } from "@/components/home/NewClientSection";
import { LocationsSection } from "@/components/home/LocationsSection";
import { StylistsSection } from "@/components/home/StylistsSection";
import { GallerySection } from "@/components/home/GallerySection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { FAQSection } from "@/components/home/FAQSection";
import { BrandsSection } from "@/components/home/BrandsSection";
import { DrinkMenuSection } from "@/components/home/DrinkMenuSection";
import { CustomSectionRenderer } from "@/components/home/CustomSectionRenderer";
import { useWebsiteSections, getEnabledSections, isBuiltinSection, type BuiltinSectionType, type CustomSectionType } from "@/hooks/useWebsiteSections";
import React from 'react';

// Map built-in section types to their components
const BUILTIN_COMPONENTS: Record<BuiltinSectionType, React.ReactNode> = {
  hero: <HeroSection />,
  brand_statement: <BrandStatement />,
  testimonials: <TestimonialSection />,
  services_preview: <ServicesPreview />,
  popular_services: <PopularServices />,
  gallery: <GallerySection />,
  new_client: <NewClientSection />,
  stylists: <StylistsSection />,
  locations: <LocationsSection />,
  faq: <FAQSection />,
  extensions: <ExtensionsSection />,
  brands: <BrandsSection />,
  drink_menu: <DrinkMenuSection />,
};

const Index = () => {
  const { data: sectionsConfig } = useWebsiteSections();

  const orderedSections = useMemo(() => {
    return getEnabledSections(sectionsConfig);
  }, [sectionsConfig]);

  // Listen for postMessage from parent (Website Editor) for scroll & highlight
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'PREVIEW_SCROLL_TO_SECTION') {
        const el = document.getElementById(`section-${msg.sectionId}`);
        if (el) el.scrollIntoView({ behavior: msg.behavior ?? 'smooth', block: 'start' });
      }

      if (msg.type === 'PREVIEW_HIGHLIGHT_SECTION') {
        const el = document.getElementById(`section-${msg.sectionId}`);
        if (el) {
          el.classList.add('preview-highlight');
          setTimeout(() => el.classList.remove('preview-highlight'), 1000);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <Layout>
      <SEO 
        title="Premier Hair Salon in Mesa & Gilbert, Arizona"
        description="Drop Dead Salon is the Phoenix Valley's premier destination for expert hair color, extensions, cutting & styling. Serving Mesa, Gilbert, Chandler, Scottsdale, and the entire East Valley. Book your transformation today."
        type="local_business"
      />
      {orderedSections.map((section) => (
        <div id={`section-${section.id}`} key={section.id}>
          {isBuiltinSection(section.type)
            ? BUILTIN_COMPONENTS[section.type]
            : <CustomSectionRenderer sectionId={section.id} sectionType={section.type as CustomSectionType} />
          }
        </div>
      ))}
    </Layout>
  );
};

export default Index;
