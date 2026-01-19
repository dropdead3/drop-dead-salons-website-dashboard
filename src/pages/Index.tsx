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

const Index = () => {
  return (
    <Layout>
      <SEO 
        title="Premier Hair Salon in Mesa & Gilbert, Arizona"
        description="Drop Dead Salon is the Phoenix Valley's premier destination for expert hair color, extensions, cutting & styling. Serving Mesa, Gilbert, Chandler, Scottsdale, and the entire East Valley. Book your transformation today."
        type="local_business"
      />
      <HeroSection />
      <BrandStatement />
      {/* Social proof early for trust */}
      <TestimonialSection />
      <ServicesPreview />
      <GallerySection />
      {/* Primary conversion CTA */}
      <NewClientSection />
      {/* Gradient transition from light to grey */}
      <div 
        className="h-16 sm:h-24 md:h-32 lg:h-40 -mt-1"
        style={{ 
          background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--background)) 10%, hsl(var(--secondary)) 100%)' 
        }}
      />
      {/* Build trust with team */}
      <StylistsSection />
      <LocationsSection />
      {/* FAQ to overcome objections */}
      <FAQSection />
      {/* Specialty services */}
      <ExtensionsSection />
      <BrandsSection />
      <DrinkMenuSection />
    </Layout>
  );
};

export default Index;
