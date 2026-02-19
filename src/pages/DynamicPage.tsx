import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/SEO';
import { useWebsitePages, getPageBySlug } from '@/hooks/useWebsitePages';
import { isBuiltinSection, type BuiltinSectionType, type CustomSectionType } from '@/hooks/useWebsiteSections';
import { CustomSectionRenderer } from '@/components/home/CustomSectionRenderer';
import { SectionStyleWrapper } from '@/components/home/SectionStyleWrapper';
import { HeroSection } from '@/components/home/HeroSection';
import { BrandStatement } from '@/components/home/BrandStatement';
import { ExtensionsSection } from '@/components/home/ExtensionsSection';
import { ServicesPreview } from '@/components/home/ServicesPreview';
import { PopularServices } from '@/components/home/PopularServices';
import { NewClientSection } from '@/components/home/NewClientSection';
import { LocationsSection } from '@/components/home/LocationsSection';
import { StylistsSection } from '@/components/home/StylistsSection';
import { GallerySection } from '@/components/home/GallerySection';
import { TestimonialSection } from '@/components/home/TestimonialSection';
import { FAQSection } from '@/components/home/FAQSection';
import { BrandsSection } from '@/components/home/BrandsSection';
import { DrinkMenuSection } from '@/components/home/DrinkMenuSection';
import React from 'react';

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

export default function DynamicPage() {
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const { data: pagesConfig, isLoading } = useWebsitePages();

  const page = useMemo(() => {
    return getPageBySlug(pagesConfig, pageSlug || '');
  }, [pagesConfig, pageSlug]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!page) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold mb-2">404</h1>
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  const enabledSections = [...page.sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <Layout>
      <SEO
        title={page.seo_title || page.title}
        description={page.seo_description}
      />
      {enabledSections.map(section => (
        <SectionStyleWrapper key={section.id} styleOverrides={section.style_overrides}>
          <div id={`section-${section.id}`}>
            {isBuiltinSection(section.type)
              ? BUILTIN_COMPONENTS[section.type]
              : <CustomSectionRenderer sectionId={section.id} sectionType={section.type as CustomSectionType} />
            }
          </div>
        </SectionStyleWrapper>
      ))}
    </Layout>
  );
}
